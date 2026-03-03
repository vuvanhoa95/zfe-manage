'use client';

import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

type SaveTemplateModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (params: { name: string; description: string; category: string }) => Promise<void>;
    defaultName?: string;
};

const CATEGORIES = [
    { value: 'BIM_SERVICE', label: 'Dịch vụ BIM' },
    { value: 'DESIGN', label: 'Thiết kế' },
    { value: 'CONSULTING', label: 'Tư vấn' },
    { value: 'OTHER', label: 'Khác' },
];

export default function SaveTemplateModal({ isOpen, onClose, onSave, defaultName = '' }: SaveTemplateModalProps) {
    const [name, setName] = useState(defaultName);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('BIM_SERVICE');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name.trim()) { setError('Vui lòng nhập tên mẫu báo giá'); return; }
        setError('');
        setSaving(true);
        try {
            await onSave({ name: name.trim(), description: description.trim(), category });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể lưu mẫu. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Lưu thành mẫu báo giá</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Mẫu sẽ được tái sử dụng cho các báo giá sau</p>
                    </div>
                    <button onClick={onClose} disabled={saving} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Tên mẫu */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Tên mẫu <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setError(''); }}
                            placeholder="VD: BIM cơ bản, BIM cao cấp, MEP full..."
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Mô tả */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Mô tả <span className="text-gray-400 font-normal">(tùy chọn)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả ngắn về phạm vi, loại dự án phù hợp..."
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        />
                    </div>

                    {/* Phân loại */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phân loại</label>
                        <div className="flex gap-2 flex-wrap">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setCategory(cat.value)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                        category === cat.value
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lưu ý */}
                    <div className="flex gap-3 items-start p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <span className="text-amber-500 text-base flex-shrink-0 mt-0.5">💡</span>
                        <p className="text-xs text-amber-700">
                            Mẫu sẽ lưu: tiêu đề, giới thiệu, phạm vi, sản phẩm bàn giao, tiến độ, danh sách công việc và định mức thuế.
                            <strong> Thông tin khách hàng và dự án sẽ không được lưu.</strong>
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => void handleSave()}
                        disabled={saving || !name.trim()}
                        className="px-5 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-60 flex items-center gap-2 shadow-sm shadow-blue-500/30"
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                        ) : (
                            <><Save className="w-4 h-4" /> Lưu mẫu</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
