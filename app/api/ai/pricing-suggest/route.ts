import { NextRequest, NextResponse } from 'next/server';
import { analyzePricing } from '@/lib/ai/pricing-analyzer';
import type { PricingSuggestionRequest } from '@/types/ai';

export async function POST(request: NextRequest) {
  try {
    const body: PricingSuggestionRequest = await request.json();

    // Validate request
    if (!body.itemTitle || body.itemTitle.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'itemTitle is required' },
        { status: 400 }
      );
    }

    // Analyze pricing
    const suggestion = await analyzePricing(body);

    return NextResponse.json({
      success: true,
      data: suggestion,
    });

  } catch (error) {
    console.error('Pricing suggestion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate pricing suggestion',
      },
      { status: 500 }
    );
  }
}
