import puppeteer from 'puppeteer';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { formatVND } from './number-to-words-vn';
import { QuotationWithRelations } from '@/types/quotation';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getCompanyLogoDataUri(logoUrl: string | undefined | null): string | null {
  if (!logoUrl) return null;
  if (!logoUrl.startsWith('/')) return null; // only support local public assets

  const filepath = join(process.cwd(), 'public', logoUrl);
  if (!existsSync(filepath)) return null;

  const buffer = readFileSync(filepath);
  const ext = logoUrl.split('.').pop()?.toLowerCase();
  const mime =
    ext === 'png'
      ? 'image/png'
      : ext === 'webp'
        ? 'image/webp'
        : ext === 'gif'
          ? 'image/gif'
          : 'image/jpeg';

  return `data:${mime};base64,${buffer.toString('base64')}`;
}

export async function generatePdf(data: QuotationWithRelations, company: any) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const companyLogoDataUri = getCompanyLogoDataUri(company?.logoUrl);
  const projectSlogan = typeof company?.projectSlogan === 'string' ? company.projectSlogan : '';

  // Create HTML content with ZFENIX Executive styling
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap&subset=latin,vietnamese" rel="stylesheet">
        <style>
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
            line-height: 1.5; 
            color: #18181B; 
            margin: 0; 
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          .a4 { 
            width: 210mm; 
            min-height: 297mm;
            margin: 0 auto; 
            padding: 2.5cm 2cm; 
            box-sizing: border-box;
            background: white;
            position: relative;
          }
          .security-grid {
            position: absolute;
            inset: 0;
            opacity: 0.03;
            pointer-events: none;
            background-image: radial-gradient(#000 0.5px, transparent 0.5px);
            background-size: 24px 24px;
          }
          
          /* Header */
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 64px; }
          .logo-box { 
            display: flex; gap: 24px; align-items: center; 
          }
          .logo-icon,
          .logo-img {
            width: 64px; height: 64px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 16px;
            transform: rotate(3deg);
            box-shadow: 0 10px 20px rgba(5, 54, 99, 0.2);
            overflow: hidden;
          }
          .logo-icon {
            background: #053663; color: white;
            font-weight: 900; font-size: 32px;
          }
          .logo-img img { width: 100%; height: 100%; object-fit: contain; background: white; }
          .company-name { font-weight: 800; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; color: #053663; }
          .company-tag { font-size: 10px; font-weight: 700; color: #178AF3; text-transform: uppercase; letter-spacing: 3px; margin-top: 4px; font-style: italic; }
          .header-right { text-align: right; font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; }
          .header-right p { margin: 4px 0; }
          .highlight-text { color: #053663; }

          /* Title Block */
          .title-block { 
            display: flex; justify-content: space-between; align-items: flex-end; 
            border-bottom: 2px solid #053663; padding-bottom: 24px; margin-bottom: 60px; 
          }
          .main-title { font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 900; margin: 0; letter-spacing: -0.5px; color: #053663; text-transform: uppercase; }
          .doc-no { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #CBD5E1; }
          .date-block { text-align: right; }
          .date-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #94A3B8; margin-bottom: 4px; }
          .date-value { font-size: 14px; font-weight: 800; margin: 0; color: #18181B; }

          /* Recipient Grid */
          .recipient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-bottom: 40px; }
          .info-box { }
          .info-label { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
          .dot { width: 6px; height: 6px; background: #EAB308; border-radius: 50%; }
          .label-text { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #94A3B8; }
          .customer-name { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px; margin: 0 0 4px 16px; border-left: 1px solid #F1F5F9; padding-left: 16px; color: #053663; }
          .customer-address { font-size: 12px; font-weight: 500; color: #64748b; font-style: italic; margin-left: 16px; }
          .project-name { font-size: 16px; font-weight: 800; text-transform: uppercase; margin: 0 0 4px 16px; border-left: 1px solid #F1F5F9; padding-left: 16px; color: #334155; }
          .project-area { font-size: 11px; font-weight: 700; color: #178AF3; text-transform: uppercase; letter-spacing: 1px; margin-left: 16px; }

          /* Pricing Table */
          table { width: 100%; border-collapse: collapse; border-top: 4px solid #053663; margin-bottom: 32px; }
          th { background: #F8FAFC; border-bottom: 1px solid #E2E8F0; padding: 20px 16px; text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #94A3B8; }
          td { padding: 16px; font-size: 11px; border-bottom: 1px solid #F1F5F9; }
          .col-center { text-align: center; }
          .col-right { text-align: right; }
          .group-row { background: #F8FAFC; }
          .group-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #053663; }
          .item-no { font-weight: 800; color: #CBD5E1; font-size: 10px; }
          .item-title { font-weight: 700; color: #334155; font-size: 13px; }
          .item-val { font-weight: 700; color: #64748B; }
          .item-total { font-weight: 800; color: #053663; font-size: 13px; }
          
          .tfoot-label { text-align: right; padding: 12px 40px; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; font-style: italic; color: #94A3B8; }
          .final-row { background: #053663; color: white; }
          .final-label { padding: 20px 48px; text-align: right; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; font-size: 12px; }
          .final-value { padding: 20px; text-align: right; font-weight: 800; font-size: 20px; }

          .in-words-box { display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; padding: 24px; border-radius: 16px; border: 1px dashed #E2E8F0; margin-bottom: 32px; }
          .words-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #CBD5E1; font-style: italic; }
          .words-value { font-size: 14px; font-weight: 800; color: #18181B; font-style: italic; text-decoration: underline; text-decoration-color: #FACC15; text-decoration-thickness: 2px; }

          /* Signatures */
          .signature-area { display: grid; grid-template-columns: 1fr 1fr; gap: 120px; margin-top: 80px; }
          .sign-box { text-align: center; position: relative; }
          .sign-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 4px; color: #CBD5E1; margin-bottom: 80px; }
          .seal-bg { position: absolute; top: 110px; left: 50%; transform: translate(-50%, -50%) scale(1.5); opacity: 0.05; }
          .seal-border { width: 120px; height: 120px; border: 8px solid #053663; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 10px; text-align: center; color: #053663; }
          .sign-name { font-size: 24px; font-weight: 800; color: #053663; letter-spacing: -1px; text-decoration: underline; text-decoration-color: #FACC15; text-decoration-thickness: 2px; margin-bottom: 8px; }
          .sign-title { font-size: 10px; font-weight: 800; color: #18181B; text-transform: uppercase; margin-bottom: 64px; }
          
          .footer-note { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 24px; border-top: 1px solid #F8FAFC; font-size: 8px; font-weight: 700; color: #CBD5E1; text-transform: uppercase; letter-spacing: 5px; }

          .section-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #053663;
            margin: 0 0 8px 0;
          }
          .section-block {
            margin-bottom: 20px;
          }
          .section-body {
            font-size: 11px;
            color: #334155;
            white-space: pre-line;
          }
          .section-list {
            font-size: 11px;
            color: #334155;
            padding-left: 18px;
          }
          .section-list li {
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        <div class="a4">
          <div class="security-grid"></div>

          <div class="header">
            <div class="logo-box">
              ${companyLogoDataUri
      ? `<div class="logo-img"><img alt="Logo" src="${companyLogoDataUri}" /></div>`
      : `<div class="logo-icon">Z</div>`}
              <div>
                <div class="company-name">${escapeHtml(company.name)}</div>
                <div class="company-tag">${escapeHtml(projectSlogan || 'Giải pháp BIM chuyên nghiệp')}</div>
              </div>
            </div>
            <div class="header-right">
              <p>${escapeHtml(company.address)}</p>
              <p>MST: ${escapeHtml(company.taxCode)}</p>
              <p><span class="highlight-text">${escapeHtml(company.phone)} | ${escapeHtml(String(company.email || '').toUpperCase())}</span></p>
            </div>
          </div>

          <div class="title-block">
            <div>
              <h1 class="main-title">${escapeHtml(data.title || 'BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM')}</h1>
              <div class="doc-no">Số báo giá: ${escapeHtml(data.quotationNo)}</div>
            </div>
            <div class="date-block">
              <div class="date-label">Ngày phát hành</div>
              <p class="date-value">${escapeHtml(data.location)}, ${new Date(data.date).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          <div class="recipient-grid">
            <div class="info-box">
              <div class="info-label">
                <div class="dot"></div>
                <span class="label-text">Khách hàng</span>
              </div>
              <div class="customer-name">${escapeHtml(data.customer.name)}</div>
              <div class="customer-address">${escapeHtml(data.customer.address || '-')}</div>
            </div>
            <div class="info-box">
              <div class="info-label">
                <div class="dot"></div>
                <span class="label-text">Thông tin dự án</span>
              </div>
              <div class="project-name">${escapeHtml(data.projectName)}</div>
              ${data.totalArea ? `<div class="project-area">Diện tích: ${data.totalArea.toLocaleString('vi-VN')} m²</div>` : ''}
            </div>
          </div>

          ${data.scopeText
      ? `<div class="section-block">
                  <h2 class="section-title">II. Phạm vi công việc</h2>
                  <div class="section-body">${escapeHtml(data.scopeText || '')}</div>
                </div>`
      : ''
    }

          ${data.deliverablesText
      ? `<div class="section-block">
                  <h2 class="section-title">III. Sản phẩm bàn giao</h2>
                  <ul class="section-list" style="list-style-type: disc;" >${data.deliverablesText}</ul>
                </div>`
      : ''
    }

          <table>
            <thead>
              <tr>
                <th style="width: 40px;" class="col-center">TT</th>
                <th style="padding-left: 24px;">Nội dung công việc</th>
                <th style="width: 80px;" class="col-center">Khối lượng</th>
                <th style="width: 60px;" class="col-center">Đơn vị</th>
                <th style="width: 120px;" class="col-right">Đơn giá (VNĐ)</th>
                <th style="width: 140px;" class="col-right">Thành tiền (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              ${data.lines.map((line: any) => {
      let lineTotal = 0;
      let qtyLabel = line.qty?.toString() || '-';

      if (line.priceType === 'area') {
        lineTotal = (data.totalArea || 0) * (line.unitPrice || 0);
        qtyLabel = (data.totalArea || 0).toLocaleString('vi-VN');
      } else if (line.priceType === 'none') {
        lineTotal = 0;
        qtyLabel = '-';
      } else {
        lineTotal = (line.qty || 1) * (line.unitPrice || 0);
      }

      if (line.isGroupHeader) {
        return `
                    <tr class="group-row">
                      <td class="col-center item-no">${line.itemNo || ''}</td>
                      <td class="group-title" colspan="5" style="padding-left: 24px;">${line.title}</td>
                    </tr>
                  `;
      }

      return `
                  <tr>
                    <td class="col-center item-no">${line.itemNo || ''}</td>
                    <td class="item-title" style="padding-left: 24px;">${line.title}</td>
                    <td class="col-center item-val">${qtyLabel}</td>
                    <td class="col-center item-val" style="font-size: 9px; font-style: italic; text-transform: uppercase;">${line.unit || '-'}</td>
                    <td class="col-right item-val">${line.priceType === 'none' || !line.unitPrice ? '-' : formatVND(line.unitPrice)}</td>
                    <td class="col-right item-total">${line.priceType === 'none' ? '-' : formatVND(lineTotal)}</td>
                  </tr>
                `;
    }).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" class="tfoot-label">Tổng cộng (chưa VAT):</td>
                <td class="col-right" style="font-weight: 800; color: #334155;">${formatVND(data.totalBeforeVat)}</td>
              </tr>
              <tr>
                <td colspan="5" class="tfoot-label">VAT (${(data.vatRate * 100).toFixed(0)}%):</td>
                <td class="col-right" style="font-weight: 800; color: #334155;">${formatVND(data.vatAmount)}</td>
              </tr>
              <tr class="final-row">
                <td colspan="5" class="final-label">Tổng cộng (đã VAT):</td>
                <td class="final-value">${formatVND(data.totalAfterVat)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="in-words-box">
            <span class="words-label">Bằng chữ:</span>
            <span class="words-value">${escapeHtml(data.totalInWords || '')}</span>
          </div>

          ${data.scheduleText
      ? `<div class="section-block">
                  <h2 class="section-title">VI. Tiến độ thực hiện</h2>
                  <div class="section-body">${escapeHtml(data.scheduleText || '')}</div>
                </div>`
      : ''
    }

          ${Array.isArray(data.paymentMilestones) && data.paymentMilestones.length
      ? `<div class="section-block">
                  <h2 class="section-title">VII. Tiến độ thanh toán</h2>
                  <table style="margin-top: 8px;">
                    <thead>
                      <tr>
                        <th style="width: 40px;" class="col-center">Đợt</th>
                        <th class="col-center">Nội dung</th>
                        <th style="width: 80px;" class="col-center">% thanh toán</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${data.paymentMilestones
        .map(
          (m: any) => `
                            <tr>
                              <td class="col-center item-no">${m.no}</td>
                              <td class="item-val">${escapeHtml(m.title)}</td>
                              <td class="col-center item-val">${m.percent}%</td>
                            </tr>
                          `,
        )
        .join('')}
                    </tbody>
                  </table>
                </div>`
      : ''
    }

          <div class="signature-area">
            <div class="sign-box">
              <div class="sign-label">ĐẠI DIỆN KHÁCH HÀNG</div>
              <div class="sign-line"></div>
              <div class="sign-hint">(Ký, ghi rõ họ tên và đóng dấu)</div>
            </div>
            <div class="sign-box">
              <div class="sign-label">ĐẠI DIỆN ĐƠN VỊ TRIỂN KHAI</div>
              <div class="seal-bg">
                <div class="seal-border">ZFENIX SOLUTIONS<br/>OFFICIAL DOCUMENT</div>
              </div>
              <div class="sign-title" style="margin-top: 24px;">${company.signerTitle}</div>
              <div class="sign-name">${company.signerName}</div>
              <div class="sign-company">${company.name}</div>
            </div>
          </div>

          <div class="footer-note">
            <span>Báo giá số ${data.quotationNo}</span>
            <span>Tài liệu điện tử - Trang 1</span>
            <span>Không kiểm soát khi in ra</span>
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm',
    },
  });

  await browser.close();
  return pdfBuffer;
}
