'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AiAssistant from '@/components/ai/AiAssistant';
import { PageTransition } from '@/components/ui/PageTransition';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    
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
        </div>
    );
}
