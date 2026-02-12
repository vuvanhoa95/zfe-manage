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
