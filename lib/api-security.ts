import { NextResponse } from 'next/server';

/**
 * 🛡️ CORS headers cho Revit Add-in API
 * 
 * Desktop app (Revit) cần CORS open vì gọi từ localhost.
 * Nhưng ta giới hạn methods + cache + thêm rate limit logic.
 */

// Allowed origins - Desktop apps don't send Origin header,
// but browsers do. We restrict browser access.
const ALLOWED_ORIGINS = [
    'https://zfenixmanage.site',
    'https://www.zfenixmanage.site',
    'http://localhost:3009',
    'http://localhost:3000',
];

export function getRevitCorsHeaders(
    requestOrigin: string | null,
    methods: string = 'GET, POST, OPTIONS'
): Record<string, string> {
    // If no origin (desktop app), allow
    // If origin matches whitelist, allow
    // Otherwise, don't set Allow-Origin (browser will block)
    let allowOrigin = '';

    if (!requestOrigin) {
        // No Origin header = desktop app or server-to-server
        allowOrigin = '*';
    } else if (ALLOWED_ORIGINS.includes(requestOrigin)) {
        allowOrigin = requestOrigin;
    }
    // else: no Access-Control-Allow-Origin = browser blocked

    const headers: Record<string, string> = {
        'Access-Control-Allow-Methods': methods,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // Cache preflight 24h
    };

    if (allowOrigin) {
        headers['Access-Control-Allow-Origin'] = allowOrigin;
    }

    return headers;
}

export function revitCorsResponse(request: Request, methods?: string) {
    const origin = request.headers.get('Origin');
    return new NextResponse(null, {
        status: 204,
        headers: getRevitCorsHeaders(origin, methods),
    });
}

// ─── Rate Limiting ──────────────────────────────────────
// In-memory rate limiter (suitable for serverless with low traffic)

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple rate limiter for login endpoints.
 * Blocks after `maxAttempts` within `windowMs`.
 * 
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
    identifier: string,
    maxAttempts: number = 10,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetAt) {
        // New window
        rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
        return true;
    }

    entry.count++;

    if (entry.count > maxAttempts) {
        return false; // Rate limited!
    }

    return true;
}

/**
 * Extract client IP from request headers (works on Vercel, Cloudflare, etc.)
 */
export function getClientIP(request: Request): string {
    const forwarded = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const realIp = request.headers.get('x-real-ip') || '';
    return forwarded || realIp || 'unknown';
}
