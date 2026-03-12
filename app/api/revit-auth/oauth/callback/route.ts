/**
 * GET /api/revit-auth/oauth/callback?code=xxx&state=xxx
 * 
 * OAuth callback handler for Revit Add-in.
 * Receives authorization code from Google/Microsoft,
 * exchanges for user profile, checks BOTH RevitUser + User tables.
 * 
 * ⚡ v3: Auto-creates 30-day TRIAL for first-time OAuth sign-ups
 * 
 * Flow:
 *  1. RevitUser exists → login (ACTIVE/TRIAL) or block (SUSPENDED/expired)
 *  2. User (staff) exists → check Revit license  
 *  3. New email → auto-create RevitUser with TRIAL_30D (no admin approval needed)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const TOKEN_EXPIRY_DAYS = 30;
const TRIAL_DAYS = 30;

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

        // === STEP 1: Exchange authorization code for user info ===
        let email: string = '';
        let name: string = '';
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
                        scope: 'openid email profile User.Read',
                    }),
                }
            );

            if (!tokenRes.ok) {
                const errBody = await tokenRes.text();
                console.error('[Revit OAuth] Microsoft token exchange failed:', errBody);
                return renderErrorPage('Không thể xác thực với Microsoft. Vui lòng thử lại.');
            }

            const tokenData = await tokenRes.json();

            // Strategy 1: Microsoft Graph API
            try {
                const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
                    headers: { Authorization: `Bearer ${tokenData.access_token}` },
                });
                const profile = await profileRes.json();
                email = (profile.mail || profile.userPrincipalName)?.toLowerCase();
                name = profile.displayName || 'User';
            } catch (graphErr) {
                console.error('[Revit OAuth] Graph API failed:', graphErr);
            }

            // Strategy 2: Fallback to id_token
            if (!email && tokenData.id_token) {
                try {
                    const payload = JSON.parse(
                        Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString()
                    );
                    email = (payload.email || payload.preferred_username)?.toLowerCase();
                    name = name || payload.name || 'User';
                } catch (jwtErr) {
                    console.error('[Revit OAuth] id_token decode failed:', jwtErr);
                }
            }
        } else {
            return renderErrorPage('Provider không hợp lệ.');
        }

        if (!email) {
            return renderErrorPage('Không lấy được email từ tài khoản OAuth.');
        }

        // === STEP 2: Check RevitUser table (standalone customers) ===
        const revitUser = await prisma.revitUser.findUnique({ where: { email } });

        if (revitUser) {
            // Found in RevitUser table — check status
            if (revitUser.status === 'SUSPENDED') {
                return redirectToRevit(port, {
                    success: false, error: 'ACCOUNT_SUSPENDED',
                    message: 'Tài khoản đã bị đình chỉ. Liên hệ Admin để được hỗ trợ.',
                });
            }

            if (!revitUser.licenseActive) {
                return redirectToRevit(port, {
                    success: false, error: 'NO_LICENSE',
                    message: 'License chưa được kích hoạt. Liên hệ Admin.',
                });
            }

            // Check expiry (applies to TRIAL and paid plans)
            if (revitUser.licenseExpiry && revitUser.licenseExpiry < new Date()) {
                const isTrialExpired = revitUser.status === 'TRIAL' || revitUser.licensePlan === 'TRIAL_30D';
                return redirectToRevit(port, {
                    success: false,
                    error: isTrialExpired ? 'TRIAL_EXPIRED' : 'LICENSE_EXPIRED',
                    message: isTrialExpired
                        ? 'Thời gian dùng thử 30 ngày đã hết. Liên hệ ZFenix để mua license chính thức.'
                        : 'License đã hết hạn. Liên hệ Admin để gia hạn.',
                });
            }

            // All checks passed — generate new token and login
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

            const isTrial = revitUser.status === 'TRIAL' || revitUser.licensePlan === 'TRIAL_30D';
            console.log(`[Revit OAuth] Login: ${email} (revitUser/${revitUser.status}) via ${provider} on ${machineId}`);

            return redirectToRevit(port, {
                success: true,
                token: newToken,
                email: revitUser.email,
                name: revitUser.name || name,
                role: 'USER',
                company: '',
                expiresAt: expiresAt.toISOString(),
                licensePlan: revitUser.licensePlan || '',
                licenseActive: String(revitUser.licenseActive),
                licenseStart: revitUser.licenseStart?.toISOString() || '',
                licenseExpiry: revitUser.licenseExpiry?.toISOString() || '',
                isTrial: String(isTrial),
                isNewUser: 'false',
            });
        }

        // === STEP 3: Check User table (ZFenix staff with Revit license) ===
        const staffUser = await prisma.user.findUnique({ where: { email } });

        if (staffUser) {
            // Staff account exists — check status
            if (staffUser.status !== UserStatus.ACTIVE) {
                const msg = staffUser.status === UserStatus.PENDING
                    ? 'Tài khoản đang chờ phê duyệt. Liên hệ Admin.'
                    : 'Tài khoản đã bị đình chỉ. Liên hệ Admin.';
                return redirectToRevit(port, { success: false, error: 'ACCOUNT_' + staffUser.status, message: msg });
            }

            // Check Revit license
            if (!staffUser.revitLicenseActive) {
                return redirectToRevit(port, {
                    success: false, error: 'NO_LICENSE',
                    message: 'Tài khoản chưa được cấp quyền sử dụng Revit Add-in. Liên hệ Admin.',
                });
            }

            // Check license expiry
            if (staffUser.revitLicenseExpiry && staffUser.revitLicenseExpiry < new Date()) {
                return redirectToRevit(port, {
                    success: false, error: 'LICENSE_EXPIRED',
                    message: 'License đã hết hạn. Liên hệ Admin để gia hạn.',
                });
            }

            // Generate token
            const newToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

            await prisma.user.update({
                where: { id: staffUser.id },
                data: {
                    revitActiveToken: newToken,
                    revitMachineId: machineId,
                    revitLastLogin: new Date(),
                    ...(name && name !== staffUser.name ? { name } : {}),
                    ...(avatarUrl && avatarUrl !== staffUser.image ? { image: avatarUrl } : {}),
                },
            });

            console.log(`[Revit OAuth] Login: ${email} (staff) via ${provider} on ${machineId}`);

            return redirectToRevit(port, {
                success: true,
                token: newToken,
                email: staffUser.email,
                name: staffUser.name || name,
                role: staffUser.role,
                company: staffUser.department || '',
                expiresAt: expiresAt.toISOString(),
                licensePlan: staffUser.revitLicensePlan || '',
                licenseActive: String(staffUser.revitLicenseActive),
                licenseStart: staffUser.revitLicenseStart?.toISOString() || '',
                licenseExpiry: staffUser.revitLicenseExpiry?.toISOString() || '',
                isTrial: 'false',
                isNewUser: 'false',
            });
        }

        // === STEP 4: New user — Auto-create 30-day TRIAL ===
        const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);

        if (isSuperAdmin) {
            // Super admin: create in User table with ACTIVE status
            const superAdmin = await prisma.user.create({
                data: {
                    email, name, image: avatarUrl,
                    role: 'ADMIN',
                    status: UserStatus.ACTIVE,
                    revitLicenseActive: true,
                },
            });

            const newToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

            await prisma.user.update({
                where: { id: superAdmin.id },
                data: { revitActiveToken: newToken, revitMachineId: machineId, revitLastLogin: new Date() },
            });

            console.log(`[Revit OAuth] SuperAdmin first login: ${email} via ${provider}`);
            return redirectToRevit(port, {
                success: true, token: newToken, email, name,
                role: 'ADMIN', company: '',
                expiresAt: expiresAt.toISOString(),
                licensePlan: 'LIFETIME', licenseActive: 'true',
                licenseStart: '', licenseExpiry: '',
                isTrial: 'false', isNewUser: 'true',
            });
        }

        // === AUTO-CREATE TRIAL USER (no admin approval needed) ===
        const trialStart = new Date();
        const trialExpiry = new Date();
        trialExpiry.setDate(trialExpiry.getDate() + TRIAL_DAYS);

        const newToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiresAt = new Date();
        tokenExpiresAt.setDate(tokenExpiresAt.getDate() + TOKEN_EXPIRY_DAYS);

        const newRevitUser = await prisma.revitUser.create({
            data: {
                email,
                name: name || email.split('@')[0],
                status: 'TRIAL',
                licensePlan: 'TRIAL_30D',
                licenseActive: true,
                licenseStart: trialStart,
                licenseExpiry: trialExpiry,
                trialUsed: true,
                registrationProvider: provider,
                activeToken: newToken,
                machineId: machineId,
                lastLogin: new Date(),
            },
        });

        console.log(`[Revit OAuth] NEW TRIAL user created: ${email} via ${provider} on ${machineId}, expires: ${trialExpiry.toISOString()}`);

        return redirectToRevit(port, {
            success: true,
            token: newToken,
            email: newRevitUser.email,
            name: newRevitUser.name || name,
            role: 'USER',
            company: '',
            expiresAt: tokenExpiresAt.toISOString(),
            licensePlan: 'TRIAL_30D',
            licenseActive: 'true',
            licenseStart: trialStart.toISOString(),
            licenseExpiry: trialExpiry.toISOString(),
            isTrial: 'true',
            isNewUser: 'true',
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
 * Render a branded error page in the browser
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
