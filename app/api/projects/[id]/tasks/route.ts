import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
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

async function ensureTaskSchema() {
    // Tạo bảng tasks và index tối thiểu nếu chưa tồn tại (Postgres)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "tasks" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "projectId" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "description" TEXT,
            "startDate" TIMESTAMP,
            "endDate" TIMESTAMP,
            "dueDate" TIMESTAMP,
            "status" TEXT NOT NULL DEFAULT 'TODO',
            "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
            "progress" INTEGER NOT NULL DEFAULT 0,
            "assignedTo" TEXT,
            "phase" TEXT,
            "discipline" TEXT,
            "location" TEXT,
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS "tasks_projectId_idx" ON "tasks"("projectId");
        CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks"("status");
        CREATE INDEX IF NOT EXISTS "tasks_priority_idx" ON "tasks"("priority");
        CREATE INDEX IF NOT EXISTS "tasks_assignedTo_idx" ON "tasks"("assignedTo");
        CREATE INDEX IF NOT EXISTS "tasks_phase_idx" ON "tasks"("phase");
        CREATE INDEX IF NOT EXISTS "tasks_dueDate_idx" ON "tasks"("dueDate");
    `);
}

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
        let tasks;
        try {
            tasks = await prisma.task.findMany({
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
        } catch (innerError) {
            // Nếu bảng/column tasks chưa tồn tại (ví dụ mới deploy, chưa migrate),
            // tự tạo schema tối thiểu rồi thử lại một lần.
            if (
                innerError instanceof Prisma.PrismaClientKnownRequestError &&
                (innerError.code === 'P2021' || innerError.code === 'P2022')
            ) {
                console.warn('Task schema missing on GET, attempting to create tasks table on-the-fly...');
                await ensureTaskSchema();

                tasks = await prisma.task.findMany({
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
                    },
                });
            } else {
                throw innerError;
            }
        }

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

        let task;
        try {
            task = await prisma.task.create({
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
        } catch (innerError) {
            // Nếu bảng/column chưa tồn tại, tự động tạo schema tối thiểu rồi thử lại một lần
            if (
                innerError instanceof Prisma.PrismaClientKnownRequestError &&
                (innerError.code === 'P2021' || innerError.code === 'P2022')
            ) {
                console.warn('Task schema missing, attempting to create tasks table on-the-fly...');
                await ensureTaskSchema();

                task = await prisma.task.create({
                    data: {
                        projectId,
                        title: data.title,
                        description: data.description ?? null,
                        startDate: data.startDate ? new Date(data.startDate as string | Date) : null,
                        endDate: data.endDate ? new Date(data.endDate as string | Date) : null,
                        status: data.status,
                        priority: data.priority,
                        progress: data.progress,
                        assignedTo: data.assignedTo ?? null,
                    },
                });
            } else {
                throw innerError;
            }
        }

        return NextResponse.json({ success: true, data: task }, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to create task:', error);

        let message = 'Không thể tạo công việc mới';
        let code: string | undefined;

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            code = error.code;

            // Lỗi khóa ngoại: projectId không tồn tại
            if (error.code === 'P2003') {
                message = 'Không thể tạo công việc vì dự án không tồn tại hoặc đã bị xóa.';
            } else if (error.code === 'P2021' || error.code === 'P2022') {
                // Lỗi bảng/column chưa tồn tại (chưa migrate DB)
                message =
                    'Cơ sở dữ liệu chưa được cập nhật cho module công việc (tasks). Vui lòng chạy migrate database.';
            } else {
                // Các lỗi Prisma khác: expose thông điệp để dễ debug
                message = error.message;
            }
        } else if (error instanceof Error && error.message) {
            // Surface message thật để dễ debug trên môi trường production
            message = error.message;
        } else if (typeof error === 'object' && error !== null) {
            message = JSON.stringify(error);
        } else if (typeof error === 'string') {
            message = error;
        }

        return NextResponse.json(
            {
                success: false,
                error: message,
                code,
                details:
                    process.env.NODE_ENV === 'development'
                        ? { message: (error as Error | undefined)?.message }
                        : undefined,
            },
            { status: 500 },
        );
    }
}
