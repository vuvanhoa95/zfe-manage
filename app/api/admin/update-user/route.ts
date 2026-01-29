import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * API endpoint để cập nhật hoặc tạo user mới
 * POST /api/admin/update-user
 * Body: { email, password, name?, role? }
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
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
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        let user;
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
