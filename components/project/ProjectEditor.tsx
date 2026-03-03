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
import AIImageSearch from '@/components/project/AIImageSearch';
import AITaskGenerator from '@/components/project/AITaskGenerator';

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
    projectYear?: number;
    phases?: string | null;      // JSON array string
    disciplines?: string | null; // JSON array string
    areas?: string | null;       // JSON array string
    levels?: string | null;      // JSON array string (BIM levels/floors)
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
        projectYear: new Date().getFullYear(),
    });
    const [customers, setCustomers] = useState<ProjectCustomerOption[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [showAITaskGen, setShowAITaskGen] = useState(false);
    const [projectDataCache, setProjectDataCache] = useState<unknown>(null); // Cache full project data for tabs
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteSectionOpen, setIsDeleteSectionOpen] = useState(false);
    const [activeWorkSubTab, setActiveWorkSubTab] = useState<WorkSubTabKey>('dashboard');

    // ── Setup danh sách tag-like (Phases / Disciplines / Areas / Levels) ──────
    const parseJsonList = (val: string | null | undefined): string[] => {
        if (!val) return [];
        try { return JSON.parse(val) as string[]; } catch { return []; }
    };

    const [phaseInput, setPhaseInput] = useState('');
    const [disciplineInput, setDisciplineInput] = useState('');
    const [areaInput, setAreaInput] = useState('');
    const [levelInput, setLevelInput] = useState('');
    const [levelGenInput, setLevelGenInput] = useState(''); // VD: "B2,B1,1-15,RF" → auto generate floor codes
    const [showLevelGen, setShowLevelGen] = useState(false);

    // Helper để thêm item vào list (lưu vào project state)
    const addToList = (field: 'phases' | 'disciplines' | 'areas' | 'levels', value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        const current = parseJsonList(project[field]);
        if (current.includes(trimmed)) return; // Không duplicate
        const updated = JSON.stringify([...current, trimmed]);
        setProject(prev => ({ ...prev, [field]: updated }));
    };

    const removeFromList = (field: 'phases' | 'disciplines' | 'areas' | 'levels', value: string) => {
        const current = parseJsonList(project[field]);
        const updated = JSON.stringify(current.filter(item => item !== value));
        setProject(prev => ({ ...prev, [field]: updated }));
    };

    // 🏢 Auto-generate floor codes từ chuỗi rút gọn
    // VD: "B2,B1,1-5,6-15,RF" → ["B2","B1","01FL","02FL","03FL","04FL","05FL","06-15FL","RF"]
    const generateLevelCodes = (input: string) => {
        const codes: string[] = [];
        const parts = input.split(/[,\s]+/).map(p => p.trim()).filter(Boolean);
        for (const part of parts) {
            const upper = part.toUpperCase();
            if (/^B/i.test(upper)) {
                // Basement: B1, B2 → translate to "01BS", "02BS"
                const num = upper.replace(/^B/i, '');
                codes.push(`${num.padStart(2,'0')}BS`);
            } else if (upper === 'RF' || upper === 'ROOF') {
                codes.push('RF');
            } else if (upper === 'M' || upper === 'MZ' || upper === 'MEZZANINE') {
                codes.push('MZ');
            } else if (upper.includes('-')) {
                // Range: "1-5" or "02-15" → compact "02-05FL" hoặc tách từng tầng nếu ≤5
                const [from, to] = upper.split('-').map(n => parseInt(n, 10));
                if (!isNaN(from) && !isNaN(to) && to > from) {
                    const count = to - from + 1;
                    if (count <= 5) {
                        // Tách từng tầng nếu range nhỏ
                        for (let i = from; i <= to; i++) {
                            codes.push(`${String(i).padStart(2,'0')}FL`);
                        }
                    } else {
                        // Range lớn → gộp
                        codes.push(`${String(from).padStart(2,'0')}-${String(to).padStart(2,'0')}FL`);
                    }
                }
            } else {
                // Single floor: "1" → "01FL", "12" → "12FL"
                const num = parseInt(upper, 10);
                if (!isNaN(num)) {
                    codes.push(`${String(num).padStart(2,'0')}FL`);
                } else {
                    // Giữ nguyên nếu không parse được (VD: "PH", "GF")
                    codes.push(upper);
                }
            }
        }
        // Thêm vào list, tránh duplicate
        const current = parseJsonList(project.levels);
        const merged = [...current, ...codes.filter(c => !current.includes(c))];
        setProject(prev => ({ ...prev, levels: JSON.stringify(merged) }));
        setLevelGenInput('');
        setShowLevelGen(false);
    };




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
                if (res.status === 404) {
                    console.warn('Project not found, redirecting to /projects');
                    // Clear any cached project data
                    if (typeof window !== 'undefined') {
                        // Clear localStorage cache if exists
                        try {
                            const cacheKeys = Object.keys(localStorage).filter(key => 
                                key.startsWith('project:') || key.startsWith('projects:')
                            );
                            cacheKeys.forEach(key => localStorage.removeItem(key));
                        } catch (e) {
                            // Ignore localStorage errors
                        }
                    }
                    // Redirect với timestamp để force refresh danh sách dự án
                    router.push(`/projects?_refresh=${Date.now()}`);
                    return;
                }
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
        } catch (error: unknown) {
            console.error('Failed to fetch project:', error);
            const message =
                error instanceof Error ? error.message : 'Không thể tải thông tin dự án. Vui lòng thử lại.';
            alert(`Lỗi: ${message}`);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, router]);

    useEffect(() => {
        if (!isNew && projectId) {
            void fetchProject();
        }
        void fetchCustomers();
    }, [projectId, isNew, fetchProject]);

    useEffect(() => {
        // Khi chuyển dự án, mặc định về tab thông tin và reset trạng thái xóa
        setActiveTab('info');
        setDeleteConfirmName('');
        setIsDeleteSectionOpen(false);
    }, [projectId, isNew]);

    const handleDeleteProject = async () => {
        if (isNew || !projectId) {
            return;
        }

        const trimmedProjectName = project.name.trim();
        const trimmedInput = deleteConfirmName.trim();

        if (!trimmedProjectName) {
            alert('Không xác định được tên dự án để xác nhận xóa.');
            return;
        }

        if (!trimmedInput) {
            alert('Vui lòng nhập tên dự án để xác nhận xóa.');
            return;
        }

        if (trimmedInput !== trimmedProjectName) {
            alert('Tên dự án nhập vào không chính xác. Vui lòng nhập đúng tên dự án để xóa.');
            return;
        }

        // Thêm một lớp xác nhận nữa để tránh xóa nhầm
        const confirmed = window.confirm(
            `Bạn có chắc chắn muốn xóa dự án "${trimmedProjectName}"?\nTất cả báo giá và dòng tiền liên quan sẽ bị xóa vĩnh viễn.`,
        );

        if (!confirmed) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
            });

            const result = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;

            if (!res.ok || !result?.success) {
                throw new Error(result?.error || 'Không thể xóa dự án. Vui lòng thử lại.');
            }

            alert('Đã xóa dự án thành công.');
            router.push('/projects');
        } catch (error: unknown) {
            console.error('Failed to delete project:', error);
            const message =
                error instanceof Error
                    ? error.message
                    : 'Không thể xóa dự án. Vui lòng kiểm tra lại và thử lại sau.';
            alert(`Lỗi: ${message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/customers');
            const result = (await res.json()) as {
                success?: boolean;
                data?: Array<{ id: string; name: string }>;
            };
            if (result.success && Array.isArray(result.data)) {
                setCustomers(
                    result.data.map((customer) => ({
                        id: customer.id,
                        name: customer.name,
                    })),
                );
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

            // Parse response body trước khi check res.ok
            let result: { success?: boolean; data?: any; error?: string; details?: any };
            try {
                result = (await res.json()) as { success?: boolean; data?: any; error?: string; details?: any };
            } catch (parseError) {
                // Nếu không parse được JSON, throw error với message từ status
                throw new Error(`Không thể đọc phản hồi từ server (status: ${res.status})`);
            }

            if (!res.ok) {
                // Nếu project không tồn tại (404), redirect về danh sách dự án
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
                    // Redirect với timestamp để force refresh danh sách dự án
                    router.push(`/projects?_refresh=${Date.now()}`);
                    return;
                }
                
                // Parse error message từ result
                let errorMessage = `HTTP error! status: ${res.status}`;
                if (
                    result &&
                    typeof result === 'object' &&
                    'error' in result &&
                    typeof (result as { error?: string }).error === 'string'
                ) {
                    errorMessage = (result as { error: string }).error;
                }
                
                // Tạo error object với response info để catch block có thể parse
                const error = new Error(errorMessage) as Error & { 
                    response?: Response; 
                    result?: typeof result;
                };
                error.response = res;
                error.result = result;
                throw error;
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

            // Try to extract more detailed error from result object (đã parse từ response)
            if (error && typeof error === 'object' && 'result' in error) {
                try {
                    const errorResult = (error as { result?: unknown }).result;
                    if (errorResult && typeof errorResult === 'object') {
                        const parsedErrorData = errorResult as {
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
                    }
                } catch {
                    // Ignore parse errors
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
        <>
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
                        <div className="flex items-center gap-2">
                            {/* Phase 03: Nút AI tạo tasks */}
                            {!isNew && (projectId || project.id) && (
                                <button
                                    type="button"
                                    onClick={() => setShowAITaskGen(true)}
                                    title="AI tự động tạo danh sách công việc BIM cho dự án"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl hover:from-indigo-600 hover:to-blue-700 transition-all shadow-sm"
                                >
                                    ✨ AI Tạo Tasks
                                </button>
                            )}
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
                                                        {isNew ? 'Lưu dự án trước khi upload ảnh từ máy.' : 'Tối đa 5MB.'}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        {/* AI Image Search button */}
                                                        <AIImageSearch
                                                            projectName={project.name}
                                                            description={project.description || ''}
                                                            location={project.location || ''}
                                                            onSelect={(url) => setProject(prev => ({ ...prev, imageUrl: url }))}
                                                        />
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

                                            {/* Năm dự án - chỉ hiện khi tạo mới */}
                                            {isNew && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Năm dự án
                                                    </label>
                                                    <select
                                                        value={project.projectYear ?? new Date().getFullYear()}
                                                        onChange={(e) => setProject({ ...project, projectYear: parseInt(e.target.value) })}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        {Array.from({ length: new Date().getFullYear() - 2019 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                                            <option key={year} value={year}>Năm {year}</option>
                                                        ))}
                                                    </select>
                                                    <p className="mt-1 text-xs text-gray-500">Dùng để đặt mã dự án theo năm (VD: PRJ-{project.projectYear ?? new Date().getFullYear()}-0001)</p>
                                                </div>
                                            </div>
                                            )}

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-sm font-medium text-gray-700">Mô tả</label>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (!project.name?.trim()) {
                                                                alert('Vui lòng nhập tên dự án trước khi dùng AI viết mô tả');
                                                                return;
                                                            }
                                                            setProject(prev => ({ ...prev, description: '' }));
                                                            setIsGeneratingDesc(true);
                                                            try {
                                                                const res = await fetch('/api/ai/enhance-project-description', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        projectName: project.name,
                                                                        location: project.location,
                                                                        description: project.description,
                                                                        totalArea: project.totalArea,
                                                                    }),
                                                                });
                                                                if (!res.ok || !res.body) throw new Error('Lỗi kết nối AI');
                                                                const reader = res.body.getReader();
                                                                const decoder = new TextDecoder();
                                                                let acc = '';
                                                                while (true) {
                                                                    const { done, value } = await reader.read();
                                                                    if (done) break;
                                                                    acc += decoder.decode(value, { stream: true });
                                                                    setProject(prev => ({ ...prev, description: acc }));
                                                                }
                                                            } catch (err) {
                                                                console.error('[AI Desc]', err);
                                                            } finally {
                                                                setIsGeneratingDesc(false);
                                                            }
                                                        }}
                                                        disabled={isGeneratingDesc}
                                                        title="AI tự động viết mô tả chuyên nghiệp từ tên & thông tin dự án"
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-wait transition-all shadow-sm"
                                                    >
                                                        {isGeneratingDesc ? (
                                                            <><span className="animate-spin">⏳</span> Đang viết...</>
                                                        ) : (
                                                            <>✨ AI viết mô tả</>
                                                        )}
                                                    </button>
                                                </div>
                                                <textarea
                                                    value={project.description || ''}
                                                    onChange={(e) => setProject({ ...project, description: e.target.value })}
                                                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] transition-colors ${isGeneratingDesc ? 'bg-indigo-50 border-indigo-200' : ''}`}
                                                    placeholder={isGeneratingDesc ? '✨ AI đang viết mô tả...' : 'Mô tả về dự án (hoặc bấm ✨ AI viết mô tả)'}
                                                    readOnly={isGeneratingDesc}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ─── LAYOUT 2 CỘT: TRÁI = INFO, PHẢI = SETUP TAGS ─── */}
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                                    {/* ─── CỘT TRÁI: Thông tin dự án ─────────────────────────── */}
                                    <div className="space-y-5">

                                     {/* Khách hàng + Địa điểm */}
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                    {/* Ngày bắt đầu, Ngày kết thúc, Diện tích */}
                                    <div className="grid grid-cols-3 gap-4">
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

                                    {/* Trạng thái + Ngân sách */}
                                    <div className="grid grid-cols-2 gap-4">
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

                                    {/* Ghi chú */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                                        <textarea
                                            value={project.notes || ''}
                                            onChange={(e) => setProject({ ...project, notes: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                                            placeholder="Ghi chú về dự án"
                                        />
                                    </div>

                                    </div>{/* end CỘT TRÁI */}

                                    {/* ─── CỘT PHẢI: Setup Tags ───────────────────────────────── */}
                                    <div className="border border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-2xl p-4 space-y-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-base">⚙️</span>
                                            <h3 className="text-sm font-bold text-gray-800">Setup Danh sách cho Task</h3>
                                            <span className="text-xs text-gray-400 font-normal">— Dropdown khi tạo task</span>
                                        </div>

                                        {/* GRID 2x2 cho 4 tag list */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                            {/* ─ Giai đoạn ─ */}
                                            <div className="space-y-1.5 bg-white rounded-xl p-3 border border-indigo-100">
                                                <label className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                                    🏗️ Giai đoạn
                                                    <span className="ml-auto text-[10px] text-indigo-400 font-normal normal-case">{parseJsonList(project.phases).length} mục</span>
                                                </label>
                                                <div className="flex gap-1.5">
                                                    <input
                                                        type="text"
                                                        value={phaseInput}
                                                        onChange={e => setPhaseInput(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('phases', phaseInput); setPhaseInput(''); } }}
                                                        placeholder="VD: Shopdrawing..."
                                                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
                                                    />
                                                    <button type="button" onClick={() => { addToList('phases', phaseInput); setPhaseInput(''); }} className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-bold">+</button>
                                                </div>
                                                {/* Quick presets */}
                                                <div className="flex flex-wrap gap-1">
                                                    {['Khảo sát', 'Thiết kế cơ sở', 'Thiết kế KT', 'Shopdrawing', 'As-built'].filter(s => !parseJsonList(project.phases).includes(s)).map(s => (
                                                        <button key={s} type="button" onClick={() => addToList('phases', s)} className="px-1.5 py-0.5 text-[10px] border border-indigo-200 text-indigo-600 rounded-full hover:bg-indigo-50">{s}</button>
                                                    ))}
                                                </div>
                                                <div className="flex flex-wrap gap-1 min-h-[28px]">
                                                    {parseJsonList(project.phases).map((item) => (
                                                        <span key={item} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[11px] font-medium">
                                                            {item}
                                                            <button type="button" onClick={() => removeFromList('phases', item)} className="ml-0.5 text-indigo-400 hover:text-red-500 font-bold leading-none">×</button>
                                                        </span>
                                                    ))}
                                                    {parseJsonList(project.phases).length === 0 && <p className="text-[11px] text-gray-400 italic">Chưa có</p>}
                                                </div>
                                            </div>

                                            {/* ─ Bộ môn ─ */}
                                            <div className="space-y-1.5 bg-white rounded-xl p-3 border border-violet-100">
                                                <label className="flex items-center gap-1.5 text-xs font-bold text-violet-700 uppercase tracking-wider">
                                                    📐 Bộ môn
                                                    <span className="ml-auto text-[10px] text-violet-400 font-normal normal-case">{parseJsonList(project.disciplines).length} mục</span>
                                                </label>
                                                <div className="flex gap-1.5">
                                                    <input
                                                        type="text"
                                                        value={disciplineInput}
                                                        onChange={e => setDisciplineInput(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('disciplines', disciplineInput); setDisciplineInput(''); } }}
                                                        placeholder="VD: Kiến trúc..."
                                                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white"
                                                    />
                                                    <button type="button" onClick={() => { addToList('disciplines', disciplineInput); setDisciplineInput(''); }} className="px-2.5 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-xs font-bold">+</button>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {['Kiến trúc', 'Kết cấu', 'MEP', 'Điện', 'Nước', 'PCCC', 'Nội thất'].filter(s => !parseJsonList(project.disciplines).includes(s)).map(s => (
                                                        <button key={s} type="button" onClick={() => addToList('disciplines', s)} className="px-1.5 py-0.5 text-[10px] border border-violet-200 text-violet-600 rounded-full hover:bg-violet-50">{s}</button>
                                                    ))}
                                                </div>
                                                <div className="flex flex-wrap gap-1 min-h-[28px]">
                                                    {parseJsonList(project.disciplines).map((item) => (
                                                        <span key={item} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-violet-100 text-violet-800 rounded-full text-[11px] font-medium">
                                                            {item}
                                                            <button type="button" onClick={() => removeFromList('disciplines', item)} className="ml-0.5 text-violet-400 hover:text-red-500 font-bold leading-none">×</button>
                                                        </span>
                                                    ))}
                                                    {parseJsonList(project.disciplines).length === 0 && <p className="text-[11px] text-gray-400 italic">Chưa có</p>}
                                                </div>
                                            </div>

                                            {/* ─ Khu vực / Vị trí ─ */}
                                            <div className="space-y-1.5 bg-white rounded-xl p-3 border border-teal-100">
                                                <label className="flex items-center gap-1.5 text-xs font-bold text-teal-700 uppercase tracking-wider">
                                                    📍 Khu vực
                                                    <span className="ml-auto text-[10px] text-teal-400 font-normal normal-case">{parseJsonList(project.areas).length} mục</span>
                                                </label>
                                                <div className="flex gap-1.5">
                                                    <input
                                                        type="text"
                                                        value={areaInput}
                                                        onChange={e => setAreaInput(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('areas', areaInput); setAreaInput(''); } }}
                                                        placeholder="VD: Block A, Tầng hầm..."
                                                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white"
                                                    />
                                                    <button type="button" onClick={() => { addToList('areas', areaInput); setAreaInput(''); }} className="px-2.5 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-xs font-bold">+</button>
                                                </div>
                                                <div className="flex flex-wrap gap-1 min-h-[28px]">
                                                    {parseJsonList(project.areas).map((item) => (
                                                        <span key={item} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full text-[11px] font-medium">
                                                            {item}
                                                            <button type="button" onClick={() => removeFromList('areas', item)} className="ml-0.5 text-teal-400 hover:text-red-500 font-bold leading-none">×</button>
                                                        </span>
                                                    ))}
                                                    {parseJsonList(project.areas).length === 0 && <p className="text-[11px] text-gray-400 italic">Chưa có</p>}
                                                </div>
                                            </div>

                                            {/* ─ Tầng / Level BIM ─ */}
                                            <div className="space-y-1.5 bg-white rounded-xl p-3 border border-orange-100">
                                                <label className="flex items-center gap-1.5 text-xs font-bold text-orange-700 uppercase tracking-wider">
                                                    🏢 Tầng / Level BIM
                                                    <span className="ml-auto text-[10px] text-orange-400 font-normal normal-case">{parseJsonList(project.levels).length} levels</span>
                                                </label>
                                                <div className="flex gap-1.5">
                                                    <input
                                                        type="text"
                                                        value={levelInput}
                                                        onChange={e => setLevelInput(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('levels', levelInput); setLevelInput(''); } }}
                                                        placeholder="VD: 01FL, 02-05FL, RF..."
                                                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white font-mono"
                                                    />
                                                    <button type="button" onClick={() => { addToList('levels', levelInput); setLevelInput(''); }} className="px-2.5 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-xs font-bold">+</button>
                                                </div>

                                                {/* 🪄 Level Generator */}
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowLevelGen(v => !v)}
                                                        className="flex items-center gap-1 text-[11px] text-orange-600 hover:text-orange-800 font-semibold transition-colors"
                                                    >
                                                        <span>🪄</span>
                                                        {showLevelGen ? 'Ẩn' : 'Auto tạo nhanh từ sơ đồ tầng'}
                                                    </button>
                                                    {showLevelGen && (
                                                        <div className="mt-1.5 p-2.5 bg-orange-50 rounded-lg border border-orange-200 space-y-1.5">
                                                            <p className="text-[10px] text-orange-700 font-medium">
                                                                Nhập theo cú pháp: <code className="bg-orange-100 px-1 rounded font-mono">B2,B1,1-5,6-15,RF</code>
                                                            </p>
                                                            <p className="text-[10px] text-orange-500">
                                                                → <code className="font-mono">02BS, 01BS, 01FL, 02FL...05FL, 06-15FL, RF</code>
                                                                <br />Range ≤5 tầng: tách từng tầng. Range &gt;5 tầng: gộp lại.
                                                            </p>
                                                            <div className="flex gap-1.5">
                                                                <input
                                                                    type="text"
                                                                    value={levelGenInput}
                                                                    onChange={e => setLevelGenInput(e.target.value)}
                                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); generateLevelCodes(levelGenInput); } }}
                                                                    placeholder="VD: B2,B1,GF,1-5,6-20,RF"
                                                                    className="flex-1 px-2 py-1 text-xs border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-400 bg-white font-mono"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => generateLevelCodes(levelGenInput)}
                                                                    className="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600"
                                                                >
                                                                    Tạo
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-1 min-h-[28px]">
                                                    {parseJsonList(project.levels).map((item) => (
                                                        <span key={item} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-[11px] font-mono font-semibold">
                                                            {item}
                                                            <button type="button" onClick={() => removeFromList('levels', item)} className="ml-0.5 text-orange-400 hover:text-red-500 font-bold leading-none">×</button>
                                                        </span>
                                                    ))}
                                                    {parseJsonList(project.levels).length === 0 && <p className="text-[11px] text-gray-400 italic">Chưa có — nhập tay hoặc dùng 🪄 Auto tạo</p>}
                                                </div>
                                            </div>

                                        </div>{/* end grid 2x2 */}

                                        <p className="text-[11px] text-gray-500">
                                            💡 Nhấn <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Enter</kbd> hoặc <strong>+</strong> để thêm. Sẽ hiện dạng dropdown khi tạo/sửa Task.
                                        </p>
                                    </div>{/* end CỘT PHẢI */}

                                    </div>{/* end grid 2 cột */}

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

            {/* Phase 03: AI Task Generator Modal */}
            {showAITaskGen && (
                <AITaskGenerator
                    projectId={projectId || project.id}
                    projectName={project.name}
                    projectNo={project.projectNo}
                    projectDescription={project.description || undefined}
                    projectLocation={project.location || undefined}
                    totalArea={project.totalArea || undefined}
                    onTasksImported={() => {
                        setActiveWorkSubTab('task');
                        setActiveTab('tasks');
                    }}
                    onClose={() => setShowAITaskGen(false)}
                />
            )}
        </>
    );
}
