import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { taskCreateSchema, TASK_PRIORITIES, TASK_STATUSES, type TaskCreateInput } from '@/lib/validation/task';

const taskFilterSchema = z.object({
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    assignee: z.string().trim().optional(),
    // Phase filter sẽ được bật sau khi hoàn tất migrate + regenerate Prisma client
    phase: z.string().trim().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const projectId = resolvedParams.id;

        const { searchParams } = new URL(request.url);
        const parsedFilter = taskFilterSchema.safeParse({
            status: searchParams.get('status') ?? undefined,
            priority: searchParams.get('priority') ?? undefined,
            assignee: searchParams.get('assignee') ?? undefined,
            phase: searchParams.get('phase') ?? undefined,
        });

        if (!parsedFilter.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Tham số lọc danh sách công việc không hợp lệ',
                    details: parsedFilter.error.flatten(),
                },
                { status: 400 },
            );
        }

        const where: { projectId: string; status?: string; priority?: string; assignedTo?: string } = {
            projectId,
        };

        if (parsedFilter.data.status) {
            where.status = parsedFilter.data.status;
        }

        if (parsedFilter.data.priority) {
            where.priority = parsedFilter.data.priority;
        }

        if (parsedFilter.data.assignee) {
            where.assignedTo = parsedFilter.data.assignee;
        }

        // Chỉ select các field cơ bản để tránh lỗi nếu DB chưa có field mới
        const tasks = await prisma.task.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                projectId: true,
                title: true,
                description: true,
                startDate: true,
                endDate: true,
                status: true,
                priority: true,
                progress: true,
                assignedTo: true,
                createdAt: true,
                updatedAt: true,
                // KHÔNG select phase, discipline, location, dueDate để tránh lỗi nếu DB chưa có
                // Sẽ bật lại sau khi DB đã migrate
            },
        });

        return NextResponse.json({ success: true, data: tasks });
    } catch (error) {
        console.error('Failed to fetch tasks:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tải danh sách công việc',
                details: process.env.NODE_ENV === 'development' ? { message: (error as Error).message } : undefined,
            },
            { status: 500 },
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const projectId = resolvedParams.id;
        const rawBody = await request.json();

        const parsed = taskCreateSchema.safeParse(rawBody);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Dữ liệu công việc không hợp lệ', details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const data: TaskCreateInput = parsed.data;

        const task = await prisma.task.create({
            data: {
                projectId,
                title: data.title,
                description: data.description ?? null,
                startDate: data.startDate ? new Date(data.startDate as string | Date) : null,
                endDate: data.endDate ? new Date(data.endDate as string | Date) : null,
                // dueDate, phase, discipline, location sẽ được map sau khi cập nhật Prisma client
                status: data.status,
                priority: data.priority,
                progress: data.progress,
                assignedTo: data.assignedTo ?? null,
            },
        });

        return NextResponse.json({ success: true, data: task }, { status: 201 });
    } catch (error) {
        console.error('Failed to create task:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tạo công việc mới',
                details: process.env.NODE_ENV === 'development' ? { message: (error as Error).message } : undefined,
            },
            { status: 500 },
        );
    }
}
