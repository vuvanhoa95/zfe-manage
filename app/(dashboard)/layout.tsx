'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { PageTransition } from '@/components/ui/PageTransition';
import { useCommandPalette } from '@/lib/hooks/useCommandPalette';

// ⚡ PERFORMANCE: Lazy-load non-critical UI overlays
const AiAssistant = dynamic(() => import('@/components/ai/AiAssistant'), { ssr: false });
const TechnicalCommandPalette = dynamic(() => import('@/components/technical/TechnicalCommandPalette'), { ssr: false });

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { isOpen, setIsOpen, commands } = useCommandPalette();
    
    // Lọc bớt các cảnh báo Recharts gây nhiễu log nhưng không ảnh hưởng tới chức năng.
    useEffect(() => {
        const originalError = console.error;

        console.error = (...args: unknown[]) => {
            const firstArg = args[0];
            if (
                typeof firstArg === 'string' &&
                firstArg.includes('The width(-1) and height(-1) of chart should be greater than 0')
            ) {
                // Bỏ qua cảnh báo kích thước chart của Recharts
                return;
            }

            // eslint-disable-next-line no-console
            originalError(...(args as []));
        };

        return () => {
            console.error = originalError;
        };
    }, []);
    
    // Ẩn chatbot global khi đang ở trang quotation editor (có chatbot riêng)
    // Hiển thị chatbot global ở: /quotations (list), /quotations/new, /quotations/quick-form
    // Ẩn chatbot global ở: /quotations/[id]/edit, /quotations/[id]/versions (có chatbot riêng)
    const isQuotationEditorPage = pathname?.match(/^\/quotations\/[^/]+\/(edit|versions)/);
    const shouldShowGlobalChatbot = !isQuotationEditorPage;
    
    return (
        <div className="h-screen flex overflow-hidden bg-gray-100">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <PageTransition className="h-full">{children}</PageTransition>
                </main>
            </div>

            {shouldShowGlobalChatbot && <AiAssistant />}
            
            {/* Technical Command Palette */}
            <TechnicalCommandPalette
                commands={commands}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </div>
    );
}
