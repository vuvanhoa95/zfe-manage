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

    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
    // Detect đúng MIME type từ header base64 (tránh lỗi khi ảnh là PNG nhưng gửi như jpeg)
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const completion = await openai.chat.completions.create({
      model: AI_MODELS.VISION,
      messages: [
        { role: 'system', content: CARD_SCANNING_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Hãy trích xuất TOÀN BỘ thông tin từ danh thiếp này. Đọc kỹ từng dòng chữ, kể cả chữ nhỏ. Với số điện thoại Việt Nam, hãy giữ nguyên định dạng gốc (VD: 0901.234.567 hoặc +84 901 234 567).' },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high',
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
