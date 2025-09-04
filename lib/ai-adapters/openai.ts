import { AIMessage, AISettings } from '@/lib/ai-config';
import {
  ProviderAdapter,
  ProviderError,
  sseToTextStream,
  withAbortTimeout,
} from './base';

export const OpenAIAdapter: ProviderAdapter = {
  id: 'openai',

  async send(messages: AIMessage[], settings: AISettings): Promise<AIMessage> {
    if (!settings.apiKey) throw new ProviderError('OpenAI API key is required');

    const controller = withAbortTimeout(60_000);
    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.apiKey}`,
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
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
        }
      );

      if (!response.ok) {
        let message = `HTTP ${response.status} ${response.statusText}`;
        try {
          const err = await response.json();
          message = err.error?.message || message;
        } catch {}
        throw new ProviderError(
          `OpenAI API error: ${message}`,
          response.status
        );
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
    if (!settings.apiKey) throw new ProviderError('OpenAI API key is required');
    const controller = withAbortTimeout(60_000);
    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.apiKey}`,
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache',
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
        }
      );

      if (!response.ok) {
        let message = `HTTP ${response.status} ${response.statusText}`;
        try {
          const err = await response.json();
          message = err.error?.message || message;
        } catch {}
        throw new ProviderError(
          `OpenAI API error: ${message}`,
          response.status
        );
      }

      yield* sseToTextStream(response);
    } finally {
      // @ts-expect-error cleanup timeout
      if (controller.__timeout) clearTimeout(controller.__timeout);
    }
  },
};
