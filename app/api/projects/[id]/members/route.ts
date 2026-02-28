import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const projectMemberSchema = z.object({
    userId: z.string().uuid('ID người dùng không hợp lệ'),
    role: z.enum(['MANAGER', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

const projectMemberUpdateSchema = z.object({
    role: z.enum(['MANAGER', 'MEMBER', 'VIEWER']).optional(),
});

/**
 * GET /api/projects/[id]/members
 * Lấy danh sách thành viên của project
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const projectId = resolvedParams.id;

        // Kiểm tra project có tồn tại không
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true },
        });

        if (!project) {
            return NextResponse.json({ success: false, error: 'Dự án không tồn tại' }, { status: 404 });
        }

        // Lấy danh sách members
        const members = await prisma.projectMember.findMany({
            where: { projectId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return NextResponse.json({
            success: true,
            data: members.map((member) => ({
                id: member.id,
                userId: member.userId,
                role: member.role,
                user: member.user,
                createdAt: member.createdAt,
            })),
        });
    } catch (error: any) {
        console.error('Failed to fetch project members:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tải danh sách thành viên',
                details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/projects/[id]/members
 * Thêm thành viên vào project (gán người phụ trách)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const projectId = resolvedParams.id;

        // Kiểm tra authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
        }

        const json = await request.json();
        const parsed = projectMemberSchema.safeParse(json);

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

        const { userId, role } = parsed.data;

        // Kiểm tra project có tồn tại không
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true },
        });

        if (!project) {
            return NextResponse.json({ success: false, error: 'Dự án không tồn tại' }, { status: 404 });
        }

        // Kiểm tra user có tồn tại không
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true },
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'Người dùng không tồn tại' }, { status: 404 });
        }

        // Kiểm tra member đã tồn tại chưa (unique constraint)
        const existingMember = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });

        if (existingMember) {
            // Nếu đã tồn tại, cập nhật role
            const updated = await prisma.projectMember.update({
                where: {
                    projectId_userId: {
                        projectId,
                        userId,
                    },
                },
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
        }

        // Tạo member mới
        const member = await prisma.projectMember.create({
            data: {
                projectId,
                userId,
                role,
            },
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

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: member.id,
                    userId: member.userId,
                    role: member.role,
                    user: member.user,
                    createdAt: member.createdAt,
                },
                message: 'Đã thêm thành viên vào dự án',
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Failed to add project member:', error);

        // Handle unique constraint violation
        if (error?.code === 'P2002') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Người này đã là thành viên của dự án',
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Không thể thêm thành viên',
                details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
            },
            { status: 500 }
        );
    }
}
