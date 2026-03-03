'use client';

/**
 * AITaskGenerator v4 — Direct Checklist Flow
 *
 * Step 1: PROJECT CONTEXT — Chọn nhanh loại CT + phạm vi BIM bằng chips (không bắt buộc)
 * Step 2: AI CHECKLIST   — Hiện NGAY checklist task theo gợi ý (offline template),
 *                          user tick chọn / bỏ chọn từng task & subtask
 * Step 3: IMPORT         — Tạo tasks đã chọn vào DB
 */

import React, { useState, useMemo } from 'react';
import { Wand2, X, ChevronDown, ChevronRight, Check, Loader2, RefreshCw } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaskTemplate {
    id: string;
    phase: string;           // Giai đoạn
    title: string;
    discipline: string;      // ARC | STR | MEP | CIV | ALL
    priority: string;        // HIGH | MEDIUM | LOW
    estimatedDays: number;
    subtasks: SubTaskTemplate[];
    tags: string[];          // Dùng để filter theo loại CT / phạm vi BIM
}

interface SubTaskTemplate {
    id: string;
    title: string;
    discipline: string;
    estimatedDays: number;
}

interface AITaskGeneratorProps {
    projectId: string;
    projectName?: string;
    projectDescription?: string;
    projectLocation?: string;
    totalArea?: number;
    onTasksImported: () => void;
    onClose: () => void;
}

// ─── BIM Task Template Library ────────────────────────────────────────────────

const TASK_TEMPLATES: TaskTemplate[] = [
    {
        id: 'survey', phase: 'Khảo sát', title: 'Khảo sát hiện trạng & Thu thập tài liệu',
        discipline: 'ALL', priority: 'HIGH', estimatedDays: 5,
        tags: ['all'],
        subtasks: [
            { id: 's1', title: 'Khảo sát thực địa, chụp ảnh hiện trạng', discipline: 'ALL', estimatedDays: 2 },
            { id: 's2', title: 'Thu thập hồ sơ pháp lý, bản vẽ quy hoạch', discipline: 'ALL', estimatedDays: 1 },
            { id: 's3', title: 'Lập BIM Execution Plan (BEP)', discipline: 'ALL', estimatedDays: 2 },
        ],
    },
    {
        id: 'arc-sd', phase: 'Thiết kế Kiến trúc', title: 'BIM Kiến trúc — Thiết kế cơ sở (SD)',
        discipline: 'ARC', priority: 'HIGH', estimatedDays: 14,
        tags: ['ARC', 'housing', 'office', 'resort', 'hospital', 'all'],
        subtasks: [
            { id: 's4', title: 'Mô hình tổng mặt bằng & phân khu chức năng', discipline: 'ARC', estimatedDays: 3 },
            { id: 's5', title: 'Mô hình mặt bằng tầng điển hình', discipline: 'ARC', estimatedDays: 5 },
            { id: 's6', title: 'Mô hình mặt đứng, mặt cắt', discipline: 'ARC', estimatedDays: 4 },
            { id: 's7', title: 'LOD 200 — Kiểm tra tỉ lệ & không gian', discipline: 'ARC', estimatedDays: 2 },
        ],
    },
    {
        id: 'arc-dd', phase: 'Thiết kế Kiến trúc', title: 'BIM Kiến trúc — Thiết kế kỹ thuật (DD)',
        discipline: 'ARC', priority: 'HIGH', estimatedDays: 20,
        tags: ['ARC', 'housing', 'office', 'resort', 'all'],
        subtasks: [
            { id: 's8', title: 'Chi tiết kiến trúc LOD 300', discipline: 'ARC', estimatedDays: 8 },
            { id: 's9', title: 'Hoàn thiện bề mặt, vật liệu, màu sắc', discipline: 'ARC', estimatedDays: 5 },
            { id: 's10', title: 'Lập Bảng thống kê vật tư từ BIM', discipline: 'ARC', estimatedDays: 4 },
            { id: 's11', title: 'Kiểm tra sự phù hợp với quy chuẩn PCCC', discipline: 'ARC', estimatedDays: 3 },
        ],
    },
    {
        id: 'str', phase: 'Thiết kế Kết cấu', title: 'BIM Kết cấu — Mô hình hóa & Phân tích',
        discipline: 'STR', priority: 'HIGH', estimatedDays: 18,
        tags: ['STR', 'housing', 'office', 'industry', 'all'],
        subtasks: [
            { id: 's12', title: 'Mô hình kết cấu móng, cọc, đài', discipline: 'STR', estimatedDays: 5 },
            { id: 's13', title: 'Mô hình cột, dầm, sàn bê tông', discipline: 'STR', estimatedDays: 6 },
            { id: 's14', title: 'Mô hình khung thép (nếu có)', discipline: 'STR', estimatedDays: 4 },
            { id: 's15', title: 'Liên kết Revit ↔ ETABS / SAP2000', discipline: 'STR', estimatedDays: 3 },
        ],
    },
    {
        id: 'mep', phase: 'Thiết kế MEP', title: 'BIM Cơ Điện — Hệ thống MEP',
        discipline: 'MEP', priority: 'MEDIUM', estimatedDays: 20,
        tags: ['MEP', 'office', 'resort', 'hospital', 'all'],
        subtasks: [
            { id: 's16', title: 'Hệ thống điện (cấp điện, chiếu sáng, phòng chống sét)', discipline: 'MEP', estimatedDays: 5 },
            { id: 's17', title: 'Hệ thống cấp thoát nước sinh hoạt', discipline: 'MEP', estimatedDays: 5 },
            { id: 's18', title: 'Hệ thống HVAC (điều hòa, thông gió)', discipline: 'MEP', estimatedDays: 5 },
            { id: 's19', title: 'Hệ thống PCCC (sprinkler, họng nước chữa cháy)', discipline: 'MEP', estimatedDays: 5 },
        ],
    },
    {
        id: 'civ', phase: 'Hạ tầng & Cảnh quan', title: 'BIM Hạ tầng — San nền, Đường, Cảnh quan',
        discipline: 'CIV', priority: 'MEDIUM', estimatedDays: 12,
        tags: ['CIV', 'industry', 'resort', 'all'],
        subtasks: [
            { id: 's20', title: 'Mô hình địa hình số (DTM / TIN)', discipline: 'CIV', estimatedDays: 3 },
            { id: 's21', title: 'Thiết kế san nền, thoát nước mặt', discipline: 'CIV', estimatedDays: 4 },
            { id: 's22', title: 'Mô hình đường nội bộ, bãi đỗ xe', discipline: 'CIV', estimatedDays: 3 },
            { id: 's23', title: 'Mô hình hạ tầng kỹ thuật ngầm', discipline: 'CIV', estimatedDays: 2 },
        ],
    },
    {
        id: 'clash', phase: 'Phối hợp BIM', title: 'Clash Detection — Phát hiện & Giải quyết xung đột',
        discipline: 'ALL', priority: 'HIGH', estimatedDays: 10,
        tags: ['clash', 'office', 'resort', 'hospital', 'all'],
        subtasks: [
            { id: 's24', title: 'Tích hợp các model ARC + STR + MEP vào Navisworks', discipline: 'ALL', estimatedDays: 2 },
            { id: 's25', title: 'Chạy Clash Test & lọc xung đột', discipline: 'ALL', estimatedDays: 3 },
            { id: 's26', title: 'Họp phối hợp & phân phối biên bản xử lý', discipline: 'ALL', estimatedDays: 2 },
            { id: 's27', title: 'Cập nhật model sau phối hợp', discipline: 'ALL', estimatedDays: 3 },
        ],
    },
    {
        id: 'shop', phase: 'Shopdrawing', title: 'Triển khai Shopdrawing từ BIM',
        discipline: 'ALL', priority: 'HIGH', estimatedDays: 20,
        tags: ['shop', 'housing', 'office', 'resort', 'hospital', 'all'],
        subtasks: [
            { id: 's28', title: 'SD Kiến trúc: mặt bằng, mặt cắt chi tiết', discipline: 'ARC', estimatedDays: 7 },
            { id: 's29', title: 'SD Kết cấu: cốt thép, chi tiết liên kết', discipline: 'STR', estimatedDays: 7 },
            { id: 's30', title: 'SD MEP: tuyến ống, sơ đồ nguyên lý', discipline: 'MEP', estimatedDays: 6 },
        ],
    },
    {
        id: 'asbuilt', phase: 'As-built', title: 'BIM As-built — Cập nhật thực tế thi công',
        discipline: 'ALL', priority: 'MEDIUM', estimatedDays: 15,
        tags: ['asbuilt', 'housing', 'office', 'industry', 'all'],
        subtasks: [
            { id: 's31', title: 'Thu thập hoàn công từ công trường', discipline: 'ALL', estimatedDays: 3 },
            { id: 's32', title: 'Cập nhật model ARC hoàn công', discipline: 'ARC', estimatedDays: 4 },
            { id: 's33', title: 'Cập nhật model STR hoàn công', discipline: 'STR', estimatedDays: 4 },
            { id: 's34', title: 'Xuất hồ sơ BIM As-built bàn giao', discipline: 'ALL', estimatedDays: 4 },
        ],
    },
];

// ─── Constants ─────────────────────────────────────────────────────────────

const disciplineColors: Record<string, { bg: string; text: string; border: string }> = {
    ARC: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    STR: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    MEP: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    CIV: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    ALL: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
};

// Smart defaults based on keywords in project name/description
function getSmartDefaults(name = '', desc = ''): Set<string> {
    const text = (name + ' ' + desc).toLowerCase();
    const selected = new Set<string>();

    // Luôn chọn một số tasks cơ bản
    selected.add('survey');
    selected.add('arc-sd');
    selected.add('arc-dd');
    selected.add('str');
    selected.add('shop');

    if (text.includes('mep') || text.includes('cơ điện') || text.includes('điện') || text.includes('hvac')
        || text.includes('văn phòng') || text.includes('resort') || text.includes('khách sạn') || text.includes('bệnh viện')) {
        selected.add('mep');
        selected.add('clash');
    }
    if (text.includes('hạ tầng') || text.includes('cảnh quan') || text.includes('nhà máy') || text.includes('khu công nghiệp') || text.includes('resort')) {
        selected.add('civ');
    }
    if (text.includes('hoàn công') || text.includes('as-built') || text.includes('bàn giao')) {
        selected.add('asbuilt');
    }

    return selected;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AITaskGenerator({
    projectId, projectName, projectDescription, projectLocation, totalArea,
    onTasksImported, onClose,
}: AITaskGeneratorProps) {
    // Task selection state: task id → Set of subtask ids (empty set = chọn task nhưng không có subtask nào được tick)
    const smartDefaults = useMemo(() => getSmartDefaults(projectName, projectDescription), [projectName, projectDescription]);

    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(smartDefaults);
    const [selectedSubs, setSelectedSubs] = useState<Map<string, Set<string>>>(() => {
        const map = new Map<string, Set<string>>();
        TASK_TEMPLATES.forEach(t => {
            if (smartDefaults.has(t.id)) {
                map.set(t.id, new Set(t.subtasks.map(s => s.id)));
            }
        });
        return map;
    });
    const [expanded, setExpanded] = useState<Set<string>>(new Set(TASK_TEMPLATES.map(t => t.id)));
    const [step, setStep] = useState<'checklist' | 'importing' | 'done'>('checklist');
    const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

    // Group tasks by phase
    const tasksByPhase = useMemo(() => {
        const groups = new Map<string, TaskTemplate[]>();
        TASK_TEMPLATES.forEach(t => {
            if (!groups.has(t.phase)) groups.set(t.phase, []);
            groups.get(t.phase)!.push(t);
        });
        return groups;
    }, []);

    const selectedCount = selectedTasks.size;
    const totalSubsSelected = Array.from(selectedSubs.values()).reduce((acc, s) => acc + s.size, 0);

    // ─── Toggle helpers ──────────────────────────────────────────────────────

    const toggleTask = (taskId: string) => {
        const task = TASK_TEMPLATES.find(t => t.id === taskId)!;
        setSelectedTasks(prev => {
            const s = new Set(prev);
            if (s.has(taskId)) {
                s.delete(taskId);
                setSelectedSubs(sm => { const m = new Map(sm); m.delete(taskId); return m; });
            } else {
                s.add(taskId);
                // Auto-select all subtasks
                setSelectedSubs(sm => { const m = new Map(sm); m.set(taskId, new Set(task.subtasks.map(sub => sub.id))); return m; });
            }
            return s;
        });
    };

    const toggleSub = (taskId: string, subId: string) => {
        setSelectedSubs(prev => {
            const m = new Map(prev);
            const subs = new Set(m.get(taskId) || []);
            subs.has(subId) ? subs.delete(subId) : subs.add(subId);
            m.set(taskId, subs);
            // If all subs deselected → deselect parent task too
            if (subs.size === 0) {
                setSelectedTasks(st => { const s = new Set(st); s.delete(taskId); return s; });
            } else {
                setSelectedTasks(st => { const s = new Set(st); s.add(taskId); return s; });
            }
            return m;
        });
    };

    const togglePhase = (phase: string) => {
        const tasks = tasksByPhase.get(phase) || [];
        const allSelected = tasks.every(t => selectedTasks.has(t.id));
        if (allSelected) {
            // Deselect all in phase
            setSelectedTasks(prev => { const s = new Set(prev); tasks.forEach(t => s.delete(t.id)); return s; });
            setSelectedSubs(prev => { const m = new Map(prev); tasks.forEach(t => m.delete(t.id)); return m; });
        } else {
            // Select all
            setSelectedTasks(prev => { const s = new Set(prev); tasks.forEach(t => s.add(t.id)); return s; });
            setSelectedSubs(prev => {
                const m = new Map(prev);
                tasks.forEach(t => m.set(t.id, new Set(t.subtasks.map(s => s.id))));
                return m;
            });
        }
    };

    const toggleExpand = (id: string) => setExpanded(prev => {
        const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
    });

    const selectAll = () => {
        setSelectedTasks(new Set(TASK_TEMPLATES.map(t => t.id)));
        const m = new Map<string, Set<string>>();
        TASK_TEMPLATES.forEach(t => m.set(t.id, new Set(t.subtasks.map(s => s.id))));
        setSelectedSubs(m);
    };

    const deselectAll = () => {
        setSelectedTasks(new Set());
        setSelectedSubs(new Map());
    };

    // ─── Import ──────────────────────────────────────────────────────────────

    const handleImport = async () => {
        const toImport = TASK_TEMPLATES.filter(t => selectedTasks.has(t.id));
        if (toImport.length === 0) return;

        const totalOps = toImport.reduce((acc, t) => {
            const subs = selectedSubs.get(t.id);
            return acc + 1 + (subs?.size || 0);
        }, 0);

        setImportProgress({ done: 0, total: totalOps });
        setStep('importing');

        let done = 0;
        const baseUrl = `/api/projects/${projectId}/tasks`;

        for (const task of toImport) {
            const parentRes = await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: task.title,
                    description: `[${task.phase}] ${task.discipline} · ~${task.estimatedDays} ngày`,
                    discipline: task.discipline,
                    priority: task.priority,
                    status: 'TODO',
                    progress: 0,
                }),
            });
            done++;
            setImportProgress({ done, total: totalOps });

            if (!parentRes.ok) continue;
            const parentData = await parentRes.json();
            const parentId = parentData?.data?.id;

            if (parentId) {
                const selectedSubIds = selectedSubs.get(task.id) || new Set();
                const subsToCreate = task.subtasks.filter(s => selectedSubIds.has(s.id));

                for (const sub of subsToCreate) {
                    await fetch(baseUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: sub.title,
                            discipline: sub.discipline,
                            parentId,
                            priority: 'MEDIUM',
                            status: 'TODO',
                            progress: 0,
                        }),
                    });
                    done++;
                    setImportProgress({ done, total: totalOps });
                }
            }
        }

        setStep('done');
        setTimeout(() => { onTasksImported(); onClose(); }, 1200);
    };

    const DisciplineBadge = ({ d }: { d: string }) => {
        const c = disciplineColors[d] || disciplineColors.ALL;
        return (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${c.bg} ${c.text} ${c.border}`}>{d}</span>
        );
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <Wand2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">✨ AI Gợi ý Tasks BIM</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {step === 'checklist' && <>Tick chọn tasks phù hợp để tạo · <span className="text-indigo-600 font-semibold">{selectedCount} giai đoạn, {totalSubsSelected} subtasks</span></>}
                                {step === 'importing' && 'Đang tạo tasks...'}
                                {step === 'done' && '✓ Hoàn tất!'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/60 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ══════════ CHECKLIST ══════════ */}
                {step === 'checklist' && (
                    <>
                        {/* Project + Quick filters */}
                        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    📋 <strong className="text-gray-700">{projectName || 'Dự án'}</strong>
                                    {projectLocation && <> · 📍 {projectLocation}</>}
                                    {totalArea && <> · 📐 {totalArea.toLocaleString('vi-VN')} m²</>}
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={selectAll} className="text-xs text-indigo-600 hover:underline font-medium">Chọn tất cả</button>
                                    <span className="text-gray-300">|</span>
                                    <button onClick={deselectAll} className="text-xs text-gray-400 hover:underline">Bỏ chọn</button>
                                </div>
                            </div>
                            {/* Discipline legend */}
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                {Object.entries(disciplineColors).slice(0, 4).map(([d, c]) => (
                                    <span key={d} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                                        {d === 'ARC' ? '🏛 ARC Kiến trúc' : d === 'STR' ? '🏗 STR Kết cấu' : d === 'MEP' ? '⚡ MEP Cơ điện' : '🌿 CIV Hạ tầng'}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Task list grouped by phase */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                            {Array.from(tasksByPhase.entries()).map(([phase, tasks]) => {
                                const allPhaseSelected = tasks.every(t => selectedTasks.has(t.id));
                                const somePhaseSelected = tasks.some(t => selectedTasks.has(t.id));
                                const phaseExpanded = tasks.some(t => expanded.has(t.id));

                                return (
                                    <div key={phase} className="border border-gray-200 rounded-xl overflow-hidden">
                                        {/* Phase header */}
                                        <div
                                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer select-none transition-colors ${allPhaseSelected ? 'bg-indigo-50' : somePhaseSelected ? 'bg-indigo-50/40' : 'bg-gray-50'}`}
                                            onClick={() => togglePhase(phase)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={allPhaseSelected}
                                                ref={el => { if (el) el.indeterminate = somePhaseSelected && !allPhaseSelected; }}
                                                onChange={() => togglePhase(phase)}
                                                onClick={e => e.stopPropagation()}
                                                className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0"
                                            />
                                            <span className="font-semibold text-sm text-gray-800 flex-1">{phase}</span>
                                            <span className="text-xs text-gray-400">{tasks.length} tasks</span>
                                            <button
                                                type="button"
                                                onClick={e => { e.stopPropagation(); tasks.forEach(t => toggleExpand(t.id)); }}
                                                className="p-0.5 text-gray-400 hover:text-gray-600"
                                            >
                                                {phaseExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        {/* Tasks in phase */}
                                        {phaseExpanded && (
                                            <div className="divide-y divide-gray-100">
                                                {tasks.map(task => {
                                                    const isTaskSelected = selectedTasks.has(task.id);
                                                    const isExpanded = expanded.has(task.id);
                                                    const subsSelected = selectedSubs.get(task.id)?.size || 0;

                                                    return (
                                                        <div key={task.id} className={`transition-colors ${isTaskSelected ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                            {/* Task row */}
                                                            <div className="flex items-center gap-2.5 px-4 py-2.5">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isTaskSelected}
                                                                    onChange={() => toggleTask(task.id)}
                                                                    className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0 cursor-pointer"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleExpand(task.id)}
                                                                    className="flex-1 flex items-center gap-2 text-left"
                                                                >
                                                                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                                                                    <span className={`text-sm flex-1 ${isTaskSelected ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                                                        {task.title}
                                                                    </span>
                                                                </button>
                                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                    <DisciplineBadge d={task.discipline} />
                                                                    <span className="text-[10px] text-gray-400">~{task.estimatedDays}d</span>
                                                                    {isTaskSelected && task.subtasks.length > 0 && (
                                                                        <span className="text-[10px] text-indigo-500 font-semibold">{subsSelected}/{task.subtasks.length} sub</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Subtasks */}
                                                            {isExpanded && task.subtasks.length > 0 && (
                                                                <div className="pl-10 pr-4 pb-2.5 space-y-1">
                                                                    {task.subtasks.map(sub => {
                                                                        const isSubSelected = selectedSubs.get(task.id)?.has(sub.id) ?? false;
                                                                        return (
                                                                            <label
                                                                                key={sub.id}
                                                                                className={`flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer transition-colors ${isSubSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isSubSelected}
                                                                                    onChange={() => toggleSub(task.id, sub.id)}
                                                                                    className="w-3.5 h-3.5 rounded accent-indigo-500 flex-shrink-0"
                                                                                />
                                                                                <span className={`text-xs flex-1 ${isSubSelected ? 'text-gray-800' : 'text-gray-400'}`}>
                                                                                    {sub.title}
                                                                                </span>
                                                                                <DisciplineBadge d={sub.discipline} />
                                                                                <span className="text-[10px] text-gray-400">{sub.estimatedDays}d</span>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-shrink-0">
                            <div className="text-sm text-gray-600">
                                Đã chọn <strong className="text-indigo-700">{selectedCount} giai đoạn</strong> · <strong className="text-indigo-700">{totalSubsSelected} subtasks</strong>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">
                                    Hủy
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={selectedCount === 0}
                                    className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
                                >
                                    <Check className="w-4 h-4" />
                                    Tạo {selectedCount} giai đoạn + {totalSubsSelected} subtasks
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ══════════ IMPORTING ══════════ */}
                {step === 'importing' && (
                    <div className="flex-1 flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                        <p className="font-semibold text-gray-700 mb-3">Đang tạo {importProgress.total} tasks...</p>
                        <div className="w-56 bg-gray-200 rounded-full h-2.5 mb-2">
                            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${importProgress.total > 0 ? Math.round((importProgress.done / importProgress.total) * 100) : 0}%` }} />
                        </div>
                        <p className="text-sm text-gray-400">{importProgress.done} / {importProgress.total}</p>
                    </div>
                )}

                {/* ══════════ DONE ══════════ */}
                {step === 'done' && (
                    <div className="flex-1 flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-emerald-600" />
                        </div>
                        <p className="text-lg font-semibold text-gray-800">Tạo tasks hoàn tất!</p>
                        <p className="text-sm text-gray-500 mt-1">Đang chuyển sang danh sách công việc...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
