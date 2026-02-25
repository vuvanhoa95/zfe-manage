'use client';

interface TechnicalLoadingProps {
  message?: string;
  progress?: number; // 0-100
  status?: string;
  className?: string;
}

export default function TechnicalLoading({
  message = 'Đang tải...',
  progress,
  status,
  className = '',
}: TechnicalLoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 border-4 border-zf-graphite/20 rounded-full"></div>
        <div
          className="absolute inset-0 border-4 border-transparent border-t-zf-accent rounded-full animate-spin"
          style={{ animationDuration: '1s' }}
        ></div>
      </div>
      <div className="text-center">
        <p className="text-sm font-technical text-technical-primary mb-1">{message}</p>
        {status && (
          <p className="text-xs font-technical text-technical-secondary">{status}</p>
        )}
        {progress !== undefined && (
          <div className="mt-3 w-48 h-1 bg-zf-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-zf-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
