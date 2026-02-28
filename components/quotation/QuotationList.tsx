'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { type QuotationListItem, type QuotationStatus } from '@/types/quotation';
import TechnicalBadge from '@/components/technical/TechnicalBadge';
import GroupTool, { type GroupConfig } from '@/components/ui/GroupTool';
import {
    groupAndSort,
    getQuotationFieldValue,
    getQuotationFieldLabel,
    type GroupedData,
} from '@/lib/utils/group-sort';

type FetchState<T> =
    | { status: 'idle' | 'loading'; data: null; error: null }
    | { status: 'success'; data: T; error: null }
    | { status: 'error'; data: null; error: string };

const STATUS_LABEL: Record<QuotationStatus, string> = {
    DRAFT: 'Nháp',
    SENT: 'Đã gửi',
    ACCEPTED: 'Khách chấp nhận',
    REJECTED: 'Từ chối',
};

// Status badge classes removed - using TechnicalBadge component instead

export default function QuotationList() {
    const router = useRouter();
    const [items, setItems] = useState<QuotationListItem[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'ALL'>('ALL');
    const [search, setSearch] = useState('');
    const [fetchState, setFetchState] = useState<FetchState<void>>({
        status: 'idle',
        data: null,
        error: null,
    });
    const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
    const [groupConfig, setGroupConfig] = useState<GroupConfig | null>(null);
    const [activeTab, setActiveTab] = useState<'group' | 'subtasks' | 'columns'>('group');

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setFetchState({ status: 'loading', data: null, error: null });

            try {
                const params = new URLSearchParams();
                params.set('page', page.toString());
                params.set('pageSize', pageSize.toString());
                if (statusFilter !== 'ALL') {
                    params.set('status', statusFilter);
                }
                if (search.trim()) {
                    params.set('search', search.trim());
                }

                const res = await fetch(`/api/quotations?${params.toString()}`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                const result = await res.json();

                if (!res.ok || !result.success) {
                    throw new Error(result.error || 'Không thể tải danh sách báo giá');
                }

                const data = (result.data ?? []) as any[];
                const mapped: QuotationListItem[] = data.map((q) => ({
                    id: q.id,
                    quotationNo: q.quotationNo,
                    date: q.date ? new Date(q.date) : new Date(),
                    customer: {
                        id: q.customer?.id ?? '',
                        name: q.customer?.name ?? 'Không xác định',
                    },
                    projectName: q.projectName ?? '',
                    totalBeforeVat: q.totalBeforeVat ?? 0,
                    totalAfterVat: q.totalAfterVat ?? 0,
                    status: q.status as QuotationStatus,
                    updatedAt: q.updatedAt ? new Date(q.updatedAt) : new Date(),
                }));

                setItems(mapped);
                const pagination = result.pagination;
                if (pagination) {
                    setTotalPages(pagination.totalPages ?? 1);
                } else {
                    setTotalPages(1);
                }

                setFetchState({ status: 'success', data: undefined, error: null });
            } catch (error) {
                if ((error as any).name === 'AbortError') return;
                const message =
                    error instanceof Error ? error.message : 'Không thể tải danh sách báo giá';
                setFetchState({ status: 'error', data: null, error: message });
            }
        };

        void load();

        return () => {
            controller.abort();
        };
    }, [page, pageSize, statusFilter, search]);

    const isLoading = fetchState.status === 'loading' && items.length === 0;

    // Group và sort items
    const groupedItems = useMemo(() => {
        if (!groupConfig || groupConfig.field === 'none') {
            return [
                {
                    groupKey: 'all',
                    groupLabel: 'Tất cả',
                    items: items,
                },
            ];
        }
        return groupAndSort(
            items,
            groupConfig,
            (item, field) => getQuotationFieldValue(item, field),
            (field, value) => getQuotationFieldLabel(field, value)
        );
    }, [items, groupConfig]);

    const handleDuplicate = async (id: string) => {
        setDuplicatingId(id);
        try {
            const res = await fetch(`/api/quotations/${id}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await res.json();

            if (!res.ok || !result.success || !result.data?.id) {
                throw new Error(result.error || 'Không thể nhân bản báo giá');
            }

            router.push(`/quotations/${result.data.id}/edit`);
        } catch (error) {
            console.error('Failed to duplicate quotation:', error);
            alert('Không thể nhân bản báo giá. Vui lòng thử lại.');
        } finally {
            setDuplicatingId(null);
        }
    };

    const availableFields = [
        { value: 'none' as const, label: 'Không nhóm' },
        { value: 'status' as const, label: 'Trạng thái' },
        { value: 'customer' as const, label: 'Khách hàng' },
        { value: 'date' as const, label: 'Ngày' },
        { value: 'project' as const, label: 'Dự án' },
    ];

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Group Tool */}
            <div className="px-4 pt-3">
                <GroupTool
                    activeTab={activeTab}
                    groupConfig={groupConfig || undefined}
                    availableFields={availableFields}
                    onTabChange={setActiveTab}
                    onGroupChange={setGroupConfig}
                />
            </div>

            <div className="px-4 pt-3 pb-3 flex items-center justify-end gap-3">
                    <input
                        aria-label="Tìm kiếm báo giá"
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm min-w-[220px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tìm theo số BG, dự án, khách hàng..."
                        value={search}
                        onChange={(e) => {
                            setPage(1);
                            setSearch(e.target.value);
                        }}
                    />
                    <select
                        aria-label="Lọc theo trạng thái báo giá"
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={statusFilter}
                        onChange={(e) => {
                            setPage(1);
                            setStatusFilter(e.target.value as QuotationStatus | 'ALL');
                        }}
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="DRAFT">Nháp</option>
                        <option value="SENT">Đã gửi</option>
                        <option value="ACCEPTED">Khách chấp nhận</option>
                        <option value="REJECTED">Từ chối</option>
                    </select>
            </div>

            {fetchState.status === 'error' && (
                <div className="px-6 pb-4">
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                        {fetchState.error}
                    </div>
                </div>
            )}

            <div className="px-6 pb-6 flex-1 overflow-auto">
                <div className="bg-white rounded-xl shadow-sm border-technical overflow-hidden technical-grid-hover">
                    <table className="min-w-full text-left text-sm border-technical">
                        <thead className="bg-zf-primary border-b border-zf-graphite/15">
                            <tr>
                                <th className="px-4 py-3 text-xs font-medium text-white uppercase tracking-wider">Số BG</th>
                                <th className="px-4 py-3 text-xs font-medium text-white uppercase tracking-wider">Dự án</th>
                                <th className="px-4 py-3 text-xs font-medium text-white uppercase tracking-wider">
                                    Khách hàng
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-white uppercase tracking-wider">Trạng thái</th>
                                <th className="px-4 py-3 text-xs font-medium text-white uppercase tracking-wider text-right">
                                    Giá trị (sau VAT)
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-white uppercase tracking-wider">
                                    Cập nhật
                                </th>
                                <th className="px-4 py-3 text-xs font-medium text-white uppercase tracking-wider text-right">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-6 text-center text-sm text-slate-500"
                                    >
                                        Đang tải danh sách báo giá...
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-6 text-center text-sm text-slate-500"
                                    >
                                        Không có báo giá nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                groupedItems.map((group) => (
                                    <React.Fragment key={group.groupKey}>
                                        {groupConfig && groupConfig.field !== 'none' && (
                                            <tr className="bg-gray-100 border-t border-b border-zf-graphite/20">
                                                <td colSpan={7} className="px-4 py-2">
                                                    <div className="font-semibold text-sm text-zf-graphite">
                                                        {group.groupLabel} ({group.items.length})
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {group.items.map((q) => (
                                            <tr key={q.id} className="border-t border-zf-graphite/10 hover:bg-zf-bg-secondary">
                                                <td className="px-4 py-3 align-middle">
                                                    <div className="font-technical text-technical-primary">
                                                        <span className="technical-code">{q.quotationNo}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 align-middle">
                                                    <div className="text-zf-graphite">{q.projectName}</div>
                                                </td>
                                                <td className="px-4 py-3 align-middle">
                                                    <div className="text-zf-graphite">
                                                        {q.customer.name || '—'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 align-middle">
                                                    <TechnicalBadge
                                                        status={q.status}
                                                        timestamp={q.updatedAt.toISOString()}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 align-middle text-right">
                                                    <div className="text-zf-graphite font-semibold technical-number">
                                                        {Math.round(q.totalAfterVat).toLocaleString(
                                                            'vi-VN',
                                                        )}{' '}
                                                        đ
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 align-middle">
                                                    <div className="text-xs text-technical-secondary font-technical">
                                                        {q.updatedAt.toLocaleDateString('vi-VN')}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 align-middle text-right">
                                                    <div className="inline-flex gap-2">
                                                        <a
                                                            href={`/quotations/${q.id}/edit`}
                                                            className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                                                        >
                                                            Sửa
                                                        </a>
                                                        <a
                                                            href={`/quotations/${q.id}/versions`}
                                                            className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        >
                                                            Lịch sử
                                                        </a>
                                                        <button
                                                            type="button"
                                                            aria-label="Nhân bản báo giá"
                                                            onClick={() => void handleDuplicate(q.id)}
                                                            disabled={duplicatingId === q.id}
                                                            className="text-xs px-2.5 py-1.5 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                                                        >
                                                            {duplicatingId === q.id ? 'Đang nhân bản...' : 'Nhân bản'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                        <div>
                            Trang {page} / {totalPages}
                        </div>
                        <div className="inline-flex gap-2">
                            <button
                                type="button"
                                aria-label="Trang trước"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50"
                            >
                                Trước
                            </button>
                            <button
                                type="button"
                                aria-label="Trang sau"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

