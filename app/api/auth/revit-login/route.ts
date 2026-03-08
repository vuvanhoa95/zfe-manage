/**
 * POST /api/auth/revit-login
 * 
 * Endpoint xác thực cho Revit Add-in desktop app.
 * Single Device Lock: login máy mới → tự động đá máy cũ.
 * 
 * Request body:
 * {
 *   "email": "user@company.com",
 *   "password": "abc123",
 *   "machineId": "DESKTOP-ABC123",
 *   "addinVersion": "1.0.0"
 * }
 */

import { NextResponse } from 'next/server';
import { revitLogin } from '@/lib/revit-auth';

export async function POST(req: Request) {
    try {
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
            });
        } else {
            // Xác định HTTP status code dựa trên loại lỗi
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

// Handle CORS preflight (nếu cần)
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
