import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/auth/reset-password — Đặt mật khẩu mới bằng token
export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { success: false, error: 'Thiếu token hoặc mật khẩu' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' },
                { status: 400 }
            );
        }

        // Find user by reset token
        const user = await prisma.user.findUnique({
            where: { resetPasswordToken: token },
            select: {
                id: true,
                email: true,
                resetPasswordExpiry: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Link không hợp lệ hoặc đã được sử dụng' },
                { status: 400 }
            );
        }

        // Check expiry
        if (user.resetPasswordExpiry && user.resetPasswordExpiry < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Link đã hết hạn. Vui lòng liên hệ admin để được cấp lại.' },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update password + clear token + activate account
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpiry: null,
                status: 'ACTIVE', // Auto-activate when password is set
            },
        });

        console.log(`[ResetPassword] Password updated for ${user.email}`);

        return NextResponse.json({
            success: true,
            message: 'Mật khẩu đã được đặt thành công! Bạn có thể đăng nhập trên Revit.',
        });
    } catch (error: any) {
        console.error('[ResetPassword] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Có lỗi xảy ra' },
            { status: 500 }
        );
    }
}

// GET /api/auth/reset-password?token=xxx — Verify token is valid
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Thiếu token' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { resetPasswordToken: token },
            select: {
                id: true,
                email: true,
                name: true,
                resetPasswordExpiry: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Token không hợp lệ hoặc đã được sử dụng' },
                { status: 400 }
            );
        }

        if (user.resetPasswordExpiry && user.resetPasswordExpiry < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Link đã hết hạn' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { email: user.email, name: user.name },
        });
    } catch (error: any) {
        console.error('[ResetPassword] Verify error:', error);
        return NextResponse.json(
            { success: false, error: 'Có lỗi xảy ra' },
            { status: 500 }
        );
    }
}
