'use client';

import { useRouter } from 'next/navigation';
import QuotationEditor from '@/components/quotation/QuotationEditor';
import { QuotationFormData } from '@/types/quotation';

export default function NewQuotationPage() {
    const router = useRouter();

    const handleSave = async (data: QuotationFormData) => {
        try {
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
                alert(result.error || 'Failed to create quotation');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('An error occurred while saving the quotation.');
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
