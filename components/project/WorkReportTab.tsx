'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, Download, FileText, Info, Printer } from 'lucide-react';
import { exportTaskReportToExcel, type ReportExportData } from '@/lib/export/excel-export';
import { reportLogger } from '@/lib/logging';
import FeedbackButton from '@/components/project/FeedbackButton';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type ReportTask = {
    id: string;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    progress: number;
    assignedTo: string | null;
    phase?: string | null;
    discipline?: string | null;
    location?: string | null;
    startDate: string | null;
    endDate: string | null;
    dueDate?: string | null;
};

type IssueSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
type IssueStatus = 'Mới' | 'Đang xử lý' | 'Đã đóng';

type IssueItem = {
    id: string;
    type: 'Clash' | 'RFI' | 'Thiếu thông tin' | 'Khác';
    discipline: string;
    location: string;
    severity: IssueSeverity;
    status: IssueStatus;
    assignee: string;
    createdAt: string;
    dueDate: string;
    summary: string;
};

type WorkReportTabProps = {
    projectId: string;
};

type ReportType = 'phase' | 'discipline' | 'assignee' | 'issue' | 'overview';
type DateFilterPreset = 'all' | 'thisMonth' | 'thisQuarter';

const STATUS_LABELS: Record<TaskStatus, string> = {
    TODO: 'Chưa bắt đầu',
    IN_PROGRESS: 'Đang thực hiện',
    COMPLETED: 'Đã hoàn thành',
    DELAYED: 'Chậm tiến độ',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
    LOW: 'Thấp',
    MEDIUM: 'Trung bình',
    HIGH: 'Cao',
    CRITICAL: 'Khẩn cấp',
};

function getEffectiveDueDate(task: ReportTask): Date | null {
    const raw = task.dueDate ?? task.endDate;
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

function isTaskOverdue(task: ReportTask, now: Date = new Date()): boolean {
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

function formatNowVi(): string {
    const d = new Date();
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    })}`;
}

type GroupRow = {
    key: string;
    label: string;
    total: number;
    inProgress: number;
    completed: number;
    overdue: number;
    percentCompleted: number;
};

type TimeBucketStats = {
    overdue: number;
    dueSoon: number;
    future: number;
    noDueDate: number;
    totalPending: number;
};

type ReportGroupsResponse = {
    success: boolean;
    data?: {
        groups: GroupRow[];
    };
    error?: string;
};

export default function WorkReportTab({ projectId }: WorkReportTabProps) {
    const [reportType, setReportType] = useState<ReportType>('phase');
    const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
    const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
    const [priorityFilter, setPriorityFilter] = useState<'ALL' | TaskPriority>('ALL');

    const [tasks, setTasks] = useState<ReportTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [phaseRows, setPhaseRows] = useState<GroupRow[]>([]);
    const [disciplineRows, setDisciplineRows] = useState<GroupRow[]>([]);
    const [assigneeRows, setAssigneeRows] = useState<GroupRow[]>([]);
    const [projectName, setProjectName] = useState<string>('');
    const [reportWarning, setReportWarning] = useState<string | null>(null);
    const [issues, setIssues] = useState<IssueItem[]>([]);
    const [issueError, setIssueError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchTasksAndIssues = async () => {
            setIsLoading(true);
            setError(null);
            setIssueError(null);
            try {
                // Tasks for Dashboard/Report
                const taskRes = await fetch(`/api/projects/${projectId}/tasks`);
                const taskJson = await taskRes.json();
                if (!taskJson.success) {
                    if (isMounted) {
                        setError(taskJson.error || 'Không tải được dữ liệu công việc.');
                        setTasks([]);
                    }
                } else if (isMounted) {
                    setTasks(taskJson.data ?? []);
                }

                // Issues for Issue & va chạm (demo data)
                const issueRes = await fetch(`/api/projects/${projectId}/issues`);
                const issueJson = await issueRes.json();
                if (!issueJson.success) {
                    if (isMounted) {
                        setIssueError(issueJson.error || 'Không tải được dữ liệu issue & va chạm.');
                        setIssues([]);
                    }
                } else if (isMounted) {
                    setIssues(issueJson.data?.issues ?? []);
                }
            } catch (err) {
                console.error('WorkReportTab fetch error', err);
                if (isMounted) {
                    setError('Không thể kết nối tới máy chủ. Vui lòng thử lại.');
                    setTasks([]);
                    setIssueError('Không thể tải dữ liệu issue & va chạm.');
                    setIssues([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects/${projectId}`);
                const json = await res.json();
                if (json.success && json.data) {
                    setProjectName(json.data.name || 'Dự án');
                }
            } catch (err) {
                console.error('Failed to fetch project name', err);
            }
        };

        void fetchTasksAndIssues();
        void fetchProject();
        return () => {
            isMounted = false;
        };
    }, [projectId]);

    const now = useMemo(() => new Date(), []);

    const filteredTasks = useMemo(() => {
        const nowDate = new Date();
        const year = nowDate.getFullYear();
        const month = nowDate.getMonth();

        const quarterStartMonth = Math.floor(month / 3) * 3;

        const inDatePreset = (task: ReportTask) => {
            if (datePreset === 'all') return true;
            const due = getEffectiveDueDate(task);
            if (!due) return true;

            if (datePreset === 'thisMonth') {
                return due.getFullYear() === year && due.getMonth() === month;
            }

            // thisQuarter
            return (
                due.getFullYear() === year &&
                due.getMonth() >= quarterStartMonth &&
                due.getMonth() <= quarterStartMonth + 2
            );
        };

        return tasks.filter((task) => {
            if (statusFilter !== 'ALL' && task.status !== statusFilter) {
                return false;
            }
            if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
                return false;
            }
            if (!inDatePreset(task)) {
                return false;
            }
            return true;
        });
    }, [datePreset, priorityFilter, statusFilter, tasks]);

    useEffect(() => {
        const controller = new AbortController();

        const buildUrl = (groupBy: 'phase' | 'discipline' | 'assignee') => {
            const url = new URL(`/api/projects/${projectId}/tasks/report`, window.location.origin);
            url.searchParams.set('groupBy', groupBy);
            url.searchParams.set('datePreset', datePreset);
            if (statusFilter !== 'ALL') {
                url.searchParams.set('status', statusFilter);
            }
            if (priorityFilter !== 'ALL') {
                url.searchParams.set('priority', priorityFilter);
            }
            return url.toString();
        };

        const fetchGroups = async () => {
            try {
                const [phaseRes, disciplineRes, assigneeRes] = await Promise.all([
                    fetch(buildUrl('phase'), { signal: controller.signal }),
                    fetch(buildUrl('discipline'), { signal: controller.signal }),
                    fetch(buildUrl('assignee'), { signal: controller.signal }),
                ]);

                const [phaseJson, disciplineJson, assigneeJson] = (await Promise.all([
                    phaseRes.json(),
                    disciplineRes.json(),
                    assigneeRes.json(),
                ])) as Array<ReportGroupsResponse & { data?: { groups: GroupRow[]; hasMore?: boolean; totalGroups?: number; message?: string } }>;

                // Check for warnings about too many groups
                const warnings: string[] = [];
                if (phaseJson.data?.hasMore && phaseJson.data?.message) warnings.push(phaseJson.data.message);
                if (disciplineJson.data?.hasMore && disciplineJson.data?.message) warnings.push(disciplineJson.data.message);
                if (assigneeJson.data?.hasMore && assigneeJson.data?.message) warnings.push(assigneeJson.data.message);
                setReportWarning(warnings.length > 0 ? warnings[0] : null);

                if (phaseJson.success && phaseJson.data?.groups) {
                    setPhaseRows(phaseJson.data.groups);
                } else {
                    setPhaseRows([]);
                }

                if (disciplineJson.success && disciplineJson.data?.groups) {
                    setDisciplineRows(disciplineJson.data.groups);
                } else {
                    setDisciplineRows([]);
                }

                if (assigneeJson.success && assigneeJson.data?.groups) {
                    setAssigneeRows(assigneeJson.data.groups);
                } else {
                    setAssigneeRows([]);
                }
            } catch (err) {
                if (!(err instanceof DOMException && err.name === 'AbortError')) {
                    reportLogger.fetchError(err, projectId);
                }
            }
        };

        void fetchGroups();

        return () => controller.abort();
    }, [datePreset, priorityFilter, projectId, statusFilter]);

    const totalRowFor = (rows: GroupRow[]): GroupRow | null => {
        if (rows.length === 0) return null;
        const agg = rows.reduce<GroupRow>(
            (acc, row, index) => {
                if (index === 0) {
                    acc.key = 'TOTAL';
                    acc.label = 'Tổng';
                }
                acc.total += row.total;
                acc.inProgress += row.inProgress;
                acc.completed += row.completed;
                acc.overdue += row.overdue;
                return acc;
            },
            {
                key: 'TOTAL',
                label: 'Tổng',
                total: 0,
                inProgress: 0,
                completed: 0,
                overdue: 0,
                percentCompleted: 0,
            },
        );
        agg.percentCompleted = agg.total === 0 ? 0 : Math.round((agg.completed / agg.total) * 100);
        return agg;
    };

    const totalTasks = filteredTasks.length;
    const completedCount = filteredTasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgressCount = filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const overdueCount = filteredTasks.filter((t) => isTaskOverdue(t, now)).length;

    const timeBuckets = useMemo<TimeBucketStats>(() => {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const msPerDay = 24 * 60 * 60 * 1000;

        let overdue = 0;
        let dueSoon = 0;
        let future = 0;
        let noDueDate = 0;
        let totalPending = 0;

        filteredTasks.forEach((task) => {
            if (task.status === 'COMPLETED') return;

            const due = getEffectiveDueDate(task);
            if (!due) {
                noDueDate += 1;
                totalPending += 1;
                return;
            }

            const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());
            const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / msPerDay);

            totalPending += 1;

            if (diffDays < 0) {
                overdue += 1;
            } else if (diffDays <= 7) {
                dueSoon += 1;
            } else {
                future += 1;
            }
        });

        return { overdue, dueSoon, future, noDueDate, totalPending };
    }, [filteredTasks, now]);

    const topRiskTasks = useMemo(
        () =>
            filteredTasks
                .filter((t) => isTaskOverdue(t, now))
                .sort((a, b) => {
                    const da = getEffectiveDueDate(a);
                    const db = getEffectiveDueDate(b);
                    if (!da || !db) return 0;
                    return da.getTime() - db.getTime();
                })
                .slice(0, 10),
        [filteredTasks, now],
    );

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    const handleExportExcel = () => {
        if (reportType === 'issue' || reportType === 'overview') {
            alert('Tính năng xuất Excel cho báo cáo Issue và Tổng quan dự án sẽ được triển khai ở phase tiếp theo.');
            return;
        }

        const currentRows = reportType === 'phase' ? phaseRows : reportType === 'discipline' ? disciplineRows : assigneeRows;
        if (currentRows.length === 0) {
            alert('Không có dữ liệu để xuất Excel.');
            return;
        }

        try {

        const datePresetLabel = datePreset === 'all' ? 'Tất cả' : datePreset === 'thisMonth' ? 'Tháng này' : 'Quý này';
        const statusLabel = statusFilter === 'ALL' ? 'Tất cả' : STATUS_LABELS[statusFilter];
        const priorityLabel = priorityFilter === 'ALL' ? 'Tất cả' : PRIORITY_LABELS[priorityFilter];

        const exportData: ReportExportData = {
            reportType: reportType,
            reportTitle: currentTitle,
            projectName: projectName,
            groups: currentRows,
            datePreset: datePresetLabel,
            statusFilter: statusLabel,
            priorityFilter: priorityLabel,
            notes: notes.trim() || undefined,
            createdAt: formatNowVi(),
        };

            const filename = `BaoCao_${reportType === 'phase' ? 'GiaiDoan' : reportType === 'discipline' ? 'BoMon' : 'NhanSu'}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`;
            exportTaskReportToExcel(exportData, filename);
        } catch (err) {
            reportLogger.exportError(err, reportType, projectId);
            alert('Không thể xuất Excel. Vui lòng thử lại sau.');
        }
    };

    const titleByReportType: Record<ReportType, string> = {
        phase: 'Tiến độ theo giai đoạn',
        discipline: 'Tiến độ theo bộ môn',
        assignee: 'Công việc theo nhân sự',
        issue: 'Báo cáo Issue & va chạm (đang chờ dữ liệu)',
        overview: 'Báo cáo tổng quan dự án',
    };

    const currentTitle = titleByReportType[reportType];

    const renderGroupTable = (rows: GroupRow[]) => {
        if (rows.length === 0) {
            return (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-12 px-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                        <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Chưa có dữ liệu phù hợp với bộ lọc hiện tại</h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto">
                        Hãy thử điều chỉnh bộ lọc (Khoảng thời gian, Trạng thái, Mức ưu tiên) hoặc tạo công việc mới cho dự án.
                    </p>
                </div>
            );
        }
        const total = totalRowFor(rows);
        return (
            <div className="overflow-hidden rounded-2xl border border-gray-100">
                <table className="min-w-full text-sm print-table">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                {reportType === 'phase' ? 'Giai đoạn' : reportType === 'discipline' ? 'Bộ môn' : 'Nhân sự'}
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Tổng công việc
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Đang thực hiện
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Hoàn thành
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Quá hạn
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                % hoàn thành
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {rows.map((row) => (
                            <tr key={row.key}>
                                <td className="px-4 py-2 text-sm text-gray-800">{row.label}</td>
                                <td className="px-4 py-2 text-right text-sm text-gray-800">{row.total}</td>
                                <td className="px-4 py-2 text-right text-sm text-gray-800">{row.inProgress}</td>
                                <td className="px-4 py-2 text-right text-sm text-gray-800">{row.completed}</td>
                                <td className="px-4 py-2 text-right text-sm text-gray-800">{row.overdue}</td>
                                <td className="px-4 py-2 text-right text-sm font-semibold text-zf-primary">
                                    {row.percentCompleted}%
                                </td>
                            </tr>
                        ))}
                        {total && (
                            <tr className="bg-slate-50/80 font-semibold">
                                <td className="px-4 py-2 text-sm text-gray-900">{total.label}</td>
                                <td className="px-4 py-2 text-right text-sm text-gray-900">{total.total}</td>
                                <td className="px-4 py-2 text-right text-sm text-gray-900">{total.inProgress}</td>
                                <td className="px-4 py-2 text-right text-sm text-gray-900">{total.completed}</td>
                                <td className="px-4 py-2 text-right text-sm text-gray-900">{total.overdue}</td>
                                <td className="px-4 py-2 text-right text-sm text-zf-primary">
                                    {total.percentCompleted}%
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderIssueReport = () => {
        if (isLoading) {
            return <p className="py-4 text-sm text-gray-500">Đang tải dữ liệu Issue & va chạm...</p>;
        }

        if (issueError) {
            return (
                <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4 text-sm text-red-700 flex gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-1">Không tải được dữ liệu Issue & va chạm</p>
                        <p>{issueError}</p>
                    </div>
                </div>
            );
        }

        if (issues.length === 0) {
            return (
                <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/60 py-8 px-6 text-center text-sm text-amber-800">
                    <p className="font-semibold mb-1">Hiện chưa có Issue / va chạm nào cho dự án này.</p>
                    <p>Anh có thể dùng dữ liệu demo hoặc chờ module Issue chính thức trong phase tiếp theo.</p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <div>
                        <p className="font-semibold">Dữ liệu demo Issue & va chạm</p>
                        <p>
                            Dữ liệu hiện tại được lấy từ API mock{' '}
                            <code className="px-1 py-0.5 rounded bg-amber-100 text-[10px]">
                                /api/projects/[id]/issues
                            </code>{' '}
                            để anh hình dung nhanh cấu trúc báo cáo. Khi module Issue thật sẵn sàng, API này sẽ trả về dữ
                            liệu thực tế.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="min-w-full text-xs md:text-sm print-table">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide">
                                    Mã issue
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide">
                                    Loại vấn đề
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide">
                                    Bộ môn
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide">
                                    Vị trí
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide">
                                    Mức độ
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide">
                                    Trạng thái
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide">
                                    Người phụ trách
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide">
                                    Ngày tạo
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide">
                                    Hạn xử lý
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {issues.map((issue) => (
                                <tr key={issue.id}>
                                    <td className="px-3 py-2 font-semibold text-gray-900">{issue.id}</td>
                                    <td className="px-3 py-2 text-gray-800">{issue.type}</td>
                                    <td className="px-3 py-2 text-gray-800">{issue.discipline}</td>
                                    <td className="px-3 py-2 text-gray-800">{issue.location}</td>
                                    <td className="px-3 py-2">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                issue.severity === 'Critical'
                                                    ? 'bg-red-100 text-red-700'
                                                : issue.severity === 'High'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : issue.severity === 'Medium'
                                                    ? 'bg-yellow-50 text-yellow-700'
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            {issue.severity}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                issue.status === 'Mới'
                                                    ? 'bg-sky-50 text-sky-700'
                                                : issue.status === 'Đang xử lý'
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : 'bg-emerald-50 text-emerald-700'
                                            }`}
                                        >
                                            {issue.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-gray-800">{issue.assignee}</td>
                                    <td className="px-3 py-2 text-gray-700">{formatViDate(issue.createdAt)}</td>
                                    <td className="px-3 py-2 text-gray-700">{formatViDate(issue.dueDate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderOverviewReport = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Tổng công việc</p>
                    <p className="mt-1 text-xl font-bold text-zf-primary">{totalTasks}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">% hoàn thành</p>
                    <p className="mt-1 text-xl font-bold text-emerald-600">
                        {totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100)}%
                    </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Đang thực hiện</p>
                    <p className="mt-1 text-xl font-bold text-zf-accent">{inProgressCount}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Công việc quá hạn</p>
                    <p className="mt-1 text-xl font-bold text-red-600">{overdueCount}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white/90 p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">Vấn đề trọng tâm (dựa trên công việc quá hạn)</h3>
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                        <Info className="w-3 h-3" />
                        Tự động lấy từ danh sách công việc quá hạn
                    </span>
                </div>

                {topRiskTasks.length === 0 ? (
                    <p className="py-4 text-sm text-gray-500 text-center">
                        Hiện chưa có công việc nào quá hạn trong phạm vi lọc – không có vấn đề trọng tâm nào cần cảnh báo.
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-100">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Nhóm vấn đề
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Mô tả ngắn
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Mức độ
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Trạng thái
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Người phụ trách
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Hạn xử lý
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {topRiskTasks.map((task) => (
                                    <tr key={task.id}>
                                        <td className="px-4 py-2 text-xs text-gray-800 font-semibold">Tiến độ</td>
                                        <td className="px-4 py-2 text-sm text-gray-800">
                                            {task.title}
                                            <div className="text-xs text-gray-500 line-clamp-1">
                                                {task.description || 'Không có mô tả'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-xs font-semibold text-amber-700">
                                            {PRIORITY_LABELS[task.priority]}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-red-600 font-semibold">
                                            {STATUS_LABELS[task.status]}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-800">
                                            {task.assignedTo || 'Chưa phân công'}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-red-600 font-semibold">
                                            {formatViDate(task.dueDate ?? task.endDate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    const renderReportBody = () => {
        if (isLoading) {
            return <p className="py-6 text-sm text-gray-500">Đang tải dữ liệu báo cáo...</p>;
        }
        if (reportType === 'issue') {
            return renderIssueReport();
        }
        if (reportType === 'overview') {
            return renderOverviewReport();
        }
        if (reportType === 'phase') {
            return renderGroupTable(phaseRows);
        }
        if (reportType === 'discipline') {
            return renderGroupTable(disciplineRows);
        }
        return renderGroupTable(assigneeRows);
    };

    return (
        <div className="space-y-4 md:space-y-6 print-content">
            {/* Print header - chỉ hiển thị khi print */}
            <div className="print-header hidden" style={{ display: 'none' }}>
                <div>
                    <div className="print-logo">ZFENIX</div>
                </div>
                <div className="print-meta">
                    <div className="font-semibold">{projectName || 'Dự án'}</div>
                    <div>{formatNowVi()}</div>
                </div>
            </div>

            {/* Header + actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 no-print">
                <div>
                    <h2 className="text-base md:text-lg font-bold text-gray-900">Báo cáo tiến độ công việc</h2>
                    <p className="mt-1 text-[11px] md:text-xs text-gray-500">
                        Tổng hợp theo giai đoạn, bộ môn, nhân sự, issue và báo cáo tổng quan cho cuộc họp.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zf-primary text-white text-xs font-semibold shadow-sm hover:bg-zf-primary/90"
                    >
                        <Printer className="w-4 h-4" />
                        <span>In báo cáo</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={isLoading || (reportType !== 'phase' && reportType !== 'discipline' && reportType !== 'assignee')}
                    >
                        <Download className="w-4 h-4" />
                        <span>Xuất Excel</span>
                    </button>
                    <FeedbackButton module="report" projectId={projectId} />
                </div>
            </div>

            {/* Bộ lọc & chọn loại báo cáo */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-3 no-print">
                {/* Chọn loại báo cáo */}
                <div className="inline-flex items-center gap-1 bg-white rounded-2xl border border-gray-200 px-1 py-0.5 shadow-sm self-start">
                    <button
                        type="button"
                        onClick={() => setReportType('phase')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold ${
                            reportType === 'phase'
                                ? 'bg-zf-primary text-white'
                                : 'text-gray-600 hover:bg-zf-primary/5 hover:text-zf-primary'
                        }`}
                    >
                        Theo giai đoạn
                    </button>
                    <button
                        type="button"
                        onClick={() => setReportType('discipline')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold ${
                            reportType === 'discipline'
                                ? 'bg-zf-primary text-white'
                                : 'text-gray-600 hover:bg-zf-primary/5 hover:text-zf-primary'
                        }`}
                    >
                        Theo bộ môn
                    </button>
                    <button
                        type="button"
                        onClick={() => setReportType('assignee')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold ${
                            reportType === 'assignee'
                                ? 'bg-zf-primary text-white'
                                : 'text-gray-600 hover:bg-zf-primary/5 hover:text-zf-primary'
                        }`}
                    >
                        Theo nhân sự
                    </button>
                    <button
                        type="button"
                        onClick={() => setReportType('issue')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold ${
                            reportType === 'issue'
                                ? 'bg-zf-primary text-white'
                                : 'text-gray-600 hover:bg-zf-primary/5 hover:text-zf-primary'
                        }`}
                    >
                        Issue & va chạm
                    </button>
                    <button
                        type="button"
                        onClick={() => setReportType('overview')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold ${
                            reportType === 'overview'
                                ? 'bg-zf-primary text-white'
                                : 'text-gray-600 hover:bg-zf-primary/5 hover:text-zf-primary'
                        }`}
                    >
                        Tổng quan dự án
                    </button>
                </div>

                {/* Bộ lọc chung */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Khoảng thời gian</span>
                    </div>
                    <select
                        value={datePreset}
                        onChange={(e) => setDatePreset(e.target.value as DateFilterPreset)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-[11px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-zf-accent focus:border-transparent"
                    >
                        <option value="all">Tất cả</option>
                        <option value="thisMonth">Tháng này</option>
                        <option value="thisQuarter">Quý này</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value === 'ALL' ? 'ALL' : (e.target.value as TaskStatus))
                        }
                        className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-[11px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-zf-accent focus:border-transparent"
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="TODO">Chưa bắt đầu</option>
                        <option value="IN_PROGRESS">Đang thực hiện</option>
                        <option value="COMPLETED">Đã hoàn thành</option>
                        <option value="DELAYED">Chậm tiến độ</option>
                    </select>
                    <select
                        value={priorityFilter}
                        onChange={(e) =>
                            setPriorityFilter(e.target.value === 'ALL' ? 'ALL' : (e.target.value as TaskPriority))
                        }
                        className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-[11px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-zf-accent focus:border-transparent"
                    >
                        <option value="ALL">Tất cả ưu tiên</option>
                        <option value="LOW">Thấp</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HIGH">Cao</option>
                        <option value="CRITICAL">Khẩn cấp</option>
                    </select>
                </div>
            </div>

            {/* Card báo cáo chính */}
            <div className="rounded-2xl border border-gray-100 bg-white/90 p-4 md:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h3 className="text-sm md:text-base font-semibold text-gray-800 print-title">
                            {currentTitle}
                        </h3>
                        <p className="text-[11px] md:text-xs text-gray-500 print-subtitle">
                            {projectName || 'Dự án'} · {filteredTasks.length} công việc trong phạm vi lọc · Thời điểm tạo:{' '}
                            {formatNowVi()}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-100 bg-red-50/80 px-3 py-2 text-xs text-red-700 flex gap-2 items-start">
                        <AlertCircle className="w-4 h-4 mt-0.5" />
                        <div>
                            <p className="font-semibold">Không tải được dữ liệu báo cáo</p>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {reportWarning && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-700 flex gap-2 items-start">
                        <AlertCircle className="w-4 h-4 mt-0.5" />
                        <div>
                            <p className="font-semibold">Lưu ý</p>
                            <p>{reportWarning}</p>
                        </div>
                    </div>
                )}

                {/* Dashboard thời gian & tiến độ tổng quan */}
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                Tổng công việc trong phạm vi lọc
                            </p>
                            <p className="mt-1 text-xl font-bold text-zf-primary">{totalTasks}</p>
                            <p className="mt-1 text-[11px] text-gray-500">
                                Bao gồm tất cả trạng thái & bộ lọc hiện tại.
                            </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                Tỷ lệ hoàn thành
                            </p>
                            <p className="mt-1 text-xl font-bold text-emerald-600">
                                {totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100)}%
                            </p>
                            <p className="mt-1 text-[11px] text-gray-500">
                                Dựa trên số công việc đã được đánh dấu hoàn thành.
                            </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                Sắp đến hạn (≤ 7 ngày)
                            </p>
                            <p className="mt-1 text-xl font-bold text-zf-accent">{timeBuckets.dueSoon}</p>
                            <p className="mt-1 text-[11px] text-gray-500">
                                Công việc chưa hoàn thành, có hạn trong 7 ngày tới.
                            </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                Công việc quá hạn
                            </p>
                            <p className="mt-1 text-xl font-bold text-red-600">{overdueCount}</p>
                            <p className="mt-1 text-[11px] text-gray-500">
                                Dùng để nhận diện rủi ro tiến độ ngay lập tức.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div>
                                <p className="text-xs font-semibold text-gray-800">
                                    Phân bổ công việc theo thời gian
                                </p>
                                <p className="text-[11px] text-gray-500">
                                    Tập trung vào các công việc CHƯA hoàn thành theo hạn chót.
                                </p>
                            </div>
                            <div className="text-[11px] text-gray-500 hidden sm:block">
                                Tổng chưa hoàn thành: {timeBuckets.totalPending}
                            </div>
                        </div>
                        {timeBuckets.totalPending === 0 ? (
                            <p className="text-[11px] text-gray-500">
                                Hiện không có công việc nào đang mở trong phạm vi lọc (tất cả đã hoàn thành hoặc chưa
                                được tạo).
                            </p>
                        ) : (
                            <>
                                <div className="w-full h-3 rounded-full bg-white overflow-hidden flex">
                                    {timeBuckets.overdue > 0 && (
                                        <div
                                            className="h-full bg-red-500"
                                            style={{
                                                width: `${Math.max(
                                                    5,
                                                    (timeBuckets.overdue / timeBuckets.totalPending) * 100,
                                                )}%`,
                                            }}
                                        />
                                    )}
                                    {timeBuckets.dueSoon > 0 && (
                                        <div
                                            className="h-full bg-amber-400"
                                            style={{
                                                width: `${Math.max(
                                                    5,
                                                    (timeBuckets.dueSoon / timeBuckets.totalPending) * 100,
                                                )}%`,
                                            }}
                                        />
                                    )}
                                    {timeBuckets.future > 0 && (
                                        <div
                                            className="h-full bg-emerald-500"
                                            style={{
                                                width: `${Math.max(
                                                    5,
                                                    (timeBuckets.future / timeBuckets.totalPending) * 100,
                                                )}%`,
                                            }}
                                        />
                                    )}
                                    {timeBuckets.noDueDate > 0 && (
                                        <div
                                            className="h-full bg-slate-300"
                                            style={{
                                                width: `${Math.max(
                                                    5,
                                                    (timeBuckets.noDueDate / timeBuckets.totalPending) * 100,
                                                )}%`,
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                                        Quá hạn: {timeBuckets.overdue}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <span className="inline-block w-3 h-3 rounded-full bg-amber-400" />
                                        Đến hạn ≤ 7 ngày: {timeBuckets.dueSoon}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                                        Hạn sau 7 ngày: {timeBuckets.future}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <span className="inline-block w-3 h-3 rounded-full bg-slate-300" />
                                        Chưa có hạn: {timeBuckets.noDueDate}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {renderReportBody()}
            </div>

            {/* Ghi chú / Nhận xét */}
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 no-print">
                    <h3 className="text-sm font-semibold text-gray-800">Ghi chú / Nhận xét cho cuộc họp</h3>
                    <span className="text-[11px] text-gray-400">Nội dung này sẽ hiển thị trên bản in</span>
                </div>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ví dụ: Các hạng mục cần ưu tiên tuần này, rủi ro chính, đề xuất nguồn lực bổ sung..."
                    className="min-h-[120px] w-full rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-zf-accent focus:border-transparent no-print"
                />
                {/* Print version of notes */}
                {notes.trim() && (
                    <div className="print-notes hidden" style={{ display: 'none' }}>
                        <div className="print-notes-title">Ghi chú / Nhận xét cho cuộc họp</div>
                        <div className="print-notes-content">{notes}</div>
                    </div>
                )}
            </div>
        </div>
    );
}

