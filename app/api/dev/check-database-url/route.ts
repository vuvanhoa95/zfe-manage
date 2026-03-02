import { NextRequest, NextResponse } from 'next/server';

// GET /api/dev/check-database-url - Check DATABASE_URL format (ẩn password)
export async function GET(request: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { success: false, error: 'Not Found' },
            { status: 404 },
        );
    }

    const databaseUrl = process.env.DATABASE_URL || '';

    if (!databaseUrl) {
        return NextResponse.json({
            success: false,
            error: 'DATABASE_URL không được set',
            hint: 'Vui lòng thêm DATABASE_URL vào file .env hoặc .env.local',
        });
    }

    // Ẩn password trong URL để log an toàn
    const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':***@');

    const isValidPostgres =
        databaseUrl.startsWith('postgresql://') ||
        databaseUrl.startsWith('postgres://') ||
        databaseUrl.startsWith('prisma://') ||
        databaseUrl.startsWith('prisma+postgres://');

    return NextResponse.json({
        success: true,
        data: {
            hasDatabaseUrl: !!databaseUrl,
            urlLength: databaseUrl.length,
            maskedUrl, // URL đã ẩn password
            isValidPostgres,
            currentFormat: databaseUrl.substring(0, 20) + '...',
            requiredFormat: 'postgresql://user:password@host:port/database',
            hint: isValidPostgres
                ? '✅ DATABASE_URL format đúng cho PostgreSQL'
                : '❌ DATABASE_URL không đúng format. Vui lòng sửa thành: postgresql://user:password@host:port/database',
        },
    });
}
