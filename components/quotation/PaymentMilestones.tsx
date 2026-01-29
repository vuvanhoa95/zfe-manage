'use client';

import { PaymentMilestoneInput } from '@/types/quotation';
import { validatePaymentMilestones } from '@/lib/utils';

type PaymentMilestonesProps = {
    milestones: PaymentMilestoneInput[];
    onChange: (milestones: PaymentMilestoneInput[]) => void;
};

export default function PaymentMilestones({ milestones, onChange }: PaymentMilestonesProps) {
    const addMilestone = () => {
        const newMilestone: PaymentMilestoneInput = {
            no: milestones.length + 1,
            title: '',
            percent: 0,
            expectedDate: '',
            order: milestones.length,
        };
        onChange([...milestones, newMilestone]);
    };

    const updateMilestone = (index: number, field: keyof PaymentMilestoneInput, value: any) => {
        const updated = [...milestones];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const removeMilestone = (index: number) => {
        const updated = milestones.filter((_, i) => i !== index);
        // Renumber
        updated.forEach((m, idx) => {
            m.no = idx + 1;
            m.order = idx;
        });
        onChange(updated);
    };

    const totalPercent = milestones.reduce((sum, m) => sum + (m.percent || 0), 0);
    const isValid = validatePaymentMilestones(milestones);
    const formatDateForInput = (dateValue: string | Date | null | undefined) => {
        if (!dateValue) return '';
        if (dateValue instanceof Date) {
            try {
                return dateValue.toISOString().split('T')[0];
            } catch (e) {
                return '';
            }
        }
        if (typeof dateValue === 'string') {
            return dateValue.split('T')[0];
        }
        return '';
    };

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-zf-bg-secondary border-b border-zf-bg-tertiary">
                        <tr>
                            <th className="px-3 py-3 text-center font-bold text-zf-text-secondary w-16">STT</th>
                            <th className="px-3 py-4 text-left font-bold text-zf-text-secondary">Nội dung</th>
                            <th className="px-3 py-4 text-center font-bold text-zf-text-secondary w-44">Ngày dự kiến</th>
                            <th className="px-3 py-4 text-right font-bold text-zf-text-secondary w-32">Tỉ lệ (%)</th>
                            <th className="px-3 py-4 text-center font-bold text-zf-text-secondary w-20">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {milestones.map((milestone, index) => (
                            <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="px-3 py-3 text-center font-medium text-gray-700">
                                    {milestone.no}
                                </td>
                                <td className="px-3 py-3">
                                    <input
                                        type="text"
                                        value={milestone.title}
                                        onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-slate-900 bg-white font-medium"
                                        placeholder="Tạm ứng, Thanh toán đợt 1..."
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <input
                                        type="date"
                                        value={formatDateForInput(milestone.expectedDate)}
                                        onChange={(e) => updateMilestone(index, 'expectedDate', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-slate-900 bg-white"
                                        aria-label={`Ngày dự kiến đợt ${milestone.no}`}
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <input
                                        type="number"
                                        value={milestone.percent}
                                        onChange={(e) => updateMilestone(index, 'percent', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-right text-slate-900 bg-white font-bold"
                                        placeholder="30"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                    />
                                </td>
                                <td className="px-3 py-3 text-center">
                                    <button
                                        onClick={() => removeMilestone(index)}
                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                                        title="Xóa"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-zf-bg-secondary border-t-2 border-zf-bg-tertiary">
                        <tr>
                            <td className="px-3 py-4 font-bold text-zf-text-primary uppercase tracking-wider" colSpan={3}>
                                TỔNG CỘNG
                            </td>
                            <td className={`px-3 py-4 text-right font-black text-lg ${isValid ? 'text-zf-success' : 'text-zf-error'}`}>
                                {totalPercent.toFixed(1)}%
                            </td>
                            <td className="px-3 py-4 text-center">
                                {!isValid && (
                                    <span className="text-zf-error text-xs font-bold bg-zf-error/10 px-2 py-1 rounded">
                                        ⚠️ Tổng phải bằng 100%
                                    </span>
                                )}
                                {isValid && (
                                    <span className="text-zf-success text-xs font-bold bg-zf-success/10 px-2 py-1 rounded">
                                        ✓ Hợp lệ
                                    </span>
                                )}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Add Button */}
            <button
                onClick={addMilestone}
                className="px-4 py-2 bg-zf-accent text-white rounded-lg hover:bg-zf-accent-dark transition-all text-sm font-bold shadow-sm"
            >
                + Thêm đợt thanh toán
            </button>
        </div>
    );
}
