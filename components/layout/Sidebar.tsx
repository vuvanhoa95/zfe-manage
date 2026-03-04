'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import ZfIcon from '@/components/ui/ZfIcon';
import type { ZfIconName } from '@/components/ui/ZfIcon';
import { can, type Permission } from '@/lib/rbac';

interface NavItem {
    href: string;
    label: string;
    icon: ZfIconName;
    permission: Permission; // Quyền cần có để hiển thị menu item
}

const navItems: NavItem[] = [
    { href: '/',                  label: 'Tổng quan',      icon: 'dashboard',       permission: 'nav:dashboard' },
    { href: '/projects',          label: 'Dự án',          icon: 'briefcase',       permission: 'nav:projects' },
    { href: '/quotations',        label: 'Báo giá',        icon: 'fileInvoice',     permission: 'nav:quotations' },
    { href: '/customers',         label: 'Khách hàng',     icon: 'customers',       permission: 'nav:customers' },
    { href: '/reports',           label: 'Báo cáo',        icon: 'reports',         permission: 'nav:reports' },
    { href: '/users',             label: 'Quản lý User',   icon: 'users',           permission: 'nav:users' },
    { href: '/company-profile',   label: 'Hồ sơ công ty',  icon: 'companyProfile',  permission: 'nav:company_profile' },
    { href: '/settings',          label: 'Cài đặt',        icon: 'gear',            permission: 'nav:settings' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(true);
    const { data: session, status } = useSession();

    const userRole = (session?.user as any)?.role as string | undefined;

    // Lọc nav items theo permission của user (ẩn trong lúc loading để tránh flash)
    const visibleNavItems = status === 'loading'
        ? []
        : navItems.filter((item) => can(userRole, item.permission));

    return (
        <aside className={`bg-zf-primary text-zf-text-inverse ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
            <div className="h-full flex flex-col">
                {/* Logo */}
                <div className="p-4 border-b border-zf-primary-light/40">
                    <div className="flex items-center justify-between">
                        <div className={`${collapsed ? 'mx-auto' : 'flex-1'}`}>
                            <img
                                src="/logo-white.png"
                                alt="ZFENIX Logo"
                                className="h-9 w-auto object-contain drop-shadow-lg"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (target.src !== '/logo.png') {
                                        target.src = '/logo.png';
                                    }
                                }}
                            />
                        </div>
                        {!collapsed && (
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="rounded-lg p-2 text-zf-text-inverse hover:bg-zf-primary-light/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-zf-primary"
                                title="Thu gọn"
                            >
                                <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 288 480 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-370.7 0 73.4-73.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-128 128z"/></svg>
                            </button>
                        )}
                    </div>
                    {collapsed && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="w-full mt-2 rounded-lg p-2 text-zf-text-inverse hover:bg-zf-primary-light/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-zf-primary"
                            title="Mở rộng"
                        >
                            <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor" className="mx-auto"><path d="M502.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-128 128c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L402.7 288H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H402.7L329.4 150.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l128 128z"/></svg>
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
                    {visibleNavItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors
                  ${isActive
                                        ? 'bg-zf-accent text-zf-text-inverse shadow-md font-semibold'
                                        : 'text-zf-text-inverse/90 hover:bg-zf-primary-light/30'
                                    }
                  ${collapsed ? 'justify-center' : ''}
                `}
                                title={collapsed ? item.label : undefined}
                            >
                                <span
                                    aria-hidden="true"
                                    className="flex items-center justify-center rounded-md bg-zf-primary-light/30 p-1.5 text-zf-text-inverse"
                                >
                                    <ZfIcon name={item.icon} className="h-6 w-6" />
                                </span>
                                {!collapsed && <span className="font-medium">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer — Role Badge */}
                <div className="p-3 border-t border-zf-primary-light/40">
                    {!collapsed && (
                        <div className="text-xs text-zf-text-inverse/85">
                                {userRole && (
                                <div className="mb-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        userRole === 'ADMIN'
                                            ? 'bg-red-500/30 text-red-100'
                                            : userRole === 'PM'
                                              ? 'bg-amber-500/30 text-amber-100'
                                              : 'bg-blue-500/30 text-blue-100'
                                    }`}>
                                        <ZfIcon name={userRole === 'ADMIN' ? 'shield' : userRole === 'PM' ? 'briefcase' : 'user'} size={10} />
                                        {userRole === 'ADMIN' ? 'Admin' : userRole === 'PM' ? 'Project Manager' : 'Nhân viên'}
                                    </span>
                                </div>
                            )}
                            <p>Version 1.0.0</p>
                            <p className="mt-1">© 2026 ZFENIX</p>
                        </div>
                    )}
                    {collapsed && userRole && (
                        <div className="flex justify-center" title={userRole === 'ADMIN' ? 'Admin' : userRole === 'PM' ? 'Project Manager' : 'Nhân viên'}>
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                userRole === 'ADMIN'
                                    ? 'bg-red-500/40 text-red-100'
                                    : userRole === 'PM'
                                      ? 'bg-amber-500/40 text-amber-100'
                                      : 'bg-blue-500/40 text-blue-100'
                            }`}>
                                <ZfIcon name={userRole === 'ADMIN' ? 'shield' : userRole === 'PM' ? 'briefcase' : 'user'} size={14} />
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
