import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Helper: tìm user theo resetPasswordToken từ CẢ 2 bảng.
 * Trả về source = 'staff' (User) hoặc 'revit' (RevitUser).
 */
async function findByResetToken(token: string) {
    // 1. Tìm trong bảng User (nhân sự)
    const staffUser = await prisma.user.findUnique({
        where: { resetPasswordToken: token },
        select: {
            id: true,
            email: true,
            name: true,
            resetPasswordExpiry: true,
            revitLicensePlan: true,
            revitLicenseStart: true,
            revitLicenseExpiry: true,
        },
    });

    if (staffUser) {
        return { source: 'staff' as const, ...staffUser };
    }

    // 2. Tìm trong bảng RevitUser (standalone)
    const revitUser = await prisma.revitUser.findUnique({
        where: { resetPasswordToken: token },
        select: {
            id: true,
            email: true,
            name: true,
            resetPasswordExpiry: true,
            licensePlan: true,
            licenseStart: true,
            licenseExpiry: true,
        },
    });

    if (revitUser) {
        return { source: 'revit' as const, ...revitUser };
    }

    return null;
}

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

        // Find user by reset token (dual-table lookup)
        const found = await findByResetToken(token);

        if (!found) {
            return NextResponse.json(
                { success: false, error: 'Link không hợp lệ hoặc đã được sử dụng' },
                { status: 400 }
            );
        }

        // Check expiry
        if (found.resetPasswordExpiry && found.resetPasswordExpiry < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Link đã hết hạn. Vui lòng liên hệ admin để được cấp lại.' },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update password + clear token + activate account
        if (found.source === 'staff') {
            await prisma.user.update({
                where: { id: found.id },
                data: {
                    password: hashedPassword,
                    resetPasswordToken: null,
                    resetPasswordExpiry: null,
                    status: 'ACTIVE', // Auto-activate when password is set
                },
            });
        } else {
            await prisma.revitUser.update({
                where: { id: found.id },
                data: {
                    password: hashedPassword,
                    resetPasswordToken: null,
                    resetPasswordExpiry: null,
                    status: 'ACTIVE',
                },
            });
        }

        console.log(`[ResetPassword] Password updated for ${found.email} (${found.source})`);

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

        // Dual-table lookup
        const found = await findByResetToken(token);

        if (!found) {
            return NextResponse.json(
                { success: false, error: 'Token không hợp lệ hoặc đã được sử dụng' },
                { status: 400 }
            );
        }

        if (found.resetPasswordExpiry && found.resetPasswordExpiry < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Link đã hết hạn' },
                { status: 400 }
            );
        }

        // Normalize license fields across both user sources
        const licensePlan = found.source === 'staff'
            ? (found as any).revitLicensePlan
            : (found as any).licensePlan;
        const licenseStart = found.source === 'staff'
            ? (found as any).revitLicenseStart
            : (found as any).licenseStart;
        const licenseExpiry = found.source === 'staff'
            ? (found as any).revitLicenseExpiry
            : (found as any).licenseExpiry;

        return NextResponse.json({
            success: true,
            data: {
                email: found.email,
                name: found.name,
                licensePlan: licensePlan || '1M',
                licenseStart: licenseStart?.toISOString() || null,
                licenseExpiry: licenseExpiry?.toISOString() || null,
            },
        });
    } catch (error: any) {
        console.error('[ResetPassword] Verify error:', error);
        return NextResponse.json(
            { success: false, error: 'Có lỗi xảy ra' },
            { status: 500 }
        );
    }
}

