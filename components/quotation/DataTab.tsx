'use client';

import { useEffect, useState } from 'react';
import type { QuotationFormData, OutsourcingStaff } from '@/types/quotation';
import { useQuotationData, type Customer, type Project, type CatalogItem } from '@/lib/contexts/QuotationDataContext';
import PricingTable from './PricingTable';
import PaymentMilestones from './PaymentMilestones';
import ProjectSelector from './ProjectSelector';
import { calculateQuotationTotals, enrichQuotationLinesWithProjectContext } from '@/lib/utils';

// Types are now imported from QuotationDataContext

type DataTabProps = {
    data: QuotationFormData;
    onChange: (data: QuotationFormData | ((prev: QuotationFormData) => QuotationFormData)) => void;
    lockProject?: boolean;
};

type AiChatRole = 'user' | 'assistant';

type AiChatMessage = {
    role: AiChatRole;
    content: string;
};

type AiChatResponse =
    | { success: true; data: { message: string } }
    | { success: false; error: string };

const numberFormatter = new Intl.NumberFormat('vi-VN');

const parseDeliverablesText = (raw?: string | null): string[] => {
    if (!raw) return [];

    let normalized = raw;

    normalized = normalized
        .replaceAll('<br />', '\n')
        .replaceAll('<br/>', '\n')
        .replaceAll('<br>', '\n');

    normalized = normalized.replaceAll('</li>', '\n').replaceAll('<li>', '');

    return normalized
        .split('\n')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
};

const buildDeliverablesHtml = (items: string[]): string => items.map((i) => `<li>${i}</li>`).join('');

export default function DataTab({ data, onChange, lockProject = false }: DataTabProps) {
    // Use data from context instead of local state
    const {
        customers,
        projects,
        outsourceStaff: outsourceStaffList,
        isLoadingCustomers,
        isLoadingProjects,
        isLoadingOutsourceStaff,
    } = useQuotationData();

    const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
    const [isLoadingDeliverablesCatalog, setIsLoadingDeliverablesCatalog] = useState(false);

    const [aiLoadingScope, setAiLoadingScope] = useState(false);
    const [aiLoadingDeliverables, setAiLoadingDeliverables] = useState(false);
    const [aiLoadingSchedule, setAiLoadingSchedule] = useState(false);

    const [activeSectionId, setActiveSectionId] = useState<string>('quotation-step-1');

    useEffect(() => {
        const fetchDeliverablesCatalog = async () => {
            setIsLoadingDeliverablesCatalog(true);
            try {
                const res = await fetch('/api/catalog?category=DELIVERABLES', {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' },
                });

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const result = await res.json();
                if (result.success && Array.isArray(result.data)) {
                    const items: CatalogItem[] = result.data
                        .filter((item: CatalogItem) => item.category === 'DELIVERABLES')
                        .sort((a: CatalogItem, b: CatalogItem) => a.order - b.order);
                    // Lưu để dùng sau nếu cần (hiện tại chưa render trực tiếp)
                    setIsLoadingDeliverablesCatalog(false);
                    setIsLoadingCatalog(false);
                    void items;
                }
            } catch (err) {
                console.error('Failed to fetch deliverables catalog:', err);
            } finally {
                setIsLoadingDeliverablesCatalog(false);
            }
        };

        void fetchDeliverablesCatalog();
    }, []);

    // Đồng bộ từ Project master data khi đã chọn projectId
    useEffect(() => {
        if (isLoadingProjects || !data.projectId) return;

        const selected = projects.find((p) => p.id === data.projectId);
        if (!selected) return;

        const next: QuotationFormData = {
            ...data,
            projectName: selected.name,
            customerId: selected.customerId ?? data.customerId,
            totalArea: selected.totalArea ?? undefined,
            location: (selected.location ?? undefined) || data.location,
            projectItem: (selected.description ?? undefined) || data.projectItem,
            projectNotes: (selected.notes ?? undefined) || data.projectNotes,
            lines: enrichQuotationLinesWithProjectContext(data.lines, {
                projectName: selected.name,
                projectItem: (selected.description ?? undefined) || data.projectItem,
                totalArea: selected.totalArea ?? undefined,
            }),
        };

        if (JSON.stringify(next) !== JSON.stringify(data)) {
            onChange(next);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingProjects, projects, data.projectId]);

    const updateField = <K extends keyof QuotationFormData>(field: K, value: QuotationFormData[K]) => {
        // Use functional update to avoid race conditions when multiple fields are updated synchronously
        onChange((prev: QuotationFormData) => ({ ...prev, [field]: value }) as any);
    };

    const updateFields = (updates: Partial<QuotationFormData>) => {
        onChange((prev: QuotationFormData) => ({ ...prev, ...updates }) as any);
    };

    const formatCurrency = (amount: number) => numberFormatter.format(Math.round(amount));

    const { totalBeforeVat, vatAmount, totalAfterVat } = calculateQuotationTotals(
        data.lines,
        data.vatRate,
        data.totalArea || 0,
    );

    // Helper function to remove project-related information from imported text
    const removeProjectInfoFromText = (text: string): string => {
        if (!text) return text;

        // Get project info to filter out
        const projectName = data.projectName || '';
        const customerName = customers.find(c => c.id === data.customerId)?.name || '';
        const location = data.location || '';
        const totalArea = data.totalArea ? `${data.totalArea} m²` : '';
        const projectItem = data.projectItem || '';

        let cleaned = text;

        // Remove project name mentions (case insensitive, whole word or partial)
        if (projectName) {
            const projectNameRegex = new RegExp(projectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            cleaned = cleaned.replace(projectNameRegex, '').trim();
        }

        // Remove customer name mentions
        if (customerName) {
            const customerRegex = new RegExp(customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            cleaned = cleaned.replace(customerRegex, '').trim();
        }

        // Remove location mentions (only if it's a specific location, not generic words)
        if (location && location.length > 2) {
            const locationRegex = new RegExp(`\\b${location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            cleaned = cleaned.replace(locationRegex, '').trim();
        }

        // Remove area mentions (e.g., "87750 m²", "87750m²")
        if (totalArea) {
            const areaRegex = new RegExp(`\\b${data.totalArea}\\s*m²?\\b`, 'gi');
            cleaned = cleaned.replace(areaRegex, '').trim();
        }

        // Remove project item/hạng mục mentions
        if (projectItem) {
            const itemRegex = new RegExp(projectItem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            cleaned = cleaned.replace(itemRegex, '').trim();
        }

        // Clean up multiple spaces, empty lines
        cleaned = cleaned
            .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
            .replace(/[ \t]{2,}/g, ' ') // Multiple spaces to single space
            .trim();

        return cleaned;
    };

    const importScopeFromCatalog = async () => {
        setIsLoadingCatalog(true);
        try {
            const res = await fetch('/api/catalog?category=SCOPE', {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const result = await res.json();
            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                const scopeItems = (result.data as CatalogItem[]).sort(
                    (a: CatalogItem, b: CatalogItem) => a.order - b.order,
                );

                // Remove project info from each item before joining
                const scopeText = scopeItems
                    .map((item) => {
                        const title = removeProjectInfoFromText(item.title);
                        const description = item.description ? removeProjectInfoFromText(item.description) : '';
                        return title + (description ? `\n${description}` : '');
                    })
                    .filter(item => item.trim().length > 0) // Remove empty items
                    .join('\n\n');

                updateField('scopeText', scopeText);
            } else {
                // eslint-disable-next-line no-alert
                alert('Không có dữ liệu để import. Vui lòng thêm dữ liệu vào Master Data trước.');
            }
        } catch (err: unknown) {
            console.error('Failed to fetch catalog:', err);
            // eslint-disable-next-line no-alert
            alert(
                `Lỗi khi import dữ liệu: ${err instanceof Error ? err.message : 'Không thể kết nối đến server'
                }`,
            );
        } finally {
            setIsLoadingCatalog(false);
        }
    };

    const callAiForSuggestion = async (messages: AiChatMessage[]): Promise<string> => {
        const trimmedMessages = messages
            .map((m) => ({
                role: m.role,
                content: m.content.trim(),
            }))
            .filter((m) => m.content.length > 0);

        if (!trimmedMessages.length) {
            throw new Error('Không có nội dung để gửi tới AI.');
        }

        const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: trimmedMessages }),
        });

        const json = (await res.json()) as AiChatResponse;

        if (!res.ok || !json.success) {
            const msg = !json.success ? json.error : 'Gọi AI thất bại';
            throw new Error(msg);
        }

        const content = json.data.message?.trim();
        if (!content) {
            throw new Error('AI không trả về nội dung.');
        }

        return content;
    };

    const handleSuggestScope = async () => {
        if (aiLoadingScope) return;
        setAiLoadingScope(true);
        try {
            const promptLines: string[] = [];
            promptLines.push('Hãy đóng vai chuyên gia BIM và viết lại nội dung PHẠM VI CÔNG VIỆC cho báo giá dưới đây.');
            promptLines.push('Yêu cầu:');
            promptLines.push('- Viết bằng tiếng Việt, giọng chuyên nghiệp, dễ hiểu.');
            promptLines.push('- Trình bày dạng đoạn văn/liệt kê có đánh số hợp lý.');
            promptLines.push('- Nội dung cần bám sát thông tin dự án bên dưới (tên dự án, hạng mục, diện tích nếu có).');
            promptLines.push('- Không thêm phần chào hỏi hay phần kết, chỉ trả về nội dung phạm vi công việc.');
            promptLines.push('---');
            promptLines.push(`Tên dự án: ${data.projectName || '(chưa có)'}`);
            if (data.projectItem) promptLines.push(`Hạng mục: ${data.projectItem}`);
            if (typeof data.totalArea === 'number') promptLines.push(`Diện tích: ${data.totalArea} m²`);
            if (data.scopeText) {
                promptLines.push('Nội dung hiện tại (tham khảo, có thể viết lại tốt hơn):');
                promptLines.push(data.scopeText);
            }

            const aiText = await callAiForSuggestion([
                {
                    role: 'user',
                    content: promptLines.join('\n'),
                },
            ]);

            updateField('scopeText', aiText);
        } catch (error: unknown) {
            // eslint-disable-next-line no-alert
            alert(
                `Lỗi khi gọi AI gợi ý phạm vi công việc: ${error instanceof Error ? error.message : 'Không thể kết nối máy chủ AI'
                }`,
            );
        } finally {
            setAiLoadingScope(false);
        }
    };

    const handleSuggestDeliverables = async () => {
        if (aiLoadingDeliverables) return;
        setAiLoadingDeliverables(true);
        try {
            const promptLines: string[] = [];
            promptLines.push('Hãy đề xuất danh sách SẢN PHẨM BÀN GIAO cho báo giá dịch vụ BIM dưới đây.');
            promptLines.push('Yêu cầu:');
            promptLines.push('- Viết bằng tiếng Việt, giọng chuyên nghiệp.');
            promptLines.push('- Mỗi sản phẩm là một gạch đầu dòng.');
            promptLines.push('- Chỉ trả về HTML dạng danh sách `<li>...</li>` (không bao bọc `<ul>`, không thêm giải thích).');
            promptLines.push('- Sản phẩm cần phù hợp với thông tin dự án, hạng mục và phạm vi công việc (nếu có).');
            promptLines.push('---');
            promptLines.push(`Tên dự án: ${data.projectName || '(chưa có)'}`);
            if (data.projectItem) promptLines.push(`Hạng mục: ${data.projectItem}`);
            if (typeof data.totalArea === 'number') promptLines.push(`Diện tích: ${data.totalArea} m²`);
            if (data.scopeText) {
                promptLines.push('Phạm vi công việc (tham khảo):');
                promptLines.push(data.scopeText);
            }

            const aiText = await callAiForSuggestion([
                {
                    role: 'user',
                    content: promptLines.join('\n'),
                },
            ]);

            updateField('deliverablesText', aiText);
        } catch (error: unknown) {
            // eslint-disable-next-line no-alert
            alert(
                `Lỗi khi gọi AI gợi ý sản phẩm bàn giao: ${error instanceof Error ? error.message : 'Không thể kết nối máy chủ AI'
                }`,
            );
        } finally {
            setAiLoadingDeliverables(false);
        }
    };

    const handleSuggestSchedule = async () => {
        if (aiLoadingSchedule) return;
        setAiLoadingSchedule(true);
        try {
            const promptLines: string[] = [];
            promptLines.push('Hãy gợi ý nội dung THỜI GIAN TRIỂN KHAI cho báo giá dịch vụ BIM dưới đây.');
            promptLines.push('Yêu cầu:');
            promptLines.push('- Viết 1–3 câu tiếng Việt, giọng chuyên nghiệp.');
            promptLines.push(
                '- Nội dung nêu rõ tổng thời gian (số ngày/tuần), mốc chính và điều kiện tính từ khi nhận đủ hồ sơ/đặt cọc.',
            );
            promptLines.push('- Chỉ trả về câu mô tả, không thêm tiêu đề hay giải thích.');
            promptLines.push('---');
            promptLines.push(`Tên dự án: ${data.projectName || '(chưa có)'}`);
            if (data.projectItem) promptLines.push(`Hạng mục: ${data.projectItem}`);
            if (typeof data.totalArea === 'number') promptLines.push(`Diện tích: ${data.totalArea} m²`);
            if (data.scheduleText) {
                promptLines.push('Nội dung hiện tại (tham khảo):');
                promptLines.push(data.scheduleText);
            }

            const aiText = await callAiForSuggestion([
                {
                    role: 'user',
                    content: promptLines.join('\n'),
                },
            ]);

            updateField('scheduleText', aiText);
        } catch (error: unknown) {
            // eslint-disable-next-line no-alert
            alert(
                `Lỗi khi gọi AI gợi ý tiến độ thực hiện: ${error instanceof Error ? error.message : 'Không thể kết nối máy chủ AI'
                }`,
            );
        } finally {
            setAiLoadingSchedule(false);
        }
    };

    const importDeliverablesFromCatalog = async () => {
        setIsLoadingCatalog(true);
        try {
            const res = await fetch('/api/catalog?category=DELIVERABLES', {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const result = await res.json();
            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                const deliverablesItems = (result.data as CatalogItem[]).sort(
                    (a: CatalogItem, b: CatalogItem) => a.order - b.order,
                );
                // Remove project info from each item title before building list
                const deliverablesList = deliverablesItems
                    .map((item) => removeProjectInfoFromText(item.title))
                    .filter(title => title.trim().length > 0); // Remove empty items
                updateField('deliverablesText', buildDeliverablesHtml(deliverablesList));
            } else {
                // eslint-disable-next-line no-alert
                alert('Không có dữ liệu để import. Vui lòng thêm dữ liệu vào Master Data trước.');
            }
        } catch (err: unknown) {
            console.error('Failed to fetch catalog:', err);
            // eslint-disable-next-line no-alert
            alert(
                `Lỗi khi import dữ liệu: ${err instanceof Error ? err.message : 'Không thể kết nối đến server'
                }`,
            );
        } finally {
            setIsLoadingCatalog(false);
        }
    };

    const handleProjectChange = (projectId: string) => {
        const selected = projects.find((p) => p.id === projectId);
        if (!selected) {
            onChange({
                ...data,
                projectId: '',
            });
            return;
        }

        const enrichedLines = enrichQuotationLinesWithProjectContext(data.lines, {
            projectName: selected.name,
            projectItem: (selected.description ?? undefined) || data.projectItem,
            totalArea: selected.totalArea ?? undefined,
        });

        onChange({
            ...data,
            projectId: selected.id,
            projectName: selected.name,
            totalArea: selected.totalArea ?? undefined,
            customerId: selected.customerId ?? data.customerId,
            location: (selected.location ?? undefined) || data.location,
            projectItem: (selected.description ?? undefined) || data.projectItem,
            projectNotes: (selected.notes ?? undefined) || data.projectNotes,
            lines: enrichedLines,
        });
    };

    const scrollToSection = (sectionId: string) => {
        setActiveSectionId(sectionId);
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="h-full bg-gray-50 relative">
            <div className="max-w-7xl mx-auto p-6 space-y-4">
                <div className="space-y-4">
                    {/* ========== THÔNG TIN DỰ ÁN ========== */}
                    <section id="quotation-step-1" className="bg-white rounded-lg shadow p-6 scroll-mt-24">
                        <h2 className="text-xl font-semibold mb-4 text-zf-primary">I. Thông tin Dự án</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <ProjectSelector
                                    value={data.projectId}
                                    onChange={(projectId) => handleProjectChange(projectId)}
                                    disabled={lockProject}
                                    isLoading={isLoadingProjects}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên dự án</label>
                                <input
                                    type="text"
                                    value={data.projectName}
                                    onChange={(e) => updateField('projectName', e.target.value)}
                                    className="w-full px-3 py-2 border rounded bg-gray-50"
                                    placeholder="Chung cư 29-4 Hải Phòng"
                                    readOnly={lockProject || !!data.projectId}
                                    disabled={lockProject || !!data.projectId}
                                />
                                {data.projectId && (
                                    <p className="text-xs text-gray-500 mt-1">Tự động lấy từ thông tin dự án</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Khách hàng</label>
                                <select
                                    value={data.customerId}
                                    onChange={(e) => updateField('customerId', e.target.value)}
                                    className="w-full px-3 py-2 border rounded bg-gray-50"
                                    disabled={isLoadingCustomers || lockProject || !!data.projectId}
                                >
                                    <option value="">{isLoadingCustomers ? 'Đang tải...' : 'Chọn khách hàng...'}</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                                {data.projectId && (
                                    <p className="text-xs text-gray-500 mt-1">Tự động lấy từ thông tin dự án</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Diện tích (m²)</label>
                                <input
                                    type="number"
                                    value={data.totalArea || ''}
                                    onChange={(e) =>
                                        updateField('totalArea', e.target.value ? parseFloat(e.target.value) : undefined)
                                    }
                                    className="w-full px-3 py-2 border rounded bg-gray-50"
                                    placeholder="87750"
                                    readOnly={lockProject || !!data.projectId}
                                    disabled={lockProject || !!data.projectId}
                                />
                                {data.projectId && (
                                    <p className="text-xs text-gray-500 mt-1">Tự động lấy từ thông tin dự án</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Địa điểm</label>
                                <input
                                    type="text"
                                    value={data.location || ''}
                                    onChange={(e) => updateField('location', e.target.value)}
                                    className="w-full px-3 py-2 border rounded bg-gray-50"
                                    placeholder="Hà Nội"
                                    readOnly={lockProject || !!data.projectId}
                                    disabled={lockProject || !!data.projectId}
                                />
                                {data.projectId && (
                                    <p className="text-xs text-gray-500 mt-1">Tự động lấy từ thông tin dự án</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Hạng mục</label>
                                <input
                                    type="text"
                                    value={data.projectItem || ''}
                                    onChange={(e) => updateField('projectItem', e.target.value)}
                                    className="w-full px-3 py-2 border rounded bg-gray-50"
                                    placeholder="VD: TKKT + Clash + Shop"
                                    readOnly={lockProject || !!data.projectId}
                                    disabled={lockProject || !!data.projectId}
                                />
                                {data.projectId && (
                                    <p className="text-xs text-gray-500 mt-1">Tự động lấy từ mô tả dự án</p>
                                )}
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Ghi chú dự án</label>
                                <textarea
                                    value={data.projectNotes || ''}
                                    onChange={(e) => updateField('projectNotes', e.target.value)}
                                    className="w-full px-3 py-2 border rounded min-h-[80px] text-sm bg-gray-50"
                                    placeholder="Ghi chú thêm..."
                                    readOnly={lockProject || !!data.projectId}
                                    disabled={lockProject || !!data.projectId}
                                />
                                {data.projectId && (
                                    <p className="text-xs text-gray-500 mt-1">Tự động lấy từ ghi chú dự án</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">VAT (%)</label>
                                <input
                                    type="number"
                                    value={(data.vatRate || 0) * 100 || ''}
                                    onChange={(e) =>
                                        updateField(
                                            'vatRate',
                                            e.target.value ? parseFloat(e.target.value) / 100 : 0,
                                        )
                                    }
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="8"
                                />
                            </div>
                        </div>
                    </section>

                    {/* ========== PHẠM VI CÔNG VIỆC ========== */}
                    <section id="quotation-step-2" className="bg-white rounded-lg shadow p-6 scroll-mt-24">
                        <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
                            <h2 className="text-xl font-semibold text-zf-primary">II. Phạm vi Công việc</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSuggestScope}
                                    disabled={isLoadingCatalog || aiLoadingScope}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                                >
                                    <span className="text-lg">✨</span>
                                    {aiLoadingScope ? 'AI đang gợi ý...' : 'Gợi ý bằng AI'}
                                </button>
                                <button
                                    type="button"
                                    onClick={importScopeFromCatalog}
                                    disabled={isLoadingCatalog}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50 transition-colors"
                                >
                                    <span className="text-lg">📚</span>
                                    {isLoadingCatalog ? 'Đang tải...' : 'Import từ Master Data'}
                                </button>
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">Nội dung phạm vi công việc</label>
                            <textarea
                                value={data.scopeText || ''}
                                onChange={(e) => updateField('scopeText', e.target.value)}
                                className="w-full px-3 py-2 border rounded min-h-[300px] text-sm"
                                placeholder="Nhập nội dung phạm vi công việc..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Mô tả chi tiết các dịch vụ BIM được cung cấp trong các giai đoạn của dự án
                            </p>
                        </div>
                    </section>

                    {/* ========== SẢN PHẨM BÀN GIAO ========== */}
                    <section id="quotation-deliverables" className="bg-white rounded-lg shadow p-6 scroll-mt-24">
                        <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
                            <h2 className="text-xl font-semibold text-zf-primary">III. Sản phẩm Bàn giao</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSuggestDeliverables}
                                    disabled={isLoadingCatalog || aiLoadingDeliverables}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                                >
                                    <span className="text-lg">✨</span>
                                    {aiLoadingDeliverables ? 'AI đang gợi ý...' : 'Gợi ý bằng AI'}
                                </button>
                                <button
                                    type="button"
                                    onClick={importDeliverablesFromCatalog}
                                    disabled={isLoadingCatalog}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50 transition-colors"
                                >
                                    <span className="text-lg">📚</span>
                                    {isLoadingDeliverablesCatalog ? 'Đang tải...' : 'Import từ Master Data'}
                                </button>
                            </div>
                        </div>

                        {(() => {
                            const deliverablesList = parseDeliverablesText(data.deliverablesText);

                            return (
                                <>
                                    {deliverablesList.map((item, idx) => (
                                        <div key={idx} className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => {
                                                    const newList = [...deliverablesList];
                                                    newList[idx] = e.target.value;
                                                    updateField('deliverablesText', buildDeliverablesHtml(newList));
                                                }}
                                                className="flex-1 px-3 py-2 border rounded text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newList = deliverablesList.filter((_, i) => i !== idx);
                                                    updateField('deliverablesText', buildDeliverablesHtml(newList));
                                                }}
                                                className="px-3 py-2 bg-red-500 text-white rounded"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentList = parseDeliverablesText(data.deliverablesText);
                                            const nextList = [...currentList, 'Sản phẩm mới'];
                                            updateField('deliverablesText', buildDeliverablesHtml(nextList));
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-zf-accent hover:underline underline-offset-4"
                                    >
                                        + Thêm sản phẩm
                                    </button>
                                </>
                            );
                        })()}
                    </section>

                    {/* ========== CHI TIẾT ĐƠN GIÁ ========== */}
                    <section id="quotation-pricing" className="bg-white rounded-lg shadow p-6 scroll-mt-24">
                        <h2 className="text-xl font-semibold mb-4 text-zf-primary">IV. Chi tiết Đơn giá</h2>
                        <PricingTable
                            lines={data.lines}
                            onChange={(lines) => updateField('lines', lines)}
                            vatRate={data.vatRate}
                            onVatRateChange={(rate) => updateField('vatRate', rate)}
                            profitRate={data.profitRate}
                            onProfitRateChange={(rate) => updateField('profitRate', rate)}
                            outsourceCost={data.outsourceCost}
                            onOutsourceCostChange={(cost) => updateField('outsourceCost', cost)}
                            taxRate={data.taxRate}
                            onTaxRateChange={(rate) => updateField('taxRate', rate)}
                            onTaxCostChange={(cost) => updateField('taxCost', cost)}
                            commissionType={data.commissionType}
                            onCommissionTypeChange={(type) => updateField('commissionType', type)}
                            commissionRate={data.commissionRate}
                            onCommissionRateChange={(rate) => updateField('commissionRate', rate)}
                            commissionCost={data.commissionCost}
                            onCommissionCostChange={(cost) => updateField('commissionCost', cost)}
                            outsourceLines={data.outsourceLines}
                            onOutsourceLinesChange={(lines) => updateField('outsourceLines', lines)}
                            onUpdateFields={updateFields}
                            outsourceStaffList={outsourceStaffList}
                            totalArea={data.totalArea}
                        />
                    </section>

                    {/* ========== TỔNG QUAN ========== */}
                    <section className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 text-zf-primary">V. Tổng quan</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Tổng (chưa VAT):</span>
                                <span className="font-semibold">{formatCurrency(totalBeforeVat)} VNĐ</span>
                            </div>
                            <div className="flex justify-between">
                                <span>VAT ({(data.vatRate * 100).toFixed(0)}%):</span>
                                <span className="font-semibold">{formatCurrency(vatAmount)} VNĐ</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t-2 text-xl font-bold text-zf-primary">
                                <span>TỔNG:</span>
                                <span>{formatCurrency(totalAfterVat)} VNĐ</span>
                            </div>
                        </div>
                    </section>

                    {/* ========== TIẾN ĐỘ THỰC HIỆN ========== */}
                    <section className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
                            <h2 className="text-xl font-semibold text-zf-primary">VI. Tiến độ thực hiện</h2>
                            <button
                                type="button"
                                onClick={handleSuggestSchedule}
                                disabled={aiLoadingSchedule}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                            >
                                <span className="text-lg">✨</span>
                                {aiLoadingSchedule ? 'AI đang gợi ý...' : 'Gợi ý bằng AI'}
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Thời gian triển khai</label>
                            <input
                                type="text"
                                value={data.scheduleText || ''}
                                onChange={(e) => updateField('scheduleText', e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="Thời gian triển khai: ... ngày làm việc kể từ khi nhận đủ hồ sơ"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Ví dụ: &quot;Thời gian triển khai: 30 ngày làm việc kể từ khi nhận đủ hồ sơ&quot;
                            </p>
                        </div>
                    </section>

                    {/* ========== TIẾN ĐỘ THANH TOÁN ========== */}
                    <section id="quotation-step-3" className="bg-white rounded-lg shadow p-6 scroll-mt-24">
                        <h2 className="text-xl font-semibold mb-4 text-zf-primary">VII. Tiến độ thanh toán</h2>
                        <PaymentMilestones
                            milestones={data.paymentMilestones}
                            onChange={(milestones) => updateField('paymentMilestones', milestones)}
                        />
                    </section>

                    {/* ========== CHỮ KÝ VÀ LIÊN HỆ ========== */}
                    <section id="quotation-signature" className="bg-white rounded-lg shadow p-6 scroll-mt-24">
                        <h2 className="text-xl font-semibold mb-4 text-zf-primary">VIII. Chữ ký và liên hệ</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Lời kết</label>
                                <textarea
                                    value={data.introText || ''}
                                    onChange={(e) => updateField('introText', e.target.value)}
                                    className="w-full px-3 py-2 border rounded min-h-[80px] text-sm"
                                    placeholder="Thay mặt đơn vị triển khai xin trân trọng cảm ơn và mong muốn có cơ hội hợp tác với Quý Công ty."
                                />
                            </div>
                            <div className="text-sm text-gray-600 italic">
                                <p>Thông tin công ty sẽ được lấy tự động từ Company Profile</p>
                                <p className="mt-2">
                                    Bao gồm: Tên công ty, Địa chỉ, Mã số thuế, Email, Website, Điện thoại, Người ký,
                                    Chức vụ
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Outline bên phải – đặt giữa vùng nội dung để dễ nhìn hơn */}
            <aside className="hidden xl:block fixed top-1/2 right-8 -translate-y-1/2 transform w-64 z-20">
                <div className="bg-white border border-blue-100 rounded-lg p-3 text-sm shadow-sm">
                    <p className="font-semibold text-zf-primary mb-2">Mục nội dung</p>
                    <nav className="space-y-1">
                        {[
                            { id: 'quotation-step-1', label: 'I. Thông tin Dự án' },
                            { id: 'quotation-step-2', label: 'II. Phạm vi Công việc' },
                            { id: 'quotation-deliverables', label: 'III. Sản phẩm Bàn giao' },
                            { id: 'quotation-pricing', label: 'IV. Chi tiết Đơn giá' },
                            { id: 'quotation-step-3', label: 'VII. Tiến độ thanh toán' },
                            { id: 'quotation-signature', label: 'VIII. Chữ ký & liên hệ' },
                        ].map((item) => {
                            const isActive = activeSectionId === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => scrollToSection(item.id)}
                                    className={`w-full text-left px-2 py-1 rounded transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-700 font-semibold'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </aside>
        </div>
    );
}

