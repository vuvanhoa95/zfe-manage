'use client';

import { useEffect, useState } from 'react';
import { formatVND } from '@/lib/number-to-words-vn';
import { OutsourceLineInput } from '@/types/quotation';

type OutsourcingStaff = {
    id: string;
    name: string;
    code: string;
    position: string;
    discipline: string;
    hourlyRate: number;
    dailyRate: number;
    monthlyRate: number;
    rateType: string;
    isActive: boolean;
};

type OutsourceCostDetailProps = {
    value: OutsourceLineInput[];
    onChange: (items: OutsourceLineInput[]) => void;
    totalCost: number;
    onTotalCostChange: (cost: number) => void;
};

export default function OutsourceCostDetail({
    value,
    onChange,
    totalCost,
    onTotalCostChange,
}: OutsourceCostDetailProps) {
    const [staffList, setStaffList] = useState<OutsourcingStaff[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchStaffList();
    }, []);

    const fetchStaffList = async () => {
        try {
            const res = await fetch('/api/outsourcing-staff?isActive=true');
            const result = await res.json();
            if (result.success) {
                setStaffList(result.data);
            }
        } catch (error) {
            console.error('Error fetching staff list:', error);
        }
    };

    const addStaffToList = () => {
        if (selectedStaffIds.size === 0) {
            alert('Vui lòng chọn ít nhất một nhân sự');
            return;
        }

        const newItems: OutsourceLineInput[] = [];
        selectedStaffIds.forEach(staffId => {
            const staff = staffList.find(s => s.id === staffId);
            if (!staff) return;

            // Check if already exists (by staffName)
            if (value.some(item => item.staffName === staff.name)) return;

            const rateType = (staff.rateType || 'monthly') as 'hourly' | 'daily' | 'monthly';
            const unitRate = rateType === 'hourly' 
                ? staff.hourlyRate 
                : rateType === 'daily' 
                    ? staff.dailyRate 
                    : staff.monthlyRate;
            const unit = rateType === 'hourly' ? 'giờ' : rateType === 'daily' ? 'ngày' : 'tháng';

            newItems.push({
                staffName: staff.name,
                discipline: staff.discipline || '',
                unit,
                qty: 1,
                unitRate: unitRate || 0,
                totalAmount: unitRate || 0,
                order: value.length + newItems.length,
            });
        });

        if (newItems.length > 0) {
            const updated = [...value, ...newItems];
            onChange(updated);
            updateTotalCost(updated);
        }

        setSelectedStaffIds(new Set());
        setIsModalOpen(false);
    };

    const updateLine = (index: number, field: keyof OutsourceLineInput, newValue: any) => {
        const updated = [...value];
        updated[index] = { ...updated[index], [field]: newValue };

        // Recalculate totalAmount
        if (field === 'qty' || field === 'unitRate') {
            const qty = updated[index].qty || 0;
            const rate = updated[index].unitRate || 0;
            updated[index].totalAmount = qty * rate;
        }

        onChange(updated);
        updateTotalCost(updated);
    };

    const removeLine = (index: number) => {
        const updated = value.filter((_, i) => i !== index);
        onChange(updated);
        updateTotalCost(updated);
    };

    const updateTotalCost = (items: OutsourceLineInput[]) => {
        const total = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        onTotalCostChange(total);
    };

    const toggleStaffSelection = (staffId: string) => {
        setSelectedStaffIds(prev => {
            const next = new Set(prev);
            if (next.has(staffId)) {
                next.delete(staffId);
            } else {
                next.add(staffId);
            }
            return next;
        });
    };

    const getRateTypeLabel = (type: string) => {
        switch (type) {
            case 'hourly': return 'Giờ';
            case 'daily': return 'Ngày';
            case 'monthly': return 'Tháng';
            default: return type;
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-yellow-800 uppercase">
                    Chi phí Outsource (Chi tiết)
                </label>
                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xs font-bold"
                >
                    + Thêm nhân sự
                </button>
            </div>

            {value.length > 0 ? (
                <div className="border border-yellow-300 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                        <thead className="bg-yellow-100">
                            <tr>
                                <th className="px-2 py-2 text-left font-bold text-yellow-900">Nhân sự</th>
                                <th className="px-2 py-2 text-left font-bold text-yellow-900">Chuyên môn</th>
                                <th className="px-2 py-2 text-right font-bold text-yellow-900">SL</th>
                                <th className="px-2 py-2 text-left font-bold text-yellow-900">ĐV</th>
                                <th className="px-2 py-2 text-right font-bold text-yellow-900">Đơn giá</th>
                                <th className="px-2 py-2 text-right font-bold text-yellow-900">Thành tiền</th>
                                <th className="px-2 py-2 text-center font-bold text-yellow-900 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-yellow-200">
                            {value.map((item, index) => (
                                <tr key={index} className="hover:bg-yellow-50">
                                    <td className="px-2 py-2 font-medium text-gray-900">{item.staffName}</td>
                                    <td className="px-2 py-2 text-gray-600">{item.discipline}</td>
                                    <td className="px-2 py-2">
                                        <input
                                            type="number"
                                            value={item.qty || 0}
                                            onChange={(e) => updateLine(index, 'qty', parseFloat(e.target.value) || 0)}
                                            className="w-full px-2 py-1 border border-yellow-300 rounded text-right font-bold"
                                            min="0"
                                            step="0.5"
                                        />
                                    </td>
                                    <td className="px-2 py-2 text-gray-600">{item.unit || 'tháng'}</td>
                                    <td className="px-2 py-2 text-right font-mono text-gray-900">
                                        {formatVND(item.unitRate || 0)}
                                    </td>
                                    <td className="px-2 py-2 text-right font-bold text-yellow-900">
                                        {formatVND(item.totalAmount || 0)}
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeLine(index)}
                                            className="text-red-500 hover:text-red-700 font-bold"
                                            title="Xóa"
                                        >
                                            ×
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-yellow-50">
                            <tr>
                                <td colSpan={5} className="px-2 py-2 text-right font-bold text-yellow-900">
                                    TỔNG CHI PHÍ OUTSOURCE:
                                </td>
                                <td className="px-2 py-2 text-right font-black text-yellow-900 text-sm">
                                    {formatVND(totalCost)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <div className="border border-yellow-300 rounded-lg p-4 text-center text-yellow-700 text-sm">
                    Chưa có nhân sự outsource. Click "Thêm nhân sự" để bắt đầu.
                </div>
            )}

            {/* Modal chọn nhân sự */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Chọn nhân sự Outsource</h3>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setSelectedStaffIds(new Set());
                                }}
                                className="text-2xl text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                            {staffList.length === 0 ? (
                                <p className="text-center py-10 text-gray-500">
                                    Chưa có nhân sự outsource trong hệ thống.
                                </p>
                            ) : (
                                staffList.map(staff => {
                                    const isSelected = selectedStaffIds.has(staff.id);
                                    const alreadyAdded = value.some(item => item.staffName === staff.name);

                                    return (
                                        <div
                                            key={staff.id}
                                            onClick={() => {
                                                if (!alreadyAdded) {
                                                    toggleStaffSelection(staff.id);
                                                }
                                            }}
                                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                alreadyAdded
                                                    ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                                                    : isSelected
                                                        ? 'bg-yellow-50 border-yellow-500'
                                                        : 'bg-white border-gray-200 hover:border-yellow-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                    alreadyAdded
                                                        ? 'bg-gray-300 border-gray-400'
                                                        : isSelected
                                                            ? 'bg-yellow-500 border-yellow-500'
                                                            : 'border-gray-300'
                                                }`}>
                                                    {isSelected && !alreadyAdded && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900">{staff.name}</span>
                                                        <span className="text-xs text-gray-500">({staff.code})</span>
                                                        {alreadyAdded && (
                                                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                                                Đã thêm
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {staff.position} • {staff.discipline}
                                                    </div>
                                                    <div className="text-xs text-yellow-700 font-medium mt-1">
                                                        {staff.rateType === 'hourly' && `${formatVND(staff.hourlyRate)}/giờ`}
                                                        {staff.rateType === 'daily' && `${formatVND(staff.dailyRate)}/ngày`}
                                                        {staff.rateType === 'monthly' && `${formatVND(staff.monthlyRate)}/tháng`}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setSelectedStaffIds(new Set());
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={addStaffToList}
                                disabled={selectedStaffIds.size === 0}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                            >
                                Thêm ({selectedStaffIds.size})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
