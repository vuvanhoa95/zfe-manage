import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/revit-portal/me
 * Lấy thông tin license của RevitUser đang đăng nhập
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const userType = (session.user as any).userType;

        if (userType !== 'revit') {
            return NextResponse.json({ success: false, error: 'Không phải Revit user' }, { status: 403 });
        }

        const revitUser = await prisma.revitUser.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                status: true,
                licensePlan: true,
                licenseActive: true,
                licenseStart: true,
                licenseExpiry: true,
                machineId: true,
                lastLogin: true,
                createdAt: true,
            },
        });

        if (!revitUser) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy thông tin' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: revitUser });
    } catch (error: any) {
        console.error('[API] Revit portal me error:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi hệ thống' },
            { status: 500 }
        );
    }
}
