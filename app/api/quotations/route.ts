import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    generateQuotationNumber,
    calculateQuotationTotals,
    enrichQuotationLinesWithProjectContext,
} from '@/lib/utils';
import { numberToVietnameseWords } from '@/lib/number-to-words-vn';
import { type QuotationFormData } from '@/types/quotation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createQuotationSchema, type CreateQuotationInput } from '@/lib/validation/quotation';

// GET /api/quotations - List quotations with filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const customerId = searchParams.get('customerId');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (customerId) {
            where.customerId = customerId;
        }

        if (search) {
            where.OR = [
                { quotationNo: { contains: search, mode: 'insensitive' } },
                { projectName: { contains: search, mode: 'insensitive' } },
                { customer: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const [quotations, total] = await Promise.all([
            prisma.quotation.findMany({
                where,
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.quotation.count({ where }),
        ]);

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
    } catch (error) {
        console.error('Error fetching quotations:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch quotations' },
            { status: 500 }
        );
    }
}

// POST /api/quotations - Create new quotation
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

        const body: CreateQuotationInput = parsed.data;

        const session = await getServerSession(authOptions);

        if (!session?.user || !(session.user as any).id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Generate quotation number
        const lastQuotation = await prisma.quotation.findFirst({
            orderBy: { quotationNo: 'desc' },
            select: { quotationNo: true },
        });

        const quotationNo = generateQuotationNumber(
            lastQuotation?.quotationNo || null,
            new Date(body.date).getFullYear()
        );

        const enrichedLines = enrichQuotationLinesWithProjectContext(body.lines, {
            projectName: body.projectName,
            projectItem: body.projectItem,
            totalArea: body.totalArea,
        });

        // Calculate totals
        const { totalBeforeVat, vatAmount, totalAfterVat } = calculateQuotationTotals(
            enrichedLines,
            body.vatRate,
            body.totalArea || 0
        );

        const totalInWords = numberToVietnameseWords(totalAfterVat);

        // Create quotation with lines and milestones
        const quotation = await prisma.quotation.create({
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
                profitRate: body.profitRate,
                totalBeforeVat,
                vatAmount,
                totalAfterVat,
                totalInWords,
                status: body.status,
                notes: body.notes,
                createdById: userId,
                lines: {
                    create: enrichedLines.map((line) => ({
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
                        create: body.outsourceLines.map((l, idx) => ({
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
                    create: body.paymentMilestones.map((milestone) => ({
                        no: milestone.no,
                        title: milestone.title,
                        percent: milestone.percent,
                        description: milestone.description,
                        expectedDate: milestone.expectedDate ?? null,
                        order: milestone.order,
                    })),
                },
            },
            include: {
                customer: true,
                lines: true,
                outsourceLines: { orderBy: { order: 'asc' } },
                paymentMilestones: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: quotation,
            message: 'Quotation created successfully',
        });
    } catch (error) {
        console.error('Error creating quotation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create quotation' },
            { status: 500 }
        );
    }
}
