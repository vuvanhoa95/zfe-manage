'use client';

import React, { useState } from 'react';
import { Loader2, Sparkles, TrendingUp, TrendingDown, Check } from 'lucide-react';
import type { PricingSuggestion } from '@/types/ai';

interface AIPricingSuggestionProps {
  itemTitle: string;
  customerId?: string;
  projectSize?: number;
  location?: string;
  onApply: (price: number) => void;
}

const AIPricingSuggestion: React.FC<AIPricingSuggestionProps> = ({
  itemTitle,
  customerId,
  projectSize,
  location,
  onApply,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<PricingSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestion = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const response = await fetch('/api/ai/pricing-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemTitle,
          customerId,
          projectSize,
          location,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuggestion(result.data);
      } else {
        setError(result.error || 'Không thể lấy gợi ý giá');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ AI');
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    if (confidence >= 0.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'Rất chắc chắn';
    if (confidence >= 0.7) return 'Khá chắc chắn';
    if (confidence >= 0.5) return 'Ước lượng';
    return 'Không chắc chắn';
  };

  if (!itemTitle || itemTitle.trim().length === 0) {
    return null;
  }

  return (
    <div className="my-3">
      {!suggestion && !isLoading && !error && (
        <button
          onClick={fetchSuggestion}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
        >
          <Sparkles size={16} />
          AI Gợi ý giá
        </button>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <Loader2 className="animate-spin text-purple-600" size={16} />
          <span className="text-sm text-purple-800">AI đang phân tích lịch sử giá...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">
          {error}
        </div>
      )}

      {suggestion && (
        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-600" size={18} />
              <span className="font-bold text-purple-900">AI Gợi ý giá</span>
            </div>
            <span className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
              {getConfidenceLabel(suggestion.confidence)} ({Math.round(suggestion.confidence * 100)}%)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-200">
              <TrendingDown className="text-blue-500 mb-1" size={16} />
              <span className="text-[10px] text-gray-500 uppercase">Thấp nhất</span>
              <span className="text-sm font-bold text-gray-900">
                {suggestion.min.toLocaleString('vi-VN')}
              </span>
            </div>
            <div className="flex flex-col items-center p-2 bg-purple-100 rounded-lg border-2 border-purple-400">
              <Check className="text-purple-600 mb-1" size={16} />
              <span className="text-[10px] text-purple-700 uppercase font-bold">Khuyến nghị</span>
              <span className="text-base font-bold text-purple-900">
                {suggestion.avg.toLocaleString('vi-VN')}
              </span>
            </div>
            <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-200">
              <TrendingUp className="text-orange-500 mb-1" size={16} />
              <span className="text-[10px] text-gray-500 uppercase">Cao nhất</span>
              <span className="text-sm font-bold text-gray-900">
                {suggestion.max.toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          <div className="p-2 bg-white/80 rounded-lg text-xs text-gray-700 mb-3 italic">
            💡 {suggestion.reasoning}
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-3">
            <span>Dựa trên {suggestion.sampleCount} hạng mục tương tự</span>
          </div>

          <button
            onClick={() => onApply(suggestion.avg)}
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-bold text-sm shadow-md"
          >
            Áp dụng giá khuyến nghị
          </button>
        </div>
      )}
    </div>
  );
};

export default AIPricingSuggestion;
