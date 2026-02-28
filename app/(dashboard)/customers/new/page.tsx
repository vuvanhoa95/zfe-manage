'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCustomerPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect về trang customers (modal sẽ được mở từ đó)
        router.replace('/customers');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <p className="text-gray-600">Đang chuyển hướng...</p>
            </div>
        </div>
    );
}
