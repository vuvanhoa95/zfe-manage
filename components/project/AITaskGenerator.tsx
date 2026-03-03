'use client';

/**
 * AITaskGenerator v5 — 2 Tab + AI Chat
 *
 * Tab 1: 📐 BIM Tasks   — Template checklist, AI auto-tick theo dự án
 * Tab 2: 🏢 Quản lý nội bộ — Template + mini AI chat để thêm tasks tự do
 *
 * Sau khi chọn xong cả 2 tab → Import tất cả vào DB
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Wand2, X, ChevronDown, ChevronRight, Check, Loader2, Send, Plus, Trash2 } from 'lucide-react';

// Helper: đọc companyCode từ AI settings
function getCompanyCode(): string {
    try {
        const s = localStorage.getItem('ai_settings');
        if (s) return JSON.parse(s)?.companyCode || 'ZFE';
    } catch {}
    return 'ZFE';
}

// Helper: clean project number thành ISO code (PRJ-2026-0001 → PRJ20260001)
function toIsoCode(projectNo?: string): string {
    if (!projectNo) return 'PRJ0001';
    return projectNo.replace(/-/g, '');
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaskItem {
    id: string;
    title: string;
    description?: string;
    discipline: string;
    priority: string;
    estimatedDays: number;
    subtasks: SubItem[];
    phase?: string;
    source?: 'template' | 'ai';
}

interface SubItem {
    id: string;
    title: string;
    discipline: string;
    estimatedDays: number;
}

interface AITaskGeneratorProps {
    projectId: string;
    projectName?: string;
    projectNo?: string;          // Mã dự án (VD: PRJ-2026-0001)
    projectDescription?: string;
    projectLocation?: string;
    totalArea?: number;
    onTasksImported: () => void;
    onClose: () => void;
}

// ─── BIM Task Templates ───────────────────────────────────────────────────────

const BIM_TEMPLATES: TaskItem[] = [
    {
        id: 'bim-survey', phase: 'Khảo sát', title: 'Khảo sát hiện trạng & Thu thập tài liệu',
        discipline: 'ALL', priority: 'HIGH', estimatedDays: 5, source: 'template',
        subtasks: [
            { id: 'b-s1', title: 'Khảo sát thực địa, chụp ảnh hiện trạng', discipline: 'ALL', estimatedDays: 2 },
            { id: 'b-s2', title: 'Thu thập hồ sơ pháp lý, bản vẽ quy hoạch', discipline: 'ALL', estimatedDays: 1 },
            { id: 'b-s3', title: 'Lập BIM Execution Plan (BEP)', discipline: 'ALL', estimatedDays: 2 },
        ],
    },
    {
        id: 'bim-arc-sd', phase: 'Thiết kế Kiến trúc', title: 'BIM Kiến trúc — Thiết kế cơ sở (SD)',
        discipline: 'ARC', priority: 'HIGH', estimatedDays: 14, source: 'template',
        subtasks: [
            { id: 'b-s4', title: 'Mô hình tổng mặt bằng & phân khu chức năng', discipline: 'ARC', estimatedDays: 3 },
            { id: 'b-s5', title: 'Mô hình mặt bằng tầng điển hình', discipline: 'ARC', estimatedDays: 5 },
            { id: 'b-s6', title: 'Mô hình mặt đứng, mặt cắt', discipline: 'ARC', estimatedDays: 4 },
            { id: 'b-s7', title: 'LOD 200 — Kiểm tra tỉ lệ & không gian', discipline: 'ARC', estimatedDays: 2 },
        ],
    },
    {
        id: 'bim-arc-dd', phase: 'Thiết kế Kiến trúc', title: 'BIM Kiến trúc — Thiết kế kỹ thuật (DD)',
        discipline: 'ARC', priority: 'HIGH', estimatedDays: 20, source: 'template',
        subtasks: [
            { id: 'b-s8', title: 'Chi tiết kiến trúc LOD 300', discipline: 'ARC', estimatedDays: 8 },
            { id: 'b-s9', title: 'Hoàn thiện bề mặt, vật liệu, màu sắc', discipline: 'ARC', estimatedDays: 5 },
            { id: 'b-s10', title: 'Lập Bảng thống kê vật tư từ BIM', discipline: 'ARC', estimatedDays: 4 },
            { id: 'b-s11', title: 'Kiểm tra PCCC theo quy chuẩn', discipline: 'ARC', estimatedDays: 3 },
        ],
    },
    {
        id: 'bim-str', phase: 'Thiết kế Kết cấu', title: 'BIM Kết cấu — Mô hình hóa & Phân tích',
        discipline: 'STR', priority: 'HIGH', estimatedDays: 18, source: 'template',
        subtasks: [
            { id: 'b-s12', title: 'Mô hình kết cấu móng, cọc, đài', discipline: 'STR', estimatedDays: 5 },
            { id: 'b-s13', title: 'Mô hình cột, dầm, sàn bê tông', discipline: 'STR', estimatedDays: 6 },
            { id: 'b-s14', title: 'Mô hình khung thép (nếu có)', discipline: 'STR', estimatedDays: 4 },
            { id: 'b-s15', title: 'Liên kết mô hình với phần mềm tính toán', discipline: 'STR', estimatedDays: 3 },
        ],
    },
    {
        id: 'bim-mep', phase: 'Thiết kế MEP', title: 'BIM Cơ Điện — Hệ thống MEP',
        discipline: 'MEP', priority: 'MEDIUM', estimatedDays: 20, source: 'template',
        subtasks: [
            { id: 'b-s16', title: 'Hệ thống điện (cấp điện, chiếu sáng)', discipline: 'MEP', estimatedDays: 5 },
            { id: 'b-s17', title: 'Hệ thống cấp thoát nước sinh hoạt', discipline: 'MEP', estimatedDays: 5 },
            { id: 'b-s18', title: 'Hệ thống HVAC (điều hòa, thông gió)', discipline: 'MEP', estimatedDays: 5 },
            { id: 'b-s19', title: 'Hệ thống PCCC (sprinkler, chữa cháy)', discipline: 'MEP', estimatedDays: 5 },
        ],
    },
    {
        id: 'bim-civ', phase: 'Hạ tầng & Cảnh quan', title: 'BIM Hạ tầng — San nền & Đường nội bộ',
        discipline: 'CIV', priority: 'MEDIUM', estimatedDays: 12, source: 'template',
        subtasks: [
            { id: 'b-s20', title: 'Mô hình địa hình số (DTM)', discipline: 'CIV', estimatedDays: 3 },
            { id: 'b-s21', title: 'Thiết kế san nền, thoát nước mặt', discipline: 'CIV', estimatedDays: 4 },
            { id: 'b-s22', title: 'Mô hình đường nội bộ, bãi đỗ xe', discipline: 'CIV', estimatedDays: 3 },
            { id: 'b-s23', title: 'Mô hình hạ tầng kỹ thuật ngầm', discipline: 'CIV', estimatedDays: 2 },
        ],
    },
    {
        id: 'bim-clash', phase: 'Phối hợp BIM', title: 'Clash Detection — Phát hiện & Giải quyết xung đột',
        discipline: 'ALL', priority: 'HIGH', estimatedDays: 10, source: 'template',
        subtasks: [
            { id: 'b-s24', title: 'Tích hợp model ARC + STR + MEP vào Navisworks', discipline: 'ALL', estimatedDays: 2 },
            { id: 'b-s25', title: 'Chạy Clash Test & lọc xung đột', discipline: 'ALL', estimatedDays: 3 },
            { id: 'b-s26', title: 'Họp phối hợp & phân phối biên bản xử lý', discipline: 'ALL', estimatedDays: 2 },
            { id: 'b-s27', title: 'Cập nhật model sau phối hợp', discipline: 'ALL', estimatedDays: 3 },
        ],
    },
    {
        id: 'bim-shop', phase: 'Shopdrawing', title: 'Triển khai Shopdrawing từ BIM',
        discipline: 'ALL', priority: 'HIGH', estimatedDays: 20, source: 'template',
        subtasks: [
            { id: 'b-s28', title: 'SD Kiến trúc: mặt bằng, mặt cắt chi tiết', discipline: 'ARC', estimatedDays: 7 },
            { id: 'b-s29', title: 'SD Kết cấu: cốt thép, chi tiết liên kết', discipline: 'STR', estimatedDays: 7 },
            { id: 'b-s30', title: 'SD MEP: tuyến ống, sơ đồ nguyên lý', discipline: 'MEP', estimatedDays: 6 },
        ],
    },
    {
        id: 'bim-asbuilt', phase: 'As-built', title: 'BIM As-built — Cập nhật thực tế thi công',
        discipline: 'ALL', priority: 'MEDIUM', estimatedDays: 15, source: 'template',
        subtasks: [
            { id: 'b-s31', title: 'Thu thập hoàn công từ công trường', discipline: 'ALL', estimatedDays: 3 },
            { id: 'b-s32', title: 'Cập nhật model ARC + STR hoàn công', discipline: 'ARC', estimatedDays: 8 },
            { id: 'b-s33', title: 'Xuất hồ sơ BIM As-built bàn giao', discipline: 'ALL', estimatedDays: 4 },
        ],
    },
];

// ─── Internal Management Templates ───────────────────────────────────────────

const MGMT_TEMPLATES: TaskItem[] = [
    {
        id: 'mgmt-contract', phase: 'Hợp đồng', title: 'Ký kết hợp đồng & Khởi động dự án',
        discipline: 'ALL', priority: 'HIGH', estimatedDays: 5, source: 'template',
        subtasks: [
            { id: 'm-s1', title: 'Soạn thảo & review hợp đồng dịch vụ BIM', discipline: 'ALL', estimatedDays: 2 },
            { id: 'm-s2', title: 'Ký hợp đồng và thu phí khởi động', discipline: 'ALL', estimatedDays: 1 },
            { id: 'm-s3', title: 'Kick-off meeting với khách hàng', discipline: 'ALL', estimatedDays: 1 },
            { id: 'm-s4', title: 'Phân công nhân sự nội bộ', discipline: 'ALL', estimatedDays: 1 },
        ],
    },
    {
        id: 'mgmt-meeting', phase: 'Họp & Báo cáo', title: 'Họp tiến độ định kỳ & Báo cáo',
        discipline: 'ALL', priority: 'MEDIUM', estimatedDays: 3, source: 'template',
        subtasks: [
            { id: 'm-s5', title: 'Họp nội bộ hàng tuần kiểm tra tiến độ', discipline: 'ALL', estimatedDays: 1 },
            { id: 'm-s6', title: 'Họp với khách hàng định kỳ 2 tuần/lần', discipline: 'ALL', estimatedDays: 1 },
            { id: 'm-s7', title: 'Lập báo cáo tiến độ hàng tháng', discipline: 'ALL', estimatedDays: 1 },
        ],
    },
    {
        id: 'mgmt-review', phase: 'Kiểm tra & Nghiệm thu', title: 'Review chất lượng & Nghiệm thu nội bộ',
        discipline: 'ALL', priority: 'HIGH', estimatedDays: 5, source: 'template',
        subtasks: [
            { id: 'm-s8', title: 'QC nội bộ trước khi giao khách hàng', discipline: 'ALL', estimatedDays: 2 },
            { id: 'm-s9', title: 'Họp nghiệm thu với khách hàng', discipline: 'ALL', estimatedDays: 1 },
            { id: 'm-s10', title: 'Xử lý góp ý và bổ sung', discipline: 'ALL', estimatedDays: 2 },
        ],
    },
    {
        id: 'mgmt-invoice', phase: 'Thanh toán', title: 'Lập & Theo dõi thanh toán',
        discipline: 'ALL', priority: 'HIGH', estimatedDays: 2, source: 'template',
        subtasks: [
            { id: 'm-s11', title: 'Lập hóa đơn theo đợt thanh toán hợp đồng', discipline: 'ALL', estimatedDays: 1 },
            { id: 'm-s12', title: 'Theo dõi & nhắc nhở thanh toán', discipline: 'ALL', estimatedDays: 1 },
        ],
    },
    {
        id: 'mgmt-handover', phase: 'Bàn giao', title: 'Bàn giao hồ sơ & Kết thúc dự án',
        discipline: 'ALL', priority: 'HIGH', estimatedDays: 3, source: 'template',
        subtasks: [
            { id: 'm-s13', title: 'Đóng gói hồ sơ bàn giao đầy đủ', discipline: 'ALL', estimatedDays: 1 },
            { id: 'm-s14', title: 'Ký biên bản bàn giao và nghiệm thu hoàn thành', discipline: 'ALL', estimatedDays: 1 },
            { id: 'm-s15', title: 'Thanh lý hợp đồng & lưu trữ hồ sơ', discipline: 'ALL', estimatedDays: 1 },
        ],
    },
];

// ─── Style helpers ────────────────────────────────────────────────────────────

const disciplineColors: Record<string, string> = {
    ARC: 'bg-orange-100 text-orange-700 border-orange-200',
    STR: 'bg-blue-100 text-blue-700 border-blue-200',
    MEP: 'bg-green-100 text-green-700 border-green-200',
    CIV: 'bg-purple-100 text-purple-700 border-purple-200',
    ALL: 'bg-gray-100 text-gray-600 border-gray-200',
};

function getSmartBimDefaults(name = '', desc = ''): Set<string> {
    const text = (name + ' ' + desc).toLowerCase();
    const sel = new Set(['bim-survey', 'bim-arc-sd', 'bim-arc-dd', 'bim-str', 'bim-shop']);
    if (text.includes('mep') || text.includes('văn phòng') || text.includes('resort') || text.includes('bệnh viện')) {
        sel.add('bim-mep'); sel.add('bim-clash');
    }
    if (text.includes('nhà máy') || text.includes('khu công nghiệp') || text.includes('hạ tầng')) sel.add('bim-civ');
    if (text.includes('hoàn công') || text.includes('as-built')) sel.add('bim-asbuilt');
    return sel;
}

// ─── Reusable ChecklistPanel ──────────────────────────────────────────────────

function ChecklistPanel({
    templates, selectedTasks, selectedSubs, expanded,
    onToggleTask, onToggleSub, onToggleExpand, onToggleGroup,
    isDuplicate = () => false,
}: {
    templates: TaskItem[];
    selectedTasks: Set<string>;
    selectedSubs: Map<string, Set<string>>;
    expanded: Set<string>;
    onToggleTask: (id: string) => void;
    onToggleSub: (taskId: string, subId: string) => void;
    onToggleExpand: (id: string) => void;
    onToggleGroup: (phase: string) => void;
    isDuplicate?: (title: string) => boolean;
}) {
    // Group by phase
    const byPhase = useMemo(() => {
        const m = new Map<string, TaskItem[]>();
        templates.forEach(t => { if (!m.has(t.phase!)) m.set(t.phase!, []); m.get(t.phase!)!.push(t); });
        return m;
    }, [templates]);

    // Đánh số thứ tự toàn bộ tasks (1, 2, 3...)
    const taskIndexMap = useMemo(() => {
        const m = new Map<string, number>();
        let idx = 1;
        templates.forEach(t => { m.set(t.id, idx++); });
        return m;
    }, [templates]);

    const DisciplineBadge = ({ d }: { d: string }) => (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${disciplineColors[d] || disciplineColors.ALL}`}>{d}</span>
    );


    return (
        <div className="space-y-1.5">
            {Array.from(byPhase.entries()).map(([phase, tasks]) => {
                const allSel = tasks.every(t => selectedTasks.has(t.id));
                const someSel = tasks.some(t => selectedTasks.has(t.id));
                const phaseExp = tasks.some(t => expanded.has(t.id));

                return (
                    <div key={phase} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Phase header */}
                        <div
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer select-none ${allSel ? 'bg-indigo-50' : someSel ? 'bg-indigo-50/30' : 'bg-gray-50'}`}
                            onClick={() => onToggleGroup(phase)}
                        >
                            <input type="checkbox" checked={allSel}
                                ref={el => { if (el) el.indeterminate = someSel && !allSel; }}
                                onChange={() => onToggleGroup(phase)}
                                onClick={e => e.stopPropagation()}
                                className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0"
                            />
                            <span className="font-semibold text-sm text-gray-800 flex-1">{phase}</span>
                            <span className="text-xs text-gray-400">{tasks.length} tasks</span>
                            <button type="button" onClick={e => { e.stopPropagation(); tasks.forEach(t => onToggleExpand(t.id)); }}
                                className="p-0.5 text-gray-400">
                                {phaseExp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>

                        {phaseExp && (
                            <div className="divide-y divide-gray-100">
                                {tasks.map(task => {
                                    const isSel = selectedTasks.has(task.id);
                                    const isExp = expanded.has(task.id);
                                    const subsSel = selectedSubs.get(task.id)?.size || 0;
                                    return (
                                        <div key={task.id} className={isSel ? 'bg-white' : 'bg-gray-50/50'}>
                                            <div className="flex items-center gap-2.5 px-4 py-2.5">
                                                <input type="checkbox" checked={isSel} onChange={() => onToggleTask(task.id)}
                                                    className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0 cursor-pointer" />
                                                     <button type="button" onClick={() => onToggleExpand(task.id)} className="flex-1 flex items-center gap-2 text-left">
                                                    {isExp ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                                                    <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded flex-shrink-0 ${isSel ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                        {taskIndexMap.get(task.id)}
                                                    </span>
                                                    <span className={`text-sm flex-1 ${isSel ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{task.title}</span>
                                                    {isDuplicate(task.title) && (
                                                        <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap flex-shrink-0">
                                                            ⚠️ Đã tồn tại
                                                        </span>
                                                    )}
                                                </button>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <DisciplineBadge d={task.discipline} />
                                                    <span className="text-[10px] text-gray-400">~{task.estimatedDays}d</span>
                                                    {isSel && task.subtasks.length > 0 && (
                                                        <span className="text-[10px] text-indigo-500 font-semibold">{subsSel}/{task.subtasks.length}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {isExp && task.subtasks.length > 0 && (
                                                <div className="pl-10 pr-4 pb-2.5 space-y-1">
                                                    {task.subtasks.map(sub => {
                                                        const isSubSel = selectedSubs.get(task.id)?.has(sub.id) ?? false;
                                                        return (
                                                            <label key={sub.id} className={`flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer ${isSubSel ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                                                                <input type="checkbox" checked={isSubSel} onChange={() => onToggleSub(task.id, sub.id)}
                                                                    className="w-3.5 h-3.5 rounded accent-indigo-500" />
                                                                <span className={`text-xs flex-1 ${isSubSel ? 'text-gray-800' : 'text-gray-400'}`}>{sub.title}</span>
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
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AITaskGenerator({
    projectId, projectName, projectNo, projectDescription, projectLocation, totalArea,
    onTasksImported, onClose,
}: AITaskGeneratorProps) {
    const [activeTab, setActiveTab] = useState<'bim' | 'mgmt'>('bim');
    const [step, setStep] = useState<'select' | 'importing' | 'done'>('select');
    const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

    // ISO 19650 naming
    const [companyCode, setCompanyCode] = useState('ZFE');
    const isoProjectCode = toIsoCode(projectNo);
    useEffect(() => {
        setCompanyCode(getCompanyCode());
    }, []);

    // Save companyCode khi thay đổi
    const updateCompanyCode = (code: string) => {
        const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
        setCompanyCode(clean);
        try {
            const s = JSON.parse(localStorage.getItem('ai_settings') || '{}');
            localStorage.setItem('ai_settings', JSON.stringify({ ...s, companyCode: clean }));
        } catch {}
    };

    // Fetch existing tasks để detect duplicate
    const [existingTitles, setExistingTitles] = useState<Set<string>>(new Set());
    useEffect(() => {
        fetch(`/api/projects/${projectId}/tasks?limit=200`)
            .then(r => r.json())
            .then(d => {
                const titles = new Set<string>(
                    (d?.data || d?.tasks || []).map((t: { title: string }) => t.title.toLowerCase().trim())
                );
                setExistingTitles(titles);
            })
            .catch(() => {});
    }, [projectId]);

    const isDuplicate = (title: string) => existingTitles.has(title.toLowerCase().trim());

    // BIM checklist state
    const bimDefaults = useMemo(() => getSmartBimDefaults(projectName, projectDescription), [projectName, projectDescription]);
    const [bimSelected, setBimSelected] = useState<Set<string>>(bimDefaults);
    const [bimSubs, setBimSubs] = useState<Map<string, Set<string>>>(() => {
        const m = new Map<string, Set<string>>();
        BIM_TEMPLATES.forEach(t => { if (bimDefaults.has(t.id)) m.set(t.id, new Set(t.subtasks.map(s => s.id))); });
        return m;
    });
    const [bimExpanded, setBimExpanded] = useState<Set<string>>(new Set(BIM_TEMPLATES.map(t => t.id)));

    // BIM AI chat (tạo tasks chi tiết theo tầng, ISO 19650)
    const [bimChatInput, setBimChatInput] = useState('');
    const [bimChatLoading, setBimChatLoading] = useState(false);
    const [bimAiTasks, setBimAiTasks] = useState<TaskItem[]>([]);
    const [bimAiSelected, setBimAiSelected] = useState<Set<string>>(new Set());
    const bimChatRef = useRef<HTMLInputElement>(null);

    // Mgmt checklist state
    const mgmtDefaults = new Set(['mgmt-contract', 'mgmt-meeting', 'mgmt-review', 'mgmt-invoice', 'mgmt-handover']);
    const [mgmtSelected, setMgmtSelected] = useState<Set<string>>(mgmtDefaults);
    const [mgmtSubs, setMgmtSubs] = useState<Map<string, Set<string>>>(() => {
        const m = new Map<string, Set<string>>();
        MGMT_TEMPLATES.forEach(t => { if (mgmtDefaults.has(t.id)) m.set(t.id, new Set(t.subtasks.map(s => s.id))); });
        return m;
    });
    const [mgmtExpanded, setMgmtExpanded] = useState<Set<string>>(new Set(MGMT_TEMPLATES.map(t => t.id)));

    // AI chat for extra tasks (mgmt tab)
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [aiExtraTasks, setAiExtraTasks] = useState<TaskItem[]>([]);
    const [aiExtraSelected, setAiExtraSelected] = useState<Set<string>>(new Set());
    const inputRef = useRef<HTMLInputElement>(null);


    const totalBimSel = bimSelected.size + (bimAiSelected.size > 0 ? 1 : 0);
    const totalMgmtSel = mgmtSelected.size + aiExtraSelected.size;
    const totalSubs = [
        ...Array.from(bimSubs.values()),
        ...Array.from(mgmtSubs.values()),
    ].reduce((a, s) => a + s.size, 0);
    const totalAiExtraSubs = aiExtraTasks.filter(t => aiExtraSelected.has(t.id)).reduce((a, t) => a + t.subtasks.length, 0);

    // Tổng ngày dự kiến
    const totalEstDays = [
        ...BIM_TEMPLATES.filter(t => bimSelected.has(t.id)),
        ...bimAiTasks.filter(t => bimAiSelected.has(t.id)),
        ...MGMT_TEMPLATES.filter(t => mgmtSelected.has(t.id)),
        ...aiExtraTasks.filter(t => aiExtraSelected.has(t.id)),
    ].reduce((a, t) => a + t.estimatedDays, 0);

    // Số task bị duplicate
    const dupCount = [
        ...BIM_TEMPLATES.filter(t => bimSelected.has(t.id) && isDuplicate(t.title)),
        ...MGMT_TEMPLATES.filter(t => mgmtSelected.has(t.id) && isDuplicate(t.title)),
    ].length;

    // ─── Toggle helpers (BIM) ────────────────────────────────────────────────

    const makeToggler = (
        setSelected: React.Dispatch<React.SetStateAction<Set<string>>>,
        setSubs: React.Dispatch<React.SetStateAction<Map<string, Set<string>>>>,
        templates: TaskItem[],
    ) => ({
        toggleTask: (id: string) => {
            const task = templates.find(t => t.id === id)!;
            setSelected(prev => {
                const s = new Set(prev);
                if (s.has(id)) { s.delete(id); setSubs(m => { const mm = new Map(m); mm.delete(id); return mm; }); }
                else { s.add(id); setSubs(m => { const mm = new Map(m); mm.set(id, new Set(task.subtasks.map(sub => sub.id))); return mm; }); }
                return s;
            });
        },
        toggleSub: (taskId: string, subId: string) => {
            setSubs(prev => {
                const m = new Map(prev);
                const subs = new Set(m.get(taskId) || []);
                subs.has(subId) ? subs.delete(subId) : subs.add(subId);
                m.set(taskId, subs);
                if (subs.size === 0) setSelected(st => { const s = new Set(st); s.delete(taskId); return s; });
                else setSelected(st => { const s = new Set(st); s.add(taskId); return s; });
                return m;
            });
        },
        toggleGroup: (phase: string) => {
            const tasks = templates.filter(t => t.phase === phase);
            const allSel = tasks.every(t => {
                let sel = false;
                setSelected(s => { sel = s.has(t.id); return s; });
                return sel;
            });
            // Simple approach: check current state
            setSelected(prev => {
                const allSelected = tasks.every(t => prev.has(t.id));
                const s = new Set(prev);
                setSubs(sm => {
                    const m = new Map(sm);
                    if (allSelected) { tasks.forEach(t => { s.delete(t.id); m.delete(t.id); }); }
                    else { tasks.forEach(t => { s.add(t.id); m.set(t.id, new Set(t.subtasks.map(sub => sub.id))); }); }
                    return m;
                });
                if (tasks.every(t => s.has(t.id))) tasks.forEach(t => s.delete(t.id));
                else tasks.forEach(t => s.add(t.id));
                return s;
            });
        },
    });

    // Better toggle group using functional approach
    const toggleBimGroup = (phase: string) => {
        const tasks = BIM_TEMPLATES.filter(t => t.phase === phase);
        setBimSelected(prev => {
            const allSel = tasks.every(t => prev.has(t.id));
            const s = new Set(prev);
            setBimSubs(sm => {
                const m = new Map(sm);
                if (allSel) { tasks.forEach(t => { s.delete(t.id); m.delete(t.id); }); }
                else { tasks.forEach(t => { s.add(t.id); m.set(t.id, new Set(t.subtasks.map(sub => sub.id))); }); }
                return m;
            });
            return s;
        });
    };

    const toggleMgmtGroup = (phase: string) => {
        const tasks = MGMT_TEMPLATES.filter(t => t.phase === phase);
        setMgmtSelected(prev => {
            const allSel = tasks.every(t => prev.has(t.id));
            const s = new Set(prev);
            setMgmtSubs(sm => {
                const m = new Map(sm);
                if (allSel) { tasks.forEach(t => { s.delete(t.id); m.delete(t.id); }); }
                else { tasks.forEach(t => { s.add(t.id); m.set(t.id, new Set(t.subtasks.map(sub => sub.id))); }); }
                return m;
            });
            return s;
        });
    };

    const bimTogglers = {
        toggleTask: (id: string) => {
            const task = BIM_TEMPLATES.find(t => t.id === id)!;
            setBimSelected(prev => { const s = new Set(prev); if (s.has(id)) { s.delete(id); setBimSubs(m => { const mm = new Map(m); mm.delete(id); return mm; }); } else { s.add(id); setBimSubs(m => { const mm = new Map(m); mm.set(id, new Set(task.subtasks.map(sub => sub.id))); return mm; }); } return s; });
        },
        toggleSub: (taskId: string, subId: string) => {
            setBimSubs(prev => { const m = new Map(prev); const subs = new Set(m.get(taskId) || []); subs.has(subId) ? subs.delete(subId) : subs.add(subId); m.set(taskId, subs); if (subs.size === 0) setBimSelected(st => { const s = new Set(st); s.delete(taskId); return s; }); else setBimSelected(st => { const s = new Set(st); s.add(taskId); return s; }); return m; });
        },
    };

    const mgmtTogglers = {
        toggleTask: (id: string) => {
            const task = MGMT_TEMPLATES.find(t => t.id === id)!;
            setMgmtSelected(prev => { const s = new Set(prev); if (s.has(id)) { s.delete(id); setMgmtSubs(m => { const mm = new Map(m); mm.delete(id); return mm; }); } else { s.add(id); setMgmtSubs(m => { const mm = new Map(m); mm.set(id, new Set(task.subtasks.map(sub => sub.id))); return mm; }); } return s; });
        },
        toggleSub: (taskId: string, subId: string) => {
            setMgmtSubs(prev => { const m = new Map(prev); const subs = new Set(m.get(taskId) || []); subs.has(subId) ? subs.delete(subId) : subs.add(subId); m.set(taskId, subs); if (subs.size === 0) setMgmtSelected(st => { const s = new Set(st); s.delete(taskId); return s; }); else setMgmtSelected(st => { const s = new Set(st); s.add(taskId); return s; }); return m; });
        },
    };

    // ─── AI Chat cho BIM Tasks (ISO 19650) ──────────────────────────────────

    const BIM_QUICK_PROMPTS = [
        'Tạo tasks model kết cấu theo tầng: 01BS, 01FL, 02-05FL, RF',
        'Tạo tasks model kiến trúc theo tầng: 01BS, 01FL, 02MZ, 03-10FL',
        'Tạo tasks model MEP theo hệ thống: cấp điện, thoát nước, HVAC, PCCC',
        'Tạo tasks Shopdrawing kết cấu theo tầng',
        'Tạo tasks Coordination/Clash Detection từng tầng',
    ];

    const bimSystemPrompt = `Bạn là BIM Manager với kinh nghiệm đặt tên file theo ISO 19650.
Thông tin dự án:
- Tên: ${projectName || 'Dự án BIM'}
- Mã dự án ISO: ${isoProjectCode}
- Mã công ty: ${companyCode}

Quy tắc đặt tên file BIM (ISO 19650):
Format: {CompanyCode}_{ProjectCode}_{Discipline}_{Level/Zone}
Discipline codes: ARCH (kiến trúc), STRU (kết cấu), MECH (cơ), ELEC (điện), PLUM (cấp thoát nước), FIRE (PCCC)
Level codes: 01BS (tầng hầm 1), 02BS (tầng hầm 2), 01FL (tầng 1), 02FL (tầng 2), 02-05FL (tầng 2 đến 5), RF (mái)

Ví dụ: ${companyCode}_${isoProjectCode}_STRU_01BS, ${companyCode}_${isoProjectCode}_ARCH_02-05FL

Khi user nhắn tên tầng hoặc hệ thống, tạo 1 task cha (tổng hợp) + subtasks với tên file ISO 19650.
Trả về JSON: [{"title":"Tên task cha","description":"...","priority":"HIGH|MEDIUM|LOW","estimatedDays":N,"subtasks":[{"title":"${companyCode}_${isoProjectCode}_STRU_01BS — Mô hình kết cấu tầng hầm 1","estimatedDays":5}]}]
KHÔNG markdown, KHÔNG giải thích, chỉ JSON.`;

    const sendBimChat = async (msg: string) => {
        if (!msg.trim() || bimChatLoading) return;
        setBimChatLoading(true);
        setBimChatInput('');

        try {
            const res = await fetch('/api/ai/task-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: msg }],
                    systemPrompt: bimSystemPrompt,
                }),
            });
            const data = await res.json();
            const raw = (data.message || '').trim()
                .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

            const parsed: any[] = JSON.parse(raw);
            if (!Array.isArray(parsed)) throw new Error();

            const newTasks: TaskItem[] = parsed.map((t, i) => ({
                id: `bim-ai-${Date.now()}-${i}`,
                title: t.title,
                description: t.description,
                discipline: 'ALL',
                priority: t.priority || 'HIGH',
                estimatedDays: t.estimatedDays || 5,
                phase: 'AI Tạo thêm',
                source: 'ai' as const,
                subtasks: (t.subtasks || []).map((s: any, j: number) => ({
                    id: `bim-ai-sub-${Date.now()}-${i}-${j}`,
                    title: s.title,
                    discipline: 'ALL',
                    estimatedDays: s.estimatedDays || 2,
                })),
            }));

            setBimAiTasks(prev => [...prev, ...newTasks]);
            setBimAiSelected(prev => { const s = new Set(prev); newTasks.forEach(t => s.add(t.id)); return s; });
        } catch {
            // fail silently
        } finally {
            setBimChatLoading(false);
            bimChatRef.current?.focus();
        }
    };

    // ─── AI Chat to add extra mgmt tasks ────────────────────────────────────

    const QUICK_PROMPTS = [
        'Thêm task xin cấp phép xây dựng',
        'Thêm task đàm phán báo giá outsource',
        'Thêm task kiểm tra & phê duyệt thiết kế từ chủ đầu tư',
        'Thêm task onboarding nhân sự mới cho dự án',
        'Thêm task backup & lưu trữ file BIM định kỳ',
    ];

    const systemPrompt = `Bạn là quản lý dự án BIM. Dựa trên yêu cầu user, tạo 1-3 task quản lý nội bộ cho dự án "${projectName || 'BIM'}".
Trả về JSON: [{"title":"...","description":"...","priority":"HIGH|MEDIUM|LOW","estimatedDays":N,"subtasks":[{"title":"...","estimatedDays":N}]}]
KHÔNG markdown, KHÔNG giải thích, chỉ JSON.`;


    const sendChat = async (msg: string) => {
        if (!msg.trim() || chatLoading) return;
        setChatLoading(true);
        setChatInput('');

        try {
            const res = await fetch('/api/ai/task-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: msg }],
                    systemPrompt,
                }),
            });
            const data = await res.json();
            const raw = (data.message || '').trim()
                .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

            const parsed: any[] = JSON.parse(raw);
            if (!Array.isArray(parsed)) throw new Error();

            const newTasks: TaskItem[] = parsed.map((t, i) => ({
                id: `ai-extra-${Date.now()}-${i}`,
                title: t.title,
                description: t.description,
                discipline: 'ALL',
                priority: t.priority || 'MEDIUM',
                estimatedDays: t.estimatedDays || 3,
                phase: 'AI Tạo thêm',
                source: 'ai',
                subtasks: (t.subtasks || []).map((s: any, j: number) => ({
                    id: `ai-sub-${Date.now()}-${i}-${j}`,
                    title: s.title,
                    discipline: 'ALL',
                    estimatedDays: s.estimatedDays || 1,
                })),
            }));

            setAiExtraTasks(prev => [...prev, ...newTasks]);
            setAiExtraSelected(prev => { const s = new Set(prev); newTasks.forEach(t => s.add(t.id)); return s; });
        } catch {
            // fail silently - user can retry
        } finally {
            setChatLoading(false);
            inputRef.current?.focus();
        }
    };

    // ─── Import ──────────────────────────────────────────────────────────────

    const handleImport = async () => {
        const bimTasks = BIM_TEMPLATES.filter(t => bimSelected.has(t.id));
        const bimAiTasksToCreate = bimAiTasks.filter(t => bimAiSelected.has(t.id));
        const mgmtTasks = MGMT_TEMPLATES.filter(t => mgmtSelected.has(t.id));
        const extraTasks = aiExtraTasks.filter(t => aiExtraSelected.has(t.id));
        const allTasks = [...bimTasks, ...bimAiTasksToCreate, ...mgmtTasks, ...extraTasks];
        if (allTasks.length === 0) return;


        const totalOps = allTasks.reduce((acc, task) => {
            const subsMap = bimSelected.has(task.id) ? bimSubs : mgmtSelected.has(task.id) ? mgmtSubs : null;
            const subCount = subsMap ? (subsMap.get(task.id)?.size || 0) : task.subtasks.length;
            return acc + 1 + subCount;
        }, 0);

        setImportProgress({ done: 0, total: totalOps });
        setStep('importing');

        let done = 0;
        const baseUrl = `/api/projects/${projectId}/tasks`;

        for (const task of allTasks) {
            const parentRes = await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: task.title,
                    description: task.description || (task.phase ? `[${task.phase}]` : null),
                    discipline: task.discipline,
                    priority: task.priority,
                    status: 'TODO',
                    progress: 0,
                }),
            });
            done++;
            setImportProgress({ done, total: totalOps });
            if (!parentRes.ok) continue;

            const parentId = (await parentRes.json())?.data?.id;
            if (!parentId) continue;

            const subsMap = bimSelected.has(task.id) ? bimSubs : mgmtSelected.has(task.id) ? mgmtSubs : null;
            const subsToCreate = subsMap
                ? task.subtasks.filter(s => subsMap.get(task.id)?.has(s.id))
                : task.subtasks; // AI tasks: tạo tất cả subtasks

            for (const sub of subsToCreate) {
                await fetch(baseUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: sub.title, discipline: sub.discipline, parentId, priority: 'MEDIUM', status: 'TODO', progress: 0 }),
                });
                done++;
                setImportProgress({ done, total: totalOps });
            }
        }

        setStep('done');
        setTimeout(() => { onTasksImported(); onClose(); }, 1200);
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50 flex-shrink-0">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Wand2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-base font-bold text-gray-900">✨ AI Tạo Tasks BIM</h2>
                                {/* Mini settings: Company Code */}
                                <div className="flex items-center gap-1.5 bg-white/80 border border-indigo-200 rounded-lg px-2 py-0.5">
                                    <span className="text-[10px] text-indigo-500 font-semibold">Mã CT:</span>
                                    <input
                                        type="text" value={companyCode}
                                        onChange={e => updateCompanyCode(e.target.value)}
                                        maxLength={5}
                                        className="w-14 text-xs font-mono font-bold text-indigo-700 bg-transparent outline-none uppercase"
                                        title="Mã công ty ISO 19650 (VD: ZFE)"
                                    />
                                </div>
                                <span className="text-[10px] font-mono text-gray-400 bg-white/60 px-2 py-0.5 rounded-lg">{companyCode}_{isoProjectCode}_...</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                {step === 'select' && (
                                    <>
                                        <span className="text-xs text-gray-500">Đã chọn <strong className="text-indigo-600">{totalBimSel + totalMgmtSel}</strong> nhóm · <strong className="text-indigo-600">{totalSubs + totalAiExtraSubs}</strong> subtasks · <strong className="text-amber-600">~{totalEstDays} ngày</strong></span>
                                        {dupCount > 0 && (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full font-semibold">⚠️ {dupCount} task trùng tên</span>
                                        )}
                                    </>
                                )}
                                {step === 'importing' && <span className="text-xs text-gray-500">Đang tạo tasks...</span>}
                                {step === 'done' && <span className="text-xs text-emerald-600 font-semibold">✓ Hoàn tất!</span>}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/60 flex-shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {step === 'select' && (
                    <>
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 flex-shrink-0">
                            <button type="button" onClick={() => setActiveTab('bim')}
                                className={`flex-1 py-2.5 text-sm font-semibold transition-colors relative ${activeTab === 'bim' ? 'text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
                                📐 BIM Tasks
                                {activeTab === 'bim' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t" />}
                                {totalBimSel > 0 && <span className="ml-1.5 text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">{totalBimSel}</span>}
                            </button>
                            <button type="button" onClick={() => setActiveTab('mgmt')}
                                className={`flex-1 py-2.5 text-sm font-semibold transition-colors relative ${activeTab === 'mgmt' ? 'text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>
                                🏢 Quản lý nội bộ
                                {activeTab === 'mgmt' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-t" />}
                                {totalMgmtSel > 0 && <span className="ml-1.5 text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded-full">{totalMgmtSel}</span>}
                            </button>
                        </div>

                        {/* Project info */}
                        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                            <p className="text-xs text-gray-500">
                                📋 <strong className="text-gray-700">{projectName || 'Dự án'}</strong>
                                {projectLocation && <> · 📍 {projectLocation}</>}
                                {totalArea && <> · 📐 {totalArea.toLocaleString('vi-VN')} m²</>}
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => {
                                    const sel = activeTab === 'bim' ? setBimSelected : setMgmtSelected;
                                    const templates = activeTab === 'bim' ? BIM_TEMPLATES : MGMT_TEMPLATES;
                                    const selSubs = activeTab === 'bim' ? setBimSubs : setMgmtSubs;
                                    sel(new Set(templates.map(t => t.id)));
                                    const m = new Map<string, Set<string>>();
                                    templates.forEach(t => m.set(t.id, new Set(t.subtasks.map(s => s.id))));
                                    selSubs(m);
                                }} className="text-xs text-indigo-600 hover:underline font-medium">Tất cả</button>
                                <span className="text-gray-300">|</span>
                                <button onClick={() => {
                                    if (activeTab === 'bim') { setBimSelected(new Set()); setBimSubs(new Map()); }
                                    else { setMgmtSelected(new Set()); setMgmtSubs(new Map()); }
                                }} className="text-xs text-gray-400 hover:underline">Bỏ chọn</button>
                            </div>
                        </div>

                        {/* Tab content */}
                        <div className="flex-1 overflow-y-auto p-3 min-h-0">
                            {activeTab === 'bim' && (
                                <div className="space-y-3">
                                    {/* Template checklist */}
                                    <ChecklistPanel
                                        templates={BIM_TEMPLATES}
                                        selectedTasks={bimSelected} selectedSubs={bimSubs} expanded={bimExpanded}
                                        onToggleTask={bimTogglers.toggleTask} onToggleSub={bimTogglers.toggleSub}
                                        onToggleExpand={id => setBimExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; })}
                                        onToggleGroup={toggleBimGroup}
                                        isDuplicate={isDuplicate}
                                    />

                                    {/* AI mô hình chi tiết theo tầng (ISO 19650) */}
                                    {bimAiTasks.length > 0 && (
                                        <div className="border border-indigo-200 rounded-xl overflow-hidden">
                                            <div className="px-3 py-2 bg-indigo-50 flex items-center gap-2">
                                                <span className="text-xs font-semibold text-indigo-700 flex-1">🏷️ AI ISO 19650 Tasks ({bimAiTasks.length})</span>
                                                <span className="text-[10px] text-indigo-500 font-mono">{companyCode}_{isoProjectCode}_...</span>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {bimAiTasks.map(task => (
                                                    <div key={task.id} className="px-4 py-2.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <input type="checkbox" checked={bimAiSelected.has(task.id)}
                                                                onChange={() => setBimAiSelected(prev => { const s = new Set(prev); s.has(task.id) ? s.delete(task.id) : s.add(task.id); return s; })}
                                                                className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-800">{task.title}</p>
                                                                {task.subtasks.length > 0 && (
                                                                    <div className="mt-1 space-y-0.5">
                                                                        {task.subtasks.map(sub => (
                                                                            <p key={sub.id} className="text-xs text-indigo-600 font-mono truncate">↳ {sub.title}</p>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button type="button" onClick={() => setBimAiTasks(prev => prev.filter(t => t.id !== task.id))}
                                                                className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* BIM AI Chat — ISO 19650 naming */}
                                    <div className="border border-dashed border-indigo-200 rounded-xl p-3 bg-indigo-50/40">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-semibold text-indigo-700">🤖 Chat với AI — tạo tasks chi tiết theo tầng / bộ môn</p>
                                            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-100 px-2 py-0.5 rounded-full">{companyCode}_{isoProjectCode}_STRU_01FL</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {BIM_QUICK_PROMPTS.map((p, i) => (
                                                <button key={i} type="button" onClick={() => { setBimChatInput(p); setTimeout(() => bimChatRef.current?.focus(), 50); }} disabled={bimChatLoading}
                                                    className="text-xs px-2.5 py-1 rounded-full border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-100 disabled:opacity-50 transition-colors">
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input ref={bimChatRef} type="text" value={bimChatInput} onChange={e => setBimChatInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && sendBimChat(bimChatInput)}
                                                placeholder='VD: "Tạo tasks kết cấu tầng: B2, B1, 01FL, 02-15FL, RF"'
                                                disabled={bimChatLoading}
                                                className="flex-1 px-3 py-1.5 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white disabled:opacity-60" />
                                            <button type="button" onClick={() => sendBimChat(bimChatInput)}
                                                disabled={!bimChatInput.trim() || bimChatLoading}
                                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-1.5 text-xs font-semibold">
                                                {bimChatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> Tạo</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}


                            {activeTab === 'mgmt' && (
                                <div className="space-y-3">
                                    {/* Template checklist */}
                                    <ChecklistPanel
                                        templates={MGMT_TEMPLATES}
                                        selectedTasks={mgmtSelected} selectedSubs={mgmtSubs} expanded={mgmtExpanded}
                                        onToggleTask={mgmtTogglers.toggleTask} onToggleSub={mgmtTogglers.toggleSub}
                                        onToggleExpand={id => setMgmtExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; })}
                                        onToggleGroup={toggleMgmtGroup}
                                        isDuplicate={isDuplicate}
                                    />

                                    {/* AI generated extras */}
                                    {aiExtraTasks.length > 0 && (
                                        <div className="border border-purple-200 rounded-xl overflow-hidden">
                                            <div className="px-3 py-2 bg-purple-50 flex items-center gap-2">
                                                <span className="text-xs font-semibold text-purple-700 flex-1">✨ AI tạo thêm ({aiExtraTasks.length})</span>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {aiExtraTasks.map(task => (
                                                    <div key={task.id} className="flex items-center gap-2.5 px-4 py-2.5">
                                                        <input type="checkbox" checked={aiExtraSelected.has(task.id)}
                                                            onChange={() => setAiExtraSelected(prev => { const s = new Set(prev); s.has(task.id) ? s.delete(task.id) : s.add(task.id); return s; })}
                                                            className="w-4 h-4 rounded accent-purple-600 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-800">{task.title}</p>
                                                            {task.subtasks.length > 0 && (
                                                                <p className="text-xs text-gray-400">{task.subtasks.length} subtasks</p>
                                                            )}
                                                        </div>
                                                        <button type="button" onClick={() => setAiExtraTasks(prev => prev.filter(t => t.id !== task.id))}
                                                            className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Chat box */}
                                    <div className="border border-dashed border-purple-200 rounded-xl p-3 bg-purple-50/40">
                                        <p className="text-xs font-semibold text-purple-700 mb-2">💬 Chat với AI để thêm tasks quản lý khác</p>
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {QUICK_PROMPTS.map((p, i) => (
                                                <button key={i} type="button" onClick={() => { setChatInput(p); setTimeout(() => inputRef.current?.focus(), 50); }} disabled={chatLoading}
                                                    className="text-xs px-2.5 py-1 rounded-full border border-purple-200 text-purple-700 bg-white hover:bg-purple-100 disabled:opacity-50 transition-colors">
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input ref={inputRef} type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && sendChat(chatInput)}
                                                placeholder="Mô tả task cần thêm..." disabled={chatLoading}
                                                className="flex-1 px-3 py-1.5 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white disabled:opacity-60" />
                                            <button type="button" onClick={() => sendChat(chatInput)}
                                                disabled={!chatInput.trim() || chatLoading}
                                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 flex items-center gap-1.5 text-xs font-semibold">
                                                {chatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> Thêm</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-shrink-0">
                            <div className="text-sm text-gray-600">
                                <span className="text-indigo-600 font-semibold">{totalBimSel}</span> BIM + <span className="text-purple-600 font-semibold">{totalMgmtSel}</span> quản lý
                                <span className="text-gray-400 ml-1">· {totalSubs + totalAiExtraSubs} subtasks</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">Hủy</button>
                                <button onClick={handleImport} disabled={totalBimSel + totalMgmtSel === 0}
                                    className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-40 shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all">
                                    <Check className="w-4 h-4" />
                                    Tạo {totalBimSel + totalMgmtSel} giai đoạn
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* IMPORTING */}
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

                {/* DONE */}
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
