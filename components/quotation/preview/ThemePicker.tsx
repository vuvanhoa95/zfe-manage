'use client';

import { useState } from 'react';
import { QUOTATION_THEMES, QuotationThemeId } from '@/lib/themes/quotation-themes';

interface ThemePickerProps {
  currentTheme?: string;
  onThemeChange: (theme: string) => void;
  className?: string;
}

/**
 * ThemePicker - Dropdown to select color themes for the quotation
 * Supports presets and custom color input
 */
export default function ThemePicker({
  currentTheme = 'blue',
  onThemeChange,
  className = '',
}: ThemePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(currentTheme.startsWith('#') ? currentTheme : '#3B82F6');

  const handleThemeSelect = (theme: string) => {
    onThemeChange(theme);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onThemeChange(color);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
      >
        <div 
          className="w-4 h-4 rounded-full border border-gray-200" 
          style={{ backgroundColor: currentTheme.startsWith('#') ? currentTheme : (QUOTATION_THEMES[currentTheme as QuotationThemeId]?.accent || '#3B82F6') }}
        ></div>
        <span>Theme</span>
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
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Preset Themes</h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.values(QUOTATION_THEMES).map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${currentTheme === theme.id ? 'bg-blue-50 ring-2 ring-blue-500' : 'hover:bg-gray-50 border border-transparent'}`}
                >
                  <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: theme.accent }}></div>
                  <span className="text-[10px] font-medium text-gray-700">{theme.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Custom Color</h4>
              <div className="flex items-center gap-3 px-1">
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0 overflow-hidden"
                  title="Pick a custom color"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                      onThemeChange(e.target.value);
                    }
                  }}
                  className="flex-1 text-xs font-mono px-2 py-1 border border-gray-200 rounded focus:border-blue-500 outline-none"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
