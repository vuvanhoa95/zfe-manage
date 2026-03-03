/**
 * lib/ai/project-risk.ts
 * Phase 04: Deadline Risk Detector
 * Tính toán thuần túy — KHÔNG cần AI API call
 */

export type RiskLevel = 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'OVERDUE' | 'NA';

export interface RiskResult {
    level: RiskLevel;
    timeElapsedPct: number;   // % thời gian đã trôi qua
    tasksDonePct: number;     // % task đã hoàn thành
    riskRatio: number;        // >1 = chậm so với deadline
    tooltip: string;
}

/**
 * Tính Risk Score từ task data và thời gian dự án
 */
export function calcProjectRisk(
    startDate: Date | string | null | undefined,
    endDate: Date | string | null | undefined,
    totalTasks: number,
    doneTasks: number,
): RiskResult {
    const NA: RiskResult = {
        level: 'NA',
        timeElapsedPct: 0,
        tasksDonePct: 0,
        riskRatio: 0,
        tooltip: 'Chưa đủ dữ liệu để đánh giá tiến độ',
    };

    if (!startDate || !endDate || totalTasks === 0) return NA;

    const now = Date.now();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (isNaN(start) || isNaN(end) || end <= start) return NA;

    // Dự án chưa bắt đầu
    if (now < start) return NA;

    const tasksDonePct = Math.round((doneTasks / totalTasks) * 100);

    // Dự án đã qua deadline
    if (now >= end) {
        const level: RiskLevel = doneTasks >= totalTasks ? 'ON_TRACK' : 'OVERDUE';
        return {
            level,
            timeElapsedPct: 100,
            tasksDonePct,
            riskRatio: 999,
            tooltip: doneTasks >= totalTasks
                ? 'Hoàn thành đúng tiến độ'
                : `Quá hạn! Còn ${totalTasks - doneTasks} task chưa xong`,
        };
    }

    const timeElapsedPct = Math.round(((now - start) / (end - start)) * 100);
    const timeElapsedRatio = (now - start) / (end - start);  // 0→1
    const tasksDoneRatio = doneTasks / totalTasks;             // 0→1

    // riskRatio: thời gian đã qua / công việc đã làm
    // = 1.0 → đúng tiến độ, > 1.0 → chậm, < 1.0 → nhanh hơn
    let riskRatio: number;
    if (tasksDoneRatio === 0) {
        riskRatio = timeElapsedRatio > 0.15 ? 2.0 : 0;  // Chưa làm gì nhưng đã qua 15% thời gian
    } else {
        riskRatio = timeElapsedRatio / tasksDoneRatio;
    }

    let level: RiskLevel;
    let tooltip: string;

    if (riskRatio < 1.0) {
        level = 'ON_TRACK';
        tooltip = `Đang đúng tiến độ — đã qua ${timeElapsedPct}% thời gian, hoàn thành ${tasksDonePct}% công việc`;
    } else if (riskRatio < 1.35) {
        level = 'AT_RISK';
        tooltip = `Có nguy cơ trễ — đã qua ${timeElapsedPct}% thời gian nhưng mới hoàn thành ${tasksDonePct}% công việc`;
    } else {
        level = 'BEHIND';
        tooltip = `Đang trễ tiến độ — đã qua ${timeElapsedPct}% thời gian nhưng chỉ hoàn thành ${tasksDonePct}% công việc`;
    }

    return { level, timeElapsedPct, tasksDonePct, riskRatio, tooltip };
}

/** Màu sắc theo risk level */
export function getRiskColors(level: RiskLevel) {
    const map: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
        ON_TRACK: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
        AT_RISK:  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500' },
        BEHIND:   { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500' },
        OVERDUE:  { bg: 'bg-red-100',    text: 'text-red-800',     border: 'border-red-300',     dot: 'bg-red-600' },
        NA:       { bg: 'bg-gray-50',    text: 'text-gray-500',    border: 'border-gray-200',    dot: 'bg-gray-400' },
    };
    return map[level];
}

/** Label tiếng Việt ngắn */
export function getRiskLabel(level: RiskLevel) {
    const map: Record<RiskLevel, string> = {
        ON_TRACK: '🟢 Đúng tiến độ',
        AT_RISK:  '🟡 Nguy cơ trễ',
        BEHIND:   '🔴 Đang trễ',
        OVERDUE:  '🔴 Quá hạn',
        NA:       '⚫ Chưa có dữ liệu',
    };
    return map[level];
}
