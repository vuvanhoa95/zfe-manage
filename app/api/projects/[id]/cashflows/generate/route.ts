import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const generateSchema = z.object({
    quotationId: z.string().trim().min(1).optional(),
    includeExpenses: z.boolean().optional().default(true),
    overwriteExisting: z.boolean().optional().default(true),
});

async function updateProjectTotals(projectId: string) {
    // NOTE: Project totals are derived from final quotation, not cashflows.
    // Keep this as a no-op to avoid overwriting totals and causing mismatches.
    void projectId;
}

// POST /api/projects/[id]/cashflows/generate
// Body: { quotationId?: string, includeExpenses?: boolean, overwriteExisting?: boolean }
export async function POST(
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
        const rawBody = await request.json().catch(() => ({}));
        const parsed = generateSchema.safeParse(rawBody);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { quotationId, includeExpenses, overwriteExisting } = parsed.data;

        const project = await prisma.project.findUnique({
            where: { id: resolvedParams.id },
            select: { id: true, finalQuotationId: true },
        });
        if (!project) {
            return NextResponse.json({ success: false, error: 'Dự án không tồn tại' }, { status: 404 });
        }

        const targetQuotationId = quotationId || project.finalQuotationId;
        if (!targetQuotationId) {
            return NextResponse.json(
                { success: false, error: 'Vui lòng chọn báo giá (hoặc chốt báo giá) trước khi tạo dòng tiền' },
                { status: 400 }
            );
        }

        const quotation = await prisma.quotation.findUnique({
            where: { id: targetQuotationId },
            include: {
                paymentMilestones: { orderBy: { order: 'asc' } },
                outsourceLines: true,
            },
        });

        if (!quotation || quotation.projectId !== project.id) {
            return NextResponse.json({ success: false, error: 'Báo giá không thuộc dự án này' }, { status: 400 });
        }

        const autoTag = '[AUTO_FROM_QUOTATION]';
        const revenueBase = quotation.totalAfterVat ?? 0;

        const created = await prisma.$transaction(async (tx) => {
            if (overwriteExisting) {
                await tx.cashFlow.deleteMany({
                    where: {
                        projectId: project.id,
                        quotationId: quotation.id,
                        notes: { contains: autoTag },
                    },
                });
            }

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
                // Create INCOME flows by milestone percent
                for (const m of quotation.paymentMilestones) {
                    const amount = Math.round((revenueBase * (m.percent ?? 0)) / 100);
                    if (amount <= 0) continue;
                    payload.push({
                        projectId: project.id,
                        type: 'INCOME',
                        category: 'Thu từ báo giá',
                        description: `Thu theo mốc ${m.no}: ${m.title}`,
                        amount,
                        date: quotation.date,
                        quotationId: quotation.id,
                        notes: `${autoTag} ${m.description || 'Tự động tạo theo mốc thanh toán'}`,
                        createdById: userId,
                    });
                }
            } else if (revenueBase > 0) {
                // Fallback: single INCOME flow equals totalAfterVat
                payload.push({
                    projectId: project.id,
                    type: 'INCOME',
                    category: 'Thu từ báo giá',
                    description: 'Thu theo tổng báo giá (đã VAT)',
                    amount: Math.round(revenueBase),
                    date: quotation.date,
                    quotationId: quotation.id,
                    notes: `${autoTag} Tự động tạo theo tổng báo giá`,
                    createdById: userId,
                });
            }

            if (includeExpenses) {
                // Chi tiết outsource: mỗi nhân sự / dòng outsource tương ứng 1 dòng chi phí
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
                            projectId: project.id,
                            type: 'EXPENSE',
                            category: 'Chi phí outsource',
                            description: `Outsource${staffLabel}${disciplineLabel}`,
                            amount,
                            date: quotation.date,
                            quotationId: quotation.id,
                            notes: `${autoTag} Tự động tạo từ bảng nhân sự outsource`,
                            createdById: userId,
                        });
                    }
                } else if ((quotation.outsourceCost ?? 0) > 0) {
                    // Fallback: 1 dòng tổng chi phí outsource
                    payload.push({
                        projectId: project.id,
                        type: 'EXPENSE',
                        category: 'Chi phí outsource',
                        description: 'Chi phí outsource theo báo giá',
                        amount: Math.round(quotation.outsourceCost ?? 0),
                        date: quotation.date,
                        quotationId: quotation.id,
                        notes: `${autoTag} Tự động tạo từ chi phí outsource tổng`,
                        createdById: userId,
                    });
                }

                // Thuế & hoa hồng
                const taxAmount = Math.round(quotation.taxCost ?? 0);
                const commissionAmount = Math.round(quotation.commissionCost ?? 0);

                if (taxAmount > 0) {
                    payload.push({
                        projectId: project.id,
                        type: 'EXPENSE',
                        category: 'Chi phí thuế',
                        description: 'Chi phí thuế theo báo giá',
                        amount: taxAmount,
                        date: quotation.date,
                        quotationId: quotation.id,
                        notes: `${autoTag} Tự động tạo từ chi phí thuế trong báo giá`,
                        createdById: userId,
                    });
                }

                if (commissionAmount > 0) {
                    payload.push({
                        projectId: project.id,
                        type: 'EXPENSE',
                        category: 'Chi phí hoa hồng',
                        description: 'Chi phí hoa hồng theo báo giá',
                        amount: commissionAmount,
                        date: quotation.date,
                        quotationId: quotation.id,
                        notes: `${autoTag} Tự động tạo từ chi phí hoa hồng trong báo giá`,
                        createdById: userId,
                    });
                }
            }

            if (payload.length === 0) {
                return { createdCount: 0 };
            }

            await tx.cashFlow.createMany({ data: payload });
            return { createdCount: payload.length };
        });

        await updateProjectTotals(project.id);

        return NextResponse.json({
            success: true,
            data: created,
            message: created.createdCount > 0 ? 'Đã tạo dòng tiền từ báo giá' : 'Không có dữ liệu để tạo dòng tiền',
        });
    } catch (error: any) {
        console.error('Failed to generate cash flows from quotation:', error);
        return NextResponse.json({ success: false, error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}

