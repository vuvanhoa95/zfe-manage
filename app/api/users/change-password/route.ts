import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/users/change-password
 * Đổi mật khẩu cho user đang đăng nhập
 * Body: { newPassword }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy userId' }, { status: 400 });
        }

        const body = await request.json();
        const { newPassword } = body;

        if (!newPassword || newPassword.trim().length < 6) {
            return NextResponse.json(
                { success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
        const userType = (session.user as any).userType;

        if (userType === 'revit') {
            // RevitUser — update revit_users table
            await prisma.revitUser.update({
                where: { id: userId },
                data: { password: hashedPassword },
            });
        } else {
            // Staff User — update users table
            await prisma.user.update({
                where: { id: userId },
                data: {
                    password: hashedPassword,
                    mustChangePassword: false,
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Đã đổi mật khẩu thành công',
        });
    } catch (error: any) {
        console.error('[API] Change password error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Lỗi khi đổi mật khẩu' },
            { status: 500 }
        );
    }
}
