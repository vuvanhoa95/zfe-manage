import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXTAUTH_URL || 'https://zfenixmanage.site';
const FROM_EMAIL = 'ZFENIX License <hoavv@zfenix.com>';

/**
 * Gửi email thông báo cấp License Revit + link đổi mật khẩu
 */
export async function sendLicenseWelcomeEmail({
    toEmail,
    userName,
    planLabel,
    resetToken,
}: {
    toEmail: string;
    userName: string;
    planLabel: string;
    resetToken: string;
}) {
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f6f9; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#3730a3,#6366f1); padding:32px 40px; text-align:center;">
            <h1 style="color:#ffffff; font-size:22px; margin:0 0 4px;">🔑 ZFENIX Revit License</h1>
            <p style="color:rgba(255,255,255,0.85); font-size:13px; margin:0;">Chào mừng bạn đến với hệ thống</p>
        </div>

        <!-- Body -->
        <div style="padding:32px 40px;">
            <p style="color:#1f2937; font-size:15px; line-height:1.6; margin:0 0 16px;">
                Xin chào <strong>${userName}</strong>,
            </p>
            <p style="color:#4b5563; font-size:14px; line-height:1.6; margin:0 0 20px;">
                Bạn đã được cấp quyền sử dụng <strong style="color:#4f46e5;">Revit Add-in ZFENIX</strong> với gói:
            </p>

            <!-- Plan Badge -->
            <div style="background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:16px 20px; margin:0 0 24px; text-align:center;">
                <p style="color:#6366f1; font-size:18px; font-weight:700; margin:0;">${planLabel}</p>
            </div>

            <p style="color:#4b5563; font-size:14px; line-height:1.6; margin:0 0 24px;">
                Để bắt đầu sử dụng, vui lòng <strong>đặt mật khẩu</strong> cho tài khoản của bạn bằng cách nhấn nút bên dưới:
            </p>

            <!-- CTA Button -->
            <div style="text-align:center; margin:0 0 24px;">
                <a href="${resetUrl}" style="display:inline-block; background:linear-gradient(135deg,#4f46e5,#6366f1); color:#ffffff; text-decoration:none; padding:14px 40px; border-radius:8px; font-size:15px; font-weight:600; letter-spacing:0.3px;">
                    🔐 Đặt mật khẩu ngay
                </a>
            </div>

            <p style="color:#9ca3af; font-size:12px; line-height:1.5; margin:0 0 16px;">
                Link này sẽ hết hạn sau <strong>24 giờ</strong>. Nếu link hết hạn, vui lòng liên hệ admin để được cấp lại.
            </p>

            <!-- Divider -->
            <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;">

            <!-- Info -->
            <div style="background:#f9fafb; border-radius:8px; padding:16px;">
                <p style="color:#6b7280; font-size:12px; margin:0 0 8px; font-weight:600;">📋 Hướng dẫn nhanh:</p>
                <ol style="color:#6b7280; font-size:12px; line-height:1.8; margin:0; padding-left:18px;">
                    <li>Nhấn nút "Đặt mật khẩu" ở trên</li>
                    <li>Tạo mật khẩu mới cho tài khoản</li>
                    <li>Mở Revit → Tab ZFENIX → Login</li>
                    <li>Đăng nhập bằng email <strong>${toEmail}</strong> + mật khẩu vừa tạo</li>
                </ol>
            </div>
        </div>

        <!-- Footer -->
        <div style="background:#f9fafb; padding:20px 40px; text-align:center; border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af; font-size:11px; margin:0;">
                © ${new Date().getFullYear()} ZFENIX · Đại Lý Dung Phú
            </p>
            <p style="color:#d1d5db; font-size:10px; margin:4px 0 0;">
                Email này được gửi tự động. Nếu bạn không yêu cầu, vui lòng bỏ qua.
            </p>
        </div>
    </div>
</body>
</html>`;

    try {
        const data = await resend.emails.send({
            from: FROM_EMAIL,
            to: [toEmail],
            subject: '🔑 Bạn đã được cấp License Revit Add-in ZFENIX',
            html,
        });

        console.log(`[Email] License welcome sent to ${toEmail}:`, data);
        return { success: true, messageId: data.data?.id || 'sent' };
    } catch (error: any) {
        console.error(`[Email] Failed to send to ${toEmail}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate a random reset token
 */
export function generateResetToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 48; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}
