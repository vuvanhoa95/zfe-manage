import { z } from 'zod';

export const customerBaseSchema = z.object({
    name: z.string().trim().min(1, 'Tên khách hàng là bắt buộc'),
    taxCode: z.string().trim().max(50).optional().nullable(),
    address: z.string().trim().max(500).optional().nullable(),
    location: z.string().trim().max(255).optional().nullable(),
    contactName: z.string().trim().max(255).optional().nullable(),
    email: z.string().trim().email('Email không hợp lệ').optional().nullable(),
    phone: z.string().trim().max(50).optional().nullable(),
});

export const customerCreateSchema = customerBaseSchema;

export const customerUpdateSchema = customerBaseSchema.partial().extend({
    name: z.string().trim().min(1, 'Tên khách hàng là bắt buộc').optional(),
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

