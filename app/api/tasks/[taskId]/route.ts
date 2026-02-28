import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { taskUpdateSchema, type TaskUpdateInput } from '@/lib/validation/task';

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function resolveAssignedToId(input: {
    assignedToId?: string | null;
    assignedTo?: string | null;
}): Promise<string | null> {
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

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> | { taskId: string } },
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const taskId = resolvedParams.taskId;
        const rawBody = await request.json();

        const parsed = taskUpdateSchema.safeParse(rawBody);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Dữ liệu công việc không hợp lệ', details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const data: TaskUpdateInput = parsed.data;
        
        // Xử lý assignedToId: nếu có trong data thì resolve, nếu không thì không update
        let resolvedAssignedToId: string | null | undefined = undefined;
        if (data.assignedToId !== undefined || data.assignedTo !== undefined) {
            resolvedAssignedToId = await resolveAssignedToId({
                assignedToId: data.assignedToId ?? null,
                assignedTo: data.assignedTo ?? null,
            });
        }

        let task;
        try {
            task = await prisma.task.update({
                where: { id: taskId },
                data: {
                    title: data.title,
                    description: data.description ?? undefined,
                    startDate: data.startDate
                        ? new Date(data.startDate as string | Date)
                        : data.startDate === null
                          ? null
                          : undefined,
                    endDate: data.endDate
                        ? new Date(data.endDate as string | Date)
                        : data.endDate === null
                          ? null
                          : undefined,
                    dueDate: data.dueDate
                        ? new Date(data.dueDate as string | Date)
                        : data.dueDate === null
                          ? null
                          : undefined,
                    phase: data.phase ?? undefined,
                    discipline: data.discipline ?? undefined,
                    location: data.location ?? undefined,
                    status: data.status,
                    priority: data.priority,
                    progress: typeof data.progress === 'number' ? data.progress : undefined,
                    assignedToId: resolvedAssignedToId,
                    parentId: data.parentId ?? undefined,
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
                    dueDate: true,
                    phase: true,
                    discipline: true,
                    location: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        } catch (innerError) {
            // Nếu Prisma Client đang cũ (chưa có parentId) thì retry bỏ parentId
            if (innerError instanceof Error && /Unknown argument [`'"]parentId[`'"]/.test(innerError.message)) {
                console.warn('Prisma Client missing parentId on UPDATE, retrying without parentId...');
                task = await prisma.task.update({
                    where: { id: taskId },
                    data: {
                        title: data.title,
                        description: data.description ?? undefined,
                        startDate: data.startDate
                            ? new Date(data.startDate as string | Date)
                            : data.startDate === null
                              ? null
                              : undefined,
                        endDate: data.endDate
                            ? new Date(data.endDate as string | Date)
                            : data.endDate === null
                              ? null
                              : undefined,
                        dueDate: data.dueDate
                            ? new Date(data.dueDate as string | Date)
                            : data.dueDate === null
                              ? null
                              : undefined,
                        phase: data.phase ?? undefined,
                        discipline: data.discipline ?? undefined,
                        location: data.location ?? undefined,
                        status: data.status,
                        priority: data.priority,
                        progress: typeof data.progress === 'number' ? data.progress : undefined,
                        assignedToId: resolvedAssignedToId,
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
            } else {
                throw innerError;
            }
        }

        // Backward compatible: trả thêm assignedTo (tên) cho UI cũ
        const taskWithAssignedTo = {
            ...task,
            assignedTo: (task as any)?.assignee?.name ?? null,
        };

        return NextResponse.json({ success: true, data: taskWithAssignedTo });
    } catch (error) {
        console.error('Failed to update task:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể cập nhật công việc',
                details: process.env.NODE_ENV === 'development' ? { message: (error as Error).message } : undefined,
            },
            { status: 500 },
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> | { taskId: string } },
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const taskId = resolvedParams.taskId;

        await prisma.task.delete({
            where: { id: taskId },
        });

        return NextResponse.json({ success: true, data: { id: taskId } });
    } catch (error) {
        console.error('Failed to delete task:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể xóa công việc',
                details: process.env.NODE_ENV === 'development' ? { message: (error as Error).message } : undefined,
            },
            { status: 500 },
        );
    }
}
