/**
 * proxy.ts - Vercel Middleware (dùng proxy.ts thay vì middleware.ts trên Vercel)
 * 
 * Bảo vệ routes:
 * - Revit users (userType=revit) KHÔNG được truy cập "/" (dashboard dự án)
 *   → redirect ngay về /revit-portal
 * - Staff users (userType=staff) KHÔNG được truy cập /revit-portal
 *   → redirect về /
 * - Unauthenticated users → redirect về /login
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const proxy = withAuth(
    function middleware(req: NextRequest) {
        const token = (req as any).nextauth?.token;
        const pathname = req.nextUrl.pathname;
        const userType = token?.userType;

        // ── Revit user cố truy cập "/" hoặc các route không phải /revit-portal ──
        if (userType === 'revit' && !pathname.startsWith('/revit-portal')) {
            const allowedForRevit = ['/change-password', '/api/'];
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
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: '/login',
        },
        secret: process.env.NEXTAUTH_SECRET,
    }
);

export const config = {
    matcher: [
        '/((?!login|forgot-password|reset-password|api/auth|api/revit-auth|_next|favicon|robots|sitemap).*)',
    ],
};

