import { ProviderAdapter } from './base';
import { OpenAIAdapter } from './openai';
import { GroqAdapter } from './groq';
import { AnthropicAdapter } from './anthropic';
import { GoogleAdapter } from './google';
import { MistralAdapter } from './mistral';
import { OllamaAdapter } from './ollama';

const ALL_ADAPTERS: ProviderAdapter[] = [
  OpenAIAdapter,
  GroqAdapter,
  AnthropicAdapter,
  GoogleAdapter,
  MistralAdapter,
  OllamaAdapter,
];

const idToAdapter = new Map(ALL_ADAPTERS.map(a => [a.id, a] as const));

export function getAdapter(providerId: string): ProviderAdapter | undefined {
  return idToAdapter.get(providerId as any);
}
