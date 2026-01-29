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
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>
                
                {/* Animated Circles */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Logo & Brand Section */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#053663] to-[#178AF3] rounded-2xl shadow-2xl shadow-blue-500/30 mb-4 transform hover:scale-105 transition-transform">
                        <span className="text-3xl font-bold text-white italic">Z</span>
                    </div>
                    <h1 className="text-4xl font-bold text-[#053663] mb-2 tracking-tight">
                        ZFENIX
                    </h1>
                    <p className="text-sm text-[#2F343A]/70 uppercase tracking-[0.2em] font-medium">
                        Quản Lý Dòng Tiền Dự Án
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 animate-slide-up">
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
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className={`w-5 h-5 transition-colors ${email ? 'text-[#178AF3]' : 'text-[#5B6470]'}`} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl outline-none transition-all focus:border-[#178AF3] focus:ring-4 focus:ring-blue-500/10 text-[#2F343A] placeholder:text-gray-400"
                                    placeholder="admin@bimcompany.vn"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[#2F343A]">
                                Mật khẩu
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className={`w-5 h-5 transition-colors ${password ? 'text-[#178AF3]' : 'text-[#5B6470]'}`} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3.5 bg-white border-2 border-gray-200 rounded-xl outline-none transition-all focus:border-[#178AF3] focus:ring-4 focus:ring-blue-500/10 text-[#2F343A] placeholder:text-gray-400"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#5B6470] hover:text-[#178AF3] transition-colors"
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

                {/* Security Badge */}
                <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2 text-xs text-[#5B6470]">
                        <Shield className="w-4 h-4" />
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

                /* Smooth focus transitions */
                input:focus {
                    transform: translateY(-1px);
                }

                /* Glassmorphism effect */
                .backdrop-blur-xl {
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                }
            `}</style>
        </div>
    );
}
