'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter();

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
                
                if (errorMessage.includes('database') || errorMessage.includes('DATABASE_URL') || errorMessage.includes('connect')) {
                    setError('Lỗi kết nối database. Vui lòng kiểm tra cấu hình server.');
                } else if (errorMessage.includes('NEXTAUTH_SECRET')) {
                    setError('Lỗi cấu hình authentication. Vui lòng liên hệ quản trị viên.');
                } else if (errorMessage.includes('CredentialsSignin')) {
                    setError('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
                } else {
                    setError(errorMessage || 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
                }
            } else if (result?.ok) {
                router.push('/');
                router.refresh();
            } else {
                console.error('Login failed - no error, no ok:', result);
                setError('Đăng nhập thất bại. Vui lòng thử lại.');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMessage = err?.message || 'Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại sau.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Animated Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-40"></div>
                
                {/* Animated Gradient Orbs */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
                
                {/* Floating Particles */}
                <div className="absolute top-20 left-1/4 w-2 h-2 bg-blue-500/30 rounded-full animate-float"></div>
                <div className="absolute top-40 right-1/4 w-1.5 h-1.5 bg-indigo-500/30 rounded-full animate-float delay-500"></div>
                <div className="absolute bottom-32 left-1/3 w-1 h-1 bg-purple-500/30 rounded-full animate-float delay-1000"></div>
                <div className="absolute bottom-20 right-1/3 w-2.5 h-2.5 bg-blue-400/30 rounded-full animate-float delay-1500"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Logo & Brand Section */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center justify-center mb-6 transform hover:scale-110 hover:rotate-3 transition-all duration-300 relative">
                        {/* Logo Box with Gradient */}
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#178AF3] via-[#0F6FC9] to-[#053663] rounded-3xl shadow-2xl shadow-blue-500/30 relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
                            <span className="text-4xl font-bold text-white italic relative z-10 drop-shadow-lg">Z</span>
                            <div className="absolute -inset-1 bg-gradient-to-br from-[#178AF3] to-[#053663] rounded-3xl blur opacity-50 animate-pulse"></div>
                        </div>
                    </div>
                    <h1 className="text-5xl font-black text-[#053663] mb-3 tracking-tighter">
                        <span className="bg-gradient-to-r from-[#053663] via-[#178AF3] to-[#0F6FC9] bg-clip-text text-transparent drop-shadow-sm">
                            ZFENIX
                        </span>
                    </h1>
                    <p className="text-sm text-[#2F343A]/70 uppercase tracking-[0.4em] font-bold mb-2">
                        Quản Lý Dự Án
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-400/50"></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-400/50"></div>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 p-10 animate-slide-up relative overflow-hidden">
                    {/* Card Glow Effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-50"></div>
                    <div className="relative z-10">
                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-[#2F343A] mb-2">Đăng nhập</h2>
                        <p className="text-sm text-[#5B6470]">Nhập thông tin để truy cập hệ thống</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[#2F343A]">
                                Email
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    <Mail className={`w-5 h-5 transition-colors ${email ? 'text-[#178AF3]' : 'text-[#5B6470]'}`} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl outline-none transition-all focus:border-[#178AF3] focus:ring-4 focus:ring-blue-500/10 text-[#2F343A] placeholder:text-gray-400 relative z-0"
                                    placeholder="admin@bimcompany.vn"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[#2F343A]">
                                Mật khẩu
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    <Lock className={`w-5 h-5 transition-colors ${password ? 'text-[#178AF3]' : 'text-[#5B6470]'}`} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3.5 bg-white border-2 border-gray-200 rounded-xl outline-none transition-all focus:border-[#178AF3] focus:ring-4 focus:ring-blue-500/10 text-[#2F343A] placeholder:text-gray-400 relative z-0"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#5B6470] hover:text-[#178AF3] transition-colors z-20"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 text-[#178AF3] border-gray-300 rounded focus:ring-2 focus:ring-[#178AF3] focus:ring-offset-0 cursor-pointer"
                                />
                                <span className="text-sm text-[#5B6470] group-hover:text-[#2F343A] transition-colors">
                                    Ghi nhớ đăng nhập
                                </span>
                            </label>
                            <button
                                type="button"
                                disabled
                                className="text-sm text-[#178AF3] hover:text-[#0F6FC9] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Quên mật khẩu?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`
                                w-full py-4 bg-gradient-to-r from-[#178AF3] to-[#0F6FC9] text-white rounded-xl font-semibold text-base
                                shadow-lg shadow-blue-500/30
                                transition-all duration-300
                                flex items-center justify-center gap-2
                                ${loading 
                                    ? 'opacity-70 cursor-not-allowed' 
                                    : 'hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
                                }
                            `}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Đang đăng nhập...</span>
                                </>
                            ) : (
                                <>
                                    <span>Đăng nhập</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200/50">
                        <p className="text-center text-xs text-[#5B6470] italic">
                            "Minh bạch dòng tiền, tối ưu dự án"
                        </p>
                    </div>
                    </div>
                </div>

                {/* Security Badge */}
                <div className="mt-8 text-center animate-fade-in delay-500">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 text-xs text-[#5B6470]">
                        <Shield className="w-4 h-4 text-[#178AF3]" />
                        <span>Kết nối được mã hóa và bảo mật</span>
                    </div>
                </div>
            </div>

            {/* Custom Styles */}
            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }

                .animate-slide-up {
                    animation: slide-up 0.5s ease-out;
                }

                .animate-shake {
                    animation: shake 0.4s ease-in-out 0s 2;
                }

                .delay-1000 {
                    animation-delay: 1s;
                }

                .delay-2000 {
                    animation-delay: 2s;
                }

                .delay-500 {
                    animation-delay: 0.5s;
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px) translateX(0px);
                        opacity: 0.7;
                    }
                    50% {
                        transform: translateY(-20px) translateX(10px);
                        opacity: 1;
                    }
                }

                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }

                /* Smooth focus transitions */
                input:focus {
                    transform: translateY(-1px);
                }

                /* Ensure icons stay visible */
                input:focus ~ div,
                input:autofill ~ div {
                    z-index: 10 !important;
                }

                /* Fix browser autofill background */
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus {
                    -webkit-box-shadow: 0 0 0px 1000px white inset !important;
                    box-shadow: 0 0 0px 1000px white inset !important;
                    -webkit-text-fill-color: #2F343A !important;
                }

                /* Glassmorphism effect */
                .backdrop-blur-xl {
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                }

                .backdrop-blur-2xl {
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                }
            `}</style>
        </div>
    );
}
