'use client';

import { useEffect, useMemo, useState } from 'react';

type CompanyProfile = {
    name: string;
    taxCode: string;
    address: string;
    email: string;
    website?: string;
    phone: string;
    logoUrl?: string;
    projectSlogan?: string;
    signerName: string;
    signerTitle: string;
};

const EMPTY_PROFILE: CompanyProfile = {
    name: '',
    taxCode: '',
    address: '',
    email: '',
    website: '',
    phone: '',
    logoUrl: '',
    projectSlogan: '',
    signerName: '',
    signerTitle: '',
};

export default function CompanyProfilePage() {
    const [profile, setProfile] = useState<CompanyProfile>(EMPTY_PROFILE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async (options?: { preserveNotice?: boolean }) => {
        setLoading(true);
        if (!options?.preserveNotice) setNotice(null);
        try {
            const res = await fetch('/api/company-profile');
            const result = await res.json();
            if (result.success) {
                setProfile({
                    ...EMPTY_PROFILE,
                    ...result.data,
                    website: result.data?.website ?? '',
                    logoUrl: result.data?.logoUrl ?? '',
                    projectSlogan: result.data?.projectSlogan ?? '',
                });
            } else {
                setNotice({ type: 'error', message: result.error || 'Không thể tải thông tin công ty' });
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            setNotice({ type: 'error', message: 'Không thể tải thông tin công ty' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setNotice(null);

        setSaving(true);
        try {
            const res = await fetch('/api/company-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
            });
            const result = await res.json();
            if (result.success) {
                setNotice({ type: 'success', message: result.message || 'Cập nhật thông tin công ty thành công' });
                await fetchProfile({ preserveNotice: true });
            } else {
                const detailsMessage =
                    result?.details?.fieldErrors &&
                    Object.values(result.details.fieldErrors)
                        .flat()
                        .filter(Boolean)
                        .slice(0, 2)
                        .join(' • ');

                setNotice({
                    type: 'error',
                    message: [result.error || 'Cập nhật thất bại', detailsMessage].filter(Boolean).join(': '),
                });
            }
        } catch (error) {
            console.error('Update error:', error);
            setNotice({ type: 'error', message: 'Không thể cập nhật thông tin công ty' });
        } finally {
            setSaving(false);
        }
    };

    const noticeStyles = useMemo(() => {
        if (!notice) return null;
        return notice.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-800';
    }, [notice]);

    const handleUploadLogo = async (file: File) => {
        setNotice(null);
        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/company-profile/upload-logo', {
                method: 'POST',
                body: formData,
            });
            const result = await res.json();

            if (!result.success) {
                setNotice({ type: 'error', message: result.error || 'Upload logo thất bại' });
                return;
            }

            const url: string | undefined = result?.data?.url;
            if (!url) {
                setNotice({ type: 'error', message: 'Upload logo thất bại: không nhận được URL' });
                return;
            }

            setProfile((prev) => ({ ...prev, logoUrl: url }));
            setNotice({ type: 'success', message: 'Upload logo thành công. Nhấn “Lưu thông tin công ty” để áp dụng.' });
        } catch (error) {
            console.error('Logo upload error:', error);
            setNotice({ type: 'error', message: 'Không thể upload logo' });
        } finally {
            setUploadingLogo(false);
        }
    };

    if (loading) return <div className="px-4 py-4 md:px-6 md:py-5 text-center text-gray-500">Đang tải thông tin công ty...</div>;

    return (
        <div className="px-4 py-4 md:px-6 md:py-5 max-w-4xl mx-auto space-y-6">

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-1 px-8 bg-blue-600 text-white flex items-center justify-between">
                    <h2 className="font-bold py-3 uppercase tracking-wider text-xs">Chỉnh sửa thông tin công ty</h2>
                    {saving && <span className="text-xs font-bold animate-pulse">Đang lưu...</span>}
                </div>

                <form onSubmit={handleUpdate} className="p-8 space-y-6">
                    {notice && (
                        <div className={`rounded-lg border px-4 py-3 text-sm ${noticeStyles}`} role="status" aria-live="polite">
                            {notice.message}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tên công ty (theo đăng ký)</label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="VD: CÔNG TY TNHH ZFENIX"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Logo công ty</label>
                            <div className="flex flex-col md:flex-row gap-4 md:items-center">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                                        {profile.logoUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={profile.logoUrl} alt="Logo công ty" className="h-full w-full object-contain" />
                                        ) : (
                                            <span className="text-xs text-gray-400">Chưa có</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <p className="font-semibold text-gray-800">Chọn file ảnh (PNG/JPG/WebP…)</p>
                                        <p className="text-xs">Tối đa 5MB</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        aria-label="Chọn logo công ty"
                                        disabled={uploadingLogo}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            void handleUploadLogo(file);
                                            // reset to allow re-upload same file
                                            e.currentTarget.value = '';
                                        }}
                                        className="block w-full md:w-auto text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-bold hover:file:bg-blue-100"
                                    />
                                    {uploadingLogo && (
                                        <span className="text-xs font-bold text-blue-600 animate-pulse" aria-label="Đang upload logo">
                                            Đang upload...
                                        </span>
                                    )}
                                </div>
                            </div>
                            {profile.logoUrl && (
                                <p className="mt-2 text-xs text-gray-500 break-all">
                                    URL: <span className="font-mono">{profile.logoUrl}</span>
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Slogan dự án</label>
                            <input
                                type="text"
                                value={profile.projectSlogan || ''}
                                onChange={(e) => setProfile((prev) => ({ ...prev, projectSlogan: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="VD: Giải pháp BIM chuyên nghiệp cho dự án của bạn"
                            />
                            <p className="mt-2 text-xs text-gray-500">Slogan sẽ dùng làm dữ liệu cho phần báo giá (PDF/DOCX/preview).</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Mã số thuế</label>
                            <input
                                type="text"
                                value={profile.taxCode}
                                onChange={(e) => setProfile((prev) => ({ ...prev, taxCode: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                            <input
                                type="text"
                                value={profile.phone}
                                onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                            <input
                                type="text"
                                value={profile.website || ''}
                                onChange={(e) => setProfile((prev) => ({ ...prev, website: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ</label>
                            <input
                                type="text"
                                value={profile.address}
                                onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-blue-600">🖋️</span> Thông tin người ký
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Người đại diện</label>
                                <input
                                    type="text"
                                    value={profile.signerName}
                                    onChange={(e) => setProfile((prev) => ({ ...prev, signerName: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="VD: Nguyễn Văn A"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Chức vụ</label>
                                <input
                                    type="text"
                                    value={profile.signerTitle}
                                    onChange={(e) => setProfile((prev) => ({ ...prev, signerTitle: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="VD: Giám đốc"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={saving}
                            aria-label="Lưu thông tin công ty"
                            className={`
                w-full md:w-auto px-12 py-3 bg-blue-600 text-white rounded-xl font-bold transition-all shadow-xl shadow-blue-500/20
                ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 hover:-translate-y-1'}
              `}
                        >
                            {saving ? 'Đang cập nhật...' : 'Lưu thông tin công ty'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
