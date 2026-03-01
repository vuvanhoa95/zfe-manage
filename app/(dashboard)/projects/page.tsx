'use client';

import { Suspense } from 'react';
import ProjectTab from '@/components/project/ProjectTab';

export default function ProjectsPage() {
    return (
        <Suspense fallback={
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        }>
            <ProjectTab />
        </Suspense>
    );
}
