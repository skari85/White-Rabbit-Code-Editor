import { useState, useCallback, useEffect } from 'react';
import {
  AISettings,
  AIMessage,
  AI_PROVIDERS,
  DEFAULT_AI_SETTINGS,
} from '@/lib/ai-config';
import { AIService } from '@/lib/ai-service';

// A provider is usable once a key has been entered when it requires one —
// format-guessing (e.g. "starts with sk-") rejects valid keys whose format
// doesn't match the guess (or has since changed), so it isn't used here.
// The real validator is testConnection, which calls the actual provider API.
function hasValidConfig(settings: AISettings): boolean {
  const provider = AI_PROVIDERS.find(p => p.id === settings.provider);
  if (!provider) return false;
  return !provider.requiresApiKey || Boolean(settings.apiKey?.trim());
}

// The same key every AI surface in the app now reads/writes (Coder Space,
// the classic editor, and workspace), so a key entered on any one of them
// is immediately usable on the others — see byok-ai-settings.tsx and
// use-ai-assistant-enhanced.ts, which already treated this as canonical.
const STORAGE_KEY = 'byok-ai-settings';
const LEGACY_STORAGE_KEY = 'hex-kex-ai-settings';
const MESSAGES_STORAGE_KEY = 'hex-kex-ai-messages';

export function useAIAssistant() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [aiService, setAIService] = useState<AIService | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    // One-time migration: a key saved here before the storage keys were
    // unified lives under the old name and would otherwise look "missing".
    let savedSettings = localStorage.getItem(STORAGE_KEY);
    if (!savedSettings) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        savedSettings = legacy;
      }
    }
    const savedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);

        // Check if the provider is usable (key present when required)
        if (hasValidConfig(parsed)) {
          setIsConfigured(true);
          setAIService(new AIService(parsed));
        }
      } catch (error) {
        console.warn(
          'Failed to parse saved AI settings, resetting to defaults:',
          error
        );
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(
          parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
      } catch (error) {
        console.warn(
          'Failed to parse saved AI messages, resetting to defaults:',
          error
        );
        localStorage.removeItem(MESSAGES_STORAGE_KEY);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: AISettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);

    if (hasValidConfig(newSettings)) {
      setIsConfigured(true);
      setAIService(new AIService(newSettings));
    } else {
      setIsConfigured(false);
      setAIService(null);
    }
  }, []);

  // Save messages to localStorage
  const saveMessages = useCallback((newMessages: AIMessage[]) => {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(newMessages));
    setMessages(newMessages);
  }, []);

  // Send message to AI
  const sendMessage = useCallback(
    async (
      content: string,
      context?: { files: any[]; selectedFile: string; appSettings: any }
    ) => {
      if (!aiService || !isConfigured) {
        throw new Error(
          'AI service not configured. Please set up your API key.'
        );
      }

      setIsLoading(true);

      try {
        // Create user message
        const userMessage: AIMessage = {
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date(),
        };

        // Add context if provided
        let contextualContent = content;
        if (context) {
          contextualContent = `${content}

CURRENT CONTEXT:
- Current file: ${context.selectedFile}
- App name: ${context.appSettings.name}
- Files in project: ${context.files.map(f => f.name).join(', ')}

Current file content:
\`\`\`${context.files.find(f => f.name === context.selectedFile)?.type || 'text'}
${context.files.find(f => f.name === context.selectedFile)?.content || ''}
\`\`\``;

          userMessage.content = contextualContent;
        }

        const updatedMessages = [...messages, userMessage];
        saveMessages(updatedMessages);

        // Send to AI service
        const response = await aiService.sendMessage(updatedMessages);
        const finalMessages = [...updatedMessages, response];

        saveMessages(finalMessages);
        return response;
      } catch (error) {
        console.error('AI service error:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [aiService, isConfigured, messages, saveMessages]
  );

  // Clear conversation
  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(MESSAGES_STORAGE_KEY);
  }, []);

  // Test API connection
  const testConnection = useCallback(
    async (testSettings: AISettings): Promise<boolean> => {
      try {
        const testService = new AIService(testSettings);
        const testMessage: AIMessage = {
          id: 'test',
          role: 'user',
          content:
            'Hello, please respond with "Connection successful" to test the API.',
          timestamp: new Date(),
        };

        await testService.sendMessage([testMessage]);
        return true;
      } catch (error) {
        console.error('Connection test failed:', error);
        return false;
      }
    },
    []
  );

  return {
    settings,
    messages,
    isLoading,
    isConfigured,
    saveSettings,
    sendMessage,
    clearMessages,
    testConnection,
  };
}
