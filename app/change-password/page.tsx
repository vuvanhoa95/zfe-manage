'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const currentUser = session?.user as any;
    const mustChange = currentUser?.mustChangePassword;

    // ── Canvas particle trail (giống login page) ──────────────────────
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

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const onMouseMove = (e: MouseEvent) => {
            for (let i = 0; i < 3; i++) {
                particlesRef.current.push({
                    x: e.clientX, y: e.clientY,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    life: 1,
                    size: 3 + Math.random() * 2,
                    color: `hsl(${180 + Math.random() * 60}, 80%, ${50 + Math.random() * 20}%)`,
                });
            }
        };
        window.addEventListener('mousemove', onMouseMove);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particlesRef.current = particlesRef.current.filter((p) => {
                p.x += p.vx; p.y += p.vy;
                p.life -= 0.02; p.size *= 0.98;
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });
            const result = await res.json();
            if (result.success) {
                await update();
                router.push('/');
            } else {
                setError(result.error || 'Lỗi khi đổi mật khẩu');
            }
        } catch {
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Navy Dark Background + Cyan Glow - giống Login */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#001529] via-[#000d1a] to-[#001529]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_80%_85%,rgba(34,211,238,0.15),transparent_50%),radial-gradient(circle_at_50%_50%,rgba(129,140,248,0.1),transparent_65%)]" />
                <div className="absolute top-20 left-20 w-80 h-80 bg-cyan-500/[0.14] rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-sky-500/[0.14] rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute inset-0 opacity-[0.03] scan-lines" />
                <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[1]" />
            </div>

            {/* Card - Glassmorphism Dark (giống Login) */}
            <div className="relative z-10 w-full max-w-md">
                <div className="backdrop-blur-2xl rounded-3xl shadow-2xl border bg-slate-900/85 border-cyan-500/20 shadow-[0_25px_50px_-12px_rgba(56,189,248,0.25)]">
                    {/* Header */}
                    <div className="pt-8 px-6 pb-0 text-center">
                        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight uppercase select-none zfenix-logo mb-2">
                            <span>ZFENIX</span>
                        </h1>
                    </div>

                    <div className="p-6 sm:p-8">
                        <h2 className="text-2xl font-bold text-slate-100 mb-2 text-center flex items-center justify-center gap-2">
                            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Đổi mật khẩu
                        </h2>
                        {mustChange && (
                            <p className="text-cyan-300/60 text-xs text-center mb-5">
                                Bạn cần đặt mật khẩu mới trước khi tiếp tục sử dụng hệ thống
                            </p>
                        )}
                        {!mustChange && <div className="mb-5" />}

                        {/* User info */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 font-bold text-sm border border-cyan-500/30">
                                {currentUser?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <div className="font-medium text-slate-200 text-sm">{currentUser?.name}</div>
                                <div className="text-xs text-slate-500">{currentUser?.email}</div>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-1.5">Mật khẩu mới</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Nhập mật khẩu mới (≥ 6 ký tự)"
                                        className="w-full px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-100 placeholder-slate-500 transition-all hover:border-cyan-500/30 pr-12"
                                        required
                                        minLength={6}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-1.5">Xác nhận mật khẩu</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu mới"
                                    className={`w-full px-4 py-3 bg-slate-800/60 border rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-100 placeholder-slate-500 transition-all ${confirmPassword && confirmPassword !== newPassword
                                            ? 'border-red-500/50'
                                            : confirmPassword && confirmPassword === newPassword
                                                ? 'border-emerald-500/50'
                                                : 'border-white/10 hover:border-cyan-500/30'
                                        }`}
                                    required
                                    minLength={6}
                                />
                                {confirmPassword && confirmPassword !== newPassword && (
                                    <p className="text-xs text-red-400 mt-1.5">Mật khẩu không khớp</p>
                                )}
                                {confirmPassword && confirmPassword === newPassword && (
                                    <p className="text-xs text-emerald-400 mt-1.5">✓ Mật khẩu khớp</p>
                                )}
                            </div>

                            {/* Hint */}
                            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                                <p className="text-xs text-amber-300/80">
                                    💡 <strong>Gợi ý:</strong> Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt
                                </p>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                                className={`w-full py-3.5 rounded-xl font-semibold text-white text-base transition-all shadow-lg bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-600 hover:from-cyan-600 hover:via-sky-600 hover:to-cyan-700 shadow-cyan-500/30 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed ${isSubmitting ? '' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Đang xử lý...
                                    </span>
                                ) : '🔒 Đổi mật khẩu'}
                            </button>
                        </form>

                        {/* Skip if not mandatory */}
                        {!mustChange && (
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="w-full mt-3 py-2.5 text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                            >
                                ← Quay lại
                            </button>
                        )}

                        <p className="text-center mt-6 text-xs text-slate-500">
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
