import { AIMessage, AISettings } from '@/lib/ai-config';
import {
  ProviderAdapter,
  ProviderError,
  sseToTextStream,
  withAbortTimeout,
} from './base';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

export const GroqAdapter: ProviderAdapter = {
  id: 'groq',

  async send(messages: AIMessage[], settings: AISettings): Promise<AIMessage> {
    if (!settings.apiKey) throw new ProviderError('Groq API key is required');
    const controller = withAbortTimeout(60_000);
    try {
      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: 'system', content: settings.systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
          ],
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let message = `HTTP ${response.status} ${response.statusText}`;
        try {
          const err = await response.json();
          message = err.error?.message || err.message || message;
        } catch {}
        if (response.status === 401)
          message = 'Invalid API Key. Check your Groq API key.';
        throw new ProviderError(`Groq API error: ${message}`, response.status);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: choice?.message?.content || '',
        timestamp: new Date(),
        tokens: data.usage?.total_tokens,
      };
    } finally {
      // @ts-expect-error cleanup timeout
      if (controller.__timeout) clearTimeout(controller.__timeout);
    }
  },

  async *stream(messages: AIMessage[], settings: AISettings) {
    if (!settings.apiKey) throw new ProviderError('Groq API key is required');
    const controller = withAbortTimeout(60_000);
    try {
      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: 'system', content: settings.systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
          ],
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let message = `HTTP ${response.status} ${response.statusText}`;
        try {
          const err = await response.json();
          message = err.error?.message || err.message || message;
        } catch {}
        if (response.status === 401)
          message = 'Invalid API Key. Check your Groq API key.';
        throw new ProviderError(`Groq API error: ${message}`, response.status);
      }

      yield* sseToTextStream(response);
    } finally {
      // @ts-expect-error cleanup timeout
      if (controller.__timeout) clearTimeout(controller.__timeout);
    }
  },
};
