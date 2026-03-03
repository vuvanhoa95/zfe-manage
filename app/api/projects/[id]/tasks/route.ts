import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { taskCreateSchema, TASK_PRIORITIES, TASK_STATUSES, type TaskCreateInput } from '@/lib/validation/task';
import { ensureCoreSchema, isMissingTableError } from '@/lib/db-schema';

async function resolveAssignedToId(input: { assignedToId?: string | null; assignedTo?: string | null }): Promise<string | null> {
    const direct = (input.assignedToId ?? '').trim();
    if (direct) {
        // Validate UUID format
        if (isUuid(direct)) {
            // Verify user exists
            const user = await prisma.user.findUnique({
                where: { id: direct },
                select: { id: true },
            });
            return user?.id ?? null;
        }
        // Nếu không phải UUID hợp lệ, trả về null
        return null;
    }

    const name = (input.assignedTo ?? '').trim();
    if (!name) return null;

    const user = await prisma.user.findFirst({
        where: { name },
        select: { id: true },
    });

    return user?.id ?? null;
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const taskFilterSchema = z.object({
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    assignee: z.string().trim().optional(),
    // Phase filter sẽ được bật sau khi hoàn tất migrate + regenerate Prisma client
    phase: z.string().trim().optional(),
});

async function ensureTaskSchema() {
    // Delegate to the centralized schema helper (PostgreSQL-compatible)
    await ensureCoreSchema();
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

        const where: { projectId: string; status?: string; priority?: string; assignedToId?: string } = {
            projectId,
        };

        if (parsedFilter.data.status) {
            where.status = parsedFilter.data.status;
        }

        if (parsedFilter.data.priority) {
            where.priority = parsedFilter.data.priority;
        }

        if (parsedFilter.data.assignee) {
            const rawAssignee = parsedFilter.data.assignee.trim();
            if (rawAssignee) {
                if (isUuid(rawAssignee)) {
                    where.assignedToId = rawAssignee;
                } else {
                    const user = await prisma.user.findFirst({
                        where: { name: rawAssignee },
                        select: { id: true },
                    });
                    if (user?.id) {
                        where.assignedToId = user.id;
                    } else {
                        // Không tìm thấy user theo tên → trả về rỗng để UI không bị 500
                        return NextResponse.json({ success: true, data: [] });
                    }
                }
            }
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
                    assignedToId: true,
                    assignee: { select: { name: true } },
                    parentId: true,
                    createdAt: true,
                    updatedAt: true,
                    // KHÔNG select phase, discipline, location, dueDate để tránh lỗi nếu DB chưa có
                    // Sẽ bật lại sau khi DB đã migrate
                },
            });
        } catch (innerError) {
            // Nếu Prisma Client đang cũ (chưa có parentId) thì fallback về select không có parentId
            if (innerError instanceof Error && /Unknown argument [`'"]parentId[`'"]/.test(innerError.message)) {
                console.warn('Prisma Client missing parentId on GET, falling back to query without parentId...');
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
                        assignedToId: true,
                        assignee: { select: { name: true } },
                        createdAt: true,
                        updatedAt: true,
                    },
                });
            } else
            // Nếu bảng/column tasks chưa tồn tại (ví dụ mới deploy, chưa migrate),
            // tự tạo schema tối thiểu rồi thử lại một lần.
            if (
                typeof (innerError as any)?.code === 'string' &&
                ((innerError as any).code === 'P2021' || (innerError as any).code === 'P2022')
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
                        assignedToId: true,
                        assignee: { select: { name: true } },
                        parentId: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });
            } else {
                throw innerError;
            }
        }

        const tasksWithAssignedTo = tasks.map((t: any) => ({
            ...t,
            // Backward compatible for UI cũ
            assignedTo: t.assignee?.name ?? null,
        }));

        return NextResponse.json({ success: true, data: tasksWithAssignedTo });
    } catch (error) {
        console.error('Failed to fetch tasks:', error);

        // Fallback mềm cho Dashboard: nếu lỗi truy vấn tasks, trả về danh sách rỗng thay vì 500
        // để không chặn toàn bộ màn hình Dashboard công việc.
        return NextResponse.json(
            {
                success: true,
                data: [],
                warning:
                    process.env.NODE_ENV === 'development'
                        ? (error instanceof Error ? error.message : 'Unknown error')
                        : 'Đã xảy ra lỗi khi tải danh sách công việc, hệ thống tạm thời hiển thị danh sách rỗng.',
            },
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        // Đảm bảo schema tồn tại trước khi thao tác với database
        await ensureCoreSchema();

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

        // Debug logging (chỉ trong development)
        if (process.env.NODE_ENV === 'development') {
            console.log('[API] Creating task with data:', {
                assignedToId: rawBody.assignedToId,
                assignedTo: rawBody.assignedTo,
                parsedAssignedToId: parsed.data?.assignedToId,
            });
        }
        
        const data: TaskCreateInput = parsed.data;
        const assignedToId = await resolveAssignedToId({
            assignedToId: data.assignedToId ?? null,
            assignedTo: data.assignedTo ?? null,
        });
        
        // Debug logging (chỉ trong development)
        if (process.env.NODE_ENV === 'development') {
            console.log('[API] Resolved assignedToId:', assignedToId);
        }

        let task;
        try {
            // Sử dụng transaction để đảm bảo atomicity
            task = await prisma.$transaction(async (tx) => {
                const created = await tx.task.create({
                    data: {
                        projectId,
                        title: data.title.trim(),
                        description: data.description?.trim() || null,
                        startDate: data.startDate ? new Date(data.startDate as string | Date) : null,
                        endDate: data.endDate ? new Date(data.endDate as string | Date) : null,
                        // dueDate, phase, discipline, location sẽ được map sau khi cập nhật Prisma client
                        status: data.status,
                        priority: data.priority,
                        progress: data.progress,
                        assignedToId: assignedToId ?? null,
                        parentId: data.parentId ?? null,
                        order: 0,
                    },
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
                        assignedToId: true,
                        assignee: { select: { name: true } },
                        parentId: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });

                // Verify ngay trong transaction để đảm bảo data được commit
                const verify = await tx.task.findUnique({
                    where: { id: created.id },
                    select: { id: true, title: true },
                });

                if (!verify) {
                    throw new Error('Task was created but cannot be verified in database');
                }

                return created;
            });

            // Log success sau khi transaction commit thành công
            if (process.env.NODE_ENV === 'development') {
                console.log('[API] Task created and verified successfully:', {
                    id: task.id,
                    title: task.title,
                    projectId: task.projectId,
                });
            }
        } catch (innerError: any) {
            // Log error để debug
            if (process.env.NODE_ENV === 'development') {
                console.error('[API] Error creating task:', {
                    error: innerError?.message,
                    code: innerError?.code,
                    projectId,
                    title: data.title,
                });
            }

            // Nếu table không tồn tại, đảm bảo schema và retry
            if (isMissingTableError(innerError)) {
                console.warn('[API] Tasks table missing, attempting to create schema and retry...');
                await ensureCoreSchema();
                // Retry sau khi tạo schema - sử dụng transaction
                try {
                    task = await prisma.$transaction(async (tx) => {
                        const created = await tx.task.create({
                            data: {
                                projectId,
                                title: data.title.trim(),
                                description: data.description?.trim() || null,
                                startDate: data.startDate ? new Date(data.startDate as string | Date) : null,
                                endDate: data.endDate ? new Date(data.endDate as string | Date) : null,
                                status: data.status,
                                priority: data.priority,
                                progress: data.progress,
                                assignedToId: assignedToId ?? null,
                                parentId: data.parentId ?? null,
                                order: 0,
                            },
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
                                assignedToId: true,
                                assignee: { select: { name: true } },
                                parentId: true,
                                createdAt: true,
                                updatedAt: true,
                            },
                        });

                        // Verify ngay trong transaction
                        const verify = await tx.task.findUnique({
                            where: { id: created.id },
                            select: { id: true, title: true },
                        });

                        if (!verify) {
                            throw new Error('Task was created but cannot be verified in database');
                        }

                        return created;
                    });

                    // Log success sau khi transaction commit
                    if (process.env.NODE_ENV === 'development') {
                        console.log('[API] Task created and verified successfully after schema ensure:', {
                            id: task.id,
                            title: task.title,
                            projectId: task.projectId,
                        });
                    }
                } catch (retryError: any) {
                    // Nếu vẫn lỗi sau khi ensure schema, log và throw
                    console.error('[API] Error creating task after schema ensure:', retryError);
                    if (process.env.NODE_ENV === 'development') {
                        console.error('[API] Retry error details:', {
                            message: retryError?.message,
                            code: retryError?.code,
                            meta: retryError?.meta,
                        });
                    }
                    throw retryError;
                }
            }
            // Nếu Prisma Client đang cũ (chưa có parentId) thì retry bỏ parentId để vẫn tạo được task
            else if (innerError instanceof Error && /Unknown argument [`'"]parentId[`'"]/.test(innerError.message)) {
                console.warn('Prisma Client missing parentId on CREATE, retrying without parentId...');
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
                        assignedToId: assignedToId ?? null,
                        order: 0,
                    },
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
                        assignedToId: true,
                        assignee: { select: { name: true } },
                        createdAt: true,
                        updatedAt: true,
                    },
                });
            } else
            // Nếu bảng/column chưa tồn tại, tự động tạo schema tối thiểu rồi thử lại một lần
            if (
                typeof (innerError as any)?.code === 'string' &&
                ((innerError as any).code === 'P2021' || (innerError as any).code === 'P2022')
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
                        assignedToId: assignedToId ?? null,
                        parentId: data.parentId ?? null,
                        order: 0,
                    },
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
                        assignedToId: true,
                        assignee: { select: { name: true } },
                        parentId: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });
            } else {
                throw innerError;
            }
        }

        // Backward compatible: trả thêm assignedTo (tên) cho UI cũ
        const taskWithAssignedTo = {
            ...task,
            assignedTo: (task as any)?.assignee?.name ?? null,
        };

        return NextResponse.json({ success: true, data: taskWithAssignedTo }, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to create task:', error);

        let message = 'Không thể tạo công việc mới';
        let code: string | undefined;

        if (typeof (error as any)?.code === 'string') {
            const code = (error as any).code;

            // Lỗi khóa ngoại: projectId không tồn tại
            if (code === 'P2003') {
                message = 'Không thể tạo công việc vì dự án không tồn tại hoặc đã bị xóa.';
            } else if (code === 'P2021' || code === 'P2022') {
                // Lỗi bảng/column chưa tồn tại (chưa migrate DB)
                message =
                    'Cơ sở dữ liệu chưa được cập nhật cho module công việc (tasks). Vui lòng chạy migrate database.';
            } else {
                message = (error as any).message || message;
            }
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
