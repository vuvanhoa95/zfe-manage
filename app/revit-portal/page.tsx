'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface RevitLicenseData {
    id: string;
    email: string;
    name: string | null;
    status: string;
    licensePlan: string;
    licenseActive: boolean;
    licenseStart: string | null;
    licenseExpiry: string | null;
    machineId: string | null;
    lastLogin: string | null;
    createdAt: string;
}

const PLAN_LABELS: Record<string, string> = {
    '1M': '1 Tháng',
    '3M': '3 Tháng',
    '6M': '6 Tháng',
    '1Y': '1 Năm',
    'LIFETIME': 'Trọn Đời',
};

function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function getDaysRemaining(expiryStr: string | null): number | null {
    if (!expiryStr) return null;
    const diff = new Date(expiryStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function RevitPortalPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [licenseData, setLicenseData] = useState<RevitLicenseData | null>(null);
    const [loading, setLoading] = useState(true);

    const currentUser = session?.user as any;

    // ── Canvas particle trail ──
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Array<{
        x: number; y: number; vx: number; vy: number;
        life: number; size: number; color: string;
    }>>([]);
    const animFrameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);
        const onMouseMove = (e: MouseEvent) => {
            for (let i = 0; i < 2; i++) {
                particlesRef.current.push({
                    x: e.clientX, y: e.clientY,
                    vx: (Math.random() - 0.5) * 2.5,
                    vy: (Math.random() - 0.5) * 2.5,
                    life: 1, size: 2.5 + Math.random() * 1.5,
                    color: `hsl(${180 + Math.random() * 60}, 80%, ${50 + Math.random() * 20}%)`,
                });
            }
        };
        window.addEventListener('mousemove', onMouseMove);
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particlesRef.current = particlesRef.current.filter((p) => {
                p.x += p.vx; p.y += p.vy; p.life -= 0.02; p.size *= 0.98;
                ctx.save(); ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
                return p.life > 0 && p.size > 0.1;
            });
            animFrameRef.current = requestAnimationFrame(animate);
        };
        animate();
        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMouseMove);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    // Fetch license data
    useEffect(() => {
        if (status !== 'authenticated' || currentUser?.userType !== 'revit') return;
        fetch('/api/revit-portal/me')
            .then(res => res.json())
            .then(result => {
                if (result.success) setLicenseData(result.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [status, currentUser?.userType]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#001529] via-[#000d1a] to-[#001529]">
                <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        router.push('/login');
        return null;
    }

    // Nếu không phải revit user, redirect về dashboard
    if (currentUser?.userType !== 'revit') {
        router.push('/');
        return null;
    }

    const daysRemaining = getDaysRemaining(licenseData?.licenseExpiry ?? null);
    const isExpired = daysRemaining !== null && daysRemaining <= 0;
    const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7;

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8">
            {/* Navy Dark Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#001529] via-[#000d1a] to-[#001529]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_80%_85%,rgba(34,211,238,0.15),transparent_50%),radial-gradient(circle_at_50%_50%,rgba(129,140,248,0.1),transparent_65%)]" />
                <div className="absolute top-20 left-20 w-80 h-80 bg-cyan-500/[0.14] rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-sky-500/[0.14] rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute inset-0 opacity-[0.03] scan-lines" />
                <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[1]" />
            </div>

            {/* Portal Card */}
            <div className="relative z-10 w-full max-w-lg">
                <div className="backdrop-blur-2xl rounded-3xl shadow-2xl border bg-slate-900/85 border-cyan-500/20 shadow-[0_25px_50px_-12px_rgba(56,189,248,0.25)]">
                    {/* Header */}
                    <div className="pt-8 px-6 pb-4 text-center border-b border-white/5">
                        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight uppercase select-none zfenix-logo mb-3">
                            <span>ZFENIX</span>
                        </h1>
                        <p className="text-cyan-400/60 text-[10px] uppercase tracking-[4px] font-medium">REVIT LICENSE PORTAL</p>
                    </div>

                    <div className="p-6 sm:p-8 space-y-5">
                        {/* User Info Card */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/30 to-sky-500/30 rounded-full flex items-center justify-center text-cyan-300 font-bold text-xl border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
                                {licenseData?.name?.charAt(0)?.toUpperCase() || currentUser?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-100 text-lg truncate">{licenseData?.name || currentUser?.name || 'User'}</div>
                                <div className="text-sm text-slate-400 truncate">{licenseData?.email || currentUser?.email}</div>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="px-3 py-1.5 text-xs bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                                title="Đăng xuất"
                            >
                                Đăng xuất
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                            </div>
                        ) : licenseData ? (
                            <>
                                {/* License Status Banner */}
                                <div className={`rounded-2xl p-5 border ${!licenseData.licenseActive || isExpired
                                        ? 'bg-red-500/10 border-red-500/30'
                                        : isExpiringSoon
                                            ? 'bg-amber-500/10 border-amber-500/30'
                                            : 'bg-emerald-500/10 border-emerald-500/30'
                                    }`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-3 h-3 rounded-full animate-pulse ${!licenseData.licenseActive || isExpired
                                                ? 'bg-red-500'
                                                : isExpiringSoon
                                                    ? 'bg-amber-500'
                                                    : 'bg-emerald-500'
                                            }`} />
                                        <span className={`font-bold text-lg ${!licenseData.licenseActive || isExpired
                                                ? 'text-red-400'
                                                : isExpiringSoon
                                                    ? 'text-amber-400'
                                                    : 'text-emerald-400'
                                            }`}>
                                            {!licenseData.licenseActive
                                                ? '🔒 License Bị Khóa'
                                                : isExpired
                                                    ? '⏰ License Hết Hạn'
                                                    : isExpiringSoon
                                                        ? `⚠️ Sắp Hết Hạn (${daysRemaining} ngày)`
                                                        : '✅ License Đang Hoạt Động'
                                            }
                                        </span>
                                    </div>
                                    {daysRemaining !== null && !isExpired && licenseData.licenseActive && (
                                        <p className="text-sm text-slate-400">
                                            Còn <strong className="text-slate-200">{daysRemaining}</strong> ngày sử dụng
                                        </p>
                                    )}
                                </div>

                                {/* License Details Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Gói License</div>
                                        <div className="text-lg font-bold text-cyan-400">
                                            {PLAN_LABELS[licenseData.licensePlan] || licenseData.licensePlan}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Trạng Thái</div>
                                        <div className={`text-lg font-bold ${licenseData.licenseActive ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {licenseData.licenseActive ? 'Active' : 'Inactive'}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Ngày Bắt Đầu</div>
                                        <div className="text-sm font-semibold text-slate-200">
                                            {formatDate(licenseData.licenseStart)}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Ngày Hết Hạn</div>
                                        <div className={`text-sm font-semibold ${isExpired ? 'text-red-400' : 'text-slate-200'}`}>
                                            {licenseData.licensePlan === 'LIFETIME' ? '♾️ Trọn đời' : formatDate(licenseData.licenseExpiry)}
                                        </div>
                                    </div>
                                </div>

                                {/* Machine & Last Login Info */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500 uppercase tracking-wider">Thiết bị đang kích hoạt</span>
                                        <span className="text-xs text-slate-300 font-mono">
                                            {licenseData.machineId
                                                ? `${licenseData.machineId.substring(0, 8)}...${licenseData.machineId.slice(-4)}`
                                                : 'Chưa kích hoạt'}
                                        </span>
                                    </div>
                                    <div className="h-px bg-white/5" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500 uppercase tracking-wider">Lần cuối đăng nhập</span>
                                        <span className="text-xs text-slate-300">
                                            {licenseData.lastLogin
                                                ? new Date(licenseData.lastLogin).toLocaleString('vi-VN')
                                                : 'Chưa có'}
                                        </span>
                                    </div>
                                    <div className="h-px bg-white/5" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500 uppercase tracking-wider">Ngày tạo tài khoản</span>
                                        <span className="text-xs text-slate-300">
                                            {formatDate(licenseData.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => router.push('/change-password')}
                                        className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all shadow-lg bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-600 hover:from-cyan-600 hover:via-sky-600 hover:to-cyan-700 shadow-cyan-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        🔑 Đổi mật khẩu
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-slate-400">Không thể tải thông tin license</p>
                            </div>
                        )}

                        <p className="text-center text-xs text-slate-500 pt-2">
                            © 2026 ZFENIX · <span className="italic">Trustworthy Pinnacle</span>
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .zfenix-logo span {
                    display: inline-block;
                    background: linear-gradient(135deg, #ffffff 0%, #bae6fd 30%, #38bdf8 50%, #bae6fd 70%, #ffffff 100%);
                    background-size: 200% 200%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: gradient-shift 3s ease-in-out infinite;
                    filter: drop-shadow(0 0 16px rgba(56,189,248,0.4));
                    text-shadow: none;
                }
                @keyframes gradient-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .scan-lines {
                    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(56,189,248,0.3) 2px, rgba(56,189,248,0.3) 4px);
                    animation: scan 8s linear infinite;
                }
                @keyframes scan {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 100px; }
                }
            `}</style>
        </div>
    );
}
