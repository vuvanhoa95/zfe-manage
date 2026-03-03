'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
    RBAC_DEFAULTS,
    PERMISSION_GROUPS,
    computePermissions,
    type Permission,
    type PermissionOverrides,
    type SystemRole,
} from '@/lib/rbac';
import { useReloadPermissions } from '@/components/auth/RBACProvider';

const ROLES: SystemRole[] = ['ADMIN', 'PM', 'USER'];

const ROLE_META: Record<SystemRole, { label: string; emoji: string; color: string; headerBg: string; headerText: string; canEdit: boolean }> = {
    ADMIN: {
        label: 'Admin',
        emoji: '👑',
        color: 'red',
        headerBg: 'bg-red-600',
        headerText: 'text-white',
        canEdit: false, // ADMIN luôn toàn quyền, không được bỏ bất kỳ quyền nào
    },
    PM: {
        label: 'Project Manager',
        emoji: '📋',
        color: 'amber',
        headerBg: 'bg-amber-500',
        headerText: 'text-white',
        canEdit: true,
    },
    USER: {
        label: 'Nhân viên',
        emoji: '👤',
        color: 'blue',
        headerBg: 'bg-blue-600',
        headerText: 'text-white',
        canEdit: true,
    },
};

type RuntimeData = {
    runtime: Record<SystemRole, string[]>;
    overrides: PermissionOverrides;
    hasOverrides: boolean;
    updatedAt: string | null;
    updatedBy: string | null;
};

type LocalMatrix = Record<SystemRole, Set<Permission>>;

export default function PermissionsPage() {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role as string | undefined;
    const reloadRBAC = useReloadPermissions();

    const [runtimeData, setRuntimeData] = useState<RuntimeData | null>(null);
    const [localMatrix, setLocalMatrix] = useState<LocalMatrix | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const [filterText, setFilterText] = useState('');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/permissions/runtime', { cache: 'no-store' });
            const json = await res.json() as { success: boolean; data: RuntimeData };
            if (json.success) {
                setRuntimeData(json.data);
                // Init local matrix từ runtime
                setLocalMatrix({
                    ADMIN: new Set(json.data.runtime.ADMIN as Permission[]),
                    PM:    new Set(json.data.runtime.PM as Permission[]),
                    USER:  new Set(json.data.runtime.USER as Permission[]),
                });
                setHasChanges(false);
            }
        } catch {
            showToast('Không tải được cấu hình quyền', 'error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const togglePermission = (role: SystemRole, perm: Permission) => {
        if (!localMatrix) return;
        if (ROLE_META[role].canEdit === false) return; // Lock ADMIN

        setLocalMatrix(prev => {
            if (!prev) return prev;
            const newSet = new Set(prev[role]);
            if (newSet.has(perm)) {
                newSet.delete(perm);
            } else {
                newSet.add(perm);
            }
            return { ...prev, [role]: newSet };
        });
        setHasChanges(true);
    };

    // Tính diff so với defaults để lấy overrides
    const computeOverrides = (): PermissionOverrides => {
        if (!localMatrix) return {};
        const overrides: PermissionOverrides = {};

        for (const role of (['PM', 'USER'] as SystemRole[])) {
            const defaults = new Set(RBAC_DEFAULTS[role]);
            const current = localMatrix[role];
            const roleOverrides: Partial<Record<Permission, boolean>> = {};
            let hasDiff = false;

            // Quyền được thêm (không trong defaults)
            for (const perm of current) {
                if (!defaults.has(perm)) {
                    roleOverrides[perm] = true;
                    hasDiff = true;
                }
            }
            // Quyền bị bỏ (trong defaults nhưng không còn)
            for (const perm of defaults) {
                if (!current.has(perm)) {
                    roleOverrides[perm] = false;
                    hasDiff = true;
                }
            }

            if (hasDiff) {
                overrides[role] = roleOverrides;
            }
        }
        return overrides;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const overrides = computeOverrides();
            const res = await fetch('/api/admin/permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ overrides }),
            });
            const json = await res.json() as { success: boolean; message?: string; error?: string };
            if (json.success) {
                setSavedAt(new Date().toLocaleTimeString('vi-VN'));
                setHasChanges(false);
                await reloadRBAC();
                showToast('✅ Đã lưu cấu hình phân quyền!');
                void fetchData();
            } else {
                showToast(json.error ?? 'Lỗi khi lưu', 'error');
            }
        } catch {
            showToast('Lỗi kết nối server', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('Reset về cấu hình mặc định? Toàn bộ thay đổi tùy chỉnh sẽ bị xóa.')) return;
        setIsResetting(true);
        try {
            const res = await fetch('/api/admin/permissions', { method: 'DELETE' });
            const json = await res.json() as { success: boolean };
            if (json.success) {
                await reloadRBAC();
                showToast('♻️ Đã reset về mặc định!');
                void fetchData();
            } else {
                showToast('Lỗi khi reset', 'error');
            }
        } catch {
            showToast('Lỗi kết nối server', 'error');
        } finally {
            setIsResetting(false);
        }
    };

    // Toggle toàn bộ nhóm
    const toggleGroup = (role: SystemRole, groupPerms: Permission[], forceState?: boolean) => {
        if (ROLE_META[role].canEdit === false) return;
        const allGranted = groupPerms.every(p => localMatrix?.[role]?.has(p));
        const targetState = forceState !== undefined ? forceState : !allGranted;

        setLocalMatrix(prev => {
            if (!prev) return prev;
            const newSet = new Set(prev[role]);
            for (const perm of groupPerms) {
                if (targetState) newSet.add(perm);
                else newSet.delete(perm);
            }
            return { ...prev, [role]: newSet };
        });
        setHasChanges(true);
    };

    if (userRole !== 'ADMIN') {
        return (
            <div className="px-6 py-8">
                <div className="max-w-lg mx-auto bg-white border border-red-100 rounded-2xl p-8 shadow-sm text-center">
                    <div className="text-5xl mb-4">🔒</div>
                    <h2 className="text-xl font-bold text-red-700 mb-2">Truy cập bị giới hạn</h2>
                    <p className="text-sm text-gray-600">Trang này chỉ dành cho <strong>Quản trị viên (Admin)</strong>.</p>
                </div>
            </div>
        );
    }

    const filteredGroups = PERMISSION_GROUPS.filter(g =>
        !filterText ||
        g.group.toLowerCase().includes(filterText.toLowerCase()) ||
        g.permissions.some(p =>
            p.label.toLowerCase().includes(filterText.toLowerCase()) ||
            p.key.includes(filterText.toLowerCase())
        )
    );

    const overrides = computeOverrides();
    const totalOverrides = Object.values(overrides).reduce((acc, ro) => acc + Object.keys(ro ?? {}).length, 0);

    return (
        <div className="px-4 py-4 md:px-6 md:py-5 space-y-4 pb-32">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium text-white transition-all animate-in slide-in-from-right duration-300 ${
                    toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
                }`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        🛡️ Điều chỉnh phân quyền
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Toggle để bật/tắt quyền cho từng role. Thay đổi có hiệu lực ngay sau khi nhấn <strong>Lưu</strong>.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {runtimeData?.hasOverrides && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                            {totalOverrides} tùy chỉnh đang active
                        </span>
                    )}
                    {runtimeData?.updatedBy && (
                        <span className="text-xs text-gray-400">
                            Cập nhật bởi <strong>{runtimeData.updatedBy}</strong>
                        </span>
                    )}
                </div>
            </div>

            {/* Role header cards */}
            <div className="grid grid-cols-3 gap-3">
                {ROLES.map(role => {
                    const meta = ROLE_META[role];
                    const permsCount = localMatrix?.[role]?.size ?? 0;
                    const defaultCount = RBAC_DEFAULTS[role].length;
                    const diff = permsCount - defaultCount;
                    return (
                        <div key={role} className={`rounded-xl p-4 ${meta.headerBg} text-white`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{meta.emoji}</span>
                                <div>
                                    <p className="font-bold text-sm">{meta.label}</p>
                                    <p className="text-xs opacity-80">{role}</p>
                                </div>
                            </div>
                            <p className="text-2xl font-bold mt-2">{permsCount}</p>
                            <p className="text-xs opacity-80">quyền được cấp</p>
                            {diff !== 0 && (
                                <p className={`text-xs mt-1 font-semibold ${diff > 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {diff > 0 ? `+${diff}` : diff} so với mặc định
                                </p>
                            )}
                            {!meta.canEdit && (
                                <p className="text-xs opacity-70 mt-1 flex items-center gap-1">🔒 Không thể chỉnh sửa</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Info banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <span className="text-base flex-shrink-0">ℹ️</span>
                <p className="text-xs text-amber-800">
                    <strong>ADMIN</strong> luôn có toàn quyền và không thể bị hạn chế.
                    Bạn chỉ có thể điều chỉnh quyền của <strong>PM</strong> và <strong>USER</strong>.
                    Role trong từng dự án (MANAGER/MEMBER/VIEWER) không bị ảnh hưởng.
                </p>
            </div>

            {/* Filter + Action bar */}
            <div className="sticky top-0 z-20 bg-gray-100 py-2">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm quyền..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        onClick={handleReset}
                        disabled={isResetting || !runtimeData?.hasOverrides}
                        className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isResetting ? '...' : '♻️ Reset'}
                    </button>
                    {hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-md disabled:opacity-60 flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>💾 Lưu thay đổi</>
                            )}
                        </button>
                    )}
                    {!hasChanges && savedAt && (
                        <span className="text-xs text-emerald-600 font-medium">✅ Đã lưu lúc {savedAt}</span>
                    )}
                </div>
            </div>

            {/* Permission Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <span className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredGroups.map(({ group, icon, permissions }) => {
                        const groupPerms = permissions.map(p => p.key);
                        const isExpanded = activeGroup === null || activeGroup === group;

                        return (
                            <div key={group} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                {/* Group header */}
                                <button
                                    type="button"
                                    onClick={() => setActiveGroup(prev => prev === group ? null : group)}
                                    className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{icon}</span>
                                        <span className="font-semibold text-gray-800 text-sm">{group}</span>
                                        <span className="text-xs text-gray-400">({permissions.length} quyền)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Quick toggle for PM/USER */}
                                        {(['PM', 'USER'] as SystemRole[]).map(role => {
                                            const allGranted = groupPerms.every(p => localMatrix?.[role]?.has(p as Permission));
                                            const someGranted = groupPerms.some(p => localMatrix?.[role]?.has(p as Permission));
                                            const meta = ROLE_META[role];
                                            return (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleGroup(role, groupPerms as Permission[]);
                                                    }}
                                                    title={`Toggle tất cả cho ${meta.label}`}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                        allGranted
                                                            ? role === 'PM'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                            : someGranted
                                                              ? 'bg-gray-100 text-gray-500'
                                                              : 'bg-gray-50 text-gray-400'
                                                    }`}
                                                >
                                                    {meta.emoji} {allGranted ? '✓ Tất cả' : someGranted ? '~ Một phần' : '✗ Không có'}
                                                </button>
                                            );
                                        })}
                                        <svg
                                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {/* Permission rows */}
                                {(isExpanded || activeGroup === null) && (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-50">
                                                <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                    Quyền
                                                </th>
                                                {ROLES.map(role => (
                                                    <th
                                                        key={role}
                                                        className={`px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wide w-28 ${
                                                            role === 'ADMIN' ? 'text-red-500' : role === 'PM' ? 'text-amber-600' : 'text-blue-600'
                                                        }`}
                                                    >
                                                        {ROLE_META[role].emoji} {role}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {permissions
                                                .filter(p => !filterText ||
                                                    p.label.toLowerCase().includes(filterText.toLowerCase()) ||
                                                    p.key.includes(filterText.toLowerCase())
                                                )
                                                .map(({ key, label, description }) => {
                                                    const hasDefaultChanged = {
                                                        PM: (RBAC_DEFAULTS.PM.includes(key) !== localMatrix?.PM?.has(key)),
                                                        USER: (RBAC_DEFAULTS.USER.includes(key) !== localMatrix?.USER?.has(key)),
                                                    };

                                                    return (
                                                        <tr key={key} className={`hover:bg-gray-50 transition-colors ${
                                                            hasDefaultChanged.PM || hasDefaultChanged.USER ? 'bg-yellow-50/40' : ''
                                                        }`}>
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-800">{label}</p>
                                                                        {description && (
                                                                            <p className="text-xs text-gray-400">{description}</p>
                                                                        )}
                                                                        <code className="text-[10px] text-gray-300 font-mono">{key}</code>
                                                                    </div>
                                                                    {(hasDefaultChanged.PM || hasDefaultChanged.USER) && (
                                                                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium ml-1">
                                                                            Đã thay đổi
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* ADMIN — luôn có, không toggle */}
                                                            <td className="px-4 py-3 text-center">
                                                                <span
                                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 cursor-not-allowed"
                                                                    title="ADMIN luôn có quyền này"
                                                                >
                                                                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </span>
                                                            </td>

                                                            {/* PM & USER — có thể toggle */}
                                                            {(['PM', 'USER'] as SystemRole[]).map(role => {
                                                                const granted = localMatrix?.[role]?.has(key) ?? false;
                                                                const isDefault = RBAC_DEFAULTS[role].includes(key);
                                                                const changed = granted !== isDefault;
                                                                return (
                                                                    <td key={role} className="px-4 py-3 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => togglePermission(role, key)}
                                                                            title={granted ? 'Nhấn để tắt quyền' : 'Nhấn để bật quyền'}
                                                                            className={`relative inline-flex items-center justify-center w-11 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                                                granted
                                                                                    ? role === 'PM'
                                                                                        ? 'bg-amber-400 focus:ring-amber-400'
                                                                                        : 'bg-blue-500 focus:ring-blue-500'
                                                                                    : 'bg-gray-200 focus:ring-gray-400'
                                                                            } ${changed ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}
                                                                        >
                                                                            <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${
                                                                                granted ? 'translate-x-2.5' : '-translate-x-2.5'
                                                                            }`} />
                                                                        </button>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Floating save bar khi có thay đổi */}
            {hasChanges && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
                    <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-300">
                        <span className="text-sm">
                            💡 Bạn có <strong>{totalOverrides}</strong> thay đổi chưa lưu
                        </span>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-5 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 flex items-center gap-2"
                        >
                            {isSaving ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : '💾'}
                            Lưu ngay
                        </button>
                        <button
                            onClick={() => { void fetchData(); setHasChanges(false); }}
                            className="text-sm text-gray-400 hover:text-white transition"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
