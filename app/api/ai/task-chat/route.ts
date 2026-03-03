import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCompletion } from '@/lib/ai/openai';

/**
 * POST /api/ai/task-chat
 * Chat đơn giản (non-streaming) dùng cho AITaskGenerator modal
 * Body: { messages: [{role, content}][], systemPrompt? }
 * Returns: { message: string }
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messages, systemPrompt } = await req.json() as {
            messages: { role: 'user' | 'assistant'; content: string }[];
            systemPrompt?: string;
        };

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'messages required' }, { status: 400 });
        }

        // Build messages array cho OpenAI
        const openaiMessages: { role: string; content: string }[] = [];

        if (systemPrompt) {
            openaiMessages.push({ role: 'system', content: systemPrompt });
        }

        // Chỉ giữ lại 10 messages gần nhất để tiết kiệm token
        const recent = messages.slice(-10);
        openaiMessages.push(...recent);

        const response = await generateCompletion(
            openaiMessages as any,
            { temperature: 0.3, maxTokens: 2000, model: 'gpt-4o-mini' }
        );

        // Validate response is non-empty
        if (!response || response.trim().length === 0) {
            return NextResponse.json({ error: 'AI không trả về kết quả. Vui lòng thử lại.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: response });
    } catch (error: any) {
        console.error('[TaskChat] Error:', error);
        return NextResponse.json({ error: error.message || 'Lỗi chat' }, { status: 500 });
    }
}
