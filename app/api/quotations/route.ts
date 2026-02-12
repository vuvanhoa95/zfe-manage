import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    generateQuotationNumber,
    calculateQuotationTotals,
    enrichQuotationLinesWithProjectContext,
} from '@/lib/utils';
import { numberToVietnameseWords } from '@/lib/number-to-words-vn';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createQuotationSchema } from '@/lib/validation/quotation';
import { generateUniqueQuotationNumber } from '@/lib/quotation-number';
import { sendQuotationCreatedEmail, buildQuotationUrl, getAdminEmails } from '@/lib/email/send';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');

        const where: any = {};
        if (status && status !== 'ALL') where.status = status;
        if (search) {
            where.OR = [
                { quotationNo: { contains: search } },
                { projectName: { contains: search } },
            ];
        }

        const quotations = await prisma.quotation.findMany({
            where,
            include: {
                customer: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        const total = await prisma.quotation.count({ where });

        return NextResponse.json({
            success: true,
            data: quotations,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const json = await request.json();
        const parsed = createQuotationSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Dữ liệu báo giá không hợp lệ',
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const body: any = parsed.data;
        const session = await getServerSession(authOptions);

        if (!session?.user || !(session.user as any).id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const userName = session.user.name || 'Admin';

        // Generate unique quotation number
        const quotationNo = await generateUniqueQuotationNumber();

        // Calculate and enrich lines
        const enrichedLines = enrichQuotationLinesWithProjectContext(body.lines || [], {
            projectName: body.projectName,
            projectItem: body.projectItem,
            totalArea: body.totalArea,
        });

        const { totalBeforeVat, vatAmount, totalAfterVat } = calculateQuotationTotals(
            enrichedLines,
            body.vatRate,
            body.totalArea || 0
        );

        const totalInWords = numberToVietnameseWords(totalAfterVat);

        // Create quotation with lines and milestones
        const quotation: any = await prisma.quotation.create({
            data: {
                quotationNo,
                projectId: body.projectId,
                date: new Date(body.date),
                location: body.location,
                customerId: body.customerId,
                projectName: body.projectName,
                projectItem: body.projectItem,
                projectNotes: body.projectNotes,
                totalArea: body.totalArea,
                title: body.title,
                introText: body.introText,
                scopeText: body.scopeText,
                deliverablesText: body.deliverablesText,
                scheduleText: body.scheduleText,
                vatRate: body.vatRate,
                outsourceCost: body.outsourceCost,
                outsourceStaff: body.outsourceStaff,
                outsourceDiscipline: body.outsourceDiscipline,
                outsourceRate: body.outsourceRate,
                outsourceNote: body.outsourceNote,
                taxRate: body.taxRate,
                taxCost: body.taxCost,
                commissionType: body.commissionType,
                commissionRate: body.commissionRate,
                commissionCost: body.commissionCost,
                totalBeforeVat,
                vatAmount,
                totalAfterVat,
                totalInWords,
                status: body.status,
                notes: body.notes,
                createdById: userId,
                lines: {
                    create: enrichedLines.map((line: any) => ({
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
                outsourceLines: body.outsourceLines?.length
                    ? {
                        create: body.outsourceLines.map((l: any, idx: number) => ({
                            staffName: l.staffName ?? null,
                            discipline: l.discipline ?? null,
                            unit: l.unit ?? null,
                            qty: l.qty ?? null,
                            unitRate: l.unitRate ?? null,
                            amount: Math.round((l.qty ?? 0) * (l.unitRate ?? 0)),
                            note: l.note ?? null,
                            order: typeof l.order === 'number' ? l.order : idx,
                        })),
                    }
                    : undefined,
                paymentMilestones: {
                    create: (body.paymentMilestones || []).map((milestone: any) => ({
                        no: milestone.no,
                        title: milestone.title,
                        percent: milestone.percent,
                        description: milestone.description,
                        expectedDate: milestone.expectedDate ?? null,
                        order: milestone.order,
                    })),
                },
            } as any,
            include: {
                customer: true,
                lines: true,
                outsourceLines: { orderBy: { order: 'asc' } },
                paymentMilestones: true,
            },
        });

        // Fire and forget email notification to admins
        if (quotation.customer) {
            getAdminEmails().then(admins => {
                if (admins.length > 0) {
                    sendQuotationCreatedEmail({
                        to: admins,
                        quotationNo: quotation.quotationNo,
                        projectName: quotation.projectName,
                        customerName: quotation.customer?.name || 'Khách hàng',
                        totalAfterVat: quotation.totalAfterVat,
                        quotationUrl: buildQuotationUrl(quotation.id),
                        createdByName: userName,
                    });
                }
            });
        }

        return NextResponse.json({
            success: true,
            data: quotation,
            message: 'Quotation created successfully',
        });
    } catch (error: any) {
        console.error('Error creating quotation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed' },
            { status: 500 }
        );
    }
}
