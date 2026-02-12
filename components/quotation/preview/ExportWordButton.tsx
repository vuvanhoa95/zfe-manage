'use client';

import { useState } from 'react';
import { exportQuotationToWord } from '@/lib/export/word-export';

interface ExportWordButtonProps {
  quotationNo?: string;
  date?: Date;
  disabled?: boolean;
  className?: string;
}

/**
 * Export to Word button component
 * Converts quotation preview HTML to .docx format and downloads
 */
export default function ExportWordButton({
  quotationNo = 'DRAFT',
  date,
  disabled = false,
  className = '',
}: ExportWordButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      await exportQuotationToWord(quotationNo, date);
      // Success - file downloaded
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
      console.error('Word export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={disabled || isExporting}
        className={`
          flex items-center gap-2 px-4 py-2 
          bg-blue-600 text-white rounded-lg
          hover:bg-blue-700 
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors font-medium text-sm
          ${className}
        `}
        title="Xuất báo giá sang định dạng Word (.docx)"
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Đang xuất...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <path d="M12 18v-6"></path>
              <path d="m9 15 3 3 3-3"></path>
            </svg>
            Xuất Word
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs shadow-lg z-10 min-w-[200px]">
          {error}
        </div>
      )}
    </div>
  );
}
