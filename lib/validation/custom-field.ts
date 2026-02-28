import { z } from 'zod';

export const CUSTOM_FIELD_ENTITY_TYPES = ['PROJECT', 'TASK'] as const;
export const CUSTOM_FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT', 'BOOLEAN'] as const;

export type CustomFieldEntityType = (typeof CUSTOM_FIELD_ENTITY_TYPES)[number];
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export const customFieldBaseSchema = z.object({
    name: z.string().trim().min(1, 'Tên trường không được để trống'),
    key: z
        .string()
        .trim()
        .min(1, 'Mã trường không được để trống')
        .regex(/^[a-zA-Z0-9_\-]+$/, 'Mã trường chỉ được chứa chữ, số, gạch dưới và gạch ngang'),
    description: z.string().trim().max(500).optional().or(z.literal('')),
    entityType: z.enum(CUSTOM_FIELD_ENTITY_TYPES),
    fieldType: z.enum(CUSTOM_FIELD_TYPES),
    group: z.string().trim().max(100).optional().or(z.literal('')),
    sortOrder: z.number().int().min(0).optional(),
    isRequired: z.boolean().optional(),
    isActive: z.boolean().optional(),
});

export const customFieldOptionSchema = z.object({
    id: z.string().uuid().optional(),
    label: z.string().trim().min(1, 'Nhãn tuỳ chọn không được để trống'),
    value: z.string().trim().optional().or(z.literal('')),
    color: z.string().trim().optional().or(z.literal('')),
    sortOrder: z.number().int().min(0).optional(),
    _deleted: z.boolean().optional(),
});

export const customFieldCreateSchema = customFieldBaseSchema.extend({
    options: z
        .array(customFieldOptionSchema)
        .max(200, 'Tối đa 200 tuỳ chọn cho một trường')
        .optional(),
}).superRefine((data, ctx) => {
    if ((data.fieldType === 'SELECT' || data.fieldType === 'MULTI_SELECT') && (!data.options || data.options.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Trường chọn danh sách phải có ít nhất một tuỳ chọn',
            path: ['options'],
        });
    }
});

export const customFieldUpdateSchema = z
    .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1, 'Tên trường không được để trống').optional(),
        key: z
            .string()
            .trim()
            .min(1, 'Mã trường không được để trống')
            .regex(/^[a-zA-Z0-9_\-]+$/, 'Mã trường chỉ được chứa chữ, số, gạch dưới và gạch ngang')
            .optional(),
        description: z.string().trim().max(500).optional().or(z.literal('')),
        entityType: z.enum(CUSTOM_FIELD_ENTITY_TYPES).optional(),
        fieldType: z.enum(CUSTOM_FIELD_TYPES).optional(),
        group: z.string().trim().max(100).optional().or(z.literal('')),
        sortOrder: z.number().int().min(0).optional(),
        isRequired: z.boolean().optional(),
        isActive: z.boolean().optional(),
        options: z
            .array(customFieldOptionSchema)
            .max(200, 'Tối đa 200 tuỳ chọn cho một trường')
            .optional(),
    })
    .superRefine((data, ctx) => {
        // Chỉ enforce khi user đang set fieldType sang SELECT/MULTI_SELECT
        if (data.fieldType === 'SELECT' || data.fieldType === 'MULTI_SELECT') {
            const alive = (data.options ?? []).filter((o) => !o._deleted && (o.label ?? '').trim().length > 0);
            if (alive.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Trường chọn danh sách phải có ít nhất một tuỳ chọn',
                    path: ['options'],
                });
            }
        }
    });

export type CustomFieldCreateInput = z.infer<typeof customFieldCreateSchema>;
export type CustomFieldUpdateInput = z.infer<typeof customFieldUpdateSchema>;

export const customFieldValueUpsertSchema = z.object({
    entityType: z.enum(CUSTOM_FIELD_ENTITY_TYPES),
    entityId: z.string().trim().min(1, 'Thiếu ID đối tượng áp dụng'),
    /// Giá trị theo từng trường – gửi dạng map: { [customFieldId]: value }
    values: z.record(
        z.string().uuid(),
        z.union([
            z.string(),
            z.number(),
            z.boolean(),
            z.array(z.string()),
            z.null(),
        ]),
    ),
});

export type CustomFieldValueUpsertInput = z.infer<typeof customFieldValueUpsertSchema>;

