'use client';

import { useEffect, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────
type AISettingsData = {
    // AI Company Lookup
    companyLookupEnabled: boolean;
    companyLookupSources: string[]; // danh sách website tìm kiếm thông tin công ty

    // AI Image Search
    imageSearchEnabled: boolean;
    imageSearchSources: string[]; // danh sách nguồn ảnh tìm kiếm

    // AI Description Enhancer
    descriptionEnhancerEnabled: boolean;
    descriptionEnhancerStyle: 'professional' | 'concise' | 'detailed';
    descriptionEnhancerLanguage: 'vi' | 'en';

    // AI Task Generator
    taskGeneratorEnabled: boolean;
    taskGeneratorDefaultDisciplines: string[]; // bộ môn mặc định tạo task

    // AI Deadline Risk Detector
    riskDetectorEnabled: boolean;
    riskDetectorWarningDaysBefore: number; // cảnh báo trước bao nhiêu ngày

    // AI Cash Flow Forecast
    cashFlowForecastEnabled: boolean;
    cashFlowForecastMonths: number; // dự báo bao nhiêu tháng tới
};

const DEFAULT_AI_SETTINGS: AISettingsData = {
    companyLookupEnabled: true,
    companyLookupSources: [
        'masothue.com',
        'tracuunnt.gdt.gov.vn',
        'doanhnghiep.mpi.gov.vn',
        'vietbiz.vn',
        'hoatieu.vn',
        'thongke.mpi.gov.vn',
    ],
    imageSearchEnabled: true,
    imageSearchSources: [
        'unsplash.com',
        'pexels.com',
        'pixabay.com',
        'freepik.com',
    ],
    descriptionEnhancerEnabled: true,
    descriptionEnhancerStyle: 'professional',
    descriptionEnhancerLanguage: 'vi',
    taskGeneratorEnabled: true,
    taskGeneratorDefaultDisciplines: ['ARC', 'STR', 'MEP'],
    riskDetectorEnabled: true,
    riskDetectorWarningDaysBefore: 7,
    cashFlowForecastEnabled: true,
    cashFlowForecastMonths: 3,
};

const STORAGE_KEY = 'ai_settings';

// ─── Helpers ───────────────────────────────────────────────────────────────
const DISCIPLINE_OPTIONS = [
    { value: 'ARC', label: '🏛️ Kiến trúc (ARC)' },
    { value: 'STR', label: '🏗️ Kết cấu (STR)' },
    { value: 'MEP', label: '⚡ MEP (Điện - Nước - HVAC)' },
    { value: 'INT', label: '🪴 Nội thất (INT)' },
    { value: 'LAND', label: '🌿 Cảnh quan (LAND)' },
    { value: 'CIV', label: '🛣️ Hạ tầng (CIV)' },
    { value: 'OTHER', label: '📦 Khác (OTHER)' },
];

// ─── Sub-component: Toggle ─────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
        </label>
    );
}

// ─── Sub-component: TagInput (danh sách website có thể thêm/xóa) ──────────
function TagInput({
    label,
    hint,
    tags,
    onChange,
    placeholder,
}: {
    label: string;
    hint?: string;
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}) {
    const [inputVal, setInputVal] = useState('');

    const addTag = () => {
        const trimmed = inputVal.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '');
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }
        setInputVal('');
    };

    const removeTag = (i: number) => {
        onChange(tags.filter((_, idx) => idx !== i));
    };

    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
            {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
            <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
                {tags.map((tag, i) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium rounded-full"
                    >
                        🌐 {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(i)}
                            className="ml-1 text-blue-400 hover:text-red-500 transition-colors"
                            aria-label={`Xóa ${tag}`}
                        >
                            ×
                        </button>
                    </span>
                ))}
                {tags.length === 0 && (
                    <span className="text-xs text-gray-400 italic">Chưa có nguồn nào được cấu hình</span>
                )}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder={placeholder || 'Nhập domain (VD: example.com)'}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                    type="button"
                    onClick={addTag}
                    disabled={!inputVal.trim()}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    + Thêm
                </button>
            </div>
        </div>
    );
}

// ─── Sub-component: Section Header ────────────────────────────────────────
function SectionHeader({ icon, title, description, enabled, onToggle }: {
    icon: string;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: (v: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
            <div className="flex items-start gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                    <h3 className="font-bold text-gray-900 text-base">{title}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">{description}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
                <span className={`text-xs font-medium ${enabled ? 'text-green-600' : 'text-gray-400'}`}>
                    {enabled ? 'Bật' : 'Tắt'}
                </span>
                <Toggle checked={enabled} onChange={onToggle} />
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function AISettings() {
    const [aiSettings, setAiSettings] = useState<AISettingsData>(DEFAULT_AI_SETTINGS);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setAiSettings({ ...DEFAULT_AI_SETTINGS, ...JSON.parse(saved) });
            }
        } catch (e) {
            console.error('Failed to load AI settings:', e);
        }
    }, []);

    const update = <K extends keyof AISettingsData>(key: K, value: AISettingsData[K]) => {
        setAiSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaveStatus('saving');
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(aiSettings));
            await new Promise(r => setTimeout(r, 400));
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Cài đặt AI</h2>
                    <p className="text-sm text-gray-500 mt-1">Cấu hình các tính năng AI tích hợp trong hệ thống</p>
                </div>
                <button
                    onClick={handleSave}
                    className={`px-5 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                        saveStatus === 'saved' ? 'bg-green-600 text-white'
                        : saveStatus === 'error' ? 'bg-red-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {saveStatus === 'saving' && <span className="animate-spin">⏳</span>}
                    {saveStatus === 'saved' && '✓'}
                    {saveStatus === 'saving' ? 'Đang lưu...' : saveStatus === 'saved' ? 'Đã lưu' : '💾 Lưu cài đặt AI'}
                </button>
            </div>

            {/* ── Phase 01: AI Tìm kiếm ảnh dự án ─────────────────────────── */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <SectionHeader
                    icon="🖼️"
                    title="AI Tìm kiếm ảnh dự án (Phase 01)"
                    description="Tự động tìm ảnh minh họa phù hợp cho dự án từ các nguồn ảnh miễn phí"
                    enabled={aiSettings.imageSearchEnabled}
                    onToggle={(v) => update('imageSearchEnabled', v)}
                />
                {aiSettings.imageSearchEnabled && (
                    <div className="p-5 space-y-4">
                        <TagInput
                            label="Nguồn ảnh tìm kiếm"
                            hint="Danh sách website cung cấp ảnh miễn phí. AI sẽ tìm ảnh phù hợp từ các nguồn này."
                            tags={aiSettings.imageSearchSources}
                            onChange={(tags) => update('imageSearchSources', tags)}
                            placeholder="VD: unsplash.com, pexels.com"
                        />
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                            💡 <strong>Lưu ý:</strong> Tính năng dùng Unsplash API để tìm ảnh. Các nguồn khác chỉ mang tính tham khảo cho AI.
                        </div>
                    </div>
                )}
            </div>

            {/* ── Phase 02: AI Viết mô tả ──────────────────────────────────── */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <SectionHeader
                    icon="✨"
                    title="AI Viết mô tả dự án (Phase 02)"
                    description="Tự động viết mô tả chuyên nghiệp cho dự án dựa trên tên và thông tin có sẵn"
                    enabled={aiSettings.descriptionEnhancerEnabled}
                    onToggle={(v) => update('descriptionEnhancerEnabled', v)}
                />
                {aiSettings.descriptionEnhancerEnabled && (
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Phong cách viết mặc định</label>
                            <select
                                value={aiSettings.descriptionEnhancerStyle}
                                onChange={(e) => update('descriptionEnhancerStyle', e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="professional">Chuyên nghiệp - Formal</option>
                                <option value="concise">Ngắn gọn - Concise</option>
                                <option value="detailed">Chi tiết - Detailed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ngôn ngữ mặc định</label>
                            <select
                                value={aiSettings.descriptionEnhancerLanguage}
                                onChange={(e) => update('descriptionEnhancerLanguage', e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="vi">🇻🇳 Tiếng Việt</option>
                                <option value="en">🇬🇧 English</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Phase 03: AI Tạo công việc ───────────────────────────────── */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <SectionHeader
                    icon="🗂️"
                    title="AI Tạo danh sách công việc BIM (Phase 03)"
                    description="Tự động tạo danh sách task BIM theo bộ môn dựa trên thông tin dự án"
                    enabled={aiSettings.taskGeneratorEnabled}
                    onToggle={(v) => update('taskGeneratorEnabled', v)}
                />
                {aiSettings.taskGeneratorEnabled && (
                    <div className="p-5 space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">Bộ môn mặc định khi tạo task</label>
                        <p className="text-xs text-gray-500">AI sẽ ưu tiên tạo task cho các bộ môn được chọn</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {DISCIPLINE_OPTIONS.map((d) => {
                                const checked = aiSettings.taskGeneratorDefaultDisciplines.includes(d.value);
                                return (
                                    <label key={d.value} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
                                                const next = e.target.checked
                                                    ? [...aiSettings.taskGeneratorDefaultDisciplines, d.value]
                                                    : aiSettings.taskGeneratorDefaultDisciplines.filter(x => x !== d.value);
                                                update('taskGeneratorDefaultDisciplines', next);
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-xs font-medium text-gray-700">{d.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Phase 04: AI Risk Detector ───────────────────────────────── */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <SectionHeader
                    icon="⚠️"
                    title="AI Phát hiện rủi ro deadline (Phase 04)"
                    description="Phân tích tiến độ và cảnh báo sớm khi dự án có nguy cơ trễ deadline"
                    enabled={aiSettings.riskDetectorEnabled}
                    onToggle={(v) => update('riskDetectorEnabled', v)}
                />
                {aiSettings.riskDetectorEnabled && (
                    <div className="p-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Cảnh báo trước (ngày)</label>
                        <p className="text-xs text-gray-500 mb-3">Hệ thống sẽ cảnh báo khi task sắp đến hạn trong vòng <strong>X ngày</strong></p>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={1}
                                max={30}
                                value={aiSettings.riskDetectorWarningDaysBefore}
                                onChange={(e) => update('riskDetectorWarningDaysBefore', parseInt(e.target.value))}
                                className="flex-1 accent-blue-600"
                            />
                            <span className="text-lg font-bold text-blue-600 w-16 text-center">
                                {aiSettings.riskDetectorWarningDaysBefore} ngày
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>1 ngày</span>
                            <span>15 ngày</span>
                            <span>30 ngày</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Phase 05: AI Cash Flow Forecast ─────────────────────────── */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <SectionHeader
                    icon="📈"
                    title="AI Dự báo dòng tiền (Phase 05)"
                    description="Phân tích lịch sử thu chi và dự báo dòng tiền các tháng tiếp theo"
                    enabled={aiSettings.cashFlowForecastEnabled}
                    onToggle={(v) => update('cashFlowForecastEnabled', v)}
                />
                {aiSettings.cashFlowForecastEnabled && (
                    <div className="p-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Số tháng dự báo</label>
                        <p className="text-xs text-gray-500 mb-3">AI sẽ dự báo dòng tiền cho <strong>X tháng</strong> tiếp theo</p>
                        <div className="flex items-center gap-3">
                            {[1, 2, 3, 6, 12].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => update('cashFlowForecastMonths', m)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                                        aiSettings.cashFlowForecastMonths === m
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                    }`}
                                >
                                    {m} tháng
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── AI Company Lookup ─────────────────────────────────────────── */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <SectionHeader
                    icon="🔍"
                    title="AI Tìm kiếm thông tin công ty"
                    description="Tự động tra cứu thông tin doanh nghiệp từ các website dữ liệu doanh nghiệp"
                    enabled={aiSettings.companyLookupEnabled}
                    onToggle={(v) => update('companyLookupEnabled', v)}
                />
                {aiSettings.companyLookupEnabled && (
                    <div className="p-5 space-y-4">
                        <TagInput
                            label="Website tra cứu thông tin công ty"
                            hint="AI sẽ ưu tiên tìm kiếm từ các website này. Nhập domain không cần https://"
                            tags={aiSettings.companyLookupSources}
                            onChange={(tags) => update('companyLookupSources', tags)}
                            placeholder="VD: masothue.com, tracuunnt.gdt.gov.vn"
                        />
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs font-semibold text-blue-800 mb-2">📌 Nguồn gợi ý phổ biến tại Việt Nam:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    { domain: 'masothue.com', label: 'Mã số thuế' },
                                    { domain: 'tracuunnt.gdt.gov.vn', label: 'Cổng thuế' },
                                    { domain: 'doanhnghiep.mpi.gov.vn', label: 'MPI' },
                                    { domain: 'vietbiz.vn', label: 'VietBiz' },
                                    { domain: 'hoatieu.vn', label: 'Hoatieu' },
                                    { domain: 'dangkykinhdoanh.gov.vn', label: 'ĐKKD' },
                                ].map(({ domain, label }) => (
                                    <button
                                        key={domain}
                                        type="button"
                                        onClick={() => {
                                            if (!aiSettings.companyLookupSources.includes(domain)) {
                                                update('companyLookupSources', [...aiSettings.companyLookupSources, domain]);
                                            }
                                        }}
                                        disabled={aiSettings.companyLookupSources.includes(domain)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border border-blue-300 text-blue-700 bg-white hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {aiSettings.companyLookupSources.includes(domain) ? '✓' : '+'} {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
