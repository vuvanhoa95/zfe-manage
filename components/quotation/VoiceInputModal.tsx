'use client';

import React from 'react';
import { X } from 'lucide-react';
import VoiceInput from './VoiceInput';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onApply: (data: any) => void;
}

export default function VoiceInputModal({ isOpen, onClose, onApply }: VoiceInputModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 border border-zf-accent/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-zf-primary">Nhập liệu bằng giọng nói</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content: tái sử dụng component VoiceInput hiện có */}
        <div className="p-3">
          <VoiceInput
            onApply={(data) => {
              onApply(data);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

