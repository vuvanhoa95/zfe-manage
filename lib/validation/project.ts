import { z } from 'zod';

// Helper to transform empty strings to null
const emptyStringToNull = <T extends z.ZodTypeAny>(schema: T) =>
    z.preprocess((val) => (val === '' ? null : val), schema);

export const projectBaseSchema = z.object({
    name: z.string().trim().min(1, 'Tên dự án là bắt buộc'),
    code: emptyStringToNull(z.string().trim().max(100).optional().nullable()),
    description: emptyStringToNull(z.string().trim().optional().nullable()),
    customerId: emptyStringToNull(
        z
            .string()
            .uuid('ID khách hàng không hợp lệ')
            .optional()
            .nullable()
    ),
    location: z.string().trim().max(255).default('Hà Nội'),
    startDate: emptyStringToNull(z.union([z.string().min(1), z.date()]).optional().nullable()),
    endDate: emptyStringToNull(z.union([z.string().min(1), z.date()]).optional().nullable()),
    totalArea: z.preprocess(
        (val) => {
            if (val === null || val === undefined || val === '') return null;
            if (typeof val === 'string') {
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
            }
            return val;
        },
        z.number().nonnegative().optional().nullable()
    ),
    status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
    notes: emptyStringToNull(z.string().trim().optional().nullable()),
    imageUrl: emptyStringToNull(
        z
            .string()
            .url('URL hình ảnh không hợp lệ')
            .optional()
            .nullable()
    ),
});

export const projectCreateSchema = projectBaseSchema.extend({
    createdById: z.string().uuid().optional(),
});

export const projectUpdateSchema = projectBaseSchema.partial().extend({
    name: z.string().trim().min(1, 'Tên dự án là bắt buộc').optional(),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

