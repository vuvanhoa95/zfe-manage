'use client';

/**
 * AITaskGenerator v3 — Guided Wizard Flow
 *
 * AI tự phân tích thông tin đã có → hỏi đúng những gì còn thiếu
 * → Mỗi câu hỏi kèm chips gợi ý để click chọn → không cần gõ nhiều
 *
 * Step 1: WIZARD  → AI hỏi từng câu, user click chip hoặc gõ tự do
 * Step 2: PREVIEW → AI generate tasks phù hợp, user tick chọn
 * Step 3: IMPORT  → Lưu vào DB với progress bar
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    Wand2, X, ChevronDown, ChevronRight, Check,
    Loader2, ArrowRight, MessageSquare, RefreshCw,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface WizardAnswer {
    question: string;
    answer: string;
}

interface GeneratedSubTask {
    title: string;
    discipline?: string;
    estimatedDays?: number;
}

interface GeneratedTask {
    title: string;
    description?: string;
    phase?: string;
    discipline?: string;
    priority?: string;
    estimatedDays?: number;
    subtasks?: GeneratedSubTask[];
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

// ─── Smart Questions ──────────────────────────────────────────────────────────
// Mỗi câu hỏi có chips gợi ý để user click chọn

interface SmartQuestion {
    key: string;
    question: string;
    chips: string[];         // Gợi ý click nhanh
    freeInput?: boolean;     // Cho phép tự gõ thêm
    placeholder?: string;
    skipIf?: (info: ProjectInfo) => boolean; // Bỏ qua nếu đã có thông tin
}

interface ProjectInfo {
    name?: string;
    description?: string;
    location?: string;
    totalArea?: number;
}

function buildQuestions(info: ProjectInfo): SmartQuestion[] {
    return [
        {
            key: 'buildingType',
            question: '🏗️ Loại công trình này là gì?',
            chips: [
                'Nhà ở, biệt thự, nhà phố',
                'Căn hộ chung cư, cao tầng',
                'Resort, khách sạn',
                'Văn phòng, tòa nhà thương mại',
                'Trung tâm thương mại',
                'Nhà máy, kho xưởng công nghiệp',
                'Công trình hạ tầng, cầu đường',
                'Bệnh viện, trường học',
            ],
            freeInput: true,
            placeholder: 'Hoặc nhập loại công trình khác...',
        },
        {
            key: 'bimScope',
            question: '📐 Phạm vi BIM cần thực hiện?',
            chips: [
                'BIM 3D - Đủ cả ARC + STR + MEP',
                'Chỉ BIM kiến trúc (ARC)',
                'Chỉ BIM kết cấu (STR)',
                'ARC + STR (không MEP)',
                'ARC + STR + MEP + CIV (đầy đủ)',
                'BIM phối hợp + phát hiện xung đột',
            ],
        },
        {
            key: 'deliverables',
            question: '📦 Sản phẩm bàn giao cuối cùng?',
            chips: [
                'Model BIM LOD 200 (thiết kế cơ sở)',
                'Model BIM LOD 300 (thiết kế chi tiết)',
                'Model + Shopdrawing đầy đủ',
                'Model + Shopdrawing + As-built',
                'Chỉ bản vẽ 2D từ BIM',
                'Báo cáo phối hợp (Clash Detection)',
            ],
        },
        {
            key: 'timeline',
            question: '⏱️ Timeline thực hiện dự kiến?',
            chips: [
                '1-2 tháng (dự án nhỏ)',
                '3-6 tháng',
                '6-12 tháng',
                'Trên 12 tháng (dự án lớn)',
                'Chưa xác định',
            ],
        },
        {
            key: 'special',
            question: '⭐ Yêu cầu đặc biệt nào không?',
            chips: [
                'Không có yêu cầu đặc biệt',
                'Cần BIM Execution Plan (BEP)',
                'Phối hợp với nhiều đơn vị thiết kế',
                'Export IFC để tích hợp phần mềm khác',
                'Cần họp phối hợp định kỳ hàng tuần',
                'Dự án có vốn đầu tư nước ngoài (tiêu chuẩn quốc tế)',
            ],
            freeInput: true,
            placeholder: 'Hoặc bổ sung yêu cầu khác...',
        },
    ];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const disciplineColors: Record<string, string> = {
    ARC: 'bg-orange-100 text-orange-700',
    STR: 'bg-blue-100 text-blue-700',
    MEP: 'bg-green-100 text-green-700',
    CIV: 'bg-purple-100 text-purple-700',
    ALL: 'bg-gray-100 text-gray-600',
};

const priorityColors: Record<string, string> = {
    HIGH: 'text-red-600',
    MEDIUM: 'text-amber-600',
    LOW: 'text-green-600',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function AITaskGenerator({
    projectId,
    projectName,
    projectDescription,
    projectLocation,
    totalArea,
    onTasksImported,
    onClose,
}: AITaskGeneratorProps) {
    const projectInfo: ProjectInfo = { name: projectName, description: projectDescription, location: projectLocation, totalArea };
    const questions = buildQuestions(projectInfo);

    const [step, setStep] = useState<'wizard' | 'generating' | 'preview' | 'importing' | 'done'>('wizard');
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<WizardAnswer[]>([]);
    const [freeInput, setFreeInput] = useState('');
    const [selectedChip, setSelectedChip] = useState<string | null>(null);

    // preview/import
    const [tasks, setTasks] = useState<GeneratedTask[]>([]);
    const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

    const inputRef = useRef<HTMLInputElement>(null);
    const summaryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelectedChip(null);
        setFreeInput('');
        inputRef.current?.focus();
    }, [currentQ]);

    const curQuestion = questions[currentQ];
    const isLastQ = currentQ === questions.length - 1;

    // ─── Answer a question ───────────────────────────────────────────────────

    const submitAnswer = (answer: string) => {
        if (!answer.trim()) return;
        const newAnswers = [...answers, { question: curQuestion.question, answer: answer.trim() }];
        setAnswers(newAnswers);

        if (isLastQ) {
            generateTasks(newAnswers);
        } else {
            setCurrentQ(prev => prev + 1);
        }
    };

    const handleChipClick = (chip: string) => {
        setSelectedChip(chip);
        // Nếu không có free input → submit luôn
        if (!curQuestion.freeInput) {
            submitAnswer(chip);
        }
    };

    const handleSubmitWithOptionalFreeInput = () => {
        const base = selectedChip || '';
        const extra = freeInput.trim();
        const final = extra ? (base ? `${base}; ${extra}` : extra) : base;
        if (final) submitAnswer(final);
    };

    // ─── Generate tasks từ answers ───────────────────────────────────────────

    const generateTasks = async (finalAnswers: WizardAnswer[]) => {
        setStep('generating');
        setError(null);

        const context = finalAnswers
            .map(a => `${a.question}\n→ ${a.answer}`)
            .join('\n\n');

        try {
            const res = await fetch('/api/ai/generate-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectName,
                    description: projectDescription,
                    location: projectLocation,
                    totalArea,
                    chatContext: context,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi tạo tasks');

            const newTasks: GeneratedTask[] = data.tasks || [];
            setTasks(newTasks);
            setSelectedTasks(new Set(newTasks.map((_, i) => i)));
            setExpanded(new Set(newTasks.map((_, i) => i)));
            setStep('preview');
        } catch (err: any) {
            setError(err.message || 'Không thể tạo tasks');
            setStep('wizard');
        }
    };

    const handleRestart = () => {
        setAnswers([]);
        setCurrentQ(0);
        setFreeInput('');
        setSelectedChip(null);
        setError(null);
        setStep('wizard');
    };

    // ─── Import ──────────────────────────────────────────────────────────────

    const handleImport = async () => {
        const toImport = tasks.filter((_, i) => selectedTasks.has(i));
        if (toImport.length === 0) return;

        const totalOps = toImport.reduce((acc, t) => acc + 1 + (t.subtasks?.length || 0), 0);
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
                    description: task.description || null,
                    phase: task.phase || null,
                    discipline: task.discipline || null,
                    priority: task.priority || 'MEDIUM',
                    status: 'TODO',
                    progress: 0,
                }),
            });
            done++;
            setImportProgress({ done, total: totalOps });

            if (!parentRes.ok) continue;
            const parentData = await parentRes.json();
            const parentId = parentData?.data?.id;

            if (parentId && task.subtasks?.length) {
                for (const sub of task.subtasks) {
                    await fetch(baseUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: sub.title,
                            discipline: sub.discipline || null,
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
        setTimeout(() => { onTasksImported(); onClose(); }, 1500);
    };

    const toggleTask = (idx: number) => setSelectedTasks(prev => {
        const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s;
    });
    const toggleExpand = (idx: number) => setExpanded(prev => {
        const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s;
    });

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <Wand2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">✨ AI Tạo Tasks BIM</h2>
                            {/* Progress dots */}
                            <div className="flex items-center gap-1 mt-1">
                                {step === 'wizard' && questions.map((_, i) => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                                        i < currentQ ? 'bg-indigo-600 w-4' :
                                        i === currentQ ? 'bg-indigo-400 w-3' :
                                        'bg-gray-200 w-2'
                                    }`} />
                                ))}
                                {step !== 'wizard' && (
                                    <span className="text-xs text-indigo-600 font-semibold">
                                        {step === 'generating' ? 'Đang tạo tasks...' :
                                         step === 'preview' ? 'Xem & chọn tasks' :
                                         step === 'importing' ? 'Đang lưu...' : 'Hoàn tất!'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ══════════ WIZARD ══════════ */}
                {step === 'wizard' && (
                    <>
                        {/* Project info bar */}
                        <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-600/8 to-blue-600/5 border-b border-indigo-100 flex-shrink-0">
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                                <span>📋 <strong className="text-gray-800">{projectName || 'Dự án chưa đặt tên'}</strong></span>
                                {projectLocation && <span>📍 {projectLocation}</span>}
                                {totalArea && <span>📐 {totalArea.toLocaleString('vi-VN')} m²</span>}
                                {projectDescription && (
                                    <span className="truncate max-w-xs opacity-70">💬 {projectDescription}</span>
                                )}
                            </div>
                        </div>

                        {/* Answers so far (mini timeline) */}
                        {answers.length > 0 && (
                            <div ref={summaryRef} className="px-4 pt-3 flex-shrink-0">
                                <div className="space-y-1.5">
                                    {answers.map((a, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs">
                                            <span className="text-indigo-400 flex-shrink-0 mt-0.5">✓</span>
                                            <span className="text-gray-500 flex-shrink-0">{a.question.replace(/^[^\s]+ /, '')}</span>
                                            <span className="font-semibold text-gray-700 ml-auto text-right">{a.answer}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-dashed border-gray-200 mt-3" />
                            </div>
                        )}

                        {/* Current question */}
                        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                                        Câu {currentQ + 1}/{questions.length}
                                    </span>
                                </div>
                                <p className="text-base font-semibold text-gray-900 leading-snug">
                                    {curQuestion.question}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Click chọn hoặc tự nhập bên dưới</p>
                            </div>

                            {/* Chips */}
                            <div className="flex flex-wrap gap-2">
                                {curQuestion.chips.map((chip, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleChipClick(chip)}
                                        className={`px-3 py-2 text-sm rounded-xl border transition-all duration-150 text-left ${
                                            selectedChip === chip
                                                ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                                        }`}
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>

                            {/* Free input (optional) */}
                            {curQuestion.freeInput && (
                                <div className="mt-3">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={freeInput}
                                        onChange={e => setFreeInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSubmitWithOptionalFreeInput()}
                                        placeholder={curQuestion.placeholder || 'Nhập thêm nếu cần...'}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                                    />
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="mt-3 flex items-center gap-2 bg-red-50 text-red-700 text-xs px-3 py-2 rounded-xl">
                                    ⚠️ {error}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                {currentQ > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => { setCurrentQ(prev => prev - 1); setAnswers(prev => prev.slice(0, -1)); }}
                                        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        ← Quay lại
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Skip câu hỏi */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newAnswers = [...answers, { question: curQuestion.question, answer: 'Không yêu cầu cụ thể' }];
                                        setAnswers(newAnswers);
                                        if (isLastQ) generateTasks(newAnswers);
                                        else setCurrentQ(prev => prev + 1);
                                    }}
                                    className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Bỏ qua
                                </button>

                                {/* Nút tiếp / tạo tasks */}
                                {curQuestion.freeInput ? (
                                    <button
                                        type="button"
                                        onClick={handleSubmitWithOptionalFreeInput}
                                        disabled={!selectedChip && !freeInput.trim()}
                                        className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors flex items-center gap-2"
                                    >
                                        {isLastQ ? (
                                            <><Wand2 className="w-4 h-4" /> Tạo Tasks ngay</>
                                        ) : (
                                            <>Tiếp theo <ArrowRight className="w-4 h-4" /></>
                                        )}
                                    </button>
                                ) : (
                                    // Non-freeInput: chip click đã submit luôn, nút này chỉ submit nếu đã chọn chip
                                    selectedChip && curQuestion.freeInput === undefined && (
                                        <div className="text-xs text-indigo-500 italic">Tự động chuyển câu tiếp...</div>
                                    )
                                )}

                                {/* Nút Tạo luôn không cần trả lời hết */}
                                {!isLastQ && (
                                    <button
                                        type="button"
                                        onClick={() => generateTasks(answers)}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                                    >
                                        <Wand2 className="w-3.5 h-3.5" /> Tạo luôn
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ══════════ GENERATING ══════════ */}
                {step === 'generating' && (
                    <div className="flex-1 flex flex-col items-center justify-center py-16">
                        <div className="relative mb-6">
                            <Loader2 className="w-14 h-14 text-indigo-600 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Wand2 className="w-5 h-5 text-indigo-400" />
                            </div>
                        </div>
                        <p className="text-base font-semibold text-gray-700">AI đang tạo danh sách tasks...</p>
                        <p className="text-sm text-gray-400 mt-2">Dựa trên {answers.length} thông tin bạn đã cung cấp</p>
                        {/* Summary chips */}
                        <div className="flex flex-wrap gap-1.5 mt-4 max-w-sm justify-center">
                            {answers.map((a, i) => (
                                <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">{a.answer}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══════════ PREVIEW ══════════ */}
                {step === 'preview' && (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 min-h-0">
                            {/* Summary */}
                            <div className="mb-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                <p className="text-xs font-semibold text-indigo-700 mb-1.5">📋 Tạo dựa trên:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {answers.map((a, i) => (
                                        <span key={i} className="text-xs bg-white border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">{a.answer}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm text-gray-600">
                                    <strong>{tasks.length}</strong> giai đoạn · <strong>{tasks.reduce((a, t) => a + (t.subtasks?.length || 0), 0)}</strong> subtasks
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => setSelectedTasks(new Set(tasks.map((_, i) => i)))} className="text-xs text-indigo-600 hover:underline">Tất cả</button>
                                    <span className="text-gray-300">|</span>
                                    <button onClick={() => setSelectedTasks(new Set())} className="text-xs text-gray-500 hover:underline">Bỏ chọn</button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {tasks.map((task, idx) => (
                                    <div key={idx} className={`border rounded-xl overflow-hidden transition-all ${selectedTasks.has(idx) ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200 opacity-60'}`}>
                                        <div className="flex items-center gap-3 p-3">
                                            <input type="checkbox" checked={selectedTasks.has(idx)} onChange={() => toggleTask(idx)}
                                                className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0 cursor-pointer" />
                                            <button onClick={() => toggleExpand(idx)} className="flex-1 flex items-center gap-2 text-left">
                                                {expanded.has(idx) ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                                <span className="font-semibold text-sm text-gray-900 flex-1">{task.title}</span>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    {task.discipline && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${disciplineColors[task.discipline] || 'bg-gray-100 text-gray-600'}`}>{task.discipline}</span>}
                                                    {task.estimatedDays && <span className="text-[10px] text-gray-400">{task.estimatedDays}d</span>}
                                                    {task.priority && <span className={`text-[10px] font-semibold ${priorityColors[task.priority] || ''}`}>{task.priority}</span>}
                                                </div>
                                            </button>
                                        </div>
                                        {expanded.has(idx) && task.subtasks && task.subtasks.length > 0 && (
                                            <div className="px-4 pb-3 space-y-1.5 border-t border-gray-100 pt-2">
                                                {task.subtasks.map((sub, si) => (
                                                    <div key={si} className="flex items-center gap-2 py-1 pl-6">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                                        <span className="text-xs text-gray-700 flex-1">{sub.title}</span>
                                                        {sub.discipline && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${disciplineColors[sub.discipline] || 'bg-gray-100 text-gray-600'}`}>{sub.discipline}</span>}
                                                        {sub.estimatedDays && <span className="text-[10px] text-gray-400">{sub.estimatedDays}d</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50 flex-shrink-0">
                            <button onClick={handleRestart} className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                                <RefreshCw className="w-3.5 h-3.5" /> Làm lại từ đầu
                            </button>
                            <div className="flex gap-2">
                                <button onClick={() => generateTasks(answers)} className="text-sm text-gray-500 hover:text-indigo-600 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white flex items-center gap-1.5">
                                    <Wand2 className="w-3.5 h-3.5" /> Tạo lại
                                </button>
                                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium">Hủy</button>
                                <button onClick={handleImport} disabled={selectedTasks.size === 0}
                                    className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                                    <Check className="w-4 h-4" /> Import {selectedTasks.size} giai đoạn
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ══════════ IMPORTING ══════════ */}
                {step === 'importing' && (
                    <div className="flex-1 flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                        <p className="font-semibold text-gray-700 mb-2">Đang lưu vào hệ thống...</p>
                        <div className="w-48 bg-gray-200 rounded-full h-2 mb-2">
                            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${importProgress.total > 0 ? (importProgress.done / importProgress.total) * 100 : 0}%` }} />
                        </div>
                        <p className="text-sm text-gray-400">{importProgress.done}/{importProgress.total} tasks</p>
                    </div>
                )}

                {/* ══════════ DONE ══════════ */}
                {step === 'done' && (
                    <div className="flex-1 flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-emerald-600" />
                        </div>
                        <p className="text-lg font-semibold text-gray-800">Import hoàn tất!</p>
                        <p className="text-sm text-gray-500 mt-1">Đang chuyển sang danh sách tasks...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
