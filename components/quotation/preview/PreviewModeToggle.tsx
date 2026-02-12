'use client';

import { useState } from 'react';

export type PreviewMode = 'desktop' | 'tablet' | 'mobile' | 'print';

interface PreviewModeToggleProps {
  onModeChange?: (mode: PreviewMode) => void;
  defaultMode?: PreviewMode;
  className?: string;
}

/**
 * Toggle buttons for switching preview modes
 * Desktop (full), Tablet (768px), Mobile (375px), Print
 */
export default function PreviewModeToggle({
  onModeChange,
  defaultMode = 'desktop',
  className = '',
}: PreviewModeToggleProps) {
  const [activeMode, setActiveMode] = useState<PreviewMode>(defaultMode);

  const handleModeChange = (mode: PreviewMode) => {
    setActiveMode(mode);
    onModeChange?.(mode);
  };

  const modes: Array<{ id: PreviewMode; label: string; icon: React.JSX.Element}> = [
    {
      id: 'desktop',
      label: 'Desktop',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      ),
    },
    {
      id: 'tablet',
      label: 'Tablet',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
          <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
      ),
    },
    {
      id: 'mobile',
      label: 'Mobile',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="7" y="2" width="10" height="20" rx="2" ry="2"></rect>
          <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
      ),
    },
    {
      id: 'print',
      label: 'Print',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
      ),
    },
  ];

  return (
    <div className={`inline-flex gap-1 bg-gray-100 p-1 rounded-lg ${className}`}>
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => handleModeChange(mode.id)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md
            transition-colors text-sm font-medium
            ${
              activeMode === mode.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }
          `}
          title={`Switch to ${mode.label} view`}
        >
          {mode.icon}
          <span className="hidden sm:inline">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Get CSS className for preview wrapper based on mode
 */
export function getPreviewWrapperClass(mode: PreviewMode): string {
  switch (mode) {
    case 'tablet':
      return 'w-[768px] mx-auto';
    case 'mobile':
      return 'w-[375px] mx-auto';
    case 'print':
      return 'w-full print-mode';
    case 'desktop':
    default:
      return 'w-full';
  }
}
