'use client';

import { useState } from 'react';

interface TemplateSelectorProps {
  currentTemplate?: string;
  onTemplateChange: (templateId: 'standard' | 'minimalist' | 'detailed') => void;
  className?: string;
}

const TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Bản thiết kế truyền thống, đầy đủ các phần với logo lớn.',
    thumbnail: '📄',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Thiết kế tinh gọn, tập trung vào nội dung chính và bảng giá.',
    thumbnail: '📝',
  },
  {
    id: 'detailed',
    name: 'Detailed',
    description: 'Bản chi tiết, bao gồm hình ảnh dự án và thuyết minh mở rộng.',
    thumbnail: '📊',
  },
] as const;

export default function TemplateSelector({
  currentTemplate = 'standard',
  onTemplateChange,
  className = '',
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
        <span>Layout</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6"></path>
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Choose Template</h4>
            <div className="space-y-3">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    onTemplateChange(template.id as any);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-start gap-3 p-3 rounded-lg transition-all border
                    ${currentTemplate === template.id 
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                      : 'hover:bg-gray-50 border-gray-100'}
                  `}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xl">
                    {template.thumbnail}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${currentTemplate === template.id ? 'text-blue-700' : 'text-gray-900'}`}>
                      {template.name}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                      {template.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
