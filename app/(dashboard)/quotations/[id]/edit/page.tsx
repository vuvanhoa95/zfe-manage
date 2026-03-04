'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QuotationEditor from '@/components/quotation/QuotationEditor';
import { QuotationFormData } from '@/types/quotation';

export default function EditQuotationPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [initialData, setInitialData] = useState<QuotationFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [quotationNo, setQuotationNo] = useState('');

    useEffect(() => {
        if (id) {
            fetchQuotation();
        }
    }, [id]);

    const fetchQuotation = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/quotations/${id}`);
            const result = await res.json();
            if (result.success) {
                // API trả về JSON nên các field Date sẽ là string; QuotationEditor expects `date: Date`
                const normalized: QuotationFormData = {
                    ...result.data,
                    date: result.data?.date ? new Date(result.data.date) : new Date(),
                };
                setInitialData(normalized);
                setQuotationNo(result.data.quotationNo);
            } else {
                alert('Quotation not found');
                router.push('/quotations');
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: QuotationFormData) => {
        const response = await fetch(`/api/quotations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!result.success) {
            // Build detailed error message
            let errorMsg = result.error || 'Không thể cập nhật báo giá';
            if (result.details?.fieldErrors) {
                const fieldErrors = Object.entries(result.details.fieldErrors)
                    .filter(([, msgs]) => Array.isArray(msgs) && (msgs as string[]).length > 0)
                    .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
                    .join('; ');
                if (fieldErrors) {
                    errorMsg += ' — ' + fieldErrors;
                }
            }
            throw new Error(errorMsg);
        }
    };

    const handleExportDocx = async () => {
        try {
            const response = await fetch(`/api/quotations/${id}/export-docx`, {
                method: 'POST',
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${quotationNo}.docx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert('Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-500">Loading quotation data...</p>
                </div>
            </div>
        );
    }

    if (!initialData) return null;

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
                <QuotationEditor
                    id={id}
                    quotation={initialData}
                    quotationNo={quotationNo}
                    onSave={handleSave}
                    onExportDocx={handleExportDocx}
                    isNew={false}
                />
            </div>
        </div>
    );
}
