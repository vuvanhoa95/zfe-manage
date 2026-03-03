import { z } from 'zod';

// Helper to transform empty strings to null
const emptyStringToNull = <T extends z.ZodTypeAny>(schema: T) =>
    z.preprocess((val) => (val === '' ? null : val), schema);

// Helper to validate UUID and convert invalid values to null
const optionalUuid = () =>
    z.preprocess(
        (val) => {
            if (val === null || val === undefined || val === '') return null;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                if (!trimmed) return null;
                // Try to validate as UUID, if invalid return null
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                return uuidRegex.test(trimmed) ? trimmed : null;
            }
            return null;
        },
        z.union([z.string().uuid(), z.null()]).optional().nullable()
    );

// Helper to validate URL and convert invalid values to null
const optionalUrl = () =>
    z.preprocess(
        (val) => {
            if (val === null || val === undefined || val === '') return null;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                if (!trimmed) return null;
                try {
                    // Try to validate as URL, if invalid return null
                    new URL(trimmed);
                    return trimmed;
                } catch {
                    // If it's a relative path (starts with /), allow it
                    if (trimmed.startsWith('/')) {
                        return trimmed;
                    }
                    return null;
                }
            }
            return null;
        },
        z.union([z.string(), z.null()]).optional().nullable()
    );

export const projectBaseSchema = z.object({
    name: z.string().trim().min(1, 'Tên dự án là bắt buộc'),
    code: emptyStringToNull(z.string().trim().max(100).optional().nullable()),
    description: emptyStringToNull(z.string().trim().optional().nullable()),
    customerId: optionalUuid(),
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
    imageUrl: optionalUrl(),
    /// Danh sách giai đoạn (JSON array string)
    phases: emptyStringToNull(z.string().trim().optional().nullable()),
    /// Danh sách bộ môn (JSON array string)
    disciplines: emptyStringToNull(z.string().trim().optional().nullable()),
    /// Danh sách khu vực (JSON array string)
    areas: emptyStringToNull(z.string().trim().optional().nullable()),
});


export const projectCreateSchema = projectBaseSchema.extend({
    createdById: z.string().uuid().optional(),
    projectYear: z.number().int().min(2000).max(2100).optional().nullable(),
});

export const projectUpdateSchema = projectBaseSchema.partial().extend({
    name: z.string().trim().min(1, 'Tên dự án là bắt buộc').optional(),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

