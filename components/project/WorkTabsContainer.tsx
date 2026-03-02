'use client';

import React, { useState } from 'react';
import { ClipboardList, FileText, Gauge } from 'lucide-react';
import type { ReactNode } from 'react';
import TaskTab from '@/components/project/TaskTab';
import WorkDashboard from '@/components/project/WorkDashboard';
import WorkReportTab from '@/components/project/WorkReportTab';

export type SubTabKey = 'dashboard' | 'task' | 'report';

type WorkTabsContainerProps = {
    projectId: string;
    isNew: boolean;
    /**
     * Cho phép ProjectEditor điều khiển tab con từ bên ngoài.
     * Nếu không truyền, WorkTabsContainer sẽ tự quản lý state nội bộ.
     */
    activeSubTab?: SubTabKey;
    onChangeSubTab?: (tab: SubTabKey) => void;
    /**
     * Ẩn/hiện thanh sub-tabs ở trên cùng.
     * Dùng `showHeader={false}` khi muốn render sub-tabs ở ProjectEditor.
     */
    showHeader?: boolean;
    /**
     * Callback để tự động lưu project khi tạo task (nếu project chưa được lưu)
     */
    onAutoSaveProject?: () => Promise<string | null>; // Returns projectId nếu save thành công, null nếu fail
};

function SubTabButton({
    isActive,
    icon,
    label,
    onClick,
}: {
    isActive: boolean;
    icon: ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-semibold transition-all ${
                isActive
                    ? 'bg-zf-primary text-white shadow-[0_6px_18px_rgba(5,54,99,0.35)]'
                    : 'bg-white/80 text-gray-600 hover:text-zf-primary hover:bg-zf-primary/5'
            }`}
        >
            <span className="w-4 h-4">{icon}</span>
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

export default function WorkTabsContainer({ projectId, isNew, onAutoSaveProject }: WorkTabsContainerProps) {
    const [internalSubTab, setInternalSubTab] = useState<SubTabKey>('dashboard');

    // Ưu tiên state điều khiển từ ngoài, fallback về state nội bộ
    const activeSubTab = (arguments[0] as WorkTabsContainerProps).activeSubTab ?? internalSubTab;
    const setActiveSubTab =
        (arguments[0] as WorkTabsContainerProps).onChangeSubTab ?? ((tab: SubTabKey) => setInternalSubTab(tab));

    if (isNew || !projectId) {
        return (
            <div className="px-4 pt-3 pb-4 md:px-6 md:pt-3 md:pb-5 flex items-center justify-center">
                <p className="text-gray-600 italic">Vui lòng lưu dự án trước khi quản lý công việc.</p>
            </div>
        );
    }

    return (
        <div className="px-4 pt-2 pb-4 md:px-6 md:pt-2 md:pb-5 space-y-3 md:space-y-4">
            {/* Sub tabs row: có thể ẩn khi dùng header ở ProjectEditor */}
            {(arguments[0] as WorkTabsContainerProps).showHeader !== false && (
                <div className="flex justify-end">
                    <div className="inline-flex items-center gap-1 bg-white/80 rounded-2xl border border-gray-200 px-1 py-0.5 shadow-sm">
                        <SubTabButton
                            isActive={activeSubTab === 'dashboard'}
                            icon={<Gauge className="w-4 h-4" />}
                            label="Dashboard"
                            onClick={() => setActiveSubTab('dashboard')}
                        />
                        <SubTabButton
                            isActive={activeSubTab === 'task'}
                            icon={<ClipboardList className="w-4 h-4" />}
                            label="Công việc"
                            onClick={() => setActiveSubTab('task')}
                        />
                        <SubTabButton
                            isActive={activeSubTab === 'report'}
                            icon={<FileText className="w-4 h-4" />}
                            label="Báo cáo"
                            onClick={() => setActiveSubTab('report')}
                        />
                    </div>
                </div>
            )}

            {/* Content area — Only mount the ACTIVE tab to avoid redundant API calls.
                Each tab fetches tasks independently, so mounting all 3 at once
                results in 3× identical /api/projects/:id/tasks calls. */}
            <div className="relative">
                {activeSubTab === 'dashboard' && (
                    <WorkDashboard projectId={projectId} isActive />
                )}
                {activeSubTab === 'task' && (
                    <TaskTab 
                        projectId={projectId} 
                        isNew={false} 
                        onAutoSaveProject={isNew ? onAutoSaveProject : undefined}
                    />
                )}
                {activeSubTab === 'report' && (
                    <WorkReportTab projectId={projectId} isActive />
                )}
            </div>
        </div>
    );
}

