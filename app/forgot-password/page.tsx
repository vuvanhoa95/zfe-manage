'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRef, useEffect } from 'react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [countdown, setCountdown] = useState(0);

    // ── Canvas particle trail (same as login page) ──────────────────────
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

    // Countdown timer for resend
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });

            const result = await res.json();

            if (res.status === 429) {
                setStatus('error');
                setMessage(result.error || 'Vui lòng chờ trước khi gửi lại.');
                return;
            }

            if (result.success) {
                setStatus('success');
                setMessage(result.message);
                setCountdown(60); // 60s cooldown
            } else {
                setStatus('error');
                setMessage(result.error || 'Có lỗi xảy ra');
            }
        } catch {
            setStatus('error');
            setMessage('Không thể kết nối server. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Navy Dark Background + Cyan Glow (same as login) */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#001529] via-[#000d1a] to-[#001529]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_80%_85%,rgba(34,211,238,0.15),transparent_50%),radial-gradient(circle_at_50%_50%,rgba(129,140,248,0.1),transparent_65%)]" />
                <div className="absolute top-20 left-20 w-80 h-80 bg-cyan-500/[0.14] rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-sky-500/[0.14] rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute inset-0 opacity-[0.03] scan-lines" />
                <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[1]" />
            </div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="backdrop-blur-2xl rounded-3xl shadow-2xl border bg-slate-900/85 border-cyan-500/20 shadow-[0_25px_50px_-12px_rgba(56,189,248,0.25)]">
                    <div className="pt-8 px-6 pb-0 text-center">
                        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight uppercase select-none zfenix-logo mb-2">
                            <span>ZFENIX</span>
                        </h1>
                        <p className="text-cyan-400/70 text-xs uppercase tracking-widest font-medium">QUẢN LÝ DỰ ÁN</p>
                    </div>

                    <div className="p-6 sm:p-8">
                        {/* Icon + Title */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-sky-500/20 border border-cyan-500/20 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-100">Quên mật khẩu?</h2>
                            <p className="text-slate-400 text-sm mt-2">
                                Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.
                            </p>
                        </div>

                        {/* Success State */}
                        {status === 'success' && (
                            <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl flex-shrink-0">✅</span>
                                    <div>
                                        <p className="text-emerald-400 text-sm font-semibold mb-1">Email đã được gửi!</p>
                                        <p className="text-emerald-400/80 text-xs leading-relaxed">
                                            {message}
                                        </p>
                                        <p className="text-emerald-400/60 text-xs mt-2">
                                            📧 Kiểm tra hộp thư (cả spam) để tìm email từ ZFENIX.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {status === 'error' && (
                            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium">
                                {message}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-100 placeholder-slate-500 transition-all hover:border-cyan-500/30"
                                    placeholder="Nhập email đã đăng ký..."
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || countdown > 0}
                                className={`w-full py-3.5 rounded-xl font-semibold text-white text-base transition-all shadow-lg bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-600 hover:from-cyan-600 hover:via-sky-600 hover:to-cyan-700 shadow-cyan-500/30 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed ${loading || countdown > 0 ? '' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Đang gửi...
                                    </span>
                                ) : countdown > 0 ? (
                                    `Gửi lại sau ${countdown}s`
                                ) : (
                                    '📧 Gửi link đặt lại mật khẩu'
                                )}
                            </button>
                        </form>

                        {/* Back to login */}
                        <div className="mt-6 text-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-sm text-cyan-400 font-medium hover:text-cyan-300 transition-colors group"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                </svg>
                                Quay lại đăng nhập
                            </Link>
                        </div>

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
