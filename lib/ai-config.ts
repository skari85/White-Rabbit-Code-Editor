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
    models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
    endpoint: "https://api.openai.com/v1/chat/completions"
  },
  {
    name: "Anthropic Claude",
    id: "anthropic", 
    requiresApiKey: true,
    models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    endpoint: "https://api.anthropic.com/v1/messages"
  },
  {
    name: "Google Gemini",
    id: "google",
    requiresApiKey: true,
    models: ["gemini-pro", "gemini-pro-vision"],
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models"
  },
  {
    name: "Groq",
    id: "groq",
    requiresApiKey: true,
    models: [
      "llama-3.1-405b-reasoning", 
      "llama-3.1-8b-instant", 
      "llama-3.2-90b-text-preview", 
      "mixtral-8x7b-32768", 
      "gemma2-9b-it",
      "mistral-7b-instruct",
      "llama3-8b-8192"
    ],
    endpoint: "https://api.groq.com/openai/v1/chat/completions"
  },
  {
    name: "Local Ollama",
    id: "ollama",
    requiresApiKey: false,
    models: ["llama2", "codellama", "mistral", "phi"],
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

export const DEFAULT_SYSTEM_PROMPT = `You are an expert web development assistant. You help users create, modify, and improve their web applications.

Your capabilities include:
- Writing HTML, CSS, and JavaScript code
- Creating modern web development
- Suggesting web development best practices
- Helping with responsive design
- Debugging code issues
- Explaining web development concepts

When providing code:
- Always provide complete, working code
- Include comments explaining important parts
- Follow modern web development best practices
- Ensure modern web standards
- Make code responsive and accessible

Current context: You're helping build a web project using the Hex & Kex coding environment. The user can edit files, adjust settings, and preview their app in real-time.`;

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: "openai",
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  personality: 'hex' as PersonalityMode
};
