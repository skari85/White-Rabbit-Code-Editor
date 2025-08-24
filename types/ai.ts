import { PersonalityMode } from '@/lib/personality-system';

export interface AISettings {
  provider: string;
  model: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  personality: PersonalityMode;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  tokens?: number;
}

export interface AIProvider {
  name: string;
  id: string;
  requiresApiKey: boolean;
  models: string[];
  endpoint: string;
}
