'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ClipboardList, Timer, TrendingUp } from 'lucide-react';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type DashboardWorkSummaryTask = {
    id: string;
    projectId: string;
    title: string;
    projectName: string;
    projectNo: string;
    status: TaskStatus;
    priority: TaskPriority;
    progress: number;
    assignedTo: string | null;
    phase: string | null;
    discipline: string | null;
    dueDate: string | null;
    isOverdue: boolean;
};

type DashboardWorkSummary = {
    totalTasks: number;
    inProgress: number;
    completed: number;
    overdue: number;
    upcomingWithin7Days: number;
    tasks: DashboardWorkSummaryTask[];
};

type ApiResponse =
    | {
          success: true;
          data: DashboardWorkSummary;
          warning?: string;
      }
    | {
          success: false;
          error: string;
      };

const STATUS_LABELS: Record<TaskStatus, string> = {
    TODO: 'Chưa bắt đầu',
    IN_PROGRESS: 'Đang thực hiện',
    COMPLETED: 'Đã hoàn thành',
    DELAYED: 'Chậm tiến độ',
};

const STATUS_COLOR_CLASSES: Record<TaskStatus, string> = {
    TODO: 'bg-slate-100 text-slate-700 border-slate-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DELAYED: 'bg-red-50 text-red-700 border-red-200',
};

function formatDateVi(input: string | null): string {
    if (!input) return 'N/A';
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('vi-VN');
}

function formatProjectLabel(projectNo: string, projectName: string): string {
    if (!projectNo) return projectName || 'Không rõ dự án';
    if (!projectName) return projectNo;
    return `${projectNo} · ${projectName}`;
}

export default function DashboardWorkOverview() {
    const [data, setData] = useState<DashboardWorkSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | undefined>(undefined);

    useEffect(() => {
        let isMounted = true;

        const fetchSummary = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/dashboard/work-summary', { cache: 'no-store' });
                const json: ApiResponse = await res.json().catch(() => ({
                    success: false,
                    error: 'Phản hồi từ máy chủ không hợp lệ.',
                }));

                if (!json.success) {
                    if (!isMounted) return;
                    setError(json.error || 'Không tải được báo cáo công việc.');
                    setData(null);
                    return;
                }

                if (!isMounted) return;
                setData(json.data);
                setWarning(json.warning);
            } catch {
                if (!isMounted) return;
                setError('Không thể kết nối tới máy chủ. Vui lòng thử lại.');
                setData(null);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void fetchSummary();

        return () => {
            isMounted = false;
        };
    }, []);

    const hasTasks = (data?.tasks?.length ?? 0) > 0;

    const completionRate = useMemo(() => {
        if (!data || data.totalTasks === 0) return 0;
        return Math.round((data.completed / data.totalTasks) * 100);
    }, [data]);

    return (
        <section className="mt-6 bg-white rounded-xl shadow-sm border border-zf-graphite/10 p-5 md:p-6 space-y-4 md:space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-zf-primary">Công việc triển khai dự án</h2>
                    <p className="text-xs md:text-sm text-zf-graphite/70 mt-1">
                        Tổng quan tiến độ công việc trên tất cả dự án đang lập kế hoạch và triển khai.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end text-xs text-zf-graphite/60">
                        <span>
                            Hoàn thành trung bình:{' '}
                            <span className="font-semibold text-zf-accent">{completionRate}%</span>
                        </span>
                        {data && (
                            <span>
                                {data.totalTasks} công việc · {data.overdue} quá hạn ·{' '}
                                {data.upcomingWithin7Days} đến hạn trong 7 ngày
                            </span>
                        )}
                    </div>
                    <Link
                        href="/projects"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zf-accent/40 bg-zf-accent/5 px-3 py-1.5 text-xs font-medium text-zf-accent hover:bg-zf-accent/10 transition-colors"
                    >
                        Xem chi tiết dự án
                    </Link>
                </div>
            </div>

            {warning && !error && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <p>{warning}</p>
                </div>
            )}

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <div>
                        <p className="font-semibold">Không tải được báo cáo công việc triển khai</p>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/95 to-zf-primary/5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] p-4 md:p-5 relative overflow-hidden">
                    <div className="absolute right-4 top-4 w-9 h-9 rounded-full bg-gradient-to-br from-zf-primary to-zf-accent text-white flex items-center justify-center shadow-md opacity-90">
                        <ClipboardList className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-semibold tracking-wide text-zf-graphite/60 uppercase">
                        Tổng công việc
                    </p>
                    <p className="mt-1.5 text-2xl md:text-3xl font-extrabold text-zf-primary">
                        {loading ? '—' : data?.totalTasks ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-zf-graphite/65">Tất cả công việc trên các dự án</p>
                </div>

                <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/95 to-sky-50 shadow-[0_10px_24px_rgba(15,23,42,0.08)] p-4 md:p-5 relative overflow-hidden">
                    <div className="absolute right-4 top-4 w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-sky-400 text-white flex items-center justify-center shadow-md opacity-95">
                        <Timer className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-semibold tracking-wide text-zf-graphite/60 uppercase">
                        Đang thực hiện
                    </p>
                    <p className="mt-1.5 text-2xl md:text-3xl font-extrabold text-sky-600">
                        {loading ? '—' : data?.inProgress ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-zf-graphite/65">
                        Công việc ở trạng thái đang triển khai
                    </p>
                </div>

                <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/95 to-emerald-50 shadow-[0_10px_24px_rgba(16,185,129,0.18)] p-4 md:p-5 relative overflow-hidden">
                    <div className="absolute right-4 top-4 w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 text-white flex items-center justify-center shadow-md opacity-95">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-semibold tracking-wide text-zf-graphite/60 uppercase">
                        Đã hoàn thành
                    </p>
                    <p className="mt-1.5 text-2xl md:text-3xl font-extrabold text-emerald-600">
                        {loading ? '—' : data?.completed ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-zf-graphite/65">Công việc đã hoàn tất trên các dự án</p>
                </div>

                <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white/95 to-red-50 shadow-[0_10px_26px_rgba(248,113,113,0.25)] p-4 md:p-5 relative overflow-hidden">
                    <div className="absolute right-4 top-4 w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white flex items-center justify-center shadow-md opacity-95">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-semibold tracking-wide text-zf-graphite/60 uppercase">
                        Công việc quá hạn
                    </p>
                    <p
                        className={`mt-1.5 text-2xl md:text-3xl font-extrabold ${
                            (data?.overdue ?? 0) > 0 ? 'text-red-600' : 'text-zf-graphite/70'
                        }`}
                    >
                        {loading ? '—' : data?.overdue ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-zf-graphite/65">
                        Hạn trước hôm nay và chưa hoàn thành
                    </p>
                </div>
            </div>

            {/* Table of important tasks */}
            <div className="mt-3 md:mt-4 rounded-2xl border border-zf-graphite/10 bg-zf-bg-secondary/60 shadow-sm overflow-hidden">
                <div className="px-4 md:px-5 py-3 md:py-3.5 border-b border-zf-graphite/10 flex items-center justify-between gap-2">
                    <div>
                        <h3 className="text-sm md:text-base font-semibold text-zf-primary">
                            Công việc sắp đến hạn & quá hạn
                        </h3>
                        <p className="text-[11px] md:text-xs text-zf-graphite/65 mt-0.5">
                            Top các công việc quan trọng theo hạn gần nhất trên toàn bộ dự án.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="p-6 text-center text-sm text-zf-graphite/70">
                        Đang tải dữ liệu công việc triển khai...
                    </div>
                ) : !hasTasks ? (
                    <div className="py-8 px-6 text-center text-sm text-zf-graphite/70 bg-white">
                        <p className="font-semibold text-emerald-600 mb-1">Tuyệt vời!</p>
                        <p>Hiện không có công việc nào quá hạn hoặc sắp đến hạn trong vòng 30 ngày.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-zf-graphite/70 uppercase tracking-wide">
                                        Công việc
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-zf-graphite/70 uppercase tracking-wide">
                                        Dự án
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-zf-graphite/70 uppercase tracking-wide">
                                        Người phụ trách
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-zf-graphite/70 uppercase tracking-wide">
                                        Hạn
                                    </th>
                                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-zf-graphite/70 uppercase tracking-wide">
                                        Trạng thái
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data?.tasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-zf-primary/3 transition-colors">
                                        <td className="px-4 py-2.5 align-top">
                                            <div className="font-semibold text-zf-graphite line-clamp-2">
                                                {task.title}
                                            </div>
                                            <div className="mt-0.5 text-[11px] text-zf-graphite/70">
                                                {task.phase || task.discipline ? (
                                                    <>
                                                        {task.phase && <span>{task.phase}</span>}
                                                        {task.phase && task.discipline && <span> · </span>}
                                                        {task.discipline && <span>{task.discipline}</span>}
                                                    </>
                                                ) : (
                                                    <span>Không có thông tin giai đoạn/bộ môn</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 align-top text-xs text-zf-graphite">
                                            <Link
                                                href={`/projects/${task.projectId}`}
                                                className="text-zf-accent hover:text-zf-accent-dark font-medium transition-colors"
                                            >
                                                {formatProjectLabel(task.projectNo, task.projectName)}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2.5 align-top text-xs text-zf-graphite/80">
                                            {task.assignedTo || 'Chưa phân công'}
                                        </td>
                                        <td className="px-4 py-2.5 align-top text-xs">
                                            <span
                                                className={
                                                    task.isOverdue
                                                        ? 'text-red-600 font-semibold'
                                                        : 'text-zf-graphite/80'
                                                }
                                            >
                                                {formatDateVi(task.dueDate)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 align-top text-right text-xs">
                                            <span
                                                className={`inline-flex items-center justify-end gap-1 px-2 py-1 rounded-full border text-[11px] font-semibold ${STATUS_COLOR_CLASSES[task.status]}`}
                                            >
                                                {STATUS_LABELS[task.status]}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}

