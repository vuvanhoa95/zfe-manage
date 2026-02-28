'use client';

import { useState } from 'react';
import { Layers, List, Columns2, ChevronDown, Trash2 } from 'lucide-react';

// Trường group chung dùng cho nhiều màn hình (báo giá, dự án, công việc)
export type GroupField =
    | 'status'
    | 'customer'
    | 'date'
    | 'project'
    | 'assignee'
    | 'phase'
    | 'discipline'
    | 'priority'
    | 'none';
export type SortOrder = 'asc' | 'desc';

export interface GroupConfig {
    field: GroupField;
    sortOrder: SortOrder;
}

export interface ColumnSettings {
    showStatus: boolean;
    showDates: boolean;
    showAssignee: boolean;
    showPriority: boolean;
    showProgress: boolean;
    showPhase: boolean;
    showDiscipline: boolean;
    showLocation: boolean;
    showDueDate: boolean;
}

interface GroupToolProps {
    activeTab?: 'group' | 'subtasks' | 'columns';
    groupConfig?: GroupConfig;
    availableFields?: Array<{ value: GroupField; label: string }>;
    onTabChange?: (tab: 'group' | 'subtasks' | 'columns') => void;
    onGroupChange?: (config: GroupConfig | null) => void;
    showSubtasks?: boolean;
    showColumns?: boolean;
    columnSettings?: ColumnSettings;
    onColumnSettingsChange?: (settings: ColumnSettings) => void;
}

const DEFAULT_FIELDS: Array<{ value: GroupField; label: string }> = [
    { value: 'none', label: 'Không nhóm' },
    { value: 'status', label: 'Trạng thái' },
    { value: 'customer', label: 'Khách hàng' },
    { value: 'date', label: 'Ngày' },
    { value: 'project', label: 'Dự án' },
];

const SORT_OPTIONS: Array<{ value: SortOrder; label: string }> = [
    { value: 'asc', label: 'Tăng dần' },
    { value: 'desc', label: 'Giảm dần' },
];

export default function GroupTool({
    activeTab = 'group',
    groupConfig,
    availableFields = DEFAULT_FIELDS,
    onTabChange,
    onGroupChange,
    showSubtasks = false,
    showColumns = false,
    columnSettings,
    onColumnSettingsChange,
}: GroupToolProps) {
    const [localConfig, setLocalConfig] = useState<GroupConfig>(
        groupConfig || { field: 'none', sortOrder: 'asc' }
    );
    const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const handleFieldChange = (field: GroupField) => {
        const newConfig: GroupConfig = {
            ...localConfig,
            field,
        };
        setLocalConfig(newConfig);
        setIsGroupDropdownOpen(false);
        onGroupChange?.(newConfig.field === 'none' ? null : newConfig);
        // Đóng panel nếu chọn "Không nhóm"
        if (field === 'none') {
            setIsPanelOpen(false);
        }
    };

    const handleSortChange = (sortOrder: SortOrder) => {
        const newConfig: GroupConfig = {
            ...localConfig,
            sortOrder,
        };
        setLocalConfig(newConfig);
        setIsSortDropdownOpen(false);
        onGroupChange?.(newConfig.field === 'none' ? null : newConfig);
    };

    const handleRemoveGroup = () => {
        const resetConfig: GroupConfig = { field: 'none', sortOrder: 'asc' };
        setLocalConfig(resetConfig);
        onGroupChange?.(null);
        setIsPanelOpen(false);
    };

    const currentFieldLabel = availableFields.find((f) => f.value === localConfig.field)?.label || 'Không nhóm';
    const currentSortLabel = SORT_OPTIONS.find((s) => s.value === localConfig.sortOrder)?.label || 'Tăng dần';
    const hasGroup = localConfig.field !== 'none';

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Compact Tabs Bar */}
            <div className="flex items-center border-b border-gray-200 relative">
                {/* Group Tab - Compact với icon */}
                <button
                    type="button"
                    onClick={() => {
                        setIsPanelOpen(!isPanelOpen);
                        onTabChange?.('group');
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors relative ${
                        activeTab === 'group'
                            ? 'text-zf-primary'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    {hasGroup ? (
                        <span className="flex items-center gap-1">
                            <span>Nhóm:</span>
                            <span className="font-medium">{currentFieldLabel}</span>
                            <ChevronDown className="w-3 h-3" />
                        </span>
                    ) : (
                        <span className="text-gray-500">Nhóm</span>
                    )}
                    {activeTab === 'group' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zf-primary" />
                    )}
                </button>
                {showSubtasks && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsPanelOpen(false);
                            onTabChange?.('subtasks');
                        }}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors relative ${
                            activeTab === 'subtasks'
                                ? 'text-zf-primary'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <List className="w-4 h-4" />
                        <span>Công việc con</span>
                        {activeTab === 'subtasks' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zf-primary" />
                        )}
                    </button>
                )}
                {showColumns && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsPanelOpen(false);
                            onTabChange?.('columns');
                        }}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors relative ${
                            activeTab === 'columns'
                                ? 'text-zf-primary'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Columns2 className="w-4 h-4" />
                        <span>Cột</span>
                        {activeTab === 'columns' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zf-primary" />
                        )}
                    </button>
                )}
            </div>

            {/* Group Panel - Chỉ hiện khi mở */}
            {activeTab === 'group' && isPanelOpen && (
                <div className="p-4 space-y-3 border-t border-gray-100">
                    <div className="text-sm font-medium text-gray-700">Nhóm theo</div>
                    <div className="flex items-center gap-2">
                        {/* Group Field Dropdown */}
                        <div className="relative flex-1">
                            <button
                                type="button"
                                onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-zf-accent"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                    </div>
                                    <span>{currentFieldLabel}</span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </button>
                            {isGroupDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsGroupDropdownOpen(false)}
                                    />
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-auto">
                                        {availableFields.map((field) => (
                                            <button
                                                key={field.value}
                                                type="button"
                                                onClick={() => handleFieldChange(field.value)}
                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                                    localConfig.field === field.value
                                                        ? 'bg-zf-bg-secondary text-zf-primary font-medium'
                                                        : 'text-gray-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                            localConfig.field === field.value
                                                                ? 'border-zf-primary'
                                                                : 'border-gray-300'
                                                        }`}
                                                    >
                                                        {localConfig.field === field.value && (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-zf-primary" />
                                                        )}
                                                    </div>
                                                    <span>{field.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Sort Order Dropdown */}
                        {hasGroup && (
                            <>
                                <div className="relative w-36">
                                    <button
                                        type="button"
                                        onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                                        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-zf-accent"
                                    >
                                        <span>{currentSortLabel}</span>
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                    </button>
                                    {isSortDropdownOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setIsSortDropdownOpen(false)}
                                            />
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                                {SORT_OPTIONS.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => handleSortChange(option.value)}
                                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                                            localConfig.sortOrder === option.value
                                                                ? 'bg-zf-bg-secondary text-zf-primary font-medium'
                                                                : 'text-gray-700'
                                                        }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={handleRemoveGroup}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Xóa nhóm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Subtasks Panel */}
            {activeTab === 'subtasks' && showSubtasks && (
                <div className="p-4">
                    <div className="text-sm text-gray-600">Tính năng công việc con sẽ được phát triển sau.</div>
                </div>
            )}

            {/* Columns Panel */}
            {activeTab === 'columns' && showColumns && (
                <div className="p-4 border-t border-gray-100">
                    <div className="text-sm font-medium text-gray-700 mb-3">Quản lý cột hiển thị</div>
                    <p className="text-xs text-gray-500 mb-4">
                        Bật/tắt các cột hiển thị trong chế độ Bảng và thanh Gantt. Các cài đặt này chỉ áp dụng cho
                        dự án này và được lưu trên trình duyệt của anh.
                    </p>
                    {columnSettings && onColumnSettingsChange ? (
                        <div className="grid grid-cols-2 gap-2">
                            <label className="inline-flex items-center gap-2 text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                <input
                                    type="checkbox"
                                    checked={columnSettings.showStatus !== false}
                                    onChange={(e) =>
                                        onColumnSettingsChange({
                                            ...columnSettings,
                                            showStatus: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">Trạng thái</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                <input
                                    type="checkbox"
                                    checked={columnSettings.showPriority}
                                    onChange={(e) =>
                                        onColumnSettingsChange({
                                            ...columnSettings,
                                            showPriority: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">Ưu tiên</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                <input
                                    type="checkbox"
                                    checked={columnSettings.showAssignee}
                                    onChange={(e) =>
                                        onColumnSettingsChange({
                                            ...columnSettings,
                                            showAssignee: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">Người phụ trách</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                <input
                                    type="checkbox"
                                    checked={columnSettings.showPhase}
                                    onChange={(e) =>
                                        onColumnSettingsChange({
                                            ...columnSettings,
                                            showPhase: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">Giai đoạn</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                <input
                                    type="checkbox"
                                    checked={columnSettings.showDiscipline}
                                    onChange={(e) =>
                                        onColumnSettingsChange({
                                            ...columnSettings,
                                            showDiscipline: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">Bộ môn</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                <input
                                    type="checkbox"
                                    checked={columnSettings.showLocation}
                                    onChange={(e) =>
                                        onColumnSettingsChange({
                                            ...columnSettings,
                                            showLocation: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">Vị trí</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                <input
                                    type="checkbox"
                                    checked={columnSettings.showDates}
                                    onChange={(e) =>
                                        onColumnSettingsChange({
                                            ...columnSettings,
                                            showDates: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">Thời gian (Bắt đầu – Kết thúc)</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                <input
                                    type="checkbox"
                                    checked={columnSettings.showDueDate}
                                    onChange={(e) =>
                                        onColumnSettingsChange({
                                            ...columnSettings,
                                            showDueDate: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">Hạn (Due date)</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                <input
                                    type="checkbox"
                                    checked={columnSettings.showProgress}
                                    onChange={(e) =>
                                        onColumnSettingsChange({
                                            ...columnSettings,
                                            showProgress: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">Tiến độ (%)</span>
                            </label>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600">Tính năng tùy chỉnh cột sẽ được phát triển sau.</div>
                    )}
                </div>
            )}
        </div>
    );
}
