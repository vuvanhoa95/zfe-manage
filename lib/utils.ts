import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Generate next quotation number
 * Format: BG-YYYY-####
 */
export function generateQuotationNumber(lastNumber: string | null, year?: number): string {
    const currentYear = year || new Date().getFullYear();

    if (!lastNumber) {
        return `BG-${currentYear}-0001`;
    }

    // Parse last number
    const parts = lastNumber.split('-');
    if (parts.length !== 3) {
        return `BG-${currentYear}-0001`;
    }

    const lastYear = parseInt(parts[1]);
    const lastSeq = parseInt(parts[2]);

    // If year changed, reset to 0001
    if (lastYear !== currentYear) {
        return `BG-${currentYear}-0001`;
    }

    // Increment sequence
    const nextSeq = lastSeq + 1;
    return `BG-${currentYear}-${nextSeq.toString().padStart(4, '0')}`;
}

/**
 * Calculate quotation totals
 */
export function calculateQuotationTotals(
    lines: Array<{
        qty?: number | null;
        unitPrice?: number | null;
        isChargeable: boolean;
        priceType?: 'fixed' | 'area' | 'none';
    }>,
    vatRate: number,
    totalArea: number = 0
) {
    const totalBeforeVat = lines.reduce((sum, line) => {
        if (!line.isChargeable) return sum;
        if (line.priceType === 'none') return sum;

        const unitPrice = line.unitPrice ?? 0;

        if (line.priceType === 'area') {
            return sum + (totalArea * unitPrice);
        }

        // Default to fixed (legacy or explicit)
        const qty = line.qty ?? 1;
        return sum + (qty * unitPrice);
    }, 0);

    const vatAmount = totalBeforeVat * vatRate;
    const totalAfterVat = totalBeforeVat + vatAmount;

    return {
        totalBeforeVat,
        vatAmount,
        totalAfterVat
    };
}

function formatNumberVi(value: number): string {
    if (!Number.isFinite(value)) return '';
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export type QuotationLineContext = {
    projectName?: string;
    projectItem?: string;
    totalArea?: number;
};

const PROJECT_CONTEXT_MARKER = '[ZFENIX_PROJECT_CONTEXT]';

export function enrichQuotationLinesWithProjectContext<
    TLine extends { title: string; isGroupHeader: boolean; isChargeable: boolean }
>(lines: TLine[], context: QuotationLineContext): TLine[] {
    const projectName = (context.projectName || '').trim();
    const projectItem = (context.projectItem || '').trim();
    const totalArea = typeof context.totalArea === 'number' ? context.totalArea : undefined;

    if (!projectName) return lines;

    const ctxParts: string[] = [`Dự án: ${projectName}${projectItem ? ` – ${projectItem}` : ''}`];
    if (typeof totalArea === 'number' && Number.isFinite(totalArea) && totalArea > 0) {
        ctxParts.push(`Diện tích: ${formatNumberVi(totalArea)} m²`);
    }

    const contextSuffix = ` ${PROJECT_CONTEXT_MARKER} (${ctxParts.join('; ')})`;

    return lines.map((line) => {
        if (line.isGroupHeader) return line;
        if (!line.isChargeable) return line;
        if (!line.title || !line.title.trim()) return line;

        // Don't overwrite user-edited titles; only enrich once via marker.
        if (line.title.includes(PROJECT_CONTEXT_MARKER)) return line;

        // If the title already contains the project name (user manually added), don't append marker.
        if (line.title.toLowerCase().includes(projectName.toLowerCase())) return line;

        return {
            ...line,
            title: `${line.title.trim()}${contextSuffix}`,
        };
    });
}

/**
 * Validate payment milestones sum to 100%
 */
export function validatePaymentMilestones(milestones: Array<{ percent: number }>): boolean {
    const total = milestones.reduce((sum, m) => sum + m.percent, 0);
    return Math.abs(total - 100) < 0.01; // Allow small floating point errors
}

/**
 * Format date to Vietnamese format
 */
export function formatVietnameseDate(date: Date): {
    day: string;
    month: string;
    year: string;
    full: string;
} {
    const d = new Date(date);
    const day = d.getDate().toString();
    const month = (d.getMonth() + 1).toString();
    const year = d.getFullYear().toString();

    return {
        day,
        month,
        year,
        full: `${day}/${month}/${year}`
    };
}
