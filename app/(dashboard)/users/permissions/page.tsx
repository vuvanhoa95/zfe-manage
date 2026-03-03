'use client';

import { useSession } from 'next-auth/react';
import { can, getRoleLabel, getRoleBadgeStyle, getAllPermissions, type Permission, type SystemRole } from '@/lib/rbac';

// Ma trận hiển thị theo nhóm chức năng
const PERMISSION_MATRIX: {
    group: string;
    icon: string;
    rows: {
        label: string;
        description?: string;
        permissions: { role: SystemRole; permission: Permission }[];
    }[];
}[] = [
    {
        group: 'Điều hướng (Menu)',
        icon: '🗺️',
        rows: [
            {
                label: 'Tổng quan Dashboard',
                permissions: [
                    { role: 'ADMIN', permission: 'nav:dashboard' },
                    { role: 'PM',    permission: 'nav:dashboard' },
                    { role: 'USER',  permission: 'nav:dashboard' },
                ],
            },
            {
                label: 'Dự án',
                permissions: [
                    { role: 'ADMIN', permission: 'nav:projects' },
                    { role: 'PM',    permission: 'nav:projects' },
                    { role: 'USER',  permission: 'nav:projects' },
                ],
            },
            {
                label: 'Báo giá',
                permissions: [
                    { role: 'ADMIN', permission: 'nav:quotations' },
                    { role: 'PM',    permission: 'nav:quotations' },
                    { role: 'USER',  permission: 'nav:quotations' },
                ],
            },
            {
                label: 'Khách hàng',
                permissions: [
                    { role: 'ADMIN', permission: 'nav:customers' },
                    { role: 'PM',    permission: 'nav:customers' },
                    { role: 'USER',  permission: 'nav:customers' },
                ],
            },
            {
                label: 'Nhân sự ngoài',
                permissions: [
                    { role: 'ADMIN', permission: 'nav:outsourcing_staff' },
                    { role: 'PM',    permission: 'nav:outsourcing_staff' },
                    { role: 'USER',  permission: 'nav:outsourcing_staff' },
                ],
            },
            {
                label: 'Báo cáo',
                permissions: [
                    { role: 'ADMIN', permission: 'nav:reports' },
                    { role: 'PM',    permission: 'nav:reports' },
                    { role: 'USER',  permission: 'nav:reports' },
                ],
            },
            {
                label: 'Quản lý User',
                description: 'Chỉ Admin mới thấy menu này',
                permissions: [
                    { role: 'ADMIN', permission: 'nav:users' },
                    { role: 'PM',    permission: 'nav:users' },
                    { role: 'USER',  permission: 'nav:users' },
                ],
            },
            {
                label: 'Hồ sơ công ty',
                permissions: [
                    { role: 'ADMIN', permission: 'nav:company_profile' },
                    { role: 'PM',    permission: 'nav:company_profile' },
                    { role: 'USER',  permission: 'nav:company_profile' },
                ],
            },
            {
                label: 'Cài đặt hệ thống',
                permissions: [
                    { role: 'ADMIN', permission: 'nav:settings' },
                    { role: 'PM',    permission: 'nav:settings' },
                    { role: 'USER',  permission: 'nav:settings' },
                ],
            },
        ],
    },
    {
        group: 'Dashboard & Tài chính',
        icon: '📊',
        rows: [
            {
                label: 'Xem Dashboard',
                permissions: [
                    { role: 'ADMIN', permission: 'dashboard:view' },
                    { role: 'PM',    permission: 'dashboard:view' },
                    { role: 'USER',  permission: 'dashboard:view' },
                ],
            },
            {
                label: 'Xem số liệu tài chính',
                description: 'Doanh thu, chi phí, lợi nhuận tổng hợp',
                permissions: [
                    { role: 'ADMIN', permission: 'dashboard:view_financials' },
                    { role: 'PM',    permission: 'dashboard:view_financials' },
                    { role: 'USER',  permission: 'dashboard:view_financials' },
                ],
            },
            {
                label: 'Xem tất cả dự án',
                description: 'USER chỉ thấy dự án mình tham gia',
                permissions: [
                    { role: 'ADMIN', permission: 'dashboard:view_all_projects' },
                    { role: 'PM',    permission: 'dashboard:view_all_projects' },
                    { role: 'USER',  permission: 'dashboard:view_all_projects' },
                ],
            },
        ],
    },
    {
        group: 'Quản lý Dự án',
        icon: '🏗️',
        rows: [
            {
                label: 'Tạo dự án mới',
                permissions: [
                    { role: 'ADMIN', permission: 'project:create' },
                    { role: 'PM',    permission: 'project:create' },
                    { role: 'USER',  permission: 'project:create' },
                ],
            },
            {
                label: 'Chỉnh sửa dự án',
                description: 'USER chỉ sửa dự án mình tạo',
                permissions: [
                    { role: 'ADMIN', permission: 'project:edit' },
                    { role: 'PM',    permission: 'project:edit' },
                    { role: 'USER',  permission: 'project:edit' },
                ],
            },
            {
                label: 'Xóa dự án',
                permissions: [
                    { role: 'ADMIN', permission: 'project:delete' },
                    { role: 'PM',    permission: 'project:delete' },
                    { role: 'USER',  permission: 'project:delete' },
                ],
            },
            {
                label: 'Quản lý thành viên',
                permissions: [
                    { role: 'ADMIN', permission: 'project:manage_members' },
                    { role: 'PM',    permission: 'project:manage_members' },
                    { role: 'USER',  permission: 'project:manage_members' },
                ],
            },
            {
                label: 'Xem tài chính dự án',
                description: 'Ngân sách, doanh thu, chi phí của dự án',
                permissions: [
                    { role: 'ADMIN', permission: 'project:view_financials' },
                    { role: 'PM',    permission: 'project:view_financials' },
                    { role: 'USER',  permission: 'project:view_financials' },
                ],
            },
        ],
    },
    {
        group: 'Báo giá',
        icon: '📄',
        rows: [
            {
                label: 'Tạo báo giá',
                permissions: [
                    { role: 'ADMIN', permission: 'quotation:create' },
                    { role: 'PM',    permission: 'quotation:create' },
                    { role: 'USER',  permission: 'quotation:create' },
                ],
            },
            {
                label: 'Chỉnh sửa báo giá',
                description: 'USER chỉ sửa báo giá mình tạo',
                permissions: [
                    { role: 'ADMIN', permission: 'quotation:edit' },
                    { role: 'PM',    permission: 'quotation:edit' },
                    { role: 'USER',  permission: 'quotation:edit_own' },
                ],
            },
            {
                label: 'Xóa báo giá',
                permissions: [
                    { role: 'ADMIN', permission: 'quotation:delete' },
                    { role: 'PM',    permission: 'quotation:delete' },
                    { role: 'USER',  permission: 'quotation:delete' },
                ],
            },
            {
                label: 'Phê duyệt báo giá',
                description: 'Đặt trạng thái ACCEPTED',
                permissions: [
                    { role: 'ADMIN', permission: 'quotation:approve' },
                    { role: 'PM',    permission: 'quotation:approve' },
                    { role: 'USER',  permission: 'quotation:approve' },
                ],
            },
            {
                label: 'Xuất PDF/DOCX',
                permissions: [
                    { role: 'ADMIN', permission: 'quotation:export' },
                    { role: 'PM',    permission: 'quotation:export' },
                    { role: 'USER',  permission: 'quotation:export' },
                ],
            },
            {
                label: 'Quản lý mẫu báo giá',
                permissions: [
                    { role: 'ADMIN', permission: 'quotation:manage_templates' },
                    { role: 'PM',    permission: 'quotation:manage_templates' },
                    { role: 'USER',  permission: 'quotation:manage_templates' },
                ],
            },
        ],
    },
    {
        group: 'Công việc (Tasks)',
        icon: '✅',
        rows: [
            {
                label: 'Tạo task',
                permissions: [
                    { role: 'ADMIN', permission: 'task:create' },
                    { role: 'PM',    permission: 'task:create' },
                    { role: 'USER',  permission: 'task:create' },
                ],
            },
            {
                label: 'Chỉnh sửa task',
                description: 'USER chỉ sửa task được giao',
                permissions: [
                    { role: 'ADMIN', permission: 'task:edit' },
                    { role: 'PM',    permission: 'task:edit' },
                    { role: 'USER',  permission: 'task:edit_own' },
                ],
            },
            {
                label: 'Xóa task',
                permissions: [
                    { role: 'ADMIN', permission: 'task:delete' },
                    { role: 'PM',    permission: 'task:delete' },
                    { role: 'USER',  permission: 'task:delete' },
                ],
            },
        ],
    },
    {
        group: 'Dòng tiền (Cash Flow)',
        icon: '💰',
        rows: [
            {
                label: 'Tạo giao dịch',
                permissions: [
                    { role: 'ADMIN', permission: 'cashflow:create' },
                    { role: 'PM',    permission: 'cashflow:create' },
                    { role: 'USER',  permission: 'cashflow:create' },
                ],
            },
            {
                label: 'Chỉnh sửa giao dịch',
                permissions: [
                    { role: 'ADMIN', permission: 'cashflow:edit' },
                    { role: 'PM',    permission: 'cashflow:edit' },
                    { role: 'USER',  permission: 'cashflow:edit' },
                ],
            },
            {
                label: 'Xóa giao dịch',
                permissions: [
                    { role: 'ADMIN', permission: 'cashflow:delete' },
                    { role: 'PM',    permission: 'cashflow:delete' },
                    { role: 'USER',  permission: 'cashflow:delete' },
                ],
            },
        ],
    },
    {
        group: 'Khách hàng & Nhân sự ngoài',
        icon: '👥',
        rows: [
            {
                label: 'Tạo/Sửa khách hàng',
                permissions: [
                    { role: 'ADMIN', permission: 'customer:create' },
                    { role: 'PM',    permission: 'customer:create' },
                    { role: 'USER',  permission: 'customer:create' },
                ],
            },
            {
                label: 'Xóa khách hàng',
                permissions: [
                    { role: 'ADMIN', permission: 'customer:delete' },
                    { role: 'PM',    permission: 'customer:delete' },
                    { role: 'USER',  permission: 'customer:delete' },
                ],
            },
            {
                label: 'Tạo/Sửa nhân sự ngoài',
                permissions: [
                    { role: 'ADMIN', permission: 'outsourcing:create' },
                    { role: 'PM',    permission: 'outsourcing:create' },
                    { role: 'USER',  permission: 'outsourcing:create' },
                ],
            },
            {
                label: 'Xóa nhân sự ngoài',
                permissions: [
                    { role: 'ADMIN', permission: 'outsourcing:delete' },
                    { role: 'PM',    permission: 'outsourcing:delete' },
                    { role: 'USER',  permission: 'outsourcing:delete' },
                ],
            },
        ],
    },
    {
        group: 'Hệ thống & Cài đặt',
        icon: '⚙️',
        rows: [
            {
                label: 'Sửa hồ sơ công ty',
                permissions: [
                    { role: 'ADMIN', permission: 'company_profile:edit' },
                    { role: 'PM',    permission: 'company_profile:edit' },
                    { role: 'USER',  permission: 'company_profile:edit' },
                ],
            },
            {
                label: 'Sửa cài đặt (danh mục, đơn vị)',
                permissions: [
                    { role: 'ADMIN', permission: 'settings:edit' },
                    { role: 'PM',    permission: 'settings:edit' },
                    { role: 'USER',  permission: 'settings:edit' },
                ],
            },
            {
                label: 'Quản lý user (tạo, sửa, xóa)',
                permissions: [
                    { role: 'ADMIN', permission: 'user:create' },
                    { role: 'PM',    permission: 'user:create' },
                    { role: 'USER',  permission: 'user:create' },
                ],
            },
            {
                label: 'Phân quyền role',
                description: 'Chỉ Admin mới đổi được role của user',
                permissions: [
                    { role: 'ADMIN', permission: 'user:manage_roles' },
                    { role: 'PM',    permission: 'user:manage_roles' },
                    { role: 'USER',  permission: 'user:manage_roles' },
                ],
            },
        ],
    },
];

const ROLES: SystemRole[] = ['ADMIN', 'PM', 'USER'];

const ROLE_COLORS: Record<SystemRole, { bg: string; text: string; border: string; badge: string }> = {
    ADMIN: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-800' },
    PM:    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' },
    USER:  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
};

function CheckIcon({ granted }: { granted: boolean }) {
    if (granted) {
        return (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </span>
        );
    }
    return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </span>
    );
}

export default function PermissionsPage() {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role as string | undefined;

    // Chỉ ADMIN mới truy cập
    if (userRole !== 'ADMIN') {
        return (
            <div className="px-6 py-8">
                <div className="max-w-lg mx-auto bg-white border border-red-100 rounded-2xl p-8 shadow-sm text-center">
                    <div className="text-5xl mb-4">🔒</div>
                    <h2 className="text-xl font-bold text-red-700 mb-2">Truy cập bị giới hạn</h2>
                    <p className="text-sm text-gray-600">
                        Trang này chỉ dành cho <strong>Quản trị viên (Admin)</strong>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-4 md:px-6 md:py-5 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Phân quyền hệ thống</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Ma trận quyền truy cập theo vai trò — Nguồn sự thật cho toàn hệ thống
                    </p>
                </div>
            </div>

            {/* Role Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ROLES.map((role) => {
                    const colors = ROLE_COLORS[role];
                    const perms = getAllPermissions(role);
                    const descriptions: Record<SystemRole, { emoji: string; desc: string; access: string[] }> = {
                        ADMIN: {
                            emoji: '👑',
                            desc: 'Toàn quyền hệ thống, quản lý user và phân quyền',
                            access: ['Tất cả module', 'Quản lý user', 'Cài đặt hệ thống', 'Phân quyền'],
                        },
                        PM: {
                            emoji: '📋',
                            desc: 'Quản lý dự án, báo giá, khách hàng. Không quản lý user.',
                            access: ['Dự án & Báo giá', 'Khách hàng', 'Nhân sự ngoài', 'Báo cáo', 'Xem cài đặt'],
                        },
                        USER: {
                            emoji: '👤',
                            desc: 'Xem dự án được giao, tự tạo báo giá, cập nhật task của mình.',
                            access: ['Dự án (được giao)', 'Báo giá (của mình)', 'Task (được giao)'],
                        },
                    };
                    const info = descriptions[role];

                    return (
                        <div
                            key={role}
                            className={`rounded-xl border ${colors.border} ${colors.bg} p-5 space-y-3`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{info.emoji}</span>
                                <div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${colors.badge}`}>
                                        {role}
                                    </span>
                                    <p className={`text-sm font-semibold mt-0.5 ${colors.text}`}>{getRoleLabel(role)}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">{info.desc}</p>
                            <div className="space-y-1">
                                {info.access.map((item) => (
                                    <div key={item} className="flex items-center gap-1.5 text-xs text-gray-700">
                                        <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <div className={`text-xs ${colors.text} font-medium`}>
                                {perms.length} quyền được cấp
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Note about Project Roles */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">ℹ️</span>
                    <div>
                        <p className="text-sm font-semibold text-purple-800">Phân quyền trong Dự án (Project Roles)</p>
                        <p className="text-xs text-purple-700 mt-1">
                            Ngoài role hệ thống, mỗi user có thể có thêm quyền trong từng dự án cụ thể:
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {[
                                { role: 'MANAGER', desc: 'Toàn quyền trong dự án, tương đương PM' },
                                { role: 'MEMBER', desc: 'Xem và thực hiện task được giao' },
                                { role: 'VIEWER', desc: 'Chỉ xem, không chỉnh sửa' },
                            ].map(({ role, desc }) => (
                                <div key={role} className="bg-white border border-purple-200 rounded-lg px-3 py-2 text-xs">
                                    <span className="font-bold text-purple-800">{role}</span>
                                    <span className="text-gray-600 ml-1.5">— {desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Permission Matrix Table */}
            <div className="space-y-4">
                {PERMISSION_MATRIX.map(({ group, icon, rows }) => (
                    <div key={group} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        {/* Group Header */}
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                            <span className="text-base">{icon}</span>
                            <h3 className="font-semibold text-gray-800 text-sm">{group}</h3>
                        </div>

                        {/* Table */}
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/2">
                                        Chức năng
                                    </th>
                                    {ROLES.map((role) => (
                                        <th
                                            key={role}
                                            className={`px-4 py-3 text-center text-xs font-bold uppercase tracking-wide ${ROLE_COLORS[role].text}`}
                                        >
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${ROLE_COLORS[role].badge}`}>
                                                {role === 'ADMIN' ? '👑' : role === 'PM' ? '📋' : '👤'} {role}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {rows.map(({ label, description, permissions }, rowIdx) => (
                                    <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3">
                                            <p className="text-sm font-medium text-gray-800">{label}</p>
                                            {description && (
                                                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                                            )}
                                        </td>
                                        {ROLES.map((role) => {
                                            const perm = permissions.find((p) => p.role === role);
                                            const granted = perm ? can(role, perm.permission) : false;
                                            return (
                                                <td key={role} className="px-4 py-3 text-center">
                                                    <CheckIcon granted={granted} />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs text-gray-500 pb-4">
                <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100">
                        <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </span>
                    Có quyền
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100">
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </span>
                    Không có quyền
                </div>
                <p className="ml-auto text-gray-400">* Quyền được kiểm tra cả phía client và server</p>
            </div>
        </div>
    );
}
