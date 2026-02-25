'use client';

import { ReactNode } from 'react';

interface TechnicalGridProps {
  children: ReactNode;
  density?: 'default' | 'dense' | 'sparse';
  showOnHover?: boolean;
  className?: string;
}

export default function TechnicalGrid({
  children,
  density = 'default',
  showOnHover = true,
  className = '',
}: TechnicalGridProps) {
  const gridClass = showOnHover
    ? 'technical-grid'
    : 'technical-grid-visible';

  const densityClass = density === 'dense' ? 'technical-grid-dense' : density === 'sparse' ? 'technical-grid-sparse' : '';

  return (
    <div className={`${gridClass} ${densityClass} ${className}`}>
      {children}
    </div>
  );
}
