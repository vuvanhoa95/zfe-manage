import { z } from 'zod';

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'DELAYED'] as const;
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

// Chuyển chuỗi rỗng/thừa khoảng trắng thành null để khớp với form UI
const normalizeEmptyString = <T extends z.ZodTypeAny>(schema: T) =>
    z.preprocess((val) => {
        if (typeof val === 'string' && val.trim() === '') {
            return null;
        }
        return val;
    }, schema);

const baseTaskSchema = z.object({
    title: z.string().trim().min(1, 'Tên công việc là bắt buộc'),
    description: z
        .string()
        .trim()
        .max(2000, 'Mô tả tối đa 2000 ký tự')
        .optional()
        .nullable(),
    startDate: normalizeEmptyString(
        z
            .union([z.string().min(1), z.date()])
            .optional()
            .nullable(),
    ),
    endDate: normalizeEmptyString(
        z
            .union([z.string().min(1), z.date()])
            .optional()
            .nullable(),
    ),
    dueDate: normalizeEmptyString(
        z
            .union([z.string().min(1), z.date()])
            .optional()
            .nullable(),
    ),
    status: z.enum(TASK_STATUSES).default('TODO'),
    priority: z.enum(TASK_PRIORITIES).default('MEDIUM'),
    progress: z
        .number()
        .int()
        .min(0, 'Tiến độ phải từ 0%')
        .max(100, 'Tiến độ tối đa 100%')
        .default(0),
    assignedTo: normalizeEmptyString(
        z
            .string()
            .trim()
            .max(255, 'Tên người phụ trách tối đa 255 ký tự')
            .optional()
            .nullable(),
    ),
    phase: normalizeEmptyString(
        z
            .string()
            .trim()
            .max(100, 'Giai đoạn tối đa 100 ký tự')
            .optional()
            .nullable(),
    ),
    // Cho phép nhập tự do (ví dụ: "Kiến trúc, Kết cấu, MEP...") thay vì enum cứng
    discipline: normalizeEmptyString(
        z
            .string()
            .trim()
            .max(100, 'Bộ môn tối đa 100 ký tự')
            .optional()
            .nullable(),
    ),
    location: normalizeEmptyString(
        z
            .string()
            .trim()
            .max(255, 'Vị trí tối đa 255 ký tự')
            .optional()
            .nullable(),
    ),
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

