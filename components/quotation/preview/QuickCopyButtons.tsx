'use client';

import { useState } from 'react';
import { copyToClipboard } from '@/lib/utils/copy-to-clipboard';
import { pricingDataToMarkdown } from '@/lib/utils/table-to-markdown';

interface QuickCopyButtonsProps {
  summaryText?: string;
  emailText?: string;
  pricingLines?: Array<{
    itemNo?: string;
    title: string;
    qty?: number;
    unit?: string;
    unitPrice?: number;
    note?: string;
  }>;
  className?: string;
}

/**
 * Quick copy buttons for common content
 * Copy summary, email, or pricing table to clipboard
 */
export default function QuickCopyButtons({
  summaryText,
  emailText,
  pricingLines,
  className = '',
}: QuickCopyButtonsProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = async (text: string, itemName: string) => {
    const success = await copyToClipboard(text);
    
    if (success) {
      setCopiedItem(itemName);
      // Reset after 2 seconds
      setTimeout(() => setCopiedItem(null), 2000);
    } else {
      alert('Không thể copy. Vui lòng thử lại.');
    }
  };

  const copyButtons = [
    {
      id: 'summary',
      label: 'Copy Summary',
      icon: '📋',
      content: summaryText,
      disabled: !summaryText,
    },
    {
      id: 'email',
      label: 'Copy Email',
      icon: '✉️',
      content: emailText,
      disabled: !emailText,
    },
    {
      id: 'table',
      label: 'Copy Table',
      icon: '📊',
      content: pricingLines ? pricingDataToMarkdown(pricingLines) : undefined,
      disabled: !pricingLines || pricingLines.length === 0,
    },
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {copyButtons.map((button) => (
        <button
          key={button.id}
          onClick={() => button.content && handleCopy(button.content, button.id)}
          disabled={button.disabled}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
            transition-colors
            ${
              copiedItem === button.id
                ? 'bg-green-100 text-green-700 border border-green-300'
                : button.disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
            }
          `}
          title={button.disabled ? 'No content to copy' : `Copy ${button.label}`}
        >
          <span>{button.icon}</span>
          <span>{copiedItem === button.id ? 'Copied!' : button.label}</span>
        </button>
      ))}
    </div>
  );
}
