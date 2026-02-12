'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { QuotationLineInput, OutsourceLineInput, OutsourcingStaff, QuotationFormData } from '@/types/quotation';
import { calculateQuotationTotals } from '@/lib/utils';
import { formatVND, numberToVietnameseWords } from '@/lib/number-to-words-vn';

type PricingTableProps = {
    lines: QuotationLineInput[];
    onChange: (lines: QuotationLineInput[]) => void;
    vatRate: number;
    onVatRateChange: (rate: number) => void;
    profitRate?: number;
    onProfitRateChange?: (rate: number) => void;
    outsourceCost?: number;
    onOutsourceCostChange?: (cost: number) => void;
    taxRate?: number;
    onTaxRateChange?: (rate: number) => void;
    onTaxCostChange?: (cost: number) => void;
    commissionType?: 'direct' | 'percentage';
    onCommissionTypeChange?: (type: 'direct' | 'percentage') => void;
    commissionRate?: number;
    onCommissionRateChange?: (rate: number) => void;
    commissionCost?: number;
    onCommissionCostChange?: (cost: number) => void;
    outsourceLines?: OutsourceLineInput[];
    onOutsourceLinesChange?: (lines: OutsourceLineInput[]) => void;
    outsourceStaffList?: OutsourcingStaff[];
    onUpdateFields?: (updates: Partial<QuotationFormData>) => void;
};

export default function PricingTable({
    lines,
    onChange,
    vatRate,
    onVatRateChange,
    profitRate = 0,
    onProfitRateChange,
    outsourceCost = 0,
    onOutsourceCostChange,
    taxRate = 0,
    onTaxRateChange,
    onTaxCostChange,
    commissionType = 'direct',
    onCommissionTypeChange,
    commissionRate = 0,
    onCommissionRateChange,
    commissionCost = 0,
    onCommissionCostChange,
    outsourceLines = [],
    onOutsourceLinesChange,
    outsourceStaffList = [],
    onUpdateFields,
    totalArea = 0
}: PricingTableProps & { totalArea?: number }) {
    const [catalogItems, setCatalogItems] = useState<any[]>([]);
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
    const [selectedCatalogItems, setSelectedCatalogItems] = useState<Set<string>>(new Set());
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [dragArmedIndex, setDragArmedIndex] = useState<number | null>(null);
    const [collapsedGroupKeys, setCollapsedGroupKeys] = useState<Set<string>>(new Set());

    const parseCurrencyInput = (value: string): number | undefined => {
        const numeric = value.replace(/[^\d]/g, '');
        if (!numeric) return undefined;
        return parseFloat(numeric);
    };

    useEffect(() => {
        const fetchCatalog = async () => {
            const res = await fetch('/api/catalog?category=PRICING');
            const result = await res.json();
            if (result.success) setCatalogItems(result.data);
        };
        fetchCatalog();
    }, []);

    // Auto-size all textareas when component mounts or lines change
    useEffect(() => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach((textarea) => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        });
    }, [lines]);

    const toggleCatalogItemSelection = (itemId: string) => {
        setSelectedCatalogItems(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    };

    const selectAllCatalogItems = () => {
        // Only select items that are not already added
        const availableItems = catalogItems.filter(item => !isItemAlreadyAdded(item.title));
        setSelectedCatalogItems(new Set(availableItems.map(item => item.id)));
    };

    const deselectAllCatalogItems = () => {
        setSelectedCatalogItems(new Set());
    };

    const addSelectedItemsFromCatalog = () => {
        if (selectedCatalogItems.size === 0) {
            alert('Vui lòng chọn ít nhất một mục từ danh mục.');
            return;
        }

        const selectedItems = catalogItems.filter(item => selectedCatalogItems.has(item.id));
        const groupHeaders = lines.filter(line => line.isGroupHeader);
        const existingItems = lines.filter(line => !line.isGroupHeader);

        // Filter out items that already exist (by title)
        const newItems = selectedItems
            .filter(catalogItem => !existingItems.some(existing => existing.title === catalogItem.title))
            .map((item: any, index: number) => ({
                section: selectedLineIndex !== null && lines[selectedLineIndex]?.isGroupHeader
                    ? (lines[selectedLineIndex].section ?? lines[selectedLineIndex].title ?? 'B – BÁO GIÁ')
                    : 'B – BÁO GIÁ',
                itemNo: (existingItems.length + index + 1).toString(),
                title: item.title,
                qty: item.unit === 'm²' ? undefined : 1,
                unit: item.unit || 'm²',
                unitPrice: item.defaultPrice || 0,
                priceType: (item.unit === 'm²' ? 'area' : 'fixed') as 'fixed' | 'area' | 'none',
                note: item.description || '',
                order: selectedLineIndex !== null && !lines[selectedLineIndex]?.isGroupHeader
                    ? selectedLineIndex + index
                    : groupHeaders.length + existingItems.length + index,
                isGroupHeader: false,
                isChargeable: true,
            }));

        if (newItems.length === 0) {
            alert('Tất cả các mục đã chọn đã có trong bảng.');
            return;
        }

        // Nếu đang chọn sẵn một dòng công việc (không phải group header), thay thế dòng đó bằng mục đầu tiên và thêm các mục còn lại sau đó
        if (selectedLineIndex !== null && !lines[selectedLineIndex]?.isGroupHeader && newItems.length > 0) {
            const updated = [...lines];
            const base = updated[selectedLineIndex] ?? {};

            const firstItem = newItems[0];
            const updatedLine: QuotationLineInput = {
                ...base,
                section: firstItem.section,
                itemNo: base.itemNo || firstItem.itemNo,
                title: firstItem.title,
                qty: firstItem.qty,
                unit: firstItem.unit,
                unitPrice: firstItem.unitPrice,
                priceType: firstItem.priceType,
                note: firstItem.note,
                order: base.order ?? selectedLineIndex,
                isGroupHeader: false,
                isChargeable: true,
            };

            updated[selectedLineIndex] = updatedLine;

            // Thêm các mục còn lại sau dòng đã cập nhật
            const remainingItems = newItems.slice(1).map((item, idx) => ({
                ...item,
                order: selectedLineIndex + idx + 1,
            }));

            updated.splice(selectedLineIndex + 1, 0, ...remainingItems);
            updated.forEach((line, idx) => {
                line.order = idx;
            });

            const updatedWithNumbers = updateItemNumbers(updated);
            onChange(updatedWithNumbers);
        } else {
            // Thêm tất cả các mục mới vào cuối
            const updated = [...lines, ...newItems];
            updated.forEach((line, idx) => {
                line.order = idx;
            });
            const updatedWithNumbers = updateItemNumbers(updated);
            onChange(updatedWithNumbers);
        }

        alert(`Đã thêm ${newItems.length} dịch vụ từ Master Data vào bảng đơn giá.`);
        setSelectedCatalogItems(new Set());
        setIsCatalogOpen(false);
    };

    const addFromCatalog = (item: any) => {
        // Nếu người dùng đang chọn sẵn một dòng công việc, import dữ liệu Master Data vào dòng đó
        if (selectedLineIndex !== null && !lines[selectedLineIndex]?.isGroupHeader) {
            const updated = [...lines];
            const base = updated[selectedLineIndex] ?? {};

            const updatedLine: QuotationLineInput = {
                ...base,
                section: 'B – BÁO GIÁ',
                itemNo: base.itemNo || (lines.filter(l => !l.isGroupHeader).length + 1).toString(),
                title: item.title,
                qty: item.unit === 'm²' ? undefined : 1,
                unit: item.unit || 'm²',
                unitPrice: item.defaultPrice || 0,
                priceType: (item.unit === 'm²' ? 'area' : 'fixed') as 'fixed' | 'area' | 'none',
                note: item.description || '',
                order: base.order ?? selectedLineIndex,
                isGroupHeader: false,
                isChargeable: true,
            };

            updated[selectedLineIndex] = updatedLine;
            const updatedWithNumbers = updateItemNumbers(updated);
            onChange(updatedWithNumbers);
            setIsCatalogOpen(false);
            return;
        }

        // Ngược lại: thêm một dòng mới từ Master Data như hiện tại
        const newLine: QuotationLineInput = {
            section: 'B – BÁO GIÁ',
            itemNo: '',
            title: item.title,
            qty: item.unit === 'm²' ? undefined : 1,
            unit: item.unit || 'm²',
            unitPrice: item.defaultPrice || 0,
            priceType: (item.unit === 'm²' ? 'area' : 'fixed') as 'fixed' | 'area' | 'none',
            note: item.description || '',
            order: lines.length,
            isGroupHeader: false,
            isChargeable: true,
        };
        const updated = [...lines, newLine];
        const updatedWithNumbers = updateItemNumbers(updated);
        onChange(updatedWithNumbers);
        setIsCatalogOpen(false);
    };

    const importAllFromCatalog = () => {
        if (catalogItems.length === 0) {
            alert('Không có dữ liệu trong Master Data. Vui lòng thêm dữ liệu vào Master Data trước.');
            return;
        }

        const groupHeaders = lines.filter(line => line.isGroupHeader);
        const existingItems = lines.filter(line => !line.isGroupHeader);

        // Only add items that don't already exist
        const newItems = catalogItems
            .filter(catalogItem => !existingItems.some(existing => existing.title === catalogItem.title))
            .map((item: any, index: number) => ({
                section: 'B – BÁO GIÁ',
                itemNo: (existingItems.length + index + 1).toString(),
                title: item.title,
                qty: item.unit === 'm²' ? undefined : 1,
                unit: item.unit || 'm²',
                unitPrice: item.defaultPrice || 0,
                priceType: (item.unit === 'm²' ? 'area' : 'fixed') as 'fixed' | 'area' | 'none',
                note: item.description || '',
                order: groupHeaders.length + existingItems.length + index,
                isGroupHeader: false,
                isChargeable: true,
            }));

        if (newItems.length > 0) {
            const updated = [...lines, ...newItems];
            updated.forEach((line, idx) => {
                line.order = idx;
            });
            const updatedWithNumbers = updateItemNumbers(updated);
            onChange(updatedWithNumbers);
            alert(`Đã thêm ${newItems.length} dịch vụ từ Master Data vào bảng đơn giá.`);
        } else {
            alert('Tất cả các dịch vụ từ Master Data đã có trong bảng.');
        }
    };
    const addLine = () => {
        const newLine: QuotationLineInput = {
            itemNo: '',
            title: '',
            qty: 1,
            unit: 'm²',
            unitPrice: 0,
            priceType: 'fixed',
            note: '',
            order: lines.length,
            isGroupHeader: false,
            isChargeable: true,
        };
        const updated = [...lines, newLine];
        const updatedWithNumbers = updateItemNumbers(updated);
        onChange(updatedWithNumbers);
    };

    const addGroupHeader = () => {
        const newLine: QuotationLineInput = {
            section: 'NEW GROUP',
            itemNo: '',
            title: 'NEW GROUP',
            order: lines.length,
            isGroupHeader: true,
            isChargeable: false,
        };
        onChange([...lines, newLine]);
    };

    const addChildLine = (groupIndex: number) => {
        const group = lines[groupIndex];
        if (!group || !group.isGroupHeader) return;

        // Xác định vị trí chèn: ngay sau các công việc con hiện tại của hạng mục này
        let insertIndex = groupIndex + 1;
        while (insertIndex < lines.length && !lines[insertIndex].isGroupHeader) {
            insertIndex += 1;
        }

        const newLine: QuotationLineInput = {
            section: group.section ?? group.title ?? 'HẠNG MỤC',
            itemNo: '',
            title: '',
            qty: 1,
            unit: 'm²',
            unitPrice: 0,
            priceType: 'fixed',
            note: '',
            order: insertIndex,
            isGroupHeader: false,
            isChargeable: true,
        };

        const updated = [...lines];
        updated.splice(insertIndex, 0, newLine);
        updated.forEach((line, idx) => {
            line.order = idx;
        });
        const updatedWithNumbers = updateItemNumbers(updated);
        onChange(updatedWithNumbers);
    };

    const openCatalogForGroup = (groupIndex: number) => {
        const group = lines[groupIndex];
        if (!group || !group.isGroupHeader) return;

        // Tìm dòng công việc đầu tiên thuộc hạng mục này
        let targetIndex = groupIndex + 1;
        while (targetIndex < lines.length && lines[targetIndex].isGroupHeader) {
            targetIndex += 1;
        }

        let updated = [...lines];

        // Nếu chưa có dòng con nào, tự động thêm một dòng trống dưới hạng mục này
        if (targetIndex >= updated.length || updated[targetIndex].isGroupHeader) {
            const newLine: QuotationLineInput = {
                section: group.section ?? group.title ?? 'HẠNG MỤC',
                itemNo: '',
                title: '',
                qty: 1,
                unit: 'm²',
                unitPrice: 0,
                priceType: 'fixed',
                note: '',
                order: targetIndex,
                isGroupHeader: false,
                isChargeable: true,
            };

            updated.splice(targetIndex, 0, newLine);
            updated.forEach((line, idx) => {
                line.order = idx;
            });
            onChange(updated);
        }

        setSelectedLineIndex(targetIndex);
        setIsCatalogOpen(true);
    };

    const updateLine = (index: number, field: keyof QuotationLineInput, value: any) => {
        const updated = [...lines];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const removeLine = (index: number) => {
        const updated = lines.filter((_, i) => i !== index);
        updated.forEach((line, idx) => {
            line.order = idx;
        });
        const updatedWithNumbers = updateItemNumbers(updated);
        onChange(updatedWithNumbers);
    };

    const getGroupKey = (line: QuotationLineInput, index: number): string => {
        // Prefer stable, human-defined fields; fallback to index
        return String(line.section ?? line.title ?? index);
    };

    const toggleGroupCollapsed = (groupKey: string) => {
        setCollapsedGroupKeys((prev) => {
            const next = new Set(prev);
            if (next.has(groupKey)) next.delete(groupKey);
            else next.add(groupKey);
            return next;
        });
    };

    const getGroupRange = (startIndex: number): { start: number; endExclusive: number } => {
        const startLine = lines[startIndex];
        if (!startLine?.isGroupHeader) return { start: startIndex, endExclusive: startIndex + 1 };

        let end = startIndex + 1;
        while (end < lines.length && !lines[end]?.isGroupHeader) {
            end += 1;
        }
        return { start: startIndex, endExclusive: end };
    };

    const moveGroupBlock = (groupHeaderIndex: number, direction: 'up' | 'down') => {
        const header = lines[groupHeaderIndex];
        if (!header?.isGroupHeader) return;

        const { start, endExclusive } = getGroupRange(groupHeaderIndex);
        const block = lines.slice(start, endExclusive);
        const updated = [...lines];

        // Remove block
        updated.splice(start, endExclusive - start);

        if (direction === 'up') {
            if (start === 0) return;
            // Find previous group header index in the ORIGINAL list
            let insertAt = start - 1;
            while (insertAt > 0 && !lines[insertAt]?.isGroupHeader) {
                insertAt -= 1;
            }
            updated.splice(insertAt, 0, ...block);
        } else {
            // direction === 'down'
            const nextGroupStart = endExclusive; // first index after this block (original array)
            if (nextGroupStart >= lines.length) return;

            // After removing this block, the next group start shifts left by block length
            const nextStartInUpdated = nextGroupStart - (endExclusive - start);

            // Insert after the next group block
            let afterNext = nextStartInUpdated;
            if (updated[afterNext]?.isGroupHeader) {
                afterNext += 1;
                while (afterNext < updated.length && !updated[afterNext]?.isGroupHeader) {
                    afterNext += 1;
                }
            }
            updated.splice(afterNext, 0, ...block);
        }

        updated.forEach((line, idx) => {
            line.order = idx;
        });
        const updatedWithNumbers = updateItemNumbers(updated);
        onChange(updatedWithNumbers);
    };

    const reorderLines = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        if (fromIndex < 0 || fromIndex >= lines.length) return;
        if (toIndex < 0 || toIndex >= lines.length) return;

        const movingLine = lines[fromIndex];
        if (!movingLine) return;

        // If dragging a group header, move the whole block (header + children)
        if (movingLine.isGroupHeader) {
            const { start, endExclusive } = getGroupRange(fromIndex);
            const block = lines.slice(start, endExclusive);
            const updated = [...lines];
            updated.splice(start, endExclusive - start);

            // Ignore drop inside the same block
            if (toIndex >= start && toIndex < endExclusive) return;

            // Convert toIndex (original) -> insert index (updated after removal)
            let insertAt = toIndex;
            if (toIndex > start) insertAt = toIndex - (endExclusive - start);

            // Insert at a group boundary: if target is a child, walk back to its header
            while (insertAt > 0 && !updated[insertAt]?.isGroupHeader) {
                insertAt -= 1;
            }

            updated.splice(insertAt, 0, ...block);

            updated.forEach((line, idx) => {
                line.order = idx;
            });
            const updatedWithNumbers = updateItemNumbers(updated);
            onChange(updatedWithNumbers);
            return;
        }

        // Default: move a single (child) row
        const updated = [...lines];
        const [moved] = updated.splice(fromIndex, 1);
        if (!moved) return;
        updated.splice(toIndex, 0, moved);

        updated.forEach((line, idx) => {
            line.order = idx;
        });

        const updatedWithNumbers = updateItemNumbers(updated);
        onChange(updatedWithNumbers);
    };

    const moveLine = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === lines.length - 1) return;

        const current = lines[index];
        if (current?.isGroupHeader) {
            moveGroupBlock(index, direction);
            return;
        }

        const updated = [...lines];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

        updated.forEach((line, idx) => {
            line.order = idx;
        });

        const updatedWithNumbers = updateItemNumbers(updated);
        onChange(updatedWithNumbers);
    };

    const canMoveUp = (index: number) => index > 0;
    const canMoveDown = (index: number) => index < lines.length - 1;

    const dragHint = useMemo(() => 'Kéo để sắp xếp', []);

    // Check if a catalog item already exists in the table (by title)
    const isItemAlreadyAdded = (itemTitle: string): boolean => {
        return lines.some(line => !line.isGroupHeader && line.title === itemTitle);
    };

    // Auto-update item numbers sequentially (1, 2, 3...) for non-group-header lines
    const updateItemNumbers = (linesToUpdate: QuotationLineInput[]): QuotationLineInput[] => {
        let itemCounter = 1;
        return linesToUpdate.map(line => {
            if (line.isGroupHeader) {
                return line; // Keep group headers unchanged
            }
            const updatedLine = { ...line, itemNo: itemCounter.toString() };
            itemCounter += 1;
            return updatedLine;
        });
    };

    const handleDragStart = (index: number) => (e: React.DragEvent<HTMLTableRowElement>) => {
        // Only allow drag when user starts from the handle (prevents accidental drags while editing inputs)
        if (dragArmedIndex !== index) {
            e.preventDefault();
            return;
        }

        setDraggingIndex(index);
        setDragOverIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
    };

    const handleDragOver = (index: number) => (e: React.DragEvent<HTMLTableRowElement>) => {
        if (draggingIndex === null) return;
        e.preventDefault();
        setDragOverIndex(index);
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (index: number) => (e: React.DragEvent<HTMLTableRowElement>) => {
        e.preventDefault();
        const fromRaw = e.dataTransfer.getData('text/plain');
        const fromIndex = Number(fromRaw);
        if (Number.isNaN(fromIndex)) return;

        reorderLines(fromIndex, index);
        setDraggingIndex(null);
        setDragOverIndex(null);
        setDragArmedIndex(null);
    };

    const handleDragEnd = () => {
        setDraggingIndex(null);
        setDragOverIndex(null);
        setDragArmedIndex(null);
    };

    // Calculate totals matching the ZFENIX logic
    const { totalBeforeVat, vatAmount, totalAfterVat } = calculateQuotationTotals(lines, vatRate, totalArea);
    const profitAmount = totalBeforeVat * (profitRate || 0);
    const totalInWords = numberToVietnameseWords(totalAfterVat);

    const handleTitleChange =
        (index: number) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const el = e.target;
            // Auto-grow chiều cao textarea theo nội dung
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
            updateLine(index, 'title', el.value);
        };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={addGroupHeader}
                    className="px-4 py-2 bg-zf-primary text-white rounded-lg hover:bg-zf-primary-dark transition-colors text-sm font-bold flex items-center gap-2 shadow-sm"
                >
                    + Thêm Hạng mục
                </button>
                <button
                    onClick={() => setIsCatalogOpen(true)}
                    className="px-4 py-2 border-2 border-zf-accent text-zf-accent rounded-lg hover:bg-zf-accent hover:text-white transition-all text-sm font-bold flex items-center gap-2 shadow-sm"
                >
                    📋 Chọn từ danh mục
                </button>
            </div>

            {/* Catalog Modal */}
            {isCatalogOpen && (
                <div className="fixed inset-0 bg-zf-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl space-y-6 border border-zf-bg-secondary max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-zf-primary uppercase">📋 Chọn công việc từ danh mục</h3>
                                {selectedCatalogItems.size > 0 && (
                                    <p className="text-sm text-zf-accent font-bold mt-1">
                                        Đã chọn: {selectedCatalogItems.size} mục
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setIsCatalogOpen(false);
                                    setSelectedCatalogItems(new Set());
                                }}
                                className="text-2xl text-zf-text-secondary hover:text-zf-error transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={selectAllCatalogItems}
                                className="px-4 py-2 bg-zf-bg-secondary text-zf-text-primary rounded-lg hover:bg-zf-bg-tertiary transition-colors text-sm font-bold"
                            >
                                ✓ Chọn tất cả
                            </button>
                            <button
                                onClick={deselectAllCatalogItems}
                                className="px-4 py-2 bg-zf-bg-secondary text-zf-text-primary rounded-lg hover:bg-zf-bg-tertiary transition-colors text-sm font-bold"
                            >
                                ✗ Bỏ chọn tất cả
                            </button>
                            <button
                                onClick={addSelectedItemsFromCatalog}
                                disabled={selectedCatalogItems.size === 0}
                                className="px-6 py-2 bg-zf-accent text-white rounded-lg hover:bg-zf-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold flex items-center gap-2 ml-auto"
                            >
                                ➕ Thêm đã chọn ({selectedCatalogItems.size})
                            </button>
                        </div>

                        <div className="overflow-y-auto space-y-3 flex-1 pr-2">
                            {catalogItems.length === 0 ? (
                                <p className="text-center py-10 text-zf-text-secondary italic">Chưa có dữ liệu trong Master Data.</p>
                            ) : (
                                catalogItems.map(item => {
                                    const isSelected = selectedCatalogItems.has(item.id);
                                    const alreadyAdded = isItemAlreadyAdded(item.title);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                if (!alreadyAdded) {
                                                    toggleCatalogItemSelection(item.id);
                                                }
                                            }}
                                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex justify-between items-center group ${alreadyAdded
                                                ? 'bg-red-50 border-red-300 cursor-not-allowed opacity-75'
                                                : 'cursor-pointer'
                                                } ${!alreadyAdded && isSelected
                                                    ? 'bg-zf-accent/10 border-zf-accent shadow-md'
                                                    : !alreadyAdded
                                                        ? 'bg-zf-bg-secondary hover:bg-zf-accent/5 border-transparent hover:border-zf-accent/20'
                                                        : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${alreadyAdded
                                                    ? 'bg-red-200 border-red-400 cursor-not-allowed'
                                                    : isSelected
                                                        ? 'bg-zf-accent border-zf-accent'
                                                        : 'border-zf-text-secondary group-hover:border-zf-accent'
                                                    }`}>
                                                    {isSelected && !alreadyAdded && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                    {alreadyAdded && (
                                                        <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className={`font-bold transition-colors flex items-center gap-2 ${alreadyAdded
                                                        ? 'text-red-700'
                                                        : isSelected
                                                            ? 'text-zf-accent-dark'
                                                            : 'text-zf-primary group-hover:text-zf-accent-dark'
                                                        }`}>
                                                        {item.title}
                                                        {alreadyAdded && (
                                                            <span className="text-xs font-normal bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-300">
                                                                Đã thêm
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`text-xs font-medium mt-1 ${alreadyAdded ? 'text-red-600' : 'text-zf-text-secondary'
                                                        }`}>
                                                        {item.unit} | {formatVND(item.defaultPrice || 0)} VNĐ
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-zf-bg-secondary border-b border-zf-bg-tertiary">
                        <tr>
                            <th className="px-3 py-4 text-left font-bold text-zf-text-secondary uppercase tracking-wider w-20">TT</th>
                            <th className="px-3 py-4 text-left font-bold text-zf-text-secondary uppercase tracking-wider">Nội dung công việc</th>
                            <th className="px-3 py-4 text-left font-bold text-zf-text-secondary uppercase tracking-wider w-32">Loại giá</th>
                            <th className="px-3 py-4 text-right font-bold text-zf-text-secondary uppercase tracking-wider w-28">Khối lượng</th>
                            <th className="px-3 py-4 text-left font-bold text-zf-text-secondary uppercase tracking-wider w-24">Đơn vị</th>
                            <th className="px-3 py-4 text-right font-bold text-zf-text-secondary uppercase tracking-wider w-36">Đơn giá (VNĐ)</th>
                            <th className="px-3 py-4 text-right font-bold text-zf-text-secondary uppercase tracking-wider w-40">Thành tiền</th>
                            <th className="px-3 py-4 text-center font-bold text-zf-text-secondary uppercase tracking-wider w-24">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(() => {
                            // Precompute parent group key for each row so we can hide children when group is collapsed
                            const parentGroupKeyByIndex: Array<string | null> = new Array(lines.length).fill(null);
                            let currentGroupKey: string | null = null;
                            for (let i = 0; i < lines.length; i += 1) {
                                const l = lines[i];
                                if (l?.isGroupHeader) {
                                    currentGroupKey = getGroupKey(l, i);
                                    parentGroupKeyByIndex[i] = currentGroupKey;
                                } else {
                                    parentGroupKeyByIndex[i] = currentGroupKey;
                                }
                            }

                            return lines.map((line, index) => {
                                const parentKey = parentGroupKeyByIndex[index];
                                const isChild = !line.isGroupHeader;
                                const isCollapsed = parentKey ? collapsedGroupKeys.has(parentKey) : false;
                                if (isChild && isCollapsed) return null;

                                let total = 0;
                                if (line.priceType === 'area') {
                                    total = (totalArea || 0) * (line.unitPrice || 0);
                                } else if (line.priceType !== 'none') {
                                    total = (line.qty || 1) * (line.unitPrice || 0);
                                }

                                if (line.isGroupHeader) {
                                    const groupKey = getGroupKey(line, index);
                                    const collapsed = collapsedGroupKeys.has(groupKey);
                                    const range = getGroupRange(index);
                                    const childrenCount = Math.max(0, range.endExclusive - range.start - 1);
                                    return (
                                        <tr
                                            key={index}
                                            draggable
                                            onDragStart={handleDragStart(index)}
                                            onDragOver={handleDragOver(index)}
                                            onDrop={handleDrop(index)}
                                            onDragEnd={handleDragEnd}
                                            className={[
                                                'bg-slate-50/50',
                                                draggingIndex === index ? 'opacity-60' : '',
                                                dragOverIndex === index && draggingIndex !== null && draggingIndex !== index ? 'ring-2 ring-blue-200' : '',
                                            ].join(' ')}
                                        >
                                            <td className="px-3 py-3" colSpan={2}>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleGroupCollapsed(groupKey)}
                                                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                                        aria-label={collapsed ? 'Mở rộng hạng mục' : 'Thu gọn hạng mục'}
                                                        title={collapsed ? 'Mở rộng' : 'Thu gọn'}
                                                    >
                                                        {collapsed ? '▸' : '▾'}
                                                    </button>
                                                    <input
                                                        type="text"
                                                        value={line.title}
                                                        onChange={(e) => updateLine(index, 'title', e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-transparent hover:border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg font-bold text-slate-900 bg-transparent transition-all"
                                                        placeholder="TÊN HẠNG MỤC"
                                                    />
                                                    {childrenCount > 0 ? (
                                                        <span className="text-xs text-slate-500 whitespace-nowrap">
                                                            ({childrenCount} mục con)
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3" colSpan={5}>
                                                <button
                                                    type="button"
                                                    onClick={() => addChildLine(index)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-zf-accent bg-zf-bg-secondary rounded-lg hover:bg-zf-accent hover:text-white transition-colors border border-zf-accent/20"
                                                    aria-label="Thêm công việc trong hạng mục này"
                                                >
                                                    + Thêm công việc trong hạng mục này
                                                </button>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openCatalogForGroup(index)}
                                                        className="px-2 py-1 text-xs font-bold text-white bg-zf-accent rounded-md hover:bg-zf-accent-dark transition-colors"
                                                        title="Chọn nhanh dịch vụ từ Master Data cho hạng mục này"
                                                        aria-label="Chọn dịch vụ từ Master Data cho hạng mục này"
                                                    >
                                                        📋
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={importAllFromCatalog}
                                                        className="px-2 py-1 text-xs font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                                                        title="Import tất cả dịch vụ từ Master Data vào bảng đơn giá"
                                                        aria-label="Import tất cả dịch vụ từ Master Data"
                                                    >
                                                        ⚡
                                                    </button>
                                                    <div className="flex flex-col">
                                                        <button
                                                            type="button"
                                                            onClick={() => moveLine(index, 'up')}
                                                            disabled={!canMoveUp(index)}
                                                            aria-label="Di chuyển lên"
                                                            title="Di chuyển lên"
                                                            className="px-2 py-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 rounded-md hover:bg-slate-100 transition-all"
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => moveLine(index, 'down')}
                                                            disabled={!canMoveDown(index)}
                                                            aria-label="Di chuyển xuống"
                                                            title="Di chuyển xuống"
                                                            className="px-2 py-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 rounded-md hover:bg-slate-100 transition-all"
                                                        >
                                                            ↓
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLine(index)}
                                                        aria-label="Xóa hạng mục"
                                                        title="Xóa hạng mục"
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <tr
                                        key={index}
                                        draggable
                                        onDragStart={handleDragStart(index)}
                                        onDragOver={handleDragOver(index)}
                                        onDrop={handleDrop(index)}
                                        onDragEnd={handleDragEnd}
                                        className={[
                                            'group hover:bg-blue-50/30 transition-colors',
                                            draggingIndex === index ? 'opacity-60' : '',
                                            dragOverIndex === index && draggingIndex !== null && draggingIndex !== index ? 'ring-2 ring-blue-200' : '',
                                        ].join(' ')}
                                    >
                                        <td
                                            className="px-3 py-3 align-top"
                                            onClick={() => setSelectedLineIndex(index)}
                                        >
                                            <input
                                                type="text"
                                                value={line.itemNo || ''}
                                                onChange={(e) => updateLine(index, 'itemNo', e.target.value)}
                                                className="w-full px-2 py-1.5 border border-transparent border-b-slate-100 group-hover:border-b-blue-100 focus:border-b-blue-500 rounded bg-transparent transition-all outline-none font-bold text-slate-900"
                                                placeholder="1.1"
                                            />
                                        </td>
                                        <td
                                            className="px-3 py-3 align-top"
                                            onClick={() => setSelectedLineIndex(index)}
                                        >
                                            <textarea
                                                value={line.title}
                                                onChange={handleTitleChange(index)}
                                                rows={1}
                                                className="w-full px-2 py-1.5 border border-transparent border-b-slate-100 group-hover:border-b-blue-100 focus:border-b-blue-500 rounded bg-transparent transition-all outline-none text-slate-900 font-medium resize-none whitespace-pre-wrap min-h-[40px]"
                                                placeholder="Nội dung công việc..."
                                            />
                                        </td>
                                        <td
                                            className="px-3 py-3"
                                            onClick={() => setSelectedLineIndex(index)}
                                        >
                                            <select
                                                value={line.priceType || 'fixed'}
                                                onChange={(e) => updateLine(index, 'priceType', e.target.value)}
                                                className="w-full px-2 py-1.5 bg-transparent border border-transparent border-b-slate-100 focus:border-b-blue-500 rounded transition-all outline-none text-xs font-semibold text-slate-600"
                                            >
                                                <option value="fixed">Đơn giá cố định</option>
                                                <option value="area">Tính theo m²</option>
                                                <option value="none">Không tính phí</option>
                                            </select>
                                        </td>
                                        <td
                                            className="px-3 py-3"
                                            onClick={() => setSelectedLineIndex(index)}
                                        >
                                            {line.priceType === 'area' ? (
                                                <div className="text-right px-2 py-1.5 text-slate-400 italic text-xs">{totalArea} m²</div>
                                            ) : line.priceType === 'none' ? (
                                                <div className="text-right px-2 py-1.5 text-slate-300">-</div>
                                            ) : (
                                                <input
                                                    type="number"
                                                    value={line.qty || ''}
                                                    onChange={(e) => updateLine(index, 'qty', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                    className="w-full px-2 py-1.5 border border-transparent border-b-slate-100 group-hover:border-b-blue-100 focus:border-b-blue-500 rounded bg-transparent transition-all outline-none text-right text-slate-900 font-bold"
                                                    placeholder="1"
                                                />
                                            )}
                                        </td>
                                        <td
                                            className="px-3 py-3"
                                            onClick={() => setSelectedLineIndex(index)}
                                        >
                                            <input
                                                type="text"
                                                value={line.unit || ''}
                                                disabled={line.priceType === 'none'}
                                                onChange={(e) => updateLine(index, 'unit', e.target.value)}
                                                className="w-full px-2 py-1.5 border border-transparent border-b-slate-100 group-hover:border-b-blue-100 focus:border-b-blue-500 rounded bg-transparent transition-all outline-none text-slate-900 font-medium"
                                                placeholder="m²"
                                            />
                                        </td>
                                        <td className="px-3 py-3">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={line.priceType === 'none' ? '' : (line.unitPrice !== undefined ? formatVND(line.unitPrice) : '')}
                                                disabled={line.priceType === 'none'}
                                                onChange={(e) => updateLine(index, 'unitPrice', parseCurrencyInput(e.target.value))}
                                                className="w-full px-2 py-1.5 border border-transparent border-b-slate-100 group-hover:border-b-blue-100 focus:border-b-blue-500 rounded bg-transparent transition-all outline-none text-right font-bold text-slate-900"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="px-3 py-3 text-right font-bold text-slate-900">
                                            {line.priceType === 'none' ? '-' : formatVND(total)}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1 transition-opacity">
                                                <button
                                                    type="button"
                                                    onMouseDown={() => setDragArmedIndex(index)}
                                                    onMouseUp={() => setDragArmedIndex(null)}
                                                    onMouseLeave={() => setDragArmedIndex(null)}
                                                    title={dragHint}
                                                    aria-label={dragHint}
                                                    className="px-2 py-1 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-all cursor-move select-none"
                                                >
                                                    ☰
                                                </button>
                                                <div className="flex flex-col">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveLine(index, 'up')}
                                                        disabled={!canMoveUp(index)}
                                                        aria-label="Di chuyển lên"
                                                        title="Di chuyển lên"
                                                        className="px-2 py-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 rounded-md hover:bg-slate-100 transition-all"
                                                    >
                                                        ↑
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveLine(index, 'down')}
                                                        disabled={!canMoveDown(index)}
                                                        aria-label="Di chuyển xuống"
                                                        title="Di chuyển xuống"
                                                        className="px-2 py-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 rounded-md hover:bg-slate-100 transition-all"
                                                    >
                                                        ↓
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(index)}
                                                    aria-label="Xóa dòng"
                                                    title="Xóa dòng"
                                                    className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            });
                        })()}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="bg-zf-bg-secondary border border-zf-bg-tertiary rounded-xl p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center text-zf-text-secondary">
                    <span className="font-medium">Tổng trước VAT:</span>
                    <span className="text-xl font-bold text-zf-text-primary">{formatVND(totalBeforeVat)} VNĐ</span>
                </div>

                <div className="flex justify-between items-center gap-4 text-zf-text-secondary">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">VAT:</span>
                        <select
                            value={vatRate?.toString() ?? '0'}
                            onChange={(e) => onVatRateChange(parseFloat(e.target.value))}
                            className="px-3 py-1 border border-zf-bg-tertiary rounded-lg bg-white text-zf-text-primary font-bold"
                        >
                            <option value="0">0%</option>
                            <option value="0.08">8%</option>
                            <option value="0.10">10%</option>
                        </select>
                    </div>
                    <span className="text-xl font-bold text-zf-text-primary">{formatVND(vatAmount)} VNĐ</span>
                </div>

                {/* Profit calculation - chỉ hiển thị trong DataTab, không hiển thị trong Preview */}
                {onProfitRateChange && (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Chi phí Outsource */}
                            <div className="col-span-1 md:col-span-2 lg:col-span-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-yellow-800 uppercase">Chi phí Outsource (Chi tiết)</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newLines = [
                                                ...outsourceLines,
                                                { staffName: '', totalAmount: 0, order: outsourceLines.length }
                                            ];
                                            onOutsourceLinesChange?.(newLines);
                                        }}
                                        className="text-[10px] bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-2 py-1 rounded font-bold transition-colors"
                                    >
                                        + Thêm nhân sự/đơn vị
                                    </button>
                                </div>

                                {outsourceLines.length > 0 ? (
                                    <div className="space-y-2">
                                        {outsourceLines.map((line, idx) => (
                                            <div key={idx} className="flex gap-2 items-start bg-white/50 p-2 rounded-lg border border-yellow-200/50 shadow-sm transition-all hover:bg-white hover:shadow-md">
                                                <div className="flex-[3] space-y-1">
                                                    <select
                                                        value={line.staffName || ''}
                                                        onChange={(e) => {
                                                            const selectedName = e.target.value;
                                                            const staff = outsourceStaffList.find(s => s.name === selectedName);
                                                            const newLines = [...outsourceLines];
                                                            newLines[idx] = {
                                                                ...newLines[idx],
                                                                staffName: selectedName,
                                                                discipline: staff?.discipline || ''
                                                            };
                                                            onOutsourceLinesChange?.(newLines);
                                                        }}
                                                        className="w-full px-3 py-1.5 border border-yellow-300 rounded-lg bg-white text-zf-text-primary text-sm font-medium focus:ring-2 focus:ring-yellow-400/20 outline-none"
                                                    >
                                                        <option value="">-- Chọn nhân sự --</option>
                                                        {outsourceStaffList.map(staff => (
                                                            <option key={staff.id} value={staff.name}>
                                                                {staff.name} {staff.discipline ? `(${staff.discipline})` : ''}
                                                            </option>
                                                        ))}
                                                        {line.staffName && !outsourceStaffList.some(s => s.name === line.staffName) && (
                                                            <option value={line.staffName}>{line.staffName}</option>
                                                        )}
                                                    </select>
                                                    {line.discipline && (
                                                        <div className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100 inline-block">
                                                            Bộ môn: {line.discipline}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={line.totalAmount !== undefined && line.totalAmount !== null ? formatVND(line.totalAmount) : ''}
                                                        onChange={(e) => {
                                                            const val = parseCurrencyInput(e.target.value) || 0;
                                                            const newLines = [...outsourceLines];
                                                            newLines[idx] = { ...newLines[idx], totalAmount: val };
                                                            onOutsourceLinesChange?.(newLines);

                                                            // Also update the aggregated total for legacy compatibility/logic
                                                            const total = newLines.reduce((sum, l) => sum + (l.totalAmount || 0), 0);
                                                            onOutsourceCostChange?.(total);
                                                        }}
                                                        className="w-full px-3 py-1.5 border border-yellow-300 rounded-lg bg-white text-zf-text-primary font-bold text-sm text-right pr-10"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-3 top-1.5 text-[10px] text-gray-400 font-bold">VNĐ</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newLines = outsourceLines.filter((_, i) => i !== idx);
                                                        onOutsourceLinesChange?.(newLines);
                                                        const total = newLines.reduce((sum, l) => sum + (l.totalAmount || 0), 0);
                                                        onOutsourceCostChange?.(total);
                                                    }}
                                                    className="p-1.5 text-yellow-600 hover:text-red-500 hover:bg-red-50 rounded-md transition-all self-center"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        <div className="flex justify-end pt-1 border-t border-yellow-200/50">
                                            <div className="text-xs font-bold text-yellow-800">
                                                TỔNG OUTSOURCE: <span className="text-sm ml-2 text-zf-text-primary">{formatVND(outsourceLines.reduce((sum, l) => sum + (l.totalAmount || 0), 0))} VNĐ</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={outsourceCost !== undefined && outsourceCost !== null ? formatVND(outsourceCost) : ''}
                                            onChange={(e) => onOutsourceCostChange?.(parseCurrencyInput(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-white text-zf-text-primary font-bold text-sm"
                                            placeholder="Nhập tổng phí hoặc thêm chi tiết ở trên"
                                        />
                                        <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">VNĐ</span>
                                    </div>
                                )}
                            </div>

                            {/* Thuế */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-yellow-800 uppercase">Thuế (Tạm tính)</label>
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        value={taxRate !== undefined && taxRate !== null ? Number((taxRate * 100).toFixed(2)) : ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const rate = val ? parseFloat(val) / 100 : 0;
                                            const cost = totalBeforeVat * rate;

                                            if (onUpdateFields) {
                                                onUpdateFields({ taxRate: rate, taxCost: cost });
                                            } else {
                                                onTaxRateChange?.(rate);
                                                onTaxCostChange?.(cost);
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-white text-zf-text-primary font-bold text-sm"
                                        placeholder="0"
                                        step="any"
                                    />
                                    <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">%</span>
                                </div>
                                <div className="flex-1 flex items-center justify-end px-2 py-2 bg-yellow-100/50 rounded-lg border border-yellow-200">
                                    <span className="text-sm font-bold text-zf-text-primary">
                                        {formatVND(totalBeforeVat * (taxRate || 0))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Hoa hồng */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-yellow-800 uppercase">Hoa hồng</label>
                                <select
                                    value={commissionType}
                                    onChange={(e) => onCommissionTypeChange?.(e.target.value as 'direct' | 'percentage')}
                                    className="text-[10px] bg-yellow-100 border-none rounded px-1 font-bold text-yellow-800"
                                >
                                    <option value="percentage">%</option>
                                    <option value="direct">VNĐ</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                {commissionType === 'percentage' ? (
                                    <>
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                value={commissionRate !== undefined && commissionRate !== null ? Number((commissionRate * 100).toFixed(2)) : ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const rate = val ? parseFloat(val) / 100 : 0;
                                                    const cost = totalBeforeVat * rate;

                                                    if (onUpdateFields) {
                                                        onUpdateFields({ commissionRate: rate, commissionCost: cost });
                                                    } else {
                                                        onCommissionRateChange?.(rate);
                                                        onCommissionCostChange?.(cost);
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-white text-zf-text-primary font-bold text-sm"
                                                placeholder="0"
                                                step="any"
                                            />
                                            <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">%</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-2 py-2 bg-yellow-100/50 rounded-lg border border-yellow-200">
                                            <span className="text-sm font-bold text-zf-text-primary">
                                                {formatVND(totalBeforeVat * (commissionRate || 0))}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={commissionCost !== undefined && commissionCost !== 0 ? formatVND(commissionCost) : ''}
                                            onChange={(e) => onCommissionCostChange?.(parseCurrencyInput(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-white text-zf-text-primary font-bold text-sm"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">VNĐ</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lợi nhuận (Profit Rate) */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-yellow-800 uppercase">Lợi nhuận mong muốn</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        value={profitRate !== undefined && profitRate !== null ? Number((profitRate * 100).toFixed(2)) : ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const rate = val ? parseFloat(val) / 100 : 0;
                                            onProfitRateChange?.(rate);
                                        }}
                                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-white text-zf-text-primary font-bold text-sm"
                                        placeholder="0"
                                        step="any"
                                    />
                                    <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">%</span>
                                </div>

                                <div className="flex-1 flex items-center justify-end px-2 py-2 bg-yellow-100/50 rounded-lg border border-yellow-200">
                                    <span className="text-sm font-bold text-zf-text-primary">
                                        {formatVND(totalBeforeVat * (profitRate || 0))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Summary Profit */}
                        <div className="pt-3 border-t border-yellow-200 flex flex-wrap justify-between items-center gap-4">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-yellow-700 font-bold uppercase">Tổng Chi phí</span>
                                    <span className="text-sm font-bold text-zf-error">
                                        {formatVND(
                                            (outsourceCost || 0) +
                                            (totalBeforeVat * (taxRate || 0)) +
                                            (commissionType === 'percentage' ? (totalBeforeVat * (commissionRate || 0)) : (commissionCost || 0))
                                        )} VNĐ
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-yellow-700 font-bold uppercase">Lợi nhuận ròng (Tạm tính)</span>
                                    <span className="text-lg font-black text-green-600">
                                        {formatVND(
                                            totalAfterVat -
                                            ((outsourceCost || 0) +
                                                (totalBeforeVat * (taxRate || 0)) +
                                                (commissionType === 'percentage' ? (totalBeforeVat * (commissionRate || 0)) : (commissionCost || 0)))
                                        )} VNĐ
                                    </span>
                                </div>
                            </div>

                            <div className="px-4 py-2 bg-green-600 text-white rounded-xl shadow-sm">
                                <span className="text-[10px] font-bold block uppercase opacity-80">Tỷ suất lợi nhuận ròng</span>
                                <span className="text-xl font-black">
                                    {totalAfterVat > 0
                                        ? ((totalAfterVat - ((outsourceCost || 0) + (totalBeforeVat * (taxRate || 0)) + (commissionType === 'percentage' ? (totalBeforeVat * (commissionRate || 0)) : (commissionCost || 0)))) / totalAfterVat * 100).toFixed(1)
                                        : '0'}%
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="border-t border-zf-bg-tertiary pt-4 flex justify-between items-center">
                    <span className="text-lg font-bold text-zf-text-primary">TỔNG CỘNG (đã VAT):</span>
                    <span className="text-3xl font-black text-zf-accent">{formatVND(totalAfterVat)} VNĐ</span>
                </div>

                <div className="text-sm text-zf-text-secondary italic bg-white p-3 rounded-lg border border-zf-bg-tertiary">
                    Bằng chữ: <span className="font-bold text-zf-text-primary underline decoration-zf-warning decoration-2 underline-offset-4">{totalInWords}</span>
                </div>
            </div>
        </div >
    );
}
