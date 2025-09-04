import { AIMessage, AISettings } from '@/lib/ai-config';
import { ProviderAdapter, ProviderError } from './base';

const OLLAMA_URL = 'http://localhost:11434/api/generate';

export const OllamaAdapter: ProviderAdapter = {
  id: 'ollama',

  async send(messages: AIMessage[], settings: AISettings): Promise<AIMessage> {
    const prompt = `${settings.systemPrompt}\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n\n')}`;
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.model,
        prompt,
        stream: false,
        options: {
          temperature: settings.temperature,
          num_predict: settings.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new ProviderError(
        `Ollama API error: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: data.response || '',
      timestamp: new Date(),
    };
  },
};
