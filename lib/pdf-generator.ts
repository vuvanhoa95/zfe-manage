import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { formatVND } from './number-to-words-vn';
import { QuotationWithRelations } from '@/types/quotation';

// Dynamic imports for Vercel compatibility
let puppeteer: any;
let chromium: any;

// Check if running on Vercel
const isVercel = !!(process.env.VERCEL === '1' || process.env.VERCEL_ENV);

async function getPuppeteer() {
  if (!puppeteer) {
    if (isVercel) {
      puppeteer = await import('puppeteer-core');
      chromium = await import('@sparticuz/chromium');
      // Disable graphics mode to reduce memory usage on serverless
      chromium.setGraphicsMode(false);
      // Set chromium path from environment variable if provided (for custom deployments)
      if (process.env.CHROMIUM_PATH) {
        chromium.setHeadlessMode = true;
      }
    } else {
      puppeteer = await import('puppeteer');
    }
  }
  return { puppeteer, chromium };
}

function escapeHtml(value: string) {
  if (!value) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getCompanyLogoDataUri(logoUrl: string | undefined | null): string | null {
  if (!logoUrl) return null;
  if (!logoUrl.startsWith('/')) return null;
  const filepath = join(process.cwd(), 'public', logoUrl);
  if (!existsSync(filepath)) return null;
  const buffer = readFileSync(filepath);
  const ext = logoUrl.split('.').pop()?.toLowerCase();
  const mime =
    ext === 'png' ? 'image/png'
    : ext === 'webp' ? 'image/webp'
    : ext === 'gif' ? 'image/gif'
    : 'image/jpeg';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

export async function generatePdf(data: QuotationWithRelations, company: any) {
  let browser;
  try {
    const { puppeteer: puppeteerLib, chromium: chromiumLib } = await getPuppeteer();

    const localArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--font-render-hinting=none',
      '--single-process',
      '--no-zygote',
    ];

    const launchOptions: any = {
      headless: true,
      args: isVercel && chromiumLib ? [...chromiumLib.args, '--font-render-hinting=none'] : localArgs,
    };

    if (isVercel && chromiumLib) {
      // Use custom path from env if set, otherwise use sparticuz chromium
      launchOptions.executablePath = process.env.CHROMIUM_PATH || await chromiumLib.executablePath();
      console.log('[PDF] Vercel mode, executablePath:', launchOptions.executablePath);
    } else {
      console.log('[PDF] Local mode, using bundled Puppeteer');
    }

    browser = await puppeteerLib.launch(launchOptions);
    const page = await browser.newPage();

    const companyLogoDataUri = getCompanyLogoDataUri(company?.logoUrl);
    const projectSlogan = typeof company?.projectSlogan === 'string' ? company.projectSlogan : '';

    // Tính tổng tiền từ lines
    let totalBeforeVat = 0;
    for (const line of (data.lines as any[])) {
      if (!line.isChargeable) continue;
      if (line.priceType === 'area') {
        totalBeforeVat += ((data as any).totalArea || 0) * (line.unitPrice || 0);
      } else if (line.priceType !== 'none') {
        totalBeforeVat += (line.qty || 1) * (line.unitPrice || 0);
      }
    }
    // Fallback: dùng totalBeforeVat từ DB nếu có
    if (totalBeforeVat === 0 && (data as any).totalBeforeVat) {
      totalBeforeVat = (data as any).totalBeforeVat;
    }
    const vatAmount = totalBeforeVat * ((data.vatRate) || 0.08);
    const totalAfterVat = totalBeforeVat + vatAmount;

    const quotationNo = escapeHtml(data.quotationNo);
    const dateStr = new Date(data.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Báo Giá ${quotationNo}</title>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap" rel="stylesheet">
  <style>
    /* ─── A4 Page Rules ─────────────────────────────────────────── */
    @page {
      size: A4 portrait;
      /* margin: top right bottom left */
      margin: 18mm 18mm 22mm 18mm;
    }
    @page :first { margin-top: 0mm; }

    /* ─── Base ──────────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html {
      width: 210mm;
    }
    body {
      font-family: 'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.55;
      color: #1E293B;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      width: 210mm;
    }

    /* ─── Wrapper — fills the A4 content area ───────────────────── */
    .page {
      padding: 18mm 18mm 0 18mm;
      background: white;
      position: relative;
    }
    /* Trang đầu tự quản lý padding top */
    .page-first { padding-top: 14mm; }

    /* Dot-grid watermark */
    .page::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: radial-gradient(#C8D6E8 0.5px, transparent 0.5px);
      background-size: 18pt 18pt;
      opacity: 0.18;
      pointer-events: none;
      z-index: 0;
    }
    .content { position: relative; z-index: 1; }

    /* ─── Company Header ────────────────────────────────────────── */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 11pt;
      border-bottom: 1.2pt solid #E2E8F0;
      margin-bottom: 16pt;
    }
    .logo-row { display: flex; gap: 10pt; align-items: center; }
    .logo-box {
      width: 40pt; height: 40pt; border-radius: 9pt; flex-shrink: 0;
      background: linear-gradient(135deg, #DBEAFE 0%, #BAE6FD 100%);
      border: 1pt solid #BAE6FD;
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 20pt; color: #053663; overflow: hidden;
    }
    .logo-box img { width: 100%; height: 100%; object-fit: contain; padding: 3pt; }
    .company-name {
      font-size: 13pt; font-weight: 800; text-transform: uppercase;
      letter-spacing: 1pt; color: #053663; line-height: 1.15;
    }
    .company-slogan {
      font-size: 7pt; color: #3B82F6; font-weight: 600;
      text-transform: uppercase; letter-spacing: 1.2pt; font-style: italic; margin-top: 2pt;
    }
    .header-meta {
      text-align: right; font-size: 7.5pt;
      color: #64748B; font-weight: 500; line-height: 1.65;
    }
    .header-meta b { color: #334155; font-weight: 700; }

    /* ─── Document Title ────────────────────────────────────────── */
    .title-block {
      display: flex; justify-content: space-between; align-items: flex-end;
      border-bottom: 2.5pt solid #053663;
      padding-bottom: 12pt; margin-bottom: 20pt;
    }
    .main-title {
      font-size: 20pt; font-weight: 900; color: #053663;
      letter-spacing: -0.3pt; text-transform: uppercase; line-height: 1.1;
    }
    .doc-no {
      font-size: 7.5pt; font-weight: 700; text-transform: uppercase;
      letter-spacing: 1.8pt; color: #94A3B8; margin-top: 5pt;
    }
    .date-block { text-align: right; }
    .date-label {
      font-size: 7pt; font-weight: 800; text-transform: uppercase;
      letter-spacing: 1.2pt; color: #94A3B8;
    }
    .date-value { font-size: 10pt; font-weight: 800; color: #1E293B; margin-top: 2pt; }

    /* ─── Info Grid (Client + Project) ─────────────────────────── */
    .info-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20pt;
      margin-bottom: 20pt;
    }
    .info-label-row { display: flex; align-items: center; gap: 7pt; margin-bottom: 6pt; }
    .dot { width: 5.5pt; height: 5.5pt; background: #F59E0B; border-radius: 50%; flex-shrink: 0; }
    .label-text { font-size: 7pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.3pt; color: #94A3B8; }
    .info-main {
      font-size: 11pt; font-weight: 800; color: #053663; text-transform: uppercase;
      border-left: 2pt solid #E2E8F0; padding-left: 9pt; margin-left: 12pt; line-height: 1.2;
    }
    .info-sub { font-size: 8pt; color: #64748B; font-style: italic; margin-left: 12pt; padding-left: 9pt; margin-top: 2pt; }

    /* ─── Section Blocks ────────────────────────────────────────── */
    .section-block { margin-bottom: 14pt; page-break-inside: avoid; }
    .section-title {
      font-size: 8.5pt; font-weight: 800; text-transform: uppercase;
      letter-spacing: 1.3pt; color: #053663; margin-bottom: 5pt;
      display: flex; align-items: center; gap: 5pt;
    }
    .section-title::before {
      content: ''; display: inline-block; width: 2.5pt; height: 11pt;
      background: #F59E0B; border-radius: 1.2pt; flex-shrink: 0;
    }
    .section-body { font-size: 9pt; color: #334155; white-space: pre-line; line-height: 1.6; padding-left: 7pt; }
    .section-list { font-size: 9pt; color: #334155; padding-left: 22pt; line-height: 1.6; }
    .section-list li { margin-bottom: 2.5pt; }

    /* ─── Pricing Table ─────────────────────────────────────────── */
    .table-wrap { margin-bottom: 14pt; page-break-inside: auto; }
    table {
      width: 100%; border-collapse: collapse; font-size: 8.5pt;
      border-top: 2.5pt solid #053663;
    }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    th {
      background: #F1F5F9; border-bottom: 1pt solid #CBD5E1;
      padding: 7pt 9pt; font-size: 7pt; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.8pt; color: #64748B; text-align: left;
    }
    td { padding: 6.5pt 9pt; border-bottom: 0.5pt solid #F1F5F9; vertical-align: middle; }
    tr { page-break-inside: avoid; }
    .col-c { text-align: center; }
    .col-r { text-align: right; }

    .group-row td { background: #F8FAFC; border-bottom: 0.5pt solid #E2E8F0; }
    .group-title { font-size: 7.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1pt; color: #053663; }
    .item-no { font-weight: 700; color: #CBD5E1; font-size: 7.5pt; }
    .item-title { font-weight: 600; color: #1E293B; font-size: 9.5pt; }
    .item-val { font-weight: 500; color: #64748B; font-size: 8.5pt; }
    .item-unit { font-size: 7pt; font-style: italic; text-transform: uppercase; color: #94A3B8; }
    .item-total { font-weight: 800; color: #053663; font-size: 9.5pt; }
    .item-note { font-size: 7.5pt; color: #94A3B8; font-style: italic; margin-top: 2pt; }

    /* Tfoot */
    .tfoot-row td { background: #F8FAFC; border-bottom: 0.5pt solid #E2E8F0; padding: 5.5pt 9pt; }
    .tfoot-lbl { text-align: right; font-size: 8pt; font-weight: 600; color: #64748B; font-style: italic; }
    .tfoot-val { text-align: right; font-weight: 700; color: #334155; font-size: 9pt; }
    .final-row td { background: #053663; color: #fff; padding: 9pt 9pt; border-bottom: none; }
    .final-lbl { text-align: right; font-size: 8.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5pt; }
    .final-val { text-align: right; font-size: 15pt; font-weight: 900; }

    /* In words */
    .in-words {
      background: #F8FAFC; border: 0.8pt dashed #CBD5E1; border-radius: 7pt;
      padding: 10pt 14pt; display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 18pt; gap: 12pt;
    }
    .in-words-lbl { color: #94A3B8; font-weight: 700; font-style: italic; text-transform: uppercase; letter-spacing: 0.8pt; font-size: 7.5pt; flex-shrink: 0; }
    .in-words-val { color: #1E293B; font-weight: 800; font-style: italic; font-size: 9pt; text-decoration: underline; text-decoration-color: #F59E0B; text-decoration-thickness: 1.2pt; text-align: right; }

    /* ─── Payment Milestones ────────────────────────────────────── */
    .payment-table table { border-top: 2pt solid #0EA5E9; }
    .payment-table th { background: #F0F9FF; color: #0369A1; }

    /* ─── Signatures ────────────────────────────────────────────── */
    .sig-area {
      display: grid; grid-template-columns: 1fr 1fr; gap: 50pt;
      margin-top: 36pt; page-break-inside: avoid;
    }
    .sig-box { text-align: center; }
    .sig-role { font-size: 7.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2pt; color: #94A3B8; margin-bottom: 55pt; }
    .sig-hint { font-size: 7.5pt; color: #94A3B8; font-style: italic; margin-top: 36pt; }
    .sig-title { font-size: 8pt; font-weight: 700; color: #334155; text-transform: uppercase; margin-bottom: 3pt; }
    .sig-name { font-size: 14pt; font-weight: 800; color: #053663; text-decoration: underline; text-decoration-color: #F59E0B; text-decoration-thickness: 1.2pt; }
    .sig-company { font-size: 7.5pt; color: #64748B; margin-top: 3pt; }

    /* ─── Footer bar ────────────────────────────────────────────── */
    .doc-footer {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 24pt; padding-top: 9pt;
      border-top: 0.5pt solid #E2E8F0;
      font-size: 6.5pt; font-weight: 700; text-transform: uppercase;
      letter-spacing: 2pt; color: #CBD5E1;
    }

    /* ─── Page break util ───────────────────────────────────────── */
    .page-break { page-break-before: always; }
    .no-break { page-break-inside: avoid; }
  </style>
</head>
<body>
<div class="page page-first">
<div class="content">

  <!-- ══ HEADER ══════════════════════════════════════════════════ -->
  <div class="doc-header">
    <div class="logo-row">
      <div class="logo-box">
        ${companyLogoDataUri ? `<img alt="Logo" src="${companyLogoDataUri}">` : 'Z'}
      </div>
      <div>
        <div class="company-name">${escapeHtml(company.name)}</div>
        <div class="company-slogan">${escapeHtml(projectSlogan || 'Giải pháp BIM chuyên nghiệp')}</div>
      </div>
    </div>
    <div class="header-meta">
      <div>${escapeHtml(company.address)}</div>
      <div>MST: <b>${escapeHtml(company.taxCode)}</b></div>
      <div><b>${escapeHtml(company.phone)}</b> &nbsp;|&nbsp; ${escapeHtml(String(company.email || ''))}</div>
      ${company.website ? `<div>${escapeHtml(company.website)}</div>` : ''}
    </div>
  </div>

  <!-- ══ TITLE ════════════════════════════════════════════════════ -->
  <div class="title-block">
    <div>
      <div class="main-title">${escapeHtml(data.title || 'BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM')}</div>
      <div class="doc-no">Số báo giá: ${quotationNo}</div>
    </div>
    <div class="date-block">
      <div class="date-label">Ngày phát hành</div>
      <div class="date-value">${escapeHtml(data.location)}, ${dateStr}</div>
    </div>
  </div>

  <!-- ══ INFO GRID ════════════════════════════════════════════════ -->
  <div class="info-grid">
    <div>
      <div class="info-label-row"><div class="dot"></div><span class="label-text">Kính gửi</span></div>
      <div class="info-main">${escapeHtml(data.customer.name)}</div>
      ${data.customer.address ? `<div class="info-sub">${escapeHtml(data.customer.address)}</div>` : ''}
      ${data.customer.taxCode ? `<div class="info-sub">MST: ${escapeHtml(data.customer.taxCode)}</div>` : ''}
    </div>
    <div>
      <div class="info-label-row"><div class="dot"></div><span class="label-text">Công trình</span></div>
      <div class="info-main">${escapeHtml(data.projectName)}</div>
      ${(data as any).totalArea ? `<div class="info-sub">Diện tích: ${((data as any).totalArea).toLocaleString('vi-VN')} m²</div>` : ''}
      ${(data as any).projectItem ? `<div class="info-sub">${escapeHtml((data as any).projectItem)}</div>` : ''}
    </div>
  </div>

  <!-- ══ INTRO ════════════════════════════════════════════════════ -->
  ${(data as any).introText ? `
  <div class="section-block">
    <div class="section-body" style="font-style:italic;color:#475569;">${escapeHtml((data as any).introText)}</div>
  </div>` : ''}

  <!-- ══ SCOPE ════════════════════════════════════════════════════ -->
  ${(data as any).scopeText ? `
  <div class="section-block">
    <div class="section-title">Phạm vi công việc</div>
    <div class="section-body">${escapeHtml((data as any).scopeText)}</div>
  </div>` : ''}

  <!-- ══ DELIVERABLES ═════════════════════════════════════════════ -->
  ${data.deliverablesText ? `
  <div class="section-block">
    <div class="section-title">Sản phẩm bàn giao</div>
    <ul class="section-list">${data.deliverablesText}</ul>
  </div>` : ''}

  <!-- ══ PRICING TABLE ════════════════════════════════════════════ -->
  <div class="table-wrap">
    <div class="section-title" style="margin-bottom:7pt;">Bảng giá dịch vụ</div>
    <table>
      <thead>
        <tr>
          <th style="width:28pt;" class="col-c">TT</th>
          <th style="padding-left:16pt;">Nội dung công việc</th>
          <th style="width:58pt;" class="col-c">Khối lượng</th>
          <th style="width:44pt;" class="col-c">Đơn vị</th>
          <th style="width:88pt;" class="col-r">Đơn giá (VNĐ)</th>
          <th style="width:98pt;" class="col-r">Thành tiền (VNĐ)</th>
        </tr>
      </thead>
      <tbody>
        ${(data.lines as any[]).map((line) => {
          let lineTotal = 0;
          let qtyLabel = line.qty != null ? String(line.qty) : '-';

          if (line.priceType === 'area') {
            lineTotal = ((data as any).totalArea || 0) * (line.unitPrice || 0);
            qtyLabel = ((data as any).totalArea || 0).toLocaleString('vi-VN');
          } else if (line.priceType === 'none' || !line.isChargeable) {
            lineTotal = 0; qtyLabel = '-';
          } else {
            lineTotal = (line.qty || 1) * (line.unitPrice || 0);
          }

          if (line.isGroupHeader) {
            return `<tr class="group-row">
              <td class="col-c item-no">${escapeHtml(line.itemNo || '')}</td>
              <td class="group-title" colspan="5" style="padding-left:16pt;">${escapeHtml(line.title)}</td>
            </tr>`;
          }

          return `<tr>
            <td class="col-c item-no">${escapeHtml(line.itemNo || '')}</td>
            <td class="item-title" style="padding-left:16pt;">
              ${escapeHtml(line.title)}
              ${line.note ? `<div class="item-note">${escapeHtml(line.note)}</div>` : ''}
            </td>
            <td class="col-c item-val">${qtyLabel}</td>
            <td class="col-c item-unit">${escapeHtml(line.unit || '-')}</td>
            <td class="col-r item-val">${(line.priceType === 'none' || !line.isChargeable || !line.unitPrice) ? '-' : formatVND(line.unitPrice)}</td>
            <td class="col-r item-total">${(line.priceType === 'none' || !line.isChargeable) ? '-' : formatVND(lineTotal)}</td>
          </tr>`;
        }).join('')}
      </tbody>
      <tfoot>
        <tr class="tfoot-row">
          <td colspan="5" class="tfoot-lbl">Tổng cộng (chưa VAT):</td>
          <td class="tfoot-val">${formatVND(totalBeforeVat)}</td>
        </tr>
        <tr class="tfoot-row">
          <td colspan="5" class="tfoot-lbl">VAT (${((data.vatRate || 0.08) * 100).toFixed(0)}%):</td>
          <td class="tfoot-val">${formatVND(vatAmount)}</td>
        </tr>
        <tr class="final-row">
          <td colspan="5" class="final-lbl">Tổng cộng (đã VAT):</td>
          <td class="final-val">${formatVND(totalAfterVat)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- ══ IN WORDS ═════════════════════════════════════════════════ -->
  <div class="in-words">
    <span class="in-words-lbl">Bằng chữ:</span>
    <span class="in-words-val">${escapeHtml((data as any).totalInWords || '')}</span>
  </div>

  <!-- ══ SCHEDULE ═════════════════════════════════════════════════ -->
  ${(data as any).scheduleText ? `
  <div class="section-block">
    <div class="section-title">Tiến độ thực hiện</div>
    <div class="section-body">${escapeHtml((data as any).scheduleText)}</div>
  </div>` : ''}

  <!-- ══ PAYMENT MILESTONES ═══════════════════════════════════════ -->
  ${Array.isArray(data.paymentMilestones) && data.paymentMilestones.length > 0 ? `
  <div class="section-block payment-table no-break">
    <div class="section-title">Tiến độ thanh toán</div>
    <table style="margin-top:5pt;">
      <thead>
        <tr>
          <th style="width:32pt;" class="col-c">Đợt</th>
          <th>Nội dung thanh toán</th>
          <th style="width:78pt;" class="col-c">Ngày dự kiến</th>
          <th style="width:54pt;" class="col-c">Tỉ lệ (%)</th>
          <th style="width:96pt;" class="col-r">Giá trị (VNĐ)</th>
        </tr>
      </thead>
      <tbody>
        ${(data.paymentMilestones as any[]).map((m) => {
          const amt = totalAfterVat * ((m.percent || 0) / 100);
          const expDate = m.expectedDate
            ? new Date(m.expectedDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : '—';
          return `<tr>
            <td class="col-c item-no">${m.no}</td>
            <td class="item-val" style="font-weight:600;">
              ${escapeHtml(m.title)}
              ${m.description ? `<div class="item-note">${escapeHtml(m.description)}</div>` : ''}
            </td>
            <td class="col-c item-val" style="font-size:8pt;">${expDate}</td>
            <td class="col-c" style="font-weight:800;color:#0369A1;">${m.percent}%</td>
            <td class="col-r item-total">${formatVND(amt)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <!-- ══ NOTES ════════════════════════════════════════════════════ -->
  ${(data as any).notes ? `
  <div class="section-block no-break">
    <div class="section-title">Ghi chú</div>
    <div class="section-body">${escapeHtml((data as any).notes)}</div>
  </div>` : ''}

  <!-- ══ SIGNATURES ═══════════════════════════════════════════════ -->
  <div class="sig-area">
    <div class="sig-box">
      <div class="sig-role">Đại diện khách hàng</div>
      <div class="sig-hint">(Ký, ghi rõ họ tên và đóng dấu)</div>
    </div>
    <div class="sig-box">
      <div class="sig-role">Đại diện đơn vị triển khai</div>
      <div class="sig-title">${escapeHtml(company.signerTitle || '')}</div>
      <div class="sig-name">${escapeHtml(company.signerName || '')}</div>
      <div class="sig-company">${escapeHtml(company.name)}</div>
    </div>
  </div>

  <!-- ══ FOOTER ═══════════════════════════════════════════════════ -->
  <div class="doc-footer">
    <span>Báo giá số ${quotationNo}</span>
    <span>${escapeHtml(company.name)} &nbsp;·&nbsp; ${escapeHtml(company.phone)}</span>
    <span>Tài liệu điện tử — Không kiểm soát khi in</span>
  </div>

</div>
</div>
</body>
</html>`;

    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30_000,
    });

    // Đợi font Google Fonts load xong
    await page.evaluate(() => document.fonts.ready);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      // Margin hoàn toàn do CSS @page kiểm soát
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      displayHeaderFooter: false,
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    console.error('PDF Generation Error:', error);
    throw new Error(
      error instanceof Error ? `Lỗi tạo PDF: ${error.message}` : 'Lỗi không xác định khi tạo PDF'
    );
  }
}
