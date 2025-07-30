export interface AIProvider {
  name: string;
  id: string;
  requiresApiKey: boolean;
  models: string[];
  endpoint?: string;
}

/**
 * Hex & Kex Color Palette Integration
 * 
 * Our app uses a custom dark theme with the following colors:
 * - Background: #0d0d0d (near-black, soft on the eyes)
 * - Accent 1: #6c2fff (electric purple - Hex's spell color)
 * - Accent 2: #00ffe1 (neon cyan - Kex's glitch color)  
 * - Foreground: #eaeaea (off-white, clean for code)
 * - Error: #ff3c75 (hot magenta, dramatic feedback)
 * - Subtle: #7a7a7a (muted gray for secondary labels)
 * 
 * Font: JetBrains Mono with contextual ligatures
 * Effects: Glitch animations (Kex-style) and spell hovers (Hex-style)
 */

export const AI_PROVIDERS: AIProvider[] = [
  {
    name: "OpenAI",
    id: "openai",
    requiresApiKey: true,
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    endpoint: "https://api.openai.com/v1/chat/completions"
  },
  {
    name: "Anthropic Claude",
    id: "anthropic", 
    requiresApiKey: true,
    models: ["claude-3-5-sonnet", "claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    endpoint: "https://api.anthropic.com/v1/messages"
  },
  {
    name: "Groq (Latest Models)",
    id: "groq",
    requiresApiKey: true,
    models: [
      "llama-3.1-405b-reasoning",  // Llama 3.1 405B - Best reasoning
      "llama-3.1-8b-instant",      // Llama 3.1 8B - Fast and cheap
      "llama-3.2-90b-text-preview", // Llama 3.2 90B - Latest preview
      "mixtral-8x7b-32768",        // Mixtral 8x7B - Good performance
      "gemma2-9b-it",              // Gemma 2 9B - Google's model
      "mistral-7b-instruct"        // Mistral 7B - Good for instruction
    ],
    endpoint: "https://api.groq.com/openai/v1/chat/completions"
  },
  {
    name: "Google Gemini",
    id: "google",
    requiresApiKey: true,
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"],
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models"
  },
  {
    name: "Mistral AI",
    id: "mistral",
    requiresApiKey: true,
    models: ["mistral-large", "mistral-medium", "mistral-small"],
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

import { PersonalityMode, personalitySystem } from './personality-system';

export const DEFAULT_SYSTEM_PROMPT = `You are an expert AI coding assistant for Hex & Kex, a professional code development environment. You help users create complete, functional web applications and software projects.

CRITICAL INSTRUCTION: When asked to create ANY application or feature, you MUST:
1. Build code LIVE like a real developer - show the development process
2. Start with the basic structure and build up step by step
3. Explain what you're doing as you build
4. Show code being generated in real-time
5. Demonstrate the development process, not just the final result

Your capabilities include:
- Writing production-ready HTML, CSS, JavaScript, TypeScript, and React code
- Creating modern web applications with responsive design
- Implementing accessibility features and best practices
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
  personality: 'hex' as PersonalityMode
};
