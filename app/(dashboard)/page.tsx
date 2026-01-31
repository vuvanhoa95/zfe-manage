'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatVND } from '@/lib/number-to-words-vn';
import PaymentMilestonesTimeline from '@/components/dashboard/PaymentMilestonesTimeline';
import { AnimatedTabPanels } from '@/components/ui/AnimatedTabPanels';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

type DashboardStats = {
    totalQuotations: number;
    quotationsByStatus: {
        draft: number;
        sent: number;
        accepted: number;
        rejected: number;
    };
    projectedRevenue: {
        beforeVat: number;
        afterVat: number;
    };
    costs: {
        outsource: number;
        tax: number;
        commission: number;
        total: number;
    };
    profit: {
        amount: number;
        margin: number;
    };
    monthlyChartData: Array<{
        month: string;
        label: string;
        revenue: number;
        costs: number;
        profit: number;
        count: number;
    }>;
    recentQuotations: Array<{
        id: string;
        quotationNo: string;
        customerName: string;
        projectName: string;
        totalAfterVat: number;
        status: string;
        date: string;
    }>;
    paymentMilestones: Array<{
        id: string;
        quotationId: string;
        quotationNo: string;
        customerName: string;
        projectName: string;
        no: number;
        title: string;
        percent: number;
        expectedAmount: number;
    }>;
};

type DashboardTab = 'overview' | 'charts' | 'status' | 'payments' | 'recent';

type ProjectStatusRow = {
    id: string;
    projectNo: string;
    name: string;
    customerName: string;
    status: string;
    location: string;
    startDate?: string | null;
    endDate?: string | null;
};

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
    const [projectStatusRows, setProjectStatusRows] = useState<ProjectStatusRow[]>([]);
    const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
    const [projectsLoaded, setProjectsLoaded] = useState<boolean>(false);
    const [projectError, setProjectError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const result = await res.json();
                if (result.success) {
                    setStats(result.data);
                } else {
                    console.error('Failed to fetch dashboard stats:', result.error, result.details);
                    // Set default empty stats to prevent crash
                    setStats({
                        totalQuotations: 0,
                        quotationsByStatus: { draft: 0, sent: 0, accepted: 0, rejected: 0 },
                        projectedRevenue: { beforeVat: 0, afterVat: 0 },
                        costs: { outsource: 0, tax: 0, commission: 0, total: 0 },
                        profit: { amount: 0, margin: 0 },
                        monthlyChartData: [],
                        recentQuotations: [],
                        paymentMilestones: [],
                    });
                }
            } catch (error: any) {
                console.error('Error fetching dashboard stats:', error);
                // Set default empty stats to prevent crash
                setStats({
                    totalQuotations: 0,
                    quotationsByStatus: { draft: 0, sent: 0, accepted: 0, rejected: 0 },
                    projectedRevenue: { beforeVat: 0, afterVat: 0 },
                    costs: { outsource: 0, tax: 0, commission: 0, total: 0 },
                    profit: { amount: 0, margin: 0 },
                    monthlyChartData: [],
                    recentQuotations: [],
                    paymentMilestones: [],
                });
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        const fetchProjectStatus = async () => {
            if (projectsLoaded || activeTab !== 'status') return;
            setLoadingProjects(true);
            setProjectError(null);
            try {
                const res = await fetch('/api/projects', {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache',
                    },
                });
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const result = await res.json();
                if (result.success && Array.isArray(result.data)) {
                    const mapped: ProjectStatusRow[] = result.data.slice(0, 20).map((project: any) => ({
                        id: project.id,
                        projectNo: project.projectNo,
                        name: project.name,
                        customerName: project.customer?.name ?? 'Chưa có',
                        status: project.status,
                        location: project.location ?? '',
                        startDate: project.startDate ?? null,
                        endDate: project.endDate ?? null,
                    }));
                    setProjectStatusRows(mapped);
                    setProjectsLoaded(true);
                } else {
                    setProjectError('Không lấy được dữ liệu dự án.');
                }
            } catch (error) {
                console.error('Lỗi khi tải trạng thái dự án:', error);
                setProjectError('Lỗi khi tải trạng thái dự án.');
            } finally {
                setLoadingProjects(false);
            }
        };

        fetchProjectStatus();
    }, [activeTab, projectsLoaded]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải trang tổng quan...</p>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const statusConfig = {
        DRAFT: { label: 'Nháp', color: 'bg-gray-100 text-gray-800', icon: '📝' },
        SENT: { label: 'Đã gửi', color: 'bg-blue-100 text-blue-800', icon: '📤' },
        ACCEPTED: { label: 'Đã chấp nhận', color: 'bg-green-100 text-green-800', icon: '✅' },
        REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-800', icon: '❌' },
    };

    return (
        <div className="p-8 space-y-8">
            {/* Page Header */}
            <div className="bg-white rounded-2xl border border-gray-200 px-6 py-5 flex items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center overflow-hidden">
                        <Image
                            src="/window.svg"
                            alt="ZFENIX Logo"
                            width={48}
                            height={48}
                            className="w-10 h-10"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                            Zfenix Manage
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Chào mừng bạn trở lại 👋&nbsp; Chúc bạn luôn nhiều năng lượng tích cực, làm việc vui như đi chơi,
                            mỗi ngày đều có thêm một deal đẹp và vài điều khiến bạn mỉm cười.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs nhỏ cho nội dung tổng quan */}
            <div className="mt-4 border-b border-gray-200">
                <nav className="-mb-px flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className={`relative px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent transition-colors transition-transform after:absolute after:left-0 after:-bottom-[1px] after:h-0.5 after:w-full after:bg-zf-accent after:origin-left after:scale-x-0 after:transition-transform after:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] ${activeTab === 'overview'
                            ? 'text-zf-accent bg-white after:scale-x-100'
                            : 'text-gray-500 hover:text-zf-accent hover:after:scale-x-100'
                            }`}
                        aria-label="Tab tổng quan"
                    >
                        Tổng quan
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('charts')}
                        className={`relative px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent transition-colors transition-transform after:absolute after:left-0 after:-bottom-[1px] after:h-0.5 after:w-full after:bg-zf-accent after:origin-left after:scale-x-0 after:transition-transform after:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] ${activeTab === 'charts'
                            ? 'text-zf-accent bg-white after:scale-x-100'
                            : 'text-gray-500 hover:text-zf-accent hover:after:scale-x-100'
                            }`}
                        aria-label="Tab biểu đồ"
                    >
                        Biểu đồ
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('status')}
                        className={`relative px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent transition-colors transition-transform after:absolute after:left-0 after:-bottom-[1px] after:h-0.5 after:w-full after:bg-zf-accent after:origin-left after:scale-x-0 after:transition-transform after:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] ${activeTab === 'status'
                            ? 'text-zf-accent bg-white after:scale-x-100'
                            : 'text-gray-500 hover:text-zf-accent hover:after:scale-x-100'
                            }`}
                        aria-label="Tab trạng thái"
                    >
                        Trạng thái
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('payments')}
                        className={`relative px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent transition-colors transition-transform after:absolute after:left-0 after:-bottom-[1px] after:h-0.5 after:w-full after:bg-zf-accent after:origin-left after:scale-x-0 after:transition-transform after:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] ${activeTab === 'payments'
                            ? 'text-zf-accent bg-white after:scale-x-100'
                            : 'text-gray-500 hover:text-zf-accent hover:after:scale-x-100'
                            }`}
                        aria-label="Tab mốc thanh toán"
                    >
                        Mốc thanh toán
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('recent')}
                        className={`relative px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent transition-colors transition-transform after:absolute after:left-0 after:-bottom-[1px] after:h-0.5 after:w-full after:bg-zf-accent after:origin-left after:scale-x-0 after:transition-transform after:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] ${activeTab === 'recent'
                            ? 'text-zf-accent bg-white after:scale-x-100'
                            : 'text-gray-500 hover:text-zf-accent hover:after:scale-x-100'
                            }`}
                        aria-label="Tab báo giá gần đây"
                    >
                        Báo giá gần đây
                    </button>
                </nav>
            </div>

            {/* Nội dung theo tab */}
            <AnimatedTabPanels
                activeKey={activeTab}
                variant="ios"
                orderedKeys={['overview', 'charts', 'status', 'payments', 'recent'] as const}
                render={(tab) =>
                    tab === 'overview' ? (
                        <>
                            {/* Stats Cards */}
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Total Quotations */}
                                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Tổng số Báo giá</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalQuotations}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                                            📊
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue Before VAT */}
                                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Tổng Doanh thu (trước VAT)</p>
                                            <p className="text-xl font-bold text-gray-900 mt-2">
                                                {formatVND(stats.projectedRevenue.beforeVat)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">VNĐ</p>
                                        </div>
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                                            💰
                                        </div>
                                    </div>
                                </div>

                                {/* Total Costs */}
                                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Tổng Chi phí</p>
                                            <p className="text-xl font-bold text-red-600 mt-2">{formatVND(stats.costs.total)}</p>
                                            <p className="text-xs text-gray-500 mt-1">VNĐ</p>
                                        </div>
                                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">
                                            💸
                                        </div>
                                    </div>
                                </div>

                                {/* Profit */}
                                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Lợi nhuận</p>
                                            <p
                                                className={`text-xl font-bold mt-2 ${stats.profit.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}
                                            >
                                                {formatVND(stats.profit.amount)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {stats.profit.margin.toFixed(2)}% tỷ suất
                                            </p>
                                        </div>
                                        <div
                                            className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${stats.profit.amount >= 0 ? 'bg-green-100' : 'bg-red-100'
                                                }`}
                                        >
                                            {stats.profit.amount >= 0 ? '📈' : '📉'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="max-w-xl bg-gradient-to-br from-zf-primary to-zf-primary-dark rounded-xl shadow-sm p-3 text-white">
                                    <h2 className="mb-2 text-base font-bold">Thao tác nhanh</h2>
                                    <div className="space-y-2">
                                        <Link
                                            href="/quotations/new"
                                            className="block w-full rounded-md bg-white px-3 py-1.5 text-center text-sm font-semibold text-zf-primary transition-colors hover:bg-zf-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-zf-primary"
                                        >
                                            ➕ Tạo Báo giá mới
                                        </Link>
                                        <Link
                                            href="/customers/new"
                                            className="block w-full rounded-md bg-zf-accent px-3 py-1.5 text-center text-sm font-semibold text-zf-text-inverse transition-colors hover:bg-zf-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zf-primary"
                                        >
                                            👥 Thêm Khách hàng mới
                                        </Link>
                                        <Link
                                            href="/quotations"
                                            className="block w-full rounded-md bg-zf-accent px-3 py-1.5 text-center text-sm font-semibold text-zf-text-inverse transition-colors hover:bg-zf-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zf-primary"
                                        >
                                            📄 Xem tất cả Báo giá
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : tab === 'charts' ? (
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Revenue & Profit Chart */}
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Doanh thu & Lợi nhuận theo tháng</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={stats.monthlyChartData || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 12 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                        />
                                        <Tooltip
                                            formatter={(value: any) => formatVND(Number(value || 0))}
                                            labelStyle={{ color: 'var(--zf-primary)', fontWeight: 'bold' }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="var(--zf-accent)"
                                            strokeWidth={2}
                                            name="Doanh thu"
                                            dot={{ r: 4 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="profit"
                                            stroke="var(--zf-success)"
                                            strokeWidth={2}
                                            name="Lợi nhuận"
                                            dot={{ r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Monthly Quotation Count */}
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Số lượng Báo giá theo tháng</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={stats.monthlyChartData || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 12 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="var(--zf-primary)" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Cost Distribution Pie Chart */}
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 lg:col-span-2">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">🥧 Phân bố Chi phí</h2>
                                {stats.costs.total > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Outsource', value: stats.costs.outsource, color: 'var(--zf-warning)' },
                                                    { name: 'Thuế', value: stats.costs.tax, color: 'var(--zf-error)' },
                                                    { name: 'Hoa hồng', value: stats.costs.commission, color: 'var(--zf-info)' },
                                                ].filter((item) => item.value > 0)}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                                                outerRadius={80}
                                                fill="var(--zf-accent)"
                                                dataKey="value"
                                            >
                                                {[
                                                    { name: 'Outsource', value: stats.costs.outsource, color: 'var(--zf-warning)' },
                                                    { name: 'Thuế', value: stats.costs.tax, color: 'var(--zf-error)' },
                                                    { name: 'Hoa hồng', value: stats.costs.commission, color: 'var(--zf-info)' },
                                                ]
                                                    .filter((item) => item.value > 0)
                                                    .map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any) => formatVND(Number(value || 0))} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-gray-400">
                                        <p>Chưa có dữ liệu chi phí</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : tab === 'status' ? (
                        <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Tình trạng dự án</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Bảng tổng quan trạng thái các dự án gần đây.
                                    </p>
                                </div>
                                <Link
                                    href="/projects"
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    Xem tất cả dự án →
                                </Link>
                            </div>

                            {loadingProjects ? (
                                <div className="p-6 text-center text-gray-500">Đang tải dữ liệu dự án...</div>
                            ) : projectError ? (
                                <div className="p-6 text-center text-red-500 text-sm">{projectError}</div>
                            ) : projectStatusRows.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 text-sm">
                                    Chưa có dữ liệu dự án để hiển thị.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    #
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Mã dự án
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Tên dự án
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Khách hàng
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Trạng thái
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Địa điểm
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Ngày bắt đầu
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Ngày kết thúc
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {projectStatusRows.map((project, index) => {
                                                const projectStatus = project.status?.toUpperCase?.() ?? '';
                                                const statusConfigProject: Record<
                                                    string,
                                                    { label: string; color: string }
                                                > = {
                                                    PLANNING: {
                                                        label: 'Lập kế hoạch',
                                                        color: 'bg-gray-100 text-gray-800',
                                                    },
                                                    ACTIVE: {
                                                        label: 'Đang thực hiện',
                                                        color: 'bg-blue-100 text-blue-800',
                                                    },
                                                    COMPLETED: {
                                                        label: 'Hoàn thành',
                                                        color: 'bg-green-100 text-green-800',
                                                    },
                                                    CANCELLED: {
                                                        label: 'Đã hủy',
                                                        color: 'bg-red-100 text-red-800',
                                                    },
                                                };
                                                const statusInfo =
                                                    statusConfigProject[projectStatus] ??
                                                    statusConfigProject.PLANNING;

                                                return (
                                                    <tr key={project.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-500">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                                                            {project.projectNo}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            <Link
                                                                href={`/projects/${project.id}`}
                                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                                            >
                                                                {project.name}
                                                            </Link>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {project.customerName}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span
                                                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}
                                                            >
                                                                {statusInfo.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {project.location}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-500 text-center">
                                                            {project.startDate
                                                                ? new Date(project.startDate).toLocaleDateString(
                                                                    'vi-VN',
                                                                )
                                                                : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-500 text-center">
                                                            {project.endDate
                                                                ? new Date(project.endDate).toLocaleDateString(
                                                                    'vi-VN',
                                                                )
                                                                : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : tab === 'payments' ? (
                        <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Bảng mốc thanh toán</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Tổng hợp các đợt thanh toán theo các báo giá đã chốt.
                                    </p>
                                </div>
                                <Link
                                    href="/projects"
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    Xem chi tiết dự án →
                                </Link>
                            </div>
                            {(!stats.paymentMilestones || stats.paymentMilestones.length === 0) ? (
                                <div className="p-6 text-center text-gray-500 text-sm">
                                    Chưa có mốc thanh toán nào được thiết lập từ các báo giá đã chốt.
                                </div>
                            ) : (
                                <div className="p-4 md:p-6 bg-zf-bg-secondary">
                                    <PaymentMilestonesTimeline items={stats.paymentMilestones} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Báo giá gần đây</h2>
                                <Link href="/quotations" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                    Xem tất cả →
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Số báo giá
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Khách hàng
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Dự án
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tổng tiền (VNĐ)
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Trạng thái
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Ngày
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {stats.recentQuotations.map((quotation) => {
                                            const config = statusConfig[quotation.status as keyof typeof statusConfig];

                                            return (
                                                <tr key={quotation.id} className="hover:bg-gray-50 cursor-pointer">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Link
                                                            href={`/quotations/${quotation.id}`}
                                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            {quotation.quotationNo}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-gray-900">{quotation.customerName}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-gray-900">{quotation.projectName}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {formatVND(quotation.totalAfterVat)}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span
                                                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}
                                                        >
                                                            {config.icon} {config.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-gray-500">
                                                        {new Date(quotation.date).toLocaleDateString('vi-VN')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }
            />
        </div>
    );
}
