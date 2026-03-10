import { Resend } from 'resend';

// Lazy init — avoid crash at build time
let _resend: Resend | null = null;
function getResend(): Resend {
    if (!_resend) {
        const key = process.env.RESEND_API_KEY;
        if (!key) throw new Error('RESEND_API_KEY not configured');
        _resend = new Resend(key);
    }
    return _resend;
}

const APP_URL = process.env.NEXTAUTH_URL || 'https://zfenixmanage.site';
const FROM_EMAIL = 'ZFENIX License <hoavv@zfenix.com>';

/**
 * Send Revit License welcome email with password setup link
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
    const year = new Date().getFullYear();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Welcome to ZFENIX</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

<div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,21,41,0.10);">

    <!-- Accent Bar -->
    <div style="height:4px;background:linear-gradient(90deg,#001529 0%,#178AF3 50%,#38BDF8 100%);"></div>

    <!-- Header -->
    <div style="padding:28px 40px 16px;">

        <!-- CSS Text Logo (no image = always renders) -->
        <div style="margin-bottom:18px;line-height:1;">
            <span style="font-size:30px;font-weight:900;letter-spacing:2px;color:#178AF3;font-family:Arial,sans-serif;">Z</span><span style="font-size:30px;font-weight:900;letter-spacing:2px;color:#001529;font-family:Arial,sans-serif;">FENIX</span>
            <div style="font-size:9px;font-weight:600;letter-spacing:3px;color:#64748b;text-transform:uppercase;padding-top:2px;">Trustworthy Pinnacle</div>
        </div>

        <h1 style="color:#001529;font-size:24px;font-weight:700;margin:0 0 5px;line-height:1.3;">Welcome to ZFENIX</h1>
        <p style="color:#178AF3;font-size:14px;font-weight:500;margin:0;">Your Revit license is ready</p>
    </div>

    <!-- Body -->
    <div style="padding:6px 40px 28px;">
        <p style="color:#1e293b;font-size:15px;line-height:1.6;margin:0 0 12px;">
            Hi <strong>${userName}</strong>,
        </p>
        <p style="color:#475569;font-size:13.5px;line-height:1.6;margin:0 0 20px;">
            Great news! You've been granted access to <strong style="color:#178AF3;">Revit Add-in ZFENIX</strong>. Here are your plan details:
        </p>

        <!-- Plan Card — emoji icon (no SVG, fully email-safe) -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg,#178AF3 0%,#0ea5e9 100%);border-radius:10px;margin:0 0 24px;">
            <tr>
                <td style="padding:16px 20px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td style="vertical-align:middle;padding-right:14px;">
                                <div style="width:40px;height:40px;background:rgba(255,255,255,0.22);border-radius:9px;text-align:center;line-height:40px;font-size:20px;">
                                    &#128273;
                                </div>
                            </td>
                            <td style="vertical-align:middle;">
                                <p style="color:#ffffff;font-size:20px;font-weight:700;margin:0;line-height:1.2;">${planLabel}</p>
                                <p style="color:rgba(255,255,255,0.85);font-size:12px;margin:4px 0 0;">Full access to all ZFENIX features</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <!-- Setup Section -->
        <p style="color:#001529;font-size:14px;font-weight:600;margin:0 0 6px;">Set up your account</p>
        <p style="color:#64748b;font-size:13.5px;line-height:1.6;margin:0 0 20px;">
            Create a password to start using ZFENIX in Revit:
        </p>

        <!-- CTA Button -->
        <div style="text-align:center;margin:0 0 16px;">
            <a href="${resetUrl}" style="display:inline-block;background:#001529;color:#ffffff;text-decoration:none;padding:14px 44px;border-radius:9px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                Set Your Password &#8594;
            </a>
        </div>

        <p style="color:#94a3b8;font-size:11.5px;line-height:1.5;margin:0;text-align:center;">
            This link expires in <strong>24 hours</strong>. Contact admin if needed.
        </p>
    </div>

    <!-- Steps Section -->
    <div style="background:#F8FAFC;padding:20px 40px 24px;border-top:1px solid #e2e8f0;">
        <p style="color:#001529;font-size:13px;font-weight:600;margin:0 0 16px;">How to Get Started</p>

        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:400px;margin:0 auto;">
            <tr>
                <!-- Step 1 -->
                <td style="text-align:center;vertical-align:top;width:22%;">
                    <div style="width:32px;height:32px;background:#001529;border-radius:50%;color:#38BDF8;font-size:14px;font-weight:700;line-height:32px;margin:0 auto 6px;text-align:center;">1</div>
                    <p style="color:#475569;font-size:10px;line-height:1.3;margin:0;">Set Password</p>
                </td>
                <!-- Arrow -->
                <td style="text-align:center;vertical-align:top;padding-top:7px;width:6%;color:#94a3b8;font-size:16px;font-weight:700;">&#8594;</td>
                <!-- Step 2 -->
                <td style="text-align:center;vertical-align:top;width:22%;">
                    <div style="width:32px;height:32px;background:#001529;border-radius:50%;color:#38BDF8;font-size:14px;font-weight:700;line-height:32px;margin:0 auto 6px;text-align:center;">2</div>
                    <p style="color:#475569;font-size:10px;line-height:1.3;margin:0;">Open Revit</p>
                </td>
                <!-- Arrow -->
                <td style="text-align:center;vertical-align:top;padding-top:7px;width:6%;color:#94a3b8;font-size:16px;font-weight:700;">&#8594;</td>
                <!-- Step 3 -->
                <td style="text-align:center;vertical-align:top;width:22%;">
                    <div style="width:32px;height:32px;background:#001529;border-radius:50%;color:#38BDF8;font-size:14px;font-weight:700;line-height:32px;margin:0 auto 6px;text-align:center;">3</div>
                    <p style="color:#475569;font-size:10px;line-height:1.3;margin:0;">ZFENIX Tab</p>
                </td>
                <!-- Arrow -->
                <td style="text-align:center;vertical-align:top;padding-top:7px;width:6%;color:#94a3b8;font-size:16px;font-weight:700;">&#8594;</td>
                <!-- Step 4 -->
                <td style="text-align:center;vertical-align:top;width:22%;">
                    <div style="width:32px;height:32px;background:#178AF3;border-radius:50%;color:#ffffff;font-size:14px;font-weight:700;line-height:32px;margin:0 auto 6px;text-align:center;">4</div>
                    <p style="color:#475569;font-size:10px;line-height:1.3;margin:0;">Login &amp; Enjoy!</p>
                </td>
            </tr>
        </table>
    </div>

    <!-- Footer -->
    <div style="padding:18px 40px 22px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:11px;margin:0 0 8px;">&#169; ${year} ZFENIX. All rights reserved.</p>
        <a href="https://www.zfenix.com" style="display:inline-block;color:#178AF3;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:2px;">
            WWW.ZFENIX.COM
        </a>
        <p style="color:#cbd5e1;font-size:10px;margin:10px 0 0;">
            This is an automated email. If you didn't request this, please disregard.
        </p>
    </div>

</div>

</body>
</html>`;

    try {
        const data = await getResend().emails.send({
            from: FROM_EMAIL,
            to: [toEmail],
            subject: 'Your ZFENIX Revit License is Ready',
            html,
        });
        console.log(`[Email] Sent to ${toEmail}:`, data);
        return { success: true, messageId: data.data?.id || 'sent' };
    } catch (error: any) {
        console.error(`[Email] Failed to send to ${toEmail}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate a secure random reset token
 */
export function generateResetToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 48; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}
