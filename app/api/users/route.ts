import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureCoreSchema, isMissingTableError } from '@/lib/db-schema';

/**
 * GET /api/users
 * Lấy danh sách users (để chọn người phụ trách, assign task, etc.)
 */
export async function GET(request: NextRequest) {
    try {
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

        let users;
        try {
            users = await prisma.user.findMany({
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
        } catch (error: any) {
            // Nếu table không tồn tại, đảm bảo schema và retry
            if (isMissingTableError(error)) {
                await ensureCoreSchema();
                // Retry sau khi ensure schema
                users = await prisma.user.findMany({
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
            } else {
                throw error;
            }
        }

        return NextResponse.json({
            success: true,
            data: users,
            count: users.length, // Thêm count để debug
        });
    } catch (error: any) {
        console.error('Failed to fetch users:', error);
        
        // Log chi tiết trong development
        if (process.env.NODE_ENV === 'development') {
            console.error('[API] Fetch users error details:', {
                message: error?.message,
                code: error?.code,
                meta: error?.meta,
                stack: error?.stack,
            });
        }

        // Xử lý các loại lỗi cụ thể
        let errorMessage = 'Không thể tải danh sách người dùng';
        let statusCode = 500;

        if (isMissingTableError(error)) {
            errorMessage = 'Cơ sở dữ liệu chưa được khởi tạo. Vui lòng thử lại sau.';
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? {
                    message: error?.message,
                    code: error?.code,
                    meta: error?.meta,
                } : undefined,
            },
            { status: statusCode }
        );
    }
}
