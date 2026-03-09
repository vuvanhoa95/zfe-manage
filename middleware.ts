/**
 * middleware.ts
 * 
 * Bảo vệ routes:
 * - Revit users (userType=revit) KHÔNG được truy cập "/" (dashboard dự án)
 *   → redirect ngay về /revit-portal
 * - Staff users (userType=staff) KHÔNG được truy cập /revit-portal
 *   → redirect về /
 * - Unauthenticated users → redirect về /login
 * 
 * Áp dụng cho: tất cả routes trừ /login, /api, /_next, /public
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
    function middleware(req: NextRequest) {
        const token = (req as any).nextauth?.token;
        const pathname = req.nextUrl.pathname;
        const userType = token?.userType;

        // ── Revit user cố truy cập dashboard "/" hoặc routes khác (không phải /revit-portal) ──
        if (userType === 'revit' && !pathname.startsWith('/revit-portal')) {
            // Cho phép những routes cần thiết cho revit user
            const allowedForRevit = [
                '/change-password',
                '/api/',
            ];
            const isAllowed = allowedForRevit.some(p => pathname.startsWith(p));
            if (!isAllowed) {
                return NextResponse.redirect(new URL('/revit-portal', req.url));
            }
        }

        // ── Staff user cố truy cập /revit-portal ──
        if (userType !== 'revit' && pathname.startsWith('/revit-portal')) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            // Chỉ chạy middleware nếu có token hợp lệ
            // Nếu không có token → withAuth tự redirect về /login
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: '/login',
        },
    }
);

export const config = {
    matcher: [
        /*
         * Match tất cả routes TRỪ:
         * - /login, /forgot-password, /reset-password (auth pages)
         * - /api/auth/* (NextAuth callbacks)
         * - /api/revit-auth/* (Revit OAuth)
         * - /_next/* (Next.js assets)
         * - /favicon*, /robots.txt, /sitemap.xml
         */
        /*
         * QUAN TRỌNG: api/auth phải được exclude để NextAuth tự xử lý.
         * /api/auth/session-redirect vẫn cần session → NextAuth handle trước, 
         * sau đó redirect đúng chỗ.
         */
        '/((?!login|forgot-password|reset-password|api/auth|api/revit-auth|_next|favicon|robots|sitemap).*)',
    ],
};
