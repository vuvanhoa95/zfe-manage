'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CreditCard, FileCheck2, Loader2, ReceiptText } from 'lucide-react';

import { formatVNDWithSymbol } from '@/lib/number-to-words-vn';

type CashFlowType = 'INCOME' | 'EXPENSE';
type DocumentStatus = 'NONE' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | null;

type CashFlow = {
    id: string;
    projectId: string;
    type: CashFlowType;
    category: string | null;
    description: string;
    amount: number;
    date: string;
    documentStatus?: DocumentStatus;
    documentNote?: string | null;
};

type QuotationLite = {
    id: string;
    quotationNo: string;
    totalAfterVat: number | null;
    outsourceCost: number | null;
    taxCost: number | null;
    commissionCost: number | null;
};

interface BillingTabProps {
    projectId: string;
    isNew: boolean;
}

function derivePartyLabel(cf: CashFlow): string {
    if (cf.type === 'INCOME') {
        return 'Khách hàng thanh toán';
    }
    if (cf.category && cf.category.toLowerCase().includes('outsource')) {
        return 'Chi trả outsource';
    }
    if (cf.category && cf.category.toLowerCase().includes('thuế')) {
        return 'Chi phí thuế';
    }
    if (cf.category && cf.category.toLowerCase().includes('hoa hồng')) {
        return 'Chi phí hoa hồng';
    }
    return 'Khác';
}

function getDocumentStatusLabel(status: DocumentStatus): { label: string; className: string } {
    switch (status) {
        case 'SUBMITTED':
            return { label: 'Đã nộp hồ sơ', className: 'bg-amber-50 text-amber-800 border border-amber-200' };
        case 'APPROVED':
            return { label: 'Đã duyệt / chờ thanh toán', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
        case 'REJECTED':
            return { label: 'Hồ sơ bị trả lại / thiếu', className: 'bg-red-50 text-red-700 border border-red-200' };
        default:
            return { label: 'Chưa có hồ sơ', className: 'bg-gray-50 text-gray-600 border border-gray-200' };
    }
}

interface BillingTabProps {
    projectId: string;
    isNew: boolean;
    projectData?: any; // Cached project data from parent
}

export default function BillingTab({ projectId, isNew, projectData }: BillingTabProps) {
    const [isLoading, setIsLoading] = useState(!isNew && !projectData);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [cashFlows, setCashFlows] = useState<CashFlow[]>(projectData?.cashFlows || []);
    const [quotation, setQuotation] = useState<QuotationLite | null>(() => {
        if (projectData) {
            const finalQuotationId = projectData.finalQuotationId as string | null | undefined;
            const finalQuotationRaw =
                (projectData.quotations || []).find((q: any) => q.id === finalQuotationId) ??
                (projectData.quotations || [])[0];

            if (finalQuotationRaw) {
                return {
                    id: finalQuotationRaw.id,
                    quotationNo: finalQuotationRaw.quotationNo,
                    totalAfterVat: finalQuotationRaw.totalAfterVat ?? null,
                    outsourceCost: finalQuotationRaw.outsourceCost ?? null,
                    taxCost: finalQuotationRaw.taxCost ?? null,
                    commissionCost: finalQuotationRaw.commissionCost ?? null,
                };
            }
        }
        return null;
    });

    useEffect(() => {
        // If we have cached data, use it and skip fetch
        if (projectData) {
            setCashFlows(projectData.cashFlows || []);
            const finalQuotationId = projectData.finalQuotationId as string | null | undefined;
            const finalQuotationRaw =
                (projectData.quotations || []).find((q: any) => q.id === finalQuotationId) ??
                (projectData.quotations || [])[0];

            if (finalQuotationRaw) {
                setQuotation({
                    id: finalQuotationRaw.id,
                    quotationNo: finalQuotationRaw.quotationNo,
                    totalAfterVat: finalQuotationRaw.totalAfterVat ?? null,
                    outsourceCost: finalQuotationRaw.outsourceCost ?? null,
                    taxCost: finalQuotationRaw.taxCost ?? null,
                    commissionCost: finalQuotationRaw.commissionCost ?? null,
                });
            } else {
                setQuotation(null);
            }
            setIsLoading(false);
            return;
        }

        if (isNew || !projectId) return;

        const fetchData = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const res = await fetch(`/api/projects/${projectId}`);
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                const result = await res.json();
                if (!result.success || !result.data) {
                    throw new Error(result.error || 'Không thể tải dữ liệu dự án');
                }

                const project = result.data as {
                    cashFlows?: CashFlow[];
                    quotations?: any[];
                    finalQuotationId?: string | null;
                };

                setCashFlows((project.cashFlows || []) as CashFlow[]);

                const finalQuotationId = project.finalQuotationId as string | null | undefined;
                const finalQuotationRaw =
                    (project.quotations || []).find((q: any) => q.id === finalQuotationId) ??
                    (project.quotations || [])[0];

                if (finalQuotationRaw) {
                    setQuotation({
                        id: finalQuotationRaw.id,
                        quotationNo: finalQuotationRaw.quotationNo,
                        totalAfterVat: finalQuotationRaw.totalAfterVat ?? null,
                        outsourceCost: finalQuotationRaw.outsourceCost ?? null,
                        taxCost: finalQuotationRaw.taxCost ?? null,
                        commissionCost: finalQuotationRaw.commissionCost ?? null,
                    });
                } else {
                    setQuotation(null);
                }
            } catch (error: any) {
                console.error('Failed to load billing overview:', error);
                setLoadError(error?.message || 'Không thể tải dữ liệu');
            } finally {
                setIsLoading(false);
            }
        };

        void fetchData();
    }, [projectId, isNew, projectData]);

    const summary = useMemo(() => {
        const totalIncome = cashFlows.filter((c) => c.type === 'INCOME').reduce((s, c) => s + c.amount, 0);
        const totalExpense = cashFlows.filter((c) => c.type === 'EXPENSE').reduce((s, c) => s + c.amount, 0);
        const outsourceExpense = cashFlows
            .filter((c) => c.type === 'EXPENSE' && (c.category || '').toLowerCase().includes('outsource'))
            .reduce((s, c) => s + c.amount, 0);

        const contractTotal = quotation?.totalAfterVat ?? 0;
        const plannedOutsource =
            (quotation?.outsourceCost ?? 0) +
            (quotation?.taxCost ?? 0) +
            (quotation?.commissionCost ?? 0);

        return {
            totalIncome,
            totalExpense,
            outsourceExpense,
            contractTotal,
            plannedOutsource,
            profit: totalIncome - totalExpense,
            customerProgress: contractTotal > 0 ? Math.min(100, Math.round((totalIncome / contractTotal) * 100)) : 0,
            outsourceProgress:
                plannedOutsource > 0 ? Math.min(100, Math.round((outsourceExpense / plannedOutsource) * 100)) : 0,
        };
    }, [cashFlows, quotation]);

    if (isNew) {
        return (
            <div className="p-8 flex items-center justify-center">
                <p className="text-gray-600">
                    Vui lòng lưu dự án trước khi quản lý hóa đơn và trạng thái thanh toán.
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ReceiptText className="w-5 h-5" />
                            Hóa đơn &amp; trạng thái thanh toán
                        </h2>
                        <p className="text-xs text-gray-500">
                            Dữ liệu được tổng hợp tự động từ Báo giá chốt và Dòng tiền của dự án.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center gap-2 text-gray-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang tải dữ liệu thanh toán...</span>
                        </div>
                    ) : loadError ? (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{loadError}</span>
                        </div>
                    ) : null}

                    {!isLoading && !loadError ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase text-blue-700">
                                            Thanh toán từ khách hàng
                                        </span>
                                        <CreditCard className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="text-sm text-blue-800">
                                        Đã thu:{' '}
                                        <span className="font-bold">
                                            {formatVNDWithSymbol(summary.totalIncome)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-blue-800">
                                        Giá trị hợp đồng:{' '}
                                        <span className="font-semibold">
                                            {formatVNDWithSymbol(summary.contractTotal)}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <div className="flex justify-between text-[11px] text-blue-800 mb-1">
                                            <span>Tiến độ thanh toán</span>
                                            <span>{summary.customerProgress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all"
                                                style={{ width: `${summary.customerProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase text-emerald-700">
                                            Thanh toán cho outsource
                                        </span>
                                        <FileCheck2 className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div className="text-sm text-emerald-800">
                                        Đã chi:{' '}
                                        <span className="font-bold">
                                            {formatVNDWithSymbol(summary.outsourceExpense)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-emerald-800">
                                        Chi phí outsource (theo báo giá):{' '}
                                        <span className="font-semibold">
                                            {formatVNDWithSymbol(summary.plannedOutsource)}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <div className="flex justify-between text-[11px] text-emerald-800 mb-1">
                                            <span>Tiến độ thanh toán outsource</span>
                                            <span>{summary.outsourceProgress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-600 rounded-full transition-all"
                                                style={{ width: `${summary.outsourceProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase text-gray-700">
                                            Lợi nhuận tạm tính
                                        </span>
                                    </div>
                                    <div
                                        className={`text-lg font-bold ${
                                            summary.profit >= 0 ? 'text-emerald-700' : 'text-red-600'
                                        }`}
                                    >
                                        {formatVNDWithSymbol(summary.profit)}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Tổng thu: {formatVNDWithSymbol(summary.totalIncome)}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Tổng chi: {formatVNDWithSymbol(summary.totalExpense)}
                                    </div>
                                    {quotation ? (
                                        <div className="mt-2 text-[11px] text-gray-500">
                                            Căn cứ Báo giá: <span className="font-mono">{quotation.quotationNo}</span>
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-[11px] text-amber-700 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span>Chưa có báo giá để đối chiếu tiến độ thanh toán.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>

                {!isLoading && !loadError && cashFlows.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Chi tiết các đợt thu/chi &amp; tình trạng hồ sơ (từ Dòng tiền)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-600 border-b">
                                        <th className="py-2 pr-4 whitespace-nowrap">Ngày</th>
                                        <th className="py-2 pr-4 whitespace-nowrap">Loại</th>
                                        <th className="py-2 pr-4 whitespace-nowrap">Đối tượng</th>
                                        <th className="py-2 pr-4 whitespace-nowrap">Danh mục</th>
                                        <th className="py-2 pr-4">Mô tả</th>
                                        <th className="py-2 pr-4 whitespace-nowrap">Hồ sơ</th>
                                        <th className="py-2 pr-4 text-right whitespace-nowrap">Số tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cashFlows.map((cf) => (
                                        <tr key={cf.id} className="border-b last:border-b-0">
                                            <td className="py-2 pr-4 whitespace-nowrap text-gray-700">
                                                {new Date(cf.date).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="py-2 pr-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                        cf.type === 'INCOME'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {cf.type === 'INCOME' ? 'Thu' : 'Chi'}
                                                </span>
                                            </td>
                                            <td className="py-2 pr-4 whitespace-nowrap text-gray-700">
                                                {derivePartyLabel(cf)}
                                            </td>
                                            <td className="py-2 pr-4 whitespace-nowrap text-gray-700">
                                                {cf.category || '-'}
                                            </td>
                                            <td className="py-2 pr-4 text-gray-900">{cf.description}</td>
                                            <td className="py-2 pr-4 whitespace-nowrap">
                                                {(() => {
                                                    const s = getDocumentStatusLabel(
                                                        (cf.documentStatus as DocumentStatus) || 'NONE'
                                                    );
                                                    return (
                                                        <div className="flex flex-col gap-1">
                                                            <span
                                                                className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold ${s.className}`}
                                                            >
                                                                {s.label}
                                                            </span>
                                                            {cf.documentNote ? (
                                                                <span className="text-xs text-gray-500 max-w-xs truncate">
                                                                    {cf.documentNote}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="py-2 pr-4 text-right font-semibold text-gray-900">
                                                {formatVNDWithSymbol(cf.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3 text-xs text-gray-500">
                            Để cập nhật trạng thái thanh toán, vui lòng chỉnh sửa các dòng Thu/Chi tại tab{' '}
                            <span className="font-semibold">Dòng tiền</span>. Tab này chỉ hiển thị tổng quan ở góc độ
                            hóa đơn.
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

