'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success' | 'expired'>('loading');
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
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
        // Verify token
        fetch(`/api/auth/reset-password?token=${token}`)
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    setStatus('valid');
                    setUserName(result.data.name || '');
                    setUserEmail(result.data.email || '');
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
            setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        if (password !== confirmPassword) {
            setErrorMsg('Mật khẩu xác nhận không khớp');
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
                setErrorMsg(result.error || 'Có lỗi xảy ra');
            }
        } catch {
            setErrorMsg('Không thể kết nối server');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-4">
                        <span className="text-3xl">🔑</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">ZFENIX Revit License</h1>
                    <p className="text-indigo-300 text-sm mt-1">Đặt mật khẩu tài khoản</p>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                    {status === 'loading' && (
                        <div className="p-10 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400 mx-auto"></div>
                            <p className="text-indigo-200 mt-4 text-sm">Đang xác thực link...</p>
                        </div>
                    )}

                    {status === 'invalid' && (
                        <div className="p-10 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/20 mb-4">
                                <span className="text-3xl">❌</span>
                            </div>
                            <h2 className="text-lg font-bold text-white mb-2">Link không hợp lệ</h2>
                            <p className="text-gray-400 text-sm">
                                Link đặt mật khẩu không đúng hoặc đã được sử dụng.<br />
                                Vui lòng liên hệ admin để được cấp lại.
                            </p>
                        </div>
                    )}

                    {status === 'expired' && (
                        <div className="p-10 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/20 mb-4">
                                <span className="text-3xl">⏱️</span>
                            </div>
                            <h2 className="text-lg font-bold text-white mb-2">Link đã hết hạn</h2>
                            <p className="text-gray-400 text-sm">
                                Link đặt mật khẩu đã quá 24 giờ.<br />
                                Vui lòng liên hệ admin để được cấp link mới.
                            </p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="p-10 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 mb-4">
                                <span className="text-3xl">✅</span>
                            </div>
                            <h2 className="text-lg font-bold text-white mb-2">Đặt mật khẩu thành công!</h2>
                            <p className="text-gray-400 text-sm mb-4">
                                Bạn có thể đăng nhập trên Revit Add-in bằng:
                            </p>
                            <div className="bg-white/5 rounded-xl p-4 text-left space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-indigo-400 text-xs font-medium w-14">Email:</span>
                                    <span className="text-white text-sm font-mono">{userEmail}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-indigo-400 text-xs font-medium w-14">Mật khẩu:</span>
                                    <span className="text-white text-sm">Mật khẩu bạn vừa tạo</span>
                                </div>
                            </div>
                            <div className="mt-6 bg-indigo-500/10 rounded-lg p-3 text-xs text-indigo-300">
                                <p className="font-medium mb-1">📋 Các bước tiếp theo:</p>
                                <ol className="text-left space-y-1 ml-4 list-decimal text-indigo-300/80">
                                    <li>Mở Revit → Tab ZFENIX</li>
                                    <li>Nhấn nút Login</li>
                                    <li>Nhập email + mật khẩu</li>
                                    <li>Bắt đầu sử dụng! 🚀</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {status === 'valid' && (
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            {/* Welcome */}
                            <div className="text-center pb-2">
                                <p className="text-indigo-200 text-sm">
                                    Xin chào <strong className="text-white">{userName}</strong>
                                </p>
                                <p className="text-gray-400 text-xs mt-1">{userEmail}</p>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-indigo-200 mb-1.5">
                                    Mật khẩu mới
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="Tối thiểu 6 ký tự"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
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
                                <label className="block text-sm font-medium text-indigo-200 mb-1.5">
                                    Xác nhận mật khẩu
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="Nhập lại mật khẩu"
                                />
                            </div>

                            {/* Error */}
                            {errorMsg && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                                    ⚠️ {errorMsg}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                        </svg>
                                        Đang xử lý...
                                    </span>
                                ) : (
                                    '🔐 Đặt mật khẩu'
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Bottom */}
                <p className="text-center text-gray-500 text-xs mt-6">
                    © {new Date().getFullYear()} ZFENIX · Đại Lý Dung Phú
                </p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
