/**
 * Unified AI Client - BYOK Only
 * 
 * Routes requests to user-selected provider.
 * All requests go directly from browser → AI provider API.
 * No backend, no logging, no storage of prompts/code.
 */

export interface AIClientOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIClientResponse {
  content: string;
  model?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AIProviderConfig {
  id: string;
  name: string;
  apiKey: string;
  baseURL?: string; // For generic OpenAI-compatible APIs
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const STORAGE_KEY = 'byok-ai-provider';

export class AIClient {
  private config: AIProviderConfig | null = null;

  constructor() {
    this.loadConfig();
  }

  /**
   * Load provider config from localStorage
   */
  private loadConfig(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.config = JSON.parse(stored) as AIProviderConfig;
      }
    } catch (error) {
      console.error('Failed to load AI config:', error);
    }
  }

  /**
   * Set provider configuration
   */
  setConfig(config: AIProviderConfig): void {
    this.config = config;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  }

  /**
   * Get current provider configuration
   */
  getConfig(): AIProviderConfig | null {
    return this.config;
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return this.config !== null && !!this.config.apiKey;
  }

  /**
   * Send prompt to AI provider
   */
  async send(
    prompt: string,
    options: AIClientOptions = {}
  ): Promise<AIClientResponse> {
    if (!this.config || !this.config.apiKey) {
      throw new Error('AI provider not configured. Please set up your API key in settings.');
    }

    const model = options.model || this.config.model || 'gpt-4o-mini';
    const temperature = options.temperature ?? this.config.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? this.config.maxTokens ?? 2000;

    switch (this.config.id) {
      case 'openai':
        return this.sendOpenAI(prompt, { model, temperature, maxTokens });
      case 'anthropic':
        return this.sendAnthropic(prompt, { model, temperature, maxTokens });
      case 'groq':
        return this.sendGroq(prompt, { model, temperature, maxTokens });
      case 'generic':
        return this.sendGeneric(prompt, { model, temperature, maxTokens });
      default:
        throw new Error(`Unsupported provider: ${this.config.id}`);
    }
  }

  /**
   * Send prompt with streaming support
   */
  async *sendStream(
    prompt: string,
    options: AIClientOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    if (!this.config || !this.config.apiKey) {
      throw new Error('AI provider not configured');
    }

    const model = options.model || this.config.model || 'gpt-4o-mini';
    const temperature = options.temperature ?? this.config.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? this.config.maxTokens ?? 2000;

    switch (this.config.id) {
      case 'openai':
        yield* this.sendOpenAIStream(prompt, { model, temperature, maxTokens });
        break;
      case 'groq':
        yield* this.sendGroqStream(prompt, { model, temperature, maxTokens });
        break;
      case 'generic':
        yield* this.sendGenericStream(prompt, { model, temperature, maxTokens });
        break;
      default:
        // Fallback to non-streaming
        const response = await this.send(prompt, options);
        yield response.content;
    }
  }

  /**
   * OpenAI API
   */
  private async sendOpenAI(
    prompt: string,
    options: { model: string; temperature: number; maxTokens: number }
  ): Promise<AIClientResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config!.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  private async *sendOpenAIStream(
    prompt: string,
    options: { model: string; temperature: number; maxTokens: number }
  ): AsyncGenerator<string, void, unknown> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config!.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Failed to get response stream');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) yield content;
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Anthropic API
   */
  private async sendAnthropic(
    prompt: string,
    options: { model: string; temperature: number; maxTokens: number }
  ): Promise<AIClientResponse> {
    const model = options.model || 'claude-3-5-sonnet-20241022';
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config!.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0]?.text || '',
      model: data.model,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
    };
  }

  /**
   * Groq API (OpenAI-compatible)
   */
  private async sendGroq(
    prompt: string,
    options: { model: string; temperature: number; maxTokens: number }
  ): Promise<AIClientResponse> {
    const model = options.model || 'llama-3.1-70b-versatile';
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config!.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  private async *sendGroqStream(
    prompt: string,
    options: { model: string; temperature: number; maxTokens: number }
  ): AsyncGenerator<string, void, unknown> {
    const model = options.model || 'llama-3.1-70b-versatile';
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config!.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Failed to get response stream');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) yield content;
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Generic OpenAI-compatible API
   */
  private async sendGeneric(
    prompt: string,
    options: { model: string; temperature: number; maxTokens: number }
  ): Promise<AIClientResponse> {
    if (!this.config!.baseURL) {
      throw new Error('Base URL is required for generic provider');
    }

    const baseURL = this.config!.baseURL.replace(/\/$/, '');
    const url = `${baseURL}/v1/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config!.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  private async *sendGenericStream(
    prompt: string,
    options: { model: string; temperature: number; maxTokens: number }
  ): AsyncGenerator<string, void, unknown> {
    if (!this.config!.baseURL) {
      throw new Error('Base URL is required for generic provider');
    }

    const baseURL = this.config!.baseURL.replace(/\/$/, '');
    const url = `${baseURL}/v1/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config!.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`API error: ${error.error?.message || response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Failed to get response stream');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) yield content;
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// Singleton instance
let aiClientInstance: AIClient | null = null;

export function getAIClient(): AIClient {
  if (!aiClientInstance) {
    aiClientInstance = new AIClient();
  }
  return aiClientInstance;
}
