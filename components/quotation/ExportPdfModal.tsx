'use client';

import { useState } from 'react';
import { X, Download, Printer, Eye, FileText, Loader2 } from 'lucide-react';

type ExportPdfModalProps = {
    isOpen: boolean;
    onClose: () => void;
    quotationId: string;
    quotationNo: string;
};

export default function ExportPdfModal({ isOpen, onClose, quotationId, quotationNo }: ExportPdfModalProps) {
    const [loading, setLoading] = useState(false);
    const [exportType, setExportType] = useState<'download' | 'print' | 'preview'>('download');

    if (!isOpen) return null;

    const handleExport = async (type: 'download' | 'print' | 'preview') => {
        setLoading(true);
        setExportType(type);

        try {
            const url = `/api/quotations/${quotationId}/export-pdf?mode=${type}`;
            
            if (type === 'download') {
                // Download PDF trực tiếp
                const response = await fetch(url);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Check if response is actually PDF
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/pdf')) {
                    const errorText = await response.text();
                    console.error('Non-PDF response:', errorText);
                    throw new Error('Server không trả về file PDF. Vui lòng kiểm tra lại.');
                }
                
                const blob = await response.blob();
                
                if (blob.size === 0) {
                    throw new Error('File PDF rỗng. Vui lòng thử lại.');
                }
                
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `BaoGia_${quotationNo}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
                
                onClose();
            } else if (type === 'print') {
                // Mở PDF trong tab mới và trigger print dialog
                // Sử dụng inline mode để browser có thể in
                const printWindow = window.open(url, '_blank');
                if (!printWindow) {
                    throw new Error('Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt popup của trình duyệt.');
                }
                
                // Wait for PDF to load, then trigger print
                const checkLoaded = setInterval(() => {
                    try {
                        if (printWindow.document.readyState === 'complete') {
                            clearInterval(checkLoaded);
                            setTimeout(() => {
                                printWindow.print();
                            }, 1500);
                        }
                    } catch (e) {
                        // Cross-origin, use alternative method
                        clearInterval(checkLoaded);
                        setTimeout(() => {
                            printWindow.print();
                        }, 2000);
                    }
                }, 200);
                
                // Fallback timeout
                setTimeout(() => {
                    clearInterval(checkLoaded);
                    try {
                        printWindow.print();
                    } catch (e) {
                        console.error('Print error:', e);
                    }
                }, 5000);
                
                onClose();
            } else if (type === 'preview') {
                // Mở PDF trong tab mới để preview
                const previewWindow = window.open(url, '_blank');
                if (!previewWindow) {
                    throw new Error('Không thể mở cửa sổ xem trước. Vui lòng kiểm tra cài đặt popup của trình duyệt.');
                }
                onClose();
            }
        } catch (error) {
            console.error('Export PDF error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Không thể xuất PDF. Vui lòng thử lại.';
            alert(`Lỗi: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div
                className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Xuất Báo Giá PDF</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        Chọn cách xuất báo giá <strong>{quotationNo}</strong>:
                    </p>

                    <div className="space-y-3">
                        {/* Download Option */}
                        <button
                            onClick={() => handleExport('download')}
                            disabled={loading}
                            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                <Download className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-semibold text-gray-900">Tải xuống PDF</h3>
                                <p className="text-sm text-gray-600">Lưu file PDF vào máy tính</p>
                            </div>
                            {loading && exportType === 'download' && (
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            )}
                        </button>

                        {/* Print Option */}
                        <button
                            onClick={() => handleExport('print')}
                            disabled={loading}
                            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                <Printer className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-semibold text-gray-900">In PDF</h3>
                                <p className="text-sm text-gray-600">
                                    Mở hộp thoại in và chọn máy in PDF (PDF24, Adobe PDF, Microsoft Print to PDF...)
                                </p>
                            </div>
                            {loading && exportType === 'print' && (
                                <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                            )}
                        </button>

                        {/* Preview Option */}
                        <button
                            onClick={() => handleExport('preview')}
                            disabled={loading}
                            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                                <Eye className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-semibold text-gray-900">Xem trước PDF</h3>
                                <p className="text-sm text-gray-600">Mở PDF trong tab mới để xem trước</p>
                            </div>
                            {loading && exportType === 'preview' && (
                                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                            )}
                        </button>
                    </div>

                    {/* Info Box */}
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <p className="font-semibold mb-1">Lưu ý:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700">
                                    <li>Chọn <strong>"In PDF"</strong> để sử dụng các phần mềm in PDF trong máy</li>
                                    <li>File PDF sẽ được tạo tự động với định dạng chuẩn</li>
                                    <li>Bạn có thể chọn máy in PDF từ danh sách máy in</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    );
}
