import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/notifications — lấy thông báo của user hiện tại
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user && (session.user as any).id;

        let resolvedUserId: string;
        if (!userId) {
            const defaultUser = await prisma.user.findFirst({
                orderBy: { createdAt: 'asc' },
                select: { id: true },
            });
            if (!defaultUser) {
                return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
            }
            resolvedUserId = defaultUser.id;
        } else {
            resolvedUserId = userId;
        }

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unread') === 'true';
        const limit = parseInt(searchParams.get('limit') || '30', 10);

        const notifications = await prisma.notification.findMany({
            where: {
                userId: resolvedUserId,
                ...(unreadOnly ? { read: false } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: resolvedUserId, read: false },
        });

        return NextResponse.json({
            success: true,
            data: { notifications, unreadCount },
        });
    } catch (error: any) {
        console.error('Failed to fetch notifications:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể tải thông báo' },
            { status: 500 }
        );
    }
}

// PATCH /api/notifications — đánh dấu đã đọc
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user && (session.user as any).id;

        let resolvedId: string;
        if (!userId) {
            const defaultUser = await prisma.user.findFirst({
                orderBy: { createdAt: 'asc' },
                select: { id: true },
            });
            if (!defaultUser) {
                return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
            }
            resolvedId = defaultUser.id;
        } else {
            resolvedId = userId;
        }

        const body = await request.json();

        if (body.markAllRead) {
            // Đánh dấu tất cả đã đọc
            await prisma.notification.updateMany({
                where: { userId: resolvedId, read: false },
                data: { read: true },
            });
        } else if (body.notificationId) {
            // Đánh dấu 1 cái đã đọc
            await prisma.notification.updateMany({
                where: { id: body.notificationId, userId: resolvedId },
                data: { read: true },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to update notification:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể cập nhật thông báo' },
            { status: 500 }
        );
    }
}
