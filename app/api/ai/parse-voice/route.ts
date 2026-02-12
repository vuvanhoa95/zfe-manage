import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { openai, AI_MODELS } from '@/lib/ai/openai';
import { VOICE_PARSING_PROMPT } from '@/lib/ai/prompts';
import { z } from 'zod';

const RequestSchema = z.object({
  transcript: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { transcript } = RequestSchema.parse(body);

    const completion = await openai.chat.completions.create({
      model: AI_MODELS.FAST_PARSING,
      messages: [
        { role: 'system', content: VOICE_PARSING_PROMPT },
        { role: 'user', content: transcript },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI Voice Parsing Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse voice transcript' },
      { status: 500 }
    );
  }
}
