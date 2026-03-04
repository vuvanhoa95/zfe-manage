'use client';

import { useRouter } from 'next/navigation';
import QuotationEditor from '@/components/quotation/QuotationEditor';
import { QuotationFormData } from '@/types/quotation';

export default function NewQuotationPage() {
    const router = useRouter();

    const handleSave = async (data: QuotationFormData) => {
        const response = await fetch('/api/quotations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
            // Redirect to edit page of the newly created quotation
            router.push(`/quotations/${result.data.id}/edit`);
        } else {
            // Build detailed error message
            let errorMsg = result.error || 'Không thể tạo báo giá';
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

    return (
        <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Quotation</h1>
                    <p className="text-sm text-gray-500">Draft your BIM services proposal.</p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="text-gray-500 hover:text-gray-700 font-medium text-sm"
                >
                    Cancel
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                <QuotationEditor onSave={handleSave} isNew={true} />
            </div>
        </div>
    );
}
