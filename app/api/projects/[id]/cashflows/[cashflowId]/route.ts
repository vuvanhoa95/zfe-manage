import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const cashFlowUpdateSchema = z.object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    category: z.string().trim().min(1).max(200).optional().nullable(),
    description: z.string().trim().min(1).max(500).optional(),
    amount: z.coerce.number().finite().positive().optional(),
    date: z.union([z.string().min(1), z.date()]).optional(),
    quotationId: z.string().trim().min(1).optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
    documentStatus: z.enum(['NONE', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional().nullable(),
    documentNote: z.string().trim().max(500).optional().nullable(),
});

async function requireUserIdOrFallback() {
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user && (session.user as any).id ? ((session.user as any).id as string) : null;
    if (sessionUserId) return sessionUserId;

    const defaultUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true },
    });
    return defaultUser?.id || null;
}

async function updateProjectTotals(projectId: string) {
    // NOTE: Project totals are derived from final quotation, not cashflows.
    void projectId;
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; cashflowId: string }> | { id: string; cashflowId: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const rawBody = await request.json();
        const parsed = cashFlowUpdateSchema.safeParse(rawBody);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const userId = await requireUserIdOrFallback();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy người dùng. Vui lòng đăng nhập hoặc chạy seed database trước.' },
                { status: 400 }
            );
        }

        // Verify cashflow belongs to project & lấy thông tin hiện tại
        const existing = await prisma.cashFlow.findUnique({
            where: { id: resolvedParams.cashflowId },
            select: { id: true, projectId: true, type: true, amount: true, quotationId: true },
        });

        if (!existing || existing.projectId !== resolvedParams.id) {
            return NextResponse.json({ success: false, error: 'Dòng tiền không tồn tại' }, { status: 404 });
        }

        const { type, category, description, amount, date, quotationId, notes, documentStatus, documentNote } =
            parsed.data;

        // Lấy thông tin dự án để biết tổng doanh thu từ báo giá chốt
        const project = await prisma.project.findUnique({
            where: { id: resolvedParams.id },
            select: { id: true, totalRevenue: true },
        });
        if (!project) {
            return NextResponse.json({ success: false, error: 'Dự án không tồn tại' }, { status: 404 });
        }

        // Xác định báo giá liên kết (mới hoặc cũ) và lấy tổng tiền báo giá
        let effectiveQuotationId: string | null = quotationId === undefined ? existing.quotationId : quotationId || null;
        let quotationTotalAfterVat: number | null = null;
        if (effectiveQuotationId) {
            const quotation = await prisma.quotation.findUnique({
                where: { id: effectiveQuotationId },
                select: { id: true, totalAfterVat: true, projectId: true },
            });
            if (!quotation || quotation.projectId !== project.id) {
                return NextResponse.json({ success: false, error: 'Báo giá không tồn tại hoặc không thuộc dự án này' }, { status: 400 });
            }
            quotationTotalAfterVat = quotation.totalAfterVat ?? null;
        }

        // Với dòng THU, không cho phép tổng thu vượt quá giá trị báo giá
        const nextType = type ?? existing.type;
        const nextAmount = amount ?? existing.amount;

        if (nextType === 'INCOME') {
            const incomeLimit = quotationTotalAfterVat ?? project.totalRevenue ?? 0;

            if (incomeLimit > 0) {
                const existingIncome = await prisma.cashFlow.aggregate({
                    where: {
                        projectId: resolvedParams.id,
                        type: 'INCOME',
                        id: { not: existing.id },
                        ...(effectiveQuotationId ? { quotationId: effectiveQuotationId } : {}),
                    },
                    _sum: { amount: true },
                });

                const currentIncome = existingIncome._sum.amount ?? 0;
                const nextIncome = currentIncome + nextAmount;

                if (nextIncome - incomeLimit > 1) {
                    const formattedLimit = incomeLimit.toLocaleString('vi-VN');
                    const formattedCurrent = currentIncome.toLocaleString('vi-VN');
                    const formattedNew = nextAmount.toLocaleString('vi-VN');

                    return NextResponse.json(
                        {
                            success: false,
                            error: `Tổng thu không được vượt quá giá trị báo giá (${formattedLimit} đ). Hiện tại đã thu ${formattedCurrent} đ, đợt này là ${formattedNew} đ.`,
                        },
                        { status: 400 }
                    );
                }
            }
        }

        const updated = await prisma.cashFlow.update({
            where: { id: resolvedParams.cashflowId },
            data: {
                type,
                category: category === undefined ? undefined : category,
                description,
                amount,
                date: date ? (date instanceof Date ? date : new Date(date)) : undefined,
                quotationId: quotationId === undefined ? undefined : quotationId,
                notes: notes === undefined ? undefined : notes,
                documentStatus:
                    documentStatus === undefined ? undefined : documentStatus && documentStatus !== 'NONE'
                        ? documentStatus
                        : null,
                documentNote: documentNote === undefined ? undefined : documentNote || null,
                // keep createdById as-is; userId is fetched to ensure session exists
            },
            include: {
                quotation: { select: { id: true, quotationNo: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({
            success: true,
            data: updated,
            message: 'Cập nhật dòng tiền thành công',
        });
    } catch (error: any) {
        console.error('Failed to update cash flow:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể cập nhật dòng tiền',
                details:
                    process.env.NODE_ENV === 'development'
                        ? { message: error?.message, code: error?.code, meta: error?.meta }
                        : undefined,
            },
            { status: 500 },
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; cashflowId: string }> | { id: string; cashflowId: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const userId = await requireUserIdOrFallback();
        if (!userId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Không tìm thấy người dùng. Vui lòng đăng nhập hoặc chạy seed database trước.',
                },
                { status: 400 },
            );
        }

        const existing = await prisma.cashFlow.findUnique({
            where: { id: resolvedParams.cashflowId },
            select: { id: true, projectId: true },
        });

        if (!existing || existing.projectId !== resolvedParams.id) {
            return NextResponse.json({ success: false, error: 'Dòng tiền không tồn tại' }, { status: 404 });
        }

        await prisma.cashFlow.delete({ where: { id: resolvedParams.cashflowId } });

        return NextResponse.json({
            success: true,
            message: 'Xóa dòng tiền thành công',
        });
    } catch (error: any) {
        console.error('Failed to delete cash flow:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể xóa dòng tiền',
                details:
                    process.env.NODE_ENV === 'development'
                        ? { message: error?.message, code: error?.code, meta: error?.meta }
                        : undefined,
            },
            { status: 500 },
        );
    }
}

