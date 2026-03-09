'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getDatabaseErrorMessage } from '@/lib/db-error-messages';
import { useLanguage } from '@/hooks/useLanguage';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { lang, setLanguage, t } = useLanguage();

    useEffect(() => {
        const errorType = searchParams.get('error');
        if (errorType) {
            if (errorType === 'ACCOUNT_PENDING') {
                setError(t('login', 'errorPending'));
            } else if (errorType === 'ACCOUNT_SUSPENDED') {
                setError(t('login', 'errorSuspended'));
            } else if (errorType === 'OAuthAccountNotLinked') {
                setError(t('login', 'errorLinked'));
            } else if (errorType === 'OAuthSignin' || errorType === 'OAuthCallback') {
                setError(t('login', 'errorSocial'));
            } else if (errorType === 'google') {
                setError(t('login', 'errorGoogle'));
            } else if (errorType === 'azure-ad') {
                setError(t('login', 'errorMicrosoft'));
            } else if (errorType === 'OAuthCreateAccount') {
                setError(t('login', 'errorCreateAccount'));
            } else if (errorType === 'Callback') {
                setError(t('login', 'errorCallback'));
            } else {
                setError(t('login', 'errorGeneral'));
                console.error('[Login] Unhandled error type:', errorType);
            }
            setSocialLoading(null);
        }
    }, [searchParams, lang]); // re-run when language changes

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                const errorMessage = result.error;
                console.error('Login error:', errorMessage);

                if (errorMessage.startsWith('database|')) {
                    const parts = errorMessage.split('|');
                    const errorCode = parts[1] || undefined;
                    const originalMessage = parts[2] || errorMessage;
                    const detailedMessage = getDatabaseErrorMessage(errorCode, originalMessage);
                    setError(detailedMessage);
                } else if (
                    errorMessage === 'database' ||
                    errorMessage.includes('database') ||
                    errorMessage.includes('DATABASE_URL') ||
                    errorMessage.includes('connect') ||
                    errorMessage.includes('connection')
                ) {
                    let errorCode: string | undefined;
                    if (errorMessage.includes('P1001') || errorMessage.includes("Can't reach database")) {
                        errorCode = 'P1001';
                    } else if (errorMessage.includes('P1002') || errorMessage.includes('timeout')) {
                        errorCode = 'P1002';
                    } else if (errorMessage.includes('P1003') || errorMessage.includes('does not exist')) {
                        errorCode = 'P1003';
                    } else if (errorMessage.includes('P1017') || errorMessage.includes('closed')) {
                        errorCode = 'P1017';
                    } else if (errorMessage.includes('P1012') || errorMessage.includes('schema')) {
                        errorCode = 'P1012';
                    } else if (errorMessage.includes('DATABASE_URL_MISSING') || errorMessage.includes('not set')) {
                        errorCode = 'DATABASE_URL_MISSING';
                    } else if (errorMessage.includes('ECONNREFUSED')) {
                        errorCode = 'ECONNREFUSED';
                    } else if (errorMessage.includes('ENOTFOUND')) {
                        errorCode = 'ENOTFOUND';
                    }
                    const detailedMessage = getDatabaseErrorMessage(errorCode, errorMessage);
                    setError(detailedMessage);
                } else if (errorMessage.includes('NEXTAUTH_SECRET')) {
                    setError(t('login', 'errorAuthConfig'));
                } else if (
                    errorMessage.includes('CredentialsSignin') ||
                    errorMessage.includes('Không tìm thấy') ||
                    errorMessage.includes('Mật khẩu không chính xác')
                ) {
                    setError(t('login', 'errorCredentials'));
                } else if (errorMessage === 'ACCOUNT_PENDING') {
                    setError(t('login', 'errorPending'));
                } else if (errorMessage === 'ACCOUNT_SUSPENDED') {
                    setError(t('login', 'errorSuspended'));
                } else {
                    setError(errorMessage || t('login', 'errorCredentials'));
                }
            } else if (result?.ok) {
                router.push('/');
                router.refresh();
            } else {
                console.error('Login failed - no error, no ok:', result);
                setError(t('login', 'errorFailed'));
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err?.message || t('login', 'errorGeneral'));
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: string) => {
        setSocialLoading(provider);
        setError('');
        try {
            await signIn(provider, { callbackUrl: '/' });
        } catch (err) {
            setSocialLoading(null);
            setError(t('login', 'errorSocialInit'));
        }
    };

    // ── Canvas particle trail ────────────────────────────────────────────────
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

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
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

            {/* Language Switcher - top right */}
            <div className="fixed top-4 right-4 z-20 flex items-center gap-1 bg-slate-900/70 backdrop-blur-md border border-cyan-500/20 rounded-xl px-1.5 py-1">
                {SUPPORTED_LANGUAGES.map((l) => (
                    <button
                        key={l.code}
                        onClick={() => setLanguage(l.code)}
                        title={l.label}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${lang === l.code
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                    >
                        <span>{l.flag}</span>
                        <span>{l.code.toUpperCase()}</span>
                    </button>
                ))}
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md px-4 sm:px-6">
                <div className="backdrop-blur-2xl rounded-3xl shadow-2xl border bg-slate-900/85 border-cyan-500/20 shadow-[0_25px_50px_-12px_rgba(56,189,248,0.25)]">
                    <div className="pt-8 px-6 pb-0 text-center">
                        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight uppercase select-none zfenix-logo mb-2">
                            <span>ZFENIX</span>
                        </h1>
                        <p className="text-cyan-400/70 text-xs uppercase tracking-widest font-medium">
                            {t('login', 'title')}
                        </p>
                    </div>

                    <div className="p-5 sm:p-7">
                        <h2 className="text-xl font-bold text-slate-100 mb-5 text-center">
                            {t('login', 'heading')}
                        </h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}

                        {/* Social Buttons */}
                        <div className="grid grid-cols-2 gap-2.5 mb-4">
                            <button
                                type="button"
                                disabled={!!socialLoading || loading}
                                onClick={() => handleSocialLogin('google')}
                                className={`flex items-center justify-center gap-2 py-2.5 border border-white/10 rounded-xl bg-white/5 transition-all font-semibold text-slate-200 text-sm hover:bg-white/10 hover:border-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${socialLoading === 'google' ? 'opacity-60' : ''}`}
                            >
                                {socialLoading === 'google' ? (
                                    <span className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                                ) : (
                                    <svg width="17" height="17" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                )}
                                Google
                            </button>

                            <button
                                type="button"
                                disabled={!!socialLoading || loading}
                                onClick={() => handleSocialLogin('azure-ad')}
                                className={`flex items-center justify-center gap-2 py-2.5 border border-white/10 rounded-xl bg-white/5 transition-all font-semibold text-slate-200 text-sm hover:bg-white/10 hover:border-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${socialLoading === 'azure-ad' ? 'opacity-60' : ''}`}
                            >
                                {socialLoading === 'azure-ad' ? (
                                    <span className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                                ) : (
                                    <svg width="17" height="17" viewBox="0 0 23 23" fill="none">
                                        <path d="M0 0h10.89v10.89H0V0z" fill="#F25022" />
                                        <path d="M12.11 0H23v10.89H12.11V0z" fill="#7FBA00" />
                                        <path d="M0 12.11h10.89V23H0V12.11z" fill="#00A4EF" />
                                        <path d="M12.11 12.11H23V23H12.11V12.11z" fill="#FFB900" />
                                    </svg>
                                )}
                                Microsoft
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                                {t('login', 'orEmail')}
                            </span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-3">
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    {t('login', 'email')}
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-slate-800/60 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-100 placeholder-slate-500 text-sm transition-all hover:border-cyan-500/30"
                                    placeholder={t('login', 'emailPlaceholder')}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    {t('login', 'password')}
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-slate-800/60 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-100 placeholder-slate-500 text-sm transition-all hover:border-cyan-500/30"
                                    placeholder={t('login', 'passwordPlaceholder')}
                                />
                            </div>

                            {/* Remember + Forgot */}
                            <div className="flex items-center justify-between pt-0.5">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-white/20 accent-cyan-500" />
                                    <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
                                        {t('login', 'rememberMe')}
                                    </span>
                                </label>
                                <Link href="/forgot-password" className="text-xs text-cyan-400 font-medium hover:text-cyan-300 transition-colors">
                                    {t('login', 'forgotPassword')}
                                </Link>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-2.5 rounded-xl font-semibold text-white text-sm transition-all shadow-lg bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-600 hover:from-cyan-600 hover:via-sky-600 hover:to-cyan-700 shadow-cyan-500/30 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed mt-1 ${loading ? '' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t('login', 'signingIn')}
                                    </span>
                                ) : t('login', 'signIn')}
                            </button>
                        </form>

                        <p className="text-center mt-5 text-xs text-slate-500">
                            © 2026 ZFENIX · <span className="italic">{t('login', 'copyright')}</span>
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

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#001529] via-[#000d1a] to-[#001529]">
                <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}