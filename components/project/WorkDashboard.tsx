'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    BarChart2,
    ClipboardList,
    Layers3,
    UserCheck,
} from 'lucide-react';
import { dashboardLogger } from '@/lib/logging';
import FeedbackButton from '@/components/project/FeedbackButton';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';

type DashboardTask = {
    id: string;
    title: string;
    description?: string | null;
    status: TaskStatus;
    progress: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    assignedTo: string | null;
    phase?: string | null;
    discipline?: string | null;
    location?: string | null;
    startDate: string | null;
    endDate: string | null;
    dueDate?: string | null;
};

type WorkDashboardProps = {
    projectId: string;
    isActive?: boolean;
};

type TimeFilter = '7d' | '30d' | 'all';

function getEffectiveDueDate(task: DashboardTask): Date | null {
    const raw = task.dueDate ?? task.endDate;
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

function isTaskOverdue(task: DashboardTask, now: Date = new Date()): boolean {
    const due = getEffectiveDueDate(task);
    if (!due) return false;
    if (task.status === 'COMPLETED') return false;

    const toYmd = (d: Date) => [d.getFullYear(), d.getMonth(), d.getDate()] as const;
    const [y1, m1, d1] = toYmd(due);
    const [y2, m2, d2] = toYmd(now);

    if (y1 < y2) return true;
    if (y1 > y2) return false;
    if (m1 < m2) return true;
    if (m1 > m2) return false;
    return d1 < d2;
}

function formatViDate(input: string | null | undefined): string {
    if (!input) return 'N/A';
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('vi-VN');
}

const STATUS_LABELS: Record<TaskStatus, string> = {
    TODO: 'Chưa bắt đầu',
    IN_PROGRESS: 'Đang thực hiện',
    COMPLETED: 'Đã hoàn thành',
    DELAYED: 'Chậm tiến độ',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
    TODO: '#9CA3AF',
    IN_PROGRESS: '#178AF3',
    COMPLETED: '#10B981',
    DELAYED: '#EF4444',
};

export default function WorkDashboard({ projectId, isActive = true }: WorkDashboardProps) {
    const [tasks, setTasks] = useState<DashboardTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchCount, setFetchCount] = useState(0);

    // Re-fetch when tab becomes active
    useEffect(() => {
        if (isActive && fetchCount > 0) {
            setFetchCount((c) => c + 1);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);

    const [disciplineFilter, setDisciplineFilter] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState('');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

    useEffect(() => {
        let isMounted = true;
        const fetchTasks = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/projects/${projectId}/tasks`);
                const json = await res.json();
                if (!json.success) {
                    setError(json.error || 'Không tải được dữ liệu công việc.');
                    if (isMounted) setTasks([]);
                    return;
                }
                if (isMounted) {
                    setTasks(json.data ?? []);
                }
            } catch (err) {
                dashboardLogger.fetchError(err, projectId);
                if (isMounted) {
                    setError('Không thể kết nối tới máy chủ. Vui lòng thử lại.');
                    setTasks([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void fetchTasks();
        return () => {
            isMounted = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, fetchCount]);

    const now = useMemo(() => new Date(), []);

    const handleDisciplineFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setDisciplineFilter(e.target.value);
    }, []);

    const handleAssigneeFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setAssigneeFilter(e.target.value);
    }, []);

    const handleTimeFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setTimeFilter(e.target.value as TimeFilter);
    }, []);

    const availableDisciplines = useMemo(
        () =>
            Array.from(
                new Set(
                    tasks
                        .map((t) => (t.discipline ?? '').trim())
                        .filter((v) => v.length > 0),
                ),
            ),
        [tasks],
    );

    const availableAssignees = useMemo(
        () =>
            Array.from(
                new Set(
                    tasks
                        .map((t) => (t.assignedTo ?? '').trim())
                        .filter((v) => v.length > 0),
                ),
            ),
        [tasks],
    );

    const filteredTasks = useMemo(() => {
        const discipline = disciplineFilter.trim().toLowerCase();
        const assignee = assigneeFilter.trim().toLowerCase();

        const nowDate = new Date();
        const msPerDay = 24 * 60 * 60 * 1000;

        return tasks.filter((task) => {
            if (discipline) {
                const d = (task.discipline ?? '').trim().toLowerCase();
                if (d !== discipline) return false;
            }
            if (assignee) {
                const a = (task.assignedTo ?? '').trim().toLowerCase();
                if (a !== assignee) return false;
            }

            if (timeFilter === 'all') return true;

            const due = getEffectiveDueDate(task);
            if (!due) return true;

            const diffDays = Math.floor((due.getTime() - nowDate.getTime()) / msPerDay);
            if (timeFilter === '7d') {
                return diffDays <= 7;
            }
            if (timeFilter === '30d') {
                return diffDays <= 30;
            }
            return true;
        });
    }, [assigneeFilter, disciplineFilter, tasks, timeFilter]);

    const totalTasks = filteredTasks.length;
    const inProgressCount = filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const completedCount = filteredTasks.filter((t) => t.status === 'COMPLETED').length;
    const overdueCount = filteredTasks.filter((t) => isTaskOverdue(t, now)).length;

    const overallProgress = useMemo(() => {
        if (filteredTasks.length === 0) return 0;
        const total = filteredTasks.reduce((sum, t) => sum + (typeof t.progress === 'number' ? t.progress : 0), 0);
        return Math.round(total / filteredTasks.length);
    }, [filteredTasks]);

    const statusChartData = useMemo(
        () =>
            (['TODO', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'] as TaskStatus[]).map((status) => ({
                status,
                label: STATUS_LABELS[status],
                count: filteredTasks.filter((t) => t.status === status).length,
            })),
        [filteredTasks],
    );

    const groupKeyForPhaseOrDiscipline = useMemo(() => {
        const hasDiscipline = tasks.some((t) => (t.discipline ?? '').trim().length > 0);
        return hasDiscipline ? 'discipline' : 'phase';
    }, [tasks]);

    const phaseOrDisciplineChartData = useMemo(() => {
        const map = new Map<string, number>();
        filteredTasks.forEach((t) => {
            const raw = (groupKeyForPhaseOrDiscipline === 'discipline' ? t.discipline : t.phase) ?? '';
            const key = raw.trim() || 'Khác';
            map.set(key, (map.get(key) ?? 0) + 1);
        });
        return Array.from(map.entries()).map(([key, count]) => ({ label: key, count }));
    }, [filteredTasks, groupKeyForPhaseOrDiscipline]);

    const upcomingAndOverdueTasks = useMemo(() => {
        const withDue = filteredTasks
            .map((t) => ({ task: t, due: getEffectiveDueDate(t) }))
            .filter((item) => item.due !== null)
            .sort((a, b) => (a.due!.getTime() || 0) - (b.due!.getTime() || 0))
            .map((item) => item.task);

        return withDue.slice(0, 10);
    }, [filteredTasks]);

    return (
        <div className="bg-white/95 rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 space-y-5 md:space-y-6">
            {/* Header + filters row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">Dashboard công việc</h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Tổng quan tiến độ theo trạng thái, giai đoạn/bộ môn và người phụ trách.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <FeedbackButton module="dashboard" projectId={projectId} />
                    <select
                        value={disciplineFilter}
                        onChange={handleDisciplineFilterChange}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-zf-accent focus:border-transparent min-w-[160px]"
                    >
                        <option value="">Tất cả bộ môn</option>
                        {availableDisciplines.map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>
                    <select
                        value={assigneeFilter}
                        onChange={handleAssigneeFilterChange}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-zf-accent focus:border-transparent min-w-[160px]"
                    >
                        <option value="">Tất cả người phụ trách</option>
                        {availableAssignees.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={timeFilter}
                        onChange={handleTimeFilterChange}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-zf-accent focus:border-transparent min-w-[130px]"
                    >
                        <option value="all">Tất cả thời gian</option>
                        <option value="7d">7 ngày tới</option>
                        <option value="30d">30 ngày tới</option>
                    </select>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <div>
                        <p className="font-semibold">Không tải được dữ liệu Dashboard</p>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* Loading skeleton */}
            {isLoading && (
                <div className="space-y-6 md:space-y-7">
                    {/* KPI skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 to-gray-50 shadow-[0_12px_30px_rgba(15,23,42,0.08)] p-4 md:p-5 relative overflow-hidden animate-pulse"
                            >
                                <div className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gray-200" />
                                <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
                                <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
                                <div className="h-3 w-32 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                    {/* Charts skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                        {[1, 2].map((i) => (
                            <div
                                key={i}
                                className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 via-slate-50 to-gray-50 p-4 md:p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] animate-pulse"
                            >
                                <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                                <div className="h-3 w-48 bg-gray-200 rounded mb-4" />
                                <div className="h-56 md:h-64 bg-gray-100 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* KPI cards */}
            {!isLoading && (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 to-zf-primary/5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] p-4 md:p-5 relative overflow-hidden">
                    <div className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gradient-to-br from-zf-primary to-zf-accent text-white flex items-center justify-center shadow-md opacity-80">
                        <ClipboardList className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Tổng công việc</p>
                    <p className="mt-2 text-2xl md:text-3xl font-bold text-zf-primary">{totalTasks}</p>
                    <p className="mt-1 text-xs md:text-sm text-gray-500">Tất cả công việc trong dự án hiện tại</p>
                </div>

                <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 to-sky-50 shadow-[0_12px_30px_rgba(15,23,42,0.08)] p-4 md:p-5 relative overflow-hidden">
                    <div className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-sky-400 text-white flex items-center justify-center shadow-md opacity-90">
                        <BarChart2 className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Đang thực hiện</p>
                    <p className="mt-2 text-2xl md:text-3xl font-bold text-sky-600">{inProgressCount}</p>
                    <p className="mt-1 text-xs md:text-sm text-gray-500">Công việc đang mở trong phạm vi lọc</p>
                </div>

                <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 to-emerald-50 shadow-[0_12px_30px_rgba(15,23,42,0.08)] p-4 md:p-5 relative overflow-hidden">
                    <div className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 text-white flex items-center justify-center shadow-md opacity-90">
                        <UserCheck className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Đã hoàn thành</p>
                    <p className="mt-2 text-2xl md:text-3xl font-bold text-emerald-600">{completedCount}</p>
                    <p className="mt-1 text-xs md:text-sm text-gray-500">
                        Công việc đã được đánh dấu hoàn thành trong phạm vi lọc
                    </p>
                </div>

                <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 to-red-50 shadow-[0_12px_30px_rgba(248,113,113,0.22)] p-4 md:p-5 relative overflow-hidden">
                    <div className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white flex items-center justify-center shadow-md opacity-90">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Công việc quá hạn</p>
                    <p className={`mt-2 text-2xl md:text-3xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {overdueCount}
                    </p>
                    <p className="mt-1 text-xs md:text-sm text-gray-500">
                        Hạn trước hôm nay và chưa hoàn thành (theo bộ lọc hiện tại)
                    </p>
                </div>
            </div>

            {/* Progress & charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 via-slate-50 to-zf-primary/5 p-4 md:p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm md:text-base font-semibold text-gray-800">Tiến độ tổng thể</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Trung bình % hoàn thành của các công việc</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-zf-accent">{overallProgress}%</span>
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-zf-primary via-zf-accent to-emerald-500 transition-all duration-500"
                                style={{ width: `${overallProgress}%` }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            {totalTasks === 0
                                ? 'Chưa có công việc nào trong dự án.'
                                : 'Dựa trên toàn bộ công việc trong phạm vi lọc.'}
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 via-slate-50 to-zf-primary/5 p-4 md:p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm md:text-base font-semibold text-gray-800">Công việc theo trạng thái</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Số lượng task ở từng nhóm trạng thái</p>
                        </div>
                    </div>
                    <div className="h-56 md:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={{ stroke: 'rgba(15,23,42,0.2)' }}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={{ stroke: 'rgba(15,23,42,0.2)' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(23,138,243,0.08)' }}
                                    contentStyle={{
                                        background: 'rgba(255,255,255,0.95)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(5,54,99,0.1)',
                                        borderRadius: 12,
                                        boxShadow: '0 4px 16px rgba(15,23,42,0.18)',
                                        fontSize: 12,
                                    }}
                                    formatter={(value: number | undefined) => [`${value ?? 0} công việc`, 'Số lượng']}
                                    labelFormatter={(label) => label}
                                />
                                <Bar
                                    dataKey="count"
                                    radius={[8, 8, 0, 0]}
                                    fill="#178AF3"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Phase / discipline chart + upcoming table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 via-slate-50 to-zf-primary/5 p-4 md:p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm md:text-base font-semibold text-gray-800">
                                {groupKeyForPhaseOrDiscipline === 'discipline'
                                    ? 'Công việc theo bộ môn'
                                    : 'Công việc theo giai đoạn'}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Phân bổ số lượng công việc theo{' '}
                                {groupKeyForPhaseOrDiscipline === 'discipline' ? 'bộ môn' : 'giai đoạn'} triển khai.
                            </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zf-accent to-zf-primary text-white flex items-center justify-center shadow-md opacity-90">
                            <Layers3 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="h-56 md:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={phaseOrDisciplineChartData}
                                layout="vertical"
                                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
                                <XAxis
                                    type="number"
                                    allowDecimals={false}
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={{ stroke: 'rgba(15,23,42,0.2)' }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="label"
                                    width={120}
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={{ stroke: 'rgba(15,23,42,0.2)' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(23,138,243,0.08)' }}
                                    contentStyle={{
                                        background: 'rgba(255,255,255,0.95)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(5,54,99,0.1)',
                                        borderRadius: 12,
                                        boxShadow: '0 4px 16px rgba(15,23,42,0.18)',
                                        fontSize: 12,
                                    }}
                                    formatter={(value: number | undefined) => [`${value ?? 0} công việc`, 'Số lượng']}
                                    labelFormatter={(label) => label}
                                />
                                <Bar
                                    dataKey="count"
                                    radius={[0, 8, 8, 0]}
                                    fill="#053663"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/70 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] p-4 md:p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm md:text-base font-semibold text-gray-800">
                                Công việc sắp đến hạn & quá hạn
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Top 10 công việc theo hạn gần nhất, ưu tiên các công việc quá hạn.
                            </p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-10 text-center text-sm text-gray-500">
                            Đang tải danh sách công việc...
                        </div>
                    ) : upcomingAndOverdueTasks.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-500">
                            <p className="font-semibold text-emerald-600 mb-1">Tuyệt vời!</p>
                            <p>Hiện không có công việc nào quá hạn hoặc sắp đến hạn theo bộ lọc.</p>
                        </div>
                    ) : (
                        <div className="mt-2 overflow-hidden rounded-2xl border border-gray-100">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Công việc
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Giai đoạn / Bộ môn
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Người phụ trách
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Hạn
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Trạng thái
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {upcomingAndOverdueTasks.map((task) => {
                                        const overdue = isTaskOverdue(task, now);
                                        const displayDiscipline = task.discipline || '';
                                        const displayPhase = task.phase || '';
                                        const meta =
                                            displayPhase && displayDiscipline
                                                ? `${displayPhase} · ${displayDiscipline}`
                                                : displayPhase || displayDiscipline || '—';

                                        return (
                                            <tr key={task.id} className="hover:bg-zf-primary/3 transition-colors">
                                                <td className="px-4 py-2 align-top">
                                                    <div className="font-semibold text-gray-900 line-clamp-2">
                                                        {task.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500 line-clamp-1">
                                                        {task.description || 'Không có mô tả'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 align-top text-xs text-gray-600">{meta}</td>
                                                <td className="px-4 py-2 align-top text-xs text-gray-600">
                                                    {task.assignedTo || 'Chưa phân công'}
                                                </td>
                                                <td className="px-4 py-2 align-top text-xs">
                                                    <span
                                                        className={
                                                            overdue
                                                                ? 'text-red-600 font-semibold'
                                                                : 'text-gray-700'
                                                        }
                                                    >
                                                        {formatViDate(task.dueDate ?? task.endDate)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 align-top text-right text-xs">
                                                    <span
                                                        className="inline-flex items-center justify-end gap-1 px-2 py-1 rounded-full border text-[11px] font-semibold"
                                                        style={{
                                                            borderColor: `${STATUS_COLORS[task.status]}33`,
                                                            color: STATUS_COLORS[task.status],
                                                        }}
                                                    >
                                                        {STATUS_LABELS[task.status]}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            </>
            )}
        </div>
    );
}

