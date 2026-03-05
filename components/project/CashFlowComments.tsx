'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Clock,
    MessageCircle,
    Send,
    History,
    ArrowRight,
    FileEdit,
    CheckSquare,
    RefreshCw,
    MessageSquare,
    Paperclip,
    ImageIcon,
    X,
    FileText,
    Download,
    File,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────
type UserMini = { id: string; name: string | null; image: string | null };

type Attachment = {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
};

type Comment = {
    id: string;
    content: string;
    mentions: string[];
    createdAt: string;
    user: UserMini;
    attachments: Attachment[];
};

type Activity = {
    id: string;
    action: string;
    field: string | null;
    oldValue: string | null;
    newValue: string | null;
    summary: string | null;
    createdAt: string;
    user: UserMini;
};

// ─── Helpers ────────────────────────────────────────────────────────────
function relativeTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} giờ trước`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getActionIcon(action: string) {
    switch (action) {
        case 'CREATE': return <RefreshCw className="w-3 h-3 text-blue-500" />;
        case 'UPDATE': return <FileEdit className="w-3 h-3 text-amber-500" />;
        case 'STATUS_CHANGE': return <ArrowRight className="w-3 h-3 text-purple-500" />;
        case 'CHECKLIST_UPDATE': return <CheckSquare className="w-3 h-3 text-emerald-500" />;
        case 'COMMENT': return <MessageCircle className="w-3 h-3 text-blue-400" />;
        default: return <Clock className="w-3 h-3 text-gray-400" />;
    }
}

function getActionLabel(action: string): string {
    switch (action) {
        case 'CREATE': return 'Tạo mới';
        case 'UPDATE': return 'Cập nhật';
        case 'STATUS_CHANGE': return 'Đổi trạng thái';
        case 'CHECKLIST_UPDATE': return 'Cập nhật checklist';
        case 'COMMENT': return 'Bình luận';
        case 'DELETE': return 'Xóa';
        default: return action;
    }
}

function isImageType(type: string) {
    return type.startsWith('image/');
}

/** Render text with @mentions highlighted and links auto-linked */
function RichText({ text, allUsers }: { text: string; allUsers: UserMini[] }) {
    const userMap = new Map(allUsers.map((u) => [u.id, u.name || 'Người dùng']));

    // Replace @[userId] with highlighted name
    const parts: React.ReactNode[] = [];
    // Pattern: @[uuid]
    const mentionRegex = /@\[([a-f0-9-]+)\]/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    const textWithMentions = text;
    while ((match = mentionRegex.exec(textWithMentions)) !== null) {
        if (match.index > lastIdx) {
            parts.push(...linkify(textWithMentions.slice(lastIdx, match.index), parts.length));
        }
        const uid = match[1];
        const name = userMap.get(uid) || uid.slice(0, 8);
        parts.push(
            <span key={`m-${parts.length}`} className="inline-flex items-center px-1 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">
                @{name}
            </span>
        );
        lastIdx = match.index + match[0].length;
    }
    if (lastIdx < textWithMentions.length) {
        parts.push(...linkify(textWithMentions.slice(lastIdx), parts.length));
    }

    return <>{parts}</>;
}

/** Auto-detect links */
function linkify(text: string, keyOffset: number): React.ReactNode[] {
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    while ((match = urlRegex.exec(text)) !== null) {
        if (match.index > lastIdx) {
            parts.push(<span key={`t-${keyOffset}-${parts.length}`}>{text.slice(lastIdx, match.index)}</span>);
        }
        parts.push(
            <a
                key={`l-${keyOffset}-${parts.length}`}
                href={match[1]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 break-all"
            >
                {match[1].length > 50 ? match[1].slice(0, 50) + '...' : match[1]}
            </a>
        );
        lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) {
        parts.push(<span key={`t-${keyOffset}-${parts.length}`}>{text.slice(lastIdx)}</span>);
    }
    return parts;
}

// ─── File Preview Chip ──────────────────────────────────────────────────
function AttachmentPreview({ att, removable, onRemove }: { att: Attachment | PendingFile; removable?: boolean; onRemove?: () => void }) {
    const isImage = isImageType(att.fileType);
    return (
        <div className="relative group inline-flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1.5 border border-gray-200 text-xs">
            {isImage && 'url' in att && att.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={att.url} alt={att.fileName} className="w-8 h-8 rounded object-cover" />
            ) : (
                <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
            )}
            <div className="flex flex-col min-w-0">
                <span className="font-medium text-gray-700 truncate max-w-[120px]">{att.fileName}</span>
                <span className="text-[10px] text-gray-400">{formatFileSize(att.fileSize)}</span>
            </div>
            {removable && onRemove && (
                <button onClick={onRemove} className="ml-1 p-0.5 rounded-full bg-red-100 text-red-500 hover:bg-red-200">
                    <X className="w-3 h-3" />
                </button>
            )}
            {'url' in att && att.url && !removable && (
                <a href={att.url} download={att.fileName} className="ml-1 p-0.5 rounded hover:bg-gray-200">
                    <Download className="w-3 h-3 text-gray-500" />
                </a>
            )}
        </div>
    );
}

type PendingFile = { fileName: string; fileType: string; fileSize: number; file: File; previewUrl?: string };

// ─── Main Component ─────────────────────────────────────────────────────
interface CashFlowCommentsProps {
    projectId: string;
    cashFlowId: string;
    variant?: 'inline' | 'sidebar';
}

export default function CashFlowComments({ projectId, cashFlowId, variant = 'inline' }: CashFlowCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [allUsers, setAllUsers] = useState<UserMini[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [posting, setPosting] = useState(false);
    const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [mentionPos, setMentionPos] = useState(0); // cursor position of @
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mentionRef = useRef<HTMLDivElement>(null);
    // Map: "@DisplayName" → userId for converting before post
    const [mentionMap, setMentionMap] = useState<Map<string, string>>(new Map());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [commRes, usersRes] = await Promise.all([
                fetch(`/api/projects/${projectId}/cashflows/${cashFlowId}/comments`),
                fetch('/api/users?limit=100'),
            ]);
            const commResult = await commRes.json();
            const usersResult = await usersRes.json();
            if (commResult.success) {
                setComments(commResult.data.comments || []);
                setActivities(commResult.data.activities || []);
            }
            if (usersResult.success) {
                setAllUsers(usersResult.data || []);
            }
        } catch (err) {
            console.error('Failed to load:', err);
        } finally {
            setLoading(false);
        }
    }, [projectId, cashFlowId]);

    useEffect(() => { void fetchData(); }, [fetchData]);

    // ─── File handling ────────────────────────────────────────────────
    function handleFilesSelected(files: FileList | File[]) {
        const arr = Array.from(files);
        const newPending: PendingFile[] = [];
        for (const f of arr) {
            if (f.size > 45 * 1024 * 1024) {
                alert(`File "${f.name}" vượt quá 45MB`);
                continue;
            }
            const pf: PendingFile = { fileName: f.name, fileType: f.type, fileSize: f.size, file: f };
            if (isImageType(f.type)) {
                pf.previewUrl = URL.createObjectURL(f);
            }
            newPending.push(pf);
        }
        setPendingFiles((prev) => [...prev, ...newPending]);
    }

    // Paste image from clipboard
    function handlePaste(e: React.ClipboardEvent) {
        const items = e.clipboardData?.items;
        if (!items) return;
        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const f = items[i].getAsFile();
                if (f) files.push(f);
            }
        }
        if (files.length > 0) {
            e.preventDefault();
            handleFilesSelected(files);
        }
    }

    // ─── @ Mention handling ───────────────────────────────────────────
    function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const val = e.target.value;
        setNewComment(val);

        const cursorPos = e.target.selectionStart || 0;
        // Check if we're in a mention context
        const textBefore = val.slice(0, cursorPos);
        const atIdx = textBefore.lastIndexOf('@');

        if (atIdx >= 0 && (atIdx === 0 || textBefore[atIdx - 1] === ' ' || textBefore[atIdx - 1] === '\n')) {
            const searchStr = textBefore.slice(atIdx + 1);
            if (!searchStr.includes(' ') && searchStr.length < 30) {
                setShowMentions(true);
                setMentionSearch(searchStr.toLowerCase());
                setMentionPos(atIdx);
                return;
            }
        }
        setShowMentions(false);
    }

    function insertMention(user: UserMini) {
        const before = newComment.slice(0, mentionPos);
        // Find how far the user has typed after @
        const textAfterAt = newComment.slice(mentionPos + 1);
        const spaceIdx = textAfterAt.search(/[\s]/);
        const mentionEnd = mentionPos + 1 + (spaceIdx >= 0 ? spaceIdx : textAfterAt.length);
        const afterMention = newComment.slice(mentionEnd);

        const displayName = user.name || user.id.slice(0, 8);
        const mentionTag = `@${displayName}`;
        const newText = `${before}${mentionTag} ${afterMention}`;
        setNewComment(newText);
        setShowMentions(false);

        // Track this mention: displayName → userId
        setMentionMap((prev) => {
            const next = new Map(prev);
            next.set(displayName, user.id);
            return next;
        });

        // Focus back
        setTimeout(() => {
            if (inputRef.current) {
                const pos = before.length + mentionTag.length + 1;
                inputRef.current.focus();
                inputRef.current.setSelectionRange(pos, pos);
            }
        }, 0);
    }

    const filteredUsers = allUsers.filter((u) => {
        if (!mentionSearch) return true;
        return (u.name || '').toLowerCase().includes(mentionSearch);
    }).slice(0, 6);

    // ─── Post comment ─────────────────────────────────────────────────
    async function handlePostComment() {
        if (!newComment.trim() && pendingFiles.length === 0) return;
        setPosting(true);
        try {
            // Convert @Name mentions to @[userId] using mentionMap
            let contentToSend = newComment.trim();
            const mentionIds: string[] = [];
            mentionMap.forEach((userId, displayName) => {
                const pattern = `@${displayName}`;
                if (contentToSend.includes(pattern)) {
                    contentToSend = contentToSend.replaceAll(pattern, `@[${userId}]`);
                    mentionIds.push(userId);
                }
            });

            let res: Response;
            if (pendingFiles.length > 0) {
                const fd = new FormData();
                fd.append('content', contentToSend);
                if (mentionIds.length > 0) fd.append('mentions', JSON.stringify(mentionIds));
                for (const pf of pendingFiles) {
                    fd.append('files', pf.file);
                }
                res = await fetch(`/api/projects/${projectId}/cashflows/${cashFlowId}/comments`, {
                    method: 'POST',
                    body: fd,
                });
            } else {
                res = await fetch(`/api/projects/${projectId}/cashflows/${cashFlowId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: contentToSend, mentions: mentionIds }),
                });
            }

            const result = await res.json();
            if (result.success) {
                setNewComment('');
                setPendingFiles([]);
                setMentionMap(new Map());
                await fetchData();
            } else {
                alert(result.error || 'Không thể thêm bình luận');
            }
        } catch (err) {
            console.error('Failed to post comment:', err);
        } finally {
            setPosting(false);
        }
    }

    // ─── Render: Get display name for mention in text ─────────────────
    function getDisplayContent(content: string): React.ReactNode {
        return <RichText text={content} allUsers={allUsers} />;
    }

    // ─── SIDEBAR VARIANT ─────────────────────────────────────────────
    if (variant === 'sidebar') {
        return (
            <div className="flex flex-col h-full">
                {/* Header Tabs */}
                <div className="flex items-center border-b border-gray-200 px-4 flex-shrink-0">
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'comments' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Bình luận
                        {comments.length > 0 && (
                            <span className="ml-1 bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{comments.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'history' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <History className="w-4 h-4" />
                        Lịch sử
                        {activities.length > 0 && (
                            <span className="ml-1 bg-purple-100 text-purple-700 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{activities.length}</span>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mb-2"></div>
                            <span className="text-xs">Đang tải...</span>
                        </div>
                    ) : activeTab === 'comments' ? (
                        comments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <MessageSquare className="w-8 h-8 mb-2 text-gray-300" />
                                <p className="text-sm font-medium text-gray-500">Chưa có bình luận</p>
                                <p className="text-xs text-gray-400 mt-1">Viết bình luận đầu tiên bên dưới</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {comments.map((c) => (
                                    <div key={c.id} className="flex gap-2.5">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden">
                                            {c.user.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={c.user.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-blue-600">
                                                    {(c.user.name || 'U').charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-sm font-semibold text-gray-800">{c.user.name || 'Người dùng'}</span>
                                                <span className="text-[11px] text-gray-400">{relativeTime(c.createdAt)}</span>
                                            </div>
                                            {c.content && (
                                                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words leading-relaxed">
                                                    {getDisplayContent(c.content)}
                                                </p>
                                            )}
                                            {/* Attachments */}
                                            {c.attachments.length > 0 && (
                                                <div className="mt-2 space-y-1.5">
                                                    {c.attachments.filter((a) => isImageType(a.fileType)).map((a) => (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            key={a.id}
                                                            src={a.url}
                                                            alt={a.fileName}
                                                            className="max-w-full rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 max-h-48 object-contain"
                                                            onClick={() => window.open(a.url, '_blank')}
                                                        />
                                                    ))}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {c.attachments.filter((a) => !isImageType(a.fileType)).map((a) => (
                                                            <AttachmentPreview key={a.id} att={a} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        /* History */
                        activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <History className="w-8 h-8 mb-2 text-gray-300" />
                                <p className="text-sm font-medium text-gray-500">Chưa có lịch sử</p>
                                <p className="text-xs text-gray-400 mt-1">Mọi thay đổi sẽ được ghi lại</p>
                            </div>
                        ) : (
                            <div className="space-y-0">
                                {activities.map((a, i) => (
                                    <div key={a.id} className="flex items-start gap-2.5 py-2.5 relative">
                                        {i < activities.length - 1 && (
                                            <div className="absolute left-[15px] top-10 bottom-0 w-px bg-gray-200" />
                                        )}
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center z-10 shadow-sm">
                                            {getActionIcon(a.action)}
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                <span className="text-xs font-semibold text-gray-800">{a.user.name || 'Hệ thống'}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                                                    {getActionLabel(a.action)}
                                                </span>
                                            </div>
                                            {a.summary && <p className="text-xs text-gray-500 mt-0.5">{a.summary}</p>}
                                            <span className="text-[10px] text-gray-400 mt-0.5 block">{relativeTime(a.createdAt)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* Footer: Comment Input */}
                <div className="border-t border-gray-200 px-4 py-3 bg-white flex-shrink-0 space-y-2">
                    {/* Pending files preview */}
                    {pendingFiles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pb-1">
                            {pendingFiles.map((pf, i) => (
                                <AttachmentPreview
                                    key={i}
                                    att={{ ...pf, id: `p-${i}`, url: pf.previewUrl || '' }}
                                    removable
                                    onRemove={() => {
                                        if (pf.previewUrl) URL.revokeObjectURL(pf.previewUrl);
                                        setPendingFiles((prev) => prev.filter((_, idx) => idx !== i));
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Input area */}
                    <div className="relative">
                        <textarea
                            ref={inputRef}
                            value={newComment}
                            onChange={handleInputChange}
                            onPaste={handlePaste}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                                    e.preventDefault();
                                    void handlePostComment();
                                }
                            }}
                            placeholder="Viết bình luận... (@ để tag, paste ảnh)"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 resize-none"
                            rows={2}
                            disabled={posting}
                        />

                        {/* @ Mention dropdown */}
                        {showMentions && filteredUsers.length > 0 && (
                            <div
                                ref={mentionRef}
                                className="absolute bottom-full left-0 mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto"
                            >
                                {filteredUsers.map((u) => (
                                    <button
                                        key={u.id}
                                        onClick={() => insertMention(u)}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-left transition-colors"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {u.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={u.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-600">
                                                    {(u.name || 'U').charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-800 font-medium">{u.name || u.id.slice(0, 8)}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action bar */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                                title="Đính kèm file (< 45MB)"
                            >
                                <Paperclip className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.multiple = true;
                                    input.onchange = () => { if (input.files) handleFilesSelected(input.files); };
                                    input.click();
                                }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                                title="Chèn ảnh"
                            >
                                <ImageIcon className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] text-gray-400 ml-1">Shift+Enter để xuống dòng</span>
                        </div>
                        <button
                            onClick={() => void handlePostComment()}
                            disabled={posting || (!newComment.trim() && pendingFiles.length === 0)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 flex items-center gap-1.5 text-sm font-medium"
                        >
                            <Send className="w-3.5 h-3.5" />
                            {posting ? '...' : 'Gửi'}
                        </button>
                    </div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
                        onChange={(e) => { if (e.target.files) handleFilesSelected(e.target.files); e.target.value = ''; }}
                    />
                </div>
            </div>
        );
    }

    // ─── INLINE VARIANT ─────────────────────────────────────────────────
    return (
        <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="flex items-center gap-1 mb-3">
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'comments' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Bình luận
                    {comments.length > 0 && (
                        <span className="ml-1 bg-blue-200 text-blue-800 rounded-full px-1.5 py-0.5 text-[10px]">{comments.length}</span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'history' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                    <History className="w-3.5 h-3.5" />
                    Lịch sử
                    {activities.length > 0 && (
                        <span className="ml-1 bg-purple-200 text-purple-800 rounded-full px-1.5 py-0.5 text-[10px]">{activities.length}</span>
                    )}
                </button>
            </div>

            {loading ? (
                <div className="py-4 text-center text-xs text-gray-400">Đang tải...</div>
            ) : activeTab === 'comments' ? (
                <div>
                    <div className="flex gap-2 mb-3">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onPaste={handlePaste}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handlePostComment(); } }}
                            placeholder="Viết bình luận..."
                            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={1}
                            disabled={posting}
                        />
                        <button
                            onClick={() => void handlePostComment()}
                            disabled={posting || !newComment.trim()}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1 text-xs font-medium"
                        >
                            <Send className="w-3 h-3" />
                        </button>
                    </div>
                    {comments.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-2">Chưa có bình luận.</p>
                    ) : (
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                            {comments.map((c) => (
                                <div key={c.id} className="flex gap-2">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                        {c.user.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={c.user.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-bold text-gray-600">{(c.user.name || 'U').charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xs font-semibold text-gray-800">{c.user.name || 'Người dùng'}</span>
                                            <span className="text-[10px] text-gray-400">{relativeTime(c.createdAt)}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap break-words">
                                            {getDisplayContent(c.content)}
                                        </p>
                                        {c.attachments.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {c.attachments.map((a) => <AttachmentPreview key={a.id} att={a} />)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    {activities.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-2">Chưa có lịch sử.</p>
                    ) : (
                        <div className="space-y-0 max-h-48 overflow-y-auto">
                            {activities.map((a, i) => (
                                <div key={a.id} className="flex items-start gap-2 py-2 relative">
                                    {i < activities.length - 1 && <div className="absolute left-[13px] top-8 bottom-0 w-px bg-gray-200" />}
                                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center z-10">
                                        {getActionIcon(a.action)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            <span className="text-xs font-semibold text-gray-800">{a.user.name || 'Hệ thống'}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{getActionLabel(a.action)}</span>
                                            <span className="text-[10px] text-gray-400">{relativeTime(a.createdAt)}</span>
                                        </div>
                                        {a.summary && <p className="text-xs text-gray-600 mt-0.5">{a.summary}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
