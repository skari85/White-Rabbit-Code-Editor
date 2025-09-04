import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIAdapter } from '@/lib/ai-adapters/openai';

const now = new Date();

describe('OpenAIAdapter', () => {
  const settings = {
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: 'sk-test',
    temperature: 0.2,
    maxTokens: 16,
    systemPrompt: 'sys',
    personality: 'rabbit' as const,
  };

  const messages = [
    { id: '1', role: 'user' as const, content: 'hi', timestamp: now },
  ];

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a non-stream request and returns content', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'hello' } }],
        usage: { total_tokens: 10 },
      }),
    });
    const res = await OpenAIAdapter.send(messages as any, settings as any);
    expect(res.content).toBe('hello');
  });

  it('propagates provider errors', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: { message: 'bad key' } }),
    });
    await expect(
      OpenAIAdapter.send(messages as any, settings as any)
    ).rejects.toThrow(/OpenAI API error/);
  });
});
