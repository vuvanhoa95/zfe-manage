import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureCoreSchema, isMissingTableError } from '@/lib/db-schema';

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

        // Luôn dùng select tối thiểu để tương thích với Prisma Client hiện tại
        const rawUsers = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                name: 'asc',
            },
            take: limit,
        });

        // Map thêm các field mới (có thể null nếu chưa có trong DB)
        const users = rawUsers.map((user: any) => ({
            ...user,
            title: null,
            department: null,
            experience: null,
            bankAccount: null,
            taxCode: null,
        }));

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
