import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { taskUpdateSchema, type TaskUpdateInput } from '@/lib/validation/task';

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
                    assignedTo: data.assignedTo ?? undefined,
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
                    assignedTo: true,
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
                        assignedTo: data.assignedTo ?? undefined,
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
                        assignedTo: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });
            } else {
                throw innerError;
            }
        }

        return NextResponse.json({ success: true, data: task });
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
