import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GroqAdapter } from '@/lib/ai-adapters/groq';

const now = new Date();

describe('GroqAdapter', () => {
  const settings = {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    apiKey: 'gsk_test',
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
    const res = await GroqAdapter.send(messages as any, settings as any);
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
      GroqAdapter.send(messages as any, settings as any)
    ).rejects.toThrow(/Groq API error/);
  });
});
