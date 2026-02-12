'use client';

import { QuotationFormData } from '@/types/quotation';
import { exportPricingToExcel } from '@/lib/export/excel-export';

interface ExportExcelButtonProps {
  data: QuotationFormData;
  quotationNo?: string;
  className?: string;
}

export default function ExportExcelButton({
  data,
  quotationNo = 'Draft',
  className = '',
}: ExportExcelButtonProps) {
  const handleExport = () => {
    exportPricingToExcel(data, `BaoGia_${quotationNo}`);
  };

  return (
    <button
      onClick={handleExport}
      className={`flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-sm font-medium shadow-sm ${className}`}
      title="Xuất bảng giá ra Excel"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <path d="M8 13h2"></path>
        <path d="M8 17h2"></path>
        <path d="M14 13h2"></path>
        <path d="M14 17h2"></path>
      </svg>
      <span>Excel</span>
    </button>
  );
}
