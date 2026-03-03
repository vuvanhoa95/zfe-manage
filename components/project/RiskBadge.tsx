'use client';

import React from 'react';
import { calcProjectRisk, getRiskColors, getRiskLabel, type RiskLevel } from '@/lib/ai/project-risk';

interface RiskBadgeProps {
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    totalTasks: number;
    doneTasks: number;
    size?: 'sm' | 'md';
    showLabel?: boolean;
}

export default function RiskBadge({
    startDate,
    endDate,
    totalTasks,
    doneTasks,
    size = 'sm',
    showLabel = true,
}: RiskBadgeProps) {
    const risk = calcProjectRisk(startDate, endDate, totalTasks, doneTasks);
    const colors = getRiskColors(risk.level);
    const label = getRiskLabel(risk.level);

    if (risk.level === 'NA' && totalTasks === 0) return null;

    return (
        <span
            title={risk.tooltip}
            className={`
                inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap
                ${colors.bg} ${colors.text} ${colors.border}
                ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
            `}
        >
            <span className={`rounded-full flex-shrink-0 ${colors.dot} ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
            {showLabel ? label.replace(/^[🟢🟡🔴⚫]\s/, '') : ''}
        </span>
    );
}

/** Chỉ trả về risk level để dùng ở nơi khác */
export function useRiskLevel(
    startDate?: string | Date | null,
    endDate?: string | Date | null,
    totalTasks = 0,
    doneTasks = 0,
): RiskLevel {
    return calcProjectRisk(startDate, endDate, totalTasks, doneTasks).level;
}
