'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatVND } from '@/lib/number-to-words-vn';
import {
    FolderOpen,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    Calendar,
    CheckCircle2,
    XCircle,
    PlayCircle,
    Clock,
} from 'lucide-react';

type ReportQuotation = {
    id: string;
    quotationNo: string;
    status: string;
    totalAfterVat: number;
    customer: {
        id: string;
        name: string;
    } | null;
    projectName: string | null;
    createdBy: {
        id: string;
        name: string | null;
        email: string | null;
    } | null;
};

type FetchState<T> =
    | { status: 'idle' | 'loading'; data: null; error: null }
    | { status: 'success'; data: T; error: null }
    | { status: 'error'; data: null; error: string };

type CustomerReportRow = {
    customerId: string;
    customerName: string;
    totalAccepted: number;
    quotationCount: number;
};

type ProjectReportRow = {
    projectName: string;
    totalAccepted: number;
    quotationCount: number;
};

type SalesReportRow = {
    userId: string;
    userName: string;
    acceptedCount: number;
    rejectedCount: number;
    totalCount: number;
    winRate: number;
    totalAccepted: number;
};

type ProjectStatusReport = {
    summary: {
        totalProjects: number;
        statusBreakdown: {
            PLANNING: number;
            ACTIVE: number;
            COMPLETED: number;
            CANCELLED: number;
        };
        financialSummary: {
            totalBudget: number;
            totalRevenue: number;
            totalCost: number;
            totalProfit: number;
            averageProfitMargin: number;
        };
    };
    projectsWithIssues: Array<{
        id: string;
        projectNo: string;
        name: string;
        status: string;
        totalProfit: number;
        issues: string[];
    }>;
    customerSummary: Array<{
        customerId: string;
        customerName: string;
        projectCount: number;
        totalRevenue: number;
        totalCost: number;
        totalProfit: number;
        profitMargin: number;
    }>;
    monthlyTrend: Array<{
        month: string;
        label: string;
        projectCount: number;
        totalRevenue: number;
        totalCost: number;
        totalProfit: number;
    }>;
};

export default function ReportsPage() {
    const [quotations, setQuotations] = useState<ReportQuotation[]>([]);
    const [fetchState, setFetchState] = useState<FetchState<void>>({
        status: 'idle',
        data: null,
        error: null,
    });
    const [projectReport, setProjectReport] = useState<ProjectStatusReport | null>(null);
    const [projectReportState, setProjectReportState] = useState<FetchState<ProjectStatusReport>>({
        status: 'idle',
        data: null,
        error: null,
    });
    const [activeTab, setActiveTab] = useState<'quotations' | 'projects'>('quotations');

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setFetchState({ status: 'loading', data: null, error: null });
            try {
                const params = new URLSearchParams();
                params.set('page', '1');
                params.set('pageSize', '500');

                const res = await fetch(`/api/quotations?${params.toString()}`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                const result = await res.json();

                if (!res.ok || !result.success) {
                    throw new Error(result.error || 'Không thể tải dữ liệu báo giá');
                }

                const data = (result.data ?? []) as any[];
                const mapped: ReportQuotation[] = data.map((q) => ({
                    id: q.id as string,
                    quotationNo: (q.quotationNo as string) ?? '',
                    status: (q.status as string) ?? 'DRAFT',
                    totalAfterVat: (q.totalAfterVat as number) ?? 0,
                    customer: q.customer
                        ? {
                              id: (q.customer.id as string) ?? '',
                              name: (q.customer.name as string) ?? 'Không xác định',
                          }
                        : null,
                    projectName: (q.projectName as string | null) ?? null,
                    createdBy: q.createdBy
                        ? {
                              id: (q.createdBy.id as string) ?? '',
                              name: (q.createdBy.name as string | null) ?? null,
                              email: (q.createdBy.email as string | null) ?? null,
                          }
                        : null,
                }));

                setQuotations(mapped);
                setFetchState({ status: 'success', data: undefined, error: null });
            } catch (error) {
                if ((error as any).name === 'AbortError') return;
                const message =
                    error instanceof Error ? error.message : 'Không thể tải dữ liệu báo cáo';
                setFetchState({ status: 'error', data: null, error: message });
            }
        };

        void load();

        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const loadProjectReport = async () => {
            setProjectReportState({ status: 'loading', data: null, error: null });
            try {
                const res = await fetch(`/api/projects/status-report`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                const result = await res.json();

                if (!res.ok || !result.success) {
                    throw new Error(result.error || 'Không thể tải dữ liệu báo cáo dự án');
                }

                setProjectReport(result.data);
                setProjectReportState({ status: 'success', data: result.data, error: null });
            } catch (error) {
                if ((error as any).name === 'AbortError') return;
                const message =
                    error instanceof Error ? error.message : 'Không thể tải dữ liệu báo cáo dự án';
                setProjectReportState({ status: 'error', data: null, error: message });
            }
        };

        void loadProjectReport();

        return () => {
            controller.abort();
        };
    }, []);

    const isLoading = fetchState.status === 'loading';

    const customerRows: CustomerReportRow[] = (() => {
        const map = new Map<string, CustomerReportRow>();

        quotations.forEach((q) => {
            const customerId = q.customer?.id ?? 'unknown';
            const key = customerId;

            if (!map.has(key)) {
                map.set(key, {
                    customerId,
                    customerName: q.customer?.name ?? 'Không xác định',
                    totalAccepted: 0,
                    quotationCount: 0,
                });
            }

            const row = map.get(key)!;
            row.quotationCount += 1;
            if (q.status === 'ACCEPTED') {
                row.totalAccepted += q.totalAfterVat;
            }
        });

        return Array.from(map.values()).sort((a, b) => b.totalAccepted - a.totalAccepted);
    })();

    const projectRows: ProjectReportRow[] = (() => {
        const map = new Map<string, ProjectReportRow>();

        quotations.forEach((q) => {
            const name = (q.projectName ?? 'Không xác định').trim() || 'Không xác định';
            if (!map.has(name)) {
                map.set(name, {
                    projectName: name,
                    totalAccepted: 0,
                    quotationCount: 0,
                });
            }

            const row = map.get(name)!;
            row.quotationCount += 1;
            if (q.status === 'ACCEPTED') {
                row.totalAccepted += q.totalAfterVat;
            }
        });

        return Array.from(map.values()).sort((a, b) => b.totalAccepted - a.totalAccepted);
    })();

    const salesRows: SalesReportRow[] = (() => {
        const map = new Map<string, SalesReportRow>();

        quotations.forEach((q) => {
            const userId = q.createdBy?.id ?? 'unknown';
            const displayName =
                q.createdBy?.name ??
                q.createdBy?.email ??
                (userId === 'unknown' ? 'Không xác định' : 'Người dùng không tên');

            if (!map.has(userId)) {
                map.set(userId, {
                    userId,
                    userName: displayName,
                    acceptedCount: 0,
                    rejectedCount: 0,
                    totalCount: 0,
                    winRate: 0,
                    totalAccepted: 0,
                });
            }

            const row = map.get(userId)!;
            row.totalCount += 1;
            if (q.status === 'ACCEPTED') {
                row.acceptedCount += 1;
                row.totalAccepted += q.totalAfterVat;
            } else if (q.status === 'REJECTED') {
                row.rejectedCount += 1;
            }
        });

        const rows = Array.from(map.values()).map((row) => {
            const decided = row.acceptedCount + row.rejectedCount;
            const winRate = decided > 0 ? (row.acceptedCount / decided) * 100 : 0;
            return {
                ...row,
                winRate,
            };
        });

        return rows.sort((a, b) => b.totalAccepted - a.totalAccepted);
    })();

    const isLoadingProjectReport = projectReportState.status === 'loading';

    return (
        <div className="px-4 py-4 md:px-6 md:py-5 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex gap-2 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('quotations')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'quotations'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Báo cáo Báo giá
                    </button>
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'projects'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Báo cáo Tình trạng Dự án
                    </button>
                </div>
                <Link
                    href="/"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 underline"
                >
                    ← Quay lại Dashboard
                </Link>
            </div>

            {fetchState.status === 'error' && activeTab === 'quotations' && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {fetchState.error}
                </div>
            )}

            {projectReportState.status === 'error' && activeTab === 'projects' && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {projectReportState.error}
                </div>
            )}

            {activeTab === 'quotations' && isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        <p className="mt-3 text-sm text-slate-500">
                            Đang tải dữ liệu báo cáo từ các báo giá...
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* 3 cards tổng quan */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Tổng số khách hàng có báo giá
                            </p>
                            <p className="mt-2 text-3xl font-bold text-slate-900">
                                {customerRows.length}
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Tổng số dự án có báo giá
                            </p>
                            <p className="mt-2 text-3xl font-bold text-slate-900">
                                {projectRows.length}
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Tổng giá trị báo giá đã chấp nhận
                            </p>
                            <p className="mt-2 text-xl font-bold text-emerald-600">
                                {formatVND(
                                    quotations
                                        .filter((q) => q.status === 'ACCEPTED')
                                        .reduce((sum, q) => sum + q.totalAfterVat, 0),
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        {/* Báo cáo theo khách hàng */}
                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Theo khách hàng
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Top khách hàng theo giá trị báo giá đã chấp nhận.
                                    </p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="px-4 py-2 font-semibold">Khách hàng</th>
                                            <th className="px-4 py-2 font-semibold text-right">
                                                Giá trị đã chấp nhận
                                            </th>
                                            <th className="px-4 py-2 font-semibold text-center">
                                                Số báo giá
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerRows.length === 0 ? (
                                            <tr>
                                                <td
                                                    className="px-4 py-4 text-center text-slate-500"
                                                    colSpan={3}
                                                >
                                                    Chưa có dữ liệu báo giá để tổng hợp.
                                                </td>
                                            </tr>
                                        ) : (
                                            customerRows.map((row) => (
                                                <tr
                                                    key={row.customerId}
                                                    className="border-t border-slate-100 text-[11px]"
                                                >
                                                    <td className="px-4 py-2 text-slate-800">
                                                        {row.customerName}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-semibold text-slate-900">
                                                        {formatVND(row.totalAccepted)}
                                                    </td>
                                                    <td className="px-4 py-2 text-center text-slate-700">
                                                        {row.quotationCount}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Báo cáo theo dự án */}
                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Theo dự án
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Tổng hợp giá trị báo giá đã chấp nhận theo tên dự án.
                                    </p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="px-4 py-2 font-semibold">Dự án</th>
                                            <th className="px-4 py-2 font-semibold text-right">
                                                Giá trị đã chấp nhận
                                            </th>
                                            <th className="px-4 py-2 font-semibold text-center">
                                                Số báo giá
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projectRows.length === 0 ? (
                                            <tr>
                                                <td
                                                    className="px-4 py-4 text-center text-slate-500"
                                                    colSpan={3}
                                                >
                                                    Chưa có dữ liệu báo giá để tổng hợp.
                                                </td>
                                            </tr>
                                        ) : (
                                            projectRows.map((row) => (
                                                <tr
                                                    key={row.projectName}
                                                    className="border-t border-slate-100 text-[11px]"
                                                >
                                                    <td className="px-4 py-2 text-slate-800">
                                                        {row.projectName}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-semibold text-slate-900">
                                                        {formatVND(row.totalAccepted)}
                                                    </td>
                                                    <td className="px-4 py-2 text-center text-slate-700">
                                                        {row.quotationCount}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Báo cáo theo sales / người tạo báo giá */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Theo nhân sự phụ trách (Sales)
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Tỷ lệ thắng/thua theo người tạo báo giá (dựa trên trạng thái
                                    ACCEPTED / REJECTED).
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-2 font-semibold">Nhân sự</th>
                                        <th className="px-4 py-2 font-semibold text-center">
                                            BG đã chấp nhận
                                        </th>
                                        <th className="px-4 py-2 font-semibold text-center">
                                            BG bị từ chối
                                        </th>
                                        <th className="px-4 py-2 font-semibold text-center">
                                            Win rate
                                        </th>
                                        <th className="px-4 py-2 font-semibold text-right">
                                            Giá trị đã chấp nhận
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesRows.length === 0 ? (
                                        <tr>
                                            <td
                                                className="px-4 py-4 text-center text-slate-500"
                                                colSpan={5}
                                            >
                                                Chưa có dữ liệu để tính toán tỷ lệ thắng/thua.
                                            </td>
                                        </tr>
                                    ) : (
                                        salesRows.map((row) => (
                                            <tr
                                                key={row.userId}
                                                className="border-t border-slate-100 text-[11px]"
                                            >
                                                <td className="px-4 py-2 text-slate-800">
                                                    {row.userName}
                                                </td>
                                                <td className="px-4 py-2 text-center text-emerald-700 font-semibold">
                                                    {row.acceptedCount}
                                                </td>
                                                <td className="px-4 py-2 text-center text-red-600 font-semibold">
                                                    {row.rejectedCount}
                                                </td>
                                                <td className="px-4 py-2 text-center text-slate-800 font-semibold">
                                                    {row.winRate.toFixed(1)}%
                                                </td>
                                                <td className="px-4 py-2 text-right font-semibold text-slate-900">
                                                    {formatVND(row.totalAccepted)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

