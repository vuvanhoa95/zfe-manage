'use client';

import { useState, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

type InlineEditorType = 'text' | 'textarea' | 'richtext';

interface InlineEditorProps {
  value: string;
  onChange: (newValue: string) => Promise<void>;
  type?: InlineEditorType;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  disabled?: boolean;
}

/**
 * InlineEditor - Editable component with auto-save
 * 
 * Features:
 * - Click to edit
 * - Auto-save after debounce delay
 * - ESC to cancel
 * - Loading/saving indicators
 * - Error handling
 */
export default function InlineEditor({
  value,
  onChange,
  type = 'text',
  placeholder = 'Click to edit...',
  className = '',
  debounceMs = 2000,
  disabled = false,
}: InlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  
  const debouncedValue = useDebounce(tempValue, debounceMs);

  // Update tempValue when value prop changes (external update)
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  // Auto-save when debounced value changes
  useEffect(() => {
    if (isEditing && debouncedValue !== value) {
      handleSave(debouncedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Select all text for easier editing
      if (type === 'text') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleSave = async (newValue: string) => {
    if (newValue === value) return; // No changes

    setIsSaving(true);
    setSaveError(null);

    try {
      await onChange(newValue);
      // Success - value will be updated via props
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Save failed');
      // Revert to original value on error
      setTempValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    // Final save on blur (if not already saved by debounce)
    if (tempValue !== value) {
      handleSave(tempValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Cancel editing, revert changes
      setTempValue(value);
      setIsEditing(false);
      setSaveError(null);
    } else if (e.key === 'Enter' && type === 'text') {
      // Save and exit on Enter for single-line text
      e.preventDefault();
      handleBlur();
    }
  };

  // Non-editing view
  if (!isEditing) {
    return (
      <div
        onClick={handleClick}
        className={`
          cursor-pointer group relative
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
          ${className}
        `}
        title={disabled ? 'Editing disabled' : 'Click to edit'}
      >
        <div className={`${!value ? 'text-gray-400 italic' : ''}`}>
          {value || placeholder}
        </div>
        
        {!disabled && (
          <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
              className="text-gray-400"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </div>
        )}

        {isSaving && (
          <div className="absolute right-6 top-0 text-xs text-blue-600 flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Saving...
          </div>
        )}

        {saveError && (
          <div className="absolute right-0 top-6 text-xs text-red-600 bg-red-50 px-2 py-1 rounded shadow">
            {saveError}
          </div>
        )}
      </div>
    );
  }

  // Editing view
  if (type === 'text') {
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`
          w-full px-2 py-1 border-2 border-blue-500 rounded
          focus:outline-none focus:ring-2 focus:ring-blue-300
          ${className}
        `}
        placeholder={placeholder}
      />
    );
  }

  if (type === 'textarea') {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        rows={4}
        className={`
          w-full px-2 py-1 border-2 border-blue-500 rounded
          focus:outline-none focus:ring-2 focus:ring-blue-300
          resize-vertical
          ${className}
        `}
        placeholder={placeholder}
      />
    );
  }

  // Rich text editor (simplified for now, can be enhanced with a library)
  return (
    <textarea
      ref={inputRef as React.RefObject<HTMLTextAreaElement>}
      value={tempValue}
      onChange={(e) => setTempValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      rows={8}
      className={`
        w-full px-2 py-1 border-2 border-blue-500 rounded
        focus:outline-none focus:ring-2 focus:ring-blue-300
        resize-vertical font-mono text-sm
        ${className}
      `}
      placeholder={placeholder}
    />
  );
}
