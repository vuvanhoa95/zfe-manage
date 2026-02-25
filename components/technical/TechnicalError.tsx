'use client';

interface TechnicalErrorProps {
  code?: string;
  message: string;
  details?: string;
  suggestions?: string[];
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function TechnicalError({
  code,
  message,
  details,
  suggestions,
  onRetry,
  onDismiss,
  className = '',
}: TechnicalErrorProps) {
  return (
    <div className={`bg-red-50 border-l-4 border-red-500 p-4 rounded-lg technical-grid-hover ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-600 font-bold text-lg">⚠</span>
            <h3 className="text-red-800 font-semibold">Lỗi</h3>
            {code && (
              <span className="technical-code bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                {code}
              </span>
            )}
          </div>
          <p className="text-red-700 mb-2">{message}</p>
          {details && (
            <div className="bg-red-100 rounded p-3 mb-3">
              <p className="text-xs text-red-800 font-technical whitespace-pre-wrap">
                {details}
              </p>
            </div>
          )}
          {suggestions && suggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-red-800 mb-2">Gợi ý khắc phục:</p>
              <ul className="list-disc list-inside space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="text-xs text-red-700">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-red-600 hover:text-red-800 transition-colors"
            aria-label="Đóng"
          >
            ✕
          </button>
        )}
      </div>
      {onRetry && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onRetry}
            className="px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}
