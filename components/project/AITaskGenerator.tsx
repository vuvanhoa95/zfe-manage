'use client';

import React, { useState } from 'react';
import { Wand2, X, ChevronDown, ChevronRight, Check, Loader2, AlertCircle } from 'lucide-react';

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

export default function AITaskGenerator({
    projectId,
    projectName,
    projectDescription,
    projectLocation,
    totalArea,
    onTasksImported,
    onClose,
}: AITaskGeneratorProps) {
    const [step, setStep] = useState<'idle' | 'generating' | 'preview' | 'importing' | 'done'>('idle');
    const [tasks, setTasks] = useState<GeneratedTask[]>([]);
    const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

    const handleGenerate = async () => {
        if (!projectName?.trim()) {
            setError('Cần có tên dự án để tạo tasks');
            return;
        }
        setStep('generating');
        setError(null);

        try {
            const res = await fetch('/api/ai/generate-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectName,
                    description: projectDescription,
                    location: projectLocation,
                    totalArea,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi tạo tasks');

            const newTasks: GeneratedTask[] = data.tasks || [];
            setTasks(newTasks);
            // Mặc định chọn tất cả
            setSelectedTasks(new Set(newTasks.map((_, i) => i)));
            setExpanded(new Set(newTasks.map((_, i) => i)));
            setStep('preview');
        } catch (err: any) {
            setError(err.message || 'Không thể tạo tasks');
            setStep('idle');
        }
    };

    const toggleTask = (idx: number) => {
        setSelectedTasks(prev => {
            const s = new Set(prev);
            s.has(idx) ? s.delete(idx) : s.add(idx);
            return s;
        });
    };

    const toggleExpand = (idx: number) => {
        setExpanded(prev => {
            const s = new Set(prev);
            s.has(idx) ? s.delete(idx) : s.add(idx);
            return s;
        });
    };

    const handleImport = async () => {
        const toImport = tasks.filter((_, i) => selectedTasks.has(i));
        if (toImport.length === 0) return;

        // Tổng số tasks + subtasks để tính progress
        const totalOps = toImport.reduce((acc, t) => acc + 1 + (t.subtasks?.length || 0), 0);
        setImportProgress({ done: 0, total: totalOps });
        setStep('importing');

        let done = 0;
        const baseUrl = `/api/projects/${projectId}/tasks`;

        for (const task of toImport) {
            // 1. Tạo task cha
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

            // 2. Tạo subtasks
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
        setTimeout(() => {
            onTasksImported();
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <Wand2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">AI Tạo Danh Sách Task BIM</h2>
                            <p className="text-xs text-gray-500 mt-0.5">GPT-4o phân tích dự án và đề xuất công việc</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5">
                    {/* Idle / Error state */}
                    {(step === 'idle') && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Wand2 className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Tạo Tasks tự động với AI</h3>
                            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                                AI sẽ phân tích thông tin dự án <strong>"{projectName}"</strong> và tạo danh sách công việc BIM phù hợp gồm các giai đoạn và subtasks
                            </p>
                            {error && (
                                <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 max-w-md mx-auto">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                            <button
                                onClick={handleGenerate}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                            >
                                <Wand2 className="w-4 h-4" />
                                Tạo Tasks với AI
                            </button>
                        </div>
                    )}

                    {/* Generating */}
                    {step === 'generating' && (
                        <div className="text-center py-12">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                            <p className="text-base font-semibold text-gray-700">AI đang phân tích dự án...</p>
                            <p className="text-sm text-gray-400 mt-2">GPT-4o đang tạo danh sách công việc BIM phù hợp</p>
                        </div>
                    )}

                    {/* Preview tasks */}
                    {step === 'preview' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-gray-600">
                                    AI đề xuất <strong>{tasks.length}</strong> giai đoạn,{' '}
                                    <strong>{tasks.reduce((a, t) => a + (t.subtasks?.length || 0), 0)}</strong> subtasks.
                                    Chọn những giai đoạn phù hợp:
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => setSelectedTasks(new Set(tasks.map((_, i) => i)))} className="text-xs text-indigo-600 hover:underline">Chọn tất cả</button>
                                    <span className="text-gray-300">|</span>
                                    <button onClick={() => setSelectedTasks(new Set())} className="text-xs text-gray-500 hover:underline">Bỏ chọn</button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {tasks.map((task, idx) => (
                                    <div key={idx} className={`border rounded-xl overflow-hidden transition-all ${selectedTasks.has(idx) ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200 opacity-60'}`}>
                                        {/* Task header */}
                                        <div className="flex items-center gap-3 p-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedTasks.has(idx)}
                                                onChange={() => toggleTask(idx)}
                                                className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0 cursor-pointer"
                                            />
                                            <button onClick={() => toggleExpand(idx)} className="flex-1 flex items-center gap-2 text-left">
                                                {expanded.has(idx)
                                                    ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                }
                                                <span className="font-semibold text-sm text-gray-900 flex-1">{task.title}</span>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    {task.discipline && (
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${disciplineColors[task.discipline] || 'bg-gray-100 text-gray-600'}`}>
                                                            {task.discipline}
                                                        </span>
                                                    )}
                                                    {task.estimatedDays && (
                                                        <span className="text-[10px] text-gray-400">{task.estimatedDays}d</span>
                                                    )}
                                                    {task.priority && (
                                                        <span className={`text-[10px] font-semibold ${priorityColors[task.priority] || ''}`}>
                                                            {task.priority}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        </div>

                                        {/* Subtasks */}
                                        {expanded.has(idx) && task.subtasks && task.subtasks.length > 0 && (
                                            <div className="px-4 pb-3 space-y-1.5 border-t border-gray-100 pt-2">
                                                {task.subtasks.map((sub, si) => (
                                                    <div key={si} className="flex items-center gap-2 py-1 pl-6">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                                        <span className="text-xs text-gray-700 flex-1">{sub.title}</span>
                                                        {sub.discipline && (
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${disciplineColors[sub.discipline] || 'bg-gray-100 text-gray-600'}`}>
                                                                {sub.discipline}
                                                            </span>
                                                        )}
                                                        {sub.estimatedDays && (
                                                            <span className="text-[10px] text-gray-400">{sub.estimatedDays}d</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Importing progress */}
                    {step === 'importing' && (
                        <div className="text-center py-12">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                            <p className="font-semibold text-gray-700 mb-2">Đang lưu vào hệ thống...</p>
                            <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto mb-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${importProgress.total > 0 ? (importProgress.done / importProgress.total) * 100 : 0}%` }}
                                />
                            </div>
                            <p className="text-sm text-gray-400">{importProgress.done}/{importProgress.total} tasks</p>
                        </div>
                    )}

                    {/* Done */}
                    {step === 'done' && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-emerald-600" />
                            </div>
                            <p className="text-lg font-semibold text-gray-800">Import hoàn tất!</p>
                            <p className="text-sm text-gray-500 mt-1">Đang chuyển sang danh sách tasks...</p>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                {step === 'preview' && (
                    <div className="p-5 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50">
                        <button
                            onClick={handleGenerate}
                            className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                        >
                            <Wand2 className="w-3.5 h-3.5" /> Tạo lại
                        </button>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                                Hủy
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={selectedTasks.size === 0}
                                className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Import {selectedTasks.size} giai đoạn
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
