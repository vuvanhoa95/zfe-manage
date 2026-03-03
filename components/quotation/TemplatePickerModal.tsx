'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Check, Loader2, Search } from 'lucide-react';

type Template = {
    id: string;
    name: string;
    description?: string;
    category?: string;
    vatRate?: number;
    createdAt?: string;
};

type TemplatePickerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onApply: (templateId: string) => Promise<void>;
};

const CATEGORY_LABELS: Record<string, string> = {
    BIM_SERVICE: 'Dịch vụ BIM',
    DESIGN: 'Thiết kế',
    CONSULTING: 'Tư vấn',
    OTHER: 'Khác',
};

export default function TemplatePickerModal({ isOpen, onClose, onApply }: TemplatePickerModalProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    useEffect(() => {
        if (!isOpen) return;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/quotation-templates');
                const result = await res.json();
                if (result.success && Array.isArray(result.data)) {
                    setTemplates(result.data);
                }
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [isOpen]);

    if (!isOpen) return null;

    const categories = ['ALL', ...Array.from(new Set(templates.map((t) => t.category || 'OTHER')))];

    const filtered = templates.filter((t) => {
        const matchSearch = !search.trim() ||
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            (t.description || '').toLowerCase().includes(search.toLowerCase());
        const matchCat = selectedCategory === 'ALL' || (t.category || 'OTHER') === selectedCategory;
        return matchSearch && matchCat;
    });

    const handleApply = async (templateId: string) => {
        setApplying(templateId);
        try {
            await onApply(templateId);
            onClose();
        } catch {
            // silent
        } finally {
            setApplying(null);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Mẫu báo giá</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Chọn mẫu để áp dụng vào báo giá hiện tại</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-6 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm mẫu báo giá..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                    selectedCategory === cat
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {cat === 'ALL' ? 'Tất cả' : (CATEGORY_LABELS[cat] || cat)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Template list */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                            <span className="ml-3 text-gray-500 text-sm">Đang tải mẫu...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="w-10 h-10 text-gray-300 mb-3" />
                            <p className="text-gray-500 text-sm font-medium">
                                {templates.length === 0
                                    ? 'Chưa có mẫu báo giá nào. Hãy lưu một báo giá thành mẫu trước.'
                                    : 'Không tìm thấy mẫu phù hợp.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {filtered.map((t) => (
                                <div
                                    key={t.id}
                                    className="group relative border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-white"
                                    onClick={() => void handleApply(t.id)}
                                >
                                    {/* Category badge */}
                                    {t.category && (
                                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full mb-2">
                                            {CATEGORY_LABELS[t.category] || t.category}
                                        </span>
                                    )}

                                    <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{t.name}</h3>

                                    {t.description && (
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{t.description}</p>
                                    )}

                                    <div className="flex items-center justify-between mt-auto">
                                        {t.vatRate != null && (
                                            <span className="text-xs text-gray-400">VAT: {(t.vatRate * 100).toFixed(0)}%</span>
                                        )}
                                        {t.createdAt && (
                                            <span className="text-xs text-gray-400">
                                                {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 rounded-xl bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-lg">
                                            {applying === t.id ? (
                                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang áp dụng...</>
                                            ) : (
                                                <><Check className="w-3.5 h-3.5" /> Áp dụng mẫu này</>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
