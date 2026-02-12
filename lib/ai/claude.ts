import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client (optional - for Phase 04 chatbot)
let claudeClient: Anthropic | null = null;

function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    if (!process.env.CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY is not defined. Set it in .env to use Claude for chatbot features.');
    }
    claudeClient = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
  }
  return claudeClient;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Standard completion
export async function generateClaudeCompletion(
  messages: ClaudeMessage[],
  systemPrompt?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }
): Promise<string> {
  const client = getClaudeClient();

  const response = await client.messages.create({
    model: options?.model || 'claude-3-5-sonnet-20241022',
    system: systemPrompt,
    messages: messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2000,
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  return '';
}

// Streaming completion for real-time responses
export async function* generateClaudeStreamingCompletion(
  messages: ClaudeMessage[],
  systemPrompt?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }
): AsyncGenerator<string, void, unknown> {
  const client = getClaudeClient();

  const stream = client.messages.stream({
    model: options?.model || 'claude-3-5-sonnet-20241022',
    system: systemPrompt,
    messages: messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4000,
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      yield chunk.delta.text;
    }
  }
}

export const claude = new Proxy({} as Anthropic, {
  get(target, prop) {
    return getClaudeClient()[prop as keyof Anthropic];
  }
});
