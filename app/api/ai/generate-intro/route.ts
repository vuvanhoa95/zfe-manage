import { NextRequest, NextResponse } from 'next/server';
import { generateIntroText } from '@/lib/ai/intro-generator';
import type { IntroGenerationRequest } from '@/types/ai';

export async function POST(request: NextRequest) {
  try {
    const body: IntroGenerationRequest = await request.json();

    // Validate request
    if (!body.customerId || !body.projectName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'customerId and projectName are required' 
        },
        { status: 400 }
      );
    }

    // Generate intro text
    const result = await generateIntroText(body);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Intro generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate introduction text',
      },
      { status: 500 }
    );
  }
}
