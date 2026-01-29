import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/revisions/[id]/restore
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const revision = await prisma.quotationRevision.findUnique({
            where: { id: resolvedParams.id },
        });

        if (!revision) {
            return NextResponse.json({ success: false, error: 'Revision not found' }, { status: 404 });
        }

        const snapshot = JSON.parse(revision.snapshotJson);
        const { quotation, lines, paymentMilestones } = snapshot;

        // We restore by updating the quotation and its lines/milestones
        // Transactional update
        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Delete existing lines/milestones
            await tx.quotationLine.deleteMany({ where: { quotationId: revision.quotationId } });
            await tx.paymentMilestone.deleteMany({ where: { quotationId: revision.quotationId } });

            // 2. Update quotation main fields
            const updated = await tx.quotation.update({
                where: { id: revision.quotationId },
                data: {
                    date: new Date(quotation.date),
                    location: quotation.location,
                    projectName: quotation.projectName,
                    projectItem: quotation.projectItem,
                    projectNotes: quotation.projectNotes,
                    title: quotation.title,
                    introText: quotation.introText,
                    scopeText: quotation.scopeText,
                    deliverablesText: quotation.deliverablesText,
                    scheduleText: quotation.scheduleText,
                    vatRate: quotation.vatRate,
                    totalBeforeVat: quotation.totalBeforeVat,
                    vatAmount: quotation.vatAmount,
                    totalAfterVat: quotation.totalAfterVat,
                    totalInWords: quotation.totalInWords,
                    status: quotation.status,
                    notes: quotation.notes,

                    // 3. Recreate lines from snapshot
                    lines: {
                        create: lines.map((l: any) => ({
                            section: l.section,
                            itemNo: l.itemNo,
                            title: l.title,
                            qty: l.qty,
                            unit: l.unit,
                            unitPrice: l.unitPrice,
                            total: l.total,
                            note: l.note,
                            order: l.order,
                            isGroupHeader: l.isGroupHeader,
                            isChargeable: l.isChargeable,
                        })),
                    },

                    // 4. Recreate milestones from snapshot
                    paymentMilestones: {
                        create: paymentMilestones.map((m: any) => ({
                            no: m.no,
                            title: m.title,
                            percent: m.percent,
                            description: m.description,
                            order: m.order,
                        })),
                    },
                },
            });

            return updated;
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('Restore error:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
