import * as XLSX from 'xlsx';
import { QuotationFormData } from '@/types/quotation';

/**
 * Utility to export the pricing table of a quotation to Excel
 */
export function exportPricingToExcel(data: QuotationFormData, filename: string) {
  // 1. Prepare data for the worksheet
  const rows = [];
  
  // Headers
  rows.push(['TT', 'NỘI DUNG', 'KHỐI LƯỢNG', 'ĐƠN GIÁ', 'THÀNH TIỀN', 'GHI CHÚ']);

  // Line items
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
      rows.push([line.itemNo, line.title.toUpperCase(), '', '', '', '']);
    } else {
      rows.push([
        line.itemNo,
        line.title,
        line.priceType === 'none' ? '-' : qty,
        line.priceType === 'none' ? '-' : line.unitPrice,
        line.priceType === 'none' ? '-' : lineTotal,
        line.note || '',
      ]);
    }
  });

  // Empty row before summary
  rows.push([]);

  // Summary
  const totalBeforeVat = data.lines.reduce((sum, line) => {
    if (line.isGroupHeader || line.priceType === 'none') return sum;
    const lineTotal = line.priceType === 'area' 
        ? (data.totalArea || 0) * (line.unitPrice || 0) 
        : (line.qty || 1) * (line.unitPrice || 0);
    return sum + lineTotal;
  }, 0);

  const vatAmount = totalBeforeVat * data.vatRate;
  const totalAfterVat = totalBeforeVat + vatAmount;

  rows.push(['', 'TỔNG CỘNG (CHƯA VAT)', '', '', totalBeforeVat, '']);
  rows.push(['', `VAT (${(data.vatRate * 100).toFixed(0)}%)`, '', '', vatAmount, '']);
  rows.push(['', 'TỔNG CỘNG (ĐÃ VAT)', '', '', totalAfterVat, '']);

  // 2. Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 3. Apply basic column widths
  ws['!cols'] = [
    { wch: 5 },  // TT
    { wch: 40 }, // Nội dung
    { wch: 12 }, // KL
    { wch: 15 }, // Đơn giá
    { wch: 15 }, // Thành tiền
    { wch: 20 }, // Ghi chú
  ];

  // 4. Create workbook and download
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Báo giá');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export task report to Excel
 */
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
  const rows: (string | number)[][] = [];

  // Header: Project name & Report title
  rows.push([data.projectName || 'Dự án']);
  rows.push([data.reportTitle]);
  rows.push([]);

  // Metadata
  rows.push(['Khoảng thời gian:', data.datePreset === 'all' ? 'Tất cả' : data.datePreset === 'thisMonth' ? 'Tháng này' : 'Quý này']);
  rows.push(['Trạng thái:', data.statusFilter === 'ALL' ? 'Tất cả' : data.statusFilter]);
  rows.push(['Mức ưu tiên:', data.priorityFilter === 'ALL' ? 'Tất cả' : data.priorityFilter]);
  rows.push(['Thời điểm tạo:', data.createdAt]);
  rows.push([]);

  // Table headers
  const columnLabel = data.reportType === 'phase' ? 'Giai đoạn' : data.reportType === 'discipline' ? 'Bộ môn' : 'Nhân sự';
  rows.push([columnLabel, 'Tổng công việc', 'Đang thực hiện', 'Hoàn thành', 'Quá hạn', '% hoàn thành']);

  // Table data
  data.groups.forEach((group) => {
    rows.push([
      group.label,
      group.total,
      group.inProgress,
      group.completed,
      group.overdue,
      `${group.percentCompleted}%`,
    ]);
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
    const totalPercent = total.total > 0 ? Math.round((total.completed / total.total) * 100) : 0;
    rows.push([]);
    rows.push(['Tổng', total.total, total.inProgress, total.completed, total.overdue, `${totalPercent}%`]);
  }

  // Notes
  if (data.notes && data.notes.trim()) {
    rows.push([]);
    rows.push(['Ghi chú / Nhận xét:']);
    rows.push([data.notes]);
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Apply column widths
  ws['!cols'] = [
    { wch: 25 }, // Column label
    { wch: 12 }, // Tổng công việc
    { wch: 12 }, // Đang thực hiện
    { wch: 12 }, // Hoàn thành
    { wch: 12 }, // Quá hạn
    { wch: 12 }, // % hoàn thành
  ];

  // Create workbook and download
  const wb = XLSX.utils.book_new();
  const sheetName = data.reportType === 'phase' ? 'Theo giai đoạn' : data.reportType === 'discipline' ? 'Theo bộ môn' : 'Theo nhân sự';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}