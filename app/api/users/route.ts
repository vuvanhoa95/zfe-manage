import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureCoreSchema, isMissingTableError } from '@/lib/db-schema';
import { UserStatus } from '@prisma/client';

/**
 * GET /api/users
 * Lấy danh sách users (để chọn người phụ trách, assign task, etc.)
 */
export async function GET(request: NextRequest) {
    try {
        // Dynamic import Prisma Client để tránh lỗi import ở module level
        const { prisma } = await import('@/lib/prisma');

        // Đảm bảo schema tồn tại trước khi thao tác với database
        try {
            await ensureCoreSchema();
        } catch (schemaError: any) {
            // Log nhưng không throw - có thể schema đã tồn tại một phần
            if (process.env.NODE_ENV === 'development') {
                console.warn('[API] ensureCoreSchema warning (may be safe to ignore):', schemaError?.message);
            }
        }

        // Kiểm tra authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const role = searchParams.get('role');
        // Tăng limit mặc định lên 1000 để hiển thị nhiều users hơn
        // Nếu cần nhiều hơn, có thể thêm pagination sau
        const limit = parseInt(searchParams.get('limit') || '1000', 10);

        const where: any = {};

        if (search) {
            // SQLite không hỗ trợ mode: 'insensitive', dùng contains thôi
            // Case-insensitive sẽ được xử lý ở application level nếu cần
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
            ];
        }

        if (role) {
            where.role = role;
        }

        // Lấy đầy đủ thông tin hồ sơ người dùng theo schema hiện tại
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                title: true,
                department: true,
                experience: true,
                bankAccount: true,
                taxCode: true,
                status: true,
            },
            orderBy: {
                name: 'asc',
            },
            take: limit,
        });

        return NextResponse.json({
            success: true,
            data: users,
            count: users.length,
        });
    } catch (error: any) {
        console.error('[API] Failed to fetch users:', error);
        
        // Log chi tiết trong development
        if (process.env.NODE_ENV === 'development') {
            console.error('[API] Fetch users error details:', {
                message: error?.message,
                code: error?.code,
                meta: error?.meta,
                stack: error?.stack,
                name: error?.name,
            });
        }

        // Xử lý các loại lỗi cụ thể
        let errorMessage = 'Không thể tải danh sách người dùng';
        let statusCode = 500;

        // Kiểm tra các loại lỗi cụ thể
        if (isMissingTableError(error)) {
            errorMessage = 'Cơ sở dữ liệu chưa được khởi tạo. Vui lòng thử lại sau.';
        } else if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database server')) {
            errorMessage = 'Không thể kết nối đến cơ sở dữ liệu. Vui lòng kiểm tra kết nối.';
        } else if (error?.code === 'P2002') {
            errorMessage = 'Lỗi dữ liệu trùng lặp trong cơ sở dữ liệu.';
        } else if (error?.code === 'P2025') {
            errorMessage = 'Không tìm thấy dữ liệu trong cơ sở dữ liệu.';
        } else if (error?.message) {
            // Trong development, hiển thị error message chi tiết hơn
            if (process.env.NODE_ENV === 'development') {
                errorMessage = `Lỗi: ${error.message}`;
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? {
                    message: error?.message,
                    code: error?.code,
                    meta: error?.meta,
                    name: error?.name,
                } : undefined,
            },
            { status: statusCode }
        );
    }
}

/**
 * PATCH /api/users
 * Cập nhật trạng thái user (Approve/Reject/Suspend)
 */
export async function PATCH(request: NextRequest) {
    try {
        const { prisma } = await import('@/lib/prisma');
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, status } = body;

        if (!userId || !status) {
            return NextResponse.json({ success: false, error: 'Missing userId or status' }, { status: 400 });
        }

        const validStatuses = Object.values(UserStatus);
        if (!validStatuses.includes(status as UserStatus)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { status: status as UserStatus },
        });

        return NextResponse.json({
            success: true,
            data: updatedUser,
            message: `User ${updatedUser.email} has been updated to ${status}`
        });
    } catch (error: any) {
        console.error('[API] Failed to update user status:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Lỗi khi cập nhật trạng thái user' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/users
 * Xóa user (chỉ ADMIN, không tự xóa chính mình, không xóa super admin)
 */
export async function DELETE(request: NextRequest) {
    try {
        const { prisma } = await import('@/lib/prisma');
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Không có quyền thực hiện' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Thiếu userId' }, { status: 400 });
        }

        // Không cho xóa chính mình
        if ((session.user as any).id === userId) {
            return NextResponse.json({ success: false, error: 'Không thể xóa tài khoản đang đăng nhập' }, { status: 400 });
        }

        // Kiểm tra user tồn tại
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy user' }, { status: 404 });
        }

        // Không cho xóa super admin
        const SUPER_ADMIN_EMAIL = '7604vuhoa@gmail.com';
        if (targetUser.email === SUPER_ADMIN_EMAIL) {
            return NextResponse.json({ success: false, error: 'Không thể xóa tài khoản Super Admin' }, { status: 403 });
        }

        // Xóa accounts, sessions liên quan trước (cascade có thể đã xử lý nhưng an toàn hơn)
        await prisma.account.deleteMany({ where: { userId } });
        await prisma.session.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });

        return NextResponse.json({
            success: true,
            message: `Đã xóa user ${targetUser.email}`,
        });
    } catch (error: any) {
        console.error('[API] Failed to delete user:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Lỗi khi xóa user' },
            { status: 500 }
        );
    }
}
