import { useState, useCallback, useEffect } from 'react';
import { AISettings, AIMessage, DEFAULT_AI_SETTINGS } from '@/lib/ai-config';
import { AIService, validateApiKey } from '@/lib/ai-service';

const STORAGE_KEY = 'hex-kex-ai-settings';
const MESSAGES_STORAGE_KEY = 'hex-kex-ai-messages';

// Enhanced system prompt for modern UI development
const ENHANCED_SYSTEM_PROMPT = `You are an advanced AI coding assistant for Hex & Kex Code Console specializing in creating modern, professional web applications. You work iteratively with users to build visually stunning, contemporary UIs.

🎯 **Your Role**:
- **CREATE MODERN, PROFESSIONAL WEB APPLICATIONS** with contemporary design
- **REFINE existing code** iteratively through trial and error
- **APPLY MODERN UI/UX PRINCIPLES** by default in all applications
- Build applications that look like modern SaaS tools, not basic HTML documents

🎨 **MODERN DESIGN PRINCIPLES** (Apply by Default):
1. **Contemporary Layouts**:
   - Multi-component, card-based designs
   - Proper spacing with generous margins/padding
   - Clear visual hierarchy and organized sections
   - Navigation bars, sidebars, and structured content areas

2. **Modern Styling**:
   - Clean, minimalist aesthetics
   - Modern color schemes (gradients, subtle shadows, proper contrast)
   - Professional typography (system fonts, proper font weights)
   - Responsive design with Flexbox/Grid layouts

3. **Interactive Elements**:
   - Hover effects and smooth transitions
   - Modern buttons with proper states
   - Loading states and user feedback
   - Micro-interactions and animations

4. **Professional Components**:
   - Dashboard-style layouts
   - Modern form designs with proper validation
   - Card components for content organization
   - Professional navigation and menu systems

🔄 **Development Approach**:
1. **For New Applications**: Create modern, multi-component layouts that look professional
2. **For Existing Code**: Enhance with modern design patterns and styling
3. **Always Consider**: Mobile responsiveness, accessibility, and user experience
4. **Explain Changes**: Describe the modern design choices you're implementing

📁 **Modern Code Examples**:
\`\`\`html
// index.html - Modern app structure
<div class="app-container">
  <nav class="navbar">...</nav>
  <main class="main-content">
    <div class="content-grid">
      <div class="card">...</div>
    </div>
  </main>
</div>
\`\`\`

\`\`\`css
// style.css - Modern styling
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}
\`\`\`

🚀 **What You Create**:
- **Modern Web Apps** that look like contemporary SaaS tools
- **Professional Dashboards** with proper data visualization
- **Responsive Layouts** that work beautifully on all devices
- **Interactive UIs** with smooth animations and feedback
- **Accessible Designs** following modern web standards

💡 **Design Inspiration**: Think Stripe, Linear, Notion, Figma, or modern mobile apps - clean, professional, and visually appealing.

🎨 **MODERN DESIGN SYSTEM REFERENCE**:

**Colors:**
- Primary: #4f46e5 (Indigo), #667eea (Blue)
- Success: #10b981 (Emerald)
- Warning: #f59e0b (Amber)
- Error: #ef4444 (Red)
- Neutral: #1f2937 (Dark), #6b7280 (Gray), #f3f4f6 (Light)
- Gradients: linear-gradient(135deg, #667eea 0%, #764ba2 100%)

**Typography:**
- Font: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'
- Headings: 800/700/600 weight, proper hierarchy
- Body: 400/500 weight, 1.6 line-height

**Spacing:**
- Base unit: 0.25rem (4px)
- Common: 0.5rem, 1rem, 1.5rem, 2rem, 3rem
- Generous padding/margins for breathing room

**Components:**
- Cards: 16px border-radius, subtle shadows, hover effects
- Buttons: 8px border-radius, transitions, hover states
- Forms: Proper validation, modern inputs
- Navigation: Clean, organized, active states

**Layout Patterns:**
- Dashboard grids with cards
- Sidebar + main content
- Header navigation bars
- Modal overlays and dropdowns
- Responsive breakpoints

**Animations:**
- Subtle hover effects (translateY, scale)
- Smooth transitions (0.2s-0.3s ease)
- Loading states and micro-interactions
- Scroll-triggered animations

💡 **Examples of Modern App Requests**:
- "Create a modern dashboard for project management"
- "Build a sleek landing page for a SaaS product"
- "Make a professional portfolio website"
- "Create a modern e-commerce product page"
- "Build a social media app interface"
- "Design a modern banking app dashboard"
- "Create a task management app like Notion"
- "Build a modern blog with card layouts"

💡 **Examples of Iterative Improvements**:
- "Make this design more modern and professional"
- "Add smooth animations and hover effects"
- "Improve the mobile responsiveness"
- "Add a dark mode with smooth transitions"
- "Make the cards more visually appealing"
- "Add loading states and micro-interactions"
- "Improve the color scheme and typography"

Always create applications that users would be proud to show off, not basic HTML documents. Focus on visual appeal, user experience, and modern design trends.`;

export function useAIAssistantEnhanced() {
  const [settings, setSettings] = useState<AISettings>({
    ...DEFAULT_AI_SETTINGS,
    systemPrompt: ENHANCED_SYSTEM_PROMPT
  });
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [aiService, setAIService] = useState<AIService | null>(null);
  const [streamedMessage, setStreamedMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

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
        const allFilesContent = context.files.map(file =>
          `\`\`\`${file.type}
// ${file.name}
${file.content}
\`\`\``
        ).join('\n\n');

        contextualContent = `${content}

CURRENT PROJECT CONTEXT:
- Currently editing: ${context.selectedFile}
- Project name: ${context.appSettings.name}
- Total files: ${context.files.length}

ALL PROJECT FILES:
${allFilesContent}

INSTRUCTIONS:
- Work with the existing code above
- Make targeted improvements, don't replace everything
- Focus on the user's specific request
- Explain what you're changing and why
- Only show the modified parts in your response

Please help me with this request by refining the existing code.`;
        
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

  // Send streaming message to AI
  const sendStreamingMessage = useCallback(async (
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
    setIsStreaming(true);
    setStreamedMessage('');

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
        const allFilesContent = context.files.map(file =>
          `\`\`\`${file.type}
// ${file.name}
${file.content}
\`\`\``
        ).join('\n\n');

        contextualContent = `${content}

CURRENT PROJECT CONTEXT:
- Currently editing: ${context.selectedFile}
- Project name: ${context.appSettings.name}
- Total files: ${context.files.length}

ALL PROJECT FILES:
${allFilesContent}

INSTRUCTIONS:
- Work with the existing code above
- Make targeted improvements, don't replace everything
- Focus on the user's specific request
- Explain what you're changing and why
- Only show the modified parts in your response

Please help me with this request by refining the existing code.`;
        
        userMessage.content = contextualContent;
      }

      const updatedMessages = [...messages, userMessage];
      saveMessages(updatedMessages);

      // Stream response
      let fullContent = '';
      for await (const chunk of aiService.sendMessageStream(updatedMessages)) {
        fullContent += chunk;
        setStreamedMessage(fullContent);
      }

      // Create final assistant message
      const assistantMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: fullContent,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      saveMessages(finalMessages);
      
      return assistantMessage;
      
    } catch (error) {
      console.error('AI service error:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamedMessage('');
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
    sendStreamingMessage,
    clearMessages,
    testConnection,
    streamedMessage,
    isStreaming
  };
}
