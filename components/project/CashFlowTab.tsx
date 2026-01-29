'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DollarSign, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';

import { formatVNDWithSymbol } from '@/lib/number-to-words-vn';

type CashFlowType = 'INCOME' | 'EXPENSE';

type DocumentStatus = 'NONE' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | null;

type CashFlow = {
    id: string;
    projectId: string;
    type: CashFlowType;
    category: string | null;
    description: string;
    amount: number;
    date: string;
    quotationId: string | null;
    quotation?: { id: string; quotationNo: string } | null;
    notes: string | null;
    createdBy?: { id: string; name: string } | null;
    documentStatus?: DocumentStatus;
    documentNote?: string | null;
};

type QuotationLite = { id: string; quotationNo: string };

const cashFlowFormSchema = z.object({
    type: z.enum(['INCOME', 'EXPENSE']),
    date: z.string().min(1, 'Vui lòng chọn ngày'),
    amount: z.number().positive('Số tiền phải > 0'),
    category: z.string().trim().max(200).optional(),
    description: z.string().trim().min(1, 'Vui lòng nhập mô tả').max(500),
    quotationId: z.string().optional(),
    notes: z.string().trim().max(2000).optional(),
    documentStatus: z.enum(['NONE', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional(),
    documentNote: z.string().trim().max(500).optional(),
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
            return { label: 'Đã duyệt / đủ điều kiện thanh toán', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
        case 'REJECTED':
            return { label: 'Bị trả lại / cần bổ sung', className: 'bg-red-50 text-red-700 border border-red-200' };
        default:
            return { label: 'Chưa có hồ sơ', className: 'bg-gray-50 text-gray-600 border border-gray-200' };
    }
}

export default function CashFlowTab({ projectId, isNew }: { projectId: string; isNew: boolean }) {
    const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
    const [quotations, setQuotations] = useState<QuotationLite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editing, setEditing] = useState<CashFlow | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const form = useForm<CashFlowFormValues>({
        resolver: zodResolver(cashFlowFormSchema),
        defaultValues: {
            type: 'INCOME',
            date: new Date().toISOString().slice(0, 10),
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

    const totals = useMemo(() => {
        const totalIncome = cashFlows.filter((c) => c.type === 'INCOME').reduce((s, c) => s + c.amount, 0);
        const totalExpense = cashFlows.filter((c) => c.type === 'EXPENSE').reduce((s, c) => s + c.amount, 0);
        return {
            totalIncome,
            totalExpense,
            net: totalIncome - totalExpense,
        };
    }, [cashFlows]);

    useEffect(() => {
        if (!isNew && projectId) {
            void refreshAll();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, isNew]);

    async function refreshAll() {
        setIsLoading(true);
        try {
            await Promise.all([fetchCashFlows(), fetchQuotations()]);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchCashFlows() {
        const res = await fetch(`/api/projects/${projectId}/cashflows`, { cache: 'no-store' });
        const result = await res.json();
        if (result.success) setCashFlows(result.data || []);
    }

    async function fetchQuotations() {
        const res = await fetch(`/api/projects/${projectId}`, { cache: 'no-store' });
        const result = await res.json();
        if (result.success) {
            const list: QuotationLite[] = (result.data?.quotations || []).map((q: any) => ({
                id: q.id,
                quotationNo: q.quotationNo,
            }));
            setQuotations(list);
        }
    }

    async function generateFromQuotation() {
        if (!quotations.length) {
            alert('Chưa có báo giá nào để tạo dòng tiền.');
            return;
        }

        const ok = confirm(
            'Tạo dòng tiền tự động từ báo giá chốt (hoặc bạn có thể chọn báo giá trong form).\n\nGợi ý: hệ thống sẽ tạo dòng THU theo mốc thanh toán và dòng CHI theo chi phí nội bộ (nếu có).'
        );
        if (!ok) return;

        setIsGenerating(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/cashflows/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Use finalQuotationId on server if available; otherwise it will require explicit quotationId
                    includeExpenses: true,
                    overwriteExisting: true,
                }),
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
        setIsFormOpen(true);
    }

    function openEdit(cf: CashFlow) {
        setEditing(cf);
        form.reset({
            type: cf.type,
            date: new Date(cf.date).toISOString().slice(0, 10),
            amount: cf.amount,
            category: cf.category || (cf.type === 'INCOME' ? 'Thu từ báo giá' : 'Chi phí outsource'),
            description: cf.description,
            quotationId: cf.quotationId || '',
            notes: cf.notes || '',
            documentStatus: (cf.documentStatus as DocumentStatus) || 'NONE',
            documentNote: cf.documentNote || '',
        });
        setIsFormOpen(true);
    }

    async function onSubmit(values: CashFlowFormValues) {
        setIsSaving(true);
        try {
            const payload = {
                ...values,
                category: values.category?.trim() ? values.category.trim() : null,
                quotationId: values.quotationId?.trim() ? values.quotationId.trim() : null,
                notes: values.notes?.trim() ? values.notes.trim() : null,
                documentStatus: values.documentStatus && values.documentStatus !== 'NONE' ? values.documentStatus : null,
                documentNote: values.documentNote?.trim() ? values.documentNote.trim() : null,
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

    if (isNew) {
        return (
            <div className="p-8 flex items-center justify-center">
                <p className="text-gray-600">Vui lòng lưu dự án trước khi quản lý dòng tiền.</p>
            </div>
        );
    }

    return (
        <div className="p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="p-4 rounded-xl border border-gray-200 bg-green-50">
                            <div className="text-xs uppercase text-gray-600 mb-1">Tổng thu</div>
                            <div className="text-lg font-bold text-green-700">{formatVNDWithSymbol(totals.totalIncome)}</div>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 bg-red-50">
                            <div className="text-xs uppercase text-gray-600 mb-1">Tổng chi</div>
                            <div className="text-lg font-bold text-red-700">{formatVNDWithSymbol(totals.totalExpense)}</div>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                            <div className="text-xs uppercase text-gray-600 mb-1">Chênh lệch</div>
                            <div className={`text-lg font-bold ${totals.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {formatVNDWithSymbol(totals.net)}
                            </div>
                        </div>
                    </div>

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
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-600 border-b">
                                        <th className="py-3 pr-4">Ngày</th>
                                        <th className="py-3 pr-4">Loại</th>
                                        <th className="py-3 pr-4">Danh mục</th>
                                        <th className="py-3 pr-4">Mô tả</th>
                                        <th className="py-3 pr-4">Hồ sơ thanh toán</th>
                                        <th className="py-3 pr-4 text-right">Số tiền</th>
                                        <th className="py-3 pr-4">Báo giá</th>
                                        <th className="py-3 pr-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cashFlows.map((cf) => (
                                        <tr key={cf.id} className="border-b last:border-b-0">
                                            <td className="py-3 pr-4 whitespace-nowrap">
                                                {new Date(cf.date).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="py-3 pr-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-bold ${cf.type === 'INCOME'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    {getTypeLabel(cf.type)}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-4">{cf.category || '-'}</td>
                                            <td className="py-3 pr-4">
                                                <div className="font-medium text-gray-900">{cf.description}</div>
                                                {cf.notes ? <div className="text-gray-500 mt-0.5">{cf.notes}</div> : null}
                                            </td>
                                            <td className="py-3 pr-4">
                                                {(() => {
                                                    const s = getDocumentStatusLabel(
                                                        (cf.documentStatus as DocumentStatus) || 'NONE'
                                                    );
                                                    return (
                                                        <div className="flex flex-col gap-1">
                                                            <span
                                                                className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold ${s.className}`}
                                                            >
                                                                {s.label}
                                                            </span>
                                                            {cf.documentNote ? (
                                                                <span className="text-xs text-gray-500">
                                                                    {cf.documentNote}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="py-3 pr-4 text-right font-bold">
                                                {formatVNDWithSymbol(cf.amount)}
                                            </td>
                                            <td className="py-3 pr-4 whitespace-nowrap">
                                                {cf.quotation?.quotationNo || '-'}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openEdit(cf)}
                                                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                                        aria-label="Sửa dòng tiền"
                                                        title="Sửa"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => void handleDelete(cf)}
                                                        className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                                                        aria-label="Xóa dòng tiền"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {isFormOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editing ? 'Chỉnh sửa dòng tiền' : 'Thêm dòng tiền'}
                            </h3>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Đóng"
                            >
                                <X className="w-5 h-5 text-gray-700" />
                            </button>
                        </div>

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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày</label>
                                    <input
                                        type="date"
                                        {...form.register('date')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {form.formState.errors.date ? (
                                        <p className="text-sm text-red-600 mt-1">{form.formState.errors.date.message}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền (VNĐ)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        {...form.register('amount', { valueAsNumber: true })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {form.formState.errors.amount ? (
                                        <p className="text-sm text-red-600 mt-1">{form.formState.errors.amount.message}</p>
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
                                            title={form.watch('category') || 'Thu từ báo giá (đợt thanh toán hợp đồng)'}
                                        >
                                            <option value="Thu từ báo giá">Thu từ báo giá (đợt thanh toán hợp đồng)</option>
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
                                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.description.message}</p>
                                ) : null}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Liên kết báo giá (tuỳ chọn)</label>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tình trạng hồ sơ thanh toán
                                    </label>
                                    <select
                                        {...form.register('documentStatus')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="NONE">Chưa có hồ sơ</option>
                                        <option value="SUBMITTED">Đã nộp đủ hồ sơ</option>
                                        <option value="APPROVED">Đã duyệt / chờ thanh toán</option>
                                        <option value="REJECTED">Bị trả lại / cần bổ sung</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ghi chú hồ sơ (số hóa đơn, chứng từ...)
                                    </label>
                                    <textarea
                                        {...form.register('documentNote')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[90px]"
                                        placeholder="Ví dụ: HĐ GTGT số 000123, đủ biên bản nghiệm thu..."
                                    />
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
                </div>
            ) : null}
        </div>
    );
}

