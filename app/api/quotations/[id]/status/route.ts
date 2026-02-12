import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { assertCanEditQuotation } from '@/lib/permissions';

// Trạng thái tối giản cho báo giá
const STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const;

type QuotationStatus = (typeof STATUSES)[number];

const statusSchema = z.object({
    status: z.enum(STATUSES),
});

// Quy tắc chuyển trạng thái:
// DRAFT → SENT | ACCEPTED | REJECTED (linh hoạt cho báo giá nội bộ)
// SENT  → ACCEPTED | REJECTED
// ACCEPTED: chỉ cho phép giữ nguyên (không quay lại)
// REJECTED: cho phép chuyển lại SENT (gửi lại khách)
const ALLOWED_TRANSITIONS: Partial<Record<QuotationStatus, QuotationStatus[]>> = {
    DRAFT: ['SENT', 'ACCEPTED', 'REJECTED'],
    SENT: ['ACCEPTED', 'REJECTED'],
    REJECTED: ['SENT'],
};

function canTransition(from: QuotationStatus, to: QuotationStatus): boolean {
    if (from === to) return true;
    const allowed = ALLOWED_TRANSITIONS[from];
    return !!allowed && allowed.includes(to);
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const user = {
            id: (session.user as any).id as string,
            email: session.user.email ?? null,
            name: session.user.name ?? null,
            role: ((session.user as any).role as 'ADMIN' | 'USER') ?? 'USER',
        };

        // Handle both sync and async params (Next.js 15+)
        const resolvedParams = params instanceof Promise ? await params : params;

        const bodyUnknown = await request.json().catch(() => ({}));
        const parsed = statusSchema.safeParse(bodyUnknown);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Trạng thái báo giá không hợp lệ',
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const newStatus = parsed.data.status;

        const existing = await prisma.quotation.findUnique({
            where: { id: resolvedParams.id },
            select: { id: true, status: true, createdById: true },
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });
        }

        try {
            assertCanEditQuotation(user, existing);
        } catch {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const currentStatus = existing.status as QuotationStatus;

        if (!canTransition(currentStatus, newStatus)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Không thể chuyển trạng thái từ ${currentStatus} sang ${newStatus}`,
                },
                { status: 400 },
            );
        }

        const updated = await prisma.quotation.update({
            where: { id: resolvedParams.id },
            data: { status: newStatus },
            select: {
                id: true,
                status: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: updated,
            message: 'Cập nhật trạng thái báo giá thành công',
        });
    } catch (error: any) {
        console.error('Error updating quotation status:', error);
        return NextResponse.json(
            {
                success: false,
                error: error?.message || 'Failed to update quotation status',
            },
            { status: 500 },
        );
    }
}

