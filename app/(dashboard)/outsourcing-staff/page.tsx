'use client';

import { useEffect, useState } from 'react';

type OutsourcingStaff = {
    id: string;
    name: string;
    code?: string;
    position?: string;
    department?: string;
    discipline?: string;
    avatarUrl?: string;
    email?: string;
    phone?: string;
    address?: string;
    companyName?: string;
    companyTaxCode?: string;
    personalTaxCode?: string;
    bankAccount?: string;
    bankName?: string;
    skills?: string;
    experience?: string;
    certifications?: string;
    hourlyRate?: number;
    dailyRate?: number;
    monthlyRate?: number;
    rateType?: string;
    isActive: boolean;
    notes?: string;
};

export default function OutsourcingStaffPage() {
    const [staff, setStaff] = useState<OutsourcingStaff[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<OutsourcingStaff | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        position: '',
        department: '',
        discipline: '',
        avatarUrl: '',
        email: '',
        phone: '',
        address: '',
        companyName: '',
        companyTaxCode: '',
        personalTaxCode: '',
        bankAccount: '',
        bankName: '',
        skills: '',
        experience: '',
        certifications: '',
        hourlyRate: '',
        dailyRate: '',
        monthlyRate: '',
        rateType: '',
        isActive: true,
        notes: '',
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/outsourcing-staff', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const result = await res.json();
            console.log('API Response:', result);
            
            if (result.success && Array.isArray(result.data)) {
                console.log(`✅ Loaded ${result.data.length} staff members`);
                setStaff(result.data);
            } else {
                console.error('❌ Invalid API response:', result);
                setStaff([]);
            }
        } catch (error) {
            console.error('❌ Failed to fetch outsourcing staff:', error);
            alert('Lỗi khi tải danh sách nhân sự: ' + (error instanceof Error ? error.message : 'Unknown error'));
            setStaff([]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number | undefined | null): string => {
        if (amount === undefined || amount === null || isNaN(amount)) return '-';
        return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
    };

    const formatNumberWithDots = (value: number | undefined | null): string => {
        if (value === undefined || value === null || isNaN(value)) return '';
        return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const parseFormattedNumber = (value: string): number | undefined => {
        if (!value || value.trim() === '') return undefined;
        const cleaned = value.replace(/\./g, '').replace(/,/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? undefined : parsed;
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            position: '',
            department: '',
            discipline: '',
            avatarUrl: '',
            email: '',
            phone: '',
            address: '',
            companyName: '',
            companyTaxCode: '',
            personalTaxCode: '',
            bankAccount: '',
            bankName: '',
            skills: '',
            experience: '',
            certifications: '',
            hourlyRate: '',
            dailyRate: '',
            monthlyRate: '',
            rateType: '',
            isActive: true,
            notes: '',
        });
        setEditingStaff(null);
        setImagePreview(null);
    };

    const handleOpenAddModal = () => {
        resetForm();
        setShowAddModal(true);
    };

    const handleOpenEditModal = (staffMember: OutsourcingStaff) => {
        setEditingStaff(staffMember);
        setFormData({
            name: staffMember.name || '',
            code: staffMember.code || '',
            position: staffMember.position || '',
            department: staffMember.department || '',
            discipline: staffMember.discipline || '',
            avatarUrl: staffMember.avatarUrl || '',
            email: staffMember.email || '',
            phone: staffMember.phone || '',
            address: staffMember.address || '',
            companyName: staffMember.companyName || '',
            companyTaxCode: staffMember.companyTaxCode || '',
            personalTaxCode: staffMember.personalTaxCode || '',
            bankAccount: staffMember.bankAccount || '',
            bankName: staffMember.bankName || '',
            skills: staffMember.skills || '',
            experience: staffMember.experience || '',
            certifications: staffMember.certifications || '',
            hourlyRate: formatNumberWithDots(staffMember.hourlyRate),
            dailyRate: formatNumberWithDots(staffMember.dailyRate),
            monthlyRate: formatNumberWithDots(staffMember.monthlyRate),
            rateType: staffMember.rateType || '',
            isActive: staffMember.isActive,
            notes: staffMember.notes || '',
        });
        setImagePreview(staffMember.avatarUrl || null);
        setShowAddModal(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Kích thước file không được vượt quá 5MB');
            return;
        }

        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/outsourcing-staff/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await res.json();
            if (result.success) {
                setFormData(prev => ({ ...prev, avatarUrl: result.data.url }));
                setImagePreview(result.data.url);
            } else {
                alert(result.error || 'Lỗi khi upload ảnh');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Có lỗi xảy ra khi upload ảnh');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                hourlyRate: parseFormattedNumber(formData.hourlyRate),
                dailyRate: parseFormattedNumber(formData.dailyRate),
                monthlyRate: parseFormattedNumber(formData.monthlyRate),
            };

            const url = editingStaff
                ? `/api/outsourcing-staff/${editingStaff.id}`
                : '/api/outsourcing-staff';
            const method = editingStaff ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            if (result.success) {
                setShowAddModal(false);
                resetForm();
                fetchStaff();
            } else {
                alert(result.error || 'Failed to save staff member');
            }
        } catch (error) {
            console.error('Save staff error:', error);
            alert('Có lỗi xảy ra khi lưu thông tin nhân sự');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa nhân sự này?')) return;

        try {
            const res = await fetch(`/api/outsourcing-staff/${id}`, {
                method: 'DELETE',
            });
            const result = await res.json();
            if (result.success) {
                fetchStaff();
            } else {
                alert(result.error || 'Failed to delete staff member');
            }
        } catch (error) {
            console.error('Delete staff error:', error);
            alert('Có lỗi xảy ra khi xóa nhân sự');
        }
    };

    return (
        <div className="px-4 py-4 md:px-6 md:py-5 space-y-4">
            <div className="flex items-center justify-end">
                <button
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                    <span>👤+</span> Thêm Nhân sự
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tên</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Mã</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Vị trí</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Công ty</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Giá</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Liên hệ</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">Đang tải...</td>
                                </tr>
                            ) : staff.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">Chưa có nhân sự nào.</td>
                                </tr>
                            ) : (
                                staff.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900">{s.name}</p>
                                            {s.department && (
                                                <p className="text-xs text-gray-500">{s.department}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{s.code || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{s.position || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {s.companyName || '-'}
                                            {s.companyTaxCode && (
                                                <span className="block text-xs text-gray-500">MST: {s.companyTaxCode}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {s.rateType === 'hourly' && s.hourlyRate && (
                                                <span>{formatCurrency(s.hourlyRate)}/giờ</span>
                                            )}
                                            {s.rateType === 'daily' && s.dailyRate && (
                                                <span>{formatCurrency(s.dailyRate)}/ngày</span>
                                            )}
                                            {s.rateType === 'monthly' && s.monthlyRate && (
                                                <span>{formatCurrency(s.monthlyRate)}/tháng</span>
                                            )}
                                            {!s.rateType && '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {s.email && <div className="text-xs">{s.email}</div>}
                                            {s.phone && <div className="text-xs">{s.phone}</div>}
                                            {!s.email && !s.phone && '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                s.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {s.isActive ? 'Hoạt động' : 'Ngừng'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleOpenEditModal(s)}
                                                className="text-gray-400 hover:text-blue-600 p-1 mr-2"
                                                title="Chỉnh sửa"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDelete(s.id)}
                                                className="text-gray-400 hover:text-red-600 p-1"
                                                title="Xóa"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingStaff ? 'Chỉnh sửa Nhân sự' : 'Thêm Nhân sự Mới'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-light"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            {/* Avatar Upload */}
                            <div className="flex items-center gap-6 pb-4 border-b">
                                <div className="flex-shrink-0">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Avatar preview"
                                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                                            <span className="text-3xl text-gray-400">👤</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                        title="Chọn ảnh đại diện cho nhân sự"
                                        aria-label="Chọn ảnh đại diện"
                                    />
                                    {uploadingImage && (
                                        <p className="text-xs text-blue-600 mt-1">Đang upload ảnh...</p>
                                    )}
                                    {formData.avatarUrl && !uploadingImage && (
                                        <p className="text-xs text-green-600 mt-1">✓ Đã upload thành công</p>
                                    )}
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên nhân sự <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhân sự</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="NS001"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí/Chức vụ</label>
                                    <input
                                        type="text"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Kỹ sư BIM"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Phòng Kỹ thuật"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bộ môn</label>
                                <input
                                    type="text"
                                    value={formData.discipline}
                                    onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Kiến trúc, Kết cấu, MEP..."
                                />
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Company Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên công ty</label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế công ty</label>
                                    <input
                                        type="text"
                                        value={formData.companyTaxCode}
                                        onChange={(e) => setFormData({ ...formData, companyTaxCode: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Personal Tax & Bank Info */}
                            <div className="border-t pt-4">
                                <h3 className="text-sm font-bold text-gray-700 mb-3">Thông tin Thuế & Ngân hàng</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế cá nhân</label>
                                        <input
                                            type="text"
                                            value={formData.personalTaxCode}
                                            onChange={(e) => setFormData({ ...formData, personalTaxCode: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Mã số thuế cá nhân"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản ngân hàng</label>
                                        <input
                                            type="text"
                                            value={formData.bankAccount}
                                            onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Số tài khoản"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên ngân hàng</label>
                                    <input
                                        type="text"
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="VD: Vietcombank, Techcombank..."
                                    />
                                </div>
                            </div>

                            {/* Skills & Experience */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kỹ năng chuyên môn</label>
                                <textarea
                                    value={formData.skills}
                                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={2}
                                    placeholder="Revit, AutoCAD, Navisworks..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kinh nghiệm</label>
                                    <textarea
                                        value={formData.experience}
                                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={2}
                                        placeholder="5 năm kinh nghiệm..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chứng chỉ</label>
                                    <textarea
                                        value={formData.certifications}
                                        onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={2}
                                        placeholder="Autodesk Certified..."
                                    />
                                </div>
                            </div>

                            {/* Rate Info */}
                            <div className="border-t pt-4">
                                <h3 className="text-sm font-bold text-gray-700 mb-3">Thông tin Giá</h3>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại giá</label>
                                    <select
                                        value={formData.rateType}
                                        onChange={(e) => setFormData({ ...formData, rateType: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">-- Chọn loại giá --</option>
                                        <option value="hourly">Theo giờ</option>
                                        <option value="daily">Theo ngày</option>
                                        <option value="monthly">Theo tháng</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá/giờ (VNĐ)</label>
                                        <input
                                            type="text"
                                            value={formData.hourlyRate}
                                            onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá/ngày (VNĐ)</label>
                                        <input
                                            type="text"
                                            value={formData.dailyRate}
                                            onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá/tháng (VNĐ)</label>
                                        <input
                                            type="text"
                                            value={formData.monthlyRate}
                                            onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Status & Notes */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Đang hoạt động</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                            </div>

                            <div className="pt-4 flex gap-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    {editingStaff ? 'Cập nhật' : 'Thêm Nhân sự'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
