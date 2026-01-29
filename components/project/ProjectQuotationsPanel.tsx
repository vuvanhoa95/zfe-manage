'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, FileText, Loader2, Plus, RefreshCw, Star } from 'lucide-react';

import type { QuotationStatus } from '@/types/quotation';

type QuotationLite = {
    id: string;
    quotationNo: string;
    projectName?: string | null;
    totalAfterVat?: number | null;
    status: QuotationStatus;
    date: string;
};

type ProjectResponse = {
    quotations?: QuotationLite[];
    finalQuotationId?: string | null;
};

const STATUS_CONFIG: Record<QuotationStatus, { label: string; badgeClass: string }> = {
    DRAFT: { label: 'Nháp', badgeClass: 'bg-gray-100 text-gray-700 border border-gray-200' },
    SENT: { label: 'Đã gửi khách', badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200' },
    ACCEPTED: { label: 'Khách chấp nhận', badgeClass: 'bg-green-50 text-green-700 border border-green-200' },
    REJECTED: { label: 'Từ chối', badgeClass: 'bg-red-50 text-red-700 border border-red-200' },
};

export default function ProjectQuotationsPanel({
    projectId,
    isNew,
}: {
    projectId: string;
    isNew: boolean;
}) {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(!isNew);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [quotations, setQuotations] = useState<QuotationLite[]>([]);
    const [finalQuotationId, setFinalQuotationId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'ALL'>('ALL');
    const [isUpdatingFinal, setIsUpdatingFinal] = useState(false);
    const [isDuplicatingId, setIsDuplicatingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isNew && projectId) {
            void refresh();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, isNew]);

    async function refresh() {
        setIsLoading(true);
        setLoadError(null);
        try {
            const res = await fetch(`/api/projects/${projectId}`, { cache: 'no-store' });
            const result = (await res.json()) as { success: boolean; data?: ProjectResponse; error?: string };
            if (!res.ok || !result.success || !result.data) {
                throw new Error(result.error || 'Không thể tải danh sách báo giá');
            }
            setQuotations(result.data.quotations || []);
            setFinalQuotationId(result.data.finalQuotationId || null);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Không thể tải danh sách báo giá';
            setLoadError(message);
        } finally {
            setIsLoading(false);
        }
    }

    async function setFinalQuotation(quotationId: string | null) {
        setIsUpdatingFinal(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/final-quotation`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quotationId }),
            });
            const result = (await res.json()) as { success: boolean; data?: { finalQuotationId?: string | null }; error?: string };
            if (!res.ok || !result.success) {
                throw new Error(result.error || 'Không thể cập nhật báo giá chốt');
            }
            setFinalQuotationId(result.data?.finalQuotationId ?? null);
            await refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Không thể cập nhật báo giá chốt';
            alert(`Lỗi: ${message}`);
        } finally {
            setIsUpdatingFinal(false);
        }
    }

    async function duplicateQuotation(quotationId: string) {
        setIsDuplicatingId(quotationId);
        try {
            const res = await fetch(`/api/quotations/${quotationId}/duplicate`, { method: 'POST' });
            const result = (await res.json()) as { success: boolean; data?: { id: string }; error?: string };
            if (!res.ok || !result.success || !result.data?.id) {
                throw new Error(result.error || 'Không thể nhân bản báo giá');
            }
            await refresh();
            router.push(`/quotations/${result.data.id}/edit`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Không thể nhân bản báo giá';
            alert(`Lỗi: ${message}`);
        } finally {
            setIsDuplicatingId(null);
        }
    }

    const filteredQuotations = useMemo(() => {
        return [...quotations]
            .filter((q) => (statusFilter === 'ALL' ? true : q.status === statusFilter))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [quotations, statusFilter]);

    if (isNew) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Báo giá của dự án</h2>
                <p className="text-sm text-gray-600">Vui lòng lưu dự án trước khi tạo và quản lý báo giá.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col min-h-[520px]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Báo giá của dự án</h2>
                    <p className="text-xs text-gray-500">Danh sách báo giá thuộc dự án này.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => void refresh()}
                        disabled={isLoading}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors font-medium flex items-center gap-2 text-sm"
                        aria-label="Làm mới danh sách báo giá"
                        title="Làm mới"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        <span className="hidden sm:inline">Làm mới</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push(`/quotations/new?projectId=${encodeURIComponent(projectId)}`)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 text-sm"
                        aria-label="Tạo báo giá mới"
                        title="Tạo báo giá mới"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Tạo báo giá</span>
                    </button>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
                <select
                    aria-label="Lọc theo trạng thái báo giá"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as QuotationStatus | 'ALL')}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white"
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="DRAFT">Nháp</option>
                    <option value="SENT">Đã gửi khách</option>
                    <option value="ACCEPTED">Khách chấp nhận</option>
                    <option value="REJECTED">Từ chối</option>
                </select>
                <div className="text-xs text-gray-500">
                    Tổng: <span className="font-semibold text-gray-700">{filteredQuotations.length}</span>
                </div>
            </div>

            {loadError ? (
                <div className="mt-4 text-sm text-red-600">{loadError}</div>
            ) : null}

            <div className="mt-4 flex-1 overflow-y-auto pr-1">
                {isLoading ? (
                    <div className="py-10 flex items-center justify-center text-gray-600 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tải...</span>
                    </div>
                ) : filteredQuotations.length === 0 ? (
                    <div className="py-10 text-center text-gray-600 text-sm">
                        Chưa có báo giá nào.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredQuotations.map((q) => (
                            <div
                                key={q.id}
                                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className="font-semibold text-gray-900">{q.quotationNo}</div>
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[q.status].badgeClass}`}
                                            >
                                                {STATUS_CONFIG[q.status].label}
                                            </span>
                                            {finalQuotationId === q.id ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                                    <Star className="w-3 h-3" />
                                                    Báo giá chốt
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">
                                            {new Date(q.date).toLocaleDateString('vi-VN')}
                                            {typeof q.totalAfterVat === 'number' ? (
                                                <>
                                                    {' • '}
                                                    <span className="font-semibold text-gray-700">
                                                        {q.totalAfterVat.toLocaleString('vi-VN')} VNĐ
                                                    </span>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => router.push(`/quotations/${q.id}/edit`)}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300 transition-colors text-sm"
                                            aria-label="Mở báo giá"
                                            title="Mở báo giá"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span className="hidden md:inline">Mở</span>
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isDuplicatingId === q.id}
                                            onClick={() => void duplicateQuotation(q.id)}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300 transition-colors text-sm disabled:opacity-50"
                                            aria-label="Nhân bản báo giá"
                                            title="Nhân bản"
                                        >
                                            <Copy className="w-4 h-4" />
                                            <span className="hidden md:inline">
                                                {isDuplicatingId === q.id ? 'Đang...' : 'Nhân bản'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-2 flex items-center justify-end">
                                    {finalQuotationId === q.id ? (
                                        <button
                                            type="button"
                                            disabled={isUpdatingFinal}
                                            onClick={() => void setFinalQuotation(null)}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm"
                                            aria-label="Bỏ báo giá chốt"
                                        >
                                            <Star className="w-4 h-4" />
                                            Bỏ chốt
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={isUpdatingFinal}
                                            onClick={() => void setFinalQuotation(q.id)}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 text-sm"
                                            aria-label="Chốt báo giá"
                                        >
                                            <Star className="w-4 h-4" />
                                            Chốt làm căn cứ
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

