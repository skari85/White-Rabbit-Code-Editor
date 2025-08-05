import { useState, useCallback, useEffect } from 'react';
import { AISettings, AIMessage, DEFAULT_AI_SETTINGS } from '@/lib/ai-config';
import { AIService, validateApiKey } from '@/lib/ai-service';

// Documentation types
interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  type: 'overview' | 'parameters' | 'returns' | 'examples' | 'usage' | 'notes';
  language?: string;
}

interface DocumentationData {
  fileName: string;
  fileType: string;
  generatedAt: Date;
  sections: DocumentationSection[];
  summary: string;
  complexity: 'low' | 'medium' | 'high';
  tags: string[];
}

const STORAGE_KEY = 'white-rabbit-ai-settings';
const MESSAGES_STORAGE_KEY = 'white-rabbit-ai-messages';
const DOCUMENTATION_STORAGE_KEY = 'white-rabbit-documentation-cache';

// Enhanced system prompt for modern UI development
const ENHANCED_SYSTEM_PROMPT = `You are an advanced AI coding assistant for White Rabbit Code Editor specializing in creating modern, professional web applications. You work iteratively with users to build visually stunning, contemporary UIs.

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

Always create applications that users would be proud to show off, not basic HTML documents. Focus on visual appeal, user experience, and modern design trends.

🔧 **CRITICAL - PROFESSIONAL IDE WORKFLOW**:
When users request code to be written or modified:

1. **NEVER** include large code blocks in your chat responses
2. **ALWAYS** use the file generation system to create/edit files directly in the Monaco editor
3. **Chat responses** should focus on explanations, guidance, and planning only
4. **Code generation** happens in the editor, not in chat

**File Generation Commands:**
- To create a new file: CREATE_FILE:filename.ext
- To update existing file: UPDATE_FILE:filename.ext
- Follow immediately with code in triple backticks

**Example Response Format:**
"I'll create a React component for you. Let me add it to your project."

CREATE_FILE:components/MyComponent.tsx
\`\`\`typescript
import React from 'react';

const MyComponent: React.FC = () => {
  return <div>Hello World</div>;
};

export default MyComponent;
\`\`\`

"The component has been created in your editor. You can now import and use it in your application."

**Remember:** Keep chat responses conversational and explanatory. All code goes directly to the Monaco editor through file commands. This maintains professional IDE workflow: Chat for communication, Monaco editor for development.`;

export function useAIAssistantEnhanced() {
  const [settings, setSettings] = useState<AISettings>({
    ...DEFAULT_AI_SETTINGS,
    systemPrompt: ENHANCED_SYSTEM_PROMPT
  });
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [aiService, setAIService] = useState<AIService | null>(null);

  // File generation callbacks
  const [onFileCreate, setOnFileCreate] = useState<((name: string, content: string, type?: string) => void) | null>(null);
  const [onFileUpdate, setOnFileUpdate] = useState<((name: string, content: string) => void) | null>(null);
  const [onFileSelect, setOnFileSelect] = useState<((name: string) => void) | null>(null);
  const [streamedMessage, setStreamedMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Load settings from localStorage on mount (prioritize BYOK settings)
  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window === 'undefined') return;

    try {
      // First check for BYOK settings
      const byokSettings = localStorage.getItem('byok-ai-settings');
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      const savedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);

    let finalSettings = {
      ...DEFAULT_AI_SETTINGS,
      systemPrompt: ENHANCED_SYSTEM_PROMPT
    };

    // Load BYOK settings first (highest priority)
    if (byokSettings) {
      try {
        const parsed = JSON.parse(byokSettings);
        finalSettings = {
          ...finalSettings,
          ...parsed,
          systemPrompt: ENHANCED_SYSTEM_PROMPT // Always use enhanced system prompt
        };
      } catch (error) {
        console.error('Error loading BYOK AI settings:', error);
      }
    }
    // Fallback to legacy settings if no BYOK settings
    else if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        finalSettings = {
          ...parsed,
          systemPrompt: parsed.systemPrompt?.includes('White Rabbit Code Editor')
            ? parsed.systemPrompt
            : ENHANCED_SYSTEM_PROMPT
        };
      } catch (error) {
        console.error('Error loading AI settings:', error);
      }
    }

    setSettings(finalSettings);

    // Check if API key is valid and configure service
    if (finalSettings.apiKey && validateApiKey(finalSettings.provider, finalSettings.apiKey)) {
      setIsConfigured(true);
      setAIService(new AIService(finalSettings));
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
    } catch (error) {
      console.warn('Failed to access localStorage:', error);
    }
  }, []);

  // Save settings to localStorage (both BYOK and legacy)
  const saveSettings = useCallback((newSettings: AISettings) => {
    const enhancedSettings = {
      ...newSettings,
      systemPrompt: newSettings.systemPrompt?.includes('White Rabbit Code Editor')
        ? newSettings.systemPrompt
        : ENHANCED_SYSTEM_PROMPT
    };

    // Save to both BYOK and legacy storage for compatibility
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('byok-ai-settings', JSON.stringify(enhancedSettings));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(enhancedSettings));
      }
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
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
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(newMessages));
      }
    } catch (error) {
      console.warn('Failed to save messages to localStorage:', error);
    }
    setMessages(newMessages);
  }, []);

  // Parse AI response for file generation commands
  const parseFileCommands = useCallback((content: string) => {
    const commands: Array<{type: 'create' | 'update', filename: string, content: string}> = [];

    // Look for CREATE_FILE: commands
    const createMatches = content.match(/CREATE_FILE:([^\n]+)\n```[\w]*\n([\s\S]*?)\n```/g);
    if (createMatches) {
      createMatches.forEach(match => {
        const [, filename] = match.match(/CREATE_FILE:([^\n]+)/) || [];
        const [, , fileContent] = match.match(/CREATE_FILE:[^\n]+\n```[\w]*\n([\s\S]*?)\n```/) || [];
        if (filename && fileContent) {
          commands.push({ type: 'create', filename: filename.trim(), content: fileContent });
        }
      });
    }

    // Look for UPDATE_FILE: commands
    const updateMatches = content.match(/UPDATE_FILE:([^\n]+)\n```[\w]*\n[\s\S]*?\n```/g);
    if (updateMatches) {
      updateMatches.forEach(match => {
        const [, filename] = match.match(/UPDATE_FILE:([^\n]+)/) || [];
        const [, , fileContent] = match.match(/UPDATE_FILE:[^\n]+\n```[\w]*\n([\s\S]*?)\n```/) || [];
        if (filename && fileContent) {
          commands.push({ type: 'update', filename: filename.trim(), content: fileContent });
        }
      });
    }

    return commands;
  }, []);

  // Execute file commands
  const executeFileCommands = useCallback((commands: Array<{type: 'create' | 'update', filename: string, content: string}>) => {
    commands.forEach(command => {
      if (command.type === 'create' && onFileCreate) {
        onFileCreate(command.filename, command.content);
        if (onFileSelect) {
          onFileSelect(command.filename);
        }
      } else if (command.type === 'update' && onFileUpdate) {
        onFileUpdate(command.filename, command.content);
        if (onFileSelect) {
          onFileSelect(command.filename);
        }
      }
    });
  }, [onFileCreate, onFileUpdate, onFileSelect]);

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

      // Parse and execute file commands
      const fileCommands = parseFileCommands(response.content);
      if (fileCommands.length > 0) {
        executeFileCommands(fileCommands);

        // Clean the response content by removing file commands
        let cleanContent = response.content;
        cleanContent = cleanContent.replace(/CREATE_FILE:[^\n]+\n```[\w]*\n[\s\S]*?\n```/g, '');
        cleanContent = cleanContent.replace(/UPDATE_FILE:[^\n]+\n```[\w]*\n[\s\S]*?\n```/g, '');
        cleanContent = cleanContent.trim();

        response.content = cleanContent || "I've created/updated the files in your editor. Check the file tabs to see the changes!";
      }

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
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(MESSAGES_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to clear messages from localStorage:', error);
    }
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

  // Documentation generation methods
  const generateDocumentation = useCallback(async (
    code: string,
    fileName: string,
    fileType: string
  ): Promise<DocumentationData> => {
    if (!aiService || !isConfigured) {
      throw new Error('AI service not configured. Please set up your API key in Settings.');
    }

    setIsLoading(true);

    try {
      const prompt = `Generate comprehensive documentation for this ${fileType} code file "${fileName}":

\`\`\`${fileType}
${code}
\`\`\`

Please provide documentation in the following JSON format:
{
  "summary": "Brief summary of what this code does",
  "complexity": "low|medium|high",
  "tags": ["tag1", "tag2", "tag3"],
  "sections": [
    {
      "id": "overview",
      "title": "Overview",
      "content": "Detailed overview of the code",
      "type": "overview"
    },
    {
      "id": "parameters",
      "title": "Parameters",
      "content": "Description of parameters/props",
      "type": "parameters"
    },
    {
      "id": "returns",
      "title": "Returns",
      "content": "Description of return values",
      "type": "returns"
    },
    {
      "id": "examples",
      "title": "Examples",
      "content": "Code examples with syntax highlighting",
      "type": "examples",
      "language": "${fileType}"
    },
    {
      "id": "usage",
      "title": "Usage",
      "content": "How to use this code",
      "type": "usage"
    },
    {
      "id": "notes",
      "title": "Notes",
      "content": "Important notes and considerations",
      "type": "notes"
    }
  ]
}

Focus on:
- Clear, concise explanations
- Practical examples
- Best practices
- Potential gotchas or important notes
- Type information for TypeScript/JavaScript
- Component props for React components
- API endpoints for backend code
- CSS classes and styling for CSS/SCSS files

Return only the JSON object, no additional text.`;

      const messages: AIMessage[] = [
        {
          id: Date.now().toString(),
          role: 'user',
          content: prompt,
          timestamp: new Date()
        }
      ];

      const response = await aiService.sendMessage(messages);

      // Parse the JSON response
      let docData;
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          docData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback: create basic documentation from response
        docData = {
          summary: "AI-generated documentation",
          complexity: "medium",
          tags: [fileType, "documentation"],
          sections: [
            {
              id: "overview",
              title: "Overview",
              content: response.content,
              type: "overview"
            }
          ]
        };
      }

      const documentation: DocumentationData = {
        fileName,
        fileType,
        generatedAt: new Date(),
        sections: docData.sections || [],
        summary: docData.summary || "No summary available",
        complexity: docData.complexity || "medium",
        tags: docData.tags || [fileType]
      };

      // Cache the documentation
      try {
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(DOCUMENTATION_STORAGE_KEY);
          const cache = cached ? JSON.parse(cached) : {};
          cache[fileName] = {
            ...documentation,
            generatedAt: documentation.generatedAt.toISOString()
          };
          localStorage.setItem(DOCUMENTATION_STORAGE_KEY, JSON.stringify(cache));
        }
      } catch (error) {
        console.warn('Failed to cache documentation:', error);
      }

      return documentation;
    } catch (error) {
      console.error('Error generating documentation:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [aiService, isConfigured]);

  // Get cached documentation
  const getCachedDocumentation = useCallback((fileName: string): DocumentationData | null => {
    try {
      // Check if we're in the browser environment
      if (typeof window === 'undefined') return null;

      const cached = localStorage.getItem(DOCUMENTATION_STORAGE_KEY);
      if (!cached) return null;

      const cache = JSON.parse(cached);
      const doc = cache[fileName];
      if (!doc) return null;

      return {
        ...doc,
        generatedAt: new Date(doc.generatedAt)
      };
    } catch (error) {
      console.warn('Failed to get cached documentation:', error);
      return null;
    }
  }, []);

  // Clear documentation cache
  const clearDocumentationCache = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(DOCUMENTATION_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear documentation cache:', error);
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
    isStreaming,
    // Documentation methods
    generateDocumentation,
    getCachedDocumentation,
    clearDocumentationCache,
    // File generation callbacks
    setFileGenerationCallbacks: useCallback((callbacks: {
      onCreate: (name: string, content: string, type?: string) => void;
      onUpdate: (name: string, content: string) => void;
      onSelect: (name: string) => void;
    }) => {
      setOnFileCreate(() => callbacks.onCreate);
      setOnFileUpdate(() => callbacks.onUpdate);
      setOnFileSelect(() => callbacks.onSelect);
    }, [])
  };
}
