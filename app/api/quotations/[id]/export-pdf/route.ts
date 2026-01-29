import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePdf } from '@/lib/pdf-generator';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const quotation = await prisma.quotation.findUnique({
            where: { id: resolvedParams.id },
            include: {
                customer: true,
                lines: { orderBy: { order: 'asc' } },
                paymentMilestones: { orderBy: { order: 'asc' } },
            },
        });

        if (!quotation) {
            return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        }

        const company = await prisma.companyProfile.findUnique({
            where: { id: 1 },
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Company profile not set' }, { status: 400 });
        }

        const pdfBuffer = await generatePdf(quotation as any, company);

        return new NextResponse(new Uint8Array(pdfBuffer as any), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Quotation_${quotation.quotationNo}.pdf"`,
            },
        });
    } catch (error) {
        console.error('PDF Export Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate PDF' }, { status: 500 });
    }
}
