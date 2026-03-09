/**
 * GET /api/auth/session-redirect
 * 
 * Smart redirect sau khi đăng nhập (dùng cho social login callbackUrl).
 * Đọc session → nếu userType === 'revit' → redirect /revit-portal
 * Ngược lại → redirect /
 * 
 * Bảo mật: Revit users không bao giờ thấy trang dashboard dự án.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'https://zfenixmanage.site'));
    }

    const userType = (session.user as any)?.userType;

    if (userType === 'revit') {
        return NextResponse.redirect(new URL('/revit-portal', process.env.NEXTAUTH_URL || 'https://zfenixmanage.site'));
    }

    return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL || 'https://zfenixmanage.site'));
}
