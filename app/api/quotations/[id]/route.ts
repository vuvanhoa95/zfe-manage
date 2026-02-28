import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateQuotationTotals, enrichQuotationLinesWithProjectContext } from '@/lib/utils';
import { numberToVietnameseWords } from '@/lib/number-to-words-vn';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createQuotationSchema, type CreateQuotationInput } from '@/lib/validation/quotation';
import { assertCanEditQuotation } from '@/lib/permissions';
import { type AuthenticatedUser } from '@/types/auth';
import { sendQuotationAcceptedEmail, buildQuotationUrl, getAdminEmails } from '@/lib/email/send';

function formatSafeDateTimeForName(date: Date) {
    const pad2 = (n: number) => n.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad2(date.getMonth() + 1);
    const dd = pad2(date.getDate());
    const hh = pad2(date.getHours());
    const mi = pad2(date.getMinutes());
    return `${yyyy}-${mm}-${dd}_${hh}-${mi}`;
}

// GET /api/quotations/[id] - Get single quotation
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const quotation = await prisma.quotation.findUnique({
            where: { id: resolvedParams.id },
            include: {
                customer: true,
                lines: {
                    orderBy: { order: 'asc' },
                },
                outsourceLines: {
                    orderBy: { order: 'asc' },
                },
                paymentMilestones: {
                    orderBy: { order: 'asc' },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!quotation) {
            return NextResponse.json(
                { success: false, error: 'Quotation not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: quotation,
        });
    } catch (error) {
        console.error('Error fetching quotation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch quotation' },
            { status: 500 }
        );
    }
}

// PUT /api/quotations/[id] - Update quotation
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const user: AuthenticatedUser = {
            id: (session.user as any).id as string,
            email: session.user.email ?? null,
            name: session.user.name ?? null,
            role: ((session.user as any).role as 'ADMIN' | 'USER') ?? 'USER',
        };

        const resolvedParams = params instanceof Promise ? await params : params;

        // Kiểm tra quyền trên báo giá hiện tại
        const existing = await prisma.quotation.findUnique({
            where: { id: resolvedParams.id },
            select: { id: true, createdById: true, status: true },
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });
        }

        try {
            assertCanEditQuotation(user, existing);
        } catch (err) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const json = await request.json();
        const parsed = createQuotationSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Dữ liệu báo giá không hợp lệ',
                    details: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const body: CreateQuotationInput = parsed.data;

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

        // Delete existing lines and milestones, then recreate
        await prisma.quotationLine.deleteMany({
            where: { quotationId: resolvedParams.id },
        });

        await prisma.quotationOutsourceLine.deleteMany({
            where: { quotationId: resolvedParams.id },
        });

        await prisma.paymentMilestone.deleteMany({
            where: { quotationId: resolvedParams.id },
        });

        // Update quotation
        const quotation = await prisma.quotation.update({
            where: { id: resolvedParams.id },
            data: {
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
                theme: body.theme ?? null,
                templateId: body.templateId ?? null,
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

        // Check if we should create a new revision (daily versioning)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastRevision = await prisma.quotationRevision.findFirst({
            where: {
                quotationId: resolvedParams.id,
                revisionDate: {
                    gte: today,
                },
            },
        });

        if (!lastRevision) {
            // Create new revision
            const revisionCount = await prisma.quotationRevision.count({
                where: { quotationId: resolvedParams.id },
            });

            const project = await prisma.project.findUnique({
                where: { id: body.projectId },
                select: { projectNo: true },
            });

            const safeDateTime = formatSafeDateTimeForName(new Date());
            const projectNo = project?.projectNo || 'PRJ';
            const safeTitle = (body.title || 'Thư báo giá dự án')
                .replace(/[\\/:*?"<>|]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            const revisionNote = `${safeDateTime}_${projectNo}_${safeTitle}`;

            const snapshot = {
                quotation,
                lines: body.lines,
                paymentMilestones: body.paymentMilestones,
            };

            await prisma.quotationRevision.create({
                data: {
                    quotationId: resolvedParams.id,
                    revisionNo: revisionCount + 1,
                    revisionDate: new Date(),
                    note: revisionNote,
                    snapshotJson: JSON.stringify(snapshot),
                    totalBeforeVat,
                    vatAmount,
                    totalAfterVat,
                    createdById: user.id,
                },
            });
        }

        // If status changed to ACCEPTED, send notification
        if (body.status === 'ACCEPTED' && existing.status !== 'ACCEPTED') {
            getAdminEmails().then(admins => {
                if (admins.length > 0) {
                    sendQuotationAcceptedEmail({
                        to: admins,
                        quotationNo: (quotation as any).quotationNo,
                        projectName: (quotation as any).projectName,
                        customerName: (quotation as any).customer?.name || 'Khách hàng',
                        totalAfterVat: (quotation as any).totalAfterVat,
                        quotationUrl: buildQuotationUrl((quotation as any).id),
                    });
                }
            });
        }

        return NextResponse.json({
            success: true,
            data: quotation,
            message: 'Quotation updated successfully',
        });
    } catch (error) {
        console.error('Error updating quotation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update quotation' },
            { status: 500 }
        );
    }
}

// DELETE /api/quotations/[id] - Delete quotation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = params instanceof Promise ? await params : params;
        await prisma.quotation.delete({
            where: { id: resolvedParams.id },
        });

        return NextResponse.json({
            success: true,
            message: 'Quotation deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting quotation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete quotation' },
            { status: 500 }
        );
    }
}
