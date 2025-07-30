import { AISettings, AI_PROVIDERS } from './ai-config';

export interface AIStreamResponse {
  content: string;
  isComplete: boolean;
  error?: string;
  metadata?: {
    tokens?: number;
    model?: string;
    provider?: string;
  };
}

export class AIServiceEnhanced {
  private settings: AISettings;
  private abortController: AbortController | null = null;

  constructor(settings: AISettings) {
    this.settings = settings;
  }

  async streamResponse(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: AIStreamResponse) => void
  ): Promise<void> {
    // Cancel any ongoing request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    try {
      const provider = AI_PROVIDERS.find(p => p.id === this.settings.provider);
      if (!provider) {
        throw new Error(`Unknown provider: ${this.settings.provider}`);
      }

      switch (this.settings.provider) {
        case 'openai':
          await this.streamOpenAI(messages, onChunk);
          break;
        case 'anthropic':
          await this.streamAnthropic(messages, onChunk);
          break;
        case 'groq':
          await this.streamGroq(messages, onChunk);
          break;
        default:
          throw new Error(`Provider ${this.settings.provider} not implemented`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        onChunk({ content: '', isComplete: true, error: 'Request cancelled' });
      } else {
        onChunk({ 
          content: '', 
          isComplete: true, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  }

  private async streamOpenAI(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: AIStreamResponse) => void
  ): Promise<void> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.apiKey}`,
      },
      body: JSON.stringify({
        model: this.settings.model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onChunk({ content: '', isComplete: true });
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              onChunk({
                content,
                isComplete: false,
                metadata: {
                  tokens: parsed.usage?.total_tokens,
                  model: this.settings.model,
                  provider: 'openai'
                }
              });
            }
          } catch (e) {
            console.warn('Failed to parse OpenAI stream data:', e);
          }
        }
      }
    }
  }

  private async streamAnthropic(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: AIStreamResponse) => void
  ): Promise<void> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.settings.apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.settings.model,
        messages,
        stream: true,
        max_tokens: 4000,
      }),
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onChunk({ content: '', isComplete: true });
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.delta?.text || '';
            if (content) {
              onChunk({
                content,
                isComplete: false,
                metadata: {
                  model: this.settings.model,
                  provider: 'anthropic'
                }
              });
            }
          } catch (e) {
            console.warn('Failed to parse Anthropic stream data:', e);
          }
        }
      }
    }
  }

  private async streamGroq(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: AIStreamResponse) => void
  ): Promise<void> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.apiKey}`,
      },
      body: JSON.stringify({
        model: this.settings.model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onChunk({ content: '', isComplete: true });
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              onChunk({
                content,
                isComplete: false,
                metadata: {
                  tokens: parsed.usage?.total_tokens,
                  model: this.settings.model,
                  provider: 'groq'
                }
              });
            }
          } catch (e) {
            console.warn('Failed to parse Groq stream data:', e);
          }
        }
      }
    }
  }

  cancelRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  updateSettings(newSettings: AISettings): void {
    this.settings = newSettings;
  }
} 