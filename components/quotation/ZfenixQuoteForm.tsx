'use client';

import React, { useState, ChangeEvent } from 'react';
import {
    FileDown,
    Settings,
    FileText,
    Edit2,
    Save,
    X,
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';

type PriceType = 'fixed' | 'area' | 'none';
type ItemType = 'section' | 'category' | 'item';

interface WorkItem {
    id: string;
    code: string;
    name: string;
    type: ItemType;
    children?: WorkItem[];
    priceType?: PriceType;
    price?: number;
    quantity?: number;
    unit?: string;
    note?: string;
}

interface ProjectInfo {
    projectName: string;
    scope: string;
    includeScope: string;
    totalArea: number;
    quoteDate: string; // ISO date string (yyyy-mm-dd)
    location: string;
    vatRate: number;
}

interface CustomerInfo {
    companyName: string;
}

interface PaymentMilestone {
    stage: string;
    percentage: number;
}

const DEFAULT_WORK_SCOPE: WorkItem[] = [
    {
        id: 'section-a',
        code: 'A',
        name: 'PHẠM VI CÔNG VIỆC',
        type: 'section',
        children: [
            {
                id: 'item-1',
                code: '1',
                name: 'Thiết lập và quản lý quy trình BIM',
                type: 'category',
                children: [
                    {
                        id: 'item-1.1',
                        code: '1.1',
                        name: 'Xây dựng BIM Execution Plan (BEP)',
                        type: 'item',
                        priceType: 'fixed',
                        price: 30_000_000,
                        quantity: 1,
                        unit: 'cv',
                        note: '',
                    },
                ],
            },
        ],
    },
];

function ZfenixQuoteForm() {
    const [activeTab, setActiveTab] = useState<'data' | 'preview'>('data');
    const [workScope, setWorkScope] = useState<WorkItem[]>(DEFAULT_WORK_SCOPE);
    const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({ 'item-1': true });
    const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
        projectName: 'Chung cư 29-4 Hải Phòng',
        scope: 'Triển khai mô hình BIM LOD 200-300',
        includeScope: 'Xây dựng',
        totalArea: 87_750,
        quoteDate: new Date().toISOString().split('T')[0],
        location: 'Hà Nội',
        vatRate: 8,
    });
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
        companyName: 'Công ty Gamuda',
    });
    const [deliverables, setDeliverables] = useState<string[]>([
        'Mô hình BIM LOD 350',
        'Mô hình cốt thép',
        'Bản vẽ shopdrawing',
        'Bảng khối lượng QTO',
        'Dữ liệu Asset Data',
    ]);
    const [paymentSchedule, setPaymentSchedule] = useState<PaymentMilestone[]>([
        { stage: 'Tạm ứng 30%', percentage: 30 },
        { stage: 'Thanh toán đợt 1: 40%', percentage: 40 },
        { stage: 'Thanh toán đợt 2: 30%', percentage: 30 },
    ]);

    const formatCurrency = (amount: number): string =>
        new Intl.NumberFormat('vi-VN').format(Math.round(amount));

    const calculateItemTotal = (item: WorkItem): number => {
        if (item.priceType === 'none') return 0;
        if (item.priceType === 'fixed') return (item.price || 0) * (item.quantity || 1);
        if (item.priceType === 'area') return (item.price || 0) * projectInfo.totalArea;
        return 0;
    };

    const calculateCategoryTotal = (item: WorkItem): number => {
        if (item.type === 'item') return calculateItemTotal(item);
        if (item.children) return item.children.reduce((sum, child) => sum + calculateCategoryTotal(child), 0);
        return 0;
    };

    const calculateSectionATotal = (): number => {
        const sectionA = workScope.find((s) => s.code === 'A');
        return sectionA && sectionA.children
            ? sectionA.children.reduce((sum, item) => sum + calculateCategoryTotal(item), 0)
            : 0;
    };

    const calculateVAT = (): number => calculateSectionATotal() * (projectInfo.vatRate / 100);
    const calculateGrandTotal = (): number => calculateSectionATotal() + calculateVAT();

    const toggleExpand = (id: string) =>
        setExpandedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));

    const updateWorkScopeItem = (
        items: WorkItem[],
        itemId: string,
        updates: Partial<WorkItem>,
    ): WorkItem[] => {
        return items.map((item) => {
            if (item.id === itemId) return { ...item, ...updates };
            if (item.children) {
                return {
                    ...item,
                    children: updateWorkScopeItem(item.children, itemId, updates),
                };
            }
            return item;
        });
    };

    const deleteWorkScopeItem = (items: WorkItem[], itemId: string): WorkItem[] => {
        return items
            .filter((item) => item.id !== itemId)
            .map((item) => {
                if (item.children) {
                    return {
                        ...item,
                        children: deleteWorkScopeItem(item.children, itemId),
                    };
                }
                return item;
            });
    };

    const addChildItem = (items: WorkItem[], parentId: string, newItem: WorkItem): WorkItem[] => {
        return items.map((item) => {
            if (item.id === parentId) {
                return {
                    ...item,
                    children: [...(item.children || []), newItem],
                };
            }
            if (item.children) {
                return {
                    ...item,
                    children: addChildItem(item.children, parentId, newItem),
                };
            }
            return item;
        });
    };

    const handleAddCategory = () => {
        const rootSection = workScope[0];
        const newCode = ((rootSection.children?.length || 0) + 1).toString();
        const newCategory: WorkItem = {
            id: `item-${Date.now()}`,
            code: newCode,
            name: 'Hạng mục mới',
            type: 'category',
            children: [],
        };

        setWorkScope((prev) => {
            const section = { ...prev[0] };
            section.children = [...(section.children || []), newCategory];
            return [section];
        });
    };

    const handleAddItem = (parentId: string) => {
        const newItem: WorkItem = {
            id: `item-${Date.now()}`,
            code: '',
            name: 'Công việc mới',
            type: 'item',
            priceType: 'fixed',
            price: 0,
            quantity: 1,
            unit: 'cv',
            note: '',
        };

        setWorkScope((prev) => addChildItem(prev, parentId, newItem));
        setExpandedItems((prev) => ({
            ...prev,
            [parentId]: true,
        }));
    };

    const handleEditingFieldChange = (
        field: keyof WorkItem,
        value: string | number | undefined,
    ) => {
        setEditingItem((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleProjectInfoChange = (
        field: keyof ProjectInfo,
        value: string | number,
    ) => {
        setProjectInfo((prev) => ({
            ...prev,
            [field]:
                field === 'totalArea' || field === 'vatRate'
                    ? typeof value === 'number'
                        ? value
                        : parseFloat(String(value)) || 0
                    : value,
        }));
    };

    const renderDataItem = (item: WorkItem, level = 0): React.ReactElement | null => {
        const indent = level * 20;
        const isEditing = editingItem?.id === item.id;
        const isExpanded = expandedItems[item.id];

        if (item.type === 'section') {
            return (
                <div key={item.id}>
                    {item.children?.map((child) => renderDataItem(child, level))}
                    <button
                        type="button"
                        onClick={handleAddCategory}
                        className="mt-3 flex items-center gap-2 px-4 py-2 text-white rounded text-sm bg-zf-accent hover:bg-zf-accent-dark transition-colors"
                    >
                        <Plus size={16} />
                        Thêm hạng mục
                    </button>
                </div>
            );
        }

        if (item.type === 'category') {
            return (
                <div
                    key={item.id}
                    className="mb-3"
                    style={{ marginLeft: `${indent}px` }}
                >
                    <div className="bg-gray-100 border-l-4 rounded p-2 border-zf-accent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                                <button
                                    type="button"
                                    onClick={() => toggleExpand(item.id)}
                                    className="p-1"
                                    aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                                >
                                    {isExpanded ? (
                                        <ChevronDown size={18} />
                                    ) : (
                                        <ChevronRight size={18} />
                                    )}
                                </button>
                                {isEditing && editingItem ? (
                                    <div className="flex gap-2 flex-1">
                                        <input
                                            type="text"
                                            value={editingItem.code}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                handleEditingFieldChange('code', e.target.value)
                                            }
                                            className="w-20 px-2 py-1 text-sm border rounded"
                                            aria-label="Mã hạng mục"
                                            placeholder="Mã"
                                        />
                                        <input
                                            type="text"
                                            value={editingItem.name}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                handleEditingFieldChange('name', e.target.value)
                                            }
                                            className="flex-1 px-2 py-1 text-sm border rounded"
                                            aria-label="Tên hạng mục"
                                            placeholder="Tên hạng mục"
                                        />
                                    </div>
                                ) : (
                                    <span className="font-semibold">
                                        {item.code}. {item.name}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {isEditing && editingItem ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setWorkScope((prev) =>
                                                    updateWorkScopeItem(prev, editingItem.id, editingItem),
                                                );
                                                setEditingItem(null);
                                            }}
                                            className="p-1 text-green-600 hover:text-green-700"
                                            aria-label="Lưu"
                                        >
                                            <Save size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingItem(null)}
                                            className="p-1 text-gray-600 hover:text-gray-800"
                                            aria-label="Hủy"
                                        >
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setEditingItem({ ...item })}
                                            className="p-1 text-blue-600 hover:text-blue-700"
                                            aria-label="Chỉnh sửa hạng mục"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAddItem(item.id)}
                                            className="p-1 text-green-600 hover:text-green-700"
                                            aria-label="Thêm công việc"
                                        >
                                            <Plus size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setWorkScope((prev) =>
                                                    deleteWorkScopeItem(prev, item.id),
                                                )
                                            }
                                            className="p-1 text-red-600 hover:text-red-700"
                                            aria-label="Xóa hạng mục"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {isExpanded && item.children && (
                        <div className="mt-2">
                            {item.children.map((child) =>
                                renderDataItem(child, level + 1),
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // item.type === 'item'
        return (
            <div
                key={item.id}
                className="mb-2"
                style={{ marginLeft: `${indent}px` }}
            >
                {isEditing && editingItem ? (
                    <div className="bg-white border-2 border-blue-300 rounded p-3">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <input
                                type="text"
                                placeholder="Mã"
                                value={editingItem.code}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    handleEditingFieldChange('code', e.target.value)
                                }
                                className="px-2 py-1 text-sm border rounded"
                            />
                            <select
                                value={editingItem.priceType || 'fixed'}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                    handleEditingFieldChange(
                                        'priceType',
                                        e.target.value as PriceType,
                                    )
                                }
                                className="px-2 py-1 text-sm border rounded"
                                aria-label="Loại đơn giá"
                                title="Loại đơn giá"
                            >
                                <option value="fixed">Đơn giá cố định</option>
                                <option value="area">Tính theo m²</option>
                                <option value="none">Không tính tiền</option>
                            </select>
                        </div>
                        <input
                            type="text"
                            placeholder="Tên công việc"
                            value={editingItem.name}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleEditingFieldChange('name', e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm border rounded mb-2"
                        />
                        {editingItem.priceType !== 'none' && (
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                <input
                                    type="number"
                                    placeholder="Đơn giá"
                                    value={editingItem.price ?? 0}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        handleEditingFieldChange(
                                            'price',
                                            parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    className="px-2 py-1 text-sm border rounded"
                                />
                                {editingItem.priceType === 'fixed' && (
                                    <input
                                        type="number"
                                        value={editingItem.quantity ?? 1}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            handleEditingFieldChange(
                                                'quantity',
                                                parseInt(e.target.value, 10) || 1,
                                            )
                                        }
                                        className="px-2 py-1 text-sm border rounded"
                                        aria-label="Số lượng"
                                        placeholder="Số lượng"
                                    />
                                )}
                                <input
                                    type="text"
                                    placeholder="Đơn vị"
                                    value={editingItem.unit ?? ''}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        handleEditingFieldChange('unit', e.target.value)
                                    }
                                    className="px-2 py-1 text-sm border rounded"
                                />
                            </div>
                        )}
                        <input
                            type="text"
                            placeholder="Ghi chú"
                            value={editingItem.note ?? ''}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleEditingFieldChange('note', e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm border rounded mb-2"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setWorkScope((prev) =>
                                        updateWorkScopeItem(prev, editingItem.id, editingItem),
                                    );
                                    setEditingItem(null);
                                }}
                                className="px-3 py-1 text-sm text-white rounded bg-zf-accent hover:bg-zf-accent-dark"
                            >
                                Lưu
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="px-3 py-1 text-sm bg-gray-500 text-white rounded"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border rounded p-2 hover:border-zf-accent/70">
                        <div className="flex justify-between">
                            <div className="flex-1">
                                <div className="text-sm font-medium">
                                    {item.code}. {item.name}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {item.priceType === 'none' ? (
                                        <span className="italic">Không tính tiền</span>
                                    ) : (
                                        <>
                                            <span>
                                                {formatCurrency(item.price || 0)}
                                            </span>
                                            {item.priceType === 'area' && (
                                                <span>/m²</span>
                                            )}
                                            {item.priceType === 'fixed' && (
                                                <span> × {item.quantity || 1}</span>
                                            )}
                                            <span className="ml-2 text-green-700 font-semibold">
                                                =
                                                {' '}
                                                {formatCurrency(
                                                    calculateItemTotal(item),
                                                )}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1 ml-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingItem({ ...item })}
                                    className="p-1 text-blue-600 hover:text-blue-700"
                                    aria-label="Chỉnh sửa công việc"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setWorkScope((prev) =>
                                            deleteWorkScopeItem(prev, item.id),
                                        )
                                    }
                                    className="p-1 text-red-600 hover:text-red-700"
                                    aria-label="Xóa công việc"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderPreviewRows = (item: WorkItem, rows: React.ReactElement[] = []): React.ReactElement[] => {
        if (item.type === 'section' || item.type === 'category') {
            rows.push(
                <tr key={item.id} className="font-bold bg-gray-100">
                    <td className="py-2 px-2 border text-sm">{item.code}</td>
                    <td className="py-2 px-2 border text-sm" colSpan={3}>
                        {item.name}
                    </td>
                    <td className="py-2 px-2 border text-sm text-right">
                        {formatCurrency(calculateCategoryTotal(item))}
                    </td>
                    <td className="py-2 px-2 border text-sm" />
                </tr>,
            );
            if (item.children) {
                item.children.forEach((child) => renderPreviewRows(child, rows));
            }
        } else if (item.type === 'item') {
            const total = calculateItemTotal(item);
            const qty =
                item.priceType === 'area'
                    ? projectInfo.totalArea
                    : item.quantity || 1;
            rows.push(
                <tr key={item.id}>
                    <td className="py-2 px-2 border text-xs">{item.code}</td>
                    <td className="py-2 px-2 border text-xs">{item.name}</td>
                    <td className="py-2 px-2 border text-xs text-center">
                        {item.priceType === 'none' ? '-' : qty}
                    </td>
                    <td className="py-2 px-2 border text-xs text-right">
                        {item.priceType === 'none'
                            ? '-'
                            : formatCurrency(item.price || 0)}
                    </td>
                    <td className="py-2 px-2 border text-xs text-right">
                        {item.priceType === 'none' ? '-' : formatCurrency(total)}
                    </td>
                    <td className="py-2 px-2 border text-xs">
                        {item.note || ''}
                    </td>
                </tr>,
            );
        }
        return rows;
    };

    return (
        <div className="min-h-screen bg-zf-bg-secondary">
            <style>
                {`@media print {
  body * { visibility: hidden; }
  #printArea, #printArea * { visibility: visible; }
  #printArea { position: absolute; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
}`}
            </style>
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow p-6 mb-6 border-t-4 border-zf-accent">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-zf-primary">
                                ZFENIX
                            </h1>
                            <p className="text-gray-600 text-sm">
                                Hệ thống Báo giá BIM – Mẫu form nhanh (prototype)
                            </p>
                        </div>
                        <div className="flex gap-3 no-print">
                            <button
                                type="button"
                                onClick={() => setActiveTab('data')}
                                className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
                                    activeTab === 'data'
                                        ? 'bg-zf-accent text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                <Settings size={18} />
                                Dữ liệu
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('preview')}
                                className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
                                    activeTab === 'preview'
                                        ? 'bg-zf-primary text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                <FileText size={18} />
                                Xem trước
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'data' && (
                    <div className="space-y-4 no-print">
                        {/* Thông tin dự án */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4 text-zf-primary">
                                I. Thông tin dự án
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Tên dự án
                                    </label>
                                    <input
                                        type="text"
                                        value={projectInfo.projectName}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            handleProjectInfoChange(
                                                'projectName',
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border rounded text-sm"
                                        aria-label="Tên dự án"
                                        placeholder="Nhập tên dự án"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Khách hàng
                                    </label>
                                    <input
                                        type="text"
                                        value={customerInfo.companyName}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            setCustomerInfo({
                                                companyName: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border rounded text-sm"
                                        aria-label="Khách hàng"
                                        placeholder="Nhập tên khách hàng"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Diện tích (m²)
                                    </label>
                                    <input
                                        type="number"
                                        value={projectInfo.totalArea}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            handleProjectInfoChange(
                                                'totalArea',
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border rounded text-sm"
                                        aria-label="Diện tích (m²)"
                                        placeholder="Nhập diện tích"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        VAT (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={projectInfo.vatRate}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            handleProjectInfoChange(
                                                'vatRate',
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border rounded text-sm"
                                        aria-label="VAT (%)"
                                        placeholder="Nhập % VAT"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sản phẩm bàn giao */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4 text-zf-primary">
                                III. Sản phẩm bàn giao
                            </h2>
                            {deliverables.map((item, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            const next = [...deliverables];
                                            next[idx] = e.target.value;
                                            setDeliverables(next);
                                        }}
                                        className="flex-1 px-3 py-2 border rounded text-sm"
                                        aria-label={`Sản phẩm bàn giao ${idx + 1}`}
                                        placeholder="Nhập sản phẩm bàn giao"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDeliverables(
                                                deliverables.filter(
                                                    (_, i) => i !== idx,
                                                ),
                                            )
                                        }
                                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                        aria-label="Xóa sản phẩm"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() =>
                                    setDeliverables([
                                        ...deliverables,
                                        'Sản phẩm mới',
                                    ])
                                }
                                className="mt-2 flex items-center gap-2 px-4 py-2 text-sm text-zf-accent hover:text-zf-accent-dark"
                            >
                                <Plus size={16} />
                                Thêm sản phẩm
                            </button>
                        </div>

                        {/* Phạm vi công việc */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4 text-zf-primary">
                                IV. Phạm vi công việc
                            </h2>
                            {workScope.map((section) => renderDataItem(section, 0))}
                        </div>

                        {/* Tổng quan */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4 text-zf-primary">
                                Tổng quan chi phí
                            </h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Tổng (chưa VAT):</span>
                                    <span className="font-semibold">
                                        {formatCurrency(calculateSectionATotal())}
                                        {' '}
                                        VNĐ
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>
                                        VAT (
                                        {projectInfo.vatRate}
                                        %):
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(calculateVAT())}
                                        {' '}
                                        VNĐ
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t-2 text-xl font-bold text-zf-primary">
                                    <span>TỔNG:</span>
                                    <span>
                                        {formatCurrency(calculateGrandTotal())}
                                        {' '}
                                        VNĐ
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'preview' && (
                    <div>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="mb-4 no-print flex items-center gap-2 px-6 py-3 text-white rounded bg-zf-primary hover:bg-zf-primary-dark"
                        >
                            <FileDown size={20} />
                            Xuất PDF (In)
                        </button>
                        <div id="printArea" className="bg-white p-8 shadow rounded">
                            <div className="text-right text-sm mb-6 italic">
                                {projectInfo.location}
                                ,{' '}
                                {projectInfo.quoteDate}
                            </div>
                            <h1 className="text-center text-2xl font-bold mb-8 text-zf-primary">
                                BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM
                            </h1>
                            <div className="mb-6 text-sm">
                                Chúng tôi xin trân trọng cảm ơn Quý Công ty đã tin
                                tưởng và mời chúng tôi tham gia chào giá dịch vụ tư
                                vấn tạo lập mô hình BIM.
                            </div>
                            <div className="mb-6">
                                <h3 className="font-bold mb-2 text-zf-primary">
                                    I. THÔNG TIN DỰ ÁN
                                </h3>
                                <div className="ml-4 text-sm">
                                    <p>
                                        - Dự án:
                                        {' '}
                                        {projectInfo.projectName}
                                    </p>
                                    <p>
                                        - Hạng mục:
                                        {' '}
                                        {projectInfo.scope}
                                    </p>
                                </div>
                            </div>
                            <div className="mb-6">
                                <h3 className="font-bold mb-2 text-zf-primary">
                                    II. PHẠM VI CÔNG VIỆC
                                </h3>
                                <div className="ml-4 text-sm">
                                    <p>
                                        Bao gồm:
                                        {' '}
                                        {projectInfo.includeScope}
                                    </p>
                                </div>
                            </div>
                            <div className="mb-6">
                                <h3 className="font-bold mb-2 text-zf-primary">
                                    III. SẢN PHẨM BÀN GIAO
                                </h3>
                                <ul className="ml-8 text-sm list-disc">
                                    {deliverables.map((d, i) => (
                                        <li key={i}>{d}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mb-6">
                                <h3 className="font-bold mb-2 text-zf-primary">
                                    IV. CHI TIẾT ĐƠN GIÁ
                                </h3>
                                <table className="w-full text-sm border border-gray-300 border-collapse">
                                    <thead>
                                        <tr className="bg-gray-200">
                                            <th className="py-2 px-2 border text-xs">
                                                TT
                                            </th>
                                            <th className="py-2 px-2 border text-xs">
                                                NỘI DUNG
                                            </th>
                                            <th className="py-2 px-2 border text-xs">
                                                KL
                                            </th>
                                            <th className="py-2 px-2 border text-xs">
                                                ĐƠN GIÁ
                                            </th>
                                            <th className="py-2 px-2 border text-xs">
                                                THÀNH TIỀN
                                            </th>
                                            <th className="py-2 px-2 border text-xs">
                                                GHI CHÚ
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workScope.map((s) =>
                                            s.children?.reduce<React.ReactElement[]>(
                                                (rows, cat) =>
                                                    renderPreviewRows(cat, rows),
                                                [],
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mb-6">
                                <h3 className="font-bold mb-2 text-zf-primary">
                                    B. BÁO GIÁ
                                </h3>
                                <table className="w-full text-sm border border-gray-300 border-collapse">
                                    <tbody>
                                        <tr>
                                            <td className="py-2 px-3 border font-bold">
                                                TỔNG CỘNG (CHƯA VAT)
                                            </td>
                                            <td className="py-2 px-3 border text-right font-bold">
                                                {formatCurrency(
                                                    calculateSectionATotal(),
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 px-3 border">
                                                VAT (
                                                {projectInfo.vatRate}
                                                %)
                                            </td>
                                            <td className="py-2 px-3 border text-right">
                                                {formatCurrency(calculateVAT())}
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-100">
                                            <td className="py-2 px-3 border font-bold">
                                                TỔNG CỘNG (ĐÃ VAT)
                                            </td>
                                            <td className="py-2 px-3 border text-right font-bold">
                                                {formatCurrency(
                                                    calculateGrandTotal(),
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="text-center text-sm italic mt-12">
                                Thay mặt đơn vị triển khai xin trân trọng cảm ơn và
                                mong muốn có cơ hội hợp tác với Quý Công ty.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ZfenixQuoteForm;

