import { useState, useCallback, useEffect } from 'react';
import { AISettings, AIMessage, DEFAULT_AI_SETTINGS } from '@/lib/ai-config';
import { AIService, validateApiKey } from '@/lib/ai-service';

const STORAGE_KEY = 'hex-kex-ai-settings';
const MESSAGES_STORAGE_KEY = 'hex-kex-ai-messages';

// Enhanced system prompt for coding assistance
const ENHANCED_SYSTEM_PROMPT = `You are an advanced AI coding assistant for Hex & Kex Code Console. You create complete applications through conversation, just like how we chat here.

🎯 **Your Role**: Build applications by chatting with users naturally. When they describe what they want, you create the files and code needed.

📁 **File Creation Format**: Always use this exact format when creating files:
\`\`\`html
// index.html
<!DOCTYPE html>
<html>
<head>
    <title>My App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello World</h1>
    <script src="script.js"></script>
</body>
</html>
\`\`\`

\`\`\`css
// style.css
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}
\`\`\`

\`\`\`javascript
// script.js
console.log('App loaded!');
\`\`\`

🚀 **What You Do**:
- Listen to user requests naturally (like "make me a todo app")
- Create complete, working applications
- Generate all necessary files (HTML, CSS, JS)
- Explain what you're building
- Make apps that work immediately when previewed

💡 **Examples of Requests**:
- "Create a simple calculator"
- "Build a todo list app"
- "Make a weather dashboard"
- "Create a landing page for my business"

Always respond conversationally and create functional, complete applications that users can immediately preview and use.`;

export function useAIAssistantEnhanced() {
  const [settings, setSettings] = useState<AISettings>({
    ...DEFAULT_AI_SETTINGS,
    systemPrompt: ENHANCED_SYSTEM_PROMPT
  });
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [aiService, setAIService] = useState<AIService | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    const savedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const enhancedSettings = {
          ...parsed,
          systemPrompt: parsed.systemPrompt?.includes('Hex & Kex code editor') 
            ? parsed.systemPrompt 
            : ENHANCED_SYSTEM_PROMPT
        };
        setSettings(enhancedSettings);
        
        // Check if API key is valid
        if (enhancedSettings.apiKey && validateApiKey(enhancedSettings.provider, enhancedSettings.apiKey)) {
          setIsConfigured(true);
          setAIService(new AIService(enhancedSettings));
        }
      } catch (error) {
        console.error('Error loading AI settings:', error);
      }
    }

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (error) {
        console.error('Error loading AI messages:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: AISettings) => {
    const enhancedSettings = {
      ...newSettings,
      systemPrompt: newSettings.systemPrompt?.includes('Hex & Kex code editor') 
        ? newSettings.systemPrompt 
        : ENHANCED_SYSTEM_PROMPT
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enhancedSettings));
    setSettings(enhancedSettings);
    
    if (enhancedSettings.apiKey && validateApiKey(enhancedSettings.provider, enhancedSettings.apiKey)) {
      setIsConfigured(true);
      setAIService(new AIService(enhancedSettings));
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
  const sendMessage = useCallback(async (
    content: string, 
    context?: { 
      files: any[], 
      selectedFile: string, 
      appSettings: any
    }
  ) => {
    if (!aiService || !isConfigured) {
      throw new Error('AI service not configured. Please set up your API key in Settings.');
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

CURRENT PROJECT CONTEXT:
- Current file: ${context.selectedFile}
- App name: ${context.appSettings.name}
- Files in project: ${context.files.map(f => f.name).join(', ')}

Current file content:
\`\`\`${context.files.find(f => f.name === context.selectedFile)?.type || 'text'}
${context.files.find(f => f.name === context.selectedFile)?.content || ''}
\`\`\`

Please help me with this request in the context of my project.`;
        
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
      const enhancedTestSettings = {
        ...testSettings,
        systemPrompt: ENHANCED_SYSTEM_PROMPT
      };
      const testService = new AIService(enhancedTestSettings);
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
