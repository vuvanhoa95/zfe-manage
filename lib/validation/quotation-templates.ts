import { z } from 'zod';

export const quotationTemplateLineSchema = z.object({
    section: z.string().trim().max(255).optional().nullable(),
    itemNo: z.string().trim().max(50).optional().nullable(),
    title: z.string().trim().min(1, 'Nội dung công việc không được để trống'),
    qty: z.number().nonnegative().optional().nullable(),
    unit: z.string().trim().max(50).optional().nullable(),
    unitPrice: z.number().nonnegative().optional().nullable(),
    note: z.string().trim().max(1000).optional().nullable(),
    order: z.number().int(),
    isGroupHeader: z.boolean().default(false),
    isChargeable: z.boolean().default(true),
});

export const quotationTemplateMilestoneSchema = z.object({
    no: z.number().int().positive(),
    title: z.string().trim().min(1, 'Tên đợt thanh toán không được để trống'),
    percent: z
        .number()
        .min(0, 'Tỉ lệ không được nhỏ hơn 0%')
        .max(100, 'Tỉ lệ không được lớn hơn 100%'),
    description: z.string().trim().max(1000).optional().nullable(),
    expectedDate: z.union([z.string(), z.date()]).optional().nullable(),
    order: z.number().int(),
});

export const createQuotationTemplateSchema = z.object({
    name: z.string().trim().min(1, 'Tên mẫu không được để trống'),
    code: z.string().trim().max(100).optional().nullable(),
    description: z.string().trim().max(1000).optional().nullable(),
    category: z.string().trim().max(100).optional().nullable(),
    vatRate: z
        .number()
        .min(0, 'Thuế VAT không được nhỏ hơn 0%')
        .max(1, 'Thuế VAT nên để dạng 0.x (ví dụ 0.08 cho 8%)')
        .optional(),
    title: z.string().trim().min(1).optional(),
    introText: z.string().optional().nullable(),
    scopeText: z.string().optional().nullable(),
    deliverablesText: z.string().trim().min(1, 'Sản phẩm bàn giao không được để trống'),
    scheduleText: z.string().optional().nullable(),
    theme: z.string().trim().max(100).optional().nullable(),
    layoutTemplate: z.string().trim().max(50).optional().nullable(),
    lines: z.array(quotationTemplateLineSchema).optional(),
    paymentMilestones: z
        .array(quotationTemplateMilestoneSchema)
        .optional()
        .superRefine((milestones, ctx) => {
            if (!milestones || milestones.length === 0) return;
            const totalPercent = milestones.reduce((sum, m) => sum + m.percent, 0);
            if (Math.abs(totalPercent - 100) > 0.01) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Tổng tỉ lệ các đợt thanh toán trong mẫu phải bằng 100%',
                    path: ['percent'],
                });
            }
        }),
});

export const updateQuotationTemplateSchema = createQuotationTemplateSchema.partial().extend({
    isActive: z.boolean().optional(),
});

