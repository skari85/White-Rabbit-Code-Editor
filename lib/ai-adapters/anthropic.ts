import { AIMessage, AISettings } from '@/lib/ai-config';
import { ProviderAdapter, ProviderError, withAbortTimeout } from './base';

const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';

export const AnthropicAdapter: ProviderAdapter = {
  id: 'anthropic',

  async send(messages: AIMessage[], settings: AISettings): Promise<AIMessage> {
    if (!settings.apiKey)
      throw new ProviderError('Anthropic API key is required');
    const controller = withAbortTimeout(60_000);
    try {
      const response = await fetch(ANTHROPIC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: settings.model,
          system: settings.systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let message = `HTTP ${response.status} ${response.statusText}`;
        try {
          const err = await response.json();
          message = err.error?.message || message;
        } catch {}
        throw new ProviderError(
          `Anthropic API error: ${message}`,
          response.status
        );
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || data.output_text || '';
      const totalTokens =
        (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: text,
        timestamp: new Date(),
        tokens: totalTokens,
      };
    } finally {
      // @ts-expect-error cleanup timeout
      if (controller.__timeout) clearTimeout(controller.__timeout);
    }
  },
};
