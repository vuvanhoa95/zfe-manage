'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { QuotationFormData } from '@/types/quotation';
import { formatVND, numberToVietnameseWords } from '@/lib/number-to-words-vn';
import { calculateQuotationTotals, formatVietnameseDate } from '@/lib/utils';
import ExportPdfModal from './ExportPdfModal';

type PreviewTabProps = {
    data: QuotationFormData;
    quotationId?: string;
    quotationNo?: string;
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

export default function PreviewTab({ data, quotationId, quotationNo }: PreviewTabProps) {
    const [company, setCompany] = useState<CompanyProfile | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [summaryText, setSummaryText] = useState('');
    const [emailText, setEmailText] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);

    const dateInfo = formatVietnameseDate(data.date);
    const { totalBeforeVat, vatAmount, totalAfterVat } = calculateQuotationTotals(data.lines, data.vatRate, data.totalArea);
    const totalInWords = numberToVietnameseWords(totalAfterVat);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const compRes = await fetch('/api/company-profile');
                const compResult = await compRes.json();
                if (compResult.success) setCompany(compResult.data);

                if (data.customerId) {
                    const custRes = await fetch(`/api/customers/${data.customerId}`);
                    const custResult = await custRes.json();
                    if (custResult.success) setCustomer(custResult.data);
                }
            } catch (err) {
                console.error('Failed to fetch preview details:', err);
            } finally {
                setLoading(false);
            }
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
                    <div className="flex flex-col md:flex-row gap-2 md:items-center">
                        <button
                            type="button"
                            onClick={handleGenerateSummary}
                            disabled={summaryLoading}
                            className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                        >
                            {summaryLoading ? 'Đang tạo tóm tắt...' : '✨ Tạo tóm tắt báo giá (AI)'}
                        </button>
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

                {(summaryText || emailText) && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {summaryText && (
                            <div className="bg-white rounded-lg shadow border border-indigo-100 p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-indigo-700">Tóm tắt báo giá (AI)</h3>
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
                <style>{`@media print { body * { visibility: hidden; } #printArea, #printArea * { visibility: visible; } #printArea { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }`}</style>
                <div id="printArea" className="bg-white p-8">
                    {/* Header with Logo */}
                    <div className="mb-8 pb-6 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="relative w-48 h-24">
                                <Image
                                    src="/logo.png"
                                    alt="ZFENIX Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                    quality={100}
                                />
                            </div>
                            <div className="text-right text-sm italic text-gray-600">
                                {data.location}, {dateInfo.full}
                            </div>
                        </div>
                        <h1 className="text-center text-2xl font-bold text-zf-primary">{data.title || 'BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM'}</h1>
                    </div>
                    <div className="mb-6 text-sm">Chúng tôi xin trân trọng cảm ơn Quý Công ty đã tin tưởng và mời chúng tôi tham gia chào giá dịch vụ tư vấn tạo lập mô hình BIM.</div>
                    <div className="mb-6">
                        <h3 className="font-bold mb-2 text-zf-primary">I. THÔNG TIN DỰ ÁN</h3>
                        <div className="ml-4 text-sm">
                            <p>- Dự án: {data.projectName}</p>
                            {data.projectItem && <p>- Hạng mục: {data.projectItem}</p>}
                        </div>
                    </div>
                    {data.scopeText && (
                        <div className="mb-6">
                            <h3 className="font-bold mb-2 text-zf-primary">II. PHẠM VI CÔNG VIỆC</h3>
                            <div className="ml-4 text-sm whitespace-pre-line">{data.scopeText}</div>
                        </div>
                    )}
                    {data.deliverablesText && (
                        <div className="mb-6">
                            <h3 className="font-bold mb-2 text-zf-primary">III. SẢN PHẨM BÀN GIAO</h3>
                            <ul className="ml-8 text-sm list-disc" dangerouslySetInnerHTML={{ __html: data.deliverablesText }}></ul>
                        </div>
                    )}
                    <div className="mb-6">
                        <h3 className="font-bold mb-2 text-zf-primary">IV. CHI TIẾT ĐƠN GIÁ</h3>
                        <table className="w-full text-sm border">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="py-2 px-2 border">TT</th>
                                    <th className="py-2 px-2 border">NỘI DUNG</th>
                                    <th className="py-2 px-2 border">KL</th>
                                    <th className="py-2 px-2 border">ĐƠN GIÁ</th>
                                    <th className="py-2 px-2 border">THÀNH TIỀN</th>
                                    <th className="py-2 px-2 border">GHI CHÚ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.lines.map((line, index) => {
                                    let lineTotal = 0;
                                    let qtyLabel = '-';

                                    if (line.priceType === 'area') {
                                        lineTotal = (data.totalArea || 0) * (line.unitPrice || 0);
                                        qtyLabel = `${data.totalArea || 0}`;
                                    } else if (line.priceType === 'none') {
                                        lineTotal = 0;
                                        qtyLabel = '-';
                                    } else {
                                        lineTotal = (line.qty || 1) * (line.unitPrice || 0);
                                        qtyLabel = `${line.qty || 1}`;
                                    }

                                    if (line.isGroupHeader) {
                                        return (
                                            <tr key={index} className="font-bold bg-gray-100">
                                                <td className="py-2 px-2 border text-sm">{line.itemNo}</td>
                                                <td className="py-2 px-2 border text-sm" colSpan={5}>{line.title}</td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={index}>
                                            <td className="py-2 px-2 border text-xs">{line.itemNo}</td>
                                            <td className="py-2 px-2 border text-xs">{line.title}</td>
                                            <td className="py-2 px-2 border text-xs text-center">{line.priceType === 'none' ? '-' : qtyLabel}</td>
                                            <td className="py-2 px-2 border text-xs text-right">{line.priceType === 'none' ? '-' : formatVND(line.unitPrice || 0)}</td>
                                            <td className="py-2 px-2 border text-xs text-right">{line.priceType === 'none' ? '-' : formatVND(lineTotal)}</td>
                                            <td className="py-2 px-2 border text-xs">{line.note || ''}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="mb-6">
                        <h3 className="font-bold mb-2 text-zf-primary">B. BÁO GIÁ</h3>
                        <table className="w-full text-sm border">
                            <tbody>
                                <tr>
                                    <td className="py-2 px-3 border font-bold">TỔNG CỘNG (CHƯA VAT)</td>
                                    <td className="py-2 px-3 border text-right font-bold">{formatVND(totalBeforeVat)}</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 border">VAT ({(data.vatRate * 100).toFixed(0)}%)</td>
                                    <td className="py-2 px-3 border text-right">{formatVND(vatAmount)}</td>
                                </tr>
                                <tr className="bg-gray-100">
                                    <td className="py-2 px-3 border font-bold">TỔNG CỘNG (ĐÃ VAT)</td>
                                    <td className="py-2 px-3 border text-right font-bold">{formatVND(totalAfterVat)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {data.scheduleText && (
                        <div className="mb-6">
                            <h3 className="font-bold mb-2 text-zf-primary">VI. TIẾN ĐỘ THỰC HIỆN</h3>
                            <div className="ml-4 text-sm">{data.scheduleText}</div>
                        </div>
                    )}
                    {data.paymentMilestones && data.paymentMilestones.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-bold mb-2 text-zf-primary">VII. TIẾN ĐỘ THANH TOÁN</h3>
                            <table className="w-full text-sm border">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="py-2 px-3 border">STT</th>
                                        <th className="py-2 px-3 border">Nội dung</th>
                                        <th className="py-2 px-3 border">Tỉ lệ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.paymentMilestones
                                        .sort((a, b) => a.order - b.order)
                                        .map((milestone) => (
                                            <tr key={milestone.no}>
                                                <td className="py-2 px-3 border text-center">{milestone.no}</td>
                                                <td className="py-2 px-3 border">{milestone.title}</td>
                                                <td className="py-2 px-3 border text-right">{milestone.percent}%</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="mt-12 mb-6">
                        <div className="text-center text-sm italic mb-8">
                            {data.introText || 'Thay mặt đơn vị triển khai xin trân trọng cảm ơn và mong muốn có cơ hội hợp tác với Quý Công ty.'}
                        </div>
                        {company && (
                            <div className="mt-8 pt-6 border-t border-gray-300">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="font-bold mb-2 text-zf-primary">ĐƠN VỊ TRIỂN KHAI</h4>
                                        <div className="text-sm space-y-1">
                                            <p className="font-semibold">{company.name}</p>
                                            <p>Địa chỉ: {company.address}</p>
                                            <p>Mã số thuế: {company.taxCode}</p>
                                            {company.email && <p>Email: {company.email}</p>}
                                            {company.website && <p>Website: {company.website}</p>}
                                            {company.phone && <p>Điện thoại: {company.phone}</p>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm space-y-8">
                                            <div>
                                                <p className="font-semibold mb-2">Người đại diện</p>
                                                <div className="mt-16">
                                                    <p className="font-bold">{company.signerName}</p>
                                                    <p className="text-xs italic">{company.signerTitle}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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
    );
}
