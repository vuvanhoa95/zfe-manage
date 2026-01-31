import { Quotation, QuotationLine, PaymentMilestone, Customer, User } from '@prisma/client';

// ============================================
// QUOTATION TYPES
// ============================================

// Trạng thái đơn giản: phù hợp cho 1 người quản lý quy trình
// DRAFT       – Nháp, chưa gửi khách
// SENT        – Đã gửi khách
// ACCEPTED    – Khách chấp nhận
// REJECTED    – Khách từ chối / không theo
export const QUOTATION_STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const;

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export type QuotationWithRelations = Quotation & {
    totalArea: number | null;
    customer: Customer;
    lines: QuotationLine[];
    paymentMilestones: PaymentMilestone[];
    createdBy: Pick<User, 'id' | 'name' | 'email'>;
};

export type QuotationFormData = {
    // Basic info
    date: Date;
    location: string;
    customerId: string;

    // Project
    projectId: string;
    projectName: string;
    projectItem?: string;
    projectNotes?: string;
    totalArea?: number; // Added for 'area' based pricing

    // Content
    title: string;
    introText?: string;
    scopeText?: string;
    deliverablesText: string;
    scheduleText?: string;

    // Financial
    vatRate: number;

    // Cost calculation (internal use, not shown in preview)
    outsourceCost?: number;  // Chi phí outsource
    outsourceStaff?: string; // Nhân sự / đơn vị outsource
    outsourceDiscipline?: string; // Bộ môn / chuyên ngành
    outsourceRate?: number; // Đơn giá outsource (VNĐ)
    outsourceNote?: string; // Ghi chú chi tiết outsource
    outsourceLines?: OutsourceLineInput[]; // Bảng chi tiết chi phí outsource (nhiều dòng)
    taxRate?: number;       // Tỷ lệ thuế (%)
    taxCost?: number;       // Chi phí thuế (tự động tính)
    commissionType?: 'direct' | 'percentage'; // Loại hoa hồng: nhập trực tiếp hoặc tính theo %
    commissionRate?: number; // Tỷ lệ hoa hồng (%)
    commissionCost?: number; // Chi phí hoa hồng
    profitRate?: number;    // Tỷ lệ lợi nhuận (%) - tính trên tổng trước VAT

    // Status  
    status: QuotationStatus;
    notes?: string;

    // Lines
    lines: QuotationLineInput[];

    // Payment milestones
    paymentMilestones: PaymentMilestoneInput[];
};

export type QuotationLineInput = {
    id?: string;
    section?: string;
    itemNo?: string;
    title: string;
    qty?: number;
    unit?: string;
    unitPrice?: number;
    priceType?: 'fixed' | 'area' | 'none'; // Added for ZFENIX logic
    note?: string;
    order: number;
    isGroupHeader: boolean;
    isChargeable: boolean;
};

export type PaymentMilestoneInput = {
    id?: string;
    no: number;
    title: string;
    percent: number;
    description?: string;
    /// YYYY-MM-DD (input type="date") hoặc ISO string từ API
    expectedDate?: string | Date | null;
    order: number;
};

export type OutsourceLineInput = {
    id?: string;
    staffName?: string;
    discipline?: string;
    unit?: string;
    qty?: number;
    unitRate?: number;
    note?: string;
    order: number;
};

// ============================================
// QUOTATION PREVIEW DATA
// ============================================

export type QuotationPreviewData = {
    // Header
    location: string;
    date: {
        day: string;
        month: string;
        year: string;
    };
    title: string;
    introText?: string;

    // Customer & Project
    customer: {
        name: string;
        address?: string;
        taxCode?: string;
    };
    projectName: string;
    projectItem?: string;
    projectNotes?: string;

    // Content
    scopeText?: string;
    deliverablesHtml: string;

    // Pricing
    lines: Array<{
        section?: string;
        itemNo?: string;
        title: string;
        qty?: number;
        unit?: string;
        unitPrice?: number;
        total?: number;
        note?: string;
        isGroupHeader: boolean;
    }>;

    // Totals
    totalBeforeVat: number;
    totalBeforeVatFormatted: string;
    vatRate: number;
    vatAmount: number;
    vatAmountFormatted: string;
    totalAfterVat: number;
    totalAfterVatFormatted: string;
    totalInWords: string;

    // Schedule & Payment
    scheduleText?: string;
    paymentMilestones: Array<{
        no: number;
        title: string;
        percent: number;
        description?: string;
    }>;

    // Company & Signature
    company: {
        name: string;
        address: string;
        taxCode: string;
        email: string;
        website?: string;
        phone: string;
        logoUrl?: string;
        projectSlogan?: string;
        signerName: string;
        signerTitle: string;
    };

    quotationNo: string;
};

// ============================================
// DASHBOARD STATS
// ============================================

export type DashboardStats = {
    totalQuotations: number;
    quotationsByStatus: {
        draft: number;
        sent: number;
        accepted: number;
        rejected: number;
    };
    projectedRevenue: {
        beforeVat: number;
        afterVat: number;
    };
    costs: {
        outsource: number;
        tax: number;
        commission: number;
        total: number;
    };
    profit: {
        amount: number;
        margin: number;
    };
    monthlyChartData: Array<{
        month: string;
        label: string;
        revenue: number;
        costs: number;
        profit: number;
        count: number;
    }>;
    recentQuotations: Array<{
        id: string;
        quotationNo: string;
        customer: string;
        projectName: string;
        totalAfterVat: number;
        status: QuotationStatus;
        date: Date;
    }>;
};

// ============================================
// API RESPONSE TYPES
// ============================================

export type ApiResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
};

export type PaginatedResponse<T> = {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
};

// ============================================
// FILTER & SEARCH TYPES
// ============================================

export type QuotationFilters = {
    status?: QuotationStatus;
    customerId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
};

export type QuotationListItem = {
    id: string;
    quotationNo: string;
    date: Date;
    customer: {
        id: string;
        name: string;
    };
    projectName: string;
    totalBeforeVat: number;
    totalAfterVat: number;
    status: QuotationStatus;
    updatedAt: Date;
};
