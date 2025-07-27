import { useState, useCallback, useEffect } from 'react';
import { AISettings, AIMessage, DEFAULT_AI_SETTINGS } from '@/lib/ai-config';
import { AIService, validateApiKey } from '@/lib/ai-service';

const STORAGE_KEY = 'hex-kex-ai-settings';
const MESSAGES_STORAGE_KEY = 'hex-kex-ai-messages';

export function useAIAssistant() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [aiService, setAIService] = useState<AIService | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    const savedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
    
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      
      // Check if API key is valid
      if (parsed.apiKey && validateApiKey(parsed.provider, parsed.apiKey)) {
        setIsConfigured(true);
        setAIService(new AIService(parsed));
      }
    }

    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      setMessages(parsed.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      })));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: AISettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
    
    if (newSettings.apiKey && validateApiKey(newSettings.provider, newSettings.apiKey)) {
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
  const sendMessage = useCallback(async (content: string, context?: { files: any[], selectedFile: string, appSettings: any }) => {
    if (!aiService || !isConfigured) {
      throw new Error('AI service not configured. Please set up your API key.');
    }

    setIsLoading(true);

    try {
      // Create user message
      const userMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date()
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
  }, [aiService, isConfigured, messages, saveMessages]);

  // Clear conversation
  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(MESSAGES_STORAGE_KEY);
  }, []);

  // Test API connection
  const testConnection = useCallback(async (testSettings: AISettings): Promise<boolean> => {
    try {
      const testService = new AIService(testSettings);
      const testMessage: AIMessage = {
        id: 'test',
        role: 'user',
        content: 'Hello, please respond with "Connection successful" to test the API.',
        timestamp: new Date()
      };
      
      await testService.sendMessage([testMessage]);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }, []);

  return {
    settings,
    messages,
    isLoading,
    isConfigured,
    saveSettings,
    sendMessage,
    clearMessages,
    testConnection
  };
}
