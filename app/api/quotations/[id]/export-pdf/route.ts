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
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode'); // 'download' | 'print' | 'preview'
        
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

        // Set headers based on mode
        const headers: HeadersInit = {
            'Content-Type': 'application/pdf',
        };

        if (mode === 'download') {
            headers['Content-Disposition'] = `attachment; filename="BaoGia_${quotation.quotationNo}.pdf"`;
        } else {
            // For print and preview, use inline so browser can handle it
            headers['Content-Disposition'] = `inline; filename="BaoGia_${quotation.quotationNo}.pdf"`;
        }

        return new NextResponse(new Uint8Array(pdfBuffer as any), {
            headers,
        });
    } catch (error) {
        console.error('PDF Export Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
        return NextResponse.json(
            { 
                success: false, 
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? String(error) : undefined
            }, 
            { status: 500 }
        );
    }
}
