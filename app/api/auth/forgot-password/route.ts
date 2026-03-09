import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateResetToken } from '@/lib/email';
import { resend, DEFAULT_FROM } from '@/lib/email/client';
import { render } from '@react-email/render';
import { PasswordResetRequestEmail } from '@/lib/email/templates/password-reset-request';

// Rate limiting: store last request time per email (in-memory, resets on deploy)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60_000; // 1 minute between requests

/**
 * POST /api/auth/forgot-password
 * User tự gửi yêu cầu reset mật khẩu qua email.
 * - Tìm user trong cả bảng User + RevitUser
 * - Tạo resetPasswordToken + expiry (24h)
 * - Gửi email chứa link reset
 * 
 * Security: Luôn trả success dù email có tồn tại hay không (tránh enum attack)
 */
export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Vui lòng nhập email' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Rate limiting check
        const lastRequest = rateLimitMap.get(normalizedEmail);
        if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_MS) {
            const secondsLeft = Math.ceil((RATE_LIMIT_MS - (Date.now() - lastRequest)) / 1000);
            return NextResponse.json(
                { success: false, error: `Vui lòng chờ ${secondsLeft} giây trước khi gửi lại.` },
                { status: 429 }
            );
        }

        // Tìm user trong cả 2 bảng
        let source: 'staff' | 'revit' | null = null;
        let userId: string | null = null;
        let userName: string | null = null;

        // 1. Tìm trong bảng User (nhân sự web)
        const staffUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, name: true, email: true, status: true },
        });

        if (staffUser) {
            source = 'staff';
            userId = staffUser.id;
            userName = staffUser.name;
        } else {
            // 2. Tìm trong bảng RevitUser (standalone)
            const revitUser = await prisma.revitUser.findUnique({
                where: { email: normalizedEmail },
                select: { id: true, name: true, email: true, status: true },
            });

            if (revitUser) {
                source = 'revit';
                userId = revitUser.id;
                userName = revitUser.name;
            }
        }

        // SECURITY: Luôn trả success message dù email có tồn tại hay không
        // để tránh attacker enumerate email
        if (!source || !userId) {
            console.log(`[ForgotPassword] Email not found: ${normalizedEmail} (returning success anyway)`);
            // Vẫn cập nhật rate limit
            rateLimitMap.set(normalizedEmail, Date.now());
            return NextResponse.json({
                success: true,
                message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.',
            });
        }

        // Tạo token + expiry 24h
        const resetToken = generateResetToken();
        const resetPasswordExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Update token vào DB
        if (source === 'staff') {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    resetPasswordToken: resetToken,
                    resetPasswordExpiry,
                },
            });
        } else {
            await prisma.revitUser.update({
                where: { id: userId },
                data: {
                    resetPasswordToken: resetToken,
                    resetPasswordExpiry,
                },
            });
        }

        // Tạo reset URL
        const appUrl = process.env.NEXTAUTH_URL || 'https://zfenixmanage.site';
        const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

        // Gửi email
        try {
            const emailHtml = await render(
                PasswordResetRequestEmail({
                    userName: userName || normalizedEmail,
                    resetUrl,
                })
            );

            const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL
                    ? `ZFENIX <${process.env.RESEND_FROM_EMAIL}>`
                    : DEFAULT_FROM,
                to: [normalizedEmail],
                subject: '🔐 Đặt lại mật khẩu ZFENIX',
                html: emailHtml,
            });

            if (error) {
                console.error('[ForgotPassword] Email send error:', error);
            } else {
                console.log(`[ForgotPassword] Reset email sent to ${normalizedEmail} (${source}):`, data);
            }
        } catch (emailError) {
            console.error('[ForgotPassword] Email error:', emailError);
            // Không return lỗi - token đã được tạo, admin có thể hỗ trợ
        }

        // Cập nhật rate limit
        rateLimitMap.set(normalizedEmail, Date.now());

        return NextResponse.json({
            success: true,
            message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.',
        });
    } catch (error: any) {
        console.error('[ForgotPassword] Server error:', error);
        return NextResponse.json(
            { success: false, error: 'Có lỗi xảy ra. Vui lòng thử lại sau.' },
            { status: 500 }
        );
    }
}
