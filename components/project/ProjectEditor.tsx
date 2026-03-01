'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import BillingTab from '@/components/project/BillingTab';
import CashFlowTab from '@/components/project/CashFlowTab';
import WorkTabsContainer, { type SubTabKey as WorkSubTabKey } from '@/components/project/WorkTabsContainer';
import ProjectQuotationsPanel from '@/components/project/ProjectQuotationsPanel';
import { AnimatedTabPanels } from '@/components/ui/AnimatedTabPanels';
import { formatVND } from '@/lib/number-to-words-vn';

function formatDateInputWithSlashes(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 8);

    if (digits.length <= 2) {
        return digits;
    }

    if (digits.length <= 4) {
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDdMmYyyyToIso(raw: string): string | null {
    const parts = raw.split('/');
    if (parts.length !== 3) return null;

    const [dd, mm, yyyy] = parts;
    if (dd.length !== 2 || mm.length !== 2 || yyyy.length !== 4) return null;

    const day = Number.parseInt(dd, 10);
    const month = Number.parseInt(mm, 10);
    const year = Number.parseInt(yyyy, 10);

    if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;

    // Đảm bảo không bị lệch ngày do timezone
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }

    return date.toISOString().split('T')[0];
}

type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

type Project = {
    id: string;
    projectNo: string;
    name: string;
    code?: string;
    description?: string;
    customerId?: string;
    location: string;
    startDate?: string;
    endDate?: string;
    totalArea?: number;
    totalBudget: number;
    status: ProjectStatus;
    notes?: string;
    imageUrl?: string;
};

type ProjectCustomerOption = {
    id: string;
    name: string;
};

type ErrorWithResponse = {
    response?: {
        json: () => Promise<unknown>;
    };
};

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; badgeClass: string }> = {
    PLANNING: {
        label: 'Lập kế hoạch',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
    ACTIVE: {
        label: 'Đang thực hiện',
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    COMPLETED: {
        label: 'Hoàn thành',
        badgeClass: 'bg-gray-900 text-white border border-gray-900',
    },
    CANCELLED: {
        label: 'Đã hủy',
        badgeClass: 'bg-red-50 text-red-700 border border-red-200',
    },
};

type ProjectEditorProps = {
    projectId?: string;
    isNew?: boolean;
};

export default function ProjectEditor({ projectId, isNew = false }: ProjectEditorProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'cashflow' | 'billing' | 'quotations'>('info');
    const [isLoading, setIsLoading] = useState(!isNew);
    const [isSaving, setIsSaving] = useState(false);
    const [project, setProject] = useState<Project>({
        id: '',
        projectNo: '',
        name: '',
        code: '',
        description: '',
        customerId: undefined,
        location: 'Hà Nội',
        startDate: '',
        endDate: '',
        totalArea: undefined,
        totalBudget: 0,
        status: 'PLANNING',
        notes: '',
        imageUrl: '',
    });
    const [customers, setCustomers] = useState<ProjectCustomerOption[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [projectDataCache, setProjectDataCache] = useState<unknown>(null); // Cache full project data for tabs
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteSectionOpen, setIsDeleteSectionOpen] = useState(false);
    const [activeWorkSubTab, setActiveWorkSubTab] = useState<WorkSubTabKey>('dashboard');

    // Callback để tự động lưu project khi tạo task (nếu project chưa được lưu)
    const handleAutoSaveProject = useCallback(async (): Promise<string | null> => {
        // Validation
        if (!project.name || !project.name.trim()) {
            alert('Vui lòng nhập tên dự án trước khi tạo công việc');
            return null;
        }

        try {
            const cleanedData = {
                ...project,
                name: project.name.trim(),
                code: project.code?.trim() || null,
                description: project.description?.trim() || null,
                customerId: project.customerId && project.customerId.trim() ? project.customerId : null,
                location: project.location?.trim() || 'Hà Nội',
                startDate: project.startDate && project.startDate.trim() ? project.startDate : null,
                endDate: project.endDate && project.endDate.trim() ? project.endDate : null,
                totalArea: project.totalArea ?? null,
                notes: project.notes?.trim() || null,
                imageUrl: project.imageUrl && project.imageUrl.trim() ? project.imageUrl : null,
            };

            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanedData),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.error || 'Không thể lưu dự án');
            }

            // Update project state với data mới
            if (result.data) {
                setProject({
                    ...project,
                    id: result.data.id,
                    projectNo: result.data.projectNo,
                });
            }

            // Refresh router cache
            router.refresh();

            return result.data?.id || null;
        } catch (error: unknown) {
            console.error('Failed to auto-save project:', error);
            return null;
        }
    }, [project, router]);

    const fetchProject = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });
            if (!res.ok) {
                // Náº¿u project khÃ´ng tá»“n táº¡i (404), redirect vá» danh sÃ¡ch dá»± Ã¡n
                if (res.status === 404) {
                    console.warn('Project not found when saving, redirecting to /projects');
                    // Clear any cached project data
                    if (typeof window !== 'undefined') {
                        try {
                            const cacheKeys = Object.keys(localStorage).filter(key => 
                                key.startsWith('project:') || key.startsWith('projects:')
                            );
                            cacheKeys.forEach(key => localStorage.removeItem(key));
                        } catch (e) {
                            // Ignore localStorage errors
                        }
                    }
                    // Redirect vá»›i timestamp Ä‘á»ƒ force refresh danh sÃ¡ch dá»± Ã¡n
                    router.push(`/projects?_refresh=${Date.now()}`);
                    return;
                }
                throw new Error(result.error || `HTTP error! status: ${res.status}`);
            }

            if (result.success) {
                if (isNew) {
                    // Refresh router cache để đảm bảo danh sách projects được cập nhật
                    router.refresh();
                    router.push(`/projects/${result.data.id}`);
                } else {
                    await fetchProject();
                    // Refresh router cache để đảm bảo danh sách projects được cập nhật
                    router.refresh();
                    alert('Đã lưu dự án thành công!');
                }
            } else {
                throw new Error(result.error || 'Không thể lưu dự án');
            }
        } catch (error: unknown) {
            console.error('Failed to save project:', error);
            let errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Không thể lưu dự án. Vui lòng kiểm tra lại thông tin và thử lại.';

            // Try to extract more detailed error from response
            if (error && typeof error === 'object' && 'response' in error) {
                try {
                    const { response } = error as ErrorWithResponse;
                    const errorData: unknown = response ? await response.json() : undefined;
                    if (!errorData || typeof errorData !== 'object') {
                        throw new Error('No error data');
                    }

                    const parsedErrorData = errorData as {
                        error?: unknown;
                        details?: {
                            fieldErrors?: unknown;
                        };
                    };

                    if (typeof parsedErrorData.error === 'string' && parsedErrorData.error.trim()) {
                        errorMessage = parsedErrorData.error;
                    }
                    if (parsedErrorData.details?.fieldErrors && typeof parsedErrorData.details.fieldErrors === 'object') {
                        const fieldErrors = Object.entries(
                            parsedErrorData.details.fieldErrors as Record<string, string[] | undefined>,
                        )
                            .map(([field, messages]) => {
                                if (messages && messages.length > 0) {
                                    return `${field}: ${messages.join(', ')}`;
                                }
                                return null;
                            })
                            .filter(Boolean)
                            .join('\n');
                        if (fieldErrors) {
                            errorMessage = `${errorMessage}\n\nChi tiết:\n${fieldErrors}`;
                        }
                    }
                } catch {
                    // Ignore JSON parse errors
                }
            }

            alert(`Lỗi: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải dự án...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-3 py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                    <button
                        onClick={() => router.back()}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Quay lại"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-bold text-gray-900 truncate">
                            {isNew ? 'Tạo dự án mới' : project.name}
                        </h1>
                        {!isNew && (
                            <p className="text-xs text-gray-600 font-mono">{project.projectNo}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => void handleSaveProject()}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2 text-sm"
                    >
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">{isSaving ? 'Đang lưu...' : 'Lưu dự án'}</span>
                        <span className="sm:hidden">{isSaving ? '...' : 'Lưu'}</span>
                    </button>
                </div>
            </div>

            {/* Tabs + Work sub-tabs (khi ở tab Công việc) */}
            <div className="bg-white border-b border-gray-200 px-3">
                <div className="flex items-center justify-between gap-4 overflow-x-auto">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            aria-label="Tab Thông tin dự án"
                            onClick={() => setActiveTab('info')}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 ${activeTab === 'info'
                                ? 'border-zf-accent text-zf-accent'
                                : 'border-transparent text-gray-600 hover:text-zf-accent'
                                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
                        >
                            Thông tin dự án
                        </button>
                        <button
                            type="button"
                            aria-label="Tab Công việc"
                            onClick={() => setActiveTab('tasks')}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 ${activeTab === 'tasks'
                                ? 'border-zf-accent text-zf-accent'
                                : 'border-transparent text-gray-600 hover:text-zf-accent'
                                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
                        >
                            Công việc
                        </button>
                        <button
                            type="button"
                            aria-label="Tab Quotations"
                            onClick={() => setActiveTab('quotations')}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 ${activeTab === 'quotations'
                                ? 'border-zf-accent text-zf-accent'
                                : 'border-transparent text-gray-600 hover:text-zf-accent'
                                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
                        >
                            Quotations
                        </button>
                        <button
                            type="button"
                            aria-label="Tab Dòng tiền"
                            onClick={() => setActiveTab('cashflow')}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 ${activeTab === 'cashflow'
                                ? 'border-zf-accent text-zf-accent'
                                : 'border-transparent text-gray-600 hover:text-zf-accent'
                                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
                        >
                            Dòng tiền
                        </button>
                        <button
                            type="button"
                            aria-label="Tab Hóa đơn"
                            onClick={() => setActiveTab('billing')}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 ${activeTab === 'billing'
                                ? 'border-zf-accent text-zf-accent'
                                : 'border-transparent text-gray-600 hover:text-zf-accent'
                                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
                        >
                            Hóa đơn
                        </button>
                    </div>

                    {activeTab === 'tasks' && (
                        <div className="flex items-center gap-1 bg-white/80 rounded-2xl border border-gray-200 px-1 py-0.5 shadow-sm">
                            <button
                                type="button"
                                onClick={() => setActiveWorkSubTab('dashboard')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-semibold transition-all ${
                                    activeWorkSubTab === 'dashboard'
                                        ? 'bg-zf-primary text-white shadow-[0_6px_18px_rgba(5,54,99,0.35)]'
                                        : 'bg-white/80 text-gray-600 hover:text-zf-primary hover:bg-zf-primary/5'
                                }`}
                            >
                                <span className="hidden sm:inline">Dashboard</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveWorkSubTab('task')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-semibold transition-all ${
                                    activeWorkSubTab === 'task'
                                        ? 'bg-zf-primary text-white shadow-[0_6px_18px_rgba(5,54,99,0.35)]'
                                        : 'bg-white/80 text-gray-600 hover:text-zf-primary hover:bg-zf-primary/5'
                                }`}
                            >
                                <span className="hidden sm:inline">Công việc</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveWorkSubTab('report')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-semibold transition-all ${
                                    activeWorkSubTab === 'report'
                                        ? 'bg-zf-primary text-white shadow-[0_6px_18px_rgba(5,54,99,0.35)]'
                                        : 'bg-white/80 text-gray-600 hover:text-zf-primary hover:bg-zf-primary/5'
                                }`}
                            >
                                <span className="hidden sm:inline">Báo cáo</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="w-full">
                    <AnimatedTabPanels
                        activeKey={activeTab}
                        variant="ios"
                        orderedKeys={['info', 'tasks', 'quotations', 'cashflow', 'billing'] as const}
                        render={(tab) =>
                            tab === 'cashflow' ? (
                                <CashFlowTab projectId={projectId || project.id} isNew={isNew} projectData={projectDataCache} />
                            ) : tab === 'billing' ? (
                                <BillingTab projectId={projectId || project.id} isNew={isNew} projectData={projectDataCache} />
                            ) : tab === 'quotations' ? (
                                <ProjectQuotationsPanel projectId={projectId || project.id} isNew={isNew} projectData={projectDataCache} />
                            ) : tab === 'tasks' ? (
                                <WorkTabsContainer
                                    projectId={projectId || project.id}
                                    isNew={isNew}
                                    activeSubTab={activeWorkSubTab}
                                    onChangeSubTab={setActiveWorkSubTab}
                                    showHeader={false}
                                    onAutoSaveProject={isNew ? handleAutoSaveProject : undefined}
                                />
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                                    <h2 className="text-xl font-bold text-gray-900">Thông tin cơ bản</h2>

                                    {/* Layout: Image on top-left, fields on the right */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        <div className="lg:col-span-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh dự án</label>
                                            <div className="space-y-3">
                                                <div className="w-full aspect-video rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                                                    {project.imageUrl ? (
                                                        <Image
                                                            src={
                                                                // Hỗ trợ URL tuyệt đối, data URL (base64) và path tương đối
                                                                project.imageUrl.startsWith('http') ||
                                                                project.imageUrl.startsWith('data:')
                                                                    ? project.imageUrl
                                                                    : project.imageUrl.startsWith('/')
                                                                        ? project.imageUrl
                                                                        : `/${project.imageUrl}`
                                                            }
                                                            alt="Hình ảnh dự án"
                                                            width={640}
                                                            height={360}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-500">Chưa có hình ảnh</span>
                                                    )}
                                                </div>

                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    aria-label="Chọn hình ảnh dự án"
                                                    disabled={isNew || !projectId || isUploadingImage}
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        if (isNew || !projectId) {
                                                            alert('Vui lòng lưu dự án trước khi upload hình ảnh.');
                                                            return;
                                                        }
                                                        setIsUploadingImage(true);
                                                        try {
                                                            const formData = new FormData();
                                                            formData.append('file', file);
                                                            const res = await fetch('/api/projects/upload-image', {
                                                                method: 'POST',
                                                                body: formData,
                                                            });
                                                            const result = await res.json();
                                                            if (!res.ok || !result?.success) {
                                                                throw new Error(result?.error || 'Không thể upload hình ảnh');
                                                            }
                                                            setProject({ ...project, imageUrl: result.data.url });
                                                        } catch (error: unknown) {
                                                            const message =
                                                                error instanceof Error ? error.message : 'Không thể upload hình ảnh';
                                                            console.error('Failed to upload project image:', error);
                                                            alert(`Lỗi: ${message}`);
                                                        } finally {
                                                            setIsUploadingImage(false);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                                                />

                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-xs text-gray-500">
                                                        {isNew ? 'Vui lòng lưu dự án trước khi upload hình ảnh.' : 'Tối đa 5MB.'}
                                                    </p>
                                                    {project.imageUrl ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setProject({ ...project, imageUrl: '' })}
                                                            className="text-sm font-medium text-red-600 hover:text-red-700"
                                                            aria-label="Xóa hình ảnh dự án"
                                                        >
                                                            Xóa ảnh
                                                        </button>
                                                    ) : null}
                                                </div>

                                                {isUploadingImage ? (
                                                    <span className="text-sm text-gray-600">Đang upload...</span>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-8 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Tên dự án <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={project.name}
                                                        onChange={(e) => setProject({ ...project, name: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Nhập tên dự án"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mã dự án</label>
                                                    <input
                                                        type="text"
                                                        value={project.code || ''}
                                                        onChange={(e) => setProject({ ...project, code: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Mã dự án (tùy chọn)"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                                                <textarea
                                                    value={project.description || ''}
                                                    onChange={(e) => setProject({ ...project, description: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                                                    placeholder="Mô tả về dự án"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Khách hàng
                                            </label>
                                            <select
                                                value={project.customerId || ''}
                                                onChange={(e) => setProject({ ...project, customerId: e.target.value || undefined })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled={isLoadingCustomers}
                                            >
                                                <option value="">{isLoadingCustomers ? 'Đang tải...' : 'Chọn khách hàng (tùy chọn)'}</option>
                                                {customers.map((customer) => (
                                                    <option key={customer.id} value={customer.id}>
                                                        {customer.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Địa điểm</label>
                                            <input
                                                type="text"
                                                value={project.location}
                                                onChange={(e) => setProject({ ...project, location: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Hà Nội"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ngày bắt đầu
                                        </label>
                                        <div className="relative">
                                            <DatePicker
                                                selected={project.startDate ? new Date(project.startDate) : null}
                                                onChange={(date: Date | null) =>
                                                    setProject({
                                                        ...project,
                                                        startDate: date ? date.toISOString().split('T')[0] : '',
                                                    })
                                                }
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="dd/mm/yyyy"
                                                showMonthDropdown
                                                showYearDropdown
                                                dropdownMode="select"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-all"
                                                onChangeRaw={(event) => {
                                                    if (!event) return;
                                                    const target = event.target as HTMLInputElement | null;
                                                    if (!target) return;
                                                    const formatted = formatDateInputWithSlashes(target.value);
                                                    // Gắn lại vào input để user thấy sẵn dấu gạch
                                                    target.value = formatted;
                                                    const iso = parseDdMmYyyyToIso(formatted);
                                                    setProject((prev) => ({
                                                        ...prev,
                                                        startDate: iso ?? '',
                                                    }));
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ngày kết thúc
                                        </label>
                                        <div className="relative">
                                            <DatePicker
                                                selected={project.endDate ? new Date(project.endDate) : null}
                                                onChange={(date: Date | null) =>
                                                    setProject({
                                                        ...project,
                                                        endDate: date ? date.toISOString().split('T')[0] : '',
                                                    })
                                                }
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="dd/mm/yyyy"
                                                showMonthDropdown
                                                showYearDropdown
                                                dropdownMode="select"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-all"
                                                onChangeRaw={(event) => {
                                                    if (!event) return;
                                                    const target = event.target as HTMLInputElement | null;
                                                    if (!target) return;
                                                    const formatted = formatDateInputWithSlashes(target.value);
                                                    target.value = formatted;
                                                    const iso = parseDdMmYyyyToIso(formatted);
                                                    setProject((prev) => ({
                                                        ...prev,
                                                        endDate: iso ?? '',
                                                    }));
                                                }}
                                            />
                                        </div>
                                    </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Diện tích (m²)</label>
                                            <input
                                                type="number"
                                                value={project.totalArea ?? ''}
                                                onChange={(e) => setProject({ ...project, totalArea: e.target.value ? parseFloat(e.target.value) : undefined })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                            <div className="flex items-center gap-3">
                                                <select
                                                    value={project.status}
                                                    onChange={(e) => setProject({ ...project, status: e.target.value as ProjectStatus })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="PLANNING">Lập kế hoạch</option>
                                                    <option value="ACTIVE">Đang thực hiện</option>
                                                    <option value="COMPLETED">Hoàn thành</option>
                                                    <option value="CANCELLED">Đã hủy</option>
                                                </select>
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 text-[11px] leading-none font-semibold rounded-full whitespace-nowrap ${PROJECT_STATUS_CONFIG[project.status].badgeClass
                                                        }`}
                                                >
                                                    {PROJECT_STATUS_CONFIG[project.status].label}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Ngân sách (VNĐ)</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={formatVND(project.totalBudget || 0)}
                                                readOnly
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                                                placeholder="0"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Ngân sách được tự động đồng bộ từ Báo giá chốt và không thể chỉnh sửa trực tiếp tại đây.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                                        <textarea
                                            value={project.notes || ''}
                                            onChange={(e) => setProject({ ...project, notes: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                                            placeholder="Ghi chú về dự án"
                                        />
                                    </div>

                                    {!isNew && (
                                        <div className="mt-6">
                                            {!isDeleteSectionOpen ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsDeleteSectionOpen(true)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg bg-red-50 hover:bg-red-100 hover:border-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Xóa dự án
                                                </button>
                                            ) : (
                                                <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-3">
                                                    <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                                                        <Trash2 className="w-4 h-4" />
                                                        Xóa dự án này
                                                    </h3>
                                                    <p className="text-xs text-red-700">
                                                        Hành động này sẽ xóa <strong>toàn bộ dự án</strong> cùng với tất cả báo giá
                                                        và dòng tiền liên quan. Không thể hoàn tác sau khi xóa.
                                                    </p>
                                                    <div className="space-y-2">
                                                        <label className="block text-xs font-medium text-red-700">
                                                            Nhập chính xác tên dự án để xác nhận xóa:
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={deleteConfirmName}
                                                            onChange={(e) => setDeleteConfirmName(e.target.value)}
                                                            placeholder={project.name || 'Tên dự án'}
                                                            className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-sm"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="text-xs text-red-600">
                                                            Để xóa, anh cần nhập đúng:{' '}
                                                            <span className="font-semibold">{project.name}</span>
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIsDeleteSectionOpen(false);
                                                                    setDeleteConfirmName('');
                                                                }}
                                                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                                                                disabled={isDeleting}
                                                            >
                                                                Hủy
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleDeleteProject()}
                                                                disabled={
                                                                    isDeleting ||
                                                                    !deleteConfirmName.trim() ||
                                                                    deleteConfirmName.trim() !== project.name.trim()
                                                                }
                                                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-red-500 text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                {isDeleting ? 'Đang xóa...' : 'Xóa dự án'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        }
                    />
                </div>
            </div>
        </div>
    );
}
