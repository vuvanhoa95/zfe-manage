import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOpenAIClient } from '@/lib/ai/openai';

/**
 * POST /api/ai/enhance-project-description
 * Streaming endpoint: AI viết mô tả chuyên nghiệp cho dự án BIM
 * Body: { projectName, location, description?, totalArea? }
 * Returns: text/event-stream
 */
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectName, location, description, totalArea } = body as {
        projectName?: string;
        location?: string;
        description?: string;
        totalArea?: number;
    };

    if (!projectName?.trim()) {
        return NextResponse.json({ error: 'Cần nhập tên dự án' }, { status: 400 });
    }

    const prompt = `Bạn là chuyên gia BIM tại Việt Nam với 15 năm kinh nghiệm. Hãy viết mô tả chuyên nghiệp cho dự án BIM sau.

Thông tin dự án:
- Tên: ${projectName}
${location ? `- Vị trí: ${location}` : ''}
${totalArea ? `- Tổng diện tích sàn: ${totalArea.toLocaleString('vi-VN')} m²` : ''}
${description ? `- Ghi chú ban đầu: ${description}` : ''}

YÊU CẦU:
- Viết 2-4 câu văn súc tích, chuyên nghiệp
- Đề cập loại công trình, quy mô, đặc điểm nổi bật
- Phong cách báo cáo kỹ thuật, không hoa mỹ
- Bằng tiếng Việt chuẩn
- KHÔNG bắt đầu bằng "Dự án" hay "Công trình"
- KHÔNG dùng "tôi", "chúng tôi"
- Chỉ trả về đoạn mô tả, không giải thích gì thêm`;

    try {
        const openai = getOpenAIClient();
        const stream = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
            max_tokens: 300,
            stream: true,
        });

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    const text = chunk.choices[0]?.delta?.content || '';
                    if (text) {
                        controller.enqueue(encoder.encode(text));
                    }
                }
                controller.close();
            },
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'X-Accel-Buffering': 'no',
            },
        });
    } catch (error: any) {
        console.error('[EnhanceDescription] Error:', error);
        return NextResponse.json({ error: error.message || 'Không thể tạo mô tả' }, { status: 500 });
    }
}
