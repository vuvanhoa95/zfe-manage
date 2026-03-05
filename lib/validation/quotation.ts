import { z } from 'zod';
import {
  QUOTATION_STATUSES,
  type QuotationStatus,
  type QuotationLineInput,
  type PaymentMilestoneInput,
  type OutsourceLineInput,
} from '@/types/quotation';

export const quotationStatusSchema = z.enum(QUOTATION_STATUSES);

// Helper: convert null → undefined for optional fields
const nullToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === null ? undefined : v), schema);

// Helper shortcuts for common nullable-optional patterns
const optStr = () => nullToUndefined(z.string().optional());
const optStrMax = (max: number) => nullToUndefined(z.string().max(max).optional());
const optNum = () => nullToUndefined(z.number().optional());
const optNumNonneg = () => nullToUndefined(z.number().nonnegative().optional());
const optNumPos = () => nullToUndefined(z.number().positive().optional());

export const quotationLineSchema: z.ZodType<QuotationLineInput> = z.object({
  id: nullToUndefined(z.string().uuid().optional()),
  section: optStrMax(255),
  itemNo: optStrMax(50),
  title: z.string().min(1, 'Nội dung công việc không được để trống'),
  qty: optNumPos(),
  unit: optStrMax(50),
  unitPrice: optNumNonneg(),
  priceType: nullToUndefined(z.enum(['fixed', 'area', 'none']).optional()),
  note: optStr(),
  order: z.number().int(),
  isGroupHeader: z.boolean(),
  isChargeable: z.boolean(),
});

export const paymentMilestoneSchema: z.ZodType<PaymentMilestoneInput> = z.object({
  id: nullToUndefined(z.string().uuid().optional()),
  no: z.number().int().positive(),
  title: z.string().min(1, 'Tên đợt thanh toán không được để trống'),
  percent: z.number().min(0).max(100),
  description: optStr(),
  expectedDate: z.preprocess((v) => {
    // Accept: undefined | null | '' | 'YYYY-MM-DD' | ISO string
    if (v === '' || v === null || v === undefined) return undefined;
    return v;
  }, z.coerce.date().optional()),
  order: z.number().int(),
});

export const outsourceLineSchema: z.ZodType<OutsourceLineInput> = z.object({
  id: nullToUndefined(z.string().uuid().optional()),
  staffName: optStr(),
  discipline: optStr(),
  unit: optStr(),
  qty: optNumPos(),
  unitRate: optNumNonneg(),
  note: optStr(),
  order: z.number().int(),
});

export const createQuotationSchema = z
  .object({
    // Basic info
    date: z.coerce.date(),
    location: z.string().min(1, 'Địa điểm không được để trống'),
    customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),

    // Project
    projectId: z.string().min(1, 'Vui lòng chọn dự án'),
    projectName: z.string().min(1, 'Tên dự án không được để trống'),
    projectItem: optStr(),
    projectNotes: optStr(),
    totalArea: optNumPos(),

    // Content
    title: z.string().min(1, 'Tiêu đề báo giá không được để trống'),
    introText: optStr(),
    scopeText: optStr(),
    deliverablesText: z.string().min(1, 'Sản phẩm bàn giao không được để trống'),
    scheduleText: optStr(),

    // Financial
    vatRate: z.number().min(0).max(1),

    // Cost calculation
    outsourceCost: optNumNonneg(),
    outsourceStaff: optStr(),
    outsourceDiscipline: optStr(),
    outsourceRate: optNumNonneg(),
    outsourceNote: optStr(),
    outsourceLines: nullToUndefined(z.array(outsourceLineSchema).optional()),
    taxRate: optNumNonneg(),
    taxCost: optNumNonneg(),
    commissionType: nullToUndefined(z.enum(['direct', 'percentage']).optional()),
    commissionRate: optNumNonneg(),
    commissionCost: optNumNonneg(),
    profitRate: nullToUndefined(z.number().min(0).max(1).optional()), // Tỷ lệ lợi nhuận (0-1, tương đương 0-100%)

    // Status
    status: quotationStatusSchema,
    notes: optStr(),

  // Presentation / UI options (optional)
  theme: nullToUndefined(z.string().trim().max(100).optional()),
  templateId: nullToUndefined(z.string().trim().max(100).optional()),
  media: nullToUndefined(z.array(z.unknown()).optional()),
  sectionOrder: nullToUndefined(z.array(z.string()).optional()),

    // Lines & milestones
    lines: z.array(quotationLineSchema).min(1, 'Báo giá cần ít nhất một dòng công việc'),
    paymentMilestones: z
      .array(paymentMilestoneSchema)
      .min(1, 'Vui lòng cấu hình ít nhất một đợt thanh toán'),
  })
  .superRefine((data, ctx) => {
    // Validate payment milestones sum to ~100%
    const totalPercent = data.paymentMilestones.reduce((sum, m) => sum + m.percent, 0);
    if (Math.abs(totalPercent - 100) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tổng tỉ lệ các đợt thanh toán phải bằng 100%',
        path: ['paymentMilestones'],
      });
    }

    // Ensure there is at least one chargeable line
    const hasChargeableLine = data.lines.some((line) => line.isChargeable);
    if (!hasChargeableLine) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Báo giá cần ít nhất một dòng được tính tiền',
        path: ['lines'],
      });
    }
  });

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;

export function isValidQuotationStatus(status: string): status is QuotationStatus {
  return (QUOTATION_STATUSES as readonly string[]).includes(status);
}
