'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Mic } from 'lucide-react';
import { QuotationFormData } from '@/types/quotation';
import { AnimatedTabPanels } from '@/components/ui/AnimatedTabPanels';
import { QuotationDataProvider } from '@/lib/contexts/QuotationDataContext';
import TechnicalBadge from '@/components/technical/TechnicalBadge';
import TechnicalMetrics from '@/components/technical/TechnicalMetrics';
import DataTab from './DataTab';
import PreviewTab from './PreviewTab';
import CatalogTab from './CatalogTab';
import VoiceInputModal from './VoiceInputModal';
import AIAssistant from './AIAssistant';
import TemplatePickerModal from './TemplatePickerModal';
import SaveTemplateModal from './SaveTemplateModal';

type WizardStep = 1 | 2 | 3 | 4;

const step1Schema = z.object({
    date: z.date(),
    location: z.string().min(1, 'Địa điểm không được để trống'),
    customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
    projectId: z.string().min(1, 'Vui lòng chọn dự án'),
    projectName: z.string().min(1, 'Tên dự án không được để trống'),
    title: z.string().min(1, 'Tiêu đề báo giá không được để trống'),
});

const step2Schema = z.object({
    deliverablesText: z.string().min(1, 'Sản phẩm bàn giao không được để trống'),
    lines: z
        .array(
            z.object({
                title: z.string().min(1, 'Nội dung công việc không được để trống'),
                isChargeable: z.boolean(),
            }),
        )
        .min(1, 'Báo giá cần ít nhất một dòng công việc')
        .refine(
            (lines) => lines.some((l) => l.isChargeable),
            { message: 'Báo giá cần ít nhất một dòng được tính tiền' },
        ),
});

const step3Schema = z
    .object({
        paymentMilestones: z
            .array(
                z.object({
                    no: z.number().int().positive(),
                    title: z.string().min(1, 'Tên đợt thanh toán không được để trống'),
                    percent: z.number().min(0).max(100),
                }),
            )
            .min(1, 'Vui lòng cấu hình ít nhất một đợt thanh toán'),
    })
    .superRefine((data, ctx) => {
        const totalPercent = data.paymentMilestones.reduce((sum, m) => sum + m.percent, 0);
        if (Math.abs(totalPercent - 100) > 0.01) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Tổng tỉ lệ các đợt thanh toán phải bằng 100%',
                path: ['paymentMilestones'],
            });
        }
    });

type QuotationEditorProps = {
    id?: string;
    quotation?: QuotationFormData;
    quotationNo?: string;
    onSave: (data: QuotationFormData) => Promise<void>;
    onExportDocx?: () => Promise<void>;
    isNew?: boolean;
    projectContext?: {
        id: string;
        name: string;
        customerId?: string;
        location?: string;
        totalArea?: number;
        description?: string | null;
        notes?: string | null;
    };
};

export default function QuotationEditor({
    id,
    quotation,
    quotationNo,
    onSave,
    onExportDocx,
    isNew = false,
    projectContext,
}: QuotationEditorProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'data' | 'preview' | 'catalog'>('data');
    const [activeStep, setActiveStep] = useState<WizardStep>(1);
    const [tabSwitchTime, setTabSwitchTime] = useState<number | undefined>(undefined);
    const [cacheStatus, setCacheStatus] = useState<'cached' | 'stale' | 'fresh'>('fresh');
    const [formData, setFormData] = useState<QuotationFormData>(() => {
        const base: QuotationFormData =
            quotation || {
            date: new Date(),
            location: 'Hà Nội',
            customerId: '',
            projectId: '',
            projectName: '',
            projectItem: '',
            projectNotes: '',
            // Diện tích phải lấy từ thông tin dự án (Project). Không hardcode default để tránh lệch dữ liệu.
            totalArea: undefined,
            title: 'BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM',
            introText: '',
            scopeText: 'Phạm vi công việc BIM dự kiến bao gồm:\n\n- Tư vấn và thiết lập quy trình BIM cho dự án\n- Xây dựng và cập nhật mô hình BIM 3D cho các bộ môn chính\n- Phân tích xung đột, tối ưu tuyến và hỗ trợ điều chỉnh thiết kế\n- Chuẩn bị dữ liệu phục vụ thi công và nghiệm thu',
            deliverablesText: '<li>Mô hình BIM 3D các bộ môn chính (Kiến trúc, Kết cấu, MEP)</li><li>Báo cáo tổng hợp xung đột chính kèm đề xuất xử lý</li><li>Bản vẽ và bảng khối lượng trích xuất từ mô hình (nếu có yêu cầu)</li><li>Bộ file mô hình BIM phục vụ quản lý và vận hành dự án</li>',
            scheduleText: 'Thời gian triển khai: ... ngày làm việc kể từ khi nhận đủ hồ sơ',
            vatRate: 0.08,
            outsourceCost: undefined,
            taxRate: undefined,
            taxCost: undefined,
            commissionType: 'direct',
            commissionRate: undefined,
            commissionCost: undefined,
            status: 'DRAFT',
            notes: '',
            lines: [
                {
                    section: 'A – PHẠM VI CÔNG VIỆC',
                    itemNo: '',
                    title: 'A – PHẠM VI CÔNG VIỆC',
                    order: 0,
                    isGroupHeader: true,
                    isChargeable: false,
                    priceType: 'fixed'
                },
                {
                    section: 'B – BÁO GIÁ',
                    itemNo: '',
                    title: 'B – BÁO GIÁ',
                    order: 1,
                    isGroupHeader: true,
                    isChargeable: false,
                    priceType: 'fixed'
                },
            ],
            paymentMilestones: [
                { no: 1, title: 'Tạm ứng', percent: 30, order: 0 },
                { no: 2, title: 'Thanh toán đợt 1', percent: 40, order: 1 },
                { no: 3, title: 'Thanh toán đợt 2', percent: 30, order: 2 },
            ],
            outsourceLines: [],
        };

        if (isNew && projectContext) {
            return {
                ...base,
                projectId: projectContext.id,
                projectName: projectContext.name,
                customerId: projectContext.customerId ?? base.customerId,
                location: projectContext.location ?? base.location,
                totalArea: projectContext.totalArea ?? base.totalArea,
                projectItem: projectContext.description ?? base.projectItem,
                projectNotes: projectContext.notes ?? base.projectNotes,
            };
        }

        return base;
    });

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isLoadingExisting, setIsLoadingExisting] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [stepErrors, setStepErrors] = useState<Partial<Record<WizardStep, string[]>>>({});
    const [completedSteps, setCompletedSteps] = useState<Partial<Record<WizardStep, boolean>>>({});
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
    const [showTemplatePickerModal, setShowTemplatePickerModal] = useState(false);
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

    // Load existing quotation by id (ProjectEditor passes only id, not full quotation data)
    useEffect(() => {
        if (isNew) return;
        if (!id) return;
        if (quotation) return; // already provided by parent

        const load = async () => {
            setIsLoadingExisting(true);
            setLoadError(null);
            try {
                const res = await fetch(`/api/quotations/${id}`, { cache: 'no-store' });
                const result = await res.json();
                if (!res.ok || !result.success || !result.data) {
                    throw new Error(result.error || 'Không thể tải dữ liệu báo giá');
                }

                const q = result.data as any;

                // NOTE: Prisma QuotationLine does not store priceType; infer a safe default for UI
                const lines = Array.isArray(q.lines)
                    ? q.lines.map((line: any, idx: number) => {
                          const isGroupHeader = Boolean(line.isGroupHeader);
                          const unit = (line.unit ?? '') as string;
                          const inferredPriceType: 'fixed' | 'area' | 'none' =
                              !line.isChargeable ? 'none' : unit === 'm²' ? 'fixed' : 'fixed';

                          return {
                              section: line.section ?? undefined,
                              itemNo: line.itemNo ?? undefined,
                              title: line.title ?? '',
                              qty: line.qty ?? undefined,
                              unit: unit || undefined,
                              unitPrice: line.unitPrice ?? undefined,
                              priceType: isGroupHeader ? 'fixed' : inferredPriceType,
                              note: line.note ?? undefined,
                              order: typeof line.order === 'number' ? line.order : idx,
                              isGroupHeader,
                              isChargeable: Boolean(line.isChargeable),
                          };
                      })
                    : [];

                const milestones = Array.isArray(q.paymentMilestones)
                    ? q.paymentMilestones.map((m: any, idx: number) => ({
                          no: Number(m.no) || idx + 1,
                          title: String(m.title || ''),
                          percent: Number(m.percent) || 0,
                          description: m.description ?? undefined,
                          order: typeof m.order === 'number' ? m.order : idx,
                      }))
                    : [];

                // Fallback: ensure there are at least the default group headers so UI is usable
                const defaultHeaders = [
                    {
                        section: 'A – PHẠM VI CÔNG VIỆC',
                        itemNo: '',
                        title: 'A – PHẠM VI CÔNG VIỆC',
                        order: 0,
                        isGroupHeader: true,
                        isChargeable: false,
                        priceType: 'fixed' as const,
                    },
                    {
                        section: 'B – BÁO GIÁ',
                        itemNo: '',
                        title: 'B – BÁO GIÁ',
                        order: 1,
                        isGroupHeader: true,
                        isChargeable: false,
                        priceType: 'fixed' as const,
                    },
                ];

                const mergedLines = lines.length ? lines : defaultHeaders;

                setFormData({
                    date: q.date ? new Date(q.date) : new Date(),
                    location: q.location || 'Hà Nội',
                    customerId: q.customerId || '',
                    projectId: q.projectId || '',
                    projectName: q.projectName || '',
                    projectItem: q.projectItem || '',
                    projectNotes: q.projectNotes || '',
                    // totalArea is not stored on quotation; keep current value if any
                    totalArea: (q.totalArea ?? undefined) || undefined,
                    title: q.title || 'BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM',
                    introText: q.introText || '',
                    scopeText: q.scopeText || '',
                    deliverablesText: q.deliverablesText || '',
                    scheduleText: q.scheduleText || '',
                    vatRate: typeof q.vatRate === 'number' ? q.vatRate : 0.08,
                    outsourceCost: q.outsourceCost ?? undefined,
                    outsourceStaff: q.outsourceStaff ?? undefined,
                    outsourceDiscipline: q.outsourceDiscipline ?? undefined,
                    outsourceRate: q.outsourceRate ?? undefined,
                    outsourceNote: q.outsourceNote ?? undefined,
                    outsourceLines: Array.isArray(q.outsourceLines)
                        ? q.outsourceLines.map((l: any, idx: number) => ({
                              id: l.id ?? undefined,
                              staffName: l.staffName ?? undefined,
                              discipline: l.discipline ?? undefined,
                              unit: l.unit ?? undefined,
                              qty: l.qty ?? undefined,
                              unitRate: l.unitRate ?? undefined,
                              totalAmount: l.amount ?? undefined,
                              note: l.note ?? undefined,
                              order: typeof l.order === 'number' ? l.order : idx,
                          }))
                        : [],
                    taxRate: q.taxRate ?? undefined,
                    taxCost: q.taxCost ?? undefined,
                    commissionType: q.commissionType || 'direct',
                    commissionRate: q.commissionRate ?? undefined,
                    commissionCost: q.commissionCost ?? undefined,
                    status: q.status || 'DRAFT',
                    notes: q.notes || '',
                    lines: mergedLines,
                    paymentMilestones: milestones,
                });
            } catch (err) {
                console.error('Failed to load quotation:', err);
                const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu báo giá';
                setLoadError(message);
            } finally {
                setIsLoadingExisting(false);
            }
        };

        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isNew]);

    // Auto-import pricing items from Master Data when creating new quotation
    useEffect(() => {
        if (isNew && !quotation) {
            const importPricingItems = async () => {
                try {
                    const res = await fetch('/api/catalog?category=PRICING', {
                        cache: 'no-store',
                    });
                    const result = await res.json();
                    if (result.success && result.data && result.data.length > 0) {
                        const pricingItems = result.data
                            .sort((a: any, b: any) => a.order - b.order);
                        
                        // Keep the group headers and add pricing items
                        const groupHeaders = formData.lines.filter(line => line.isGroupHeader);
                        const newLines = [
                            ...groupHeaders,
                            ...pricingItems.map((item: any, index: number) => ({
                                section: 'B – BÁO GIÁ',
                                itemNo: `${index + 1}`,
                                title: item.title,
                                qty: item.unit === 'm²' ? undefined : 1,
                                unit: item.unit || 'm²',
                                unitPrice: item.defaultPrice || 0,
                                priceType: (item.unit === 'm²' ? 'area' : 'fixed') as 'fixed' | 'area' | 'none',
                                note: item.description || '',
                                order: groupHeaders.length + index,
                                isGroupHeader: false,
                                isChargeable: true,
                            }))
                        ];
                        
                        setFormData(prev => ({ ...prev, lines: newLines }));
                    }
                } catch (err) {
                    console.error('Failed to auto-import pricing items:', err);
                }
            };
            
            importPricingItems();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once when component mounts

    const handleExportPdf = () => {
        if (isNew || !id) return;
        window.open(`/api/quotations/${id}/export-pdf`, '_blank');
    };

    // Mở modal lưu template thay vì window.prompt
    const handleSaveAsTemplate = () => {
        setShowSaveTemplateModal(true);
    };

    const doSaveAsTemplate = async ({ name, description, category }: { name: string; description: string; category: string }) => {
        const payload = {
            name,
            description: description || undefined,
            category,
            vatRate: formData.vatRate,
            title: formData.title,
            introText: formData.introText,
            scopeText: formData.scopeText,
            deliverablesText: formData.deliverablesText,
            scheduleText: formData.scheduleText,
            theme: formData.theme,
            layoutTemplate: formData.templateId,
            lines: formData.lines,
            paymentMilestones: formData.paymentMilestones,
        };

        const res = await fetch('/api/quotation-templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.error || 'Không thể lưu mẫu báo giá');
        }
    };

    // Mở modal chọn template thay vì window.prompt
    const handleApplyTemplate = () => {
        setShowTemplatePickerModal(true);
    };

    const doApplyTemplate = async (templateId: string) => {
        setIsApplyingTemplate(true);
        try {
            const applyRes = await fetch(`/api/quotation-templates/${templateId}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ totalArea: formData.totalArea }),
            });

            const applyResult = await applyRes.json();
            if (!applyRes.ok || !applyResult.success || !applyResult.data) {
                throw new Error(applyResult.error || 'Không thể áp dụng mẫu báo giá');
            }

            setFormData((prev) => ({ ...prev, ...applyResult.data }));
        } finally {
            setIsApplyingTemplate(false);
        }
    };

    const handleSave = async (isAutoSave = false) => {
        setIsSaving(true);
        setSaveError(null);
        try {
            await onSave(formData);
            setLastSaved(new Date());
            setSaveError(null);
        } catch (error) {
            console.error('Failed to save:', error);
            const message = error instanceof Error ? error.message : 'Không thể lưu báo giá. Vui lòng thử lại.';
            setSaveError(message);
            // Auto-clear error after 8 seconds
            setTimeout(() => setSaveError(null), 8000);
        } finally {
            setIsSaving(false);
        }
    };

    const handleVoiceApply = (data: any) => {
        setFormData((prev) => {
            const next = { ...prev };
            if (data.projectName) next.projectName = data.projectName;
            if (data.location) next.location = data.location;
            if (data.projectNotes) next.projectNotes = data.projectNotes;
            
            if (data.items && Array.isArray(data.items) && data.items.length > 0) {
                // Keep group headers
                const groupHeaders = prev.lines.filter(l => l.isGroupHeader);
                const pricingHeader = groupHeaders.find(h => h.section === 'B – BÁO GIÁ');
                
                const newLines = data.items.map((item: any, idx: number) => ({
                    section: 'B – BÁO GIÁ',
                    itemNo: `${idx + 1}`,
                    title: item.title || 'Hạng mục mới',
                    qty: item.qty || 1,
                    unit: item.unit || 'm²',
                    unitPrice: 0,
                    priceType: (item.unit === 'm²' ? 'area' : 'fixed') as 'fixed' | 'area' | 'none',
                    order: (pricingHeader?.order ?? 1) + idx + 1,
                    isGroupHeader: false,
                    isChargeable: true,
                }));

                next.lines = [...groupHeaders, ...newLines];
            }
            
            return next;
        });
    };

    const validateStep = (step: WizardStep): boolean => {
        if (step === 4) {
            // Bước 4 dùng để xem trước & xác nhận, không chặn chuyển bước
            return true;
        }

        let parsed:
            | ReturnType<typeof step1Schema.safeParse>
            | ReturnType<typeof step2Schema.safeParse>
            | ReturnType<typeof step3Schema.safeParse>;

        if (step === 1) {
            parsed = step1Schema.safeParse({
                date: formData.date,
                location: formData.location,
                customerId: formData.customerId,
                projectId: formData.projectId,
                projectName: formData.projectName,
                title: formData.title,
            });
        } else if (step === 2) {
            parsed = step2Schema.safeParse({
                deliverablesText: formData.deliverablesText,
                lines: formData.lines.map((line) => ({
                    title: line.title,
                    isChargeable: line.isChargeable,
                })),
            });
        } else {
            // step === 3
            parsed = step3Schema.safeParse({
                paymentMilestones: formData.paymentMilestones,
            });
        }

        if (parsed.success) {
            setStepErrors((prev) => ({ ...prev, [step]: [] }));
            setCompletedSteps((prev) => ({ ...prev, [step]: true }));
            return true;
        }

        const messages = parsed.error.issues.map((issue) => issue.message);
        setStepErrors((prev) => ({ ...prev, [step]: messages }));
        setCompletedSteps((prev) => {
            const next = { ...prev };
            delete next[step];
            return next;
        });
        return false;
    };

    const handleStepClick = (step: WizardStep) => {
        if (step > activeStep) {
            const ok = validateStep(activeStep);
            if (!ok) return;
        }

        setActiveStep(step);
        if (step === 4) {
            setActiveTab('preview');
            return;
        }

        setActiveTab('data');

        // Stepper currently shares the same "Data" screen for B1–B3.
        // Improve UX by scrolling to the corresponding section.
        const targetId = step === 1 ? 'quotation-step-1' : step === 2 ? 'quotation-step-2' : 'quotation-step-3';
        requestAnimationFrame(() => {
            const el = document.getElementById(targetId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    const handleDuplicate = async () => {
        if (!id) return;
        try {
            const res = await fetch(`/api/quotations/${id}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await res.json();

            if (!res.ok || !result.success || !result.data?.id) {
                throw new Error(result.error || 'Không thể nhân bản báo giá');
            }

            router.push(`/quotations/${result.data.id}/edit`);
        } catch (error) {
            console.error('Failed to duplicate quotation:', error);
            // Có thể nâng cấp dùng toast sau
            alert('Không thể nhân bản báo giá. Vui lòng thử lại.');
        }
    };

    const handleStatusChange = async (nextStatus: QuotationFormData['status']) => {
        setStatusError(null);
        const prevStatus = formData.status;

        // Nếu đang tạo báo giá mới hoặc chưa có id, chỉ cập nhật local state
        if (isNew || !id) {
            setFormData((prev) => ({
                ...prev,
                status: nextStatus,
            }));
            return;
        }

        setIsUpdatingStatus(true);
        try {
            const res = await fetch(`/api/quotations/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: nextStatus }),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.error || 'Không thể cập nhật trạng thái báo giá');
            }

            setFormData((prev) => ({
                ...prev,
                status: result.data?.status ?? nextStatus,
            }));
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Không thể cập nhật trạng thái báo giá';
            setStatusError(message);
            // Revert lại trạng thái cũ nếu API không chấp nhận
            setFormData((prev) => ({
                ...prev,
                status: prevStatus,
            }));
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    return (
        <QuotationDataProvider>
            <div className="h-full flex flex-col bg-gray-50">
            {isLoadingExisting ? (
                <div className="px-6 pt-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-gray-600">
                        Đang tải dữ liệu báo giá...
                    </div>
                </div>
            ) : loadError ? (
                <div className="px-6 pt-6">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                        Không thể tải dữ liệu báo giá: {loadError}. Vui lòng refresh trang hoặc thử lại.
                    </div>
                </div>
            ) : null}
            {/* Compact Header Panel - Tối ưu không gian dọc */}
            <div className="bg-white rounded-lg shadow mb-2 mx-4 mt-2 overflow-hidden border-t-4 border-zf-accent technical-grid-hover">
                {/* Top Row: ZFENIX + Tabs + Status + Actions - Compact */}
                <div className="px-3 py-2 flex flex-wrap items-center gap-2 border-b border-gray-200">
                    {/* Left: ZFENIX Brand */}
                    <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                        <h1 className="text-base font-bold text-zf-primary whitespace-nowrap">ZFENIX</h1>
                        {quotationNo ? (
                            <span className="technical-code text-zf-graphite whitespace-nowrap">
                                {quotationNo}
                            </span>
                        ) : null}
                    </div>

                    {/* Center: Tab Buttons - Compact */}
                    <div className="flex gap-1 flex-1 justify-center min-w-[240px]">
                        <button
                            onClick={() => {
                                const startTime = performance.now();
                                setActiveTab('data');
                                const endTime = performance.now();
                                setTabSwitchTime(Math.round(endTime - startTime));
                                setCacheStatus('cached');
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                                activeTab === 'data'
                                    ? 'bg-zf-accent text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path>
                                <path d="M18 2h-3a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path>
                                <path d="M6 2H3a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path>
                            </svg>
                            Data
                        </button>
                        <button
                            onClick={() => {
                                const startTime = performance.now();
                                setActiveTab('preview');
                                const endTime = performance.now();
                                setTabSwitchTime(Math.round(endTime - startTime));
                                setCacheStatus('cached');
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                                activeTab === 'preview'
                                    ? 'bg-zf-primary text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            Preview
                        </button>
                        <button
                            onClick={() => {
                                const startTime = performance.now();
                                setActiveTab('catalog');
                                const endTime = performance.now();
                                setTabSwitchTime(Math.round(endTime - startTime));
                                setCacheStatus('cached');
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                                activeTab === 'catalog'
                                    ? 'bg-zf-accent text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            Master Data
                        </button>
                    </div>

                    {/* Right: Voice trigger + Status + Quick Actions (cùng dòng với tabs) */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        {/* Voice Input - nút nhỏ mở modal */}
                        <button
                            type="button"
                            onClick={() => setIsVoiceModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-xs text-gray-700 hover:bg-gray-100 hover:border-zf-accent transition-colors"
                        >
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zf-accent text-white">
                                <Mic className="w-3 h-3" />
                            </span>
                            <span className="truncate max-w-[110px]">Nhập bằng giọng nói</span>
                        </button>

                        <label
                            htmlFor="quotation-status-select"
                            className="text-xs font-medium text-zf-graphite/70 whitespace-nowrap"
                        >
                            Trạng thái:
                        </label>
                        <div className="flex items-center gap-2">
                            <TechnicalBadge
                                status={formData.status}
                                timestamp={lastSaved ? lastSaved.toISOString() : undefined}
                                info={statusError || undefined}
                            />
                            <select
                                id="quotation-status-select"
                                aria-label="Trạng thái báo giá"
                                value={formData.status}
                                onChange={(e) =>
                                    void handleStatusChange(e.target.value as QuotationFormData['status'])
                                }
                                disabled={isUpdatingStatus}
                                className="px-2 py-1 rounded-md border border-zf-graphite/15 bg-white text-xs text-zf-graphite focus:outline-none focus:ring-2 focus:ring-zf-accent min-w-[120px] font-technical"
                            >
                                <option value="DRAFT">Draft</option>
                                <option value="SENT">Sent</option>
                                <option value="ACCEPTED">Accepted</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                        {isUpdatingStatus && (
                            <span className="text-xs text-zf-graphite/70 whitespace-nowrap font-technical">Updating...</span>
                        )}
                        {statusError && <p className="text-xs text-zf-error whitespace-nowrap">{statusError}</p>}

                        {lastSaved && (
                            <span className="text-xs text-technical-secondary whitespace-nowrap font-technical">
                                Đã lưu {lastSaved.toLocaleTimeString('vi-VN')}
                            </span>
                        )}

                        {/* Technical Metrics Display */}
                        <TechnicalMetrics
                            tabSwitchTime={tabSwitchTime}
                            cacheStatus={cacheStatus}
                            dataFreshness={lastSaved ? `Updated ${Math.round((Date.now() - lastSaved.getTime()) / 1000)}s ago` : undefined}
                            className="hidden sm:flex"
                        />

                        {!isNew && id && (
                            <a
                                href={`/quotations/${id}/versions`}
                                className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap"
                            >
                                🕒 Lịch sử
                            </a>
                        )}

                        {!isNew && id && (
                            <button
                                type="button"
                                onClick={() => void handleDuplicate()}
                                className="px-2 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors text-xs font-medium whitespace-nowrap"
                            >
                                Nhân bản
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => void router.push('/quotations')}
                            className="px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-xs font-medium whitespace-nowrap"
                        >
                            Quay lại
                        </button>

                        {!isNew && id && onExportDocx && (
                            <button
                                type="button"
                                onClick={() => void onExportDocx()}
                                className="px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-xs font-medium whitespace-nowrap"
                            >
                                📥 DOCX
                            </button>
                        )}

                        {!isNew && (
                            <button
                                type="button"
                                onClick={() => void handleSaveAsTemplate()}
                                className="px-2 py-1 border border-emerald-600 text-emerald-700 rounded hover:bg-emerald-50 transition-colors text-xs font-medium whitespace-nowrap"
                            >
                                Lưu thành mẫu
                            </button>
                        )}

                        {isNew && (
                            <button
                                type="button"
                                onClick={() => void handleApplyTemplate()}
                                disabled={isApplyingTemplate}
                                className="px-2 py-1 border border-purple-600 text-purple-700 rounded hover:bg-purple-50 disabled:opacity-50 transition-colors text-xs font-medium whitespace-nowrap"
                            >
                                {isApplyingTemplate ? 'Đang áp dụng mẫu...' : 'Chọn mẫu báo giá'}
                            </button>
                        )}

                        <button
                            onClick={() => handleSave(false)}
                            disabled={isSaving}
                            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors text-xs font-medium whitespace-nowrap"
                        >
                            {isSaving ? '💾 Đang lưu...' : '💾 Lưu'}
                        </button>

                        {!isNew && id && (
                            <button
                                type="button"
                                onClick={handleExportPdf}
                                className="px-2 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors text-xs font-medium whitespace-nowrap"
                            >
                                PDF 📄
                            </button>
                        )}
                    </div>
                </div>

                {/* Save Error Messages */}
                {saveError && (
                    <div className="border-t border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 flex items-center justify-between">
                        <div>
                            <p className="font-semibold">❌ Lưu báo giá thất bại:</p>
                            <p>{saveError}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSaveError(null)}
                            className="ml-2 px-2 py-1 text-red-600 hover:bg-red-100 rounded text-xs"
                        >
                            Đóng
                        </button>
                    </div>
                )}

                {/* Step Validation Error Messages - Compact */}
                {stepErrors[activeStep] && stepErrors[activeStep]!.length > 0 && (
                    <div className="border-t border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        <p className="font-semibold mb-1">Vui lòng kiểm tra lại thông tin ở bước hiện tại:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            {stepErrors[activeStep]!.map((msg, idx) => (
                                <li key={idx}>{msg}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Tab Content - Keep-Alive: All tabs mounted, use display to show/hide */}
            <div className="flex-1 overflow-y-auto relative">
                {/* Data Tab - Keep mounted */}
                <div 
                    key="data-tab"
                    style={{ display: activeTab === 'data' ? 'block' : 'none' }}
                    className="h-full"
                >
                    <DataTab
                        data={formData}
                        onChange={setFormData}
                        lockProject={Boolean(projectContext) && isNew}
                    />
                </div>
                
                {/* Preview Tab - Keep mounted */}
                <div 
                    key="preview-tab"
                    style={{ display: activeTab === 'preview' ? 'block' : 'none' }}
                    className="h-full"
                >
                    <PreviewTab 
                        data={formData}
                        quotationId={id}
                        quotationNo={quotationNo}
                        onDataChange={async (field, value) => {
                            setFormData((prev) => ({ ...prev, [field]: value }));
                            // Auto-save after inline edit
                            if (!isNew && id) {
                                await handleSave(true);
                            }
                        }}
                    />
                </div>
                
                {/* Catalog Tab - Keep mounted */}
                <div 
                    key="catalog-tab"
                    style={{ display: activeTab === 'catalog' ? 'block' : 'none' }}
                    className="h-full"
                >
                    <CatalogTab />
                </div>
            </div>

            {/* Voice Input Modal */}
            <VoiceInputModal
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onApply={(data: any) => handleVoiceApply(data)}
            />

            {/* AI Assistant Chatbot */}
            <AIAssistant
                quotationContext={{
                    customerName: formData.customerId ? 'Customer' : undefined,
                    projectName: formData.projectName || undefined,
                    totalArea: formData.totalArea,
                    lineItems: formData.lines.filter(l => l.isChargeable).map(l => ({
                        title: l.title,
                        unit: l.unit,
                        unitPrice: l.unitPrice,
                    })),
                }}
            />
            </div>

            {/* Template Picker Modal */}
            <TemplatePickerModal
                isOpen={showTemplatePickerModal}
                onClose={() => setShowTemplatePickerModal(false)}
                onApply={doApplyTemplate}
            />

            {/* Save Template Modal */}
            <SaveTemplateModal
                isOpen={showSaveTemplateModal}
                onClose={() => setShowSaveTemplateModal(false)}
                onSave={doSaveAsTemplate}
                defaultName={formData.title}
            />
        </QuotationDataProvider>
    );
}
