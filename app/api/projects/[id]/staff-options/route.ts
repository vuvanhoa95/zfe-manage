import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const projectId = resolvedParams.id;

        // Phase 1: Task Assignment uses System Users
        const systemUsers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                role: true,
            },
            orderBy: { name: 'asc' },
        });

        const data = systemUsers.map(user => ({
            id: user.id,
            name: user.name,
            type: 'user',
            discipline: user.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân sự',
        }));

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Failed to fetch staff options for project:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tải danh sách nhân sự cho dự án',
                details: process.env.NODE_ENV === 'development' ? { message: (error as Error).message } : undefined,
            },
            { status: 500 },
        );
    }
}

