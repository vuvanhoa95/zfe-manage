'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
    const { data: session, status } = useSession();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const pathname = usePathname();

    if (status === 'loading') return <div className="h-12 bg-white border-b animate-pulse" />;

    const user: any = session?.user || {
        name: 'Guest User',
        email: '',
        role: 'GUEST',
    };

    const getPageMeta = (path: string): { title: string; subtitle?: string; icon?: string } => {
        if (path === '/') return { title: 'Dashboard', subtitle: 'Tổng quan dữ liệu hệ thống', icon: '📊' };
        if (path === '/projects') return { title: 'Dự án', subtitle: 'Danh sách & bộ lọc dự án', icon: '📁' };
        if (path === '/projects/new') return { title: 'Tạo dự án', subtitle: 'Khởi tạo thông tin dự án mới', icon: '➕' };
        if (path.startsWith('/projects/')) return { title: 'Chi tiết dự án', subtitle: 'Thông tin & dòng tiền dự án', icon: '📌' };

        if (path === '/quotations') return { title: 'Báo giá', subtitle: 'Danh sách báo giá', icon: '📄' };
        if (path === '/quotations/new') return { title: 'Tạo báo giá', subtitle: 'Nhập dữ liệu & xem trước', icon: '➕' };
        if (path.includes('/quotations/') && path.endsWith('/edit')) return { title: 'Chỉnh sửa báo giá', icon: '✏️' };
        if (path.includes('/quotations/') && path.endsWith('/versions')) return { title: 'Lịch sử báo giá', icon: '🕒' };
        if (path.startsWith('/quotations/')) return { title: 'Báo giá', icon: '📄' };

        if (path === '/customers') return { title: 'Khách hàng', subtitle: 'Danh bạ khách hàng & đối tác', icon: '👥' };
        if (path === '/outsourcing-staff') return { title: 'Nhân sự outsource', subtitle: 'Danh sách & chi phí nhân sự', icon: '👷' };
        if (path === '/company-profile') return { title: 'Hồ sơ công ty', subtitle: 'Thông tin dùng cho xuất báo giá', icon: '🏢' };
        if (path === '/settings') return { title: 'Cài đặt', subtitle: 'Cấu hình hệ thống', icon: '⚙️' };
        if (path === '/reports') return { title: 'Báo cáo', subtitle: 'Tổng hợp hiệu quả báo giá', icon: '📈' };

        return { title: 'Hệ thống báo giá', subtitle: 'ZFENIX Quotation Management', icon: '🧾' };
    };

    const { title, subtitle, icon } = getPageMeta(pathname || '/');

    const crumbs = (() => {
        const path = (pathname || '/').split('?')[0];
        if (path === '/') return [{ href: '/', label: 'ZFENIX' }];

        const mapLabel = (segment: string): string => {
            if (segment === 'projects') return 'Dự án';
            if (segment === 'quotations') return 'Báo giá';
            if (segment === 'customers') return 'Khách hàng';
            if (segment === 'outsourcing-staff') return 'Nhân sự outsource';
            if (segment === 'company-profile') return 'Hồ sơ công ty';
            if (segment === 'settings') return 'Cài đặt';
            if (segment === 'reports') return 'Báo cáo';
            if (segment === 'new') return 'Tạo mới';
            if (segment === 'edit') return 'Chỉnh sửa';
            if (segment === 'versions') return 'Phiên bản';
            return segment;
        };

        const parts = path.split('/').filter(Boolean);
        const out: Array<{ href: string; label: string }> = [{ href: '/', label: 'ZFENIX' }];
        let acc = '';
        parts.forEach((p) => {
            acc += `/${p}`;
            out.push({ href: acc, label: mapLabel(p) });
        });
        return out.slice(0, 3);
    })();

    return (
        <header className="bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                    {icon ? (
                        <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border border-zf-error/20 bg-zf-error/10 text-zf-error">
                            <span className="text-lg" aria-hidden="true">
                                {icon}
                            </span>
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        <nav className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                            {crumbs.map((c, idx) => (
                                <span key={c.href} className="flex items-center gap-2 min-w-0">
                                    <Link href={c.href} className="hover:text-zf-accent truncate">
                                        {c.label}
                                    </Link>
                                    {idx < crumbs.length - 1 ? <span aria-hidden="true">/</span> : null}
                                </span>
                            ))}
                        </nav>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-extrabold text-zf-error leading-tight truncate uppercase tracking-wide">
                                {title}
                            </p>
                            <div className="mt-1 h-0.5 w-14 rounded-full bg-gradient-to-r from-zf-error via-zf-accent to-zf-error" />
                            {subtitle ? (
                                <p className="mt-1 text-sm text-gray-500 leading-tight truncate hidden sm:block">
                                    {subtitle}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {/* Notifications (Future) */}
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg relative transition-colors" aria-label="Thông báo" type="button">
                        <span className="text-lg">🔔</span>
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zf-accent text-sm font-bold text-zf-text-inverse">
                                {user.name.charAt(0)}
                            </div>
                            <div className="text-left hidden lg:block leading-tight">
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.role}</p>
                            </div>
                            <span className="text-gray-400 text-xs">▼</span>
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors">
                                    👤 Profile
                                </button>
                                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors">
                                    ⚙️ Settings
                                </button>
                                <hr className="my-1" />
                                <button
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    🚪 Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
