'use client';

import React, { useState, useEffect } from 'react';
import { formatVND } from '@/lib/number-to-words-vn';
import {
    RefreshCw,
    Plus,
    Search,
    X,
    FolderOpen,
    Pencil,
    Trash2,
    DollarSign,
    Calendar,
    Building2,
    CheckCircle2,
    FileText,
    Layers,
    PlayCircle,
    XCircle,
} from 'lucide-react';
import Link from 'next/link';

type Project = {
    id: string;
    projectNo: string;
    name: string;
    code?: string;
    description?: string;
    imageUrl?: string;
    customer: {
        id: string;
        name: string;
    } | null;
    location: string;
    startDate?: string;
    endDate?: string;
    totalArea?: number;
    totalBudget: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    status: string;
    notes?: string;
    createdAt: string;
    _count: {
        quotations: number;
        cashFlows: number;
    };
};

export default function ProjectTab() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [yearFilter, setYearFilter] = useState<string>('');

    useEffect(() => {
        fetchProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, yearFilter]);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            let url = '/api/projects?';
            if (statusFilter) url += `status=${statusFilter}&`;
            if (yearFilter) url += `year=${yearFilter}&`;
            if (searchQuery) url += `search=${searchQuery}&`;

            const res = await fetch(url, {
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
                setProjects(result.data);
            } else {
                console.error('API returned error:', result);
                setProjects([]);
            }
        } catch (err: any) {
            console.error('❌ Failed to fetch projects:', err);
            console.error('Error details:', err?.message, err?.stack);
            setProjects([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa dự án này? Tất cả báo giá và dòng tiền liên quan sẽ bị xóa.')) return;
        try {
            const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                fetchProjects();
            }
        } catch (err) {
            console.error('Failed to delete project:', err);
        }
    };

    const statusConfig: Record<
        string,
        { label: string; badgeClass: string; cardClass: string }
    > = {
        PLANNING: {
            label: 'Lập kế hoạch',
            badgeClass: 'bg-gray-100 text-gray-800',
            cardClass: 'bg-white border-zf-bg-secondary border-l-gray-300',
        },
        ACTIVE: {
            label: 'Đang thực hiện',
            badgeClass: 'bg-blue-100 text-blue-800',
            cardClass: 'bg-blue-50 border-blue-200 border-l-blue-500',
        },
        COMPLETED: {
            label: 'Hoàn thành',
            badgeClass: 'bg-green-100 text-green-800',
            cardClass: 'bg-green-50 border-green-200 border-l-green-500',
        },
        CANCELLED: {
            label: 'Đã hủy',
            badgeClass: 'bg-red-100 text-red-800',
            cardClass: 'bg-red-50 border-red-200 border-l-red-500',
        },
    };

    const filteredProjects = projects.filter((project) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            project.name.toLowerCase().includes(query) ||
            project.code?.toLowerCase().includes(query) ||
            project.projectNo.toLowerCase().includes(query) ||
            project.customer?.name?.toLowerCase().includes(query) ||
            false
        );
    });

    const summary = {
        total: filteredProjects.length,
        hasQuotations: filteredProjects.filter((p) => (p._count?.quotations ?? 0) > 0).length,
        active: filteredProjects.filter((p) => p.status === 'ACTIVE').length,
        completed: filteredProjects.filter((p) => p.status === 'COMPLETED').length,
        cancelled: filteredProjects.filter((p) => p.status === 'CANCELLED').length,
    };

    return (
        <div className="h-full flex flex-col bg-zf-bg-tertiary px-4 py-4 md:px-6 md:py-5 overflow-y-auto">
            <div className="w-full space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="inline-flex items-center gap-1 rounded-full bg-zf-bg-secondary px-3 py-1 text-zf-text-secondary">
                            <Layers className="w-3 h-3" />
                            <span className="font-medium">Tổng dự án:</span>
                            <span className="font-semibold text-zf-text-primary">{summary.total}</span>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-zf-bg-secondary px-3 py-1 text-zf-text-secondary">
                            <FileText className="w-3 h-3" />
                            <span className="font-medium">Có báo giá:</span>
                            <span className="font-semibold text-zf-text-primary">{summary.hasQuotations}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setStatusFilter((prev) => (prev === 'ACTIVE' ? '' : 'ACTIVE'))
                            }
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 border text-xs transition-colors ${
                                statusFilter === 'ACTIVE'
                                    ? 'bg-blue-600 text-white border-blue-700'
                                    : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                            }`}
                        >
                            <PlayCircle className="w-3 h-3" />
                            <span className="font-medium">Đang triển khai:</span>
                            <span className="font-semibold">{summary.active}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setStatusFilter((prev) => (prev === 'COMPLETED' ? '' : 'COMPLETED'))
                            }
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 border text-xs transition-colors ${
                                statusFilter === 'COMPLETED'
                                    ? 'bg-green-600 text-white border-green-700'
                                    : 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'
                            }`}
                        >
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="font-medium">Hoàn thành:</span>
                            <span className="font-semibold">{summary.completed}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setStatusFilter((prev) => (prev === 'CANCELLED' ? '' : 'CANCELLED'))
                            }
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 border text-xs transition-colors ${
                                statusFilter === 'CANCELLED'
                                    ? 'bg-red-600 text-white border-red-700'
                                    : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                            }`}
                        >
                            <XCircle className="w-3 h-3" />
                            <span className="font-medium">Đã hủy:</span>
                            <span className="font-semibold">{summary.cancelled}</span>
                        </button>
                    </div>
                    <div className="flex justify-end items-center gap-2">
                        <button
                            onClick={fetchProjects}
                            disabled={isLoading}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center gap-2"
                            title="Refresh dữ liệu"
                        >
                            <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <Link
                            href="/projects/new"
                            className="px-6 py-2 bg-zf-accent text-white rounded-xl font-bold shadow-lg shadow-zf-accent/20 hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5 text-white" />
                            Tạo dự án mới
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-zf-bg-secondary p-3 md:p-4 space-y-3">
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchProjects()}
                                placeholder="Tìm kiếm theo tên, mã dự án, khách hàng..."
                                className="w-full px-4 py-3 pl-12 bg-zf-bg-secondary border-none rounded-xl focus:ring-2 focus:ring-zf-accent text-zf-text-primary font-medium placeholder:text-zf-text-secondary"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zf-text-secondary" />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        fetchProjects();
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zf-text-secondary hover:text-zf-error transition-colors p-1"
                                    title="Xóa tìm kiếm"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <div className="w-48">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-3 bg-zf-bg-secondary border-none rounded-xl focus:ring-2 focus:ring-zf-accent text-zf-text-primary font-medium"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="PLANNING">Lập kế hoạch</option>
                                <option value="ACTIVE">Đang thực hiện</option>
                                <option value="COMPLETED">Hoàn thành</option>
                                <option value="CANCELLED">Đã hủy</option>
                            </select>
                        </div>
                        <div className="w-40">
                            <select
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="w-full px-4 py-3 bg-zf-bg-secondary border-none rounded-xl focus:ring-2 focus:ring-zf-accent text-zf-text-primary font-medium"
                            >
                                <option value="">Tất cả năm</option>
                                {Array.from({ length: 6 }).map((_, idx) => {
                                    const currentYear = new Date().getFullYear();
                                    const year = currentYear - idx;
                                    return (
                                        <option key={year} value={year.toString()}>
                                            Năm {year}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                    {searchQuery && (
                        <div className="text-sm text-zf-text-secondary">
                            Tìm thấy <span className="font-bold text-zf-accent">{filteredProjects.length}</span> dự án
                        </div>
                    )}
                </div>

                {/* Projects List */}
                {isLoading ? (
                    <div className="p-10 text-center text-zf-text-secondary bg-white rounded-3xl border border-zf-bg-secondary">
                        Đang tải dữ liệu...
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-zf-bg-tertiary">
                        <p className="text-zf-text-secondary italic">Chưa có dự án nào.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredProjects.map((project, index) => {
                            const status = statusConfig[project.status] || statusConfig.PLANNING;
                            const orderNumber = index + 1;
                            return (
                                <div
                                    key={project.id}
                                    className={`p-6 rounded-3xl shadow-sm border border-l-4 hover:shadow-md transition-all flex gap-4 ${status.cardClass}`}
                                >
                                    {/* Số thứ tự dự án */}
                                    <div className="flex items-start">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-zf-bg-secondary text-zf-text-primary font-bold text-lg">
                                            {orderNumber}
                                        </div>
                                    </div>

                                    <div className="flex-1 flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FolderOpen className="w-5 h-5 text-zf-text-secondary" />
                                                <h3 className="text-xl font-bold text-zf-primary">{project.name}</h3>
                                                <span className="text-sm font-mono text-zf-text-secondary">
                                                    {project.projectNo}
                                                </span>
                                                {project.code && (
                                                    <span className="text-sm text-zf-text-secondary">
                                                        ({project.code})
                                                    </span>
                                                )}
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold ${status.badgeClass}`}
                                                >
                                                    {status.label}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                <div>
                                                    <div className="text-xs text-zf-text-secondary uppercase mb-1">Khách hàng</div>
                                                    <div className="font-medium text-zf-text-primary">{project.customer?.name || 'Chưa có'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-zf-text-secondary uppercase mb-1">Địa điểm</div>
                                                    <div className="font-medium text-zf-text-primary flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        {project.location}
                                                    </div>
                                                </div>
                                                {project.startDate && (
                                                    <div>
                                                        <div className="text-xs text-zf-text-secondary uppercase mb-1">Ngày bắt đầu</div>
                                                        <div className="font-medium text-zf-text-primary flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {new Date(project.startDate).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    </div>
                                                )}
                                                {project.totalArea && (
                                                    <div>
                                                        <div className="text-xs text-zf-text-secondary uppercase mb-1">Diện tích</div>
                                                        <div className="font-medium text-zf-text-primary">
                                                            {project.totalArea.toLocaleString('vi-VN')} m²
                                                        </div>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-xs text-zf-text-secondary uppercase mb-1">Ngày tạo</div>
                                                    <div className="font-medium text-zf-text-primary flex items-center gap-1">
                                                        {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-zf-bg-tertiary">
                                                <div>
                                                    <div className="text-xs text-zf-text-secondary uppercase mb-1">Ngân sách</div>
                                                    <div className="font-bold text-zf-text-primary">{formatVND(project.totalBudget)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-zf-text-secondary uppercase mb-1">Doanh thu</div>
                                                    <div className="font-bold text-green-600">{formatVND(project.totalRevenue)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-zf-text-secondary uppercase mb-1">Chi phí</div>
                                                    <div className="font-bold text-red-600">{formatVND(project.totalCost)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-zf-text-secondary uppercase mb-1">Lợi nhuận</div>
                                                    <div className={`font-bold ${project.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatVND(project.totalProfit)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 mt-4 text-sm text-zf-text-secondary">
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    {project._count.quotations} báo giá
                                                </span>
                                                <span>•</span>
                                                <span>{project._count.cashFlows} dòng tiền</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            <Link
                                                href={`/projects/${project.id}`}
                                                className="p-2 bg-zf-bg-tertiary text-zf-text-secondary rounded-lg hover:bg-zf-primary hover:text-white transition-all"
                                                title="Xem chi tiết / Chỉnh sửa"
                                            >
                                                <Pencil className="w-4 h-4 text-current" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(project.id)}
                                                className="p-2 bg-zf-bg-tertiary text-zf-text-secondary rounded-lg hover:bg-zf-error hover:text-white transition-all"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4 text-current" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
