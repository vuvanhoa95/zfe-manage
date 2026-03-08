/**
 * POST /api/auth/revit-login
 * 
 * Endpoint xác thực cho Revit Add-in desktop app.
 * Single Device Lock: login máy mới → tự động đá máy cũ.
 * 
 * 🛡️ Rate limited: 10 attempts / 15 minutes per IP
 */

import { NextResponse } from 'next/server';
import { revitLogin } from '@/lib/revit-auth';
import { revitCorsResponse, checkRateLimit, getClientIP } from '@/lib/api-security';

export async function POST(req: Request) {
    try {
        // 🛡️ Rate limit check
        const clientIP = getClientIP(req);
        if (!checkRateLimit(`revit-login:${clientIP}`, 10, 15 * 60 * 1000)) {
            return NextResponse.json(
                { success: false, message: 'Quá nhiều lần thử đăng nhập. Vui lòng chờ 15 phút.' },
                { status: 429 }
            );
        }

        const body = await req.json();
        const { email, password, machineId, addinVersion } = body;

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: 'Vui lòng nhập email và mật khẩu.' },
                { status: 400 }
            );
        }

        const result = await revitLogin(
            email,
            password,
            machineId || 'UNKNOWN',
            addinVersion
        );

        if (result.success) {
            return NextResponse.json({
                token: result.token,
                user: result.user,
                expiresAt: result.expiresAt,
                license: result.license,
            });
        } else {
            const status = result.message?.includes('mật khẩu') || result.message?.includes('Email')
                ? 401
                : 403;

            return NextResponse.json(
                { success: false, message: result.message },
                { status }
            );
        }
    } catch (error) {
        console.error('[Revit Login] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi hệ thống. Vui lòng thử lại sau.' },
            { status: 500 }
        );
    }
}

// Handle CORS preflight
export async function OPTIONS(req: Request) {
    return revitCorsResponse(req, 'POST, OPTIONS');
}
