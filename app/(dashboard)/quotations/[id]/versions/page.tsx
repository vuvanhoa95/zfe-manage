'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatVND } from '@/lib/number-to-words-vn';

type Revision = {
    id: string;
    revisionNo: number;
    revisionDate: string;
    note?: string | null;
    totalBeforeVat: number;
    vatAmount: number;
    totalAfterVat: number;
    createdBy: {
        name: string;
    };
};

export default function VersionHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [revisions, setRevisions] = useState<Revision[]>([]);
    const [loading, setLoading] = useState(true);
    const [quotationNo, setQuotationNo] = useState('');

    useEffect(() => {
        if (id) {
            fetchRevisions();
        }
    }, [id]);

    const fetchRevisions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/quotations/${id}`);
            const result = await res.json();
            if (result.success) {
                setQuotationNo(result.data.quotationNo);
                // We assume revisions are included or fetched separately
                // Let's create an API endpoint for this if not already there
            }

            const revRes = await fetch(`/api/revisions?quotationId=${id}`);
            const revResult = await revRes.json();
            if (revResult.success) {
                setRevisions(revResult.data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (revisionId: string) => {
        if (!confirm('Are you sure you want to restore this version? Current data will be overwritten.')) return;

        try {
            const res = await fetch(`/api/revisions/${revisionId}/restore`, {
                method: 'POST',
            });
            const result = await res.json();
            if (result.success) {
                alert('Restored successfully!');
                router.push(`/quotations/${id}/edit`);
            } else {
                alert(result.error || 'Restore failed');
            }
        } catch (error) {
            console.error('Restore error:', error);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-gray-900">Version History</h1>
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-mono text-xs font-bold ring-1 ring-blue-200">
                            {quotationNo}
                        </span>
                    </div>
                    <p className="text-gray-600">Review and restore previous snapshots of this quotation.</p>
                </div>
                <button
                    onClick={() => router.push(`/quotations/${id}/edit`)}
                    className="text-gray-500 hover:text-gray-700 font-medium"
                >
                    Back to Editor
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Rev No</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tên bản lưu</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Amount (VNĐ)</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Saved By</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading history...</td>
                                </tr>
                            ) : revisions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No versions found.</td>
                                </tr>
                            ) : (
                                revisions.map((rev) => (
                                    <tr key={rev.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-900">V{rev.revisionNo}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(rev.revisionDate).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-700 font-mono break-all">
                                            {rev.note || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                            {formatVND(rev.totalAfterVat)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {rev.createdBy.name}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleRestore(rev.id)}
                                                className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-xs border border-blue-200"
                                            >
                                                Restore This Version
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
