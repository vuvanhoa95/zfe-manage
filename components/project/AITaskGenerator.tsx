'use client';

/**
 * AITaskGenerator v2 — Chat-first flow
 *
 * Step 1: CHAT  → User cung cấp thêm thông tin qua hội thoại với AI
 * Step 2: PREVIEW → AI generate tasks dựa trên toàn bộ hội thoại, user tick chọn
 * Step 3: IMPORT  → Lưu vào DB với progress bar
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    Wand2, X, ChevronDown, ChevronRight, Check,
    Loader2, AlertCircle, Send, MessageSquare, ArrowRight,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
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

// Gợi ý câu hỏi nhanh để user click luôn
const QUICK_PROMPTS = [
    'Công trình dân dụng (nhà ở, căn hộ, resort)',
    'Công trình thương mại (văn phòng, trung tâm thương mại)',
    'Công trình công nghiệp (nhà máy, kho xưởng)',
    'Chỉ cần BIM LOD 200, không shopdrawing',
    'Cần đủ cả ARC + STR + MEP + CIV',
    'Dự án nhỏ, ưu tiên nhanh trong 3 tháng',
];

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
    // flow steps
    const [step, setStep] = useState<'chat' | 'generating' | 'preview' | 'importing' | 'done'>('chat');

    // chat state
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: `Tôi sẽ giúp bạn tạo danh sách tasks BIM cho dự án **"${projectName || 'chưa đặt tên'}"**.

Để tổng hợp đúng nhất, hãy cho tôi biết thêm về dự án:
• Loại công trình (nhà ở, văn phòng, nhà máy...)?
• Phạm vi BIM cần làm (LOD, bộ môn ARC/STR/MEP/CIV)?
• Timeline dự kiến hoặc yêu cầu đặc biệt nào không?

Bạn có thể gõ hoặc chọn gợi ý phía dưới.`,
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    // preview/import state
    const [tasks, setTasks] = useState<GeneratedTask[]>([]);
    const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ─── Chat ─────────────────────────────────────────────────────────────

    const systemContext = `Bạn là chuyên gia BIM với 15 năm kinh nghiệm tại Việt Nam, đang tư vấn cho dự án:
Tên: ${projectName || 'Chưa đặt tên'}
${projectDescription ? `Mô tả: ${projectDescription}` : ''}
${projectLocation ? `Địa điểm: ${projectLocation}` : ''}
${totalArea ? `Diện tích: ${totalArea.toLocaleString('vi-VN')} m²` : ''}

Hỏi thêm user nếu chưa đủ thông tin, trả lời ngắn gọn bằng tiếng Việt. 
Khi user đã cung cấp đủ thông tin về loại công trình và phạm vi BIM, hãy nhắc user nhấn nút "Tạo Tasks ngay" để generate.`;

    const sendMessage = async (content: string) => {
        if (!content.trim() || isChatLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: content.trim() };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInputValue('');
        setIsChatLoading(true);

        try {
            const res = await fetch('/api/ai/task-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    systemPrompt: systemContext,
                }),
            });

            if (!res.ok) throw new Error('Lỗi kết nối AI');
            const data = await res.json();
            const aiReply = data.message || 'Tôi cần thêm thông tin để hỗ trợ bạn.';

            setMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
        } catch (err: any) {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: `⚠️ ${err.message || 'Lỗi kết nối, vui lòng thử lại'}` },
            ]);
        } finally {
            setIsChatLoading(false);
            inputRef.current?.focus();
        }
    };

    // ─── Generate tasks từ hội thoại ──────────────────────────────────────

    const handleGenerate = async () => {
        setStep('generating');
        setError(null);

        // Tóm tắt context từ toàn bộ hội thoại
        const chatSummary = messages
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .join('\n');

        const prompt = `Bạn là chuyên gia BIM. Dựa trên thông tin dự án và hội thoại với khách hàng, tạo danh sách tasks BIM phù hợp.

=== THÔNG TIN DỰ ÁN ===
Tên: ${projectName}
${projectDescription ? `Mô tả: ${projectDescription}` : ''}
${projectLocation ? `Địa điểm: ${projectLocation}` : ''}
${totalArea ? `Diện tích: ${totalArea.toLocaleString('vi-VN')} m²` : ''}

=== YÊU CẦU BỔ SUNG TỪ KHÁCH HÀNG ===
${chatSummary || '(Chưa có yêu cầu bổ sung)'}

Tạo 5-8 công việc cha (giai đoạn chính), mỗi công việc có 3-5 subtasks.
Bộ môn: ARC (kiến trúc), STR (kết cấu), MEP (cơ điện), CIV (hạ tầng).

Trả về JSON array (KHÔNG markdown, KHÔNG giải thích):
[
  {
    "title": "Tên giai đoạn",
    "description": "Mô tả ngắn",
    "phase": "Khảo sát / Thiết kế / Shopdrawing / ...",
    "discipline": "ARC|STR|MEP|CIV|ALL",
    "priority": "HIGH|MEDIUM|LOW",
    "estimatedDays": 14,
    "subtasks": [
      { "title": "Tên subtask", "discipline": "ARC", "estimatedDays": 5 }
    ]
  }
]`;

        try {
            const res = await fetch('/api/ai/generate-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectName,
                    description: projectDescription,
                    location: projectLocation,
                    totalArea,
                    chatContext: chatSummary, // TRUYỀN THÊM CONTEXT TỪ CHAT
                    customPrompt: prompt,
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
            setStep('chat');
        }
    };

    // ─── Import tasks vào DB ───────────────────────────────────────────────

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

    // ─── Helpers ──────────────────────────────────────────────────────────

    const toggleTask = (idx: number) => setSelectedTasks(prev => {
        const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s;
    });
    const toggleExpand = (idx: number) => setExpanded(prev => {
        const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s;
    });

    // Render markdown-lite (chỉ bold và bullet)
    const renderMd = (text: string) => {
        return text.split('\n').map((line, i) => {
            const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            const bullet = bold.startsWith('•') ? `<span class="pl-3">${bold}</span>` : bold;
            return <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: bullet }} />;
        });
    };

    // ─── Render ───────────────────────────────────────────────────────────

    const modalSize = step === 'chat' ? 'max-w-2xl' : 'max-w-2xl';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${modalSize} max-h-[90vh] flex flex-col overflow-hidden`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                            {step === 'chat' ? <MessageSquare className="w-4 h-4 text-white" /> : <Wand2 className="w-4 h-4 text-white" />}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                {step === 'chat' && '✨ AI Tạo Tasks — Chat để làm rõ yêu cầu'}
                                {step === 'generating' && 'AI đang tạo danh sách tasks...'}
                                {step === 'preview' && 'Xem & chọn tasks để import'}
                                {step === 'importing' && 'Đang lưu vào hệ thống...'}
                                {step === 'done' && 'Import hoàn tất!'}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                {(['chat', 'preview', 'done'] as const).map((s, i) => (
                                    <React.Fragment key={s}>
                                        <span className={`text-[10px] font-semibold ${step === s || (step === 'generating' && s === 'preview') ? 'text-indigo-600' : step === 'done' ? 'text-emerald-600' : 'text-gray-400'}`}>
                                            {i + 1}. {s === 'chat' ? 'Trao đổi' : s === 'preview' ? 'Xem & chọn' : 'Xong'}
                                        </span>
                                        {i < 2 && <span className="text-gray-300 text-[10px]">→</span>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ══════════ STEP 1: CHAT ══════════ */}
                {step === 'chat' && (
                    <>
                        {/* Info bar */}
                        <div className="px-4 py-2 bg-indigo-600/5 border-b border-indigo-100 flex-shrink-0">
                            <p className="text-xs text-indigo-700">
                                📋 Dự án: <strong>{projectName}</strong>
                                {projectLocation && ` · 📍 ${projectLocation}`}
                                {totalArea && ` · 📐 ${totalArea.toLocaleString('vi-VN')} m²`}
                            </p>
                        </div>

                        {/* Chat messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-white text-[10px] font-bold">AI</span>
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm space-y-1 ${
                                        msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                                            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                                    }`}>
                                        {msg.role === 'assistant'
                                            ? renderMd(msg.content)
                                            : <p className="leading-relaxed">{msg.content}</p>
                                        }
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-[10px] font-bold">AI</span>
                                    </div>
                                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick prompts */}
                        <div className="px-4 pb-2 flex-shrink-0">
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {QUICK_PROMPTS.map((prompt, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => sendMessage(prompt)}
                                        disabled={isChatLoading}
                                        className="text-xs px-2.5 py-1 rounded-full border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mx-4 mb-2 flex items-center gap-2 bg-red-50 text-red-700 text-xs px-3 py-2 rounded-xl flex-shrink-0">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                            </div>
                        )}

                        {/* Input + Generate button */}
                        <div className="p-4 border-t border-gray-100 flex-shrink-0 space-y-2">
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage(inputValue)}
                                    placeholder="Nhập thông tin bổ sung về dự án..."
                                    disabled={isChatLoading}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                                />
                                <button
                                    type="button"
                                    onClick={() => sendMessage(inputValue)}
                                    disabled={!inputValue.trim() || isChatLoading}
                                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={isChatLoading}
                                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                <Wand2 className="w-4 h-4" />
                                Tạo Tasks ngay dựa trên thông tin vừa trao đổi
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )}

                {/* ══════════ STEP: GENERATING ══════════ */}
                {step === 'generating' && (
                    <div className="flex-1 flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                        <p className="text-base font-semibold text-gray-700">AI đang phân tích & tạo tasks...</p>
                        <p className="text-sm text-gray-400 mt-2">Dựa trên cuộc hội thoại + thông tin dự án</p>
                    </div>
                )}

                {/* ══════════ STEP 2: PREVIEW ══════════ */}
                {step === 'preview' && (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 min-h-0">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm text-gray-600">
                                    AI đề xuất <strong>{tasks.length}</strong> giai đoạn, <strong>{tasks.reduce((a, t) => a + (t.subtasks?.length || 0), 0)}</strong> subtasks:
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
                                        <div className="flex items-center gap-3 p-3">
                                            <input type="checkbox" checked={selectedTasks.has(idx)} onChange={() => toggleTask(idx)}
                                                className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0 cursor-pointer" />
                                            <button onClick={() => toggleExpand(idx)} className="flex-1 flex items-center gap-2 text-left">
                                                {expanded.has(idx) ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                                <span className="font-semibold text-sm text-gray-900 flex-1">{task.title}</span>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    {task.discipline && (
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${disciplineColors[task.discipline] || 'bg-gray-100 text-gray-600'}`}>
                                                            {task.discipline}
                                                        </span>
                                                    )}
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
                                                        {sub.discipline && (
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${disciplineColors[sub.discipline] || 'bg-gray-100 text-gray-600'}`}>
                                                                {sub.discipline}
                                                            </span>
                                                        )}
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
                            <button onClick={() => setStep('chat')}
                                className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                                ← Quay lại chat
                            </button>
                            <div className="flex gap-2">
                                <button onClick={handleGenerate}
                                    className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white">
                                    <Wand2 className="w-3.5 h-3.5" /> Tạo lại
                                </button>
                                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                                    Hủy
                                </button>
                                <button onClick={handleImport} disabled={selectedTasks.size === 0}
                                    className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    Import {selectedTasks.size} giai đoạn
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ══════════ STEP: IMPORTING ══════════ */}
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

                {/* ══════════ STEP: DONE ══════════ */}
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
