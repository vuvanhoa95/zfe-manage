import { z } from 'zod';

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'DELAYED'] as const;
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

const baseTaskSchema = z.object({
    title: z.string().trim().min(1, 'Tên công việc là bắt buộc'),
    description: z
        .string()
        .trim()
        .max(2000, 'Mô tả tối đa 2000 ký tự')
        .optional()
        .nullable(),
    startDate: z
        .union([z.string().min(1), z.date()])
        .optional()
        .nullable(),
    endDate: z
        .union([z.string().min(1), z.date()])
        .optional()
        .nullable(),
    status: z.enum(TASK_STATUSES).default('TODO'),
    priority: z.enum(TASK_PRIORITIES).default('MEDIUM'),
    progress: z
        .number()
        .int()
        .min(0, 'Tiến độ phải từ 0%')
        .max(100, 'Tiến độ tối đa 100%')
        .default(0),
    assignedTo: z
        .string()
        .trim()
        .max(255, 'Tên người phụ trách tối đa 255 ký tự')
        .optional()
        .nullable(),
});

export const taskCreateSchema = baseTaskSchema;

export const taskUpdateSchema = baseTaskSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    {
        message: 'Yêu cầu phải có ít nhất một trường cần cập nhật',
    },
);

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

