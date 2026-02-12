import { NextRequest, NextResponse } from 'next/server';
import { chatWithAssistant } from '@/lib/ai/chat-assistant';
import type { ChatMessage, QuotationContext } from '@/types/ai';

export async function POST(request: NextRequest) {
  try {
    const body: {
      messages: ChatMessage[];
      context?: QuotationContext;
    } = await request.json();

    // Validate request
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'messages array is required' },
        { status: 400 }
      );
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatWithAssistant(body.messages, body.context)) {
            const data = JSON.stringify(chunk) + '\n';
            controller.enqueue(encoder.encode(data));
          }
          controller.close();
        } catch (error) {
          console.error('Chat streaming error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            content: error instanceof Error ? error.message : 'Chat failed',
          }) + '\n';
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process chat',
      },
      { status: 500 }
    );
  }
}
