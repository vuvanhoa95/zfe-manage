'use client';

import React, { useState, useEffect } from 'react';
import { formatVND } from '@/lib/number-to-words-vn';
import {
    Database,
    RefreshCw,
    Plus,
    DollarSign,
    Package,
    FileText,
    Search,
    X,
    FolderOpen,
    Pencil,
    Trash2,
    Ruler,
} from 'lucide-react';

type CatalogItem = {
    id: string;
    category: 'SCOPE' | 'DELIVERABLES' | 'PRICING';
    title: string;
    unit?: string;
    defaultPrice?: number;
    description?: string;
    group?: string;
    order: number;
};

type Unit = {
    id: string;
    name: string;
    symbol?: string;
    description?: string;
    category?: string;
    order: number;
    isActive: boolean;
};

// Cache for catalog items by category
const catalogCache = new Map<string, { data: CatalogItem[]; timestamp: number }>();
const CATALOG_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Cache for units
let unitsCache: { data: Unit[]; timestamp: number } | null = null;
const UNITS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function CatalogTab() {
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [units, setUnits] = useState<Unit[]>(unitsCache?.data || []);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingUnits, setIsLoadingUnits] = useState(false);
    const [activeCategory, setActiveCategory] = useState<'SCOPE' | 'DELIVERABLES' | 'PRICING' | 'UNITS'>('PRICING');
    const [editingItem, setEditingItem] = useState<Partial<CatalogItem> | null>(null);
    const [editingUnit, setEditingUnit] = useState<Partial<Unit> | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [useCustomUnit, setUseCustomUnit] = useState(false);
    const [hasLoadedCategory, setHasLoadedCategory] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (activeCategory === 'UNITS') {
            fetchUnits();
        } else {
            fetchItems();
        }
    }, [activeCategory]);

    // Fetch units when opening edit modal for PRICING items
    useEffect(() => {
        if (editingItem && activeCategory === 'PRICING') {
            if (units.length === 0) {
                fetchUnits();
            } else if (editingItem.unit) {
                // Check if unit exists in the list
                const unitExists = units.some(u => u.name === editingItem.unit && u.isActive);
                setUseCustomUnit(!unitExists);
            } else {
                setUseCustomUnit(false);
            }
        }
    }, [editingItem, activeCategory, units]);

    const fetchItems = async () => {
        // Check cache first
        const now = Date.now();
        const cached = catalogCache.get(activeCategory);
        if (cached && (now - cached.timestamp) < CATALOG_CACHE_TTL && hasLoadedCategory.has(activeCategory)) {
            setItems(cached.data);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const url = `/api/catalog?category=${activeCategory}`;
            const res = await fetch(url);
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const result = await res.json();
            if (result.success && Array.isArray(result.data)) {
                const fetchedItems = result.data || [];
                catalogCache.set(activeCategory, { data: fetchedItems, timestamp: now });
                setItems(fetchedItems);
                setHasLoadedCategory(prev => new Set(prev).add(activeCategory));
            } else {
                console.error('❌ API returned invalid data:', result);
                setItems([]);
            }
        } catch (err) {
            console.error('❌ Failed to fetch catalog:', err);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUnits = async () => {
        // Check cache first
        const now = Date.now();
        if (unitsCache && (now - unitsCache.timestamp) < UNITS_CACHE_TTL) {
            setUnits(unitsCache.data);
            setIsLoadingUnits(false);
            return;
        }

        setIsLoadingUnits(true);
        try {
            const res = await fetch('/api/units?activeOnly=false');
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const result = await res.json();
            if (result.success && Array.isArray(result.data)) {
                unitsCache = { data: result.data || [], timestamp: now };
                setUnits(result.data || []);
            } else {
                console.error('❌ API returned invalid data:', result);
                setUnits([]);
            }
        } catch (err) {
            console.error('❌ Failed to fetch units:', err);
            setUnits([]);
        } finally {
            setIsLoadingUnits(false);
        }
    };

    const handleSave = async () => {
        if (!editingItem?.title) return;

        const method = editingItem.id ? 'PUT' : 'POST';
        try {
            const res = await fetch('/api/catalog', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...editingItem, category: activeCategory }),
            });
            const result = await res.json();
            if (result.success) {
                // Invalidate cache for this category
                catalogCache.delete(activeCategory);
                setHasLoadedCategory(prev => {
                    const next = new Set(prev);
                    next.delete(activeCategory);
                    return next;
                });
                fetchItems();
                setEditingItem(null);
            }
        } catch (err) {
            console.error('Failed to save item:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa mục này?')) return;
        try {
            const res = await fetch(`/api/catalog?id=${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                // Invalidate cache for this category
                catalogCache.delete(activeCategory);
                setHasLoadedCategory(prev => {
                    const next = new Set(prev);
                    next.delete(activeCategory);
                    return next;
                });
                fetchItems();
            }
        } catch (err) {
            console.error('Failed to delete item:', err);
        }
    };

    const handleSaveUnit = async () => {
        if (!editingUnit?.name) return;

        const method = editingUnit.id ? 'PUT' : 'POST';
        try {
            const res = await fetch('/api/units', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUnit),
            });
            const result = await res.json();
            if (result.success) {
                // Invalidate cache
                unitsCache = null;
                fetchUnits();
                setEditingUnit(null);
            }
        } catch (err) {
            console.error('Failed to save unit:', err);
        }
    };

    const handleDeleteUnit = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa đơn vị này?')) return;
        try {
            const res = await fetch(`/api/units?id=${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                // Invalidate cache
                unitsCache = null;
                fetchUnits();
            }
        } catch (err) {
            console.error('Failed to delete unit:', err);
        }
    };

    // Filter items by search query
    const filteredItems = items.filter((item) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            item.title.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query) ||
            item.group?.toLowerCase().includes(query) ||
            item.unit?.toLowerCase().includes(query)
        );
    });

    // Group items by group field
    const groupedItems = filteredItems.reduce((acc, item) => {
        const groupName = item.group || 'Khác';
        if (!acc[groupName]) {
            acc[groupName] = [];
        }
        acc[groupName].push(item);
        return acc;
    }, {} as Record<string, CatalogItem[]>);

    // Sort groups and items within groups
    const sortedGroups = Object.keys(groupedItems).sort();
    sortedGroups.forEach((group) => {
        groupedItems[group].sort((a, b) => a.order - b.order);
    });

    return (
        <div className="h-full flex flex-col bg-zf-bg-tertiary p-8">
            <div className="max-w-5xl mx-auto w-full space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black text-zf-primary uppercase tracking-tight flex items-center gap-2">
                        <Database className="w-7 h-7 text-zf-text-secondary" />
                        Quản lý Danh mục (Master Data)
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchItems}
                            disabled={isLoading}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center gap-2"
                            title="Refresh dữ liệu"
                        >
                            <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        {activeCategory !== 'UNITS' ? (
                        <button
                            onClick={() => {
                                setEditingItem({ title: '', order: items.length });
                                setUseCustomUnit(false);
                            }}
                            className="px-6 py-2 bg-zf-accent text-white rounded-xl font-bold shadow-lg shadow-zf-accent/20 hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5 text-white" />
                            Thêm mục mới
                        </button>
                        ) : (
                            <button
                                onClick={() => setEditingUnit({ name: '', order: units.length, isActive: true })}
                                className="px-6 py-2 bg-zf-accent text-white rounded-xl font-bold shadow-lg shadow-zf-accent/20 hover:scale-105 transition-transform flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5 text-white" />
                                Thêm đơn vị mới
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Switcher */}
                <div className="flex p-1 bg-white rounded-2xl shadow-sm border border-zf-bg-secondary w-fit">
                    {(['PRICING', 'SCOPE', 'DELIVERABLES', 'UNITS'] as const).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeCategory === cat
                                    ? 'bg-zf-primary text-white shadow-md'
                                    : 'text-zf-text-secondary hover:bg-zf-bg-secondary'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                {cat === 'PRICING' ? (
                                    <>
                                        <DollarSign className={`w-4 h-4 ${activeCategory === cat ? 'text-white' : 'text-zf-text-secondary'}`} />
                                        Báo giá
                                    </>
                                ) : cat === 'SCOPE' ? (
                                    <>
                                        <Package className={`w-4 h-4 ${activeCategory === cat ? 'text-white' : 'text-zf-text-secondary'}`} />
                                        Phạm vi CV
                                    </>
                                ) : cat === 'DELIVERABLES' ? (
                                    <>
                                        <FileText className={`w-4 h-4 ${activeCategory === cat ? 'text-white' : 'text-zf-text-secondary'}`} />
                                        Sản phẩm bàn giao
                                    </>
                                ) : (
                                    <>
                                        <Ruler className={`w-4 h-4 ${activeCategory === cat ? 'text-white' : 'text-zf-text-secondary'}`} />
                                        Đơn vị
                                    </>
                                )}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search Box */}
                <div className="bg-white rounded-2xl shadow-sm border border-zf-bg-secondary p-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm theo tên, mô tả, nhóm hoặc đơn vị..."
                            className="w-full px-4 py-3 pl-12 bg-zf-bg-secondary border-none rounded-xl focus:ring-2 focus:ring-zf-accent text-zf-text-primary font-medium placeholder:text-zf-text-secondary"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zf-text-secondary" />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zf-text-secondary hover:text-zf-error transition-colors p-1"
                                title="Xóa tìm kiếm"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <div className="mt-2 text-sm text-zf-text-secondary">
                            Tìm thấy <span className="font-bold text-zf-accent">{filteredItems.length}</span> kết quả
                        </div>
                    )}
                </div>

                {/* Unit Editor Modal Overlay */}
                {editingUnit && (
                    <div className="fixed inset-0 bg-zf-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg space-y-6 border border-zf-bg-secondary">
                            <h3 className="text-xl font-black text-zf-primary uppercase">
                                {editingUnit.id ? 'Cập nhật' : 'Thêm mới'} Đơn vị
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zf-text-secondary uppercase mb-1.5 ml-1">Tên đơn vị *</label>
                                    <input
                                        type="text"
                                        value={editingUnit.name || ''}
                                        onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-zf-bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-zf-accent text-zf-text-primary font-medium"
                                        placeholder="VD: m², gói, bộ, giờ..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zf-text-secondary uppercase mb-1.5 ml-1">Ký hiệu</label>
                                    <input
                                        type="text"
                                        value={editingUnit.symbol || ''}
                                        onChange={(e) => setEditingUnit({ ...editingUnit, symbol: e.target.value })}
                                        className="w-full px-4 py-3 bg-zf-bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-zf-accent text-zf-text-primary font-medium"
                                        placeholder="Ký hiệu (nếu khác với tên)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zf-text-secondary uppercase mb-1.5 ml-1">Loại đơn vị</label>
                                    <select
                                        value={editingUnit.category || ''}
                                        onChange={(e) => setEditingUnit({ ...editingUnit, category: e.target.value || undefined })}
                                        className="w-full px-4 py-3 bg-zf-bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-zf-accent text-zf-text-primary font-medium"
                                    >
                                        <option value="">-- Chọn loại --</option>
                                        <option value="AREA">Diện tích</option>
                                        <option value="VOLUME">Thể tích</option>
                                        <option value="COUNT">Số lượng</option>
                                        <option value="TIME">Thời gian</option>
                                        <option value="PACKAGE">Gói</option>
                                        <option value="OTHER">Khác</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zf-text-secondary uppercase mb-1.5 ml-1">Mô tả</label>
                                    <textarea
                                        value={editingUnit.description || ''}
                                        onChange={(e) => setEditingUnit({ ...editingUnit, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-zf-bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-zf-accent text-zf-text-primary font-medium min-h-[80px]"
                                        placeholder="Mô tả về đơn vị..."
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingUnit.isActive !== undefined ? editingUnit.isActive : true}
                                            onChange={(e) => setEditingUnit({ ...editingUnit, isActive: e.target.checked })}
                                            className="w-5 h-5 rounded border-gray-300 text-zf-accent focus:ring-zf-accent"
                                        />
                                        <span className="text-sm font-medium text-zf-text-primary">Kích hoạt</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setEditingUnit(null)}
                                    className="flex-1 py-3 bg-zf-bg-tertiary text-zf-text-primary rounded-2xl font-bold hover:bg-zf-bg-secondary transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSaveUnit}
                                    className="flex-1 py-3 bg-zf-primary text-white rounded-2xl font-bold hover:bg-zf-primary-dark shadow-lg shadow-zf-primary/20 transition-all"
                                >
                                    Lưu lại
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Editor Modal Overlay */}
                {editingItem && (
                    <div className="fixed inset-0 bg-zf-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg space-y-6 border border-zf-bg-secondary">
                            <h3 className="text-xl font-black text-zf-primary uppercase">
                                {editingItem.id ? 'Cập nhật' : 'Thêm mới'} - {activeCategory}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zf-text-secondary uppercase mb-1.5 ml-1">Nội dung / Tên</label>
                                    <input
                                        type="text"
                                        value={editingItem.title}
                                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-zf-bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-zf-accent text-zf-text-primary font-medium"
                                        placeholder="Nhập nội dung..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zf-text-secondary uppercase mb-1.5 ml-1">Nhóm dịch vụ</label>
                                    <input
                                        type="text"
                                        value={editingItem.group || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, group: e.target.value })}
                                        className="w-full px-4 py-3 bg-zf-bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-zf-accent text-zf-text-primary font-medium"
                                        placeholder="VD: Mô hình BIM, Phân tích, Bản vẽ..."
                                    />
                                </div>

                                {activeCategory === 'PRICING' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-zf-text-secondary uppercase mb-1.5 ml-1">Đơn vị</label>
                                            {useCustomUnit || (!editingItem.unit && units.filter(u => u.isActive).length === 0) ? (
                                                <div className="space-y-2">
                                                    <input
                                                        type="text"
                                                        value={editingItem.unit || ''}
                                                        onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                                                        className="w-full px-4 py-3 bg-zf-bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-zf-accent text-zf-text-primary font-medium"
                                                        placeholder="Nhập đơn vị..."
                                                        autoFocus
                                                    />
                                                    {units.filter(u => u.isActive).length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setUseCustomUnit(false);
                                                                setEditingItem({ ...editingItem, unit: '' });
                                                            }}
                                                            className="text-xs text-zf-accent hover:underline"
                                                        >
                                                            Chọn từ danh sách
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="relative">
                                                        <select
                                                            value={editingItem.unit || ''}
                                                            onChange={(e) => {
                                                                if (e.target.value === '__CUSTOM__') {
                                                                    setUseCustomUnit(true);
                                                                    setEditingItem({ ...editingItem, unit: '' });
                                                                } else {
                                                                    setEditingItem({ ...editingItem, unit: e.target.value });
                                                                }
                                                            }}
                                                            className="w-full px-4 py-3 bg-zf-bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-zf-accent text-zf-text-primary font-medium appearance-none pr-10"
                                                        >
                                                            <option value="">-- Chọn đơn vị --</option>
                                                            {units.filter(u => u.isActive).map((unit) => (
                                                                <option key={unit.id} value={unit.name}>
                                                                    {unit.name} {unit.symbol && `(${unit.symbol})`}
                                                                </option>
                                                            ))}
                                                            <option value="__CUSTOM__">+ Nhập đơn vị tùy chỉnh</option>
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <svg className="w-5 h-5 text-zf-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zf-text-secondary uppercase mb-1.5 ml-1">Đơn giá mặc định</label>
                                            <input
                                                type="number"
                                                value={editingItem.defaultPrice || ''}
                                                onChange={(e) => setEditingItem({ ...editingItem, defaultPrice: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-3 bg-zf-bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-zf-accent text-zf-text-primary font-medium"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-zf-text-secondary uppercase mb-1.5 ml-1">Mô tả chi tiết (nếu có)</label>
                                    <textarea
                                        value={editingItem.description || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-zf-bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-zf-accent text-zf-text-primary font-medium min-h-[100px]"
                                        placeholder="Thông tin thêm..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setEditingItem(null)}
                                    className="flex-1 py-3 bg-zf-bg-tertiary text-zf-text-primary rounded-2xl font-bold hover:bg-zf-bg-secondary transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-3 bg-zf-primary text-white rounded-2xl font-bold hover:bg-zf-primary-dark shadow-lg shadow-zf-primary/20 transition-all"
                                >
                                    Lưu lại
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Items List */}
                {activeCategory === 'UNITS' ? (
                    isLoadingUnits ? (
                        <div className="p-12 text-center text-zf-text-secondary bg-white rounded-3xl border border-zf-bg-secondary">
                            Đang tải dữ liệu...
                        </div>
                    ) : units.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-zf-bg-tertiary">
                            <p className="text-zf-text-secondary italic">Chưa có đơn vị nào.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-zf-bg-secondary shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-zf-bg-secondary border-b border-zf-bg-tertiary">
                                        <tr>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-zf-text-secondary uppercase tracking-wider w-16">STT</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-zf-text-secondary uppercase tracking-wider">Tên đơn vị</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-zf-text-secondary uppercase tracking-wider">Ký hiệu</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-zf-text-secondary uppercase tracking-wider">Loại</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-zf-text-secondary uppercase tracking-wider">Mô tả</th>
                                            <th className="px-4 py-4 text-center text-xs font-bold text-zf-text-secondary uppercase tracking-wider w-32">Trạng thái</th>
                                            <th className="px-4 py-4 text-center text-xs font-bold text-zf-text-secondary uppercase tracking-wider w-32">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {units.map((unit, index) => (
                                            <tr key={unit.id} className="group hover:bg-zf-bg-tertiary/50 transition-colors">
                                                <td className="px-4 py-4 text-zf-text-secondary font-bold">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="font-bold text-zf-primary">{unit.name}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-zf-text-secondary font-medium">{unit.symbol || '-'}</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs px-2 py-1 bg-zf-bg-secondary rounded-lg text-zf-text-secondary">
                                                        {unit.category === 'AREA' ? 'Diện tích' :
                                                         unit.category === 'VOLUME' ? 'Thể tích' :
                                                         unit.category === 'COUNT' ? 'Số lượng' :
                                                         unit.category === 'TIME' ? 'Thời gian' :
                                                         unit.category === 'PACKAGE' ? 'Gói' :
                                                         unit.category === 'OTHER' ? 'Khác' : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm text-zf-text-secondary italic line-clamp-2">
                                                        {unit.description || '-'}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                                        unit.isActive 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {unit.isActive ? 'Kích hoạt' : 'Vô hiệu'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex gap-2 justify-center items-center">
                                                        <button
                                                            onClick={() => setEditingUnit(unit)}
                                                            className="p-2 bg-zf-bg-tertiary text-zf-text-secondary rounded-lg hover:bg-zf-primary hover:text-white transition-all"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Pencil className="w-4 h-4 text-current" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUnit(unit.id)}
                                                            className="p-2 bg-zf-bg-tertiary text-zf-text-secondary rounded-lg hover:bg-zf-error hover:text-white transition-all"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-current" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : isLoading ? (
                    <div className="p-12 text-center text-zf-text-secondary bg-white rounded-3xl border border-zf-bg-secondary">
                        Đang tải dữ liệu...
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-zf-bg-tertiary">
                        <p className="text-zf-text-secondary italic">Chưa có dữ liệu cho mục này.</p>
                    </div>
                ) : activeCategory === 'PRICING' ? (
                    // Table view for PRICING category with groups
                    <div className="bg-white rounded-3xl border border-zf-bg-secondary shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zf-bg-secondary border-b border-zf-bg-tertiary">
                                    <tr>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-zf-text-secondary uppercase tracking-wider w-16">STT</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-zf-text-secondary uppercase tracking-wider">Tên dịch vụ</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold text-zf-text-secondary uppercase tracking-wider w-32">Đơn vị</th>
                                        <th className="px-4 py-4 text-right text-xs font-bold text-zf-text-secondary uppercase tracking-wider w-40">Đơn giá (VNĐ)</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-zf-text-secondary uppercase tracking-wider">Mô tả</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold text-zf-text-secondary uppercase tracking-wider w-32">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sortedGroups.map((groupName, groupIndex) => {
                                        const groupItems = groupedItems[groupName];
                                        let itemIndex = 0;
                                        
                                        // Calculate starting index for this group
                                        sortedGroups.slice(0, groupIndex).forEach((prevGroup) => {
                                            itemIndex += groupedItems[prevGroup].length;
                                        });

                                        return (
                                            <React.Fragment key={groupName}>
                                                {/* Group Header */}
                                                <tr className="bg-slate-50 border-t-2 border-zf-primary">
                                                    <td colSpan={6} className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <FolderOpen className="w-5 h-5 text-zf-text-secondary" />
                                                            <span className="text-lg font-black text-zf-primary uppercase">
                                                                {groupName}
                                                            </span>
                                                            <span className="text-xs text-zf-text-secondary font-medium">
                                                                ({groupItems.length} dịch vụ)
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* Group Items */}
                                                {groupItems.map((item, idx) => {
                                                    const globalIndex = itemIndex + idx;
                                                    return (
                                                        <tr key={item.id} className="group hover:bg-zf-bg-tertiary/50 transition-colors">
                                                            <td className="px-4 py-4 text-zf-text-secondary font-bold">
                                                                {globalIndex + 1}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="font-bold text-zf-primary">{item.title}</div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="text-zf-text-secondary font-medium">{item.unit || '-'}</span>
                                                            </td>
                                                            <td className="px-4 py-4 text-right">
                                                                <span className="font-bold text-zf-accent">
                                                                    {item.defaultPrice ? formatVND(item.defaultPrice) : '-'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <p className="text-sm text-zf-text-secondary italic line-clamp-2">
                                                                    {item.description || '-'}
                                                                </p>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex gap-2 justify-center items-center">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingItem(item);
                                                                            setUseCustomUnit(false);
                                                                        }}
                                                                        className="p-2 bg-zf-bg-tertiary text-zf-text-secondary rounded-lg hover:bg-zf-primary hover:text-white transition-all"
                                                                        title="Chỉnh sửa"
                                                                    >
                                                                        <Pencil className="w-4 h-4 text-current" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(item.id)}
                                                                        className="p-2 bg-zf-bg-tertiary text-zf-text-secondary rounded-lg hover:bg-zf-error hover:text-white transition-all"
                                                                        title="Xóa"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 text-current" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    // Card view for SCOPE and DELIVERABLES categories
                    <div className="grid gap-4">
                        {filteredItems.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-3xl shadow-sm border border-zf-bg-secondary flex justify-between items-center group hover:shadow-md transition-all">
                                <div>
                                    <h4 className="font-bold text-zf-primary text-lg">{item.title}</h4>
                                    {item.description && <p className="text-sm text-zf-text-secondary mt-2 italic">{item.description}</p>}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setEditingItem(item);
                                            setUseCustomUnit(false);
                                        }}
                                        className="p-2.5 bg-zf-bg-tertiary text-zf-text-secondary rounded-xl hover:bg-zf-primary hover:text-white transition-all"
                                        title="Chỉnh sửa"
                                    >
                                        <Pencil className="w-4 h-4 text-current" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2.5 bg-zf-bg-tertiary text-zf-text-secondary rounded-xl hover:bg-zf-error hover:text-white transition-all"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-4 h-4 text-current" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
