'use client';

import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

type FeedbackButtonProps = {
    module: 'dashboard' | 'report' | 'task';
    projectId?: string;
    className?: string;
};

export default function FeedbackButton({ module, projectId, className = '' }: FeedbackButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<'bug' | 'feature' | 'improvement' | 'other'>('improvement');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim().length < 5) {
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    module,
                    type,
                    message: message.trim(),
                    projectId,
                }),
            });

            const json = await res.json();
            if (json.success) {
                setSubmitStatus('success');
                setMessage('');
                setTimeout(() => {
                    setIsOpen(false);
                    setSubmitStatus(null);
                }, 2000);
            } else {
                setSubmitStatus('error');
            }
        } catch (err) {
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors ${className}`}
                title="Gửi feedback"
            >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Feedback</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsOpen(false)}>
                    <div
                        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Gửi feedback</h3>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại feedback</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as typeof type)}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zf-accent"
                                >
                                    <option value="bug">Báo lỗi</option>
                                    <option value="feature">Đề xuất tính năng</option>
                                    <option value="improvement">Cải thiện</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Mô tả chi tiết feedback của bạn..."
                                    rows={4}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zf-accent resize-none"
                                    required
                                    minLength={5}
                                    maxLength={2000}
                                />
                                <p className="mt-1 text-xs text-gray-500">{message.length}/2000</p>
                            </div>

                            {submitStatus === 'success' && (
                                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                                    Cảm ơn bạn đã gửi feedback!
                                </div>
                            )}

                            {submitStatus === 'error' && (
                                <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                                    Không thể gửi feedback. Vui lòng thử lại sau.
                                </div>
                            )}

                            <div className="flex items-center gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || message.trim().length < 5}
                                    className="px-4 py-2 rounded-xl bg-zf-primary text-white text-sm font-medium hover:bg-zf-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Đang gửi...' : 'Gửi feedback'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
