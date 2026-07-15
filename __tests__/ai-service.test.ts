/**
 * AIService provider error-handling tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIService } from '../lib/ai-service';
import { AIMessage, AISettings } from '../lib/ai-config';

function baseSettings(overrides: Partial<AISettings>): AISettings {
  return {
    provider: 'anthropic',
    model: 'test-model',
    apiKey: 'test-key',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: 'system',
    personality: 'rabbit' as AISettings['personality'],
    ...overrides,
  };
}

const testMessages: AIMessage[] = [
  { id: '1', role: 'user', content: 'hello', timestamp: new Date() },
];

function jsonResponse(body: any, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: 'status',
    json: () => Promise.resolve(body),
  } as Response;
}

function nonJsonErrorResponse(status = 500) {
  return {
    ok: false,
    status,
    statusText: 'Internal Server Error',
    json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON')),
  } as Response;
}

describe('AIService provider error handling', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const providers: Array<{ id: string; successBody: any; emptyBody: any }> = [
    {
      id: 'anthropic',
      successBody: {
        content: [{ text: 'hi there' }],
        usage: { input_tokens: 1, output_tokens: 1 },
      },
      emptyBody: { content: [] },
    },
    {
      id: 'google',
      successBody: {
        candidates: [{ content: { parts: [{ text: 'hi there' }] } }],
      },
      emptyBody: { candidates: [] },
    },
    {
      id: 'mistral',
      successBody: {
        choices: [{ message: { content: 'hi there' } }],
        usage: { total_tokens: 2 },
      },
      emptyBody: { choices: [] },
    },
    {
      id: 'ollama',
      successBody: { response: 'hi there' },
      emptyBody: {},
    },
  ];

  for (const { id, successBody, emptyBody } of providers) {
    describe(id, () => {
      it('returns assistant content on a normal success response', async () => {
        (global.fetch as any).mockResolvedValue(jsonResponse(successBody));

        const service = new AIService(baseSettings({ provider: id }));
        const result = await service.sendMessage(testMessages);

        expect(result.content).toBe('hi there');
      });

      it('translates a network failure into a friendly message', async () => {
        (global.fetch as any).mockRejectedValue(
          new TypeError('Failed to fetch')
        );

        const service = new AIService(baseSettings({ provider: id }));

        await expect(service.sendMessage(testMessages)).rejects.toThrow(
          /network error/i
        );
      });

      it('handles a non-JSON error body without crashing the parser', async () => {
        (global.fetch as any).mockResolvedValue(nonJsonErrorResponse());

        const service = new AIService(baseSettings({ provider: id }));

        await expect(service.sendMessage(testMessages)).rejects.toThrow(
          /unknown error|internal server error/i
        );
      });

      it('throws a clear error on an empty/malformed success payload', async () => {
        (global.fetch as any).mockResolvedValue(jsonResponse(emptyBody));

        const service = new AIService(baseSettings({ provider: id }));

        await expect(service.sendMessage(testMessages)).rejects.toThrow(
          /empty or unexpected/i
        );
      });
    });
  }
});
