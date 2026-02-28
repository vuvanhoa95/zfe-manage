import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const projectMemberUpdateSchema = z.object({
    role: z.enum(['MANAGER', 'MEMBER', 'VIEWER']).optional(),
});

/**
 * PUT /api/projects/[id]/members/[memberId]
 * Cập nhật vai trò của thành viên
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; memberId: string }> | { id: string; memberId: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const { id: projectId, memberId } = resolvedParams;

        // Kiểm tra authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
        }

        const json = await request.json();
        const parsed = projectMemberUpdateSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Dữ liệu không hợp lệ',
                    details: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const { role } = parsed.data;

        if (!role) {
            return NextResponse.json({ success: false, error: 'Vai trò là bắt buộc' }, { status: 400 });
        }

        // Kiểm tra member có tồn tại không
        const member = await prisma.projectMember.findUnique({
            where: { id: memberId },
            include: {
                project: {
                    select: { id: true },
                },
            },
        });

        if (!member) {
            return NextResponse.json({ success: false, error: 'Thành viên không tồn tại' }, { status: 404 });
        }

        // Kiểm tra member thuộc đúng project không
        if (member.projectId !== projectId) {
            return NextResponse.json(
                { success: false, error: 'Thành viên không thuộc dự án này' },
                { status: 400 }
            );
        }

        // Cập nhật role
        const updated = await prisma.projectMember.update({
            where: { id: memberId },
            data: { role },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                id: updated.id,
                userId: updated.userId,
                role: updated.role,
                user: updated.user,
                createdAt: updated.createdAt,
            },
            message: 'Đã cập nhật vai trò thành viên',
        });
    } catch (error: any) {
        console.error('Failed to update project member:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể cập nhật thành viên',
                details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/projects/[id]/members/[memberId]
 * Xóa thành viên khỏi project
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; memberId: string }> | { id: string; memberId: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const { id: projectId, memberId } = resolvedParams;

        // Kiểm tra authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
        }

        // Kiểm tra member có tồn tại không
        const member = await prisma.projectMember.findUnique({
            where: { id: memberId },
            include: {
                project: {
                    select: { id: true },
                },
            },
        });

        if (!member) {
            return NextResponse.json({ success: false, error: 'Thành viên không tồn tại' }, { status: 404 });
        }

        // Kiểm tra member thuộc đúng project không
        if (member.projectId !== projectId) {
            return NextResponse.json(
                { success: false, error: 'Thành viên không thuộc dự án này' },
                { status: 400 }
            );
        }

        // Xóa member
        await prisma.projectMember.delete({
            where: { id: memberId },
        });

        return NextResponse.json({
            success: true,
            message: 'Đã xóa thành viên khỏi dự án',
        });
    } catch (error: any) {
        console.error('Failed to delete project member:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể xóa thành viên',
                details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
            },
            { status: 500 }
        );
    }
}
