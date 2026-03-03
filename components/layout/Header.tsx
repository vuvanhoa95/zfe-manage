'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { formatVND } from '@/lib/number-to-words-vn';
import ZfIcon from '@/components/ui/ZfIcon';
import type { ZfIconName } from '@/components/ui/ZfIcon';

type AlertType = 'deadline' | 'overdue' | 'low-cash' | 'pending-quotation' | 'pending-user' | 'task-due';
type AlertSeverity = 'high' | 'medium' | 'low';

type Alert = {
    id: string;
    type: AlertType;
    title: string;
    message: string;
    link?: string;
    severity: AlertSeverity;
    date?: string;
};

type SmartSearchProject = {
    id: string;
    projectNo: string;
    name: string;
    code?: string | null;
    customerName: string;
    status: string;
    location: string | null;
    totalRevenue: number;
    totalProfit: number;
};

export default function Header() {
    const { data: session, status } = useSession();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const isDashboard = (pathname || '/') === '/';

    const [searchQuery, setSearchQuery] = useState<string>('');
    const debouncedSearchQuery = useDebounce(searchQuery, 400);
    const [searchResults, setSearchResults] = useState<SmartSearchProject[]>([]);
    const [searching, setSearching] = useState<boolean>(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // ── Notifications ──────────────────────────────────────────────────────────
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loadingAlerts, setLoadingAlerts] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const fetchAlerts = useCallback(async () => {
        if (!session?.user) return;
        try {
            setLoadingAlerts(true);
            const res = await fetch('/api/dashboard/alerts', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setAlerts(data.alerts || []);
            }
        } catch {
            // silent
        } finally {
            setLoadingAlerts(false);
        }
    }, [session?.user]);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60_000); // refresh mỗi 60 giây
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    // Đóng dropdown khi click ngoài
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const highCount = alerts.filter((a) => a.severity === 'high').length;
    const totalCount = alerts.length;

    const getAlertIcon = (type: AlertType): string => {
        switch (type) {
            case 'pending-user': return '👤';
            case 'task-due': return '✅';
            case 'deadline': return '📅';
            case 'overdue': return '⚠️';
            case 'low-cash': return '💰';
            case 'pending-quotation': return '📋';
            default: return '🔔';
        }
    };

    const getSeverityStyle = (severity: AlertSeverity) => {
        switch (severity) {
            case 'high': return { border: '#ef4444', bg: '#fef2f2', text: '#b91c1c', badge: '#ef4444' };
            case 'medium': return { border: '#f59e0b', bg: '#fffbeb', text: '#92400e', badge: '#f59e0b' };
            default: return { border: '#3b82f6', bg: '#eff6ff', text: '#1e40af', badge: '#3b82f6' };
        }
    };

    const user: any = session?.user || {
        name: 'Guest User',
        email: '',
        role: 'GUEST',
    };

    type PageIconMeta = {
        title: string;
        subtitle?: string;
        icon?: ZfIconName;
    };

    const getPageMeta = (path: string): PageIconMeta => {
        if (path === '/') return { title: 'Tổng quan', subtitle: 'Tổng quan dữ liệu hệ thống', icon: 'dashboard' };
        if (path === '/projects') return { title: 'Dự án', subtitle: 'Danh sách & bộ lọc dự án', icon: 'projects' };
        if (path === '/projects/new')
            return { title: 'Tạo dự án', subtitle: 'Khởi tạo thông tin dự án mới', icon: 'projects' };
        if (path.startsWith('/projects/'))
            return { title: 'Chi tiết dự án', subtitle: 'Thông tin & dòng tiền dự án', icon: 'projects' };

        if (path === '/quotations') return { title: 'Báo giá', subtitle: 'Danh sách báo giá', icon: 'quotations' };
        if (path === '/quotations/new')
            return { title: 'Tạo báo giá', subtitle: 'Nhập dữ liệu & xem trước', icon: 'quotations' };
        if (path.includes('/quotations/') && path.endsWith('/edit'))
            return { title: 'Chỉnh sửa báo giá', icon: 'quotations' };
        if (path.includes('/quotations/') && path.endsWith('/versions'))
            return { title: 'Lịch sử báo giá', icon: 'quotations' };
        if (path.startsWith('/quotations/')) return { title: 'Báo giá', icon: 'quotations' };

        if (path === '/customers')
            return { title: 'Khách hàng', subtitle: 'Danh bạ khách hàng & đối tác', icon: 'customers' };
        if (path === '/users')
            return {
                title: 'Quản lý User',
                subtitle: 'Danh sách tài khoản và phân quyền',
                icon: 'user',
            };
        if (path === '/company-profile')
            return {
                title: 'Hồ sơ công ty',
                subtitle: 'Thông tin dùng cho xuất báo giá',
                icon: 'companyProfile',
            };
        if (path === '/settings')
            return {
                title: 'Cài đặt',
                subtitle: 'Cấu hình hệ thống',
                icon: 'settings',
            };
        if (path === '/reports')
            return {
                title: 'Báo cáo',
                subtitle: 'Tổng hợp hiệu quả báo giá',
                icon: 'dashboard',
            };

        return {
            title: 'Zfenix Manage',
            subtitle: 'Hệ thống quản lý dự án và báo giá',
            icon: 'dashboard',
        };
    };

    const { title, subtitle, icon } = getPageMeta(pathname || '/');

    const crumbs = (() => {
        const path = (pathname || '/').split('?')[0];
        if (path === '/') return [{ href: '/', label: 'Zfenix Manage' }];

        const mapLabel = (segment: string): string => {
            if (segment === 'projects') return 'Dự án';
            if (segment === 'quotations') return 'Báo giá';
            if (segment === 'customers') return 'Khách hàng';
            if (segment === 'users') return 'Quản lý User';
            if (segment === 'company-profile') return 'Hồ sơ công ty';
            if (segment === 'settings') return 'Cài đặt';
            if (segment === 'reports') return 'Báo cáo';
            if (segment === 'new') return 'Tạo mới';
            if (segment === 'edit') return 'Chỉnh sửa';
            if (segment === 'versions') return 'Phiên bản';
            return segment;
        };

        const parts = path.split('/').filter(Boolean);
        const out: Array<{ href: string; label: string }> = [{ href: '/', label: 'Zfenix Manage' }];
        let acc = '';
        parts.forEach((p) => {
            acc += `/${p}`;
            out.push({ href: acc, label: mapLabel(p) });
        });
        return out.slice(0, 3);
    })();

    useEffect(() => {
        const performSearch = async () => {
            const query = debouncedSearchQuery.trim();

            if (!query) {
                setSearchResults([]);
                setSearchError(null);
                setSearching(false);
                return;
            }

            setSearching(true);
            setSearchError(null);

            try {
                const params = new URLSearchParams({
                    search: query,
                    page: '1',
                    pageSize: '5',
                });

                const res = await fetch(`/api/projects?${params.toString()}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache',
                    },
                });

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const result = await res.json();
                if (result.success && Array.isArray(result.data)) {
                    const mapped: SmartSearchProject[] = result.data.map((project: any) => ({
                        id: project.id,
                        projectNo: project.projectNo,
                        name: project.name,
                        code: project.code ?? null,
                        customerName: project.customer?.name ?? 'Chưa có',
                        status: project.status,
                        location: project.location ?? null,
                        totalRevenue: project.totalRevenue ?? 0,
                        totalProfit: project.totalProfit ?? 0,
                    }));
                    setSearchResults(mapped);
                } else {
                    setSearchResults([]);
                    setSearchError('Không tìm thấy dự án phù hợp.');
                }
            } catch (error) {
                console.error('Lỗi khi tìm kiếm dự án (header):', error);
                setSearchError('Lỗi khi tìm kiếm dự án. Vui lòng thử lại.');
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        };

        void performSearch();
    }, [debouncedSearchQuery, isDashboard]);

    return (
        <header className="bg-white border-b border-gray-200 px-4 py-1.5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex items-center gap-3">
                    {icon ? (
                        <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-zf-graphite/20 bg-zf-graphite/5 text-zf-graphite">
                            <ZfIcon name={icon} size={18} aria-hidden="true" />
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        <nav className="hidden sm:flex items-center gap-2 text-xs text-zf-graphite/70">
                            {crumbs.map((c, idx) => (
                                <span key={c.href} className="flex items-center gap-2 min-w-0">
                                    <Link href={c.href} className="text-zf-graphite/70 hover:text-zf-accent truncate transition-colors">
                                        {c.label}
                                    </Link>
                                    {idx < crumbs.length - 1 ? <span aria-hidden="true" className="text-zf-graphite/40">/</span> : null}
                                </span>
                            ))}
                        </nav>
                        <div className="min-w-0 flex-1">
                            <p className="text-lg sm:text-xl font-extrabold text-zf-primary leading-tight break-words">
                                {title}
                            </p>
                            <div className="mt-1 h-0.5 w-12 rounded-full bg-zf-accent" />
                            {subtitle ? (
                                <p className="mt-1 text-xs text-zf-graphite/70 leading-tight break-words hidden sm:block">
                                    {subtitle}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>

                {status === 'loading' ? (
                    <div className="w-full h-9 bg-gray-100 rounded-full animate-pulse" />
                ) : (
                    <div className="w-full md:max-w-md lg:max-w-lg">
                        <div className="relative">
                            <ZfIcon
                                name="search"
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zf-graphite/40 pointer-events-none"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Tìm kiếm nhanh dự án theo tên, mã, khách hàng..."
                                className="w-full rounded-full bg-white pl-9 pr-3 py-1.5 text-xs sm:text-sm text-zf-graphite placeholder:text-zf-graphite/50 border border-zf-graphite/15 shadow-sm focus:border-zf-accent focus:ring-2 focus:ring-zf-accent/70 outline-none transition-colors"
                                aria-label="Tìm kiếm nhanh thông tin dự án"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSearchResults([]);
                                        setSearchError(null);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-zf-graphite/50 hover:text-zf-error transition-colors"
                                >
                                    Xóa
                                </button>
                            )}
                        </div>
                        {(debouncedSearchQuery.trim().length > 0 || searching || searchError) && (
                            <div className="mt-2 rounded-2xl bg-white border border-zf-graphite/10 shadow-lg max-h-80 overflow-y-auto">
                                {searching ? (
                                    <div className="px-4 py-3 text-xs sm:text-sm text-zf-graphite/70">
                                        Đang tìm kiếm dự án...
                                    </div>
                                ) : searchError ? (
                                    <div className="px-4 py-3 text-xs sm:text-sm text-zf-error">{searchError}</div>
                                ) : searchResults.length === 0 ? (
                                    <div className="px-4 py-3 text-xs sm:text-sm text-zf-graphite/70">
                                        Không tìm thấy dự án phù hợp với từ khóa "
                                        <span className="font-semibold">{debouncedSearchQuery}</span>"
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-zf-graphite/10">
                                        {searchResults.map((project) => (
                                            <li key={project.id}>
                                                <Link
                                                    href={`/projects/${project.id}`}
                                                    className="flex flex-col gap-1 px-4 py-3 hover:bg-zf-bg-secondary/70 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-xs sm:text-sm font-semibold text-zf-primary truncate">
                                                                {project.name}
                                                            </p>
                                                            <p className="text-[11px] sm:text-xs text-zf-graphite/70 mt-0.5 truncate">
                                                                <span className="font-mono text-zf-graphite">
                                                                    {project.projectNo}
                                                                </span>
                                                                {project.code ? (
                                                                    <span className="ml-2 text-zf-graphite/60">
                                                                        ({project.code})
                                                                    </span>
                                                                ) : null}
                                                                <span className="mx-2">•</span>
                                                                <span className="font-medium">
                                                                    {project.customerName}
                                                                </span>
                                                            </p>
                                                        </div>
                                                        <div className="hidden sm:flex flex-col items-end gap-1">
                                                            <p className="text-[11px] text-zf-graphite/60">
                                                                Doanh thu:{' '}
                                                                <span className="font-semibold text-zf-success">
                                                                    {formatVND(project.totalRevenue)}
                                                                </span>
                                                            </p>
                                                            <p className="text-[11px] text-zf-graphite/60">
                                                                Lợi nhuận:{' '}
                                                                <span
                                                                    className={`font-semibold ${project.totalProfit >= 0 ? 'text-zf-success' : 'text-zf-error'
                                                                        }`}
                                                                >
                                                                    {formatVND(project.totalProfit)}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-zf-graphite/60">
                                                        <span className="inline-flex items-center rounded-full bg-zf-bg-secondary px-2 py-0.5">
                                                            Trạng thái:&nbsp;
                                                            <span className="font-semibold">
                                                                {project.status === 'PLANNING'
                                                                    ? 'Lập kế hoạch'
                                                                    : project.status === 'ACTIVE'
                                                                        ? 'Đang thực hiện'
                                                                        : project.status === 'COMPLETED'
                                                                            ? 'Hoàn thành'
                                                                            : project.status === 'CANCELLED'
                                                                                ? 'Đã hủy'
                                                                                : project.status}
                                                            </span>
                                                        </span>
                                                        {project.location && (
                                                            <span className="inline-flex items-center rounded-full bg-zf-bg-secondary px-2 py-0.5">
                                                                Địa điểm:&nbsp;
                                                                <span className="font-medium">{project.location}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-end gap-1.5">
                    {/* ── Notifications Bell ──────────────────────────────────────── */}
                    <div className="relative" ref={notifRef}>
                        <button
                            id="notification-bell-btn"
                            type="button"
                            onClick={() => setShowNotifications((v) => !v)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg relative transition-colors"
                            aria-label="Thông báo"
                        >
                            <ZfIcon name="notification" size={18} className="text-zf-graphite" aria-hidden="true" />
                            {totalCount > 0 && (
                                <span
                                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center text-[10px] font-bold text-white rounded-full"
                                    style={{ background: highCount > 0 ? '#ef4444' : '#f59e0b' }}
                                >
                                    {totalCount > 9 ? '9+' : totalCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div
                                className="absolute right-0 mt-2 z-50 flex flex-col"
                                style={{ width: '340px' }}
                            >
                                {/* Header */}
                                <div className="rounded-t-2xl bg-white border border-gray-200 shadow-xl">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                        <span className="text-sm font-bold text-gray-800">🔔 Thông báo</span>
                                        {totalCount > 0 && (
                                            <span className="text-xs text-gray-400">{totalCount} thông báo</span>
                                        )}
                                    </div>

                                    {/* Alert list */}
                                    <div className="max-h-80 overflow-y-auto">
                                        {loadingAlerts && alerts.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-sm text-gray-400">Đang tải...</div>
                                        ) : alerts.length === 0 ? (
                                            <div className="px-4 py-8 text-center">
                                                <p className="text-2xl mb-2">✅</p>
                                                <p className="text-sm text-gray-400">Không có thông báo nào</p>
                                            </div>
                                        ) : (
                                            <ul className="divide-y divide-gray-50">
                                                {alerts.map((alert) => {
                                                    const style = getSeverityStyle(alert.severity);
                                                    return (
                                                        <li key={alert.id}>
                                                            <button
                                                                type="button"
                                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3"
                                                                onClick={() => {
                                                                    setShowNotifications(false);
                                                                    if (alert.link) router.push(alert.link);
                                                                }}
                                                            >
                                                                {/* Colored indicator */}
                                                                <div
                                                                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base mt-0.5"
                                                                    style={{ background: style.bg, border: `1px solid ${style.border}` }}
                                                                >
                                                                    {getAlertIcon(alert.type)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-semibold truncate" style={{ color: style.text }}>
                                                                        {alert.title}
                                                                    </p>
                                                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                                                                        {alert.message}
                                                                    </p>
                                                                </div>
                                                                {/* Severity dot */}
                                                                <div
                                                                    className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                                                                    style={{ background: style.badge }}
                                                                />
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="px-4 py-2 border-t border-gray-100 flex justify-between items-center">
                                        <button
                                            type="button"
                                            className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                                            onClick={() => { fetchAlerts(); }}
                                        >
                                            ↻ Làm mới
                                        </button>
                                        <Link
                                            href="/users"
                                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                            onClick={() => setShowNotifications(false)}
                                        >
                                            Quản lý tài khoản →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

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
                                <p className="text-sm font-medium text-zf-graphite">{user.name}</p>
                                <p className="text-xs text-zf-graphite/70">{user.role}</p>
                            </div>
                            <span className="text-gray-400 text-xs">▼</span>
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-zf-graphite/15 py-1 z-50">
                                <div className="px-4 py-2 border-b border-zf-graphite/10">
                                    <p className="text-sm font-medium text-zf-graphite">{user.name}</p>
                                    <p className="text-xs text-zf-graphite/70">{user.email}</p>
                                </div>
                                <button className="w-full px-4 py-2 text-left text-sm text-zf-graphite hover:bg-zf-bg-secondary transition-colors">
                                    Hồ sơ
                                </button>
                                <button className="w-full px-4 py-2 text-left text-sm text-zf-graphite hover:bg-zf-bg-secondary transition-colors">
                                    Cài đặt
                                </button>
                                <hr className="my-1" />
                                <button
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
