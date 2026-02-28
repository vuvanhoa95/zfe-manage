import type { GroupField, SortOrder, GroupConfig } from '@/components/ui/GroupTool';

export interface GroupedData<T> {
    groupKey: string;
    groupLabel: string;
    items: T[];
}

/**
 * Group và sort dữ liệu theo config
 */
export function groupAndSort<T>(
    items: T[],
    config: GroupConfig | null,
    getFieldValue: (item: T, field: GroupField) => string | number | Date | null | undefined,
    getFieldLabel?: (field: GroupField, value: string | number | Date | null | undefined) => string
): GroupedData<T>[] {
    if (!config || config.field === 'none') {
        // Không group, chỉ sort theo date mặc định hoặc không sort
        const sorted = config?.sortOrder 
            ? sortItems(items, config.sortOrder, (item) =>
                getFieldValue(item, 'date')
            )
            : items;
        return [
            {
                groupKey: 'all',
                groupLabel: 'Tất cả',
                items: sorted,
            },
        ];
    }

    // Group items
    const groups = new Map<string, T[]>();
    
    items.forEach((item) => {
        const value = getFieldValue(item, config.field);
        const groupKey = value?.toString() || 'unknown';
        
        if (!groups.has(groupKey)) {
            groups.set(groupKey, []);
        }
        groups.get(groupKey)!.push(item);
    });

    // Sort items trong mỗi group và tạo grouped array
    const grouped: GroupedData<T>[] = [];
    const groupValues = new Map<string, string | number | Date | null | undefined>();
    
    groups.forEach((groupItems, groupKey) => {
        const sorted = sortItems(groupItems, config.sortOrder, (item) =>
            getFieldValue(item, config.field)
        );
        
        const firstValue = getFieldValue(sorted[0] || null, config.field);
        groupValues.set(groupKey, firstValue);
        
        const groupLabel = getFieldLabel
            ? getFieldLabel(config.field, firstValue)
            : String(firstValue || 'Không xác định');

        grouped.push({
            groupKey,
            groupLabel,
            items: sorted,
        });
    });

    // Sort groups theo giá trị field
    grouped.sort((a, b) => {
        const aValue = groupValues.get(a.groupKey);
        const bValue = groupValues.get(b.groupKey);
        
        return compareValues(aValue, bValue, config.sortOrder);
    });

    return grouped;
}

/**
 * Sort items theo một field
 */
function sortItems<T>(
    items: T[],
    sortOrder: SortOrder,
    getValue: (item: T) => string | number | Date | null | undefined
): T[] {
    return [...items].sort((a, b) => {
        const aValue = getValue(a);
        const bValue = getValue(b);
        return compareValues(aValue, bValue, sortOrder);
    });
}

/**
 * So sánh 2 giá trị
 */
function compareValues(
    a: string | number | Date | null | undefined,
    b: string | number | Date | null | undefined,
    order: SortOrder
): number {
    // Handle null/undefined
    if (a == null && b == null) return 0;
    if (a == null) return order === 'asc' ? 1 : -1;
    if (b == null) return order === 'asc' ? -1 : 1;

    // Handle dates
    if (a instanceof Date && b instanceof Date) {
        const diff = a.getTime() - b.getTime();
        return order === 'asc' ? diff : -diff;
    }

    // Handle numbers
    if (typeof a === 'number' && typeof b === 'number') {
        const diff = a - b;
        return order === 'asc' ? diff : -diff;
    }

    // Handle strings
    const aStr = String(a);
    const bStr = String(b);
    const diff = aStr.localeCompare(bStr, 'vi');
    return order === 'asc' ? diff : -diff;
}

/**
 * Get field value từ quotation item
 */
export function getQuotationFieldValue(
    item: { status?: string; customer?: { name?: string }; date?: Date; projectName?: string },
    field: GroupField
): string | number | Date | null | undefined {
    switch (field) {
        case 'status':
            return item.status || null;
        case 'customer':
            return item.customer?.name || null;
        case 'date':
            return item.date || null;
        case 'project':
            return item.projectName || null;
        default:
            return null;
    }
}

/**
 * Get field label cho quotation
 */
export function getQuotationFieldLabel(
    field: GroupField,
    value: string | number | Date | null | undefined
): string {
    if (value == null) return 'Không xác định';
    
    if (field === 'status') {
        const statusLabels: Record<string, string> = {
            DRAFT: 'Nháp',
            SENT: 'Đã gửi',
            ACCEPTED: 'Khách chấp nhận',
            REJECTED: 'Từ chối',
        };
        return statusLabels[String(value)] || String(value);
    }
    
    if (value instanceof Date) {
        return value.toLocaleDateString('vi-VN');
    }
    
    return String(value);
}

/**
 * Get field value từ project item
 */
export function getProjectFieldValue(
    item: { status?: string; customer?: { name?: string } | null; createdAt?: string; name?: string },
    field: GroupField
): string | number | Date | null | undefined {
    switch (field) {
        case 'status':
            return item.status || null;
        case 'customer':
            return item.customer?.name || null;
        case 'date':
            return item.createdAt ? new Date(item.createdAt) : null;
        case 'project':
            return item.name || null;
        default:
            return null;
    }
}

/**
 * Get field label cho project
 */
export function getProjectFieldLabel(
    field: GroupField,
    value: string | number | Date | null | undefined
): string {
    if (value == null) return 'Không xác định';
    
    if (field === 'status') {
        const statusLabels: Record<string, string> = {
            PLANNING: 'Lập kế hoạch',
            ACTIVE: 'Đang thực hiện',
            COMPLETED: 'Hoàn thành',
            CANCELLED: 'Đã hủy',
        };
        return statusLabels[String(value)] || String(value);
    }
    
    if (value instanceof Date) {
        return value.toLocaleDateString('vi-VN');
    }
    
    return String(value);
}
