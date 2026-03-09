'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

// === Types ===
type LicenseEntry = {
    id: string;
    email: string;
    name: string | null;
    status: string;
    source: 'revit' | 'staff';
    role?: string;
    department?: string | null;
    licensePlan: string | null;
    licenseActive: boolean;
    licenseStart: string | null;
    licenseExpiry: string | null;
    machineId: string | null;
    lastLogin: string | null;
    mcpLicenseActive: boolean;
    mcpLicensePlan: string | null;
    mcpLicenseStart: string | null;
    mcpLicenseExpiry: string | null;
    createdAt: string;
};

type FilterType = 'all' | 'revit' | 'staff' | 'active' | 'expired' | 'inactive';

// === License Plans ===
const LICENSE_PLANS = [
    { key: '1M', label: '1 tháng', months: 1, icon: '📅' },
    { key: '3M', label: '3 tháng', months: 3, icon: '📆' },
    { key: '6M', label: '6 tháng', months: 6, icon: '🗓️' },
    { key: '1Y', label: '1 năm', months: 12, icon: '📋' },
    { key: 'LIFETIME', label: 'Trọn đời', months: null, icon: '♾️' },
] as const;

function getPlanLabel(planKey: string | null): string {
    if (!planKey) return '—';
    const plan = LICENSE_PLANS.find((p) => p.key === planKey);
    return plan ? `${plan.icon} ${plan.label}` : planKey;
}

function getRemainingDays(expiry: string | null): number | null {
    if (!expiry) return null;
    return Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function calcExpiry(startDate: Date, planKey: string): Date | null {
    const plan = LICENSE_PLANS.find((p) => p.key === planKey);
    if (!plan || plan.months === null) return null;
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + plan.months);
    return d;
}

type LicenseFormState = { email: string; name: string; password: string; plan: string };
const INITIAL_FORM: LicenseFormState = { email: '', name: '', password: '', plan: '1M' };

export default function RevitLicensesPage() {
    return <RevitLicensesContent />;
}

export function RevitLicensesContent() {
    const { data: session, status } = useSession();
    const currentUser: any = session?.user || { role: 'GUEST' };

    const [entries, setEntries] = useState<LicenseEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<LicenseFormState>(INITIAL_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [togglingMcpId, setTogglingMcpId] = useState<string | null>(null);
    const [suspendingId, setSuspendingId] = useState<string | null>(null);

    // Edit plan modal
    const [editPlanUser, setEditPlanUser] = useState<LicenseEntry | null>(null);
    const [editPlan, setEditPlan] = useState('1M');
    const [editStartDate, setEditStartDate] = useState(() => new Date().toISOString().split('T')[0]);

    const sessionLoading = status === 'loading';
    const isAdmin = !sessionLoading && currentUser.role === 'ADMIN';

    useEffect(() => {
        if (sessionLoading) return;
        if (isAdmin) void fetchData();
        else setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, sessionLoading]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/revit-users', { cache: 'no-store' });
            const result = await res.json();
            if (result.success) {
                const all = [...result.data.revitUsers, ...result.data.staffWithLicense];
                setEntries(all);
            } else {
                alert(result.error || 'Không thể tải dữ liệu');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            alert('Có lỗi khi tải danh sách');
        } finally {
            setIsLoading(false);
        }
    };

    // === Handlers ===
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.name) return alert('Thiếu email hoặc tên');
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/revit-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const result = await res.json();
            if (result.success) {
                setShowModal(false);
                setForm(INITIAL_FORM);
                await fetchData();
                alert(result.emailSent
                    ? `✅ Đã tạo tài khoản! Email đã gửi đến ${form.email}`
                    : `✅ Đã tạo tài khoản! (Email chưa gửi được: ${result.emailError})`);
            } else {
                alert(result.error || 'Không thể tạo user');
            }
        } catch { alert('Lỗi hệ thống'); }
        finally { setIsSubmitting(false); }
    };

    const handleToggleLicense = async (entry: LicenseEntry) => {
        setTogglingId(entry.id);
        try {
            const endpoint = entry.source === 'revit' ? '/api/revit-users' : '/api/users';
            const body = entry.source === 'revit'
                ? { userId: entry.id, licenseActive: !entry.licenseActive }
                : { userId: entry.id, revitLicenseActive: !entry.licenseActive };

            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await res.json();
            if (result.success) {
                setEntries(prev => prev.map(u =>
                    u.id === entry.id ? { ...u, licenseActive: !entry.licenseActive } : u
                ));
            } else {
                alert(result.error || 'Lỗi cập nhật');
            }
        } catch { alert('Lỗi hệ thống'); }
        finally { setTogglingId(null); }
    };

    const handleToggleMcpLicense = async (entry: LicenseEntry) => {
        setTogglingMcpId(entry.id);
        try {
            const endpoint = entry.source === 'revit' ? '/api/revit-users' : '/api/users';
            const body = entry.source === 'revit'
                ? { userId: entry.id, mcpLicenseActive: !entry.mcpLicenseActive }
                : { userId: entry.id, mcpLicenseActive: !entry.mcpLicenseActive };

            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await res.json();
            if (result.success) {
                setEntries(prev => prev.map(u =>
                    u.id === entry.id ? { ...u, mcpLicenseActive: !entry.mcpLicenseActive } : u
                ));
            } else {
                alert(result.error || 'Lỗi cập nhật MCP');
            }
        } catch { alert('Lỗi hệ thống'); }
        finally { setTogglingMcpId(null); }
    };

    const handleResetDevice = async (entry: LicenseEntry) => {
        if (!confirm(`Reset thiết bị cho "${entry.name || entry.email}"? User sẽ phải đăng nhập lại.`)) return;
        try {
            const endpoint = entry.source === 'revit' ? '/api/revit-users' : '/api/users';
            const body = entry.source === 'revit'
                ? { userId: entry.id, machineId: null, activeToken: null }
                : { userId: entry.id, revitMachineId: null, revitActiveToken: null };

            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await res.json();
            if (result.success) {
                setEntries(prev => prev.map(u =>
                    u.id === entry.id ? { ...u, machineId: null } : u
                ));
            } else {
                alert(result.error || 'Lỗi reset');
            }
        } catch { alert('Lỗi hệ thống'); }
    };

    const handleDeleteUser = async (entry: LicenseEntry) => {
        if (entry.source === 'staff') {
            return alert('Không thể xóa nhân sự từ đây. Vào trang Quản lý User để quản lý.');
        }
        if (!confirm(`⚠️ Xóa vĩnh viễn "${entry.name || entry.email}"?\nHành động không thể hoàn tác!`)) return;
        try {
            const res = await fetch(`/api/revit-users?userId=${entry.id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) await fetchData();
            else alert(result.error || 'Lỗi xóa');
        } catch { alert('Lỗi hệ thống'); }
    };

    const handleSuspendAccount = async (entry: LicenseEntry) => {
        const isSuspended = entry.status === 'SUSPENDED';
        const action = isSuspended ? 'kích hoạt lại' : 'vô hiệu hóa';
        if (!confirm(`${isSuspended ? '✅' : '🚫'} ${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản "${entry.name || entry.email}"?\n\n${isSuspended ? 'User sẽ có thể đăng nhập lại.' : 'User sẽ KHÔNG thể đăng nhập Revit nữa.'}`)) return;
        setSuspendingId(entry.id);
        try {
            const endpoint = entry.source === 'revit' ? '/api/revit-users' : '/api/users';
            const newStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED';
            const body: any = { userId: entry.id, status: newStatus };
            // Nếu vô hiệu hóa, tắt license + xóa device luôn
            if (!isSuspended && entry.source === 'revit') {
                body.licenseActive = false;
                body.machineId = null;
                body.activeToken = null;
            }
            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await res.json();
            if (result.success) {
                await fetchData();
            } else {
                alert(result.error || `Lỗi ${action}`);
            }
        } catch { alert('Lỗi hệ thống'); }
        finally { setSuspendingId(null); }
    };

    const handleEditPlan = async () => {
        if (!editPlanUser) return;
        try {
            const endpoint = editPlanUser.source === 'revit' ? '/api/revit-users' : '/api/users';
            const startDate = new Date(editStartDate);
            const expiryDate = calcExpiry(startDate, editPlan);

            const body = editPlanUser.source === 'revit'
                ? {
                    userId: editPlanUser.id,
                    licensePlan: editPlan,
                    licenseStart: startDate.toISOString(),
                    licenseExpiry: expiryDate?.toISOString() ?? null,
                    licenseActive: true,
                }
                : {
                    userId: editPlanUser.id,
                    revitLicensePlan: editPlan,
                    revitLicenseStart: startDate.toISOString(),
                    revitLicenseExpiry: expiryDate?.toISOString() ?? null,
                    revitLicenseActive: true,
                };

            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await res.json();
            if (result.success) {
                setEditPlanUser(null);
                await fetchData();
            } else {
                alert(result.error || 'Lỗi cập nhật gói');
            }
        } catch { alert('Lỗi hệ thống'); }
    };

    // === Filtering ===
    const filtered = entries.filter((e) => {
        if (filter === 'revit') return e.source === 'revit';
        if (filter === 'staff') return e.source === 'staff';
        if (filter === 'active') return e.licenseActive && (!e.licenseExpiry || new Date(e.licenseExpiry) > new Date());
        if (filter === 'expired') return e.licenseExpiry && new Date(e.licenseExpiry) < new Date();
        if (filter === 'inactive') return !e.licenseActive;
        return true;
    });

    const counts = {
        all: entries.length,
        revit: entries.filter(e => e.source === 'revit').length,
        staff: entries.filter(e => e.source === 'staff').length,
        active: entries.filter(e => e.licenseActive && (!e.licenseExpiry || new Date(e.licenseExpiry) > new Date())).length,
        expired: entries.filter(e => e.licenseExpiry && new Date(e.licenseExpiry) < new Date()).length,
        inactive: entries.filter(e => !e.licenseActive).length,
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-2xl">🔑</span> Revit License
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Quản lý license Revit Add-in — {counts.all} tài khoản ({counts.revit} Revit + {counts.staff} Nhân sự)
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => { setForm(INITIAL_FORM); setShowModal(true); }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 text-sm shadow-lg shadow-indigo-500/20"
                >
                    <span>➕</span> Thêm User Revit
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {([
                    { key: 'all', label: 'Tất cả', color: 'gray' },
                    { key: 'revit', label: '🔧 Revit', color: 'indigo' },
                    { key: 'staff', label: '👥 Nhân sự', color: 'blue' },
                    { key: 'active', label: '✅ Đang hoạt động', color: 'emerald' },
                    { key: 'expired', label: '⏰ Hết hạn', color: 'amber' },
                    { key: 'inactive', label: '❌ Vô hiệu', color: 'red' },
                ] as const).map(({ key, label, color }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setFilter(key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === key
                                ? `bg-${color}-100 text-${color}-700 ring-1 ring-${color}-300`
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {label} ({counts[key]})
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Nguồn</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Tên</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Email</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Gói</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Trạng thái</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">MCP AI</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Hết hạn</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Thiết bị</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Lần cuối</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-500">Đang tải...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-500">Không có dữ liệu.</td></tr>
                            ) : (
                                filtered.map((entry) => {
                                    const remaining = getRemainingDays(entry.licenseExpiry);
                                    const isExpired = remaining !== null && remaining <= 0;
                                    const isExpiringSoon = remaining !== null && remaining > 0 && remaining <= 7;

                                    return (
                                        <tr key={`${entry.source}-${entry.id}`} className="hover:bg-gray-50">
                                            {/* Source badge */}
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${entry.source === 'revit'
                                                        ? 'bg-indigo-50 text-indigo-700'
                                                        : 'bg-blue-50 text-blue-700'
                                                    }`}>
                                                    {entry.source === 'revit' ? '🔧 Revit' : '👥 Nhân sự'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                {entry.name || '—'}
                                                {entry.source === 'staff' && entry.role && (
                                                    <span className={`ml-1.5 inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium ${entry.role === 'ADMIN' ? 'bg-red-50 text-red-600' :
                                                            entry.role === 'PM' ? 'bg-amber-50 text-amber-600' :
                                                                'bg-gray-50 text-gray-500'
                                                        }`}>{entry.role}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{entry.email}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditPlanUser(entry);
                                                        setEditPlan(entry.licensePlan || '1M');
                                                        setEditStartDate(entry.licenseStart
                                                            ? new Date(entry.licenseStart).toISOString().split('T')[0]
                                                            : new Date().toISOString().split('T')[0]
                                                        );
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                                                    title="Nhấn để đổi gói"
                                                >
                                                    {getPlanLabel(entry.licensePlan)}
                                                </button>
                                            </td>
                                            {/* License toggle */}
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={togglingId === entry.id}
                                                        onClick={() => handleToggleLicense(entry)}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:cursor-not-allowed ${entry.licenseActive
                                                                ? isExpired
                                                                    ? 'bg-amber-400'
                                                                    : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                                                : 'bg-gray-300'
                                                            }`}
                                                    >
                                                        {togglingId === entry.id ? (
                                                            <span className="absolute inset-0 flex items-center justify-center">
                                                                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                                </svg>
                                                            </span>
                                                        ) : (
                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${entry.licenseActive ? 'translate-x-6' : 'translate-x-1'
                                                                }`} />
                                                        )}
                                                    </button>
                                                    <span className={`text-[10px] font-semibold ${entry.licenseActive
                                                            ? isExpired ? 'text-amber-600' : 'text-emerald-600'
                                                            : 'text-gray-400'
                                                        }`}>
                                                        {entry.licenseActive
                                                            ? isExpired ? 'Hết hạn' : 'Active'
                                                            : 'Tắt'}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* MCP License toggle */}
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={togglingMcpId === entry.id}
                                                        onClick={() => handleToggleMcpLicense(entry)}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:cursor-not-allowed ${entry.mcpLicenseActive
                                                                ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                                                                : 'bg-gray-300'
                                                            }`}
                                                    >
                                                        {togglingMcpId === entry.id ? (
                                                            <span className="absolute inset-0 flex items-center justify-center">
                                                                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                                </svg>
                                                            </span>
                                                        ) : (
                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${entry.mcpLicenseActive ? 'translate-x-6' : 'translate-x-1'
                                                                }`} />
                                                        )}
                                                    </button>
                                                    <span className={`text-[10px] font-semibold ${entry.mcpLicenseActive ? 'text-violet-600' : 'text-gray-400'
                                                        }`}>
                                                        {entry.mcpLicenseActive ? '🤖 On' : 'Off'}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Expiry */}
                                            <td className="px-4 py-3 text-sm">
                                                {entry.licenseExpiry ? (
                                                    <div>
                                                        <div className={`text-xs font-medium ${isExpired ? 'text-red-600' :
                                                                isExpiringSoon ? 'text-amber-600' :
                                                                    'text-gray-600'
                                                            }`}>
                                                            {new Date(entry.licenseExpiry).toLocaleDateString('vi-VN')}
                                                        </div>
                                                        {remaining !== null && (
                                                            <div className={`text-[10px] ${isExpired ? 'text-red-500' :
                                                                    isExpiringSoon ? 'text-amber-500' :
                                                                        'text-gray-400'
                                                                }`}>
                                                                {isExpired ? `Quá hạn ${Math.abs(remaining)} ngày` : `Còn ${remaining} ngày`}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">♾️ Trọn đời</span>
                                                )}
                                            </td>
                                            {/* Machine */}
                                            <td className="px-4 py-3 text-sm">
                                                {entry.machineId ? (
                                                    <span className="text-xs text-gray-500 truncate max-w-[120px] block" title={entry.machineId}>
                                                        💻 {entry.machineId}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-300">—</span>
                                                )}
                                            </td>
                                            {/* Last login */}
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {entry.lastLogin
                                                    ? new Date(entry.lastLogin).toLocaleDateString('vi-VN')
                                                    : '—'}
                                            </td>
                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Suspend/Activate account */}
                                                    <button
                                                        type="button"
                                                        disabled={suspendingId === entry.id}
                                                        onClick={() => handleSuspendAccount(entry)}
                                                        title={entry.status === 'SUSPENDED' ? 'Kích hoạt lại tài khoản' : 'Vô hiệu hóa tài khoản'}
                                                        className={`group p-1.5 rounded-md transition-colors ${entry.status === 'SUSPENDED' ? 'hover:bg-emerald-50 bg-red-50' : 'hover:bg-orange-50'}`}
                                                    >
                                                        {suspendingId === entry.id ? (
                                                            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                                        ) : entry.status === 'SUSPENDED' ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    {/* Reset device */}
                                                    {entry.machineId && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleResetDevice(entry)}
                                                            title="Reset thiết bị"
                                                            className="group p-1.5 rounded-md hover:bg-amber-50 transition-colors"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {/* Delete user */}
                                                    {entry.source === 'revit' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteUser(entry)}
                                                            title="Xóa user"
                                                            className="group p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">➕ Thêm User Revit</h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">×</button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                <input type="email" required value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="user@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                                <input type="text" required value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nguyễn Văn A" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu <span className="text-gray-400 font-normal">(để trống = tự tạo)</span></label>
                                <input type="password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Mật khẩu đăng nhập Revit" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gói License</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {LICENSE_PLANS.map((p) => (
                                        <button key={p.key} type="button" onClick={() => setForm(prev => ({ ...prev, plan: p.key }))}
                                            className={`p-2 rounded-lg border text-center text-xs font-medium transition-all ${form.plan === p.key
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                }`}>
                                            <div className="text-lg">{p.icon}</div>
                                            <div>{p.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-3 flex gap-3 border-t">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">Hủy</button>
                                <button type="submit" disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-60">
                                    {isSubmitting ? 'Đang tạo...' : 'Tạo User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Plan Modal */}
            {editPlanUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">📋 Đổi gói License</h2>
                            <p className="text-sm text-gray-500 mt-1">{editPlanUser.name || editPlanUser.email}</p>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-5 gap-2">
                                {LICENSE_PLANS.map((p) => (
                                    <button key={p.key} type="button" onClick={() => setEditPlan(p.key)}
                                        className={`p-2 rounded-lg border text-center text-xs font-medium transition-all ${editPlan === p.key
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                            }`}>
                                        <div className="text-lg">{p.icon}</div>
                                        <div>{p.label}</div>
                                    </button>
                                ))}
                            </div>
                            {/* Date Pickers */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">📅 Ngày bắt đầu</label>
                                    <div className="flex gap-2">
                                        {/* Day */}
                                        <select
                                            value={parseInt(editStartDate.split('-')[2], 10)}
                                            onChange={(e) => {
                                                const parts = editStartDate.split('-');
                                                setEditStartDate(`${parts[0]}-${parts[1]}-${e.target.value.padStart(2, '0')}`);
                                            }}
                                            className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                        >
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                <option key={d} value={d}>{d.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <span className="flex items-center text-gray-400 text-sm">/</span>
                                        {/* Month */}
                                        <select
                                            value={parseInt(editStartDate.split('-')[1], 10)}
                                            onChange={(e) => {
                                                const parts = editStartDate.split('-');
                                                setEditStartDate(`${parts[0]}-${e.target.value.padStart(2, '0')}-${parts[2]}`);
                                            }}
                                            className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <span className="flex items-center text-gray-400 text-sm">/</span>
                                        {/* Year */}
                                        <select
                                            value={parseInt(editStartDate.split('-')[0], 10)}
                                            onChange={(e) => {
                                                const parts = editStartDate.split('-');
                                                setEditStartDate(`${e.target.value}-${parts[1]}-${parts[2]}`);
                                            }}
                                            className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                        >
                                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Ngày hết hạn:</span>
                                        <span className="font-semibold text-gray-800">
                                            {(() => {
                                                const exp = calcExpiry(new Date(editStartDate), editPlan);
                                                if (!exp) return '♾️ Không giới hạn';
                                                const dd = exp.getDate().toString().padStart(2, '0');
                                                const mm = (exp.getMonth() + 1).toString().padStart(2, '0');
                                                const yyyy = exp.getFullYear();
                                                return `${dd}/${mm}/${yyyy}`;
                                            })()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Gói:</span>
                                        <span className="font-semibold text-indigo-600">{getPlanLabel(editPlan)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setEditPlanUser(null)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">Hủy</button>
                                <button type="button" onClick={handleEditPlan}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">Áp dụng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
