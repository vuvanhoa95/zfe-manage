import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/revisions?quotationId=...
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const quotationId = searchParams.get('quotationId');

        if (!quotationId) {
            return NextResponse.json({ success: false, error: 'Missing quotationId' }, { status: 400 });
        }

        const revisions = await prisma.quotationRevision.findMany({
            where: { quotationId },
            include: {
                createdBy: {
                    select: { name: true },
                },
            },
            orderBy: { revisionNo: 'desc' },
        });

        return NextResponse.json({ success: true, data: revisions });
    } catch (error) {
        console.error('Error fetching revisions:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
