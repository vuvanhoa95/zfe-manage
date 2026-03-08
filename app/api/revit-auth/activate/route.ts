/**
 * POST /api/revit-auth/activate
 * 
 * Kích hoạt hoặc gia hạn license Revit Add-in bằng license key.
 * 
 * Headers: Authorization: Bearer <token>
 * Body: { key: string }
 * 
 * Returns: { success, message, license }
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findByToken } from '@/lib/revit-auth';
import { revitCorsResponse } from '@/lib/api-security';

const PLAN_MONTHS: Record<string, number | null> = {
    '1M': 1, '3M': 3, '6M': 6, '1Y': 12, 'LIFETIME': null,
};

const PLAN_LABELS: Record<string, string> = {
    '1M': '1 tháng', '3M': '3 tháng', '6M': '6 tháng',
    '1Y': '1 năm', 'LIFETIME': 'Trọn đời',
};

export async function POST(req: Request) {
    try {
        // 1. Auth check
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Chưa đăng nhập. Vui lòng đăng nhập trước.' },
                { status: 401 }
            );
        }

        // 2. Parse body
        const body = await req.json();
        const { key } = body;

        if (!key || typeof key !== 'string' || key.trim().length < 4) {
            return NextResponse.json(
                { success: false, message: 'Mã kích hoạt không hợp lệ.' },
                { status: 400 }
            );
        }

        const normalizedKey = key.trim().toUpperCase();

        // 3. Find user by token (dual-table lookup)
        const found = await findByToken(token);
        if (!found) {
            return NextResponse.json(
                { success: false, message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' },
                { status: 401 }
            );
        }

        // 4. Find license key
        const licenseKey = await prisma.revitLicenseKey.findUnique({
            where: { key: normalizedKey },
        });

        if (!licenseKey) {
            return NextResponse.json(
                { success: false, message: 'Mã kích hoạt không tồn tại. Vui lòng kiểm tra lại.' },
                { status: 404 }
            );
        }

        if (licenseKey.usedBy) {
            return NextResponse.json(
                { success: false, message: `Mã kích hoạt đã được sử dụng bởi ${licenseKey.usedBy}.` },
                { status: 400 }
            );
        }

        // 5. Calculate dates
        const startDate = new Date();
        let expiryDate: Date | null = null;
        const months = PLAN_MONTHS[licenseKey.plan];
        if (months !== null && months !== undefined) {
            expiryDate = new Date(startDate);
            expiryDate.setMonth(expiryDate.getMonth() + months);
        }

        // 6. Update user license (depends on source table)
        if (found.source === 'staff') {
            await prisma.user.update({
                where: { id: found.id },
                data: {
                    revitLicenseActive: true,
                    revitLicensePlan: licenseKey.plan,
                    revitLicenseStart: startDate,
                    revitLicenseExpiry: expiryDate,
                },
            });
        } else {
            await prisma.revitUser.update({
                where: { id: found.id },
                data: {
                    licenseActive: true,
                    licensePlan: licenseKey.plan,
                    licenseStart: startDate,
                    licenseExpiry: expiryDate,
                },
            });
        }

        // 7. Mark key as used
        await prisma.revitLicenseKey.update({
            where: { id: licenseKey.id },
            data: {
                usedBy: found.email,
                usedAt: new Date(),
            },
        });

        console.log(`[Revit Activate] ${found.email} activated key ${normalizedKey} → plan ${licenseKey.plan}`);

        return NextResponse.json({
            success: true,
            message: `Kích hoạt thành công! Gói: ${PLAN_LABELS[licenseKey.plan] || licenseKey.plan}`,
            license: {
                plan: licenseKey.plan,
                active: true,
                start: startDate.toISOString(),
                expiry: expiryDate?.toISOString() || null,
            },
        });
    } catch (error) {
        console.error('[Revit Activate] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi hệ thống. Vui lòng thử lại.' },
            { status: 500 }
        );
    }
}

// Handle CORS preflight
export async function OPTIONS(req: Request) {
    return revitCorsResponse(req, 'POST, OPTIONS');
}
