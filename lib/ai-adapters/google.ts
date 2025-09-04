import { AIMessage, AISettings } from '@/lib/ai-config';
import { ProviderAdapter, ProviderError, withAbortTimeout } from './base';

export const GoogleAdapter: ProviderAdapter = {
  id: 'google',

  async send(messages: AIMessage[], settings: AISettings): Promise<AIMessage> {
    if (!settings.apiKey) throw new ProviderError('Google API key is required');
    const controller = withAbortTimeout(60_000);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: settings.systemPrompt }] },
            ...messages.map(m => ({ parts: [{ text: m.content }] })),
          ],
          generationConfig: {
            temperature: settings.temperature,
            maxOutputTokens: settings.maxTokens,
          },
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
          `Google API error: ${message}`,
          response.status
        );
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      };
    } finally {
      // @ts-expect-error cleanup timeout
      if (controller.__timeout) clearTimeout(controller.__timeout);
    }
  },
};
