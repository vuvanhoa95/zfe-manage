'use client';

import { useState } from 'react';
import { ReviewSuggestion } from '@/lib/ai/review-quotation';
import { QuotationFormData } from '@/types/quotation';

interface AIReviewerProps {
  data: QuotationFormData;
  quotationId?: string;
  className?: string;
}

/**
 * AIReviewer - Component to trigger and show AI quality review findings
 */
export default function AIReviewer({
  data,
  quotationId,
  className = '',
}: AIReviewerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; suggestions: ReviewSuggestion[] } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleReview = async () => {
    setLoading(true);
    setIsOpen(true);
    try {
      const response = await fetch(`/api/quotations/${quotationId || 'draft'}/ai-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        alert('Có lỗi xảy ra khi thực hiện Review.');
      }
    } catch (error) {
      console.error('Review fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleReview}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
          ${loading ? 'bg-gray-200 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'}
        `}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : '🤖 AI Review'}
      </button>

      {isOpen && (
        <div className="mt-4 bg-white border border-indigo-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="bg-indigo-50 px-4 py-3 flex justify-between items-center border-b border-indigo-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">🤖</span>
              <div>
                <h4 className="text-sm font-bold text-indigo-900">AI Quality Analysis</h4>
                {result && (
                  <p className="text-[10px] text-indigo-600 font-black uppercase">Health Score: {result.score}/100</p>
                )}
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-indigo-400 hover:text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center py-12 space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500 animate-pulse">AI is analyzing your document...</p>
              </div>
            ) : result && result.suggestions.length > 0 ? (
              result.suggestions.map((suggestion, idx) => (
                <div key={idx} className={`p-3 rounded-lg border flex gap-3 ${getSeverityColor(suggestion.severity)}`}>
                   <div className="flex-shrink-0 text-lg">
                      {suggestion.type === 'grammar' ? '✍️' : suggestion.type === 'pricing' ? '💰' : suggestion.type === 'missing' ? '🔍' : '💡'}
                   </div>
                   <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-tight">{suggestion.title}</p>
                      <p className="text-sm border-b border-black/5 pb-1 mb-1">{suggestion.message}</p>
                      <p className="text-xs italic bg-white/50 p-2 rounded">
                        <span className="font-bold">Gợi ý:</span> {suggestion.suggestion}
                      </p>
                      <p className="text-[10px] opacity-70">📍 {suggestion.location}</p>
                   </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                 {result ? 'No issues found! Your quotation looks great. ✅' : 'Click "AI Review" to start analysis.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
