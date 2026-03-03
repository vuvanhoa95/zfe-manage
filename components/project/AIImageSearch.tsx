'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImageResult {
    url: string;
    thumbnailUrl: string;
    title: string;
    source: string;
}

interface AIImageSearchProps {
    projectName: string;
    description: string;
    location: string;
    onSelect: (imageUrl: string) => void;
}

export default function AIImageSearch({ projectName, description, location, onSelect }: AIImageSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<ImageResult[]>([]);
    const [keywords, setKeywords] = useState('');
    const [error, setError] = useState('');
    const [selectedUrl, setSelectedUrl] = useState('');

    const handleSearch = async () => {
        if (!projectName.trim() && !description.trim()) {
            setError('Vui lòng nhập tên dự án hoặc mô tả trước khi tìm ảnh');
            setIsOpen(true);
            return;
        }

        setIsLoading(true);
        setError('');
        setImages([]);
        setIsOpen(true);

        try {
            const res = await fetch('/api/ai/search-project-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectName, description, location }),
            });

            const result = await res.json();

            if (!result.success) {
                setError(result.error || 'Không thể tìm kiếm ảnh');
                return;
            }

            setKeywords(result.keywords);
            setImages(result.images || []);

            if ((result.images || []).length === 0) {
                setError('Không tìm thấy ảnh phù hợp. Thử thêm mô tả chi tiết hơn.');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi tìm kiếm ảnh');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectImage = (url: string) => {
        setSelectedUrl(url);
    };

    const handleConfirm = () => {
        if (selectedUrl) {
            onSelect(selectedUrl);
            setIsOpen(false);
            setSelectedUrl('');
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setSelectedUrl('');
        setError('');
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={handleSearch}
                title="AI tìm ảnh phù hợp với nội dung dự án"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                    <path strokeLinecap="round" d="M11 8v6M8 11h6" />
                </svg>
                ✨ AI tìm ảnh
            </button>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Panel */}
                    <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-violet-50 to-purple-50">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">🔍 AI tìm ảnh dự án</h3>
                                {keywords && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Từ khóa: <span className="font-mono text-violet-600">{keywords}</span>
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {/* Loading */}
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center py-16 gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center text-lg">🤖</div>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold text-gray-700">AI đang tìm ảnh phù hợp...</p>
                                        <p className="text-sm text-gray-500 mt-1">Đang tìm kiếm trên Google Images</p>
                                    </div>
                                </div>
                            )}

                            {/* Error */}
                            {!isLoading && error && (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className="text-4xl">😕</div>
                                    <p className="text-gray-600 text-center max-w-sm">{error}</p>
                                    <button
                                        onClick={handleSearch}
                                        className="mt-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            )}

                            {/* Image Grid */}
                            {!isLoading && images.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleSelectImage(img.url)}
                                            className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                                                selectedUrl === img.url
                                                    ? 'border-violet-500 ring-2 ring-violet-300 scale-[0.98]'
                                                    : 'border-transparent hover:border-violet-300 hover:scale-[0.99]'
                                            }`}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={img.thumbnailUrl || img.url}
                                                alt={img.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback to full URL if thumbnail fails
                                                    (e.currentTarget as HTMLImageElement).src = img.url;
                                                }}
                                            />

                                            {/* Selected checkmark */}
                                            {selectedUrl === img.url && (
                                                <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                                                    <div className="bg-violet-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Hover overlay */}
                                            {selectedUrl !== img.url && (
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
                                                    <p className="w-full px-2 py-1.5 bg-black/50 text-white text-[10px] truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {img.source}
                                                    </p>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {!isLoading && images.length > 0 && (
                            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t bg-gray-50">
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSearch}
                                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                    >
                                        🔄 Tìm lại
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleClose}
                                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={!selectedUrl}
                                        className="px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        {selectedUrl ? '✅ Dùng ảnh này' : 'Chọn 1 ảnh'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
