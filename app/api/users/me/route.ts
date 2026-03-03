import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/users/me
 * Lấy thông tin chi tiết của user đang đăng nhập
 */
export async function GET() {
    try {
        const { prisma } = await import('@/lib/prisma');

        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy user ID' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                title: true,
                department: true,
                experience: true,
                bankAccount: true,
                taxCode: true,
                createdAt: true,
                image: true,
            },
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy user' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: user });
    } catch (error: any) {
        console.error('[API] Failed to fetch user profile:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể tải thông tin hồ sơ' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/users/me
 * Cập nhật thông tin cá nhân của user đang đăng nhập
 */
export async function PATCH(request: Request) {
    try {
        const { prisma } = await import('@/lib/prisma');

        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy user ID' }, { status: 400 });
        }

        const body = await request.json();

        // Chỉ cho phép cập nhật một số field (bảo mật: không cho tự đổi role/status)
        const allowedFields = ['name', 'title', 'department', 'experience', 'bankAccount', 'taxCode'];
        const updateData: Record<string, string | null> = {};

        for (const field of allowedFields) {
            if (field in body) {
                updateData[field] = typeof body[field] === 'string' ? body[field].trim() || null : null;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, error: 'Không có dữ liệu để cập nhật' }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                title: true,
                department: true,
                experience: true,
                bankAccount: true,
                taxCode: true,
                createdAt: true,
                image: true,
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        console.error('[API] Failed to update user profile:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể cập nhật hồ sơ' },
            { status: 500 }
        );
    }
}
