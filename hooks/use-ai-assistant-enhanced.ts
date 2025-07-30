import { useState, useCallback, useEffect, useRef } from 'react';
import { AISettings, AIMessage, DEFAULT_AI_SETTINGS } from '@/lib/ai-config';
import { AIServiceEnhanced, AIStreamResponse } from '@/lib/ai-service-enhanced';

const STORAGE_KEY = 'hex-kex-ai-settings';
const MESSAGES_STORAGE_KEY = 'hex-kex-ai-messages';

export function useAIAssistantEnhanced() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [aiService, setAIService] = useState<AIServiceEnhanced | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    const savedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
    
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      
      // Check if API key is valid
      if (parsed.apiKey && parsed.apiKey.trim() !== '') {
        setIsConfigured(true);
        setAIService(new AIServiceEnhanced(parsed));
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
    
    if (newSettings.apiKey && newSettings.apiKey.trim() !== '') {
      setIsConfigured(true);
      setAIService(new AIServiceEnhanced(newSettings));
    } else {
      setIsConfigured(false);
      setAIService(null);
    }
  }, []);

  // Save messages to localStorage
  const saveMessages = useCallback((newMessages: AIMessage[]) => {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(newMessages));
  }, []);

  // Update messages and save to localStorage
  const updateMessages = useCallback((newMessages: AIMessage[]) => {
    setMessages(newMessages);
    saveMessages(newMessages);
  }, [saveMessages]);

  // Send message with streaming
  const sendMessage = useCallback(async (content: string): Promise<AIMessage> => {
    if (!aiService || !isConfigured) {
      throw new Error('AI service not configured');
    }

    setIsLoading(true);
    setStreamingContent('');
    
    // Add user message
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    updateMessages(updatedMessages);

    // Create streaming message
    const streamingId = `assistant-${Date.now()}`;
    const streamingMessage: AIMessage = {
      id: streamingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setStreamingMessageId(streamingId);
    updateMessages([...updatedMessages, streamingMessage]);

    try {
      // Convert messages to AI service format
      const aiMessages = updatedMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      let fullContent = '';

      await aiService.streamResponse(aiMessages, (chunk: AIStreamResponse) => {
        if (chunk.error) {
          throw new Error(chunk.error);
        }

        if (chunk.content) {
          fullContent += chunk.content;
          setStreamingContent(fullContent);
          
          // Update the streaming message
          const currentMessages = messages.filter(m => m.id !== streamingId);
          const updatedStreamingMessage: AIMessage = {
            ...streamingMessage,
            content: fullContent,
            tokens: chunk.metadata?.tokens,
          };
          
          updateMessages([...currentMessages, updatedStreamingMessage]);
        }

        if (chunk.isComplete) {
          setIsLoading(false);
          setStreamingContent('');
          setStreamingMessageId(null);
        }
      });

      return streamingMessage;
    } catch (error) {
      setIsLoading(false);
      setStreamingContent('');
      setStreamingMessageId(null);
      
      // Add error message
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      
      updateMessages([...updatedMessages, errorMessage]);
      throw error;
    }
  }, [aiService, isConfigured, messages, updateMessages]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    saveMessages([]);
  }, [saveMessages]);

  // Test connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!aiService || !isConfigured) {
      return false;
    }

    try {
      await aiService.streamResponse([
        { role: 'user', content: 'Hello, this is a test message.' }
      ], (chunk) => {
        if (chunk.error) {
          throw new Error(chunk.error);
        }
        if (chunk.isComplete) {
          return true;
        }
      });
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }, [aiService, isConfigured]);

  // Cancel current request
  const cancelRequest = useCallback(() => {
    if (aiService) {
      aiService.cancelRequest();
    }
    setIsLoading(false);
    setStreamingContent('');
    setStreamingMessageId(null);
  }, [aiService]);

  return {
    settings,
    messages,
    isLoading,
    isConfigured,
    streamingContent,
    streamingMessageId,
    saveSettings,
    sendMessage,
    clearMessages,
    testConnection,
    cancelRequest,
  };
}
