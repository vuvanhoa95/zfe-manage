import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { QuotationFormData } from '@/types/quotation';

// ============================================================
// ZFENIX Brand Identity — Excel Export Theming
// ============================================================
const ZF = {
  // Core brand colors
  PRIMARY: '053663',       // ZFENIX Navy
  PRIMARY_LIGHT: '0B4A80',
  ACCENT: '178AF3',        // ZFENIX Blue
  ACCENT_LIGHT: '4DA3F6',
  GRAPHITE: '2F343A',
  WHITE: 'FFFFFF',

  // Semantic
  SUCCESS: '10B981',
  WARNING: 'F59E0B',
  ERROR: 'EF4444',

  // Neutral
  GRAY_50: 'F9FAFB',
  GRAY_100: 'F3F4F6',
  GRAY_200: 'E5E7EB',
  GRAY_500: '6B7280',
  GRAY_700: '374151',
  GRAY_900: '111827',

  // Fonts
  FONT_PRIMARY: 'Inter',
  FONT_VN: 'Arial',       // fallback for Vietnamese
} as const;

/** Thin border style for data cells */
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: ZF.GRAY_200 } },
  left: { style: 'thin', color: { argb: ZF.GRAY_200 } },
  bottom: { style: 'thin', color: { argb: ZF.GRAY_200 } },
  right: { style: 'thin', color: { argb: ZF.GRAY_200 } },
};

const HEADER_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: ZF.PRIMARY } },
  left: { style: 'thin', color: { argb: ZF.PRIMARY } },
  bottom: { style: 'thin', color: { argb: ZF.PRIMARY } },
  right: { style: 'thin', color: { argb: ZF.PRIMARY } },
};

// ============================================================
// Shared helpers
// ============================================================
function applyBrandHeader(
  ws: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  colCount: number,
) {
  // Row 1 — Brand banner
  const brandRow = ws.addRow(['ZFENIX']);
  ws.mergeCells(brandRow.number, 1, brandRow.number, colCount);
  const brandCell = brandRow.getCell(1);
  brandCell.font = {
    name: ZF.FONT_PRIMARY,
    size: 18,
    bold: true,
    color: { argb: ZF.WHITE },
  };
  brandCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: ZF.PRIMARY },
  };
  brandCell.alignment = { horizontal: 'left', vertical: 'middle' };
  brandRow.height = 36;

  // Row 2 — Accent sub-banner
  const accentRow = ws.addRow([subtitle]);
  ws.mergeCells(accentRow.number, 1, accentRow.number, colCount);
  const accentCell = accentRow.getCell(1);
  accentCell.font = {
    name: ZF.FONT_PRIMARY,
    size: 10,
    bold: false,
    color: { argb: ZF.WHITE },
  };
  accentCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: ZF.ACCENT },
  };
  accentCell.alignment = { horizontal: 'left', vertical: 'middle' };
  accentRow.height = 22;

  // Row 3 — Title
  const titleRow = ws.addRow([title]);
  ws.mergeCells(titleRow.number, 1, titleRow.number, colCount);
  const titleCell = titleRow.getCell(1);
  titleCell.font = {
    name: ZF.FONT_PRIMARY,
    size: 14,
    bold: true,
    color: { argb: ZF.PRIMARY },
  };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  titleRow.height = 28;

  // Row 4 — spacer
  ws.addRow([]);
}

function applyTableHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = {
      name: ZF.FONT_PRIMARY,
      size: 10,
      bold: true,
      color: { argb: ZF.WHITE },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: ZF.PRIMARY },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = HEADER_BORDER;
  });
  row.height = 26;
}

function applyDataRow(row: ExcelJS.Row, isEven: boolean, isTotal = false) {
  row.eachCell((cell) => {
    cell.font = {
      name: ZF.FONT_VN,
      size: 10,
      bold: isTotal,
      color: { argb: isTotal ? ZF.PRIMARY : ZF.GRAY_900 },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isTotal ? ZF.GRAY_100 : isEven ? ZF.GRAY_50 : ZF.WHITE },
    };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = THIN_BORDER;
  });
}

function applyMetaRow(ws: ExcelJS.Worksheet, label: string, value: string, colCount: number) {
  const row = ws.addRow([label, value]);
  row.getCell(1).font = { name: ZF.FONT_PRIMARY, size: 9, bold: true, color: { argb: ZF.GRAY_500 } };
  row.getCell(2).font = { name: ZF.FONT_VN, size: 9, color: { argb: ZF.GRAY_700 } };
  if (colCount > 2) {
    ws.mergeCells(row.number, 2, row.number, colCount);
  }
}

function applyFooter(ws: ExcelJS.Worksheet, colCount: number) {
  ws.addRow([]);
  const footerRow = ws.addRow([`Xuất bởi ZFENIX Manage — ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`]);
  ws.mergeCells(footerRow.number, 1, footerRow.number, colCount);
  footerRow.getCell(1).font = { name: ZF.FONT_PRIMARY, size: 8, italic: true, color: { argb: ZF.GRAY_500 } };
  footerRow.getCell(1).alignment = { horizontal: 'right' };
}

async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
}

// ============================================================
// 1. Export Pricing / Quotation to Excel (ZFENIX Branded)
// ============================================================
export function exportPricingToExcel(data: QuotationFormData, filename: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ZFENIX Manage';
  wb.created = new Date();

  const ws = wb.addWorksheet('Báo giá', {
    properties: { defaultRowHeight: 20 },
  });

  const COL_COUNT = 6;

  // Brand header
  applyBrandHeader(ws, 'BẢNG BÁO GIÁ', 'Hệ thống Quản lý Báo giá ZFENIX', COL_COUNT);

  // Table headers
  const headerRow = ws.addRow(['TT', 'NỘI DUNG', 'KHỐI LƯỢNG', 'ĐƠN GIÁ', 'THÀNH TIỀN', 'GHI CHÚ']);
  applyTableHeader(headerRow);

  // Data rows
  let rowIndex = 0;
  data.lines.forEach((line) => {
    let lineTotal = 0;
    let qty = 0;

    if (line.priceType === 'area') {
      lineTotal = (data.totalArea || 0) * (line.unitPrice || 0);
      qty = data.totalArea || 0;
    } else if (line.priceType !== 'none') {
      lineTotal = (line.qty || 1) * (line.unitPrice || 0);
      qty = line.qty || 1;
    }

    if (line.isGroupHeader) {
      const row = ws.addRow([line.itemNo, line.title.toUpperCase(), '', '', '', '']);
      row.eachCell((cell) => {
        cell.font = {
          name: ZF.FONT_VN,
          size: 10,
          bold: true,
          color: { argb: ZF.PRIMARY },
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: ZF.GRAY_100 },
        };
        cell.border = THIN_BORDER;
      });
    } else {
      const row = ws.addRow([
        line.itemNo,
        line.title,
        line.priceType === 'none' ? '-' : qty,
        line.priceType === 'none' ? '-' : line.unitPrice,
        line.priceType === 'none' ? '-' : lineTotal,
        line.note || '',
      ]);
      applyDataRow(row, rowIndex % 2 === 0);

      // Format number columns
      if (line.priceType !== 'none') {
        row.getCell(3).numFmt = '#,##0';
        row.getCell(4).numFmt = '#,##0';
        row.getCell(5).numFmt = '#,##0';
      }
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    }
    rowIndex++;
  });

  // Summary section
  ws.addRow([]);

  const totalBeforeVat = data.lines.reduce((sum, line) => {
    if (line.isGroupHeader || line.priceType === 'none') return sum;
    const lineTotal = line.priceType === 'area'
      ? (data.totalArea || 0) * (line.unitPrice || 0)
      : (line.qty || 1) * (line.unitPrice || 0);
    return sum + lineTotal;
  }, 0);

  const vatAmount = totalBeforeVat * data.vatRate;
  const totalAfterVat = totalBeforeVat + vatAmount;

  const summaryRows = [
    ['', 'TỔNG CỘNG (CHƯA VAT)', '', '', totalBeforeVat, ''],
    ['', `VAT (${(data.vatRate * 100).toFixed(0)}%)`, '', '', vatAmount, ''],
    ['', 'TỔNG CỘNG (ĐÃ VAT)', '', '', totalAfterVat, ''],
  ];

  summaryRows.forEach((rowData, i) => {
    const row = ws.addRow(rowData);
    const isGrandTotal = i === 2;
    row.getCell(2).font = {
      name: ZF.FONT_PRIMARY,
      size: isGrandTotal ? 11 : 10,
      bold: true,
      color: { argb: isGrandTotal ? ZF.WHITE : ZF.PRIMARY },
    };
    row.getCell(5).font = {
      name: ZF.FONT_PRIMARY,
      size: isGrandTotal ? 11 : 10,
      bold: true,
      color: { argb: isGrandTotal ? ZF.WHITE : ZF.PRIMARY },
    };
    row.getCell(5).numFmt = '#,##0';
    if (isGrandTotal) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: ZF.PRIMARY },
        };
        cell.font = {
          ...cell.font,
          color: { argb: ZF.WHITE },
        } as Partial<ExcelJS.Font>;
      });
    }
    row.eachCell((cell) => {
      cell.border = THIN_BORDER;
    });
  });

  // Column widths
  ws.columns = [
    { width: 6 },   // TT
    { width: 42 },  // Nội dung
    { width: 14 },  // KL
    { width: 16 },  // Đơn giá
    { width: 16 },  // Thành tiền
    { width: 22 },  // Ghi chú
  ];

  // Footer
  applyFooter(ws, COL_COUNT);

  // Download
  void downloadWorkbook(wb, filename);
}

// ============================================================
// 2. Export Task Report to Excel (ZFENIX Branded)
// ============================================================
export type GroupRow = {
  key: string;
  label: string;
  total: number;
  inProgress: number;
  completed: number;
  overdue: number;
  percentCompleted: number;
};

export type ReportExportData = {
  reportType: 'phase' | 'discipline' | 'assignee';
  reportTitle: string;
  projectName: string;
  groups: GroupRow[];
  datePreset: string;
  statusFilter: string;
  priorityFilter: string;
  notes?: string;
  createdAt: string;
};

export function exportTaskReportToExcel(data: ReportExportData, filename: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ZFENIX Manage';
  wb.created = new Date();

  const sheetName = data.reportType === 'phase'
    ? 'Theo giai đoạn'
    : data.reportType === 'discipline'
      ? 'Theo bộ môn'
      : 'Theo nhân sự';

  const ws = wb.addWorksheet(sheetName, {
    properties: { defaultRowHeight: 20 },
  });

  const COL_COUNT = 6;

  // Brand header
  applyBrandHeader(
    ws,
    data.reportTitle,
    `Dự án: ${data.projectName || 'Dự án'}`,
    COL_COUNT,
  );

  // Metadata
  applyMetaRow(ws, 'Khoảng thời gian:', data.datePreset, COL_COUNT);
  applyMetaRow(ws, 'Trạng thái:', data.statusFilter, COL_COUNT);
  applyMetaRow(ws, 'Mức ưu tiên:', data.priorityFilter, COL_COUNT);
  applyMetaRow(ws, 'Thời điểm tạo:', data.createdAt, COL_COUNT);
  ws.addRow([]);

  // Column label
  const columnLabel = data.reportType === 'phase'
    ? 'Giai đoạn'
    : data.reportType === 'discipline'
      ? 'Bộ môn'
      : 'Nhân sự';

  // Table headers
  const headerRow = ws.addRow([
    columnLabel,
    'Tổng công việc',
    'Đang thực hiện',
    'Hoàn thành',
    'Quá hạn',
    '% hoàn thành',
  ]);
  applyTableHeader(headerRow);

  // Data rows
  data.groups.forEach((group, i) => {
    const row = ws.addRow([
      group.label,
      group.total,
      group.inProgress,
      group.completed,
      group.overdue,
      group.percentCompleted / 100,
    ]);
    applyDataRow(row, i % 2 === 0);

    // Left-align label
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    // Center-align numbers
    [2, 3, 4, 5].forEach((col) => {
      row.getCell(col).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(col).numFmt = '#,##0';
    });
    // Percentage format
    row.getCell(6).numFmt = '0%';
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

    // Color overdue cell red if > 0
    if (group.overdue > 0) {
      row.getCell(5).font = {
        name: ZF.FONT_VN,
        size: 10,
        bold: true,
        color: { argb: ZF.ERROR },
      };
    }
  });

  // Total row
  if (data.groups.length > 0) {
    const total = data.groups.reduce(
      (acc, g) => ({
        total: acc.total + g.total,
        inProgress: acc.inProgress + g.inProgress,
        completed: acc.completed + g.completed,
        overdue: acc.overdue + g.overdue,
      }),
      { total: 0, inProgress: 0, completed: 0, overdue: 0 },
    );
    const totalPercent = total.total > 0 ? total.completed / total.total : 0;

    const totalRow = ws.addRow([
      'TỔNG CỘNG',
      total.total,
      total.inProgress,
      total.completed,
      total.overdue,
      totalPercent,
    ]);
    applyDataRow(totalRow, false, true);

    totalRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    [2, 3, 4, 5].forEach((col) => {
      totalRow.getCell(col).alignment = { horizontal: 'center', vertical: 'middle' };
      totalRow.getCell(col).numFmt = '#,##0';
    });
    totalRow.getCell(6).numFmt = '0%';
    totalRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

    // Grand total accent bar
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: ZF.PRIMARY },
      };
      cell.font = {
        name: ZF.FONT_PRIMARY,
        size: 10,
        bold: true,
        color: { argb: ZF.WHITE },
      };
      cell.border = HEADER_BORDER;
    });
  }

  // Notes
  if (data.notes && data.notes.trim()) {
    ws.addRow([]);
    const noteLabelRow = ws.addRow(['Ghi chú / Nhận xét:']);
    noteLabelRow.getCell(1).font = { name: ZF.FONT_PRIMARY, size: 10, bold: true, color: { argb: ZF.PRIMARY } };
    const noteRow = ws.addRow([data.notes]);
    ws.mergeCells(noteRow.number, 1, noteRow.number, COL_COUNT);
    noteRow.getCell(1).font = { name: ZF.FONT_VN, size: 10, color: { argb: ZF.GRAY_700 } };
    noteRow.getCell(1).alignment = { wrapText: true };
  }

  // Column widths
  ws.columns = [
    { width: 28 },  // Label
    { width: 14 },  // Tổng
    { width: 14 },  // Đang thực hiện
    { width: 14 },  // Hoàn thành
    { width: 14 },  // Quá hạn
    { width: 14 },  // %
  ];

  // Footer
  applyFooter(ws, COL_COUNT);

  // Download
  void downloadWorkbook(wb, filename);
}