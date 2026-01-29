import { z } from 'zod';

export const projectBaseSchema = z.object({
    name: z.string().trim().min(1, 'Tên dự án là bắt buộc'),
    code: z.string().trim().max(100).optional().nullable(),
    description: z.string().trim().optional().nullable(),
    customerId: z.string().uuid().optional().nullable(),
    location: z.string().trim().max(255).default('Hà Nội'),
    startDate: z.union([z.string().min(1), z.date()]).optional().nullable(),
    endDate: z.union([z.string().min(1), z.date()]).optional().nullable(),
    totalArea: z.number().nonnegative().optional().nullable(),
    status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
    notes: z.string().trim().optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
});

export const projectCreateSchema = projectBaseSchema.extend({
    createdById: z.string().uuid().optional(),
});

export const projectUpdateSchema = projectBaseSchema.partial().extend({
    name: z.string().trim().min(1, 'Tên dự án là bắt buộc').optional(),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

