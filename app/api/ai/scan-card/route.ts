import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { openai, AI_MODELS } from '@/lib/ai/openai';
import { CARD_SCANNING_PROMPT } from '@/lib/ai/prompts';
import { z } from 'zod';

const RequestSchema = z.object({
  image: z.string(), // Base64 image
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { image } = RequestSchema.parse(body);

    // Remove base64 prefix if exists
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    const completion = await openai.chat.completions.create({
      model: AI_MODELS.VISION,
      messages: [
        { role: 'system', content: CARD_SCANNING_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Trích xuất thông tin từ danh thiếp này:' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI Card Scanning Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to scan business card' },
      { status: 500 }
    );
  }
}
