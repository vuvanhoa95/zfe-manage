import OpenAI from 'openai';

// AI Models used in the application
export const AI_MODELS = {
  DEFAULT: 'gpt-4o-mini',
  PREMIUM: 'gpt-4o',
  VISION: 'gpt-4o-mini',
  FAST_PARSING: 'gpt-4o-mini',
};

// Types for AI responses
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIStreamOptions {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.warn(
        '[AI] OPENAI_API_KEY không được cấu hình. Các tính năng AI sẽ không hoạt động.'
      );
      
      // Trả về một mock client để tránh crash khi build hoặc runtime
      return {
        chat: {
          completions: {
            create: async () => ({ choices: [{ message: { content: 'AI is disabled' } }] }),
          },
        },
      } as unknown as OpenAI;
    }

    openaiClient = new OpenAI({
      apiKey,
    });
  }
  return openaiClient;
}

// Standard completion (non-streaming)
export async function generateCompletion(
  messages: AIMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    responseFormat?: 'text' | 'json_object';
  }
): Promise<string> {
  const client = getOpenAIClient();
  
  const response = await client.chat.completions.create({
    model: options?.model || 'gpt-4o-mini',
    messages: messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 1000,
    response_format: options?.responseFormat === 'json_object' 
      ? { type: 'json_object' } 
      : undefined,
  });

  return response.choices[0]?.message?.content || '';
}

// Streaming completion for real-time responses
export async function* generateStreamingCompletion(
  messages: AIMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }
): AsyncGenerator<string, void, unknown> {
  const client = getOpenAIClient();
  
  const stream = await client.chat.completions.create({
    model: options?.model || 'gpt-4o-mini',
    messages: messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2000,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

// JSON parsing helper - tries to extract JSON from AI response
export function parseAIJSON<T = any>(content: string): T | null {
  try {
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const openai = new Proxy({} as OpenAI, {
  get(target, prop) {
    try {
      return getOpenAIClient()[prop as keyof OpenAI];
    } catch (error) {
      // Return a dummy function if API key is not set (for build time)
      if (prop === 'chat') {
        return {
          completions: {
            create: async () => ({ choices: [{ message: { content: '' } }] }),
          },
        };
      }
      throw error;
    }
  }
});
