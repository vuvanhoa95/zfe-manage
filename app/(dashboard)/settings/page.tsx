'use client';

import { useEffect, useState } from 'react';
import { AnimatedTabPanels } from '@/components/ui/AnimatedTabPanels';
import CustomFieldsSettings from '@/components/settings/CustomFieldsSettings';
import AISettings from '@/components/settings/AISettings';
import PaymentChecklistSettings from '@/components/settings/PaymentChecklistSettings';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'general' | 'quotations' | 'cashflow' | 'export' | 'users' | 'customFields' | 'ai'>('general');
    const [settings, setSettings] = useState({
        // General settings
        defaultVatRate: 8,
        defaultCurrency: 'VND',
        defaultLocation: 'Hà Nội',
        defaultPaymentTerms: 30,
        
        // Quotation settings
        autoGenerateQuotationNo: true,
        quotationNoPrefix: 'BG',
        defaultQuotationTitle: 'BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM',
        defaultTotalArea: 87750,
        
        // Export settings
        defaultDocxTemplate: 'default',
        defaultPdfTemplate: 'default',
        includeCompanyLogo: true,
        
        // Notification settings
        emailNotifications: false,
        emailOnQuotationCreated: false,
        emailOnQuotationAccepted: false,
    });

    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    useEffect(() => {
        // Load settings from localStorage or API
        const savedSettings = localStorage.getItem('app_settings');
        if (savedSettings) {
            try {
                setSettings({ ...settings, ...JSON.parse(savedSettings) });
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
    }, []);

    const handleSave = async () => {
        setLoading(true);
        setSaveStatus('saving');
        
        try {
            // Save to localStorage (or API in the future)
            localStorage.setItem('app_settings', JSON.stringify(settings));
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="px-4 py-4 md:px-6 md:py-5 space-y-4">
            <div className="flex items-center justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        saveStatus === 'saved'
                            ? 'bg-green-600 text-white'
                            : saveStatus === 'error'
                            ? 'bg-red-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                >
                    {saveStatus === 'saving' && <span className="animate-spin">⏳</span>}
                    {saveStatus === 'saved' && <span>✓</span>}
                    {saveStatus === 'error' && <span>✗</span>}
                    {saveStatus === 'saving' ? 'Đang lưu...' : saveStatus === 'saved' ? 'Đã lưu' : saveStatus === 'error' ? 'Lỗi' : 'Lưu Cài đặt'}
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    {[
                        { id: 'general', label: 'Chung', icon: '⚙️' },
                        { id: 'quotations', label: 'Báo giá', icon: '📄' },
                        { id: 'cashflow', label: 'Dòng tiền', icon: '💰' },
                        { id: 'export', label: 'Xuất file', icon: '📤' },
                        { id: 'customFields', label: 'Trường tuỳ chỉnh', icon: '🧩' },
                        { id: 'ai', label: 'AI', icon: '🤖' },
                        { id: 'users', label: 'Người dùng', icon: '👥' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                ? 'border-zf-accent text-zf-accent'
                                : 'border-transparent text-gray-500 hover:text-zf-accent'
                                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <AnimatedTabPanels
                    activeKey={activeTab}
                    variant="ios"
                    orderedKeys={['general', 'quotations', 'cashflow', 'export', 'customFields', 'ai', 'users'] as const}
                    render={(tab) =>
                        tab === 'general' ? (
                            <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Cài đặt Chung</h2>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tỷ lệ VAT mặc định (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={settings.defaultVatRate}
                                    onChange={(e) => updateSetting('defaultVatRate', parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Đơn vị tiền tệ
                                </label>
                                <select
                                    value={settings.defaultCurrency}
                                    onChange={(e) => updateSetting('defaultCurrency', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="VND">VNĐ (Việt Nam Đồng)</option>
                                    <option value="USD">USD (US Dollar)</option>
                                    <option value="EUR">EUR (Euro)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Địa điểm mặc định
                                </label>
                                <input
                                    type="text"
                                    value={settings.defaultLocation}
                                    onChange={(e) => updateSetting('defaultLocation', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Hà Nội"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Thời hạn thanh toán mặc định (ngày)
                                </label>
                                <input
                                    type="number"
                                    value={settings.defaultPaymentTerms}
                                    onChange={(e) => updateSetting('defaultPaymentTerms', parseInt(e.target.value) || 30)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                        ) : tab === 'quotations' ? (
                            <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Cài đặt Báo giá</h2>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Tự động tạo số báo giá
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Tự động tạo số báo giá theo format khi tạo mới
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.autoGenerateQuotationNo}
                                        onChange={(e) => updateSetting('autoGenerateQuotationNo', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tiền tố số báo giá
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.quotationNoPrefix}
                                        onChange={(e) => updateSetting('quotationNoPrefix', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="BG"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tiêu đề báo giá mặc định
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.defaultQuotationTitle}
                                        onChange={(e) => updateSetting('defaultQuotationTitle', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Diện tích mặc định (m²)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.defaultTotalArea}
                                        onChange={(e) => updateSetting('defaultTotalArea', parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                        ) : tab === 'cashflow' ? (
                            <PaymentChecklistSettings />
                        ) : tab === 'export' ? (
                            <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Cài đặt Xuất file</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Template DOCX mặc định
                                </label>
                                <select
                                    value={settings.defaultDocxTemplate}
                                    onChange={(e) => updateSetting('defaultDocxTemplate', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="default">Template mặc định</option>
                                    <option value="custom">Template tùy chỉnh</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Template PDF mặc định
                                </label>
                                <select
                                    value={settings.defaultPdfTemplate}
                                    onChange={(e) => updateSetting('defaultPdfTemplate', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="default">Template mặc định</option>
                                    <option value="custom">Template tùy chỉnh</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Bao gồm logo công ty
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Hiển thị logo công ty trong file xuất
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.includeCompanyLogo}
                                        onChange={(e) => updateSetting('includeCompanyLogo', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                        ) : tab === 'customFields' ? (
                            <CustomFieldsSettings />
                        ) : tab === 'ai' ? (
                            <AISettings />
                        ) : (
                            <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Quản lý Người dùng</h2>
                        
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg mb-2">Tính năng đang phát triển</p>
                            <p className="text-sm">Quản lý người dùng và phân quyền sẽ được thêm vào phiên bản sau</p>
                        </div>
                    </div>
                        )
                    }
                />
            </div>
        </div>
    );
}
