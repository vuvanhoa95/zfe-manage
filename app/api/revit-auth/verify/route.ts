/**
 * GET /api/auth/revit-verify
 * 
 * Xác minh token từ Revit Add-in còn hợp lệ không.
 * Dùng khi:
 * - Revit khởi động (CheckAuthentication)
 * - Định kỳ kiểm tra token
 * 
 * Headers:
 *   Authorization: Bearer <token>
 */

import { NextResponse } from 'next/server';
import { revitVerify } from '@/lib/revit-auth';

export async function GET(req: Request) {
    try {
        // Lấy token từ header
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token) {
            return NextResponse.json(
                { valid: false, message: 'Không tìm thấy token xác thực.' },
                { status: 401 }
            );
        }

        const result = await revitVerify(token);

        if (result.valid) {
            return NextResponse.json({
                valid: true,
                user: result.user,
            });
        } else {
            return NextResponse.json(
                { valid: false, message: result.message },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('[Revit Verify] Error:', error);
        return NextResponse.json(
            { valid: false, message: 'Lỗi hệ thống khi xác minh token.' },
            { status: 500 }
        );
    }
}

// Handle CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
