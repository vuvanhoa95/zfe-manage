'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type AppUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    title?: string;
    department?: string;
    experience?: string;
    bankAccount?: string;
    taxCode?: string;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    createdAt?: string;
};

type UserFormState = {
    email: string;
    name: string;
    password: string;
    role: string;
    title: string;
    department: string;
    experience: string;
    bankAccount: string;
    taxCode: string;
};

const INITIAL_FORM: UserFormState = {
    email: '',
    name: '',
    password: '',
    role: 'USER',
    title: '',
    department: '',
    experience: '',
    bankAccount: '',
    taxCode: '',
};

export default function UsersPage() {
    const { data: session, status } = useSession();
    const currentUser: any = session?.user || { role: 'GUEST' };

    const [users, setUsers] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<AppUser | null>(null);
    const [form, setForm] = useState<UserFormState>(INITIAL_FORM);

    // Chỉ check isAdmin sau khi session đã load xong
    const sessionLoading = status === 'loading';
    const isAdmin = !sessionLoading && currentUser.role === 'ADMIN';

    useEffect(() => {
        // Chờ session load xong trước khi check admin
        if (sessionLoading) {
            return;
        }

        if (isAdmin) {
            void fetchUsers();
        } else {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, sessionLoading]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/users?limit=1000', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });

            // Parse response body trước khi check res.ok
            let result: { success?: boolean; data?: AppUser[]; error?: string } | unknown;
            try {
                result = (await res.json()) as { success?: boolean; data?: AppUser[]; error?: string } | unknown;
            } catch (parseError) {
                // Nếu không parse được JSON, throw error với message từ status
                throw new Error(`Không thể đọc phản hồi từ server (status: ${res.status})`);
            }

            // Kiểm tra res.ok sau khi đã parse được response
            if (!res.ok) {
                // Nếu có error message từ API, dùng nó
                if (
                    result &&
                    typeof result === 'object' &&
                    'error' in result &&
                    typeof (result as { error?: string }).error === 'string'
                ) {
                    throw new Error((result as { error: string }).error);
                }
                // Nếu không có error message, dùng status code
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            // Kiểm tra success flag và data
            if (
                result &&
                typeof result === 'object' &&
                'success' in result &&
                (result as { success?: boolean }).success === true &&
                'data' in result &&
                Array.isArray((result as { data?: AppUser[] }).data)
            ) {
                setUsers((result as { data: AppUser[] }).data);
            } else {
                // Nếu response không đúng format nhưng status OK, có thể là success: false
                if (
                    result &&
                    typeof result === 'object' &&
                    'success' in result &&
                    (result as { success?: boolean }).success === false &&
                    'error' in result
                ) {
                    throw new Error(
                        typeof (result as { error?: string }).error === 'string'
                            ? (result as { error: string }).error
                            : 'Không thể tải danh sách user'
                    );
                }
                console.error('API returned unexpected payload when fetching users:', result);
                setUsers([]);
            }
        } catch (error: unknown) {
            console.error('❌ Failed to fetch users:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Không thể tải danh sách user. Vui lòng thử lại.';
            alert(errorMessage);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setForm(INITIAL_FORM);
        setShowModal(true);
    };

    const openEditModal = (user: AppUser) => {
        setEditingUser(user);
        setForm({
            email: user.email,
            name: user.name,
            password: '',
            role: user.role || 'USER',
            title: user.title || '',
            department: user.department || '',
            experience: user.experience || '',
            bankAccount: user.bankAccount || '',
            taxCode: user.taxCode || '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        if (isSubmitting) return;
        setShowModal(false);
        setEditingUser(null);
        setForm(INITIAL_FORM);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.email.trim() || !form.password.trim() || !form.name.trim()) {
            alert('Email, tên và mật khẩu là bắt buộc');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/update-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: form.email.trim(),
                    password: form.password,
                    name: form.name.trim(),
                    role: form.role,
                    title: form.title.trim() || null,
                    department: form.department.trim() || null,
                    experience: form.experience.trim() || null,
                    bankAccount: form.bankAccount.trim() || null,
                    taxCode: form.taxCode.trim() || null,
                }),
            });

            const result = await res.json();
            if (result.success) {
                closeModal();
                await fetchUsers();
            } else {
                alert(result.error || 'Không thể lưu user');
            }
        } catch (error) {
            console.error('Save user error:', error);
            alert('Có lỗi xảy ra khi lưu user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (user: AppUser) => {
        if (!confirm(`⚠️ Bạn có chắc chắn muốn XÓA vĩnh viễn user "${user.name}" (${user.email})?\n\nHành động này không thể hoàn tác!`)) {
            return;
        }

        try {
            const res = await fetch(`/api/users?userId=${user.id}`, {
                method: 'DELETE',
            });

            const result = await res.json();
            if (result.success) {
                await fetchUsers();
            } else {
                alert(result.error || 'Không thể xóa user');
            }
        } catch (error) {
            console.error('Delete user error:', error);
            alert('Có lỗi xảy ra khi xóa user');
        }
    };

    const handleToggleStatus = async (user: AppUser) => {
        // Không toggle tài khoản đang đăng nhập
        if (user.email === currentUser.email) return;

        const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

        setTogglingUserId(user.id);
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, status: newStatus }),
            });

            const result = await res.json();
            if (result.success) {
                // Optimistic update
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus as AppUser['status'] } : u));
            } else {
                alert(result.error || 'Cập nhật trạng thái thất bại');
            }
        } catch (error) {
            console.error('Toggle status error:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái');
        } finally {
            setTogglingUserId(null);
        }
    };

    // Hiển thị loading khi session đang load
    if (sessionLoading || (isLoading && isAdmin)) {
        return (
            <div className="px-4 py-4 md:px-6 md:py-5">
                <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zf-primary"></div>
                        <span className="ml-3 text-gray-700">Đang tải...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Hiển thị message nếu không phải admin (sau khi session đã load xong)
    if (!isAdmin) {
        return (
            <div className="px-4 py-4 md:px-6 md:py-5">
                <div className="max-w-xl mx-auto bg-white border border-red-100 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-red-700 mb-2">Quyền truy cập bị giới hạn</h2>
                    <p className="text-sm text-gray-700">
                        Chức năng <span className="font-semibold">Quản lý User</span> chỉ dành cho tài khoản{' '}
                        <span className="font-semibold">Admin</span>. Vui lòng đăng nhập bằng tài khoản có quyền phù hợp.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <p className="text-xs text-gray-500 mt-2">
                            Debug: Session status: {status}, Role: {currentUser.role || 'undefined'}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-4 md:px-6 md:py-5 space-y-4">
            <div className="flex items-center justify-end">
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                    <span>👤+</span> Thêm User
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tên</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Chức danh</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Bộ môn</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Vai trò</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Trạng thái</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Ngày tạo</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Đang tải danh sách user...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Chưa có user nào.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{user.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{user.title || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{user.department || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-800">
                                            <span
                                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    user.role === 'ADMIN'
                                                        ? 'bg-red-50 text-red-700'
                                                        : user.role === 'PM'
                                                          ? 'bg-amber-50 text-amber-700'
                                                          : 'bg-blue-50 text-blue-700'
                                                }`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {/* Toggle Switch */}
                                                <button
                                                    type="button"
                                                    disabled={user.email === currentUser.email || togglingUserId === user.id}
                                                    onClick={() => handleToggleStatus(user)}
                                                    title={user.email === currentUser.email ? 'Không thể thay đổi tài khoản đang đăng nhập' : user.status === 'ACTIVE' ? 'Nhấn để khóa' : 'Nhấn để kích hoạt'}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:cursor-not-allowed ${
                                                        user.status === 'ACTIVE'
                                                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                                            : user.status === 'PENDING'
                                                              ? 'bg-amber-400'
                                                              : 'bg-gray-300'
                                                    }`}
                                                >
                                                    {togglingUserId === user.id ? (
                                                        <span className="absolute inset-0 flex items-center justify-center">
                                                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                            </svg>
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                                                                user.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                        />
                                                    )}
                                                </button>
                                                {/* Label */}
                                                <span className={`text-[10px] font-semibold tracking-wide ${
                                                    user.status === 'ACTIVE' ? 'text-emerald-600' :
                                                    user.status === 'PENDING' ? 'text-amber-600' : 'text-gray-400'
                                                }`}>
                                                    {user.status === 'ACTIVE' ? 'Hoạt động' : user.status === 'PENDING' ? 'Chờ duyệt' : 'Đã khóa'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {user.createdAt
                                                ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                                                : '-'}
                                        </td>
                                         <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(user)}
                                                    title="Chỉnh sửa user"
                                                    className="group p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                {user.email !== currentUser.email && !['7604vuhoa@gmail.com', 'hoavv@zfenix.com'].includes(user.email) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteUser(user)}
                                                        title="Xóa user vĩnh viễn"
                                                        className="group p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingUser ? 'Chỉnh sửa User' : 'Thêm User mới'}
                            </h2>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-light"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={(event) =>
                                            setForm((prev) => ({ ...prev, email: event.target.value }))
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Họ và tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(event) =>
                                            setForm((prev) => ({ ...prev, name: event.target.value }))
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mật khẩu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={form.password}
                                        onChange={(event) =>
                                            setForm((prev) => ({ ...prev, password: event.target.value }))
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={editingUser ? 'Nhập mật khẩu mới cho user' : 'Mật khẩu đăng nhập'}
                                    />
                                    {editingUser && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Khi cập nhật user, mật khẩu sẽ được đặt lại theo giá trị mới này.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                                    <select
                                        value={form.role}
                                        onChange={(event) =>
                                            setForm((prev) => ({ ...prev, role: event.target.value }))
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="ADMIN">ADMIN</option>
                                        <option value="PM">PM</option>
                                        <option value="USER">USER</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chức danh</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(event) =>
                                            setForm((prev) => ({ ...prev, title: event.target.value }))
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ví dụ: Kỹ sư, Trưởng phòng, Giám đốc"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bộ môn</label>
                                    <input
                                        type="text"
                                        value={form.department}
                                        onChange={(event) =>
                                            setForm((prev) => ({ ...prev, department: event.target.value }))
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ví dụ: Kiến trúc, Kết cấu, MEP"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kinh nghiệm</label>
                                    <input
                                        type="text"
                                        value={form.experience}
                                        onChange={(event) =>
                                            setForm((prev) => ({ ...prev, experience: event.target.value }))
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ví dụ: 5 năm, 10+ năm kinh nghiệm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số tài khoản ngân hàng
                                    </label>
                                    <input
                                        type="text"
                                        value={form.bankAccount}
                                        onChange={(event) =>
                                            setForm((prev) => ({ ...prev, bankAccount: event.target.value }))
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập số tài khoản ngân hàng"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
                                    <input
                                        type="text"
                                        value={form.taxCode}
                                        onChange={(event) =>
                                            setForm((prev) => ({ ...prev, taxCode: event.target.value }))
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập mã số thuế cá nhân"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 border-t">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-60"
                                >
                                    {isSubmitting
                                        ? 'Đang lưu...'
                                        : editingUser
                                          ? 'Cập nhật User'
                                          : 'Thêm User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

