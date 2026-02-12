'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import CardScanner from '@/components/customer/CardScanner';
import { CreditCard } from 'lucide-react';

type Customer = {
    id: string;
    name: string;
    taxCode?: string | null;
    address?: string | null;
    location?: string | null;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    projectCount?: number;
};

type CustomerFormState = {
    name: string;
    taxCode: string;
    address: string;
    location: string;
    contactName: string;
    email: string;
    phone: string;
};

const emptyCustomerForm: CustomerFormState = {
    name: '',
    taxCode: '',
    address: '',
    location: '',
    contactName: '',
    email: '',
    phone: '',
};

export default function CustomerListPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [formState, setFormState] = useState<CustomerFormState>(emptyCustomerForm);
    const [showScanner, setShowScanner] = useState(false);

    const handleScanComplete = (data: any) => {
        setFormState({
            name: data.company || data.name || '',
            taxCode: data.taxCode || '',
            address: data.address || '',
            location: '',
            contactName: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
        });
        setShowScanner(false);
        setShowModal(true);
    };

    useEffect(() => {
        void fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/customers');
            const result = await res.json();
            if (result.success) {
                setCustomers(result.data as Customer[]);
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingCustomer(null);
        setFormState(emptyCustomerForm);
        setShowModal(true);
    };

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormState({
            name: customer.name ?? '',
            taxCode: customer.taxCode ?? '',
            address: customer.address ?? '',
            location: customer.location ?? '',
            contactName: customer.contactName ?? '',
            email: customer.email ?? '',
            phone: customer.phone ?? '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const isEdit = Boolean(editingCustomer?.id);
            const url = isEdit ? `/api/customers/${editingCustomer?.id}` : '/api/customers';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formState),
            });
            const result = await res.json();
            if (result.success) {
                setShowModal(false);
                setEditingCustomer(null);
                setFormState(emptyCustomerForm);
                void fetchCustomers();
            } else {
                alert(result.error || 'Không thể lưu khách hàng');
            }
        } catch (error) {
            console.error('Save customer error:', error);
        }
    };

    const handleDeleteCustomer = async (customer: Customer) => {
        const confirmed = window.confirm(
            `Bạn có chắc chắn muốn xóa khách hàng "${customer.name}"? Hành động này không thể hoàn tác.`,
        );
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/customers/${customer.id}`, {
                method: 'DELETE',
            });
            const result = await res.json();
            if (result.success) {
                void fetchCustomers();
            } else {
                alert(result.error || 'Không thể xóa khách hàng');
            }
        } catch (error) {
            console.error('Delete customer error:', error);
        }
    };

    return (
        <div className="px-4 py-4 md:px-6 md:py-5 space-y-4">
            <div className="flex items-center justify-end gap-3">
                <button
                    onClick={() => setShowScanner(true)}
                    className="px-4 py-2 bg-zf-accent text-white rounded-lg hover:bg-zf-accent/90 transition-colors font-medium flex items-center gap-2"
                    aria-label="Quét danh thiếp"
                >
                    <CreditCard size={18} /> Quét danh thiếp
                </button>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                    aria-label="Thêm khách hàng mới"
                >
                    <span>👤+</span> Thêm khách hàng
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tên khách hàng</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Mã số thuế</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Người liên hệ</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Điện thoại</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Địa điểm</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">
                                    Số dự án đã báo giá
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        Đang tải danh sách khách hàng...
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        Chưa có khách hàng nào.
                                    </td>
                                </tr>
                            ) : (
                                customers.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900">{c.name}</p>
                                            <p className="text-xs text-gray-500 truncate max-w-xs">{c.address}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{c.taxCode || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{c.contactName || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{c.email || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{c.phone || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{c.location || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-center text-gray-900">
                                            {typeof c.projectCount === 'number' ? c.projectCount : 0}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(c)}
                                                className="text-gray-400 hover:text-blue-600 p-1"
                                                aria-label="Chỉnh sửa khách hàng"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCustomer(c)}
                                                className="text-gray-400 hover:text-red-600 p-1"
                                                aria-label="Xóa khách hàng"
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

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingCustomer(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-light"
                                aria-label="Đóng"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên khách hàng *
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formState.name}
                                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ban quản lý dự án ..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
                                    <input
                                        type="text"
                                        value={formState.taxCode}
                                        onChange={(e) => setFormState({ ...formState, taxCode: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
                                    <input
                                        type="text"
                                        value={formState.phone}
                                        onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                                <input
                                    type="text"
                                    value={formState.address}
                                    onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
                                    <input
                                        type="text"
                                        value={formState.location}
                                        onChange={(e) =>
                                            setFormState({
                                                ...formState,
                                                location: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Hà Nội, TP. Hồ Chí Minh..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Người liên hệ</label>
                                    <input
                                        type="text"
                                        value={formState.contactName}
                                        onChange={(e) =>
                                            setFormState({
                                                ...formState,
                                                contactName: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formState.email}
                                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingCustomer(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    {editingCustomer ? 'Lưu thay đổi' : 'Lưu khách hàng'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Card Scanner Modal */}
            {showScanner && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm animate-in fade-in duration-300">
                    <CardScanner 
                        onScanComplete={handleScanComplete} 
                        onClose={() => setShowScanner(false)} 
                    />
                </div>
            )}
        </div>
    );
}
