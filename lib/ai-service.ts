import { AIProvider, AISettings, AIMessage, AI_PROVIDERS } from './ai-config';

export class AIService {
  private settings: AISettings;
  
  constructor(settings: AISettings) {
    this.settings = settings;
  }

  async sendMessage(messages: AIMessage[]): Promise<AIMessage> {
    const provider = AI_PROVIDERS.find(p => p.id === this.settings.provider);
    if (!provider) {
      throw new Error(`Provider ${this.settings.provider} not found`);
    }

    switch (provider.id) {
      case 'openai':
        return this.sendOpenAIMessage(messages);
      case 'anthropic':
        return this.sendAnthropicMessage(messages);
      case 'google':
        return this.sendGoogleMessage(messages);
      case 'groq':
        return this.sendGroqMessage(messages);
      case 'mistral':
        return this.sendMistralMessage(messages);
      case 'ollama':
        return this.sendOllamaMessage(messages);
      default:
        throw new Error(`Provider ${provider.id} not implemented`);
    }
  }

  private async sendOpenAIMessage(messages: AIMessage[]): Promise<AIMessage> {
    if (!this.settings.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.apiKey}`
      },
      body: JSON.stringify({
        model: this.settings.model,
        messages: [
          { role: 'system', content: this.settings.systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        temperature: this.settings.temperature,
        max_tokens: this.settings.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: choice.message.content,
      timestamp: new Date(),
      tokens: data.usage?.total_tokens
    };
  }

  private async sendAnthropicMessage(messages: AIMessage[]): Promise<AIMessage> {
    if (!this.settings.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.settings.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.settings.model,
        system: this.settings.systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: this.settings.temperature,
        max_tokens: this.settings.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: data.content[0].text,
      timestamp: new Date(),
      tokens: data.usage?.input_tokens + data.usage?.output_tokens
    };
  }

  private async sendGoogleMessage(messages: AIMessage[]): Promise<AIMessage> {
    if (!this.settings.apiKey) {
      throw new Error('Google API key is required');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.settings.model}:generateContent?key=${this.settings.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: this.settings.systemPrompt }] },
          ...messages.map(m => ({ parts: [{ text: m.content }] }))
        ],
        generationConfig: {
          temperature: this.settings.temperature,
          maxOutputTokens: this.settings.maxTokens
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date()
    };
  }

  private async sendGroqMessage(messages: AIMessage[]): Promise<AIMessage> {
    if (!this.settings.apiKey) {
      throw new Error('Groq API key is required');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.apiKey}`
      },
      body: JSON.stringify({
        model: this.settings.model,
        messages: [
          { role: 'system', content: this.settings.systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        temperature: this.settings.temperature,
        max_tokens: this.settings.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: choice.message.content,
      timestamp: new Date(),
      tokens: data.usage?.total_tokens
    };
  }

  private async sendMistralMessage(messages: AIMessage[]): Promise<AIMessage> {
    if (!this.settings.apiKey) {
      throw new Error('Mistral API key is required');
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.apiKey}`
      },
      body: JSON.stringify({
        model: this.settings.model,
        messages: [
          { role: 'system', content: this.settings.systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        temperature: this.settings.temperature,
        max_tokens: this.settings.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mistral API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: choice.message.content,
      timestamp: new Date(),
      tokens: data.usage?.total_tokens
    };
  }

  private async sendOllamaMessage(messages: AIMessage[]): Promise<AIMessage> {
    const prompt = `${this.settings.systemPrompt}\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n\n')}`;
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.settings.model,
        prompt,
        stream: false,
        options: {
          temperature: this.settings.temperature,
          num_predict: this.settings.maxTokens
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: data.response,
      timestamp: new Date()
    };
  }

  updateSettings(newSettings: Partial<AISettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }
}

export function validateApiKey(provider: string, apiKey: string): boolean {
  if (!apiKey) return false;
  
  switch (provider) {
    case 'openai':
      return apiKey.startsWith('sk-');
    case 'anthropic':
      return apiKey.startsWith('sk-ant-');
    case 'google':
      return apiKey.length > 20; // Basic validation
    case 'groq':
      return apiKey.startsWith('gsk_'); // Groq API keys start with gsk_
    case 'mistral':
      return apiKey.startsWith('mist-'); // Mistral API keys start with mist-
    case 'ollama':
      return true; // No API key needed
    default:
      return false;
  }
}
