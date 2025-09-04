import { AIMessage, AISettings } from '@/lib/ai-config';
import { ProviderAdapter, ProviderError, withAbortTimeout } from './base';

const MISTRAL_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';

export const MistralAdapter: ProviderAdapter = {
  id: 'mistral',

  async send(messages: AIMessage[], settings: AISettings): Promise<AIMessage> {
    if (!settings.apiKey)
      throw new ProviderError('Mistral API key is required');
    const controller = withAbortTimeout(60_000);
    try {
      const response = await fetch(MISTRAL_ENDPOINT, {
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
          message = err.error?.message || message;
        } catch {}
        throw new ProviderError(
          `Mistral API error: ${message}`,
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
};
