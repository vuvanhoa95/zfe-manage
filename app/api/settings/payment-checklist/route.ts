import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const CONFIG_KEY = 'payment_checklist_items';

/** Default checklist items */
const DEFAULT_ITEMS = [
    { key: 'contract', label: 'Hợp đồng / Phụ lục' },
    { key: 'acceptance', label: 'Biên bản nghiệm thu' },
    { key: 'invoice', label: 'Hóa đơn GTGT' },
    { key: 'request', label: 'Đề nghị thanh toán' },
    { key: 'handover', label: 'Biên bản bàn giao' },
];

// GET /api/settings/payment-checklist
export async function GET() {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key: CONFIG_KEY },
        });

        if (!config) {
            return NextResponse.json({ success: true, data: DEFAULT_ITEMS });
        }

        const items = JSON.parse(config.value);
        return NextResponse.json({ success: true, data: items });
    } catch (error: any) {
        console.error('Failed to get payment checklist config:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể tải cấu hình checklist' },
            { status: 500 }
        );
    }
}

// PUT /api/settings/payment-checklist
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const items: Array<{ key: string; label: string }> = body.items;

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Danh sách checklist không hợp lệ' },
                { status: 400 }
            );
        }

        // Validate each item
        for (const item of items) {
            if (!item.key || !item.label || typeof item.key !== 'string' || typeof item.label !== 'string') {
                return NextResponse.json(
                    { success: false, error: 'Mỗi mục cần có key và label hợp lệ' },
                    { status: 400 }
                );
            }
        }

        // Normalize keys
        const normalized = items.map((item) => ({
            key: item.key.trim().toLowerCase().replace(/\s+/g, '_'),
            label: item.label.trim(),
        }));

        await prisma.systemConfig.upsert({
            where: { key: CONFIG_KEY },
            update: {
                value: JSON.stringify(normalized),
                updatedBy: session.user.email || undefined,
            },
            create: {
                key: CONFIG_KEY,
                value: JSON.stringify(normalized),
                label: 'Checklist hồ sơ thanh toán',
                updatedBy: session.user.email || undefined,
            },
        });

        return NextResponse.json({
            success: true,
            data: normalized,
            message: 'Đã cập nhật checklist thanh toán',
        });
    } catch (error: any) {
        console.error('Failed to update payment checklist config:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể cập nhật cấu hình checklist' },
            { status: 500 }
        );
    }
}
