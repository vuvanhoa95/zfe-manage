'use client';

import { useState, useEffect, useRef } from 'react';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon?: string;
  action: () => void;
  category?: string;
}

interface TechnicalCommandPaletteProps {
  commands: Command[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function TechnicalCommandPalette({
  commands,
  isOpen,
  onClose,
  className = '',
}: TechnicalCommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 ${className}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-zf-graphite/15 technical-grid-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-zf-graphite/15">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Tìm kiếm lệnh..."
            className="w-full px-3 py-2 border border-zf-graphite/15 rounded-lg font-technical focus:outline-none focus:ring-2 focus:ring-zf-accent"
            aria-label="Search commands"
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-technical-secondary font-technical">
              Không tìm thấy lệnh
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-zf-bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent ${
                    index === selectedIndex ? 'bg-zf-bg-secondary' : ''
                  }`}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <div className="flex items-center gap-3">
                    {cmd.icon && <span className="text-lg">{cmd.icon}</span>}
                    <div>
                      <div className="font-medium text-zf-graphite">{cmd.label}</div>
                      {cmd.category && (
                        <div className="text-xs text-technical-secondary font-technical">
                          {cmd.category}
                        </div>
                      )}
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="px-2 py-1 bg-zf-bg-tertiary rounded text-xs font-technical text-technical-secondary border border-zf-graphite/15">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-zf-graphite/15 text-xs text-technical-secondary font-technical flex items-center justify-between">
          <span>↑↓ Navigate • Enter Select • Esc Close</span>
          <span>{filteredCommands.length} lệnh</span>
        </div>
      </div>
    </div>
  );
}
