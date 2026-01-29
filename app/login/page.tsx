'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
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
                setError('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError('Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header Decor */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white text-center">
                    <h1 className="text-3xl font-bold italic tracking-tighter mb-2">ZFENIX</h1>
                    <p className="text-blue-100 text-sm opacity-80 uppercase tracking-widest">QUẢN LÝ DÒNG TIỀN DỰ ÁN</p>
                </div>

                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Đăng nhập</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium animate-shake">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="admin@bimcompany.vn"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Ghi nhớ đăng nhập</span>
                            </label>
                            <button disabled type="button" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                Quên mật khẩu?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`
                w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-500/30
                ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 hover:-translate-y-1 active:scale-95'}
              `}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Đang đăng nhập...
                                </span>
                            ) : (
                                'Đăng nhập'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500 italic">
                            "Minh bạch dòng tiền, tối ưu dự án"
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out 0s 2;
        }
      `}</style>
        </div>
    );
}
