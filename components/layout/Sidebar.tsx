'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ZfIcon from '@/components/ui/ZfIcon';
import type { ZfIconName } from '@/components/ui/ZfIcon';

interface NavItem {
    href: string;
    label: string;
    icon: ZfIconName;
}

const navItems: NavItem[] = [
    { href: '/', label: 'Tổng quan', icon: 'dashboard' },
    { href: '/projects', label: 'Dự án', icon: 'projects' },
    { href: '/quotations', label: 'Báo giá', icon: 'quotations' },
    { href: '/customers', label: 'Khách hàng', icon: 'customers' },
    { href: '/users', label: 'Quản lý User', icon: 'user' },
    { href: '/company-profile', label: 'Hồ sơ công ty', icon: 'companyProfile' },
    { href: '/settings', label: 'Cài đặt', icon: 'settings' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(true);

    return (
        <aside className={`bg-zf-primary text-zf-text-inverse ${collapsed ? 'w-16' : 'w-64'}`}>
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
                                ←
                            </button>
                        )}
                    </div>
                    {collapsed && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="w-full mt-2 rounded-lg p-2 text-zf-text-inverse hover:bg-zf-primary-light/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-zf-primary"
                            title="Mở rộng"
                        >
                            →
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-2">
                    {navItems.map((item) => {
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

                {/* Footer */}
                <div className="p-3 border-t border-zf-primary-light/40">
                    {!collapsed && (
                        <div className="text-xs text-zf-text-inverse/85">
                            <p>Version 1.0.0</p>
                            <p className="mt-1">© 2026 ZFENIX</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
