'use client';

import { useEffect, useState, useMemo } from 'react';
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
import RevenueChart from '@/components/charts/RevenueChart';
import QuotationChart from '@/components/charts/QuotationChart';
import CostChart from '@/components/charts/CostChart';
import GrowthChart from '@/components/charts/GrowthChart';
import AlertsWidget from '@/components/dashboard/AlertsWidget';

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
            if (projectsLoaded) return; // Tải dữ liệu dự án ngay khi component mount để sẵn sàng khi chuyển tab
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
    }, [projectsLoaded]); // Bỏ activeTab khỏi dependency để không fetch lại khi đổi tab, chỉ fetch 1 lần khi mount

    // ✅ PERFORMANCE: Memoize chart data transformations
    const revenueChartData = useMemo(() => {
        if (!stats) return [];
        return stats.monthlyChartData.map((item) => ({
            month: item.label,
            revenue: item.revenue,
            profit: item.profit,
        }));
    }, [stats]);

    const quotationChartData = useMemo(() => {
        if (!stats) return [];
        return stats.monthlyChartData.map((item) => ({
            month: item.label,
            count: item.count,
        }));
    }, [stats]);

    const costChartData = useMemo(() => {
        if (!stats || stats.costs.total === 0) return [];
        return [
            {
                name: 'Outsource',
                value: Math.round((stats.costs.outsource / stats.costs.total) * 100),
            },
            {
                name: 'Hoa hồng',
                value: Math.round((stats.costs.commission / stats.costs.total) * 100),
            },
            {
                name: 'Thuế',
                value: Math.round((stats.costs.tax / stats.costs.total) * 100),
            },
        ].filter((item) => item.value > 0);
    }, [stats]);

    const growthChartData = useMemo(() => {
        if (!stats || stats.monthlyChartData.length === 0) {
            return [
                { month: 'T1', value: 75 },
                { month: 'T2', value: 95 },
                { month: 'T3', value: 110 },
                { month: 'T4', value: 150 },
            ];
        }
        // Use last 4 months for growth chart
        const last4Months = stats.monthlyChartData.slice(-4);
        return last4Months.map((item) => ({
            month: item.label,
            value: item.revenue > 0 ? Math.round((item.profit / item.revenue) * 100) : 0,
        }));
    }, [stats]);

    const growthPercentage = useMemo(() => {
        if (!stats || stats.monthlyChartData.length < 2) return 120;
        const lastMonth = stats.monthlyChartData[stats.monthlyChartData.length - 1];
        const prevMonth = stats.monthlyChartData[stats.monthlyChartData.length - 2];
        if (!lastMonth || !prevMonth || prevMonth.revenue === 0) return 120;
        return Math.round(((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100);
    }, [stats]);

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
            {/* Page Header - Premium Glassmorphism */}
            <div className="glass-card rounded-3xl px-8 py-6 flex items-center justify-between gap-6 shadow-lg border border-white/40 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl">
                <div className="flex items-center gap-5">
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-zf-accent to-zf-accent-light flex items-center justify-center overflow-hidden shadow-lg animate-pulse-glow">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-md"
                        >
                            <rect width="7" height="9" x="3" y="3" rx="1" />
                            <rect width="7" height="5" x="14" y="3" rx="1" />
                            <rect width="7" height="9" x="14" y="12" rx="1" />
                            <rect width="7" height="5" x="3" y="16" rx="1" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zf-primary via-zf-primary-light to-zf-accent bg-clip-text text-transparent">
                            Zfenix Manage
                        </h1>
                        <p className="text-sm text-gray-600 mt-1.5 font-medium">
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
                            {/* Stats Cards - Premium Glassmorphism */}
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Total Quotations */}
                                <div className="stat-card group cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tổng số Báo giá</p>
                                            <p className="text-4xl font-extrabold text-gray-900 mt-3">{stats.totalQuotations}</p>
                                            <p className="text-xs text-zf-accent mt-2 font-medium">Yêu cầu</p>
                                        </div>
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            📊
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue Before VAT */}
                                <div className="stat-card group cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Doanh thu</p>
                                            <p className="text-2xl font-extrabold text-gray-900 mt-3">
                                                {formatVND(stats.projectedRevenue.beforeVat)}
                                            </p>
                                            <p className="text-xs text-emerald-600 mt-2 font-medium">Trước VAT</p>
                                        </div>
                                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            💰
                                        </div>
                                    </div>
                                </div>

                                {/* Total Costs */}
                                <div className="stat-card group cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Chi phí</p>
                                            <p className="text-2xl font-extrabold text-red-600 mt-3">{formatVND(stats.costs.total)}</p>
                                            <p className="text-xs text-gray-500 mt-2 font-medium">Tổng chi</p>
                                        </div>
                                        <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            💸
                                        </div>
                                    </div>
                                </div>

                                {/* Profit */}
                                <div className="stat-card group cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Lợi nhuận</p>
                                            <p
                                                className={`text-2xl font-extrabold mt-3 ${stats.profit.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                                                    }`}
                                            >
                                                {formatVND(stats.profit.amount)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2 font-medium">
                                                {stats.profit.margin.toFixed(2)}% tỷ suất
                                            </p>
                                        </div>
                                        <div
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${stats.profit.amount >= 0 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-red-400 to-red-600'
                                                }`}
                                        >
                                            {stats.profit.amount >= 0 ? '📈' : '📉'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions - Premium Gradient */}
                            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="max-w-xl bg-gradient-ocean rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
                                    {/* Decorative gradient overlay */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"></div>

                                    <h2 className="mb-4 text-xl font-bold relative z-10">⚡ Thao tác nhanh</h2>
                                    <div className="space-y-3 relative z-10">
                                        <Link
                                            href="/quotations/new"
                                            className="block w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-zf-primary transition-all hover:bg-white/95 hover:shadow-lg hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zf-primary"
                                        >
                                            ➕ Tạo Báo giá mới
                                        </Link>
                                        <Link
                                            href="/customers/new"
                                            className="block w-full rounded-xl bg-white/20 backdrop-blur-sm px-4 py-3 text-center text-sm font-semibold text-white border border-white/30 transition-all hover:bg-white/30 hover:shadow-lg hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zf-primary"
                                        >
                                            👥 Thêm Khách hàng mới
                                        </Link>
                                        <Link
                                            href="/quotations"
                                            className="block w-full rounded-xl bg-white/20 backdrop-blur-sm px-4 py-3 text-center text-sm font-semibold text-white border border-white/30 transition-all hover:bg-white/30 hover:shadow-lg hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zf-primary"
                                        >
                                            📄 Xem tất cả Báo giá
                                        </Link>
                                    </div>
                                </div>

                                {/* Alerts Widget */}
                                <div className="lg:col-span-1">
                                    <AlertsWidget />
                                </div>
                            </div>
                        </>
                    ) : tab === 'charts' ? (
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Revenue & Profit Chart */}
                            <RevenueChart data={revenueChartData} />

                            {/* Quotation Count Chart */}
                            <QuotationChart data={quotationChartData} />

                            {/* Cost Breakdown Chart */}
                            <CostChart data={costChartData} />

                            {/* Growth Chart */}
                            <GrowthChart data={growthChartData} growthPercentage={growthPercentage} />
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
