'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
    Check,
    ChevronDown
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

    useEffect(() => {
        if (!isNew && projectId) {
            fetchTasks();
        }
    }, [projectId, isNew]);

    const fetchTasks = async () => {
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
    };

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

    if (isNew) {
        return (
            <div className="p-8 flex items-center justify-center">
                <p className="text-gray-600 italic">Vui lòng lưu dự án trước khi quản lý công việc.</p>
            </div>
        );
    }

    return (
        <div className="p-8 overflow-y-auto h-full">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Stats */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <LayoutList className="w-6 h-6 text-blue-600" />
                                Công việc & Tiến độ
                            </h2>
                            <p className="text-sm text-gray-500">
                                Quản lý danh sách các công việc và theo dõi tiến độ hoàn thành dự án.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-medium text-gray-500">Tiến độ tổng thể</div>
                                <div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
                            </div>
                            <div className="w-32 h-3 bg-gray-100 rounded-full overflow-hidden hidden md:block">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-500"
                                    style={{ width: `${overallProgress}%` }}
                                />
                            </div>
                            <button
                                onClick={handleOpenCreate}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold flex items-center gap-2 shadow-lg shadow-blue-100"
                            >
                                <Plus className="w-5 h-5" />
                                Thêm công việc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Task List */}
                <div className="grid grid-cols-1 gap-4">
                    {isLoading ? (
                        <div className="py-20 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-500">Đang tải danh sách công việc...</p>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
                            <div className="bg-gray-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <LayoutList className="w-8 h-8 text-gray-400" />
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
                    ) : (
                        tasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[task.status].color}`}>
                                                {STATUS_CONFIG[task.status].icon}
                                                {STATUS_CONFIG[task.status].label}
                                            </span>
                                            <span className={`text-xs font-semibold ${PRIORITY_CONFIG[task.priority].color}`}>
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
                                                    {task.startDate ? new Date(task.startDate).toLocaleDateString('vi-VN') : 'N/A'}
                                                    -
                                                    {task.endDate ? new Date(task.endDate).toLocaleDateString('vi-VN') : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="w-4 h-4" />
                                                <span>{task.assignedTo || 'Chưa phân công'}</span>
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
                                                    className={`h-full transition-all duration-300 ${task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'
                                                        }`}
                                                    style={{ width: `${task.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editingTask ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Cung cấp thông tin chi tiết về nhiệm vụ.</p>
                            </div>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên công việc <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ví dụ: Mô hình kiến trúc tầng 1"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả chi tiết</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Nhập yêu cầu hoặc ghi chú cho công việc..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bắt đầu</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-all"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kết thúc</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-all"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trạng thái</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white font-medium pr-10 transition-all cursor-pointer"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                                            >
                                                {Object.entries(STATUS_CONFIG).map(([key, value]) => (
                                                    <option key={key} value={key}>{value.label}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ưu tiên</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white font-medium pr-10 transition-all cursor-pointer"
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                                            >
                                                {Object.entries(PRIORITY_CONFIG).map(([key, value]) => (
                                                    <option key={key} value={key}>{value.label}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tiến độ ({formData.progress}%)</label>
                                        <div className="flex items-center gap-3 h-[46px]">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                value={formData.progress}
                                                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                                            />
                                            <span className="text-sm font-bold text-blue-600 w-10 text-right">{formData.progress}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phân công</label>
                                        <input
                                            type="text"
                                            placeholder="Tên người phụ trách"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.assignedTo}
                                            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
    );
}
