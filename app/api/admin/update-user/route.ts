import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureCoreSchema, isMissingTableError } from '@/lib/db-schema';

/**
 * API endpoint để cập nhật hoặc tạo user mới
 * POST /api/admin/update-user
 * Body: { email, password, name?, role? }
 */
export async function POST(request: NextRequest) {
    try {
        // Đảm bảo schema tồn tại trước khi thao tác với database
        await ensureCoreSchema();

        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { email, password, name, role } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email và password là bắt buộc' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user exists
        let existingUser;
        try {
            existingUser = await prisma.user.findUnique({
                where: { email },
            });
        } catch (error: any) {
            if (isMissingTableError(error)) {
                await ensureCoreSchema();
                existingUser = null;
            } else {
                throw error;
            }
        }

        let user;
        try {
            if (existingUser) {
                // Update existing user
                user = await prisma.user.update({
                    where: { email },
                    data: {
                        name: name || existingUser.name,
                        password: hashedPassword,
                        role: role || existingUser.role,
                    },
                });
            } else {
                // Create new user
                user = await prisma.user.create({
                    data: {
                        email,
                        name: name || 'User',
                        password: hashedPassword,
                        role: role || 'USER',
                    },
                });
            }
        } catch (error: any) {
            if (isMissingTableError(error)) {
                await ensureCoreSchema();
                // Retry after ensuring schema
                if (existingUser) {
                    user = await prisma.user.update({
                        where: { email },
                        data: {
                            name: name || existingUser.name,
                            password: hashedPassword,
                            role: role || existingUser.role,
                        },
                    });
                } else {
                    user = await prisma.user.create({
                        data: {
                            email,
                            name: name || 'User',
                            password: hashedPassword,
                            role: role || 'USER',
                        },
                    });
                }
            } else {
                throw error;
            }
        }

        return NextResponse.json({
            success: true,
            message: existingUser ? 'Đã cập nhật user thành công' : 'Đã tạo user mới thành công',
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error: any) {
        console.error('Update user error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error?.message || 'Failed to update user',
            },
            { status: 500 }
        );
    }
}
