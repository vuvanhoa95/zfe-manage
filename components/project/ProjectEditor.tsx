'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';

import BillingTab from '@/components/project/BillingTab';
import CashFlowTab from '@/components/project/CashFlowTab';
import ProjectQuotationsPanel from '@/components/project/ProjectQuotationsPanel';
import { AnimatedTabPanels } from '@/components/ui/AnimatedTabPanels';
import { formatVND } from '@/lib/number-to-words-vn';

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
    const [activeTab, setActiveTab] = useState<'info' | 'cashflow' | 'billing' | 'quotations'>('info');
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
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [projectDataCache, setProjectDataCache] = useState<any>(null); // Cache full project data for tabs

    useEffect(() => {
        if (!isNew && projectId) {
            fetchProject();
        }
        fetchCustomers();
    }, [projectId, isNew]);

    useEffect(() => {
        // Khi chuyển dự án, mặc định về tab thông tin
        setActiveTab('info');
    }, [projectId, isNew]);

    const fetchProject = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const result = await res.json();
            if (result.success && result.data) {
                // Format dates for input fields
                const projectData = {
                    ...result.data,
                    startDate: result.data.startDate ? new Date(result.data.startDate).toISOString().split('T')[0] : '',
                    endDate: result.data.endDate ? new Date(result.data.endDate).toISOString().split('T')[0] : '',
                };
                setProject(projectData);
                // Cache full project data for tabs to avoid refetching
                setProjectDataCache(result.data);
            } else {
                console.error('Failed to fetch project:', result);
                alert('Không thể tải thông tin dự án. Vui lòng thử lại.');
            }
        } catch (error: any) {
            console.error('Failed to fetch project:', error);
            alert(`Lỗi: ${error?.message || 'Không thể tải thông tin dự án'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/customers');
            const result = await res.json();
            if (result.success) {
                setCustomers(result.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch customers:', err);
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    const handleSaveProject = async () => {
        // Validation
        if (!project.name || !project.name.trim()) {
            alert('Vui lòng nhập tên dự án');
            return;
        }

        setIsSaving(true);
        try {
            const method = isNew ? 'POST' : 'PUT';
            const url = isNew ? '/api/projects' : `/api/projects/${projectId}`;

            // Clean up data before sending: convert empty strings to null
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

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanedData),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || `HTTP error! status: ${res.status}`);
            }

            if (result.success) {
                if (isNew) {
                    router.push(`/projects/${result.data.id}`);
                } else {
                    await fetchProject();
                    alert('Đã lưu dự án thành công!');
                }
            } else {
                throw new Error(result.error || 'Không thể lưu dự án');
            }
        } catch (error: any) {
            console.error('Failed to save project:', error);
            let errorMessage = error?.message || 'Không thể lưu dự án. Vui lòng kiểm tra lại thông tin và thử lại.';
            
            // Try to extract more detailed error from response
            if (error?.response) {
                try {
                    const errorData = await error.response.json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                    if (errorData.details?.fieldErrors) {
                        const fieldErrors = Object.entries(errorData.details.fieldErrors)
                            .map(([field, messages]: [string, any]) => {
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
                } catch (e) {
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

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-3">
                <div className="flex items-center gap-2 overflow-x-auto">
                    <button
                        type="button"
                        aria-label="Tab Thông tin dự án"
                        onClick={() => setActiveTab('info')}
                        className={`relative px-4 py-3 text-sm font-semibold border-b-2 border-transparent transition-colors transition-transform after:absolute after:left-0 after:-bottom-[1px] after:h-0.5 after:w-full after:bg-zf-accent after:origin-left after:scale-x-0 after:transition-transform after:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] ${activeTab === 'info'
                                ? 'text-zf-accent after:scale-x-100'
                                : 'text-gray-600 hover:text-zf-accent hover:after:scale-x-100'
                            }`}
                    >
                        Thông tin dự án
                    </button>
                    <button
                        type="button"
                        aria-label="Tab Quotations"
                        onClick={() => setActiveTab('quotations')}
                        className={`relative px-4 py-3 text-sm font-semibold border-b-2 border-transparent transition-colors transition-transform after:absolute after:left-0 after:-bottom-[1px] after:h-0.5 after:w-full after:bg-zf-accent after:origin-left after:scale-x-0 after:transition-transform after:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] ${activeTab === 'quotations'
                                ? 'text-zf-accent after:scale-x-100'
                                : 'text-gray-600 hover:text-zf-accent hover:after:scale-x-100'
                            }`}
                    >
                        Quotations
                    </button>
                    <button
                        type="button"
                        aria-label="Tab Dòng tiền"
                        onClick={() => setActiveTab('cashflow')}
                        className={`relative px-4 py-3 text-sm font-semibold border-b-2 border-transparent transition-colors transition-transform after:absolute after:left-0 after:-bottom-[1px] after:h-0.5 after:w-full after:bg-zf-accent after:origin-left after:scale-x-0 after:transition-transform after:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] ${activeTab === 'cashflow'
                                ? 'text-zf-accent after:scale-x-100'
                                : 'text-gray-600 hover:text-zf-accent hover:after:scale-x-100'
                            }`}
                    >
                        Dòng tiền
                    </button>
                    <button
                        type="button"
                        aria-label="Tab Hóa đơn"
                        onClick={() => setActiveTab('billing')}
                        className={`relative px-4 py-3 text-sm font-semibold border-b-2 border-transparent transition-colors transition-transform after:absolute after:left-0 after:-bottom-[1px] after:h-0.5 after:w-full after:bg-zf-accent after:origin-left after:scale-x-0 after:transition-transform after:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] ${activeTab === 'billing'
                                ? 'text-zf-accent after:scale-x-100'
                                : 'text-gray-600 hover:text-zf-accent hover:after:scale-x-100'
                            }`}
                    >
                        Hóa đơn
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedTabPanels
                        activeKey={activeTab}
                        variant="ios"
                        orderedKeys={['info', 'quotations', 'cashflow', 'billing'] as const}
                    render={(tab) =>
                        tab === 'cashflow' ? (
                            <CashFlowTab projectId={projectId || project.id} isNew={isNew} projectData={projectDataCache} />
                        ) : tab === 'billing' ? (
                            <BillingTab projectId={projectId || project.id} isNew={isNew} projectData={projectDataCache} />
                        ) : tab === 'quotations' ? (
                            <ProjectQuotationsPanel projectId={projectId || project.id} isNew={isNew} projectData={projectDataCache} />
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
                                                                project.imageUrl.startsWith('http')
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
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
                                            <input
                                                type="date"
                                                value={project.startDate || ''}
                                                onChange={(e) => setProject({ ...project, startDate: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc</label>
                                            <input
                                                type="date"
                                                value={project.endDate || ''}
                                                onChange={(e) => setProject({ ...project, endDate: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
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
                                                    className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${PROJECT_STATUS_CONFIG[project.status].badgeClass
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
                                </div>
                            )
                        }
                    />
                </div>
            </div>
        </div>
    );
}
