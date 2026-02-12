'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ElementType } from 'react';
import { useState } from 'react';
import {
    Building2,
    FileText,
    FolderKanban,
    Gauge,
    HardHat,
    Settings,
    Users,
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: ElementType;
}

const navItems: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: Gauge },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/quotations', label: 'Quotations', icon: FileText },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/outsourcing-staff', label: 'Nhân sự Outsource', icon: HardHat },
    { href: '/company-profile', label: 'Company Profile', icon: Building2 },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={`bg-gradient-to-b from-zf-primary to-zf-primary-dark text-zf-text-inverse transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
        >
            <div className="h-full flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-zf-primary-light/40">
                    <div className="flex items-center justify-between">
                        <div className={`${collapsed ? 'mx-auto' : 'flex-1'}`}>
                            <img
                                src="/logo-white.png"
                                alt="ZFENIX Logo"
                                className="h-10 w-auto object-contain drop-shadow-lg"
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
                                className="rounded-lg p-2 text-zf-text-inverse transition-colors hover:bg-zf-primary-light/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-zf-primary"
                                title="Thu gọn"
                            >
                                ←
                            </button>
                        )}
                    </div>
                    {collapsed && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="w-full mt-3 rounded-lg p-2 text-zf-text-inverse transition-colors hover:bg-zf-primary-light/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-zf-primary"
                            title="Mở rộng"
                        >
                            →
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive
                                        ? 'bg-zf-accent/25 text-zf-text-inverse shadow-lg font-semibold'
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
                                    <item.icon className="h-5 w-5" />
                                </span>
                                {!collapsed && <span className="font-medium">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-zf-primary-light/40">
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
