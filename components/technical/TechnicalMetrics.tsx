'use client';

import { useState, useEffect } from 'react';

interface TechnicalMetricsProps {
  tabSwitchTime?: number; // in ms
  cacheStatus?: 'cached' | 'stale' | 'fresh';
  dataFreshness?: string; // e.g., "Updated 2s ago"
  className?: string;
  showTooltip?: boolean;
}

export default function TechnicalMetrics({
  tabSwitchTime,
  cacheStatus = 'fresh',
  dataFreshness,
  className = '',
  showTooltip = true,
}: TechnicalMetricsProps) {
  const [showDetails, setShowDetails] = useState(false);

  const cacheStatusConfig = {
    cached: { label: '✓ Cached', color: 'text-zf-success' },
    stale: { label: '⚠ Stale', color: 'text-zf-warning' },
    fresh: { label: '✓ Fresh', color: 'text-zf-success' },
  };

  const status = cacheStatusConfig[cacheStatus];

  return (
    <div className={`relative inline-flex items-center gap-3 text-xs font-technical text-technical-secondary ${className}`}>
      <div
        className="flex items-center gap-3"
        onMouseEnter={() => showTooltip && setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        {tabSwitchTime !== undefined && (
          <span className="text-technical-muted">
            &lt; {tabSwitchTime}ms
          </span>
        )}
        
        <span className={status.color}>{status.label}</span>
        
        {dataFreshness && (
          <span className="text-technical-muted">{dataFreshness}</span>
        )}
      </div>

      {/* Technical Tooltip */}
      {showDetails && showTooltip && (
        <div
          className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-zf-graphite text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap pointer-events-none"
          role="tooltip"
          aria-live="polite"
        >
          <div className="font-technical space-y-1">
            {tabSwitchTime !== undefined && (
              <div>Tab switch: {tabSwitchTime}ms</div>
            )}
            <div>Cache: {cacheStatus}</div>
            {dataFreshness && <div>{dataFreshness}</div>}
          </div>
          <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-zf-graphite" aria-hidden="true"></div>
        </div>
      )}
    </div>
  );
}
