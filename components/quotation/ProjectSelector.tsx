'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, FolderOpen, CheckCircle2, PlayCircle, XCircle, Building2, Calendar } from 'lucide-react';

type Project = {
    id: string;
    projectNo: string;
    name: string;
    code?: string;
    description?: string;
    location: string;
    startDate?: string;
    totalArea?: number;
    status: string;
    customer: {
        id: string;
        name: string;
    } | null;
    _count: {
        quotations: number;
    };
};

type ProjectSelectorProps = {
    value: string;
    onChange: (projectId: string) => void;
    onSelectProject?: (project: Project) => void;
    disabled?: boolean;
    isLoading?: boolean;
};

const statusConfig: Record<string, { label: string; badgeClass: string }> = {
    PLANNING: {
        label: 'Lập kế hoạch',
        badgeClass: 'bg-gray-100 text-gray-800',
    },
    ACTIVE: {
        label: 'Đang thực hiện',
        badgeClass: 'bg-blue-100 text-blue-800',
    },
    COMPLETED: {
        label: 'Hoàn thành',
        badgeClass: 'bg-green-100 text-green-800',
    },
    CANCELLED: {
        label: 'Đã hủy',
        badgeClass: 'bg-red-100 text-red-800',
    },
};

export default function ProjectSelector({ value, onChange, onSelectProject, disabled = false, isLoading = false }: ProjectSelectorProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [yearFilter, setYearFilter] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
        }
    }, [statusFilter, yearFilter, isOpen]);

    useEffect(() => {
        if (value && projects.length > 0) {
            const project = projects.find((p) => p.id === value);
            setSelectedProject(project || null);
        } else {
            setSelectedProject(null);
        }
    }, [value, projects]);

    const fetchProjects = async () => {
        setIsLoadingProjects(true);
        try {
            let url = '/api/projects?pageSize=200&';
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
                setProjects([]);
            }
        } catch (err) {
            console.error('Failed to fetch projects:', err);
            setProjects([]);
        } finally {
            setIsLoadingProjects(false);
        }
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

    const handleOpenDropdown = () => {
        if (!isOpen && projects.length === 0 && !isLoadingProjects) {
            fetchProjects();
        }
        setIsOpen(true);
    };

    const handleSelectProject = (project: Project) => {
        onChange(project.id);
        setSelectedProject(project);
        setIsOpen(false);
        setSearchQuery('');
        // Pass full project data to parent if callback exists
        if (onSelectProject) {
            onSelectProject(project);
        }
    };

    const handleClearSelection = () => {
        onChange('');
        setSelectedProject(null);
        setSearchQuery('');
    };

    return (
        <div className="relative">
            <label className="block text-sm font-medium mb-1">Mã dự án</label>
            
            {/* Selected Project Display */}
            {selectedProject ? (
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => !disabled && handleOpenDropdown()}
                        disabled={disabled || isLoading}
                        className="w-full px-3 py-2 border rounded bg-white text-left flex items-center justify-between hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FolderOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm font-medium truncate">
                                {selectedProject.projectNo} - {selectedProject.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs flex-shrink-0 ${
                                statusConfig[selectedProject.status]?.badgeClass || statusConfig.PLANNING.badgeClass
                            }`}>
                                {statusConfig[selectedProject.status]?.label || 'Lập kế hoạch'}
                            </span>
                        </div>
                        {!disabled && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearSelection();
                                }}
                                className="ml-2 p-1 hover:bg-gray-200 rounded flex-shrink-0"
                                title="Xóa lựa chọn"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        )}
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => !disabled && handleOpenDropdown()}
                    disabled={disabled || isLoading || isLoadingProjects}
                    className="w-full px-3 py-2 border rounded bg-white text-left flex items-center justify-between hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="text-gray-500">
                        {isLoadingProjects ? 'Đang tải...' : 'Chọn dự án...'}
                    </span>
                    <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            )}

            {/* Dropdown Panel */}
            {isOpen && !disabled && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Panel */}
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[600px] flex flex-col" style={{ minWidth: '500px' }}>
                        {/* Search and Filters */}
                        <div className="p-3 border-b border-gray-200 space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        fetchProjects();
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchProjects()}
                                    placeholder="Tìm kiếm theo tên, mã dự án, khách hàng..."
                                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    autoFocus
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            fetchProjects();
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="PLANNING">Lập kế hoạch</option>
                                    <option value="ACTIVE">Đang thực hiện</option>
                                    <option value="COMPLETED">Hoàn thành</option>
                                    <option value="CANCELLED">Đã hủy</option>
                                </select>
                                
                                <select
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(e.target.value)}
                                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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

                        {/* Projects List */}
                        <div className="flex-1 overflow-y-auto p-2">
                            {isLoadingProjects ? (
                                <div className="p-4 text-center text-gray-500 text-sm">Đang tải dữ liệu...</div>
                            ) : filteredProjects.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm italic">
                                    {searchQuery ? 'Không tìm thấy dự án nào.' : 'Chưa có dự án nào.'}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredProjects.map((project) => {
                                        const status = statusConfig[project.status] || statusConfig.PLANNING;
                                        const isSelected = project.id === value;
                                        
                                        return (
                                            <button
                                                key={project.id}
                                                type="button"
                                                onClick={() => handleSelectProject(project)}
                                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <FolderOpen className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-gray-900 truncate">
                                                                {project.name}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded text-xs flex-shrink-0 ${status.badgeClass}`}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-600 space-y-1">
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-mono text-gray-500">{project.projectNo}</span>
                                                                {project.code && (
                                                                    <span className="text-gray-400">({project.code})</span>
                                                                )}
                                                            </div>
                                                            {project.customer && (
                                                                <div className="flex items-center gap-1">
                                                                    <Building2 className="w-3 h-3" />
                                                                    <span>{project.customer.name}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1">
                                                                <span>{project.location}</span>
                                                                {project.totalArea && (
                                                                    <span className="text-gray-400">
                                                                        • {project.totalArea.toLocaleString('vi-VN')} m²
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {project.startDate && (
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    <span>
                                                                        {new Date(project.startDate).toLocaleDateString('vi-VN')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {project._count.quotations > 0 && (
                                                                <div className="text-blue-600 font-medium">
                                                                    {project._count.quotations} báo giá
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
