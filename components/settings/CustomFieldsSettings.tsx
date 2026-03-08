'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, GripVertical } from 'lucide-react';

type EntityType = 'PROJECT' | 'TASK';
type FieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN';

type CustomFieldOption = {
    id?: string;
    label: string;
    value?: string;
    color?: string;
    sortOrder?: number;
    _deleted?: boolean;
};

type CustomField = {
    id: string;
    name: string;
    key: string;
    description: string | null;
    entityType: EntityType;
    fieldType: FieldType;
    group: string | null;
    sortOrder: number;
    isRequired: boolean;
    isActive: boolean;
    options?: Array<{
        id: string;
        label: string;
        value: string | null;
        color: string | null;
        sortOrder: number;
    }>;
};

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
    TEXT: 'Văn bản',
    NUMBER: 'Số',
    DATE: 'Ngày',
    SELECT: 'Chọn 1',
    MULTI_SELECT: 'Chọn nhiều',
    BOOLEAN: 'Đúng/Sai',
};

function normalizeOptionValue(label: string, value?: string) {
    const trimmed = (value ?? '').trim();
    if (trimmed) return trimmed;
    return label.trim();
}

function isSelectType(fieldType: FieldType) {
    return fieldType === 'SELECT' || fieldType === 'MULTI_SELECT';
}

export default function CustomFieldsSettings() {
    const [entityType, setEntityType] = useState<EntityType>('TASK');
    const [includeInactive, setIncludeInactive] = useState(false);
    const [search, setSearch] = useState('');
    const [fields, setFields] = useState<CustomField[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<CustomField | null>(null);
    const [form, setForm] = useState<{
        name: string;
        key: string;
        description: string;
        group: string;
        fieldType: FieldType;
        sortOrder: number;
        isRequired: boolean;
        isActive: boolean;
        options: CustomFieldOption[];
    }>({
        name: '',
        key: '',
        description: '',
        group: '',
        fieldType: 'TEXT',
        sortOrder: 0,
        isRequired: false,
        isActive: true,
        options: [],
    });

    const fetchFields = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams();
            qs.set('entityType', entityType);
            if (includeInactive) qs.set('includeInactive', 'true');
            const res = await fetch(`/api/custom-fields?${qs.toString()}`);
            const result = await res.json();
            if (!result.success) {
                throw new Error(result.error || 'Không thể tải danh sách trường tuỳ chỉnh');
            }
            setFields(Array.isArray(result.data) ? result.data : []);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Không thể tải danh sách trường tuỳ chỉnh';
            setError(msg);
            setFields([]);
        } finally {
            setIsLoading(false);
        }
    }, [entityType, includeInactive]);

    useEffect(() => {
        void fetchFields();
    }, [fetchFields]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return fields;
        return fields.filter((f) => {
            const hay = `${f.name} ${f.key} ${f.group ?? ''}`.toLowerCase();
            return hay.includes(q);
        });
    }, [fields, search]);

    const openCreate = () => {
        setEditing(null);
        setForm({
            name: '',
            key: '',
            description: '',
            group: '',
            fieldType: 'TEXT',
            sortOrder: 0,
            isRequired: false,
            isActive: true,
            options: [],
        });
        setIsModalOpen(true);
    };

    const openEdit = (field: CustomField) => {
        setEditing(field);
        setForm({
            name: field.name,
            key: field.key,
            description: field.description ?? '',
            group: field.group ?? '',
            fieldType: field.fieldType,
            sortOrder: field.sortOrder ?? 0,
            isRequired: !!field.isRequired,
            isActive: field.isActive !== false,
            options: (field.options ?? []).map((opt) => ({
                id: opt.id,
                label: opt.label,
                value: opt.value ?? opt.label,
                color: opt.color ?? '',
                sortOrder: opt.sortOrder ?? 0,
            })),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditing(null);
    };

    const handleDelete = async (field: CustomField) => {
        const ok = window.confirm(`Xóa trường tuỳ chỉnh "${field.name}"? Dữ liệu đã nhập cho field này cũng sẽ bị xóa.`);
        if (!ok) return;
        try {
            const res = await fetch(`/api/custom-fields/${field.id}`, { method: 'DELETE' });
            const result = await res.json();
            if (!result.success) {
                alert(result.error || 'Không thể xóa trường tuỳ chỉnh');
                return;
            }
            await fetchFields();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Không thể xóa trường tuỳ chỉnh');
        }
    };

    const handleSave = async () => {
        const payload: any = {
            name: form.name,
            key: form.key,
            description: form.description,
            entityType,
            fieldType: form.fieldType,
            group: form.group,
            sortOrder: form.sortOrder,
            isRequired: form.isRequired,
            isActive: form.isActive,
            options: isSelectType(form.fieldType)
                ? form.options
                      .filter((o) => (o.label ?? '').trim().length > 0)
                      .map((o, idx) => ({
                          id: o.id,
                          label: o.label,
                          value: normalizeOptionValue(o.label, o.value),
                          color: (o.color ?? '').trim(),
                          sortOrder: o.sortOrder ?? idx,
                          _deleted: o._deleted,
                      }))
                : [],
        };

        try {
            const url = editing ? `/api/custom-fields/${editing.id}` : '/api/custom-fields';
            const method = editing ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (!result.success) {
                alert(result.error || 'Không thể lưu trường tuỳ chỉnh');
                return;
            }
            closeModal();
            await fetchFields();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Không thể lưu trường tuỳ chỉnh');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <p className="text-sm text-gray-600">
                        Tạo và phân loại custom fields cho <b>Công việc</b> hoặc <b>Dự án</b> (giống ClickUp).
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zf-accent text-white font-semibold hover:opacity-95"
                >
                    <Plus className="w-4 h-4" />
                    Thêm trường
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Áp dụng cho</label>
                    <select
                        value={entityType}
                        onChange={(e) => setEntityType(e.target.value as EntityType)}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                    >
                        <option value="TASK">Công việc (Task)</option>
                        <option value="PROJECT">Dự án (Project)</option>
                    </select>
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={includeInactive}
                        onChange={(e) => setIncludeInactive(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-zf-accent focus:ring-zf-accent"
                    />
                    Hiện cả trường đã tắt
                </label>

                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo tên / key / nhóm..."
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                />
            </div>

            {error && (
                <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Layout 2 cột: Bảng trái, Form phải */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Bảng danh sách - Chiếm 2/3 */}
                <div className={`${isModalOpen ? 'lg:col-span-2' : 'lg:col-span-3'} border border-gray-200 rounded-2xl bg-white overflow-hidden flex flex-col`}>
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-600">
                        <div className="col-span-4">Tên / Nhóm</div>
                        <div className="col-span-3">Key</div>
                        <div className="col-span-2">Kiểu</div>
                        <div className="col-span-1 text-center">Bắt buộc</div>
                        <div className="col-span-1 text-center">Bật</div>
                        <div className="col-span-1 text-right">Hành động</div>
                    </div>

                    <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                        {isLoading ? (
                            <div className="p-4 text-sm text-gray-600">Đang tải...</div>
                        ) : filtered.length === 0 ? (
                            <div className="p-4 text-sm text-gray-600">Chưa có trường tuỳ chỉnh nào.</div>
                        ) : (
                            filtered.map((f) => (
                                <div
                                    key={f.id}
                                    className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-gray-100 items-center hover:bg-gray-50"
                                >
                                    <div className="col-span-4">
                                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                            <GripVertical className="w-4 h-4 text-gray-300" />
                                            {f.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Nhóm: {f.group?.trim() ? f.group : 'Mặc định'}
                                        </div>
                                    </div>
                                    <div className="col-span-3 font-mono text-xs text-gray-700 break-all">{f.key}</div>
                                    <div className="col-span-2 text-sm text-gray-700">{FIELD_TYPE_LABEL[f.fieldType]}</div>
                                    <div className="col-span-1 text-center text-sm">{f.isRequired ? '✓' : ''}</div>
                                    <div className="col-span-1 text-center text-sm">{f.isActive ? '✓' : ''}</div>
                                    <div className="col-span-1 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(f)}
                                            className="p-2 rounded-xl hover:bg-gray-100"
                                            aria-label="Sửa"
                                            title="Sửa"
                                        >
                                            <Pencil className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void handleDelete(f)}
                                            className="p-2 rounded-xl hover:bg-red-50"
                                            aria-label="Xóa"
                                            title="Xóa"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Form panel bên phải - Chiếm 1/3 khi mở */}
                {isModalOpen && (
                    <div className="lg:col-span-1 border border-gray-200 rounded-2xl bg-white overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {editing ? 'Sửa trường' : 'Thêm trường'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Áp dụng cho: {entityType === 'TASK' ? 'Công việc' : 'Dự án'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="p-2 rounded-xl hover:bg-gray-100"
                                aria-label="Đóng"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tên trường</label>
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-zf-accent outline-none"
                                        placeholder="Ví dụ: Loại công việc"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Key (mã)</label>
                                    <input
                                        value={form.key}
                                        onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-zf-accent outline-none font-mono text-sm"
                                        placeholder="Ví dụ: task_type"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nhóm / Phân loại</label>
                                    <input
                                        value={form.group}
                                        onChange={(e) => setForm((p) => ({ ...p, group: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-zf-accent outline-none"
                                        placeholder="Ví dụ: Phân loại"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Kiểu dữ liệu</label>
                                    <select
                                        value={form.fieldType}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                fieldType: e.target.value as FieldType,
                                                options: isSelectType(e.target.value as FieldType) ? p.options : [],
                                            }))
                                        }
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-zf-accent outline-none bg-white"
                                    >
                                        {Object.entries(FIELD_TYPE_LABEL).map(([k, v]) => (
                                            <option key={k} value={k}>
                                                {v}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả</label>
                                    <input
                                        value={form.description}
                                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-zf-accent outline-none"
                                        placeholder="Tuỳ chọn"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={form.isRequired}
                                        onChange={(e) => setForm((p) => ({ ...p, isRequired: e.target.checked }))}
                                        className="w-4 h-4 rounded border-gray-300 text-zf-accent focus:ring-zf-accent"
                                    />
                                    Bắt buộc
                                </label>
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                                        className="w-4 h-4 rounded border-gray-300 text-zf-accent focus:ring-zf-accent"
                                    />
                                    Đang bật
                                </label>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-semibold text-gray-700">Thứ tự</label>
                                    <input
                                        type="number"
                                        value={form.sortOrder}
                                        onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) || 0 }))}
                                        className="w-24 px-3 py-2 rounded-xl border border-gray-200"
                                    />
                                </div>
                            </div>

                            {isSelectType(form.fieldType) && (
                                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/60">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div>
                                            <div className="font-semibold text-gray-900">Tuỳ chọn</div>
                                            <div className="text-xs text-gray-500">
                                                Dùng cho kiểu {FIELD_TYPE_LABEL[form.fieldType]}.
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setForm((p) => ({
                                                    ...p,
                                                    options: [
                                                        ...p.options,
                                                        { label: '', value: '', color: '', sortOrder: p.options.length },
                                                    ],
                                                }))
                                            }
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold hover:bg-gray-50"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Thêm tuỳ chọn
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {form.options.length === 0 && (
                                            <div className="text-sm text-gray-600">Chưa có tuỳ chọn nào.</div>
                                        )}
                                        {form.options.map((opt, idx) => (
                                            <div key={opt.id ?? idx} className="flex items-center gap-2">
                                                <input
                                                    value={opt.label}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setForm((p) => ({
                                                            ...p,
                                                            options: p.options.map((o, i) =>
                                                                i === idx ? { ...o, label: value } : o,
                                                            ),
                                                        }));
                                                    }}
                                                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                                                    placeholder="Nhãn (ví dụ: Thiết kế)"
                                                />
                                                <input
                                                    value={opt.color ?? ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setForm((p) => ({
                                                            ...p,
                                                            options: p.options.map((o, i) =>
                                                                i === idx ? { ...o, color: value } : o,
                                                            ),
                                                        }));
                                                    }}
                                                    className="w-32 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-mono"
                                                    placeholder="#178AF3"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setForm((p) => ({
                                                            ...p,
                                                            options: p.options.filter((_, i) => i !== idx),
                                                        }));
                                                    }}
                                                    className="p-2 rounded-xl hover:bg-red-50"
                                                    title="Xóa tuỳ chọn"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-5 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-gray-100"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleSave()}
                                className="px-6 py-2.5 rounded-xl font-bold bg-zf-accent text-white hover:opacity-95"
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

