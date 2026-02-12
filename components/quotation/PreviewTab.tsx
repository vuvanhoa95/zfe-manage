'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { QuotationFormData } from '@/types/quotation';
import { formatVND, numberToVietnameseWords } from '@/lib/number-to-words-vn';
import { calculateQuotationTotals, formatVietnameseDate } from '@/lib/utils';
import ExportPdfModal from './ExportPdfModal';
import InlineEditor from './preview/InlineEditor';
import ExportWordButton from './preview/ExportWordButton';
import PreviewModeToggle, { PreviewMode, getPreviewWrapperClass } from './preview/PreviewModeToggle';
import QuickCopyButtons from './preview/QuickCopyButtons';
import ThemePicker from './preview/ThemePicker';
import TemplateSelector from './preview/TemplateSelector';
import MediaUploader from './preview/MediaUploader';
import AIReviewer from './preview/AIReviewer';
import ExportExcelButton from './preview/ExportExcelButton';
import { getThemeColors } from '@/lib/themes/quotation-themes';
import StandardTemplate from '../templates/StandardTemplate';
import MinimalistTemplate from '../templates/MinimalistTemplate';

type PreviewTabProps = {
    data: QuotationFormData;
    quotationId?: string;
    quotationNo?: string;
    onDataChange?: (field: keyof QuotationFormData, value: any) => Promise<void>;
};

type CompanyProfile = {
    name: string;
    taxCode: string;
    address: string;
    email: string;
    website?: string;
    phone: string;
    signerName: string;
    signerTitle: string;
};

type Customer = {
    name: string;
    address?: string;
    taxCode?: string;
};

type AiChatRole = 'user' | 'assistant';

type AiChatMessage = {
    role: AiChatRole;
    content: string;
};

type AiChatResponse =
    | { success: true; data: { message: string } }
    | { success: false; error: string };

// Cache for company profile (rarely changes)
let companyProfileCache: { data: CompanyProfile | null; timestamp: number } | null = null;
const COMPANY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache for customers
const customerCache = new Map<string, { data: Customer | null; timestamp: number }>();
const CUSTOMER_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export default function PreviewTab({ data, quotationId, quotationNo, onDataChange }: PreviewTabProps) {
    const [company, setCompany] = useState<CompanyProfile | null>(companyProfileCache?.data || null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(!companyProfileCache); // Only show loading if no cache
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [summaryText, setSummaryText] = useState('');
    const [emailText, setEmailText] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);
    const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');

    const dateInfo = formatVietnameseDate(data.date);
    const { totalBeforeVat, vatAmount, totalAfterVat } = calculateQuotationTotals(data.lines, data.vatRate, data.totalArea);
    const totalInWords = numberToVietnameseWords(totalAfterVat);

    useEffect(() => {
        const fetchData = async () => {
            // Check cache for company profile
            const now = Date.now();
            if (companyProfileCache && (now - companyProfileCache.timestamp) < COMPANY_CACHE_TTL) {
                setCompany(companyProfileCache.data);
            } else {
                setLoading(true);
                try {
                    const compRes = await fetch('/api/company-profile');
                    const compResult = await compRes.json();
                    if (compResult.success) {
                        companyProfileCache = { data: compResult.data, timestamp: now };
                        setCompany(compResult.data);
                    }
                } catch (err) {
                    console.error('Failed to fetch company profile:', err);
                }
            }

            // Check cache for customer
            if (data.customerId) {
                const cachedCustomer = customerCache.get(data.customerId);
                if (cachedCustomer && (now - cachedCustomer.timestamp) < CUSTOMER_CACHE_TTL) {
                    setCustomer(cachedCustomer.data);
                    if (!companyProfileCache || (now - companyProfileCache.timestamp) >= COMPANY_CACHE_TTL) {
                        setLoading(false);
                    }
                } else {
                    if (!companyProfileCache || (now - companyProfileCache.timestamp) >= COMPANY_CACHE_TTL) {
                        setLoading(true);
                    }
                    try {
                        const custRes = await fetch(`/api/customers/${data.customerId}`);
                        const custResult = await custRes.json();
                        if (custResult.success) {
                            customerCache.set(data.customerId, { data: custResult.data, timestamp: now });
                            setCustomer(custResult.data);
                        }
                    } catch (err) {
                        console.error('Failed to fetch customer:', err);
                    }
                }
            }
            
            setLoading(false);
        };
        fetchData();
    }, [data.customerId]);

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

    const handleGenerateSummary = async () => {
        if (summaryLoading) return;
        setSummaryLoading(true);
        try {
            const parts: string[] = [];
            parts.push('Hãy giúp tôi tạo một đoạn TÓM TẮT NGẮN GỌN cho báo giá dịch vụ BIM sau.');
            parts.push('Yêu cầu:');
            parts.push('- Viết bằng tiếng Việt, giọng chuyên nghiệp, tối đa khoảng 6–8 câu.');
            parts.push('- Tập trung vào: bối cảnh dự án, phạm vi dịch vụ chính, tổng giá trị và lợi ích cho khách hàng.');
            parts.push('- Không chèn tiêu đề hay lời chào, chỉ trả về nội dung tóm tắt.');
            parts.push('---');
            parts.push(`Tên dự án: ${data.projectName || '(chưa có)'}`);
            if (data.projectItem) parts.push(`Hạng mục: ${data.projectItem}`);
            if (typeof data.totalArea === 'number') parts.push(`Diện tích: ${data.totalArea} m²`);
            parts.push(`Tổng giá trị (đã VAT): ${formatVND(totalAfterVat)} VNĐ (${totalInWords})`);
            if (data.scopeText) {
                parts.push('Phạm vi công việc (rút gọn):');
                parts.push(data.scopeText.slice(0, 2000));
            }

            const aiText = await callAiForSuggestion([
                { role: 'user', content: parts.join('\n') },
            ]);

            setSummaryText(aiText);
        } catch (error) {
            // eslint-disable-next-line no-alert
            alert(
                `Lỗi khi tạo tóm tắt báo giá: ${error instanceof Error ? error.message : 'Không thể kết nối máy chủ AI'
                }`,
            );
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleGenerateEmail = async () => {
        if (emailLoading) return;
        setEmailLoading(true);
        try {
            const parts: string[] = [];
            parts.push('Hãy viết giúp tôi một EMAIL GỬI KHÁCH HÀNG để gửi kèm báo giá dịch vụ BIM sau.');
            parts.push('Yêu cầu:');
            parts.push('- Viết bằng tiếng Việt, giọng chuyên nghiệp, lịch sự.');
            parts.push('- Cấu trúc gồm: lời chào, giới thiệu ngắn, nội dung chính (tóm tắt báo giá), lời mời trao đổi, lời cảm ơn & chữ ký.');
            parts.push('- Không thêm placeholder như [Tên khách hàng], mà nếu thiếu thông tin thì ghi chung chung (Quý Công ty).');
            parts.push('- Chỉ trả về nội dung email, không giải thích gì thêm.');
            parts.push('---');
            parts.push(`Tên dự án: ${data.projectName || '(chưa có)'}`);
            if (data.projectItem) parts.push(`Hạng mục: ${data.projectItem}`);
            if (customer?.name) parts.push(`Khách hàng: ${customer.name}`);
            parts.push(`Tổng giá trị (đã VAT): ${formatVND(totalAfterVat)} VNĐ (${totalInWords})`);
            if (company) {
                parts.push(`Đơn vị gửi báo giá: ${company.name}`);
            }

            const aiText = await callAiForSuggestion([
                { role: 'user', content: parts.join('\n') },
            ]);

            setEmailText(aiText);
        } catch (error) {
            // eslint-disable-next-line no-alert
            alert(
                `Lỗi khi tạo email gửi khách hàng: ${error instanceof Error ? error.message : 'Không thể kết nối máy chủ AI'
                }`,
            );
        } finally {
            setEmailLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-zf-bg-secondary">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-zf-text-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading document details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-50">
            <div className="max-w-7xl mx-auto p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <button
                        onClick={() => {
                            if (quotationId && quotationNo) {
                                setShowExportModal(true);
                            } else {
                                // Fallback to window.print if no ID
                                window.print();
                            }
                        }}
                        className="flex items-center gap-2 px-6 py-3 text-white rounded bg-zf-primary hover:bg-zf-primary-dark transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        Xuất PDF
                    </button>
                    <ExportWordButton
                        quotationNo={quotationNo}
                        date={data.date}
                        className="bg-green-600 hover:bg-green-700"
                    />
                    <ExportExcelButton
                        data={data}
                        quotationNo={quotationNo}
                    />
                    <PreviewModeToggle
                        defaultMode="desktop"
                        onModeChange={setPreviewMode}
                        className="ml-auto"
                    />
                    <ThemePicker
                        currentTheme={data.theme || 'blue'}
                        onThemeChange={async (newTheme) => {
                            if (onDataChange) {
                                await onDataChange('theme', newTheme);
                            }
                        }}
                    />
                    <TemplateSelector
                        currentTemplate={data.templateId || 'standard'}
                        onTemplateChange={async (newTemplate) => {
                            if (onDataChange) {
                                await onDataChange('templateId', newTemplate);
                            }
                        }}
                    />
                    <div className="flex flex-col md:flex-row gap-2 md:items-center">
                        <button
                            type="button"
                            onClick={handleGenerateSummary}
                            disabled={summaryLoading}
                            className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                        >
                            {summaryLoading ? 'Đang tạo tóm tắt...' : '✨ Tạo tóm tắt báo giá (AI)'}
                        </button>
                        <AIReviewer
                            data={data}
                            quotationId={quotationId}
                        />
                        <button
                            type="button"
                            onClick={handleGenerateEmail}
                            disabled={emailLoading}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                        >
                            {emailLoading ? 'Đang tạo email...' : '✉️ Tạo email gửi khách (AI)'}
                        </button>
                    </div>
                </div>

                <MediaUploader
                    media={data.media}
                    onMediaChange={async (newMedia) => {
                        if (onDataChange) {
                            await onDataChange('media', newMedia);
                        }
                    }}
                    className="p-4 bg-white rounded-lg shadow-sm border border-gray-100"
                />

                {(summaryText || emailText) && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {summaryText && (
                            <div className="bg-white rounded-lg shadow border border-indigo-100 p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-indigo-700">Tóm tắt báo giá (AI)</h3>
                                    <QuickCopyButtons summaryText={summaryText} className="ml-2" />
                                </div>
                                <textarea
                                    className="w-full border border-gray-200 rounded-md p-2 text-sm min-h-[160px] resize-vertical"
                                    value={summaryText}
                                    onChange={(e) => setSummaryText(e.target.value)}
                                    aria-label="Tóm tắt báo giá"
                                    title="Tóm tắt báo giá"
                                />
                                <p className="text-xs text-gray-500">
                                    Bạn có thể chỉnh sửa nội dung này và copy để dùng trong email/tài liệu khác.
                                </p>
                            </div>
                        )}
                        {emailText && (
                            <div className="bg-white rounded-lg shadow border border-emerald-100 p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-emerald-700">Email gửi khách hàng (AI)</h3>
                                    <QuickCopyButtons emailText={emailText} className="ml-2" />
                                </div>
                                <textarea
                                    className="w-full border border-gray-200 rounded-md p-2 text-sm min-h-[160px] resize-vertical"
                                    value={emailText}
                                    onChange={(e) => setEmailText(e.target.value)}
                                    aria-label="Email gửi khách hàng"
                                    title="Email gửi khách hàng"
                                />
                                <p className="text-xs text-gray-500">
                                    Hãy kiểm tra lại nội dung trước khi gửi cho khách hàng.
                                </p>
                            </div>
                        )}
                    </div>
                )}
                <style>{`
                    @media print { 
                        body * { visibility: hidden; } 
                        #printArea, #printArea * { visibility: visible; } 
                        #printArea { position: absolute; left: 0; top: 0; width: 100%; } 
                        .no-print { display: none !important; } 
                    }
                    :root {
                        --theme-primary: ${getThemeColors(data.theme || 'blue').primary};
                        --theme-accent: ${getThemeColors(data.theme || 'blue').accent};
                        --theme-secondary: ${getThemeColors(data.theme || 'blue').secondary};
                    }
                    .text-theme-primary { color: var(--theme-primary); }
                    .bg-theme-primary { background-color: var(--theme-primary); }
                    .border-theme-primary { border-color: var(--theme-primary) !important; }
                    .bg-theme-secondary { background-color: var(--theme-secondary); }
                `}</style>
                <div className="flex justify-center transition-all duration-300">
                    <div className={`transition-all duration-300 shadow-sm ${getPreviewWrapperClass(previewMode)}`}>
                        {data.templateId === 'minimalist' ? (
                            <MinimalistTemplate
                                data={data}
                                company={company}
                                customer={customer}
                                dateInfo={dateInfo}
                                totalBeforeVat={totalBeforeVat}
                                vatAmount={vatAmount}
                                totalAfterVat={totalAfterVat}
                                totalInWords={totalInWords}
                                onDataChange={onDataChange}
                            />
                        ) : (
                            <StandardTemplate
                                data={data}
                                company={company}
                                customer={customer}
                                dateInfo={dateInfo}
                                totalBeforeVat={totalBeforeVat}
                                vatAmount={vatAmount}
                                totalAfterVat={totalAfterVat}
                                totalInWords={totalInWords}
                                onDataChange={onDataChange}
                            />
                        )}
                </div>
            </div>

            {/* Export PDF Modal */}
            {quotationId && quotationNo && (
                <ExportPdfModal
                    isOpen={showExportModal}
                    onClose={() => setShowExportModal(false)}
                    quotationId={quotationId}
                    quotationNo={quotationNo}
                />
            )}
        </div>
    </div>
);
}
