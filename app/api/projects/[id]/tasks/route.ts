import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const projectId = resolvedParams.id;

        const tasks = await prisma.task.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: tasks });
    } catch (error: any) {
        console.error('Failed to fetch tasks:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể tải danh sách công việc' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const projectId = resolvedParams.id;
        const body = await request.json();

        const task = await prisma.task.create({
            data: {
                projectId,
                title: body.title,
                description: body.description,
                startDate: body.startDate ? new Date(body.startDate) : null,
                endDate: body.endDate ? new Date(body.endDate) : null,
                status: body.status || 'TODO',
                priority: body.priority || 'MEDIUM',
                progress: body.progress || 0,
                assignedTo: body.assignedTo,
            },
        });

        return NextResponse.json({ success: true, data: task });
    } catch (error: any) {
        console.error('Failed to create task:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể tạo công việc mới' },
            { status: 500 }
        );
    }
}
