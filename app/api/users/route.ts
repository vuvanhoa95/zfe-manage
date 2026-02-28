import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/users
 * Lấy danh sách users (để chọn người phụ trách, assign task, etc.)
 */
export async function GET(request: NextRequest) {
    try {
        // Kiểm tra authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const role = searchParams.get('role');
        const limit = parseInt(searchParams.get('limit') || '100', 10);

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            where.role = role;
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
            orderBy: {
                name: 'asc',
            },
            take: limit,
        });

        return NextResponse.json({
            success: true,
            data: users,
        });
    } catch (error: any) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tải danh sách người dùng',
                details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
            },
            { status: 500 }
        );
    }
}
