import { z } from 'zod';
import {
  QUOTATION_STATUSES,
  type QuotationStatus,
  type QuotationLineInput,
  type PaymentMilestoneInput,
  type OutsourceLineInput,
} from '@/types/quotation';

export const quotationStatusSchema = z.enum(QUOTATION_STATUSES);

export const quotationLineSchema: z.ZodType<QuotationLineInput> = z.object({
  id: z.string().uuid().optional(),
  section: z.string().max(255).optional(),
  itemNo: z.string().max(50).optional(),
  title: z.string().min(1, 'Nội dung công việc không được để trống'),
  qty: z.number().positive().optional(),
  unit: z.string().max(50).optional(),
  unitPrice: z.number().nonnegative().optional(),
  priceType: z.enum(['fixed', 'area', 'none']).optional(),
  note: z.string().optional(),
  order: z.number().int(),
  isGroupHeader: z.boolean(),
  isChargeable: z.boolean(),
});

export const paymentMilestoneSchema: z.ZodType<PaymentMilestoneInput> = z.object({
  id: z.string().uuid().optional(),
  no: z.number().int().positive(),
  title: z.string().min(1, 'Tên đợt thanh toán không được để trống'),
  percent: z.number().min(0).max(100),
  description: z.string().optional(),
  expectedDate: z.preprocess((v) => {
    // Accept: undefined | null | '' | 'YYYY-MM-DD' | ISO string
    if (v === '' || v === null || v === undefined) return undefined;
    return v;
  }, z.coerce.date().optional()),
  order: z.number().int(),
});

export const outsourceLineSchema: z.ZodType<OutsourceLineInput> = z.object({
  id: z.string().uuid().optional(),
  staffName: z.string().optional(),
  discipline: z.string().optional(),
  unit: z.string().optional(),
  qty: z.number().positive().optional(),
  unitRate: z.number().nonnegative().optional(),
  note: z.string().optional(),
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
    projectItem: z.string().optional(),
    projectNotes: z.string().optional(),
    totalArea: z.number().positive().optional(),

    // Content
    title: z.string().min(1, 'Tiêu đề báo giá không được để trống'),
    introText: z.string().optional(),
    scopeText: z.string().optional(),
    deliverablesText: z.string().min(1, 'Sản phẩm bàn giao không được để trống'),
    scheduleText: z.string().optional(),

    // Financial
    vatRate: z.number().min(0).max(1),

    // Cost calculation
    outsourceCost: z.number().nonnegative().optional(),
    outsourceStaff: z.string().optional(),
    outsourceDiscipline: z.string().optional(),
    outsourceRate: z.number().nonnegative().optional(),
    outsourceNote: z.string().optional(),
    outsourceLines: z.array(outsourceLineSchema).optional(),
    taxRate: z.number().nonnegative().optional(),
    taxCost: z.number().nonnegative().optional(),
    commissionType: z.enum(['direct', 'percentage']).optional(),
    commissionRate: z.number().nonnegative().optional(),
    commissionCost: z.number().nonnegative().optional(),

    // Status
    status: quotationStatusSchema,
    notes: z.string().optional(),

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

