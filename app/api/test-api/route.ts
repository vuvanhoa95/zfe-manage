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
        const count = await prisma.project.count();
        // Just use one of the imported functions to ensure they are not tree-shaken
        const words = numberToVietnameseWords(1000);
        return NextResponse.json({ success: true, projectCount: count, testWords: words });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
