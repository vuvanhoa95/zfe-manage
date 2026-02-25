'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { formatVND } from '@/lib/number-to-words-vn';
import {
    RefreshCw,
    Plus,
    Search,
    X,
    FolderOpen,
    DollarSign,
    Calendar,
    Building2,
    CheckCircle2,
    FileText,
    Layers,
    PlayCircle,
    XCircle,
    Upload,
    Download,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type Project = {
    id: string;
    projectNo: string;
    name: string;
    code?: string;
    description?: string;
    imageUrl?: string;
    customer: {
        id: string;
        name: string;
    } | null;
    location: string;
    startDate?: string;
    endDate?: string;
    totalArea?: number;
    totalBudget: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    status: string;
    notes?: string;
    createdAt: string;
    _count: {
        quotations: number;
        cashFlows: number;
    };
};

const getProjectImageUrl = (imageUrl?: string | null): string | null => {
    if (!imageUrl) return null;

    const trimmed = imageUrl.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('http')) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;

    return `/${trimmed}`;
};

export default function ProjectTab() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [yearFilter, setYearFilter] = useState<string>('');
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        fetchProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, yearFilter]);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            let url = '/api/projects?';
            if (statusFilter) url += `status=${statusFilter}&`;
            if (yearFilter) url += `year=${yearFilter}&`;
            if (searchQuery) url += `search=${searchQuery}&`;

            const res = await fetch(url, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const result = (await res.json()) as { success?: boolean; data?: Project[] } | unknown;

            if (
                result &&
                typeof result === 'object' &&
                'success' in result &&
                (result as { success?: boolean }).success === true &&
                'data' in result &&
                Array.isArray((result as { data?: Project[] }).data)
            ) {
                setProjects((result as { data: Project[] }).data);
            } else {
                console.error('API returned unexpected payload when fetching projects:', result);
                setProjects([]);
            }
        } catch (err: unknown) {
            console.error('❌ Failed to fetch projects:', err);
            if (err instanceof Error) {
                console.error('Error details:', err.message, err.stack);
            }
            setProjects([]);
        } finally {
            setIsLoading(false);
        }
    };

    const statusConfig: Record<
        string,
        { label: string; badgeClass: string; cardClass: string }
    > = {
        PLANNING: {
            label: 'Lập kế hoạch',
            badgeClass: 'bg-gray-100 text-gray-800',
            cardClass: 'bg-white border-zf-bg-secondary border-l-gray-300',
        },
        ACTIVE: {
            label: 'Đang thực hiện',
            badgeClass: 'bg-blue-100 text-blue-800',
            cardClass: 'bg-blue-50 border-blue-200 border-l-blue-500',
        },
        COMPLETED: {
            label: 'Hoàn thành',
            badgeClass: 'bg-green-100 text-green-800',
            cardClass: 'bg-green-50 border-green-200 border-l-green-500',
        },
        CANCELLED: {
            label: 'Đã hủy',
            badgeClass: 'bg-red-100 text-red-800',
            cardClass: 'bg-red-50 border-red-200 border-l-red-500',
        },
    };

    const filteredProjects = projects.filter((project) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            project.name.toLowerCase().includes(query) ||
            project.code?.toLowerCase().includes(query) ||
            project.projectNo.toLowerCase().includes(query) ||
            project.customer?.name?.toLowerCase().includes(query) ||
            false
        );
    });

    const summary = {
        total: filteredProjects.length,
        hasQuotations: filteredProjects.filter((p) => (p._count?.quotations ?? 0) > 0).length,
        active: filteredProjects.filter((p) => p.status === 'ACTIVE').length,
        completed: filteredProjects.filter((p) => p.status === 'COMPLETED').length,
        cancelled: filteredProjects.filter((p) => p.status === 'CANCELLED').length,
    };

    return (
        <div className="h-full flex flex-col bg-zf-bg-tertiary px-4 py-4 md:px-6 md:py-5 overflow-y-auto">
            <div className="w-full space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="inline-flex items-center gap-1 rounded-full bg-zf-bg-secondary px-3 py-1 text-zf-text-secondary">
                            <Layers className="w-3 h-3" />
                            <span className="font-medium">Tổng dự án:</span>
                            <span className="font-semibold text-zf-text-primary">{summary.total}</span>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-zf-bg-secondary px-3 py-1 text-zf-text-secondary">
                            <FileText className="w-3 h-3" />
                            <span className="font-medium">Có báo giá:</span>
                            <span className="font-semibold text-zf-text-primary">{summary.hasQuotations}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setStatusFilter((prev) => (prev === 'ACTIVE' ? '' : 'ACTIVE'))
                            }
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 border text-xs transition-colors ${
                                statusFilter === 'ACTIVE'
                                    ? 'bg-blue-600 text-white border-blue-700'
                                    : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                            }`}
                        >
                            <PlayCircle className="w-3 h-3" />
                            <span className="font-medium">Đang triển khai:</span>
                            <span className="font-semibold">{summary.active}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setStatusFilter((prev) => (prev === 'COMPLETED' ? '' : 'COMPLETED'))
                            }
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 border text-xs transition-colors ${
                                statusFilter === 'COMPLETED'
                                    ? 'bg-green-600 text-white border-green-700'
                                    : 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'
                            }`}
                        >
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="font-medium">Hoàn thành:</span>
                            <span className="font-semibold">{summary.completed}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setStatusFilter((prev) => (prev === 'CANCELLED' ? '' : 'CANCELLED'))
                            }
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 border text-xs transition-colors ${
                                statusFilter === 'CANCELLED'
                                    ? 'bg-red-600 text-white border-red-700'
                                    : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                            }`}
                        >
                            <XCircle className="w-3 h-3" />
                            <span className="font-medium">Đã hủy:</span>
                            <span className="font-semibold">{summary.cancelled}</span>
                        </button>
                    </div>
                    <div className="flex justify-end items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={async (event) => {
                                const file = event.target.files?.[0];
                                if (!file) return;

                                try {
                                    setIsImporting(true);
                                    const buffer = await file.arrayBuffer();
                                    const workbook = XLSX.read(buffer, { type: 'array' });
                                    const firstSheetName = workbook.SheetNames[0];
                                    const sheet = workbook.Sheets[firstSheetName];
                                    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
                                        header: 1,
                                        defval: '',
                                    }) as string[][];

                                    if (!rows || rows.length < 2) {
                                        alert('File Excel không có dữ liệu hợp lệ.');
                                        return;
                                    }

                                    const [header, ...dataRows] = rows;
                                    const getColIndex = (label: string) =>
                                        header.findIndex(
                                            (cell) => String(cell).trim().toLowerCase() === label.toLowerCase(),
                                        );

                                    const nameIdx = getColIndex('Tên dự án');
                                    if (nameIdx === -1) {
                                        alert(
                                            'Không tìm thấy cột "Tên dự án". Vui lòng dùng template đúng định dạng (Tên dự án, Mã dự án, Địa điểm, Ngày bắt đầu, Ngày kết thúc, Diện tích, Ghi chú).',
                                        );
                                        return;
                                    }

                                    const codeIdx = getColIndex('Mã dự án');
                                    const locationIdx = getColIndex('Địa điểm');
                                    const startIdx = getColIndex('Ngày bắt đầu');
                                    const endIdx = getColIndex('Ngày kết thúc');
                                    const areaIdx = getColIndex('Diện tích');
                                    const notesIdx = getColIndex('Ghi chú');

                                    const payloads = dataRows
                                        .map((row) => {
                                            const name = String(row[nameIdx] ?? '').trim();
                                            if (!name) return null;

                                            const rawStart = startIdx >= 0 ? String(row[startIdx] ?? '').trim() : '';
                                            const rawEnd = endIdx >= 0 ? String(row[endIdx] ?? '').trim() : '';

                                            const parseDate = (value: string): string | null => {
                                                if (!value) return null;
                                                const parsed = new Date(value);
                                                if (Number.isNaN(parsed.getTime())) return null;
                                                return parsed.toISOString();
                                            };

                                            const totalArea =
                                                areaIdx >= 0
                                                    ? Number.parseFloat(String(row[areaIdx] ?? '').replace(',', '.'))
                                                    : undefined;

                                            return {
                                                name,
                                                code: codeIdx >= 0 ? String(row[codeIdx] ?? '').trim() || undefined : undefined,
                                                location:
                                                    locationIdx >= 0
                                                        ? String(row[locationIdx] ?? '').trim() || 'Hà Nội'
                                                        : 'Hà Nội',
                                                startDate: parseDate(rawStart),
                                                endDate: parseDate(rawEnd),
                                                totalArea: Number.isFinite(totalArea || NaN) ? totalArea : undefined,
                                                notes:
                                                    notesIdx >= 0 ? String(row[notesIdx] ?? '').trim() || undefined : undefined,
                                            };
                                        })
                                        .filter(Boolean) as Array<Record<string, unknown>>;

                                    if (payloads.length === 0) {
                                        alert('Không có dòng dữ liệu hợp lệ để import.');
                                        return;
                                    }

                                    for (const body of payloads) {
                                        const res = await fetch('/api/projects', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify(body),
                                        });

                                        // Không dừng toàn bộ nếu 1 dòng lỗi, chỉ log
                                        if (!res.ok) {
                                            console.error('Import project failed for row:', body, await res.json().catch(() => ({})));
                                        }
                                    }

                                    await fetchProjects();
                                    alert(`Import hoàn tất. Đã xử lý ${payloads.length} dòng dữ liệu.`);
                                } catch (error) {
                                    console.error('Lỗi khi import Excel dự án:', error);
                                    alert('Đã xảy ra lỗi khi import Excel. Vui lòng kiểm tra lại file và thử lại.');
                                } finally {
                                    setIsImporting(false);
                                    if (event.target) {
                                        event.target.value = '';
                                    }
                                }
                            }}
                        />

                        <button
                            type="button"
                            onClick={async () => {
                                const overviewRows: (string | number | null | undefined)[][] = [];

                                overviewRows.push([
                                    'Tên dự án',
                                    'Mã dự án',
                                    'Địa điểm',
                                    'Ngày bắt đầu',
                                    'Ngày kết thúc',
                                    'Diện tích',
                                    'Giá trị báo giá (đã VAT)',
                                    'Ghi chú',
                                ]);

                                filteredProjects.forEach((project) => {
                                    overviewRows.push([
                                        project.name,
                                        project.code || '',
                                        project.location || '',
                                        project.startDate
                                            ? new Date(project.startDate).toLocaleDateString('vi-VN')
                                            : '',
                                        project.endDate
                                            ? new Date(project.endDate).toLocaleDateString('vi-VN')
                                            : '',
                                        project.totalArea ?? '',
                                        project.totalRevenue ?? '',
                                        project.notes || '',
                                    ]);
                                });

                                const wb = XLSX.utils.book_new();

                                const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
                                wsOverview['!cols'] = [
                                    { wch: 40 },
                                    { wch: 20 },
                                    { wch: 25 },
                                    { wch: 15 },
                                    { wch: 15 },
                                    { wch: 10 },
                                    { wch: 20 },
                                    { wch: 40 },
                                ];
                                XLSX.utils.book_append_sheet(wb, wsOverview, 'Du_an');

                                // Sheet 2: Chi tiết thanh toán & outsource (từ cashflow)
                                const cashflowRows: (string | number | null | undefined)[][] = [];
                                cashflowRows.push([
                                    'Mã dự án',
                                    'Tên dự án',
                                    'Loại',
                                    'Nhóm',
                                    'Mô tả',
                                    'Giá trị (VNĐ)',
                                    'Ngày',
                                    'Số báo giá',
                                ]);

                                for (const project of filteredProjects) {
                                    try {
                                        const res = await fetch(`/api/projects/${project.id}/cashflows`, {
                                            cache: 'no-store',
                                        });
                                        if (!res.ok) {
                                            // Không chặn export toàn bộ nếu 1 dự án lỗi
                                            console.error('Không thể tải cashflow cho dự án', project.id);
                                            continue;
                                        }
                                        const result = (await res.json()) as {
                                            success?: boolean;
                                            data?: unknown;
                                        };
                                        if (!result.success || !Array.isArray(result.data)) continue;

                                        type CashFlowForExport = {
                                            type?: string | null;
                                            category?: string | null;
                                            description?: string | null;
                                            amount?: number | null;
                                            date?: string | null;
                                            quotation?: {
                                                quotationNo?: string | null;
                                            } | null;
                                        };

                                        const cashFlows = result.data as CashFlowForExport[];

                                        cashFlows.forEach((cf) => {
                                            cashflowRows.push([
                                                project.projectNo,
                                                project.name,
                                                cf.type === 'INCOME' ? 'Thu' : 'Chi',
                                                cf.category || '',
                                                cf.description || '',
                                                cf.amount ?? 0,
                                                cf.date ? new Date(cf.date).toLocaleDateString('vi-VN') : '',
                                                cf.quotation?.quotationNo || '',
                                            ]);
                                        });
                                    } catch (error) {
                                        console.error('Lỗi khi tải cashflow cho dự án', project.id, error);
                                    }
                                }

                                if (cashflowRows.length > 1) {
                                    const wsCash = XLSX.utils.aoa_to_sheet(cashflowRows);
                                    wsCash['!cols'] = [
                                        { wch: 15 },
                                        { wch: 35 },
                                        { wch: 8 },
                                        { wch: 20 },
                                        { wch: 50 },
                                        { wch: 18 },
                                        { wch: 12 },
                                        { wch: 18 },
                                    ];
                                    XLSX.utils.book_append_sheet(wb, wsCash, 'Thanh_toan_Outsource');
                                }

                                const today = new Date().toISOString().slice(0, 10);
                                XLSX.writeFile(wb, `DuAn_${today}.xlsx`);
                            }}
                            className="p-2.5 bg-white text-zf-text-primary rounded-full border border-zf-bg-secondary hover:bg-zf-bg-secondary transition-colors flex items-center justify-center"
                            title="Xuất danh sách dự án ra Excel (theo bộ lọc hiện tại)"
                        >
                            <Download className="w-4 h-4" />
                            <span className="sr-only">Xuất Excel</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className="p-2.5 bg-white text-zf-text-primary rounded-full border border-zf-bg-secondary hover:bg-zf-bg-secondary disabled:opacity-60 transition-colors flex items-center justify-center"
                            title="Nhập danh sách dự án từ file Excel"
                        >
                            <Upload className={`w-4 h-4 ${isImporting ? 'animate-pulse' : ''}`} />
                            <span className="sr-only">
                                {isImporting ? 'Đang nhập dữ liệu từ Excel' : 'Nhập Excel'}
                            </span>
                        </button>

                        <button
                            onClick={fetchProjects}
                            disabled={isLoading}
                            className="p-2.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center justify-center"
                            title="Làm mới dữ liệu danh sách dự án"
                        >
                            <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                            <span className="sr-only">Làm mới danh sách dự án</span>
                        </button>
                        <Link
                            href="/projects/new"
                            className="p-2.5 bg-zf-accent text-white rounded-full shadow-lg shadow-zf-accent/20 hover:scale-105 transition-transform flex items-center justify-center"
                            title="Tạo dự án mới"
                        >
                            <Plus className="w-5 h-5 text-white" />
                            <span className="sr-only">Tạo dự án mới</span>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-zf-bg-secondary p-2.5 md:p-3 space-y-2.5">
                    <div className="flex gap-3 flex-wrap">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchProjects()}
                                placeholder="Tìm kiếm theo tên, mã dự án, khách hàng..."
                                className="w-full px-3 py-2.5 pl-10 bg-zf-bg-secondary border-none rounded-lg focus:ring-2 focus:ring-zf-accent text-zf-text-primary text-sm font-medium placeholder:text-zf-text-secondary"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zf-text-secondary" />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        fetchProjects();
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zf-text-secondary hover:text-zf-error transition-colors p-1"
                                    title="Xóa tìm kiếm"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="w-44">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2.5 bg-zf-bg-secondary border-none rounded-lg focus:ring-2 focus:ring-zf-accent text-zf-text-primary text-sm font-medium"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="PLANNING">Lập kế hoạch</option>
                                <option value="ACTIVE">Đang thực hiện</option>
                                <option value="COMPLETED">Hoàn thành</option>
                                <option value="CANCELLED">Đã hủy</option>
                            </select>
                        </div>
                        <div className="w-36">
                            <select
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="w-full px-3 py-2.5 bg-zf-bg-secondary border-none rounded-lg focus:ring-2 focus:ring-zf-accent text-zf-text-primary text-sm font-medium"
                            >
                                <option value="">Tất cả năm</option>
                                {Array.from({ length: 6 }).map((_, idx) => {
                                    const currentYear = new Date().getFullYear();
                                    const year = currentYear - idx;
                                    return (
                                        <option key={year} value={year.toString()}>
                                            Năm {year}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                    {searchQuery && (
                        <div className="text-sm text-zf-text-secondary">
                            Tìm thấy <span className="font-bold text-zf-accent">{filteredProjects.length}</span> dự án
                        </div>
                    )}
                </div>

                {/* Projects List */}
                {isLoading ? (
                    <div className="p-10 text-center text-zf-text-secondary bg-white rounded-3xl border border-zf-bg-secondary">
                        Đang tải dữ liệu...
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-zf-bg-tertiary">
                        <p className="text-zf-text-secondary italic">Chưa có dự án nào.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredProjects.map((project, index) => {
                            const status = statusConfig[project.status] || statusConfig.PLANNING;
                            const orderNumber = index + 1;
                            return (
                                <div
                                    key={project.id}
                                    className={`p-6 rounded-3xl shadow-sm border border-l-4 hover:shadow-md transition-all flex gap-4 ${status.cardClass}`}
                                >
                                    {/* Số thứ tự dự án */}
                                    <div className="flex items-start">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-zf-bg-secondary text-zf-text-primary font-bold text-lg">
                                            {orderNumber}
                                        </div>
                                    </div>

                                    <div className="flex-1 flex justify-between items-stretch gap-4">
                                        {/* Cột trái: hình ảnh chiếm toàn bộ chiều cao phần nội dung */}
                                        <div className="w-40 md:w-52 rounded-2xl overflow-hidden bg-zf-bg-secondary border border-zf-bg-tertiary flex-shrink-0 flex items-center justify-center">
                                            {getProjectImageUrl(project.imageUrl) ? (
                                                <Image
                                                    src={getProjectImageUrl(project.imageUrl) as string}
                                                    alt="Hình ảnh dự án"
                                                    width={260}
                                                    height={200}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="px-3 text-xs text-zf-text-secondary text-center leading-snug">
                                                    Chưa có hình ảnh
                                                </span>
                                            )}
                                        </div>

                                        {/* Cột phải: toàn bộ nội dung text */}
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FolderOpen className="w-5 h-5 text-zf-text-secondary" />
                                                <Link
                                                    href={`/projects/${project.id}`}
                                                    className="text-xl font-bold text-zf-primary hover:text-zf-accent transition-colors line-clamp-1"
                                                >
                                                    {project.name}
                                                </Link>
                                                <span className="text-sm font-mono text-zf-text-secondary">
                                                    {project.projectNo}
                                                </span>
                                                {project.code && (
                                                    <span className="text-sm text-zf-text-secondary">
                                                        ({project.code})
                                                    </span>
                                                )}
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold ${status.badgeClass}`}
                                                >
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                <div>
                                                    <div className="text-xs text-zf-text-secondary uppercase mb-1">
                                                        Khách hàng
                                                    </div>
                                                    <div className="font-medium text-zf-text-primary">
                                                        {project.customer?.name || 'Chưa có'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-zf-text-secondary uppercase mb-1">
                                                        Địa điểm
                                                    </div>
                                                    <div className="font-medium text-zf-text-primary flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        {project.location}
                                                    </div>
                                                </div>
                                                {project.startDate && (
                                                    <div>
                                                        <div className="text-xs text-zf-text-secondary uppercase mb-1">
                                                            Ngày bắt đầu
                                                        </div>
                                                        <div className="font-medium text-zf-text-primary flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {new Date(project.startDate).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    </div>
                                                )}
                                                {project.totalArea && (
                                                    <div>
                                                        <div className="text-xs text-zf-text-secondary uppercase mb-1">
                                                            Diện tích
                                                        </div>
                                                        <div className="font-medium text-zf-text-primary">
                                                            {project.totalArea.toLocaleString('vi-VN')} m²
                                                        </div>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-xs text-zf-text-secondary uppercase mb-1">
                                                        Ngày tạo
                                                    </div>
                                                    <div className="font-medium text-zf-text-primary flex items-center gap-1">
                                                        {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-zf-bg-tertiary">
                                                <div>
                                                    <div className="text-xs text-zf-text-secondary uppercase mb-1">
                                                        Ngân sách
                                                    </div>
                                                    <div className="font-bold text-zf-text-primary">
                                                        {formatVND(project.totalBudget)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-zf-text-secondary uppercase mb-1">
                                                        Doanh thu
                                                    </div>
                                                    <div className="font-bold text-green-600">
                                                        {formatVND(project.totalRevenue)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-zf-text-secondary uppercase mb-1">
                                                        Chi phí
                                                    </div>
                                                    <div className="font-bold text-red-600">
                                                        {formatVND(project.totalCost)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-zf-text-secondary uppercase mb-1">
                                                        Lợi nhuận
                                                    </div>
                                                    <div
                                                        className={`font-bold ${
                                                            project.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}
                                                    >
                                                        {formatVND(project.totalProfit)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 mt-4 text-sm text-zf-text-secondary">
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    {project._count.quotations} báo giá
                                                </span>
                                                <span>•</span>
                                                <span>{project._count.cashFlows} dòng tiền</span>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
