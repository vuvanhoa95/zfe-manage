'use client';

import { useState } from 'react';

interface TechnicalBadgeProps {
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  timestamp?: string;
  info?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function TechnicalBadge({
  status,
  timestamp,
  info,
  icon,
  className = '',
}: TechnicalBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const statusConfig = {
    DRAFT: {
      label: 'Draft',
      className: 'badge-technical-draft',
      tooltip: 'Bản nháp - Chưa gửi',
    },
    SENT: {
      label: 'Sent',
      className: 'badge-technical-sent',
      tooltip: timestamp ? `Đã gửi - ${timestamp}` : 'Đã gửi',
    },
    ACCEPTED: {
      label: 'Accepted',
      className: 'badge-technical-accepted',
      tooltip: info || timestamp ? `Đã chấp nhận - ${info || timestamp}` : 'Đã chấp nhận',
    },
    REJECTED: {
      label: 'Rejected',
      className: 'badge-technical-rejected',
      tooltip: info || timestamp ? `Từ chối - ${info || timestamp}` : 'Từ chối',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="relative inline-block">
      <span
        className={`badge-technical ${config.className} ${className}`}
        onMouseEnter={() => (timestamp || info) && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={config.tooltip}
      >
        {icon && <span className="flex items-center">{icon}</span>}
        <span>{config.label}</span>
      </span>

      {/* Technical Tooltip */}
      {(timestamp || info) && showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zf-graphite text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap pointer-events-none"
          role="tooltip"
        >
          <div className="font-technical text-xs">{config.tooltip}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zf-graphite"></div>
        </div>
      )}
    </div>
  );
}
