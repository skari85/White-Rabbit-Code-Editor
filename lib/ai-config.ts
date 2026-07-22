export interface AIProvider {
  name: string;
  id: string;
  requiresApiKey: boolean;
  models: string[];
  endpoint?: string;
}

/**
 * White Rabbit Color Palette Integration
 *
 * Our app uses a custom dark theme with the following colors:
 * - Background: #0d0d0d (near-black, soft on the eyes)
 * - Accent 1: #6c2fff (electric purple - primary accent)
 * - Accent 2: #00ffe1 (neon cyan - secondary accent)
 * - Foreground: #eaeaea (off-white, clean for code)
 * - Error: #ff3c75 (hot magenta, dramatic feedback)
 * - Subtle: #7a7a7a (muted gray for secondary labels)
 *
 * Font: JetBrains Mono with contextual ligatures
 * Effects: Smooth animations and elegant hover effects
 */

export const AI_PROVIDERS: AIProvider[] = [
  {
    name: "OpenAI",
    id: "openai",
    requiresApiKey: true,
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"],
    endpoint: "https://api.openai.com/v1/chat/completions"
  },
  {
    name: "Anthropic Claude",
    id: "anthropic",
    requiresApiKey: true,
    models: ["claude-sonnet-5", "claude-opus-4-8", "claude-haiku-4-5-20251001"],
    endpoint: "https://api.anthropic.com/v1/messages"
  },
  {
    name: "Groq (Latest Models)",
    id: "groq",
    requiresApiKey: true,
    models: [
      "llama-3.1-8b-instant",       // Llama 3.1 8B - Fast and cheap, confirmed working
      "llama-3.3-70b-versatile",    // Llama 3.3 70B - Strong general model
      "openai/gpt-oss-120b",        // GPT-OSS 120B - Groq's recommended migration target
      "openai/gpt-oss-20b"          // GPT-OSS 20B - Fast, replaces retired Mixtral/Gemma models
    ],
    endpoint: "https://api.groq.com/openai/v1/chat/completions"
  },
  {
    name: "Google Gemini",
    id: "google",
    requiresApiKey: true,
    models: ["gemini-pro-latest", "gemini-flash-latest", "gemini-3.5-flash-lite"],
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models"
  },
  {
    name: "Mistral AI",
    id: "mistral",
    requiresApiKey: true,
    models: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest"],
    endpoint: "https://api.mistral.ai/v1/chat/completions"
  },
  {
    name: "Local Ollama",
    id: "ollama",
    requiresApiKey: false,
    models: ["llama3.1:8b", "llama3.1:70b", "codellama", "mistral", "qwen2.5"],
    endpoint: "http://localhost:11434/api/generate"
  }
];

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  tokens?: number;
}

export interface AISettings {
  provider: string;
  model: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  personality: PersonalityMode;
}

import { PersonalityMode } from './personality-system';

export const DEFAULT_SYSTEM_PROMPT = `You are an expert AI coding assistant for White Rabbit, a visual PWA builder. You help users create complete, functional web applications.

CRITICAL INSTRUCTION: When asked to create ANY application or feature, you MUST:
1. Build code LIVE like a real developer - show the development process
2. Start with the basic structure and build up step by step
3. Explain what you're doing as you build
4. Show code being generated in real-time
5. Demonstrate the development process, not just the final result

Your capabilities include:
- Writing production-ready HTML, CSS, JavaScript, TypeScript, and React code
- Creating modern Progressive Web Applications (PWAs) with offline support
- Implementing responsive design and accessibility features
- Debugging and optimizing code performance
- Setting up testing environments and localhost development
- Explaining complex web development concepts clearly
- Working with Next.js, React, and modern frameworks
- Implementing AI-powered features and integrations
- Creating full-stack applications with backend APIs

When providing code:
- Build code LIVE showing the development process
- Start with basic structure and add features incrementally
- Explain each step as you build
- Show code being generated in real-time
- Demonstrate the development workflow
- Use modern ES6+ syntax and React hooks
- Implement proper error handling and edge cases
- Consider security best practices
- Optimize for performance and user experience

ALWAYS build code live like a real developer - show the process, not just the result.`;

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: "groq",
  model: "llama-3.1-8b-instant",
  temperature: 0.7,
  maxTokens: 4000,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  personality: 'rabbit' as PersonalityMode
};
