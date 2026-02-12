import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> | { taskId: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const taskId = resolvedParams.taskId;
        const body = await request.json();

        const task = await prisma.task.update({
            where: { id: taskId },
            data: {
                title: body.title,
                description: body.description,
                startDate: body.startDate ? new Date(body.startDate) : undefined,
                endDate: body.endDate ? new Date(body.endDate) : undefined,
                status: body.status,
                priority: body.priority,
                progress: body.progress,
                assignedTo: body.assignedTo,
            },
        });

        return NextResponse.json({ success: true, data: task });
    } catch (error: any) {
        console.error('Failed to update task:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể cập nhật công việc' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> | { taskId: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const taskId = resolvedParams.taskId;

        await prisma.task.delete({
            where: { id: taskId },
        });

        return NextResponse.json({ success: true, message: 'Xóa công việc thành công' });
    } catch (error: any) {
        console.error('Failed to delete task:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể xóa công việc' },
            { status: 500 }
        );
    }
}
