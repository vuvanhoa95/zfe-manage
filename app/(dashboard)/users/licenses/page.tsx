'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

type LicenseUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    revitLicenseActive: boolean;
    revitLicensePlan: string | null;
    revitLicenseStart: string | null;
    revitLicenseExpiry: string | null;
    revitMachineId: string | null;
    revitLastLogin: string | null;
};

// === License Plans ===
const LICENSE_PLANS = [
    { key: '1M',       label: '1 tháng',  months: 1,    icon: '📅' },
    { key: '3M',       label: '3 tháng',  months: 3,    icon: '📆' },
    { key: '6M',       label: '6 tháng',  months: 6,    icon: '🗓️' },
    { key: '1Y',       label: '1 năm',    months: 12,   icon: '📋' },
    { key: 'LIFETIME', label: 'Trọn đời', months: null, icon: '♾️' },
] as const;

function getPlanLabel(planKey: string | null): string {
    if (!planKey) return '—';
    const plan = LICENSE_PLANS.find(p => p.key === planKey);
    return plan ? `${plan.icon} ${plan.label}` : planKey;
}

function calcExpiry(startDate: Date, planKey: string): Date | null {
    const plan = LICENSE_PLANS.find(p => p.key === planKey);
    if (!plan || plan.months === null) return null; // LIFETIME
    const expiry = new Date(startDate);
    expiry.setMonth(expiry.getMonth() + plan.months);
    return expiry;
}

function getRemainingDays(expiry: string | null): number | null {
    if (!expiry) return null;
    const diff = new Date(expiry).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

type LicenseFormState = {
    email: string;
    name: string;
    password: string;
    plan: string;
};

const INITIAL_FORM: LicenseFormState = {
    email: '',
    name: '',
    password: '',
    plan: '1M',
};

type FilterType = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export default function LicensesPage() {
    const { data: session, status } = useSession();
    const currentUser: any = session?.user || { role: 'GUEST' };

    const [users, setUsers] = useState<LicenseUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<LicenseFormState>(INITIAL_FORM);
    const [showPassword, setShowPassword] = useState(false);
    const [filter, setFilter] = useState<FilterType>('ALL');
    // Edit plan state
    const [editingUser, setEditingUser] = useState<LicenseUser | null>(null);
    const [editPlan, setEditPlan] = useState<string>('1M');
    const [editMode, setEditMode] = useState<'change' | 'extend'>('change');
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);

    const sessionLoading = status === 'loading';
    const isAdmin = !sessionLoading && currentUser.role === 'ADMIN';

    useEffect(() => {
        if (sessionLoading) return;
        if (isAdmin) {
            void fetchUsers();
        } else {
            setIsLoading(false);
        }
    }, [isAdmin, sessionLoading]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/users?limit=1000', {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
            });
            const result = await res.json();
            if (result.success && Array.isArray(result.data)) {
                setUsers(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleLicense = async (user: LicenseUser) => {
        const newValue = !user.revitLicenseActive;
        setTogglingId(user.id);
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, revitLicenseActive: newValue }),
            });
            const result = await res.json();
            if (result.success) {
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, revitLicenseActive: newValue } : u));
            } else {
                alert(result.error || 'Cập nhật thất bại');
            }
        } catch (error) {
            console.error('Toggle license error:', error);
            alert('Có lỗi xảy ra');
        } finally {
            setTogglingId(null);
        }
    };

    const handleCreateLicenseUser = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.email.trim() || !form.name.trim()) {
            alert('Vui lòng điền đầy đủ Email và Tên');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/users/license', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email.trim(),
                    name: form.name.trim(),
                    password: form.password || undefined,
                    plan: form.plan,
                }),
            });
            const result = await res.json();
            if (!result.success) {
                alert(result.error || 'Không thể tạo tài khoản');
                return;
            }

            setShowModal(false);
            setForm(INITIAL_FORM);
            setShowPassword(false);
            await fetchUsers();

            const planInfo = LICENSE_PLANS.find(p => p.key === form.plan);
            if (result.emailSent) {
                alert(`✅ Đã tạo tài khoản và cấp License thành công!\n\n📧 Email đã gửi đến: ${form.email}\n📋 Gói: ${planInfo?.label || form.plan}\n\nUser sẽ nhận được link đổi mật khẩu qua email.`);
            } else {
                alert(`⚠️ Đã tạo tài khoản nhưng chưa gửi được email.\n\nLý do: ${result.emailError || 'Unknown'}\n\n${form.password ? 'User có thể đăng nhập bằng mật khẩu đã nhập.' : 'Vui lòng kiểm tra cấu hình SMTP.'}`);
            }
        } catch (error) {
            console.error('Create license user error:', error);
            alert('Có lỗi xảy ra khi tạo tài khoản');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetDevice = async (user: LicenseUser) => {
        if (!confirm(`Bạn muốn reset thiết bị cho "${user.name}" (${user.email})?\n\nUser sẽ cần đăng nhập lại trên Revit.`)) return;
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, revitMachineId: null, revitActiveToken: null }),
            });
            const result = await res.json();
            if (result.success) {
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, revitMachineId: null, revitLastLogin: null } : u));
                alert('✅ Đã reset thiết bị. User sẽ cần đăng nhập lại.');
            }
        } catch {
            alert('Có lỗi xảy ra');
        }
    };

    const openEditPlan = (user: LicenseUser) => {
        setEditingUser(user);
        setEditPlan(user.revitLicensePlan || '1M');
        setEditMode('change');
    };

    const handleDeleteUser = async (user: LicenseUser) => {
        if (!confirm(`⚠️ Xóa tài khoản "${user.name}" (${user.email})?\n\nHành động này không thể hoàn tác!`)) return;
        try {
            const res = await fetch(`/api/users?userId=${user.id}`, {
                method: 'DELETE',
            });
            const result = await res.json();
            if (result.success) {
                setUsers(prev => prev.filter(u => u.id !== user.id));
                alert('✅ Đã xóa tài khoản thành công.');
            } else {
                alert(result.error || 'Xóa thất bại');
            }
        } catch {
            alert('Có lỗi xảy ra');
        }
    };

    const handleEditPlan = async () => {
        if (!editingUser) return;
        setIsEditSubmitting(true);
        try {
            let startDate: Date;
            let expiryDate: Date | null;

            if (editMode === 'extend' && editingUser.revitLicenseExpiry) {
                // Gia hạn từ ngày hết hạn cũ
                const oldExpiry = new Date(editingUser.revitLicenseExpiry);
                const baseDate = oldExpiry > new Date() ? oldExpiry : new Date(); // Nếu đã hết hạn thì tính từ hôm nay
                startDate = new Date(editingUser.revitLicenseStart || new Date()); // Giữ ngày bắt đầu gốc
                expiryDate = calcExpiry(baseDate, editPlan);
            } else {
                // Đổi gói mới (reset thời hạn)
                startDate = new Date();
                expiryDate = calcExpiry(startDate, editPlan);
            }

            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: editingUser.id,
                    revitLicenseActive: true,
                    revitLicensePlan: editPlan,
                    revitLicenseStart: startDate.toISOString(),
                    revitLicenseExpiry: expiryDate ? expiryDate.toISOString() : null,
                }),
            });
            const result = await res.json();
            if (result.success) {
                setEditingUser(null);
                await fetchUsers();
                const planInfo = LICENSE_PLANS.find(p => p.key === editPlan);
                alert(`✅ Đã cập nhật gói License cho ${editingUser.name}\n\nGói mới: ${planInfo?.label || editPlan}`);
            } else {
                alert(result.error || 'Cập nhật thất bại');
            }
        } catch (error) {
            console.error('Edit plan error:', error);
            alert('Có lỗi xảy ra');
        } finally {
            setIsEditSubmitting(false);
        }
    };

    // Filter logic
    const now = new Date();
    const filteredUsers = users.filter(u => {
        switch (filter) {
            case 'ACTIVE': return u.revitLicenseActive && (!u.revitLicenseExpiry || new Date(u.revitLicenseExpiry) > now);
            case 'INACTIVE': return !u.revitLicenseActive;
            case 'EXPIRED': return u.revitLicenseActive && u.revitLicenseExpiry && new Date(u.revitLicenseExpiry) <= now;
            default: return true;
        }
    });

    // Stats
    const stats = {
        total: users.length,
        licensed: users.filter(u => u.revitLicenseActive).length,
        active: users.filter(u => u.revitLicenseActive && u.revitMachineId).length,
        expired: users.filter(u => u.revitLicenseActive && u.revitLicenseExpiry && new Date(u.revitLicenseExpiry) <= now).length,
    };

    if (sessionLoading || (isLoading && isAdmin)) {
        return (
            <div className="px-4 py-4 md:px-6 md:py-5">
                <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        <span className="ml-3 text-gray-700">Đang tải...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="px-4 py-4 md:px-6 md:py-5">
                <div className="max-w-xl mx-auto bg-white border border-red-100 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-red-700 mb-2">Quyền truy cập bị giới hạn</h2>
                    <p className="text-sm text-gray-700">
                        Chức năng <span className="font-semibold">Quản lý License</span> chỉ dành cho <span className="font-semibold">Admin</span>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-4 md:px-6 md:py-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Link href="/users" className="text-gray-400 hover:text-gray-600 transition-colors" title="Quay lại">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">🔑 Quản lý License Revit Add-in</h1>
                    </div>
                    <p className="text-sm text-gray-500 ml-8">Cấp/thu hồi quyền sử dụng Revit Add-in cho tài khoản</p>
                </div>
                <button
                    type="button"
                    onClick={() => { setShowModal(true); setForm(INITIAL_FORM); setShowPassword(false); }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 text-sm shadow-lg shadow-indigo-500/20"
                >
                    <span>🔑+</span> Cấp License mới
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-medium">Tổng tài khoản</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl border border-indigo-100 p-4 shadow-sm">
                    <p className="text-xs text-indigo-500 uppercase font-medium">Đã cấp License</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.licensed}</p>
                </div>
                <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm">
                    <p className="text-xs text-emerald-500 uppercase font-medium">Đang dùng</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
                </div>
                <div className="bg-white rounded-xl border border-amber-100 p-4 shadow-sm">
                    <p className="text-xs text-amber-500 uppercase font-medium">Hết hạn</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{stats.expired}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                {([
                    { key: 'ALL', label: 'Tất cả', count: users.length },
                    { key: 'ACTIVE', label: 'Đang active', count: stats.licensed - stats.expired },
                    { key: 'INACTIVE', label: 'Chưa cấp', count: users.length - stats.licensed },
                    { key: 'EXPIRED', label: 'Hết hạn', count: stats.expired },
                ] as const).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            filter === tab.key
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Tên</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Email</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase text-center">License</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Gói</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Thời hạn</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">Thiết bị</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500">Đang tải...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                                        {filter === 'ALL' ? 'Chưa có tài khoản nào.' : 'Không có kết quả phù hợp.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isExpired = user.revitLicenseExpiry && new Date(user.revitLicenseExpiry) <= now;
                                    const remaining = getRemainingDays(user.revitLicenseExpiry);
                                    const isExpiringSoon = remaining !== null && remaining > 0 && remaining <= 7;

                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            {/* Name */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                                                        user.revitLicenseActive && !isExpired
                                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                                            : 'bg-gray-300'
                                                    }`}>
                                                        {(user.name || '?').split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                                                        <p className="text-[10px] text-gray-400 uppercase">{user.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Email */}
                                            <td className="px-5 py-3.5 text-sm text-gray-600">{user.email}</td>
                                            {/* License Toggle */}
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={togglingId === user.id}
                                                        onClick={() => handleToggleLicense(user)}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:cursor-not-allowed ${
                                                            user.revitLicenseActive
                                                                ? isExpired
                                                                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                                                    : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                                                                : 'bg-gray-300'
                                                        }`}
                                                    >
                                                        {togglingId === user.id ? (
                                                            <span className="absolute inset-0 flex items-center justify-center">
                                                                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                                </svg>
                                                            </span>
                                                        ) : (
                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                                                                user.revitLicenseActive ? 'translate-x-6' : 'translate-x-1'
                                                            }`} />
                                                        )}
                                                    </button>
                                                    <span className={`text-[10px] font-semibold ${
                                                        user.revitLicenseActive
                                                            ? isExpired ? 'text-amber-500' : 'text-indigo-600'
                                                            : 'text-gray-400'
                                                    }`}>
                                                        {user.revitLicenseActive
                                                            ? isExpired ? '⚠️ Hết hạn' : '✅ Active'
                                                            : 'Không'}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Plan */}
                                            <td className="px-5 py-3.5 text-sm">
                                                {user.revitLicenseActive ? (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        user.revitLicensePlan === 'LIFETIME'
                                                            ? 'bg-purple-50 text-purple-700'
                                                            : isExpired
                                                              ? 'bg-red-50 text-red-600'
                                                              : 'bg-indigo-50 text-indigo-700'
                                                    }`}>
                                                        {getPlanLabel(user.revitLicensePlan)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 text-xs">—</span>
                                                )}
                                            </td>
                                            {/* Duration */}
                                            <td className="px-5 py-3.5 text-sm">
                                                {user.revitLicenseActive ? (
                                                    user.revitLicensePlan === 'LIFETIME' ? (
                                                        <span className="text-purple-600 font-medium text-xs">♾️ Không giới hạn</span>
                                                    ) : (
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                <span className="text-gray-400">Từ:</span>
                                                                <span className="font-medium text-gray-700">
                                                                    {user.revitLicenseStart
                                                                        ? new Date(user.revitLicenseStart).toLocaleDateString('vi-VN')
                                                                        : '—'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs">
                                                                <span className="text-gray-400">Đến:</span>
                                                                <span className={`font-medium ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : 'text-gray-700'}`}>
                                                                    {user.revitLicenseExpiry
                                                                        ? new Date(user.revitLicenseExpiry).toLocaleDateString('vi-VN')
                                                                        : '—'}
                                                                </span>
                                                            </div>
                                                            {remaining !== null && (
                                                                <span className={`text-[10px] font-semibold ${
                                                                    isExpired ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : 'text-emerald-500'
                                                                }`}>
                                                                    {isExpired
                                                                        ? `Hết hạn ${Math.abs(remaining)} ngày trước`
                                                                        : `Còn ${remaining} ngày`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )
                                                ) : (
                                                    <span className="text-gray-300 text-xs">—</span>
                                                )}
                                            </td>
                                            {/* Machine + Last Login */}
                                            <td className="px-5 py-3.5 text-sm">
                                                {user.revitMachineId ? (
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                                            <span className="text-gray-700 font-mono text-xs">{user.revitMachineId}</span>
                                                        </div>
                                                        {user.revitLastLogin && (
                                                            <p className="text-[10px] text-gray-400">
                                                                {new Date(user.revitLastLogin).toLocaleString('vi-VN', {
                                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                                    hour: '2-digit', minute: '2-digit',
                                                                })}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 text-xs">Chưa đăng nhập</span>
                                                )}
                                            </td>
                                            {/* Actions */}
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Edit Plan */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditPlan(user)}
                                                        title="Sửa gói License"
                                                        className="group p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    {/* Reset device */}
                                                    {user.revitMachineId && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleResetDevice(user)}
                                                            title="Reset thiết bị"
                                                            className="group p-1.5 rounded-md hover:bg-amber-50 transition-colors"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteUser(user)}
                                                        title="Xóa tài khoản"
                                                        className="group p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
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

            {/* Create License User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">🔑 Cấp License Revit mới</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Tạo tài khoản + chọn gói license</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setShowModal(false); setForm(INITIAL_FORM); }}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-light"
                            >×</button>
                        </div>
                        <form onSubmit={handleCreateLicenseUser} className="p-6 space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="user@company.com"
                                />
                            </div>
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Họ và tên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                            {/* Password (optional — user will set via email) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mật khẩu tạm <span className="text-gray-400 text-xs font-normal">(tùy chọn)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full px-4 py-2 pr-11 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Để trống → user tự đặt qua email"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* License Plan Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gói License <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {LICENSE_PLANS.map(plan => {
                                        const isSelected = form.plan === plan.key;
                                        return (
                                            <button
                                                key={plan.key}
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, plan: plan.key }))}
                                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                                                    isSelected
                                                        ? plan.key === 'LIFETIME'
                                                            ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-500/10'
                                                            : 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-500/10'
                                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span className="text-lg">{plan.icon}</span>
                                                <span className={`text-xs font-semibold ${
                                                    isSelected
                                                        ? plan.key === 'LIFETIME' ? 'text-purple-700' : 'text-indigo-700'
                                                        : 'text-gray-600'
                                                }`}>
                                                    {plan.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {/* Plan preview */}
                                <div className="mt-2 bg-gray-50 rounded-lg p-2.5 text-xs text-gray-500">
                                    {form.plan === 'LIFETIME' ? (
                                        <p>♾️ License <strong className="text-purple-600">trọn đời</strong> — không hết hạn</p>
                                    ) : (
                                        <p>
                                            📅 Bắt đầu: <strong>{new Date().toLocaleDateString('vi-VN')}</strong>
                                            {' → '}Hết hạn: <strong className="text-indigo-600">
                                                {(() => {
                                                    const exp = calcExpiry(new Date(), form.plan);
                                                    return exp ? exp.toLocaleDateString('vi-VN') : '—';
                                                })()}
                                            </strong>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-indigo-50 rounded-lg p-3 text-xs text-indigo-700">
                                <p className="font-medium">📧 Khi tạo xong:</p>
                                <ul className="mt-1 space-y-0.5 ml-4 list-disc text-indigo-600">
                                    <li>Email sẽ được <strong>gửi tự động</strong> đến user</li>
                                    <li>User nhấn link trong email để <strong>đặt mật khẩu</strong></li>
                                    <li>Đăng nhập trên Revit bằng email + mật khẩu đã tạo</li>
                                    <li>Chỉ 1 máy tính được dùng cùng lúc (single device lock)</li>
                                </ul>
                            </div>

                            <div className="pt-2 flex gap-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setForm(INITIAL_FORM); }}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-60"
                                >
                                    {isSubmitting ? 'Đang tạo...' : '🔑 Tạo & Cấp License'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Plan Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">✏️ Sửa gói License</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {editingUser.name} — {editingUser.email}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl font-light"
                                >×</button>
                            </div>
                            {/* Current info */}
                            {editingUser.revitLicensePlan && (
                                <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                                    <span className="font-medium">Gói hiện tại:</span>{' '}
                                    <span className="text-indigo-600 font-semibold">{getPlanLabel(editingUser.revitLicensePlan)}</span>
                                    {editingUser.revitLicenseStart && (
                                        <> · Từ {new Date(editingUser.revitLicenseStart).toLocaleDateString('vi-VN')}</>
                                    )}
                                    {editingUser.revitLicenseExpiry && (
                                        <> → {new Date(editingUser.revitLicenseExpiry).toLocaleDateString('vi-VN')}</>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Mode: Change vs Extend */}
                            {editingUser.revitLicenseExpiry && editingUser.revitLicensePlan !== 'LIFETIME' && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditMode('change')}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                                            editMode === 'change'
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        🔄 Đổi gói mới<br />
                                        <span className="text-[10px] font-normal">Reset từ hôm nay</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditMode('extend')}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                                            editMode === 'extend'
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        ➕ Gia hạn thêm<br />
                                        <span className="text-[10px] font-normal">Cộng thêm vào hạn cũ</span>
                                    </button>
                                </div>
                            )}

                            {/* Plan Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {editMode === 'extend' ? 'Gia hạn thêm' : 'Chọn gói mới'}
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {LICENSE_PLANS.map(plan => {
                                        const isSelected = editPlan === plan.key;
                                        return (
                                            <button
                                                key={plan.key}
                                                type="button"
                                                onClick={() => setEditPlan(plan.key)}
                                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                                                    isSelected
                                                        ? plan.key === 'LIFETIME'
                                                            ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-500/10'
                                                            : 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-500/10'
                                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span className="text-lg">{plan.icon}</span>
                                                <span className={`text-xs font-semibold ${
                                                    isSelected
                                                        ? plan.key === 'LIFETIME' ? 'text-purple-700' : 'text-indigo-700'
                                                        : 'text-gray-600'
                                                }`}>
                                                    {plan.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {/* Preview */}
                                <div className="mt-2 bg-gray-50 rounded-lg p-2.5 text-xs text-gray-500">
                                    {editPlan === 'LIFETIME' ? (
                                        <p>♾️ License <strong className="text-purple-600">trọn đời</strong> — không hết hạn</p>
                                    ) : editMode === 'extend' && editingUser.revitLicenseExpiry ? (
                                        (() => {
                                            const oldExpiry = new Date(editingUser.revitLicenseExpiry);
                                            const baseDate = oldExpiry > new Date() ? oldExpiry : new Date();
                                            const newExpiry = calcExpiry(baseDate, editPlan);
                                            return (
                                                <p>
                                                    ➕ Gia hạn từ: <strong>{baseDate.toLocaleDateString('vi-VN')}</strong>
                                                    {' → '}Hết hạn mới: <strong className="text-emerald-600">
                                                        {newExpiry ? newExpiry.toLocaleDateString('vi-VN') : '—'}
                                                    </strong>
                                                </p>
                                            );
                                        })()
                                    ) : (
                                        <p>
                                            📅 Bắt đầu: <strong>{new Date().toLocaleDateString('vi-VN')}</strong>
                                            {' → '}Hết hạn: <strong className="text-indigo-600">
                                                {(() => {
                                                    const exp = calcExpiry(new Date(), editPlan);
                                                    return exp ? exp.toLocaleDateString('vi-VN') : '—';
                                                })()}
                                            </strong>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={isEditSubmitting}
                                    onClick={handleEditPlan}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-60"
                                >
                                    {isEditSubmitting ? 'Đang lưu...' : '✅ Lưu thay đổi'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
