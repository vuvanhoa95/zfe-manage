'use client';

import React, { useState } from 'react';
import { Loader2, Sparkles, RefreshCw, Check, X } from 'lucide-react';
import type { IntroGenerationResponse } from '@/types/ai';

interface AIIntroGeneratorProps {
  customerId: string;
  projectName: string;
  projectNotes?: string;
  totalArea?: number;
  onApply: (introText: string) => void;
  currentIntro?: string;
}

const AIIntroGenerator: React.FC<AIIntroGeneratorProps> = ({
  customerId,
  projectName,
  projectNotes,
  totalArea,
  onApply,
  currentIntro,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedIntro, setGeneratedIntro] = useState<IntroGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const generateIntro = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedIntro(null);

    try {
      const response = await fetch('/api/ai/generate-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          projectName,
          projectNotes,
          totalArea,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setGeneratedIntro(result.data);
        setShowModal(true);
      } else {
        setError(result.error || 'Không thể tạo lời mở đầu');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ AI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedIntro) {
      onApply(generatedIntro.introText);
      setShowModal(false);
      setGeneratedIntro(null);
    }
  };

  const handleRegenerate = () => {
    setShowModal(false);
    setTimeout(() => generateIntro(), 300);
  };

  if (!customerId || !projectName) {
    return null;
  }

  return (
    <>
      <button
        onClick={generateIntro}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm font-bold"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            AI đang viết...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            ✨ AI Tạo Lời Mở Đầu
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex items-center gap-2">
          <X size={16} />
          {error}
        </div>
      )}

      {/* Modal */}
      {showModal && generatedIntro && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Sparkles className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Lời mở đầu AI đã tạo</h3>
                    <p className="text-sm text-gray-600">
                      {generatedIntro.wordCount} từ • Độ tin cậy: {Math.round(generatedIntro.confidence * 100)}%
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed text-gray-800">
                  {generatedIntro.introText}
                </div>
              </div>

              {currentIntro && currentIntro.trim() && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Lời mở đầu hiện tại:</p>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm text-gray-700 whitespace-pre-wrap opacity-75">
                    {currentIntro}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={handleRegenerate}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold"
              >
                <RefreshCw size={18} />
                Tạo lại
              </button>
              <button
                onClick={handleApply}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-bold shadow-md"
              >
                <Check size={18} />
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIIntroGenerator;
