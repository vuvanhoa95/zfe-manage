/**
 * GET /api/revit-auth/oauth/callback?code=xxx&state=xxx
 * 
 * OAuth callback handler for Revit Add-in.
 * Receives authorization code from Google/Microsoft,
 * exchanges it for user profile, checks BOTH User + RevitUser tables,
 * generates active token, and redirects to localhost listener.
 * 
 * ⚡ v2: Dual-table lookup (User + RevitUser)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const TOKEN_EXPIRY_DAYS = 30;
const UserStatus = { ACTIVE: 'ACTIVE', PENDING: 'PENDING', SUSPENDED: 'SUSPENDED' } as const;

const SUPER_ADMIN_EMAILS = [
    '7604vuhoa@gmail.com',
    'hoavv@zfenix.com',
];

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const stateParam = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        // User cancelled or error from OAuth provider
        if (error) {
            return renderErrorPage(`Đăng nhập bị hủy: ${error}`);
        }

        if (!code || !stateParam) {
            return renderErrorPage('Thiếu authorization code hoặc state.');
        }

        // Decode state
        let state: { port: string; machineId: string; provider: string };
        try {
            state = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
        } catch {
            return renderErrorPage('State parameter không hợp lệ.');
        }

        const { port, machineId, provider } = state;
        const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get('host')}`;
        const callbackUrl = `${baseUrl}/api/revit-auth/oauth/callback`;

        // Exchange authorization code for access token + user info
        let email: string;
        let name: string;
        let avatarUrl: string | null = null;

        if (provider === 'google') {
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: process.env.GOOGLE_CLIENT_ID || '',
                    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                    redirect_uri: callbackUrl,
                    grant_type: 'authorization_code',
                }),
            });

            if (!tokenRes.ok) {
                const errBody = await tokenRes.text();
                console.error('[Revit OAuth] Google token exchange failed:', errBody);
                return renderErrorPage('Không thể xác thực với Google. Vui lòng thử lại.');
            }

            const tokenData = await tokenRes.json();

            // Get user profile
            const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const profile = await profileRes.json();

            email = profile.email?.toLowerCase();
            name = profile.name || email.split('@')[0];
            avatarUrl = profile.picture || null;

        } else if (provider === 'microsoft') {
            const tokenRes = await fetch(
                `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || 'common'}/oauth2/v2.0/token`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        code,
                        client_id: process.env.AZURE_AD_CLIENT_ID || '',
                        client_secret: process.env.AZURE_AD_CLIENT_SECRET || '',
                        redirect_uri: callbackUrl,
                        grant_type: 'authorization_code',
                    }),
                }
            );

            if (!tokenRes.ok) {
                const errBody = await tokenRes.text();
                console.error('[Revit OAuth] Microsoft token exchange failed:', errBody);
                return renderErrorPage('Không thể xác thực với Microsoft. Vui lòng thử lại.');
            }

            const tokenData = await tokenRes.json();

            // Get user profile from Microsoft Graph
            const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const profile = await profileRes.json();

            email = (profile.mail || profile.userPrincipalName)?.toLowerCase();
            name = profile.displayName || email?.split('@')[0] || 'User';
        } else {
            return renderErrorPage('Provider không hợp lệ.');
        }

        if (!email) {
            return renderErrorPage('Không lấy được email từ tài khoản OAuth.');
        }

        // === DATABASE OPERATIONS (Dual-table lookup) ===

        // 1. Check RevitUser table first (standalone Revit users)
        const revitUser = await prisma.revitUser.findUnique({ where: { email } });

        if (revitUser) {
            // Found in RevitUser table
            if (revitUser.status !== 'ACTIVE') {
                return redirectToRevit(port, { success: false, error: 'ACCOUNT_SUSPENDED', message: 'Tài khoản đã bị đình chỉ. Liên hệ Admin.' });
            }
            if (!revitUser.licenseActive) {
                return redirectToRevit(port, { success: false, error: 'NO_LICENSE', message: 'License chưa được kích hoạt. Liên hệ Admin.' });
            }
            if (revitUser.licenseExpiry && revitUser.licenseExpiry < new Date()) {
                return redirectToRevit(port, { success: false, error: 'LICENSE_EXPIRED', message: 'License đã hết hạn. Liên hệ Admin để gia hạn.' });
            }

            const newToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

            await prisma.revitUser.update({
                where: { id: revitUser.id },
                data: {
                    activeToken: newToken,
                    machineId: machineId,
                    lastLogin: new Date(),
                    ...(name && name !== revitUser.name ? { name } : {}),
                },
            });

            console.log(`[Revit OAuth] Login: ${email} (revit) via ${provider} on ${machineId}`);
            return redirectToRevit(port, {
                success: true, token: newToken, email: revitUser.email,
                name: revitUser.name || name, role: 'USER', company: '',
                expiresAt: expiresAt.toISOString(),
                licensePlan: revitUser.licensePlan || '',
                licenseActive: String(revitUser.licenseActive),
                licenseStart: revitUser.licenseStart?.toISOString() || '',
                licenseExpiry: revitUser.licenseExpiry?.toISOString() || '',
            });
        }

        // 2. Check User table (staff with Revit license)
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Auto-create user with PENDING status (or ACTIVE for super admin)
            const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
            user = await prisma.user.create({
                data: {
                    email, name, image: avatarUrl,
                    role: isSuperAdmin ? 'ADMIN' : 'USER',
                    status: isSuperAdmin ? UserStatus.ACTIVE : UserStatus.PENDING,
                    revitLicenseActive: isSuperAdmin,
                },
            });

            if (!isSuperAdmin) {
                return redirectToRevit(port, {
                    success: false, error: 'ACCOUNT_PENDING',
                    message: 'Tài khoản mới đã được tạo. Vui lòng chờ Admin phê duyệt.',
                });
            }
        }

        // Check status
        if (user.status !== UserStatus.ACTIVE) {
            const msg = user.status === UserStatus.PENDING
                ? 'Tài khoản đang chờ phê duyệt. Liên hệ Admin.'
                : 'Tài khoản đã bị đình chỉ. Liên hệ Admin.';
            return redirectToRevit(port, { success: false, error: 'ACCOUNT_' + user.status, message: msg });
        }

        // Check Revit license
        if (!user.revitLicenseActive) {
            return redirectToRevit(port, {
                success: false, error: 'NO_LICENSE',
                message: 'Tài khoản chưa được cấp quyền sử dụng Revit Add-in. Liên hệ Admin.',
            });
        }

        // Check license expiry
        if (user.revitLicenseExpiry && user.revitLicenseExpiry < new Date()) {
            return redirectToRevit(port, {
                success: false, error: 'LICENSE_EXPIRED',
                message: 'License đã hết hạn. Liên hệ Admin để gia hạn.',
            });
        }

        // === CREATE TOKEN (single device lock) ===
        const newToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                revitActiveToken: newToken,
                revitMachineId: machineId,
                revitLastLogin: new Date(),
                ...(name && name !== user.name ? { name } : {}),
                ...(avatarUrl && avatarUrl !== user.image ? { image: avatarUrl } : {}),
            },
        });

        console.log(`[Revit OAuth] Login: ${email} (staff) via ${provider} on ${machineId}`);

        return redirectToRevit(port, {
            success: true, token: newToken, email: user.email,
            name: user.name || name, role: user.role,
            company: user.department || '', expiresAt: expiresAt.toISOString(),
            licensePlan: user.revitLicensePlan || '',
            licenseActive: String(user.revitLicenseActive),
            licenseStart: user.revitLicenseStart?.toISOString() || '',
            licenseExpiry: user.revitLicenseExpiry?.toISOString() || '',
        });

    } catch (error) {
        console.error('[Revit OAuth Callback] Error:', error);
        return renderErrorPage('Lỗi hệ thống. Vui lòng thử lại sau.');
    }
}

/**
 * Redirect browser to Revit's local HTTP listener
 */
function redirectToRevit(port: string, data: Record<string, any>) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
        params.set(key, String(value));
    }
    const localUrl = `http://localhost:${port}/callback?${params.toString()}`;
    return NextResponse.redirect(localUrl);
}

/**
 * Render a simple error page in the browser
 */
function renderErrorPage(message: string) {
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ZFenix - Lỗi đăng nhập</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0a1628; color: #e2e8f0; 
               display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #1e293b; border-radius: 16px; padding: 40px; max-width: 440px; text-align: center;
                border: 1px solid #334155; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
        .icon { font-size: 48px; margin-bottom: 16px; }
        h2 { color: #f87171; margin: 0 0 12px; font-size: 20px; }
        p { color: #94a3b8; line-height: 1.6; margin: 0 0 24px; }
        .btn { display: inline-block; background: #1e40af; color: white; padding: 10px 24px; 
               border-radius: 8px; text-decoration: none; font-weight: 600; }
        .btn:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">❌</div>
        <h2>Đăng nhập thất bại</h2>
        <p>${message}</p>
        <p style="color: #64748b; font-size: 13px;">Bạn có thể đóng tab này và thử lại trong Revit.</p>
    </div>
</body>
</html>`;
    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}
