'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { GripVertical, Plus, Trash2, Save, RotateCcw } from 'lucide-react';

type ChecklistItem = { key: string; label: string };

const DEFAULT_ITEMS: ChecklistItem[] = [
    { key: 'contract', label: 'Hợp đồng / Phụ lục' },
    { key: 'acceptance', label: 'Biên bản nghiệm thu' },
    { key: 'invoice', label: 'Hóa đơn GTGT' },
    { key: 'request', label: 'Đề nghị thanh toán' },
    { key: 'handover', label: 'Biên bản bàn giao' },
];

export default function PaymentChecklistSettings() {
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings/payment-checklist');
            const result = await res.json();
            if (result.success) {
                setItems(result.data);
            }
        } catch (err) {
            console.error('Failed to load checklist settings:', err);
            setItems(DEFAULT_ITEMS);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchItems();
    }, [fetchItems]);

    function addItem() {
        const newKey = `item_${Date.now()}`;
        setItems((prev) => [...prev, { key: newKey, label: '' }]);
        setDirty(true);
    }

    function removeItem(index: number) {
        setItems((prev) => prev.filter((_, i) => i !== index));
        setDirty(true);
    }

    function updateLabel(index: number, label: string) {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? { ...item, label, key: label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, '') || item.key }
                    : item
            )
        );
        setDirty(true);
    }

    function resetToDefaults() {
        setItems([...DEFAULT_ITEMS]);
        setDirty(true);
    }

    async function handleSave() {
        // Remove empty labels
        const validItems = items.filter((i) => i.label.trim());
        if (validItems.length === 0) {
            alert('Cần ít nhất 1 mục checklist');
            return;
        }

        setSaving(true);
        setSaveMessage(null);
        try {
            const res = await fetch('/api/settings/payment-checklist', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: validItems }),
            });
            const result = await res.json();
            if (result.success) {
                setItems(result.data);
                setDirty(false);
                setSaveMessage('Đã lưu thành công!');
                setTimeout(() => setSaveMessage(null), 2000);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            alert(`Lỗi: ${err.message || 'Không thể lưu'}`);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="py-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                Đang tải...
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Checklist hồ sơ thanh toán</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Tùy chỉnh danh sách hồ sơ cần nộp cho mỗi đợt thanh toán. 
                        Mỗi đợt thanh toán sẽ chọn riêng những hồ sơ nào cần cho đợt đó.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={resetToDefaults}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                        title="Khôi phục mặc định"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Mặc định
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!dirty || saving}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-1.5"
                    >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                </div>
            </div>

            {saveMessage && (
                <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    ✓ {saveMessage}
                </div>
            )}

            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center">
                    <span className="w-8"></span>
                    <span className="flex-1">Tên hồ sơ</span>
                    <span className="w-10 text-center">Xóa</span>
                </div>
                <div className="divide-y divide-gray-100">
                    {items.map((item, index) => (
                        <div
                            key={item.key + index}
                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50/50 transition-colors group"
                        >
                            <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-grab" />
                            <input
                                type="text"
                                value={item.label}
                                onChange={(e) => updateLabel(index, e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Tên hồ sơ..."
                            />
                            <button
                                onClick={() => removeItem(index)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Xóa mục"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={addItem}
                className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Thêm mục hồ sơ
            </button>

            <div className="text-xs text-gray-400 mt-2">
                💡 Mẹo: Mỗi đợt thanh toán trong Dòng tiền sẽ chọn riêng những hồ sơ cần cho đợt đó. 
                Ví dụ: Đợt tạm ứng chỉ cần &quot;Hợp đồng&quot;, đợt cuối cần đầy đủ.
            </div>
        </div>
    );
}
