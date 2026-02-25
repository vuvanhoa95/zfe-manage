'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import {
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle,
    Plus,
    Pencil,
    Trash2,
    X,
    LayoutList,
    Calendar,
    User as UserIcon,
    ArrowUpCircle,
    ChevronDown,
    LayoutGrid,
    BarChart2,
    Table as TableIcon,
} from 'lucide-react';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type Task = {
    id: string;
    projectId: string;
    title: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    progress: number;
    assignedTo: string | null;
    createdAt: string;
    updatedAt: string;
};

type StaffOption = {
    id: string;
    name: string;
    type: 'quotation' | 'outsourcing';
    discipline?: string | null;
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
    TODO: {
        label: 'Chưa bắt đầu',
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: <Circle className="w-4 h-4" />
    },
    IN_PROGRESS: {
        label: 'Đang thực hiện',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Clock className="w-4 h-4" />
    },
    COMPLETED: {
        label: 'Đã hoàn thành',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <CheckCircle2 className="w-4 h-4" />
    },
    DELAYED: {
        label: 'Chậm tiến độ',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: <AlertCircle className="w-4 h-4" />
    },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
    LOW: { label: 'Thấp', color: 'text-gray-500' },
    MEDIUM: { label: 'Trung bình', color: 'text-blue-500' },
    HIGH: { label: 'Cao', color: 'text-orange-500' },
    CRITICAL: { label: 'Khẩn cấp', color: 'text-red-600' },
};

const BOARD_STATUS_THEME: Record<
    TaskStatus,
    {
        columnBg: string;
        topBorder: string;
        headerBg: string;
        headerText: string;
        countText: string;
        dotBg: string;
    }
> = {
    TODO: {
        columnBg: 'bg-gray-50',
        topBorder: 'border-t-gray-300',
        headerBg: 'bg-gray-100/70',
        headerText: 'text-gray-700',
        countText: 'text-gray-600',
        dotBg: 'bg-gray-500',
    },
    IN_PROGRESS: {
        columnBg: 'bg-blue-50/40',
        topBorder: 'border-t-blue-500',
        headerBg: 'bg-blue-50',
        headerText: 'text-blue-700',
        countText: 'text-blue-600',
        dotBg: 'bg-blue-600',
    },
    COMPLETED: {
        columnBg: 'bg-emerald-50/40',
        topBorder: 'border-t-emerald-500',
        headerBg: 'bg-emerald-50',
        headerText: 'text-emerald-700',
        countText: 'text-emerald-600',
        dotBg: 'bg-emerald-600',
    },
    DELAYED: {
        columnBg: 'bg-red-50/40',
        topBorder: 'border-t-red-500',
        headerBg: 'bg-red-50',
        headerText: 'text-red-700',
        countText: 'text-red-600',
        dotBg: 'bg-red-600',
    },
};

const PRIORITY_THEME: Record<
    TaskPriority,
    {
        dotBg: string;
        text: string;
        pillBg: string;
        pillBorder: string;
    }
> = {
    LOW: { dotBg: 'bg-gray-500', text: 'text-gray-700', pillBg: 'bg-gray-50', pillBorder: 'border-gray-200' },
    MEDIUM: { dotBg: 'bg-blue-600', text: 'text-blue-700', pillBg: 'bg-blue-50', pillBorder: 'border-blue-200' },
    HIGH: { dotBg: 'bg-orange-500', text: 'text-orange-700', pillBg: 'bg-orange-50', pillBorder: 'border-orange-200' },
    CRITICAL: { dotBg: 'bg-red-600', text: 'text-red-700', pillBg: 'bg-red-50', pillBorder: 'border-red-200' },
};

const ASSIGNEE_COLOR_PRESETS = [
    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-600' },
    { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', dot: 'bg-sky-600' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-600' },
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-600' },
    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-600' },
    { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-600' },
    { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', dot: 'bg-teal-600' },
] as const;

type AssigneePreset = (typeof ASSIGNEE_COLOR_PRESETS)[number];

function hashStringToIndex(input: string, modulo: number) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash * 31 + input.charCodeAt(i)) % modulo;
    }
    return hash;
}

function getAssigneePreset(name: string): AssigneePreset {
    const normalized = name.trim().toLowerCase();
    const idx = hashStringToIndex(normalized, ASSIGNEE_COLOR_PRESETS.length);
    return ASSIGNEE_COLOR_PRESETS[idx] ?? ASSIGNEE_COLOR_PRESETS[0];
}

function AssigneePill({ name }: { name: string }) {
    const preset = getAssigneePreset(name);
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border ${preset.bg} ${preset.border} ${preset.text}`}
            title={`Phụ trách: ${name}`}
        >
            <span className={`w-2 h-2 rounded-full ${preset.dot}`} />
            <span className="truncate max-w-[180px]">{name}</span>
        </span>
    );
}

function StatusDropdown({
    value,
    onChange,
}: {
    value: TaskStatus;
    onChange: (next: TaskStatus) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const onMouseDown = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            if (target.closest('[data-status-dropdown="root"]')) return;
            setIsOpen(false);
        };
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [isOpen]);

    const entries = Object.entries(STATUS_CONFIG) as Array<[TaskStatus, (typeof STATUS_CONFIG)[TaskStatus]]>;
    const selectedTheme = BOARD_STATUS_THEME[value];

    return (
        <div className="relative" data-status-dropdown="root">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                className="w-full h-[46px] px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium pr-10 transition-all cursor-pointer flex items-center justify-between"
            >
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border ${STATUS_CONFIG[value].color}`}>
                    <span className={`w-2 h-2 rounded-full ${selectedTheme.dotBg}`} />
                    {STATUS_CONFIG[value].label}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] rounded-xl border border-gray-200 bg-white shadow-lg z-[220] p-1">
                    {entries.map(([key, cfg]) => {
                        const theme = BOARD_STATUS_THEME[key];
                        const isActive = key === value;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    onChange(key);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-2 py-2 rounded-lg transition-colors flex items-center justify-between hover:bg-gray-50 ${isActive ? 'bg-gray-50' : ''}`}
                            >
                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border ${cfg.color}`}>
                                    <span className={`w-2 h-2 rounded-full ${theme.dotBg}`} />
                                    {cfg.label}
                                </span>
                                {isActive && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function PriorityDropdown({
    value,
    onChange,
}: {
    value: TaskPriority;
    onChange: (next: TaskPriority) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const onMouseDown = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            if (target.closest('[data-priority-dropdown="root"]')) return;
            setIsOpen(false);
        };
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [isOpen]);

    const entries = Object.entries(PRIORITY_CONFIG) as Array<[TaskPriority, (typeof PRIORITY_CONFIG)[TaskPriority]]>;
    const theme = PRIORITY_THEME[value];

    return (
        <div className="relative" data-priority-dropdown="root">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                className="w-full h-[46px] px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium pr-10 transition-all cursor-pointer flex items-center justify-between"
            >
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border ${theme.pillBg} ${theme.pillBorder} ${theme.text}`}>
                    <span className={`w-2 h-2 rounded-full ${theme.dotBg}`} />
                    {PRIORITY_CONFIG[value].label}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] rounded-xl border border-gray-200 bg-white shadow-lg z-[220] p-1">
                    {entries.map(([key, cfg]) => {
                        const optionTheme = PRIORITY_THEME[key];
                        const isActive = key === value;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    onChange(key);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-2 py-2 rounded-lg transition-colors flex items-center justify-between hover:bg-gray-50 ${isActive ? 'bg-gray-50' : ''}`}
                            >
                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border ${optionTheme.pillBg} ${optionTheme.pillBorder} ${optionTheme.text}`}>
                                    <span className={`w-2 h-2 rounded-full ${optionTheme.dotBg}`} />
                                    {cfg.label}
                                </span>
                                {isActive && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function TaskTab({
    projectId,
    isNew
}: {
    projectId: string;
    isNew: boolean;
}) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'board' | 'gantt' | 'table'>('list');
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
    const [priorityFilter, setPriorityFilter] = useState<'ALL' | TaskPriority>('ALL');
    const [assigneeFilter, setAssigneeFilter] = useState<string>('');
    const isDev = process.env.NODE_ENV === 'development';
    const [columnSettings, setColumnSettings] = useState<{
        showStatus: boolean;
        showDates: boolean;
        showAssignee: boolean;
        showPriority: boolean;
        showProgress: boolean;
    }>({
        showStatus: true,
        showDates: true,
        showAssignee: true,
        showPriority: true,
        showProgress: true,
    });

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'TODO' as TaskStatus,
        priority: 'MEDIUM' as TaskPriority,
        progress: 0,
        assignedTo: '',
    });
    const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
    const [isLoadingStaffOptions, setIsLoadingStaffOptions] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/tasks`);
            const result = await res.json();
            if (result.success) {
                setTasks(result.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    const handleSeedSampleTasks = useCallback(async () => {
        if (!projectId || isNew) return;
        try {
            const res = await fetch('/api/dev/seed-sample-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, replace: true }),
            });
            const result = (await res.json()) as { success?: boolean; error?: string };
            if (!result.success) {
                console.error('Seed sample tasks failed:', result.error || result);
                return;
            }
            await fetchTasks();
        } catch (error) {
            console.error('Seed sample tasks failed:', error);
        }
    }, [projectId, isNew, fetchTasks]);

    const fetchStaffOptions = useCallback(async () => {
        setIsLoadingStaffOptions(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/staff-options`);
            const result = (await res.json()) as {
                success?: boolean;
                data?: StaffOption[];
            };

            if (result.success && Array.isArray(result.data)) {
                setStaffOptions(result.data);
            } else {
                setStaffOptions([]);
            }
        } catch (error) {
            console.error('Failed to fetch staff options for tasks:', error);
            setStaffOptions([]);
        } finally {
            setIsLoadingStaffOptions(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = window.localStorage.getItem(`task-column-settings-${projectId}`);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as Partial<typeof columnSettings>;
            setColumnSettings((prev) => ({
                ...prev,
                ...parsed,
            }));
        } catch {
            // ignore
        }
    }, [projectId]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(
            `task-column-settings-${projectId}`,
            JSON.stringify(columnSettings),
        );
    }, [projectId, columnSettings]);

    useEffect(() => {
        if (!isNew && projectId) {
            void fetchTasks();
            void fetchStaffOptions();
        }
    }, [projectId, isNew, fetchTasks, fetchStaffOptions]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleOpenCreate = () => {
        setEditingTask(null);
        setFormData({
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            status: 'TODO',
            priority: 'MEDIUM',
            progress: 0,
            assignedTo: '',
        });
        setIsFormOpen(true);
    };

    const handleDragStart = (event: React.DragEvent<HTMLDivElement>, taskId: string) => {
        setDraggingTaskId(taskId);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', taskId);
    };

    const handleDragEnd = () => {
        setDraggingTaskId(null);
    };

    const handleDropOnColumn = async (event: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        event.preventDefault();
        const taskId = event.dataTransfer.getData('text/plain') || draggingTaskId;
        if (!taskId) return;

        const task = tasks.find((t) => t.id === taskId);
        if (!task || task.status === status) return;

        try {
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === taskId
                        ? {
                              ...t,
                              status,
                              progress: status === 'COMPLETED' ? 100 : t.progress,
                          }
                        : t,
                ),
            );

            const body: Partial<Pick<Task, 'status' | 'progress'>> = {
                status,
            };

            if (status === 'COMPLETED' && task.progress < 100) {
                body.progress = 100;
            }

            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await res.json();
            if (!result.success) {
                await fetchTasks();
            }
        } catch (error) {
            console.error('Failed to update task status via drag & drop:', error);
            await fetchTasks();
        } finally {
            setDraggingTaskId(null);
        }
    };

    const handleColumnDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    const handleOpenEdit = (task: Task) => {
        setEditingTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            startDate: task.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : '',
            endDate: task.endDate ? new Date(task.endDate).toISOString().slice(0, 10) : '',
            status: task.status,
            priority: task.priority,
            progress: task.progress,
            assignedTo: task.assignedTo || '',
        });
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = editingTask
                ? `/api/tasks/${editingTask.id}`
                : `/api/projects/${projectId}/tasks`;
            const method = editingTask ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await res.json();
            if (result.success) {
                setIsFormOpen(false);
                fetchTasks();
            } else {
                alert(result.error || 'Có lỗi xảy ra khi lưu công việc');
            }
        } catch (error) {
            console.error('Failed to save task:', error);
            alert('Không thể kết nối với máy chủ');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (taskId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa công việc này?')) return;
        try {
            const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                fetchTasks();
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    };

    const overallProgress = useMemo(() => {
        if (tasks.length === 0) return 0;
        const total = tasks.reduce((sum, task) => sum + task.progress, 0);
        return Math.round(total / tasks.length);
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        const keyword = searchQuery.trim().toLowerCase();
        const assignee = assigneeFilter.trim().toLowerCase();

        return tasks.filter((task) => {
            if (statusFilter !== 'ALL' && task.status !== statusFilter) {
                return false;
            }

            if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
                return false;
            }

            if (assignee) {
                const taskAssignee = (task.assignedTo ?? '').trim().toLowerCase();
                if (taskAssignee !== assignee) {
                    return false;
                }
            }

            if (!keyword) {
                return true;
            }

            const title = task.title.toLowerCase();
            const description = (task.description ?? '').toLowerCase();

            return title.includes(keyword) || description.includes(keyword);
        });
    }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter]);

    const groupedTasks = useMemo(
        () => ({
            TODO: filteredTasks.filter((task) => task.status === 'TODO'),
            IN_PROGRESS: filteredTasks.filter((task) => task.status === 'IN_PROGRESS'),
            COMPLETED: filteredTasks.filter((task) => task.status === 'COMPLETED'),
            DELAYED: filteredTasks.filter((task) => task.status === 'DELAYED'),
        }),
        [filteredTasks],
    );

    const ganttRange = useMemo(() => {
        if (filteredTasks.length === 0) {
            return null;
        }
        const dates: Date[] = [];
        filteredTasks.forEach((task) => {
            if (task.startDate) dates.push(new Date(task.startDate));
            if (task.endDate) dates.push(new Date(task.endDate));
        });
        if (dates.length === 0) {
            return null;
        }
        const min = new Date(Math.min(...dates.map((d) => d.getTime())));
        const max = new Date(Math.max(...dates.map((d) => d.getTime())));
        if (min.getTime() === max.getTime()) {
            max.setDate(max.getDate() + 1);
        }
        const totalDays = Math.max(
            1,
            Math.round((max.getTime() - min.getTime()) / (24 * 60 * 60 * 1000)),
        );
        return { start: min, end: max, totalDays };
    }, [filteredTasks]);

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setPriorityFilter('ALL');
        setAssigneeFilter('');
    };

    const taskModal = isFormOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-6xl mx-4 shadow-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {editingTask ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Cung cấp thông tin chi tiết về nhiệm vụ.</p>
                    </div>
                    <button
                        onClick={() => setIsFormOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        aria-label="Đóng"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Tên công việc <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="Ví dụ: Mô hình kiến trúc tầng 1"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả chi tiết</label>
                            <textarea
                                rows={2}
                                placeholder="Nhập yêu cầu hoặc ghi chú cho công việc..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Bắt đầu</label>
                                <div className="relative">
                                    <DatePicker
                                        selected={formData.startDate ? new Date(formData.startDate) : null}
                                        onChange={(date: Date | null) =>
                                            setFormData({
                                                ...formData,
                                                startDate: date ? format(date, 'yyyy-MM-dd') : '',
                                            })
                                        }
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="Chọn ngày bắt đầu"
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-all"
                                        onKeyDown={(e) => e.preventDefault()}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Kết thúc</label>
                                <div className="relative">
                                    <DatePicker
                                        selected={formData.endDate ? new Date(formData.endDate) : null}
                                        onChange={(date: Date | null) =>
                                            setFormData({
                                                ...formData,
                                                endDate: date ? format(date, 'yyyy-MM-dd') : '',
                                            })
                                        }
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="Chọn ngày kết thúc"
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-all"
                                        onKeyDown={(e) => e.preventDefault()}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái</label>
                                <StatusDropdown
                                    value={formData.status}
                                    onChange={(next) => setFormData({ ...formData, status: next })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Ưu tiên</label>
                                <PriorityDropdown
                                    value={formData.priority}
                                    onChange={(next) => setFormData({ ...formData, priority: next })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Tiến độ ({formData.progress}%)
                                </label>
                                <div className="flex items-center gap-3 h-[46px]">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        value={formData.progress}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                progress: Number.parseInt(e.target.value, 10) || 0,
                                            })
                                        }
                                    />
                                    <span className="text-sm font-bold text-blue-600 w-10 text-right">
                                        {formData.progress}%
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Phân công</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        list={`task-assignees-${projectId}`}
                                        placeholder="Tên người phụ trách (có thể chọn từ danh sách)"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={formData.assignedTo}
                                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                    />
                                    {isLoadingStaffOptions && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                            Đang tải...
                                        </span>
                                    )}
                                </div>
                                {staffOptions.length > 0 && (
                                    <datalist id={`task-assignees-${projectId}`}>
                                        {staffOptions.map((option) => (
                                            <option key={`${option.type}-${option.id}`} value={option.name}>
                                                {option.discipline ? `${option.name} – ${option.discipline}` : option.name}
                                            </option>
                                        ))}
                                    </datalist>
                                )}
                                <p className="mt-0.5 text-[11px] text-gray-500">
                                    Gợi ý từ báo giá chốt và danh sách nhân sự outsource. Anh vẫn có thể nhập tay nếu cần.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="px-6 py-2.5 text-gray-600 font-semibold hover:bg-gray-50 rounded-xl transition-all"
                            disabled={isSaving}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Đang lưu...
                                </div>
                            ) : (
                                'Lưu công việc'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    ) : null;

    if (isNew) {
        return (
            <div className="px-4 pt-4 pb-6 md:px-6 md:pt-4 md:pb-8 flex items-center justify-center">
                <p className="text-gray-600 italic">Vui lòng lưu dự án trước khi quản lý công việc.</p>
            </div>
        );
    }

    return (
        <>
            <div className="px-4 pt-3 pb-5 md:px-6 md:pt-3 md:pb-7 overflow-y-auto h-full">
                <div className="max-w-6xl mx-auto space-y-3">
                {/* Header Stats */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-2.5 md:px-4 md:py-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <LayoutList className="w-4 h-4" />
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-gray-900">Công việc & Tiến độ</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* View toggle: icon-only để tiết kiệm không gian */}
                            <div className="flex items-center gap-1.5 bg-gray-50 rounded-full px-1 py-0.5">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className={`inline-flex items-center justify-center rounded-full p-1.5 text-xs transition-all ${
                                        viewMode === 'list'
                                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-100'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                    aria-label="Chế độ danh sách"
                                    title="Danh sách"
                                >
                                    <LayoutList className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    className={`inline-flex items-center justify-center rounded-full p-1.5 text-xs transition-all ${
                                        viewMode === 'table'
                                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-100'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                    aria-label="Chế độ bảng"
                                    title="Bảng"
                                >
                                    <TableIcon className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('board')}
                                    className={`inline-flex items-center justify-center rounded-full p-1.5 text-xs transition-all ${
                                        viewMode === 'board'
                                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-100'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                    aria-label="Chế độ board"
                                    title="Board"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('gantt')}
                                    className={`inline-flex items-center justify-center rounded-full p-1.5 text-xs transition-all ${
                                        viewMode === 'gantt'
                                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-100'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                    aria-label="Chế độ Gantt / Timeline"
                                    title="Gantt / Timeline"
                                >
                                    <BarChart2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="hidden md:flex md:flex-col md:items-end md:gap-1">
                                <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                                    <ArrowUpCircle className="w-3 h-3 text-blue-500" />
                                    <span>Tiến độ</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 transition-all duration-500"
                                            style={{ width: `${overallProgress}%` }}
                                        />
                                    </div>
                                    <span className="text-lg font-bold text-blue-600 min-w-[3ch] text-right">
                                        {overallProgress}%
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleOpenCreate}
                                className="px-3.5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold flex items-center gap-2 shadow-lg shadow-blue-100 text-sm"
                                title="Thêm công việc mới"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">Thêm công việc</span>
                            </button>
                            {isDev && !isNew && (
                                <button
                                    type="button"
                                    onClick={() => void handleSeedSampleTasks()}
                                    className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold text-sm"
                                    title="Tạo 10 task mẫu (chỉ local)"
                                >
                                    Tạo 10 task mẫu
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-3 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm công việc..."
                            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none bg-white"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value === 'ALL' ? 'ALL' : (e.target.value as TaskStatus))
                            }
                            className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            {Object.entries(STATUS_CONFIG).map(([key, value]) => (
                                <option key={key} value={key}>
                                    {value.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={(e) =>
                                setPriorityFilter(e.target.value === 'ALL' ? 'ALL' : (e.target.value as TaskPriority))
                            }
                            className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="ALL">Tất cả ưu tiên</option>
                            {Object.entries(PRIORITY_CONFIG).map(([key, value]) => (
                                <option key={key} value={key}>
                                    {value.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value)}
                            className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-w-[150px]"
                        >
                            <option value="">Tất cả người phụ trách</option>
                            {staffOptions.map((option) => (
                                <option key={`${option.type}-${option.id}`} value={option.name}>
                                    {option.discipline ? `${option.name} – ${option.discipline}` : option.name}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-colors"
                        >
                            Xóa lọc
                        </button>
                    </div>
                </div>

                {/* Task Views */}
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Đang tải danh sách công việc...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
                        <div className="bg-gray-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            {viewMode === 'list' ? (
                                <LayoutList className="w-8 h-8 text-gray-400" />
                            ) : (
                                <LayoutGrid className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Chưa có công việc nào</h3>
                        <p className="text-gray-500 mt-1 mb-6 max-w-xs mx-auto">
                            Hãy bắt đầu bằng cách thêm các công việc cần thực hiện cho dự án này.
                        </p>
                        <button
                            onClick={handleOpenCreate}
                            className="px-4 py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            + Thêm công việc đầu tiên
                        </button>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-10 px-6 text-center">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Không có công việc phù hợp bộ lọc</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Hãy điều chỉnh điều kiện lọc hoặc xóa toàn bộ bộ lọc để xem lại tất cả công việc.
                        </p>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="px-4 py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors text-sm"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredTasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span
                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[task.status].color}`}
                                            >
                                                {STATUS_CONFIG[task.status].icon}
                                                {STATUS_CONFIG[task.status].label}
                                            </span>
                                            <span
                                                className={`text-xs font-semibold ${PRIORITY_CONFIG[task.priority].color}`}
                                            >
                                                • {PRIORITY_CONFIG[task.priority].label}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                                            {task.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                            {task.description || 'Không có mô tả'}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    {task.startDate
                                                        ? new Date(task.startDate).toLocaleDateString('vi-VN')
                                                        : 'N/A'}
                                                    -
                                                    {task.endDate
                                                        ? new Date(task.endDate).toLocaleDateString('vi-VN')
                                                        : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="w-4 h-4" />
                                                {task.assignedTo ? (
                                                    <AssigneePill name={task.assignedTo} />
                                                ) : (
                                                    <span>Chưa phân công</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(task)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Sửa"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(task.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className="text-sm font-bold text-gray-900">{task.progress}%</span>
                                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${
                                                        task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${task.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : viewMode === 'table' ? (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="max-h-[520px] overflow-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0 z-[1]">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Công việc
                                        </th>
                                        {columnSettings.showStatus !== false && (
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Trạng thái
                                            </th>
                                        )}
                                        {columnSettings.showPriority && (
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Ưu tiên
                                            </th>
                                        )}
                                        {columnSettings.showAssignee && (
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Người phụ trách
                                            </th>
                                        )}
                                        {columnSettings.showDates && (
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Thời gian
                                            </th>
                                        )}
                                        {columnSettings.showProgress && (
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Tiến độ
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 align-top">
                                                <div className="font-semibold text-gray-900 mb-0.5">{task.title}</div>
                                                <div className="text-xs text-gray-500 line-clamp-1">
                                                    {task.description || 'Không có mô tả'}
                                                </div>
                                            </td>
                                            {columnSettings.showStatus !== false && (
                                                <td className="px-4 py-2 align-top">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_CONFIG[task.status].color}`}
                                                    >
                                                        {STATUS_CONFIG[task.status].icon}
                                                        {STATUS_CONFIG[task.status].label}
                                                    </span>
                                                </td>
                                            )}
                                            {columnSettings.showPriority && (
                                                <td className="px-4 py-2 align-top">
                                                    <span
                                                        className={`text-xs font-semibold ${PRIORITY_CONFIG[task.priority].color}`}
                                                    >
                                                        {PRIORITY_CONFIG[task.priority].label}
                                                    </span>
                                                </td>
                                            )}
                                            {columnSettings.showAssignee && (
                                                <td className="px-4 py-2 align-top">
                                                    {task.assignedTo ? (
                                                        <AssigneePill name={task.assignedTo} />
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Chưa phân công</span>
                                                    )}
                                                </td>
                                            )}
                                            {columnSettings.showDates && (
                                                <td className="px-4 py-2 align-top text-xs text-gray-600">
                                                    {task.startDate
                                                        ? new Date(task.startDate).toLocaleDateString('vi-VN')
                                                        : 'N/A'}
                                                    {' - '}
                                                    {task.endDate
                                                        ? new Date(task.endDate).toLocaleDateString('vi-VN')
                                                        : 'N/A'}
                                                </td>
                                            )}
                                            {columnSettings.showProgress && (
                                                <td className="px-4 py-2 align-top text-right text-xs text-gray-700">
                                                    <span className="font-semibold">{task.progress}%</span>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : viewMode === 'gantt' && ganttRange ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 overflow-hidden">
                        <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                            <span>
                                Từ{' '}
                                {ganttRange.start.toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                })}{' '}
                                đến{' '}
                                {ganttRange.end.toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                })}
                            </span>
                            <span>{ganttRange.totalDays + 1} ngày</span>
                        </div>
                        <div className="relative border-t border-gray-100 pt-2 max-h-[520px] overflow-auto">
                            <div className="space-y-2.5">
                                {filteredTasks.map((task) => {
                                    const hasDates = task.startDate && task.endDate;
                                    const start = task.startDate
                                        ? new Date(task.startDate)
                                        : ganttRange.start;
                                    const end = task.endDate ? new Date(task.endDate) : ganttRange.end;
                                    const clampedStart = start < ganttRange.start ? ganttRange.start : start;
                                    const clampedEnd = end > ganttRange.end ? ganttRange.end : end;
                                    const offsetDays = Math.max(
                                        0,
                                        Math.round(
                                            (clampedStart.getTime() - ganttRange.start.getTime()) /
                                                (24 * 60 * 60 * 1000),
                                        ),
                                    );
                                    const lengthDays = Math.max(
                                        1,
                                        Math.round(
                                            (clampedEnd.getTime() - clampedStart.getTime()) /
                                                (24 * 60 * 60 * 1000),
                                        ) + 1,
                                    );
                                    const offsetPercent =
                                        (offsetDays / (ganttRange.totalDays + 1)) * 100;
                                    const widthPercent =
                                        (lengthDays / (ganttRange.totalDays + 1)) * 100;

                                    const statusTheme = BOARD_STATUS_THEME[task.status];

                                    return (
                                        <div
                                            key={task.id}
                                            className="flex items-center gap-2 text-xs text-gray-600"
                                        >
                                            <div className="w-52 pr-2 shrink-0">
                                                <div className="font-semibold text-gray-900 truncate">
                                                    {task.title}
                                                </div>
                                                {columnSettings.showAssignee && task.assignedTo && (
                                                    <div className="mt-0.5">
                                                        <AssigneePill name={task.assignedTo} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="relative h-7 rounded-full bg-gray-50 border border-dashed border-gray-200 overflow-hidden">
                                                    {hasDates ? (
                                                        <div
                                                            className={`absolute inset-y-0 rounded-full shadow-sm border ${statusTheme.headerBg} ${statusTheme.topBorder}`}
                                                            style={{
                                                                left: `${offsetPercent}%`,
                                                                width: `${widthPercent}%`,
                                                            }}
                                                        >
                                                            <div className="h-full w-full flex items-center px-2 justify-between">
                                                                <span className="text-[11px] font-semibold text-gray-800 truncate">
                                                                    {STATUS_CONFIG[task.status].label}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500 ml-2 shrink-0">
                                                                    {start.toLocaleDateString('vi-VN', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                    })}{' '}
                                                                    -{' '}
                                                                    {end.toLocaleDateString('vi-VN', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-400">
                                                            Chưa thiết lập thời gian
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'DELAYED'] as const)
                            .filter((status) => status !== 'REVIEW')
                            .map((status) => {
                                const statusTasks = groupedTasks[status];
                                const statusConfig = STATUS_CONFIG[status];
                                const theme = BOARD_STATUS_THEME[status];

                                return (
                                    <div
                                        key={status}
                                        className={`rounded-2xl border border-gray-100 border-t-4 p-3 flex flex-col min-h-[220px] ${theme.columnBg} ${theme.topBorder}`}
                                        onDragOver={handleColumnDragOver}
                                        onDrop={(event) => handleDropOnColumn(event, status)}
                                    >
                                        <div className={`flex items-center justify-between mb-3 px-2 py-1.5 rounded-xl ${theme.headerBg}`}>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`w-2.5 h-2.5 rounded-full ${theme.dotBg}`}
                                                />
                                                <span className={`text-xs font-extrabold uppercase tracking-wide ${theme.headerText}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </div>
                                            <span className={`text-xs font-semibold ${theme.countText}`}>
                                                {statusTasks.length} công việc
                                            </span>
                                        </div>
                                        <div className="space-y-2 flex-1 min-h-[120px]">
                                            {statusTasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    draggable
                                                    onDragStart={(event) => handleDragStart(event, task.id)}
                                                    onDragEnd={handleDragEnd}
                                                    className={`bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-all cursor-move group ${
                                                        draggingTaskId === task.id ? 'opacity-70 ring-2 ring-blue-200' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-semibold text-gray-900 mb-1 truncate group-hover:text-blue-600">
                                                                {task.title}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                                                                {task.description || 'Không có mô tả'}
                                                            </p>
                                                            <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    <span>
                                                                        {task.startDate
                                                                            ? new Date(
                                                                                  task.startDate,
                                                                              ).toLocaleDateString('vi-VN')
                                                                            : 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <UserIcon className="w-3 h-3" />
                                                                    {task.assignedTo ? (
                                                                        <AssigneePill name={task.assignedTo} />
                                                                    ) : (
                                                                        <span className="truncate max-w-[80px]">
                                                                            Chưa phân công
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1 ml-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEdit(task)}
                                                                className="p-1 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                                title="Sửa"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(task.id)}
                                                                className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Xóa"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                            <div className="flex flex-col items-end gap-0.5 mt-1">
                                                                <span className="text-[11px] font-semibold text-gray-900">
                                                                    {task.progress}%
                                                                </span>
                                                                <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full transition-all duration-300 ${
                                                                            task.status === 'COMPLETED'
                                                                                ? 'bg-emerald-500'
                                                                                : 'bg-blue-500'
                                                                        }`}
                                                                        style={{ width: `${task.progress}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {statusTasks.length === 0 && (
                                                <div className="h-24 flex items-center justify-center rounded-xl border border-dashed border-gray-200 text-[11px] text-gray-400 bg-gray-50/50">
                                                    Kéo thả công việc vào đây
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* Modal tạo/sửa công việc – hiển thị giữa màn hình, phủ trên toàn bộ giao diện dự án */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-6xl mx-4 shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editingTask ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Cung cấp thông tin chi tiết về nhiệm vụ.</p>
                            </div>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                aria-label="Đóng"
                            >
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Tên công việc <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ví dụ: Mô hình kiến trúc tầng 1"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả chi tiết</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Nhập yêu cầu hoặc ghi chú cho công việc..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Bắt đầu</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-all"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Kết thúc</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-all"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái</label>
                                        <StatusDropdown
                                            value={formData.status}
                                            onChange={(next) => setFormData({ ...formData, status: next })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Ưu tiên</label>
                                        <PriorityDropdown
                                            value={formData.priority}
                                            onChange={(next) => setFormData({ ...formData, priority: next })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Tiến độ ({formData.progress}%)
                                        </label>
                                        <div className="flex items-center gap-3 h-[46px]">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                value={formData.progress}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        progress: Number.parseInt(e.target.value, 10) || 0,
                                                    })
                                                }
                                            />
                                            <span className="text-sm font-bold text-blue-600 w-10 text-right">
                                                {formData.progress}%
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phân công</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                list={`task-assignees-${projectId}`}
                                                placeholder="Tên người phụ trách (có thể chọn từ danh sách)"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                value={formData.assignedTo}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, assignedTo: e.target.value })
                                                }
                                            />
                                            {isLoadingStaffOptions && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                                    Đang tải...
                                                </span>
                                            )}
                                        </div>
                                        {formData.assignedTo?.trim() ? (
                                            <div className="mt-2">
                                                <AssigneePill name={formData.assignedTo.trim()} />
                                            </div>
                                        ) : null}
                                        {staffOptions.length > 0 && (
                                            <datalist id={`task-assignees-${projectId}`}>
                                                {staffOptions.map((option) => (
                                                    <option
                                                        key={`${option.type}-${option.id}`}
                                                        value={option.name}
                                                    >
                                                        {option.discipline
                                                            ? `${option.name} – ${option.discipline}`
                                                            : option.name}
                                                    </option>
                                                ))}
                                            </datalist>
                                        )}
                                        <p className="mt-0.5 text-[11px] text-gray-500">
                                            Gợi ý từ báo giá chốt và danh sách nhân sự outsource. Anh vẫn có thể nhập tay
                                            nếu cần.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-6 py-2.5 text-gray-600 font-semibold hover:bg-gray-50 rounded-xl transition-all"
                                    disabled={isSaving}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Đang lưu...
                                        </div>
                                    ) : (
                                        'Lưu công việc'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

        {/* Modal tạo/sửa công việc – render lên thẳng body để luôn phủ toàn bộ UI */}
        {isMounted && taskModal ? createPortal(taskModal, document.body) : null}
        </>
    );
}
