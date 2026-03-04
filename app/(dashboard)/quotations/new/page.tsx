'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import QuotationEditor from '@/components/quotation/QuotationEditor';
import { QuotationFormData } from '@/types/quotation';

type ProjectContext = {
    id: string;
    name: string;
    customerId?: string;
    location?: string;
    totalArea?: number;
    description?: string | null;
    notes?: string | null;
};

export default function NewQuotationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectIdFromUrl = searchParams.get('projectId');

    const [projectContext, setProjectContext] = useState<ProjectContext | undefined>(undefined);
    const [isLoadingProject, setIsLoadingProject] = useState(!!projectIdFromUrl);
    const [projectLoadError, setProjectLoadError] = useState<string | null>(null);

    // Fetch project info when projectId is provided via URL query
    useEffect(() => {
        if (!projectIdFromUrl) return;

        const fetchProject = async () => {
            setIsLoadingProject(true);
            setProjectLoadError(null);
            try {
                const res = await fetch(`/api/projects/${encodeURIComponent(projectIdFromUrl)}`, {
                    cache: 'no-store',
                });
                const result = await res.json();
                if (!res.ok || !result.success || !result.data) {
                    throw new Error(result.error || 'Không thể tải thông tin dự án');
                }

                const project = result.data;
                setProjectContext({
                    id: project.id,
                    name: project.name || '',
                    customerId: project.customerId || undefined,
                    location: project.location || undefined,
                    totalArea: project.totalArea != null ? Number(project.totalArea) : undefined,
                    description: project.description || null,
                    notes: project.notes || null,
                });
            } catch (err) {
                console.error('Failed to fetch project for quotation context:', err);
                const message = err instanceof Error ? err.message : 'Không thể tải thông tin dự án';
                setProjectLoadError(message);
            } finally {
                setIsLoadingProject(false);
            }
        };

        void fetchProject();
    }, [projectIdFromUrl]);

    const handleSave = async (data: QuotationFormData) => {
        const response = await fetch('/api/quotations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
            // Redirect to edit page of the newly created quotation
            router.push(`/quotations/${result.data.id}/edit`);
        } else {
            // Build detailed error message
            let errorMsg = result.error || 'Không thể tạo báo giá';
            if (result.details?.fieldErrors) {
                const fieldErrors = Object.entries(result.details.fieldErrors)
                    .filter(([, msgs]) => Array.isArray(msgs) && (msgs as string[]).length > 0)
                    .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
                    .join('; ');
                if (fieldErrors) {
                    errorMsg += ' — ' + fieldErrors;
                }
            }
            throw new Error(errorMsg);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Quotation</h1>
                    <p className="text-sm text-gray-500">Draft your BIM services proposal.</p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="text-gray-500 hover:text-gray-700 font-medium text-sm"
                >
                    Cancel
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                {isLoadingProject ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-gray-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Đang tải thông tin dự án...</span>
                    </div>
                ) : projectLoadError ? (
                    <div className="mx-6 mt-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
                            <p className="font-semibold">Không thể tải thông tin dự án</p>
                            <p className="mt-1">{projectLoadError}</p>
                            <p className="mt-2 text-xs text-amber-600">
                                Bạn vẫn có thể tạo báo giá và chọn dự án thủ công bên dưới.
                            </p>
                        </div>
                        <div className="mt-4">
                            <QuotationEditor onSave={handleSave} isNew={true} />
                        </div>
                    </div>
                ) : (
                    <QuotationEditor
                        onSave={handleSave}
                        isNew={true}
                        projectContext={projectContext}
                    />
                )}
            </div>
        </div>
    );
}
