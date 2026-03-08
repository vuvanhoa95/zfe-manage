import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendLicenseWelcomeEmail, generateResetToken } from '@/lib/email';

// POST /api/users/license — Tạo user mới + cấp license + gửi email
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const currentUser = session?.user as any;
        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 403 });
        }

        const body = await request.json();
        const { email, name, password, plan } = body;

        if (!email || !name) {
            return NextResponse.json(
                { success: false, error: 'Thiếu email hoặc tên' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Email đã tồn tại trong hệ thống' },
                { status: 400 }
            );
        }

        // Generate reset token (24h expiry)
        const resetToken = generateResetToken();
        const resetExpiry = new Date();
        resetExpiry.setHours(resetExpiry.getHours() + 24);

        // Calculate dates
        const startDate = new Date();
        let expiryDate: Date | null = null;

        const PLAN_MONTHS: Record<string, number | null> = {
            '1M': 1, '3M': 3, '6M': 6, '1Y': 12, 'LIFETIME': null,
        };

        const months = PLAN_MONTHS[plan];
        if (months !== null && months !== undefined) {
            expiryDate = new Date(startDate);
            expiryDate.setMonth(expiryDate.getMonth() + months);
        }

        // Hash a random temporary password (user will change via email link)
        const tempPassword = password || `Zfenix_${Math.random().toString(36).slice(2, 10)}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // Create user with license + reset token
        const user = await prisma.user.create({
            data: {
                email: email.trim().toLowerCase(),
                name: name.trim(),
                password: hashedPassword,
                role: 'USER',
                status: 'PENDING', // Will be activated when they set password
                revitLicenseActive: true,
                revitLicensePlan: plan || '1M',
                revitLicenseStart: startDate,
                revitLicenseExpiry: expiryDate,
                resetPasswordToken: resetToken,
                resetPasswordExpiry: resetExpiry,
            },
            select: {
                id: true,
                email: true,
                name: true,
                revitLicensePlan: true,
            },
        });

        // Plan label for email
        const PLAN_LABELS: Record<string, string> = {
            '1M': '📅 1 tháng',
            '3M': '📆 3 tháng',
            '6M': '🗓️ 6 tháng',
            '1Y': '📋 1 năm',
            'LIFETIME': '♾️ Trọn đời',
        };
        const planLabel = PLAN_LABELS[plan] || plan;

        // Send email (don't block response if this fails)
        let emailResult: { success: boolean; error?: string; messageId?: string } = { success: false, error: 'Not sent' };
        try {
            emailResult = await sendLicenseWelcomeEmail({
                toEmail: user.email,
                userName: user.name || '',
                planLabel,
                resetToken,
            });
        } catch (emailError: any) {
            console.error('[CreateLicenseUser] Email error:', emailError);
            emailResult = { success: false, error: emailError.message };
        }

        return NextResponse.json({
            success: true,
            data: user,
            emailSent: emailResult.success,
            emailError: emailResult.success ? undefined : emailResult.error,
            message: emailResult.success
                ? `Đã tạo tài khoản và gửi email đến ${user.email}`
                : `Đã tạo tài khoản nhưng chưa gửi được email (${emailResult.error}). Bạn có thể gửi lại sau.`,
        });
    } catch (error: any) {
        console.error('[CreateLicenseUser] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Có lỗi xảy ra' },
            { status: 500 }
        );
    }
}
