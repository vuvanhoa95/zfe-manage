'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/** Map plan code → human label */
const PLAN_LABELS: Record<string, string> = {
    '1M': '1 Month',
    '3M': '3 Months',
    '6M': '6 Months',
    '1Y': '1 Year',
    'LIFETIME': 'Lifetime',
};

function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success' | 'expired'>('loading');
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [licensePlan, setLicensePlan] = useState('1M');
    const [licenseStart, setLicenseStart] = useState<string | null>(null);
    const [licenseExpiry, setLicenseExpiry] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            return;
        }
        fetch(`/api/auth/reset-password?token=${token}`)
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    setStatus('valid');
                    setUserName(result.data.name || '');
                    setUserEmail(result.data.email || '');
                    setLicensePlan(result.data.licensePlan || '1M');
                    setLicenseStart(result.data.licenseStart || null);
                    setLicenseExpiry(result.data.licenseExpiry || null);
                } else if (result.error?.includes('hết hạn')) {
                    setStatus('expired');
                } else {
                    setStatus('invalid');
                }
            })
            .catch(() => setStatus('invalid'));
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (password.length < 6) {
            setErrorMsg('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const result = await res.json();
            if (result.success) {
                setStatus('success');
            } else {
                setErrorMsg(result.error || 'An error occurred');
            }
        } catch {
            setErrorMsg('Could not connect to server');
        } finally {
            setIsSubmitting(false);
        }
    };

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

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const onMouseMove = (e: MouseEvent) => {
            for (let i = 0; i < 2; i++) {
                particlesRef.current.push({
                    x: e.clientX, y: e.clientY,
                    vx: (Math.random() - 0.5) * 2.5,
                    vy: (Math.random() - 0.5) * 2.5,
                    life: 1,
                    size: 2.5 + Math.random() * 1.5,
                    color: `hsl(${195 + Math.random() * 30}, 85%, ${55 + Math.random() * 15}%)`,
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

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Navy Dark Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#001529] via-[#000d1a] to-[#001529]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.15),transparent_45%),radial-gradient(circle_at_80%_85%,rgba(23,138,243,0.12),transparent_50%)]" />
                <div className="absolute top-20 left-20 w-80 h-80 bg-cyan-500/[0.1] rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-sky-500/[0.1] rounded-full blur-3xl" />
                <div className="absolute inset-0 opacity-[0.02] scan-lines" />
                <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[1]" />
            </div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="backdrop-blur-2xl rounded-3xl shadow-2xl border bg-slate-900/85 border-cyan-500/20 shadow-[0_25px_50px_-12px_rgba(56,189,248,0.2)] overflow-hidden">

                    {/* Top accent bar */}
                    <div className="h-1 bg-gradient-to-r from-[#001529] via-[#178AF3] to-[#38BDF8]" />

                    {/* Header */}
                    <div className="pt-8 px-6 pb-2 text-center">
                        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight uppercase select-none zfenix-logo mb-1">
                            <span>ZFENIX</span>
                        </h1>
                        <p className="text-cyan-400/60 text-[10px] uppercase tracking-[0.25em] font-medium">
                            Revit License · Set Password
                        </p>
                    </div>

                    {/* ──── LOADING ──── */}
                    {status === 'loading' && (
                        <div className="p-10 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400 mx-auto" />
                            <p className="text-slate-400 mt-4 text-sm">Verifying your link...</p>
                        </div>
                    )}

                    {/* ──── INVALID / EXPIRED ──── */}
                    {(status === 'invalid' || status === 'expired') && (
                        <div className="p-10 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                                style={{ background: status === 'expired' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)' }}>
                                <span className="text-3xl">{status === 'expired' ? '⏱️' : '❌'}</span>
                            </div>
                            <h2 className="text-lg font-bold text-white mb-2">
                                {status === 'expired' ? 'Link Expired' : 'Invalid Link'}
                            </h2>
                            <p className="text-slate-400 text-sm">
                                {status === 'expired'
                                    ? 'This password reset link has expired (24h).'
                                    : 'This link is invalid or has already been used.'}
                                <br />Please contact your administrator for a new link.
                            </p>
                        </div>
                    )}

                    {/* ──── SUCCESS ──── */}
                    {status === 'success' && (
                        <div className="p-8 text-center">
                            {/* Success Icon */}
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 mb-5">
                                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Password Set Successfully!</h2>
                            <p className="text-slate-400 text-sm mb-6">
                                You can now log in to the Revit Add-in with your credentials.
                            </p>

                            {/* Credentials Card */}
                            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-5 text-left space-y-3 mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-cyan-400 text-xs font-semibold w-16 shrink-0">Email</span>
                                    <span className="text-white text-sm font-mono truncate">{userEmail}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-cyan-400 text-xs font-semibold w-16 shrink-0">Password</span>
                                    <span className="text-slate-300 text-sm">The password you just created</span>
                                </div>
                            </div>

                            {/* License Badge */}
                            <div className="bg-[#178AF3]/10 border border-[#178AF3]/20 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[#38BDF8] text-xs font-semibold uppercase tracking-wider">License Plan</span>
                                    <span className="text-white text-sm font-bold">{PLAN_LABELS[licensePlan] || licensePlan}</span>
                                </div>
                                <div className="h-px bg-white/10 my-2" />
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-slate-500">Start</span>
                                        <p className="text-slate-200 font-medium">{formatDate(licenseStart)}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Expires</span>
                                        <p className="text-slate-200 font-medium">
                                            {licensePlan === 'LIFETIME' ? '∞ Lifetime' : formatDate(licenseExpiry)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Steps */}
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-cyan-400 text-xs font-semibold mb-3 text-left">Getting Started</p>
                                <div className="flex items-start justify-between">
                                    {[
                                        { n: '1', label: 'Open Revit', last: false },
                                        { n: '2', label: 'ZFENIX Tab', last: false },
                                        { n: '3', label: 'Click Login', last: false },
                                        { n: '4', label: 'Enjoy! 🚀', last: true },
                                    ].map((s, i) => (
                                        <>
                                            <div key={s.n} className="text-center flex-shrink-0">
                                                <div className={`w-7 h-7 mx-auto mb-1 rounded-full text-xs font-bold flex items-center justify-center ${s.n === '4' ? 'bg-[#178AF3] text-white' : 'bg-white/10 text-cyan-400'
                                                    }`}>
                                                    {s.n}
                                                </div>
                                                <span className="text-slate-400 text-[10px] whitespace-nowrap">{s.label}</span>
                                            </div>
                                            {!s.last && (
                                                <div key={`arrow-${i}`} className="flex-1 flex items-center justify-center pb-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ──── FORM (valid) ──── */}
                    {status === 'valid' && (
                        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                            {/* Welcome */}
                            <div className="text-center pb-1">
                                <p className="text-slate-200 text-sm">
                                    Welcome, <strong className="text-white">{userName}</strong>
                                </p>
                                <p className="text-slate-500 text-xs mt-1">{userEmail}</p>
                            </div>

                            {/* License Info Card */}
                            <div className="bg-[#178AF3]/8 border border-[#178AF3]/15 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-[#001529] flex items-center justify-center">
                                            <svg className="w-4 h-4 text-[#38BDF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-semibold">{PLAN_LABELS[licensePlan] || licensePlan}</p>
                                            <p className="text-slate-500 text-[10px]">Revit Add-in License</p>
                                        </div>
                                    </div>
                                    {licenseExpiry && licensePlan !== 'LIFETIME' && (
                                        <div className="text-right">
                                            <p className="text-slate-500 text-[10px]">Expires</p>
                                            <p className="text-slate-300 text-xs font-medium">{formatDate(licenseExpiry)}</p>
                                        </div>
                                    )}
                                    {licensePlan === 'LIFETIME' && (
                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full uppercase tracking-wider">Lifetime</span>
                                    )}
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 pr-11 bg-slate-800/60 border border-white/10 rounded-xl text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all hover:border-cyan-500/30"
                                        placeholder="Minimum 6 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
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

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Confirm Password
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all hover:border-cyan-500/30"
                                    placeholder="Re-enter your password"
                                />
                            </div>

                            {/* Error */}
                            {errorMsg && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
                                    ⚠️ {errorMsg}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-3.5 rounded-xl font-semibold text-white text-base transition-all shadow-lg bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-600 hover:from-cyan-600 hover:via-sky-600 hover:to-cyan-700 shadow-cyan-500/25 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed ${isSubmitting ? '' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    '🔐 Set Password'
                                )}
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <div className="px-6 pb-6 text-center">
                        <p className="text-slate-600 text-[10px] mt-2">
                            © {new Date().getFullYear()} ZFENIX · <a href="https://www.zfenix.com" className="text-cyan-500/60 hover:text-cyan-400 transition-colors">WWW.ZFENIX.COM</a>
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
                    filter: drop-shadow(0 0 12px rgba(56,189,248,0.35));
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#001529] via-[#000d1a] to-[#001529]">
                <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
