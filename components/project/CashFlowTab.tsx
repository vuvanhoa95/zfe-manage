'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Circle,
    DollarSign,
    FileText,
    Pencil,
    Plus,
    RefreshCw,
    Trash2,
    X,
} from 'lucide-react';

import { formatVNDWithSymbol } from '@/lib/number-to-words-vn';
import CashFlowForecast from '@/components/project/CashFlowForecast';
import CashFlowComments from '@/components/project/CashFlowComments';

type CashFlowType = 'INCOME' | 'EXPENSE';
type DocumentStatus = 'NONE' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | null;

type CashFlow = {
    id: string;
    projectId: string;
    type: CashFlowType;
    category: string | null;
    description: string;
    amount: number;
    date: string | null;
    quotationId: string | null;
    quotation?: { id: string; quotationNo: string } | null;
    notes: string | null;
    createdBy?: { id: string; name: string } | null;
    paymentMilestoneNo?: number | null;
    paymentMilestonePercent?: number | null;
    paymentMilestoneTitle?: string | null;
    documentStatus?: DocumentStatus;
    documentNote?: string | null;
};

type QuotationLite = { id: string; quotationNo: string };

/** Dynamic checklist item from settings */
type ChecklistItemDef = { key: string; label: string };

const DEFAULT_CHECKLIST_ITEMS: ChecklistItemDef[] = [
    { key: 'contract', label: 'Hợp đồng / Phụ lục' },
    { key: 'acceptance', label: 'Biên bản nghiệm thu' },
    { key: 'invoice', label: 'Hóa đơn GTGT' },
    { key: 'request', label: 'Đề nghị thanh toán' },
    { key: 'handover', label: 'Biên bản bàn giao' },
];

const cashFlowFormSchema = z.object({
    type: z.enum(['INCOME', 'EXPENSE']),
    date: z.string().optional(), // Now optional
    amount: z.number().positive('Số tiền phải > 0'),
    category: z.string().trim().max(200).optional(),
    description: z.string().trim().min(1, 'Vui lòng nhập mô tả').max(500),
    quotationId: z.string().optional(),
    notes: z.string().trim().max(2000).optional(),
    documentStatus: z.enum(['NONE', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional(),
    documentNote: z.string().trim().max(2000).optional(),
});

type CashFlowFormValues = z.infer<typeof cashFlowFormSchema>;

function getTypeLabel(type: CashFlowType) {
    return type === 'INCOME' ? 'Thu' : 'Chi';
}

function getDocumentStatusLabel(status: DocumentStatus): { label: string; className: string } {
    switch (status) {
        case 'SUBMITTED':
            return { label: 'Đã nộp hồ sơ', className: 'bg-amber-50 text-amber-800 border border-amber-200' };
        case 'APPROVED':
            return { label: 'Đã duyệt', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
        case 'REJECTED':
            return { label: 'Trả lại', className: 'bg-red-50 text-red-700 border border-red-200' };
        default:
            return { label: 'Chưa có hồ sơ', className: 'bg-gray-50 text-gray-600 border border-gray-200' };
    }
}

/**
 * documentNote JSON format:
 * {
 *   selectedItems: string[], // keys of checklist items selected for this milestone
 *   checklist: Record<string, boolean>, // checked state for each selected item
 *   note: string // freetext
 * }
 */
type DocumentNoteData = {
    selectedItems?: string[];
    checklist?: Record<string, boolean>;
    note?: string;
};

function parseDocumentNote(note: string | null | undefined): DocumentNoteData {
    if (!note) return { selectedItems: [], checklist: {}, note: '' };
    try {
        const parsed = JSON.parse(note);
        if (parsed && typeof parsed === 'object') {
            return {
                selectedItems: parsed.selectedItems || Object.keys(parsed.checklist || {}),
                checklist: parsed.checklist || {},
                note: parsed.note || '',
            };
        }
    } catch {
        // Legacy plain text
    }
    return { selectedItems: [], checklist: {}, note: note || '' };
}

function serializeDocumentNote(data: DocumentNoteData): string {
    return JSON.stringify({
        selectedItems: data.selectedItems || [],
        checklist: data.checklist || {},
        note: data.note || '',
    });
}

export default function CashFlowTab({
    projectId,
    isNew,
    projectData,
}: {
    projectId: string;
    isNew: boolean;
    projectData?: any;
}) {
    const [cashFlows, setCashFlows] = useState<CashFlow[]>(projectData?.cashFlows || []);
    const [quotations, setQuotations] = useState<QuotationLite[]>(() => {
        if (projectData?.quotations) {
            return projectData.quotations.map((q: any) => ({
                id: q.id,
                quotationNo: q.quotationNo,
            }));
        }
        return [];
    });
    const [isLoading, setIsLoading] = useState(!projectData);
    const [isSaving, setIsSaving] = useState(false);
    const [editing, setEditing] = useState<CashFlow | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Dynamic checklist items from settings
    const [checklistItems, setChecklistItems] = useState<ChecklistItemDef[]>(DEFAULT_CHECKLIST_ITEMS);

    // Form state for checklist
    const [formSelectedItems, setFormSelectedItems] = useState<string[]>([]);
    const [formChecklist, setFormChecklist] = useState<Record<string, boolean>>({});
    const [formFreetext, setFormFreetext] = useState('');

    const form = useForm<CashFlowFormValues>({
        resolver: zodResolver(cashFlowFormSchema),
        defaultValues: {
            type: 'INCOME',
            date: '',
            amount: 0,
            category: 'Thu từ báo giá',
            description: '',
            quotationId: '',
            notes: '',
            documentStatus: 'NONE',
            documentNote: '',
        },
    });

    const watchType = form.watch('type');

    // Fetch checklist settings
    const fetchChecklistSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/settings/payment-checklist');
            const result = await res.json();
            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                setChecklistItems(result.data);
            }
        } catch {
            // Use defaults
        }
    }, []);

    const totals = useMemo(() => {
        const totalIncome = cashFlows.filter((c) => c.type === 'INCOME').reduce((s, c) => s + c.amount, 0);
        const totalExpense = cashFlows.filter((c) => c.type === 'EXPENSE').reduce((s, c) => s + c.amount, 0);
        return { totalIncome, totalExpense, net: totalIncome - totalExpense };
    }, [cashFlows]);

    useEffect(() => {
        void fetchChecklistSettings();
    }, [fetchChecklistSettings]);

    useEffect(() => {
        if (projectData) {
            setCashFlows(projectData.cashFlows || []);
            if (projectData.quotations) {
                setQuotations(
                    projectData.quotations.map((q: any) => ({
                        id: q.id,
                        quotationNo: q.quotationNo,
                    }))
                );
            }
            setIsLoading(false);
            return;
        }
        if (!isNew && projectId) {
            void refreshAll();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, isNew, projectData]);

    async function refreshAll() {
        setIsLoading(true);
        try {
            await Promise.all([fetchCashFlows(), fetchQuotations()]);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchCashFlows() {
        const res = await fetch(`/api/projects/${projectId}/cashflows`);
        const result = await res.json();
        if (result.success) setCashFlows(result.data || []);
    }

    async function fetchQuotations() {
        if (projectData?.quotations) {
            setQuotations(projectData.quotations.map((q: any) => ({ id: q.id, quotationNo: q.quotationNo })));
            return;
        }
        const res = await fetch(`/api/projects/${projectId}`);
        const result = await res.json();
        if (result.success) {
            setQuotations((result.data?.quotations || []).map((q: any) => ({ id: q.id, quotationNo: q.quotationNo })));
        }
    }

    async function generateFromQuotation() {
        if (!quotations.length) {
            alert('Chưa có báo giá nào để tạo dòng tiền.');
            return;
        }
        const ok = confirm(
            'Tạo dòng tiền tự động từ báo giá chốt?\n\nHệ thống sẽ tạo dòng THU theo mốc thanh toán.\nNgày sẽ để trống, cập nhật sau khi thanh toán thực tế.'
        );
        if (!ok) return;

        setIsGenerating(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/cashflows/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ includeExpenses: true, overwriteExisting: true }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.error || 'Không thể tạo dòng tiền từ báo giá');
            }
            await fetchCashFlows();
        } catch (error: any) {
            console.error(error);
            alert(`Lỗi: ${error?.message || 'Không thể tạo dòng tiền từ báo giá'}`);
        } finally {
            setIsGenerating(false);
        }
    }

    function openCreate() {
        setEditing(null);
        form.reset({
            type: 'INCOME',
            date: new Date().toISOString().slice(0, 10),
            amount: 0,
            category: 'Thu từ báo giá',
            description: '',
            quotationId: '',
            notes: '',
            documentStatus: 'NONE',
            documentNote: '',
        });
        // Select all checklist items by default for new entries
        setFormSelectedItems(checklistItems.map((i) => i.key));
        setFormChecklist(Object.fromEntries(checklistItems.map((i) => [i.key, false])));
        setFormFreetext('');
        setIsFormOpen(true);
    }

    function openEdit(cf: CashFlow) {
        setEditing(cf);
        const dateStr = cf.date ? new Date(cf.date).toISOString().slice(0, 10) : '';
        form.reset({
            type: cf.type,
            date: dateStr,
            amount: cf.amount,
            category: cf.category || (cf.type === 'INCOME' ? 'Thu từ báo giá' : 'Chi phí outsource'),
            description: cf.description,
            quotationId: cf.quotationId || '',
            notes: cf.notes || '',
            documentStatus: (cf.documentStatus as DocumentStatus) || 'NONE',
            documentNote: cf.documentNote || '',
        });
        const noteData = parseDocumentNote(cf.documentNote);
        setFormSelectedItems(noteData.selectedItems || []);
        setFormChecklist(noteData.checklist || {});
        setFormFreetext(noteData.note || '');
        setIsFormOpen(true);
    }

    async function onSubmit(values: CashFlowFormValues) {
        setIsSaving(true);
        try {
            const docNoteData: DocumentNoteData = {
                selectedItems: formSelectedItems,
                checklist: formChecklist,
                note: formFreetext,
            };

            const payload = {
                ...values,
                date: values.date?.trim() ? values.date.trim() : null,
                category: values.category?.trim() ? values.category.trim() : null,
                quotationId: values.quotationId?.trim() ? values.quotationId.trim() : null,
                notes: values.notes?.trim() ? values.notes.trim() : null,
                documentStatus:
                    values.documentStatus && values.documentStatus !== 'NONE' ? values.documentStatus : null,
                documentNote: serializeDocumentNote(docNoteData) || null,
            };

            const url = editing
                ? `/api/projects/${projectId}/cashflows/${editing.id}`
                : `/api/projects/${projectId}/cashflows`;
            const method = editing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.error || 'Không thể lưu dòng tiền');
            }

            setIsFormOpen(false);
            setEditing(null);
            await fetchCashFlows();
        } catch (error: any) {
            console.error(error);
            alert(`Lỗi: ${error?.message || 'Không thể lưu dòng tiền'}`);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(cf: CashFlow) {
        if (!confirm('Bạn có chắc muốn xóa dòng tiền này?')) return;
        try {
            const res = await fetch(`/api/projects/${projectId}/cashflows/${cf.id}`, { method: 'DELETE' });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Không thể xóa dòng tiền');
            await fetchCashFlows();
        } catch (error: any) {
            console.error(error);
            alert(`Lỗi: ${error?.message || 'Không thể xóa dòng tiền'}`);
        }
    }

    /** Quick-update document status inline */
    async function quickUpdateDocStatus(cf: CashFlow, newStatus: DocumentStatus) {
        try {
            const res = await fetch(`/api/projects/${projectId}/cashflows/${cf.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: cf.type,
                    date: cf.date ? new Date(cf.date).toISOString().slice(0, 10) : null,
                    amount: cf.amount,
                    category: cf.category,
                    description: cf.description,
                    quotationId: cf.quotationId,
                    notes: cf.notes,
                    documentStatus: newStatus,
                    documentNote: cf.documentNote,
                }),
            });
            const result = await res.json();
            if (result.success) await fetchCashFlows();
        } catch (err) {
            console.error('Quick update failed:', err);
        }
    }

    /** Quick-toggle a checklist item inline */
    async function quickToggleChecklist(cf: CashFlow, key: string) {
        const noteData = parseDocumentNote(cf.documentNote);
        const updated = { ...noteData.checklist, [key]: !noteData.checklist?.[key] };
        const newNote = serializeDocumentNote({ ...noteData, checklist: updated });

        try {
            const res = await fetch(`/api/projects/${projectId}/cashflows/${cf.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: cf.type,
                    date: cf.date ? new Date(cf.date).toISOString().slice(0, 10) : null,
                    amount: cf.amount,
                    category: cf.category,
                    description: cf.description,
                    quotationId: cf.quotationId,
                    notes: cf.notes,
                    documentStatus: cf.documentStatus,
                    documentNote: newNote,
                }),
            });
            const result = await res.json();
            if (result.success) await fetchCashFlows();
        } catch (err) {
            console.error('Quick toggle checklist failed:', err);
        }
    }

    if (isNew) {
        return (
            <div className="p-8 flex items-center justify-center">
                <p className="text-gray-600">Vui lòng lưu dự án trước khi quản lý dòng tiền.</p>
            </div>
        );
    }

    /** Get the checklist items that are selected for a specific cashflow */
    function getSelectedChecklistForCF(cf: CashFlow): ChecklistItemDef[] {
        const noteData = parseDocumentNote(cf.documentNote);
        const selected = noteData.selectedItems || [];
        if (selected.length === 0) {
            // Legacy: show all configured items
            return checklistItems;
        }
        return checklistItems.filter((i) => selected.includes(i.key));
    }

    function getCheckedCount(cf: CashFlow): { checked: number; total: number } {
        const noteData = parseDocumentNote(cf.documentNote);
        const items = getSelectedChecklistForCF(cf);
        const checked = items.filter((i) => noteData.checklist?.[i.key]).length;
        return { checked, total: items.length };
    }

    return (
        <div className="p-6 overflow-y-auto">
            <div className="mx-auto space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Quản lý dòng tiền
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => void refreshAll()}
                                disabled={isLoading}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center gap-2"
                                aria-label="Làm mới dữ liệu"
                                title="Làm mới dữ liệu"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Làm mới
                            </button>
                            <button
                                onClick={() => void generateFromQuotation()}
                                disabled={isLoading || isGenerating}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
                                aria-label="Tạo dòng tiền từ báo giá"
                                title="Tạo dòng tiền từ báo giá"
                            >
                                {isGenerating ? 'Đang tạo...' : 'Tạo từ báo giá'}
                            </button>
                            <button
                                onClick={openCreate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                                aria-label="Thêm dòng tiền"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm dòng tiền
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="p-4 rounded-xl border border-gray-200 bg-green-50">
                            <div className="text-xs uppercase text-gray-600 mb-1">Tổng thu</div>
                            <div className="text-lg font-bold text-green-700">
                                {formatVNDWithSymbol(totals.totalIncome)}
                            </div>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 bg-red-50">
                            <div className="text-xs uppercase text-gray-600 mb-1">Tổng chi</div>
                            <div className="text-lg font-bold text-red-700">
                                {formatVNDWithSymbol(totals.totalExpense)}
                            </div>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                            <div className="text-xs uppercase text-gray-600 mb-1">Chênh lệch</div>
                            <div
                                className={`text-lg font-bold ${totals.net >= 0 ? 'text-green-700' : 'text-red-700'}`}
                            >
                                {formatVNDWithSymbol(totals.net)}
                            </div>
                        </div>
                    </div>

                    {/* Forecast Chart */}
                    {!isLoading && cashFlows.length > 0 && (
                        <div className="mt-6">
                            <CashFlowForecast cashflows={cashFlows} />
                        </div>
                    )}

                    {/* Table */}
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải dòng tiền...</p>
                        </div>
                    ) : cashFlows.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600 mb-4">Chưa có dòng tiền nào.</p>
                            <button
                                onClick={openCreate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                + Tạo dòng tiền đầu tiên
                            </button>
                        </div>
                    ) : (
                        <div className="mt-6 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-600 border-b bg-gray-50/60">
                                        <th className="py-3 px-3 whitespace-nowrap font-semibold">Loại</th>
                                        <th className="py-3 px-3 whitespace-nowrap font-semibold">Mô tả</th>
                                        <th className="py-3 px-3 whitespace-nowrap font-semibold text-right">
                                            Số tiền
                                        </th>
                                        <th className="py-3 px-3 whitespace-nowrap font-semibold">Trạng thái</th>
                                        <th className="py-3 px-3 whitespace-nowrap font-semibold">
                                            Hồ sơ thanh toán
                                        </th>
                                        <th className="py-3 px-3 whitespace-nowrap font-semibold">Báo giá</th>
                                        <th className="py-3 px-3 whitespace-nowrap font-semibold text-right">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cashFlows.map((cf) => {
                                        const isExpanded = expandedRow === cf.id;
                                        const noteData = parseDocumentNote(cf.documentNote);
                                        const selectedItems = getSelectedChecklistForCF(cf);
                                        const { checked: checkedN, total: totalN } = getCheckedCount(cf);
                                        const docStatus = getDocumentStatusLabel(
                                            (cf.documentStatus as DocumentStatus) || 'NONE'
                                        );
                                        const milestoneLabel = cf.paymentMilestoneNo
                                            ? `Đợt ${cf.paymentMilestoneNo}${cf.paymentMilestonePercent ? ` (${cf.paymentMilestonePercent}%)` : ''}`
                                            : null;

                                        return (
                                            <React.Fragment key={cf.id}>
                                                <tr
                                                    className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                                                    onClick={() => setExpandedRow(isExpanded ? null : cf.id)}
                                                >
                                                    {/* Loại */}
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                                cf.type === 'INCOME'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-red-100 text-red-700'
                                                            }`}
                                                        >
                                                            {getTypeLabel(cf.type)}
                                                        </span>
                                                    </td>

                                                    {/* Mô tả - 1 dòng */}
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-900 truncate max-w-xs">
                                                                {cf.description}
                                                            </span>
                                                            {milestoneLabel && (
                                                                <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                                    {milestoneLabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Số tiền */}
                                                    <td className="py-3 px-3 whitespace-nowrap text-right font-bold">
                                                        <span
                                                            className={
                                                                cf.type === 'INCOME'
                                                                    ? 'text-green-700'
                                                                    : 'text-red-600'
                                                            }
                                                        >
                                                            {cf.type === 'INCOME' ? '+' : '-'}
                                                            {formatVNDWithSymbol(cf.amount)}
                                                        </span>
                                                    </td>

                                                    {/* Trạng thái */}
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${docStatus.className}`}
                                                        >
                                                            {docStatus.label}
                                                        </span>
                                                    </td>

                                                    {/* Checklist progress */}
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        {totalN > 0 ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-0.5">
                                                                    {selectedItems.map((item) => (
                                                                        <span
                                                                            key={item.key}
                                                                            title={item.label}
                                                                            className={`w-4 h-4 rounded-sm flex items-center justify-center ${
                                                                                noteData.checklist?.[item.key]
                                                                                    ? 'bg-emerald-500 text-white'
                                                                                    : 'bg-gray-200 text-gray-400'
                                                                            }`}
                                                                        >
                                                                            {noteData.checklist?.[item.key] ? (
                                                                                <Check className="w-3 h-3" />
                                                                            ) : null}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <span className="text-xs text-gray-500">
                                                                    {checkedN}/{totalN}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">—</span>
                                                        )}
                                                    </td>

                                                    {/* Báo giá */}
                                                    <td className="py-3 px-3 whitespace-nowrap text-xs text-gray-600">
                                                        {cf.quotation?.quotationNo || '-'}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <div className="flex justify-end gap-1.5">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openEdit(cf);
                                                                }}
                                                                className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                                                aria-label="Sửa"
                                                                title="Sửa"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    void handleDelete(cf);
                                                                }}
                                                                className="p-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                                                                aria-label="Xóa"
                                                                title="Xóa"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedRow(isExpanded ? null : cf.id);
                                                                }}
                                                                className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                                                                title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronUp className="w-3.5 h-3.5" />
                                                                ) : (
                                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded detail */}
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/70">
                                                        <td colSpan={7} className="px-4 py-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                {/* Checklist */}
                                                                <div>
                                                                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                                        <FileText className="w-3.5 h-3.5" />
                                                                        Checklist hồ sơ
                                                                    </h4>
                                                                    {selectedItems.length > 0 ? (
                                                                        <div className="space-y-1.5">
                                                                            {selectedItems.map((item) => (
                                                                                <button
                                                                                    key={item.key}
                                                                                    onClick={() =>
                                                                                        void quickToggleChecklist(
                                                                                            cf,
                                                                                            item.key
                                                                                        )
                                                                                    }
                                                                                    className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-white transition-colors group"
                                                                                >
                                                                                    {noteData.checklist?.[item.key] ? (
                                                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                                                    ) : (
                                                                                        <Circle className="w-4 h-4 text-gray-300 group-hover:text-gray-400 flex-shrink-0" />
                                                                                    )}
                                                                                    <span
                                                                                        className={`text-sm ${
                                                                                            noteData.checklist?.[item.key]
                                                                                                ? 'text-gray-700 line-through'
                                                                                                : 'text-gray-600'
                                                                                        }`}
                                                                                    >
                                                                                        {item.label}
                                                                                    </span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-xs text-gray-400 italic">
                                                                            Chưa chọn hồ sơ cho đợt này. Bấm &quot;Sửa&quot; để chọn.
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Status */}
                                                                <div>
                                                                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                                                        Cập nhật trạng thái
                                                                    </h4>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {(
                                                                            [
                                                                                'NONE',
                                                                                'SUBMITTED',
                                                                                'APPROVED',
                                                                                'REJECTED',
                                                                            ] as const
                                                                        ).map((s) => {
                                                                            const info = getDocumentStatusLabel(s);
                                                                            const isActive =
                                                                                (cf.documentStatus || 'NONE') === s;
                                                                            return (
                                                                                <button
                                                                                    key={s}
                                                                                    onClick={() =>
                                                                                        void quickUpdateDocStatus(
                                                                                            cf,
                                                                                            s === 'NONE' ? null : s
                                                                                        )
                                                                                    }
                                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                                                                        isActive
                                                                                            ? `${info.className} ring-2 ring-offset-1 ring-blue-400`
                                                                                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                                                                    }`}
                                                                                >
                                                                                    {info.label}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>

                                                                {/* Details */}
                                                                <div>
                                                                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                                                        Chi tiết
                                                                    </h4>
                                                                    <div className="text-xs text-gray-600 space-y-1">
                                                                        <div>
                                                                            <span className="font-medium">Ngày:</span>{' '}
                                                                            {cf.date ? (
                                                                                new Date(cf.date).toLocaleDateString('vi-VN')
                                                                            ) : (
                                                                                <span className="text-gray-400 italic">
                                                                                    Chưa xác định
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-medium">
                                                                                Danh mục:
                                                                            </span>{' '}
                                                                            {cf.category || '-'}
                                                                        </div>
                                                                        {cf.notes && (
                                                                            <div>
                                                                                <span className="font-medium">
                                                                                    Ghi chú:
                                                                                </span>{' '}
                                                                                {cf.notes
                                                                                    .replace(
                                                                                        '[AUTO_FROM_QUOTATION]',
                                                                                        ''
                                                                                    )
                                                                                    .trim()}
                                                                            </div>
                                                                        )}
                                                                        {noteData.note && (
                                                                            <div>
                                                                                <span className="font-medium">
                                                                                    Hồ sơ:
                                                                                </span>{' '}
                                                                                {noteData.note}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Comments & History */}
                                                            <CashFlowComments
                                                                projectId={projectId}
                                                                cashFlowId={cf.id}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            {isFormOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className={`w-full ${editing ? 'max-w-6xl' : 'max-w-2xl'} bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden max-h-[90vh]`}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-white flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {editing ? 'Chỉnh sửa dòng tiền' : 'Thêm dòng tiền'}
                                </h3>
                                {editing?.paymentMilestoneNo && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        Đợt {editing.paymentMilestoneNo}
                                        {editing.paymentMilestonePercent ? ` (${editing.paymentMilestonePercent}%)` : ''}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Đóng"
                            >
                                <X className="w-5 h-5 text-gray-700" />
                            </button>
                        </div>

                        {/* Body: 2-column layout */}
                        <div className="flex flex-1 min-h-0">
                            {/* LEFT: Form */}
                            <div className={`${editing ? 'w-3/5 border-r border-gray-200' : 'w-full'} overflow-y-auto`}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại</label>
                                    <select
                                        {...form.register('type')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="INCOME">Thu (theo hợp đồng)</option>
                                        <option value="EXPENSE">Chi (trả outsource)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ngày <span className="text-xs text-gray-400">(để trống nếu chưa xác định)</span>
                                    </label>
                                    <input
                                        type="date"
                                        {...form.register('date')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Số tiền (VNĐ)
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        {...form.register('amount', { valueAsNumber: true })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {form.formState.errors.amount ? (
                                        <p className="text-sm text-red-600 mt-1">
                                            {form.formState.errors.amount.message}
                                        </p>
                                    ) : null}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Danh mục {watchType === 'INCOME' ? '(Thu)' : '(Chi)'}
                                    </label>
                                    {watchType === 'INCOME' ? (
                                        <select
                                            {...form.register('category')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="Thu từ báo giá">Thu từ báo giá</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    ) : (
                                        <select
                                            {...form.register('category')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="Chi phí outsource">Chi trả outsource</option>
                                            <option value="Chi phí thuế">Chi phí thuế</option>
                                            <option value="Chi phí hoa hồng">Chi phí hoa hồng</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mô tả <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    {...form.register('description')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nhập mô tả dòng tiền"
                                />
                                {form.formState.errors.description ? (
                                    <p className="text-sm text-red-600 mt-1">
                                        {form.formState.errors.description.message}
                                    </p>
                                ) : null}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Liên kết báo giá (tuỳ chọn)
                                </label>
                                <select
                                    {...form.register('quotationId')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Không liên kết</option>
                                    {quotations.map((q) => (
                                        <option key={q.id} value={q.id}>
                                            {q.quotationNo}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment Document Section */}
                            <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30 space-y-4">
                                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    Hồ sơ thanh toán
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                            Tình trạng
                                        </label>
                                        <select
                                            {...form.register('documentStatus')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="NONE">Chưa có hồ sơ</option>
                                            <option value="SUBMITTED">Đã nộp đủ hồ sơ</option>
                                            <option value="APPROVED">Đã duyệt / chờ thanh toán</option>
                                            <option value="REJECTED">Bị trả lại / cần bổ sung</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                            Ghi chú (số HĐ, chứng từ...)
                                        </label>
                                        <input
                                            type="text"
                                            value={formFreetext}
                                            onChange={(e) => setFormFreetext(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="VD: HĐ GTGT số 000123"
                                        />
                                    </div>
                                </div>

                                {/* Checklist item selection for THIS milestone */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-2">
                                        Chọn hồ sơ cần cho đợt thanh toán này
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {checklistItems.map((item) => {
                                            const isSelected = formSelectedItems.includes(item.key);
                                            const isChecked = formChecklist[item.key] || false;
                                            return (
                                                <div
                                                    key={item.key}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all ${
                                                        isSelected
                                                            ? isChecked
                                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                                                : 'bg-blue-50 border-blue-200 text-blue-700'
                                                            : 'bg-gray-50 border-gray-200 text-gray-400'
                                                    }`}
                                                >
                                                    {/* Select/deselect this item for this milestone */}
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            if (isSelected) {
                                                                setFormSelectedItems((prev) =>
                                                                    prev.filter((k) => k !== item.key)
                                                                );
                                                                setFormChecklist((prev) => {
                                                                    const next = { ...prev };
                                                                    delete next[item.key];
                                                                    return next;
                                                                });
                                                            } else {
                                                                setFormSelectedItems((prev) => [...prev, item.key]);
                                                                setFormChecklist((prev) => ({
                                                                    ...prev,
                                                                    [item.key]: false,
                                                                }));
                                                            }
                                                        }}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="flex-1 font-medium">{item.label}</span>
                                                    {isSelected && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setFormChecklist((prev) => ({
                                                                    ...prev,
                                                                    [item.key]: !prev[item.key],
                                                                }))
                                                            }
                                                            className="ml-1"
                                                            title={isChecked ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                                                        >
                                                            {isChecked ? (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                            ) : (
                                                                <Circle className="w-4 h-4 text-gray-300" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1.5">
                                        ✓ Check ô bên trái = chọn hồ sơ cho đợt này. Bấm ○ bên phải = đánh dấu đã hoàn thành.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú khác</label>
                                <textarea
                                    {...form.register('notes')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[70px]"
                                    placeholder="Ghi chú nội bộ (tuỳ chọn)"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                    disabled={isSaving}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                                </button>
                            </div>
                        </form>
                            </div>

                            {/* RIGHT: Activity Panel (only when editing) */}
                            {editing && (
                                <div className="w-2/5 flex flex-col bg-gray-50/50">
                                    <CashFlowComments
                                        projectId={projectId}
                                        cashFlowId={editing.id}
                                        variant="sidebar"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
