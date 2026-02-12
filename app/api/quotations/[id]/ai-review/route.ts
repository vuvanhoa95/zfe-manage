import { NextRequest, NextResponse } from 'next/server';
import { reviewQuotationContent } from '@/lib/ai/review-quotation';
import { QuotationFormData } from '@/types/quotation';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const data: QuotationFormData = await req.json();
    
    const reviewResult = await reviewQuotationContent(data);
    
    return NextResponse.json(reviewResult);
  } catch (error) {
    console.error('AI Review API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
