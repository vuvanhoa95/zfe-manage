import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQuotationNumber, calculateQuotationTotals } from '@/lib/utils';
import { numberToVietnameseWords } from '@/lib/number-to-words-vn';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/quotations/[id]/duplicate
// Creates a new quotation copied from source (lines + milestones), status resets to DRAFT.
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
        const quotationId = resolvedParams.id;

        if (!quotationId) {
            return NextResponse.json(
                { success: false, error: 'Thiếu ID báo giá để nhân bản' },
                { status: 400 }
            );
        }

        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as any).id as string;

        const source = await prisma.quotation.findUnique({
            where: { id: quotationId },
            include: {
                lines: { orderBy: { order: 'asc' } },
                paymentMilestones: { orderBy: { order: 'asc' } },
            },
        });

        if (!source) {
            return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });
        }

        const year = new Date().getFullYear();
        const lastQuotation = await prisma.quotation.findFirst({
            orderBy: { quotationNo: 'desc' },
            select: { quotationNo: true },
        });
        const quotationNo = generateQuotationNumber(lastQuotation?.quotationNo || null, year);

        const linesForTotals = source.lines.map((l: { qty: number | null; unitPrice: number | null; isChargeable: boolean }) => ({
            qty: l.qty,
            unitPrice: l.unitPrice,
            isChargeable: l.isChargeable,
            // legacy: treat all as fixed
        }));

        const { totalBeforeVat, vatAmount, totalAfterVat } = calculateQuotationTotals(
            linesForTotals as any,
            source.vatRate,
            0
        );
        const totalInWords = numberToVietnameseWords(totalAfterVat);

        const created = await prisma.quotation.create({
            data: {
                quotationNo,
                projectId: source.projectId,
                date: new Date(),
                location: source.location,
                customerId: source.customerId,
                projectName: source.projectName,
                projectItem: source.projectItem,
                projectNotes: source.projectNotes,
                title: source.title,
                introText: source.introText,
                scopeText: source.scopeText,
                deliverablesText: source.deliverablesText,
                scheduleText: source.scheduleText,
                currency: source.currency,
                vatRate: source.vatRate,
                outsourceCost: source.outsourceCost,
                taxRate: source.taxRate,
                taxCost: source.taxCost,
                commissionType: source.commissionType,
                commissionRate: source.commissionRate,
                commissionCost: source.commissionCost,
                totalBeforeVat,
                vatAmount,
                totalAfterVat,
                totalInWords,
                status: 'DRAFT',
                notes: source.notes ? `${source.notes}\n(Đã nhân bản)` : 'Đã nhân bản từ báo giá khác',
                createdById: userId,
                lines: {
                    create: source.lines.map((line: {
                        section: string | null;
                        itemNo: string | null;
                        title: string | null;
                        qty: number | null;
                        unit: string | null;
                        unitPrice: number | null;
                        total: number | null;
                        note: string | null;
                        order: number | null;
                        isGroupHeader: boolean;
                        isChargeable: boolean;
                    }) => ({
                        section: line.section,
                        itemNo: line.itemNo,
                        title: line.title,
                        qty: line.qty,
                        unit: line.unit,
                        unitPrice: line.unitPrice,
                        total: (line.qty || 1) * (line.unitPrice || 0),
                        note: line.note,
                        order: line.order,
                        isGroupHeader: line.isGroupHeader,
                        isChargeable: line.isChargeable,
                    })),
                },
                paymentMilestones: {
                    create: source.paymentMilestones.map((m: {
                        no: number | null;
                        title: string | null;
                        percent: number | null;
                        description: string | null;
                        order: number | null;
                    }) => ({
                        no: m.no,
                        title: m.title,
                        percent: m.percent,
                        description: m.description,
                        order: m.order,
                    })),
                },
            },
            select: { id: true, quotationNo: true },
        });

        return NextResponse.json({
            success: true,
            data: created,
            message: 'Đã nhân bản báo giá',
        });
    } catch (error: any) {
        console.error('Error duplicating quotation:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to duplicate quotation' },
            { status: 500 }
        );
    }
}

