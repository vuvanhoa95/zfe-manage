import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const AUTO_TAG = '[AUTO_FROM_QUOTATION]';

async function regenerateCashFlowsFromQuotation(projectId: string, quotationId: string, createdById: string) {
    const quotation = await prisma.quotation.findUnique({
        where: { id: quotationId },
        include: {
            paymentMilestones: { orderBy: { order: 'asc' } },
            outsourceLines: true,
        },
    });

    if (!quotation || quotation.projectId !== projectId) {
        throw new Error('Báo giá không thuộc dự án này');
    }

    const revenueBase = quotation.totalAfterVat ?? 0;

    // Xóa toàn bộ cashflow tự động cũ cho dự án này
    await prisma.cashFlow.deleteMany({
        where: {
            projectId,
            notes: { contains: AUTO_TAG },
        },
    });

    const payload: Array<{
            projectId: string;
            type: 'INCOME' | 'EXPENSE';
            category: string;
            description: string;
            amount: number;
            date: Date;
            quotationId: string;
            notes: string;
            createdById: string;
        }> = [];

    if (quotation.paymentMilestones.length > 0) {
        for (const m of quotation.paymentMilestones) {
            const amount = Math.round((revenueBase * (m.percent ?? 0)) / 100);
            if (amount <= 0) continue;
            payload.push({
                projectId,
                type: 'INCOME',
                category: 'Thu từ báo giá',
                description: `Thu theo mốc ${m.no}: ${m.title}`,
                amount,
                date: quotation.date,
                quotationId: quotation.id,
                notes: `${AUTO_TAG} ${m.description || 'Tự động tạo theo mốc thanh toán'}`,
                createdById,
            });
        }
    } else if (revenueBase > 0) {
        payload.push({
            projectId,
            type: 'INCOME',
            category: 'Thu từ báo giá',
            description: 'Thu theo tổng báo giá (đã VAT)',
            amount: Math.round(revenueBase),
            date: quotation.date,
            quotationId: quotation.id,
            notes: `${AUTO_TAG} Tự động tạo theo tổng báo giá`,
            createdById,
        });
    }

    // Chi tiết outsource per nhân sự
    if (quotation.outsourceLines.length > 0) {
        for (const l of quotation.outsourceLines) {
            const baseAmount =
                typeof l.amount === 'number'
                    ? l.amount
                    : (l.qty ?? 0) * (l.unitRate ?? 0);
            const amount = Math.round(baseAmount);
            if (amount <= 0) continue;

            const staffLabel = l.staffName ? ` - ${l.staffName}` : '';
            const disciplineLabel = l.discipline ? ` (${l.discipline})` : '';

            payload.push({
                projectId,
                type: 'EXPENSE',
                category: 'Chi phí outsource',
                description: `Outsource${staffLabel}${disciplineLabel}`,
                amount,
                date: quotation.date,
                quotationId: quotation.id,
                notes: `${AUTO_TAG} Tự động tạo từ bảng nhân sự outsource`,
                createdById,
            });
        }
    } else if ((quotation.outsourceCost ?? 0) > 0) {
        payload.push({
            projectId,
            type: 'EXPENSE',
            category: 'Chi phí outsource',
            description: 'Chi phí outsource theo báo giá',
            amount: Math.round(quotation.outsourceCost ?? 0),
            date: quotation.date,
            quotationId: quotation.id,
            notes: `${AUTO_TAG} Tự động tạo từ chi phí outsource tổng`,
            createdById,
        });
    }

    const taxAmount = Math.round(quotation.taxCost ?? 0);
    const commissionAmount = Math.round(quotation.commissionCost ?? 0);

    if (taxAmount > 0) {
        payload.push({
            projectId,
            type: 'EXPENSE',
            category: 'Chi phí thuế',
            description: 'Chi phí thuế theo báo giá',
            amount: taxAmount,
            date: quotation.date,
            quotationId: quotation.id,
            notes: `${AUTO_TAG} Tự động tạo từ chi phí thuế trong báo giá`,
            createdById,
        });
    }

    if (commissionAmount > 0) {
        payload.push({
            projectId,
            type: 'EXPENSE',
            category: 'Chi phí hoa hồng',
            description: 'Chi phí hoa hồng theo báo giá',
            amount: commissionAmount,
            date: quotation.date,
            quotationId: quotation.id,
            notes: `${AUTO_TAG} Tự động tạo từ chi phí hoa hồng trong báo giá`,
            createdById,
        });
    }

    if (payload.length) {
        await prisma.cashFlow.createMany({ data: payload });
    }
}

// PUT /api/projects/[id]/final-quotation
// Body: { quotationId: string | null }
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as any).id as string;

        const resolvedParams = params instanceof Promise ? await params : params;
        const body = (await request.json()) as { quotationId?: string | null };
        const quotationId = body?.quotationId ?? null;

        const project = await prisma.project.findUnique({
            where: { id: resolvedParams.id },
            select: { id: true },
        });

        if (!project) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }

        let updated: { id: string; finalQuotationId: string | null };

        // Unset "báo giá chốt": clear finalQuotationId and reset financial summary
        if (!quotationId) {
            updated = await prisma.project.update({
                where: { id: project.id },
                data: {
                    finalQuotationId: null,
                    totalBudget: 0,
                    totalRevenue: 0,
                    totalCost: 0,
                    totalProfit: 0,
                },
                select: { id: true, finalQuotationId: true },
            });
        } else {
            // Set "báo giá chốt": validate and sync financial summary from quotation
            const quotation = await prisma.quotation.findUnique({
                where: { id: quotationId },
                select: {
                    id: true,
                    projectId: true,
                    totalAfterVat: true,
                    outsourceCost: true,
                    taxCost: true,
                    commissionCost: true,
                },
            });

            if (!quotation || quotation.projectId !== project.id) {
                throw new Error('Báo giá không thuộc dự án này');
            }

            const revenue = quotation.totalAfterVat ?? 0;
            const totalCost =
                (quotation.outsourceCost ?? 0) +
                (quotation.taxCost ?? 0) +
                (quotation.commissionCost ?? 0);
            const totalProfit = revenue - totalCost;

            updated = await prisma.project.update({
                where: { id: project.id },
                data: {
                    finalQuotationId: quotation.id,
                    totalBudget: revenue,
                    totalRevenue: revenue,
                    totalCost,
                    totalProfit,
                },
                select: { id: true, finalQuotationId: true },
            });
        }

        // Auto-regenerate cashflows to match final quotation (keeps CashFlow tab consistent)
        if (updated.finalQuotationId) {
            await regenerateCashFlowsFromQuotation(project.id, updated.finalQuotationId, userId);
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        console.error('Failed to set final quotation:', error);

        // Friendly message for common validation failures
        if (error instanceof Error && error.message.includes('Báo giá không thuộc dự án này')) {
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        return NextResponse.json(
            { success: false, error: error?.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

