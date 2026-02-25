'use client';

import { ReactNode } from 'react';

interface TechnicalTooltipProps {
  content: ReactNode;
  title?: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  showOnHover?: boolean;
}

export default function TechnicalTooltip({
  content,
  title,
  children,
  position = 'top',
  className = '',
  showOnHover = true,
}: TechnicalTooltipProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      {showOnHover && (
        <div
          className={`absolute z-50 px-3 py-2 bg-zf-graphite text-white text-xs rounded-lg shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-technical ${
            position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' :
            position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' :
            position === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' :
            'left-full top-1/2 -translate-y-1/2 ml-2'
          }`}
          role="tooltip"
        >
          {title && (
            <div className="font-semibold mb-1 border-b border-white/20 pb-1">
              {title}
            </div>
          )}
          <div>{content}</div>
          <div
            className={`absolute ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zf-graphite' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-zf-graphite' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-zf-graphite' :
              'right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-zf-graphite'
            }`}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
