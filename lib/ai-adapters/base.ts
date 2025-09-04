import { AIMessage, AISettings } from '@/lib/ai-config';

export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'groq'
  | 'mistral'
  | 'ollama';

export interface ProviderAdapter {
  id: ProviderId;
  send(messages: AIMessage[], settings: AISettings): Promise<AIMessage>;
  stream?(
    messages: AIMessage[],
    settings: AISettings
  ): AsyncGenerator<string, void, unknown>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public code?: string | number,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserError';
  }
}

export class SystemError extends Error {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'SystemError';
  }
}

export function redact(value?: string): string {
  if (!value) return '';
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

export function withAbortTimeout(ms: number): AbortController {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  // @ts-expect-error attach for cleanup at callsite if needed
  controller.__timeout = timeout;
  return controller;
}

export async function* sseToTextStream(
  response: Response
): AsyncGenerator<string, void, unknown> {
  const reader = response.body?.getReader();
  if (!reader)
    throw new ProviderError('No response body - streaming not supported');

  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // Skip malformed lines
      }
    }
  }
}
