'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import ContentCard from '@/components/ui/ContentCard';

type OutsourcingStaff = {
    id: string;
    name: string;
    code?: string;
    position?: string;
    department?: string;
    discipline?: string;
    avatarUrl?: string;
    email?: string;
    phone?: string;
    address?: string;
    companyName?: string;
    companyTaxCode?: string;
    personalTaxCode?: string;
    bankAccount?: string;
    bankName?: string;
    skills?: string;
    experience?: string;
    certifications?: string;
    hourlyRate?: number;
    dailyRate?: number;
    monthlyRate?: number;
    rateType?: string;
    isActive: boolean;
    notes?: string;
};

type CashFlowType = 'INCOME' | 'EXPENSE';

type DocumentStatus = 'NONE' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | null;

type StaffCashFlow = {
    id: string;
    projectId: string;
    type: CashFlowType;
    category: string | null;
    description: string;
    amount: number;
    date: string | Date;
    quotationId: string | null;
    quotation?: { id: string; quotationNo: string } | null;
    project?: { id: string; name: string; projectNo: string } | null;
    paymentMilestoneNo?: number | null;
    paymentMilestonePercent?: number | null;
    paymentMilestoneTitle?: string | null;
    documentStatus?: DocumentStatus;
    documentNote?: string | null;
};

function getDocumentStatusLabel(status: DocumentStatus): { label: string; className: string } {
    switch (status) {
        case 'SUBMITTED':
            return {
                label: 'Đã nộp hồ sơ',
                className: 'bg-amber-50 text-amber-800 border border-amber-200',
            };
        case 'APPROVED':
            return {
                label: 'Đã duyệt / đủ điều kiện thanh toán',
                className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            };
        case 'REJECTED':
            return {
                label: 'Bị trả lại / cần bổ sung',
                className: 'bg-red-50 text-red-700 border border-red-200',
            };
        default:
            return {
                label: 'Chưa có hồ sơ',
                className: 'bg-gray-50 text-gray-600 border border-gray-200',
            };
    }
}

function getCashFlowTypeLabel(type: CashFlowType): string {
    return type === 'INCOME' ? 'Thu tiền' : 'Chi tiền';
}

function formatCurrency(amount: number | undefined | null): string {
    if (amount === undefined || amount === null || isNaN(amount)) return '-';
    return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
}

export default function OutsourcingStaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [staff, setStaff] = useState<OutsourcingStaff | null>(null);
    const [cashFlows, setCashFlows] = useState<StaffCashFlow[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingCashFlows, setLoadingCashFlows] = useState(true);

    useEffect(() => {
        void fetchStaff();
        void fetchCashFlows();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchStaff = async () => {
        try {
            const res = await fetch(`/api/outsourcing-staff/${id}`, {
                cache: 'no-store',
            });
            const result = await res.json();
            if (result.success) {
                setStaff(result.data);
            } else {
                alert(result.error || 'Không thể tải thông tin nhân sự');
            }
        } catch (error) {
            console.error('❌ Failed to fetch staff:', error);
            alert('Có lỗi xảy ra khi tải thông tin nhân sự');
        } finally {
            setLoading(false);
        }
    };

    const fetchCashFlows = async () => {
        try {
            const res = await fetch(`/api/outsourcing-staff/${id}/cashflows`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
            });
            const result = await res.json();
            if (result.success && Array.isArray(result.data)) {
                setCashFlows(result.data);
            } else {
                console.error('❌ Invalid staff cashflows response:', result);
                setCashFlows([]);
            }
        } catch (error) {
            console.error('❌ Failed to fetch staff cashflows:', error);
            setCashFlows([]);
        } finally {
            setLoadingCashFlows(false);
        }
    };

    const totalIncome = cashFlows
        .filter((cf) => cf.type === 'INCOME')
        .reduce((sum, cf) => sum + (cf.amount || 0), 0);
    const totalExpense = cashFlows
        .filter((cf) => cf.type === 'EXPENSE')
        .reduce((sum, cf) => sum + (cf.amount || 0), 0);
    const net = totalIncome - totalExpense;
    const totalCount = cashFlows.length;

    return (
        <div className="p-4 md:p-6 space-y-6">
            <PageHeader
                title={staff ? `Nhân sự: ${staff.name}` : 'Nhân sự'}
                description="Quản lý thông tin, hợp đồng và các đợt thanh toán của nhân sự outsource."
                icon="staff"
                actions={
                    <Link
                        href="/outsourcing-staff"
                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        ← Quay lại danh sách
                    </Link>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ContentCard className="lg:col-span-1">
                    {loading ? (
                        <div className="p-4 text-sm text-gray-500">Đang tải thông tin nhân sự...</div>
                    ) : !staff ? (
                        <div className="p-4 text-sm text-red-600">
                            Không tìm thấy nhân sự. Vui lòng quay lại danh sách.
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
                                    {staff.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={staff.avatarUrl}
                                            alt={staff.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-zf-graphite">
                                            {/* Icon đơn sắc thay cho emoji */}
                                            <svg
                                                width="28"
                                                height="28"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                aria-hidden="true"
                                            >
                                                <circle cx="12" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                                                <path
                                                    d="M6.5 19c.8-2.1 2.8-3.5 5.5-3.5s4.7 1.4 5.5 3.5"
                                                    stroke="currentColor"
                                                    strokeWidth="1.6"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-gray-900">{staff.name}</h2>
                                        {staff.code && (
                                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700">
                                                {staff.code}
                                            </span>
                                        )}
                                    </div>
                                    {staff.position && (
                                        <p className="text-sm text-gray-600 mt-0.5">{staff.position}</p>
                                    )}
                                    {staff.department && (
                                        <p className="text-xs text-gray-500 mt-0.5">{staff.department}</p>
                                    )}
                                    <p className="mt-2">
                                        <span
                                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                                staff.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {staff.isActive ? 'Đang hoạt động' : 'Ngừng hợp tác'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="border-t pt-3 space-y-3 text-sm">
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                        Thông tin liên hệ
                                    </h3>
                                    <dl className="space-y-1 text-gray-700">
                                        {staff.email && (
                                            <div className="flex">
                                                <dt className="w-24 text-gray-500">Email</dt>
                                                <dd className="flex-1">{staff.email}</dd>
                                            </div>
                                        )}
                                        {staff.phone && (
                                            <div className="flex">
                                                <dt className="w-24 text-gray-500">Điện thoại</dt>
                                                <dd className="flex-1">{staff.phone}</dd>
                                            </div>
                                        )}
                                        {staff.address && (
                                            <div className="flex">
                                                <dt className="w-24 text-gray-500">Địa chỉ</dt>
                                                <dd className="flex-1">{staff.address}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                        Công ty & thanh toán
                                    </h3>
                                    <dl className="space-y-1 text-gray-700">
                                        {staff.companyName && (
                                            <div className="flex">
                                                <dt className="w-24 text-gray-500">Công ty</dt>
                                                <dd className="flex-1">{staff.companyName}</dd>
                                            </div>
                                        )}
                                        {staff.companyTaxCode && (
                                            <div className="flex">
                                                <dt className="w-24 text-gray-500">MST CTY</dt>
                                                <dd className="flex-1">{staff.companyTaxCode}</dd>
                                            </div>
                                        )}
                                        {staff.personalTaxCode && (
                                            <div className="flex">
                                                <dt className="w-24 text-gray-500">MST CN</dt>
                                                <dd className="flex-1">{staff.personalTaxCode}</dd>
                                            </div>
                                        )}
                                        {staff.bankAccount && (
                                            <div className="flex">
                                                <dt className="w-24 text-gray-500">STK</dt>
                                                <dd className="flex-1">{staff.bankAccount}</dd>
                                            </div>
                                        )}
                                        {staff.bankName && (
                                            <div className="flex">
                                                <dt className="w-24 text-gray-500">Ngân hàng</dt>
                                                <dd className="flex-1">{staff.bankName}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                        Kỹ năng & ghi chú
                                    </h3>
                                    {staff.skills && (
                                        <p className="text-gray-700 text-sm mb-1">
                                            <span className="font-medium">Kỹ năng:</span> {staff.skills}
                                        </p>
                                    )}
                                    {staff.experience && (
                                        <p className="text-gray-700 text-sm mb-1">
                                            <span className="font-medium">Kinh nghiệm:</span> {staff.experience}
                                        </p>
                                    )}
                                    {staff.certifications && (
                                        <p className="text-gray-700 text-sm mb-1">
                                            <span className="font-medium">Chứng chỉ:</span> {staff.certifications}
                                        </p>
                                    )}
                                    {staff.notes && (
                                        <p className="text-gray-700 text-sm">
                                            <span className="font-medium">Ghi chú:</span> {staff.notes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </ContentCard>

                <ContentCard className="lg:col-span-2">
                    <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                                Các đợt thanh toán & hợp đồng liên quan
                            </h3>
                            <span className="text-xs text-gray-500">
                                {totalCount > 0 ? `${totalCount} đợt thanh toán` : 'Chưa có dòng tiền nào'}
                            </span>
                        </div>

                        {loadingCashFlows ? (
                            <div className="py-10 text-center text-gray-500 text-sm">
                                Đang tải dữ liệu thanh toán...
                            </div>
                        ) : cashFlows.length === 0 ? (
                            <div className="py-10 text-center text-gray-500 text-sm border border-dashed border-gray-300 rounded-xl">
                                Chưa có đợt thanh toán nào được liên kết với nhân sự này.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                        <div className="text-xs font-medium text-emerald-700 uppercase">
                                            Tổng thu cho nhân sự
                                        </div>
                                        <div className="mt-1 text-lg font-bold text-emerald-800">
                                            {formatCurrency(totalIncome)} đ
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                                        <div className="text-xs font-medium text-red-700 uppercase">
                                            Tổng chi cho nhân sự
                                        </div>
                                        <div className="mt-1 text-lg font-bold text-red-800">
                                            {formatCurrency(totalExpense)} đ
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                        <div className="flex items-center justify-between text-xs font-medium text-gray-600 uppercase">
                                            <span>Dòng tiền ròng</span>
                                            <span className="text-[11px]">{totalCount} đợt thanh toán</span>
                                        </div>
                                        <div
                                            className={`mt-1 text-lg font-bold ${
                                                net >= 0 ? 'text-emerald-700' : 'text-red-700'
                                            }`}
                                        >
                                            {formatCurrency(net)} đ
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="min-w-full text-xs md:text-sm text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 font-bold text-gray-600 whitespace-nowrap">
                                                    Ngày
                                                </th>
                                                <th className="px-4 py-3 font-bold text-gray-600 whitespace-nowrap">
                                                    Dự án
                                                </th>
                                                <th className="px-4 py-3 font-bold text-gray-600 whitespace-nowrap">
                                                    Hợp đồng / Báo giá
                                                </th>
                                                <th className="px-4 py-3 font-bold text-gray-600 whitespace-nowrap">
                                                    Đợt thanh toán
                                                </th>
                                                <th className="px-4 py-3 font-bold text-gray-600 whitespace-nowrap">
                                                    Diễn giải
                                                </th>
                                                <th className="px-4 py-3 font-bold text-gray-600 text-right whitespace-nowrap">
                                                    Loại
                                                </th>
                                                <th className="px-4 py-3 font-bold text-gray-600 text-right whitespace-nowrap">
                                                    Số tiền (VNĐ)
                                                </th>
                                                <th className="px-4 py-3 font-bold text-gray-600 whitespace-nowrap">
                                                    Hồ sơ
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {cashFlows.map((cf) => {
                                                const statusInfo = getDocumentStatusLabel(
                                                    (cf.documentStatus ?? 'NONE') as DocumentStatus,
                                                );
                                                const dateLabel = new Date(cf.date).toLocaleDateString('vi-VN');
                                                return (
                                                    <tr key={cf.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 align-top whitespace-nowrap text-gray-700">
                                                            {dateLabel}
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            {cf.project ? (
                                                                <div className="space-y-0.5">
                                                                    <Link
                                                                        href={`/projects/${cf.project.id}`}
                                                                        className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                                                                    >
                                                                        {cf.project.name}
                                                                    </Link>
                                                                    <div className="text-xs text-gray-500">
                                                                        {cf.project.projectNo}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400">Không rõ dự án</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            {cf.quotation ? (
                                                                <Link
                                                                    href={`/quotations/${cf.quotation.id}/edit`}
                                                                    className="inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 hover:text-blue-800"
                                                                >
                                                                    BG: {cf.quotation.quotationNo}
                                                                </Link>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">
                                                                    Chưa gắn báo giá
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            {cf.paymentMilestoneNo ? (
                                                                <div className="space-y-0.5">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        Đợt {cf.paymentMilestoneNo}
                                                                        {cf.paymentMilestonePercent
                                                                            ? ` – ${cf.paymentMilestonePercent}%`
                                                                            : ''}
                                                                    </div>
                                                                    {cf.paymentMilestoneTitle && (
                                                                        <div className="text-xs text-gray-500">
                                                                            {cf.paymentMilestoneTitle}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">
                                                                    Không gắn mốc thanh toán
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            <div className="text-sm text-gray-800">
                                                                {cf.description}
                                                            </div>
                                                            {cf.category && (
                                                                <div className="text-xs text-gray-500 mt-0.5">
                                                                    Nhóm: {cf.category}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 align-top text-right text-xs font-semibold">
                                                            <span
                                                                className={
                                                                    cf.type === 'INCOME'
                                                                        ? 'text-emerald-600'
                                                                        : 'text-red-600'
                                                                }
                                                            >
                                                                {getCashFlowTypeLabel(cf.type)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 align-top text-right font-mono text-sm text-gray-900">
                                                            {formatCurrency(cf.amount)}
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            <div
                                                                className={`inline-flex px-2 py-1 rounded-full text-[11px] font-medium ${statusInfo.className}`}
                                                            >
                                                                {statusInfo.label}
                                                            </div>
                                                            {cf.documentNote && (
                                                                <div className="mt-1 text-xs text-gray-600 max-w-xs">
                                                                    {cf.documentNote}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </ContentCard>
            </div>
        </div>
    );
}

