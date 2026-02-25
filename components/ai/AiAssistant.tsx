'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Send, X } from 'lucide-react';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ApiResponse =
  | { success: true; data: { message: string } }
  | { success: false; error: string };

const STORAGE_KEY = 'zfenix.aiAssistant.messages.v1';

function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const BOSS_GREETINGS = [
  'Dạ em chào Sếp. Sếp cần em hỗ trợ mục nào trong hệ thống báo giá ạ?',
  'Em chào Sếp. Sếp muốn xem số liệu hay thao tác ở phần nào ạ?',
  'Dạ chào Sếp. Sếp cho em biết yêu cầu, em trả lời đúng trọng tâm ngay ạ.',
  'Em chào Sếp. Sếp cần tổng hợp nhanh theo dự án/khách hàng hay theo thời gian ạ?',
  'Dạ em chào Sếp. Em sẵn sàng hỗ trợ—Sếp cần kiểm tra mục nào trước ạ?',
];

function pickDailyGreeting(): string {
  // Change daily but stable during the day
  const dayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let hash = 0;
  for (let i = 0; i < dayKey.length; i += 1) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
  }
  const idx = hash % BOSS_GREETINGS.length;
  return BOSS_GREETINGS[idx] ?? BOSS_GREETINGS[0]!;
}

// Chỉ dùng để chuẩn hoá input của user (loại bỏ khoảng trắng thừa).
function normalizeUserInput(input: string) {
  return input.replace(/\s+/g, ' ').trim();
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nowId(),
      role: 'assistant',
      content: pickDailyGreeting(),
    },
  ]);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const restored = parsed
        .filter(
          (x): x is ChatMessage =>
            typeof x === 'object' &&
            x !== null &&
            'id' in x &&
            'role' in x &&
            'content' in x &&
            (x as { role: unknown }).role !== 'system'
        )
        .slice(-50) as ChatMessage[];
      if (restored.length > 0) setMessages(restored);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, messages, loading]);

  const apiMessages = useMemo(
    () =>
      messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    [messages]
  );

  async function send() {
    const text = normalizeUserInput(input);
    if (!text || loading) return;

    setError(null);
    setInput('');
    setLoading(true);

    const nextMessages: ChatMessage[] = [...messages, { id: nowId(), role: 'user', content: text }];
    setMessages(nextMessages);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...apiMessages, { role: 'user', content: text }] }),
      });
      const json: ApiResponse = (await res.json()) as ApiResponse;

      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error : 'Gọi AI thất bại';
        throw new Error(msg);
      }

      // Giữ nguyên xuống dòng / bullet mà AI trả về để hiển thị đẹp cho Sếp
      const raw = json.data.message ?? '';
      const assistantText = raw.trim() || 'Mình chưa nhận được nội dung trả lời.';
      setMessages((prev) => [...prev, { id: nowId(), role: 'assistant', content: assistantText }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Có lỗi khi gọi AI';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function resetHistory() {
    const initial: ChatMessage[] = [
      { id: nowId(), role: 'assistant', content: pickDailyGreeting() },
    ];
    setMessages(initial);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        aria-label="Mở trợ lý AI"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <Bot className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Panel */}
      {open ? (
        <div
          className="fixed bottom-5 right-5 z-50 flex h-[70vh] w-[92vw] max-w-md flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
          role="dialog"
          aria-label="Trợ lý AI"
        >
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="text-sm font-semibold text-gray-900">Trợ lý AI</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Xoá lịch sử chat"
                onClick={resetHistory}
                className="rounded-md px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
              >
                Xoá
              </button>
              <button
                type="button"
                aria-label="Đóng trợ lý AI"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={[
                    'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm',
                    m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900',
                  ].join(' ')}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-600">Đang trả lời…</div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="border-t border-gray-200 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi…"
                aria-label="Nhập câu hỏi cho trợ lý AI"
                className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
              <button
                type="submit"
                aria-label="Gửi câu hỏi"
                disabled={loading || normalizeUserInput(input).length === 0}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
            <div className="mt-2 text-xs text-gray-500">
              Lưu ý: AI chỉ hỗ trợ hướng dẫn/tra cứu, không tự động sửa dữ liệu hệ thống.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

