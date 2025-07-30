import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { AIMessage, AI_PROVIDERS, AISettings } from '@/lib/ai-config';
import { 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  Bot, 
  User, 
  Loader2, 
  ChevronDown, 
  Settings2, 
  Zap, 
  Target,
  Code,
  FileText,
  Terminal,
  Sparkles,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  MessageSquare,
  Cpu,
  Brain,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock,
  Timer,
  Split,
  Maximize2,
  Minimize2,
  GripVertical,
  Monitor,
  MonitorOff,
  Settings
} from 'lucide-react';
import { MonacoEditorEnhanced } from './monaco-editor-dynamic';
import { DevelopmentToolsEnhanced } from './development-tools-enhanced';

interface SplitPanelLayoutProps {
  messages: AIMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onClearMessages: () => void;
  isConfigured: boolean;
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  // Integration props
  generatedFiles?: Array<{ name: string; content: string; type: string }>;
  selectedFile?: string;
  onFileSelect?: (fileName: string) => void;
  onFileUpdate?: (fileName: string, content: string) => void;
  personality?: string;
  showDevelopmentTools?: boolean;
  onDevelopmentToolsToggle?: () => void;
  collaborationService?: any;
}

interface StreamingMessage {
  id: string;
  role: 'assistant';
  content: string;
  isStreaming: boolean;
  streamType: 'text' | 'code' | 'command' | 'thinking' | 'planning';
  timestamp: Date;
  tokens?: number;
}

interface CodeFile {
  name: string;
  content: string;
  language: string;
  isActive: boolean;
}

export function SplitPanelLayout({ 
  messages, 
  isLoading, 
  onSendMessage, 
  onClearMessages, 
  isConfigured, 
  settings, 
  onSettingsChange,
  generatedFiles = [],
  selectedFile,
  onFileSelect,
  onFileUpdate,
  personality = 'hex',
  showDevelopmentTools = false,
  onDevelopmentToolsToggle,
  collaborationService
}: SplitPanelLayoutProps) {
  const [input, setInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showProviderConfig, setShowProviderConfig] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [streamingMessages, setStreamingMessages] = useState<StreamingMessage[]>([]);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [isReplaying, setIsReplaying] = useState(false);
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [chatPanelWidth, setChatPanelWidth] = useState(50); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessages]);

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && resizeRef.current) {
        const container = resizeRef.current.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
          setChatPanelWidth(Math.max(20, Math.min(80, newWidth)));
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCurrentProvider = () => {
    return AI_PROVIDERS.find(p => p.id === settings.provider) || AI_PROVIDERS[0];
  };

  const handleModelSelect = (model: string) => {
    onSettingsChange({ ...settings, model });
    setShowModelDropdown(false);
  };

  const handleProviderSelect = (providerId: string) => {
    const provider = AI_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      onSettingsChange({ 
        ...settings, 
        provider: providerId, 
        model: provider.models[0] 
      });
    }
    setShowModelDropdown(false);
  };

  const addCodeFile = (name: string, content: string, language: string) => {
    const newFile: CodeFile = {
      name,
      content,
      language,
      isActive: true
    };
    
    setCodeFiles(prev => {
      const updated = prev.map(f => ({ ...f, isActive: false }));
      return [...updated, newFile];
    });
    setActiveFileIndex(codeFiles.length);
  };

  const updateCodeFile = (index: number, content: string) => {
    setCodeFiles(prev => 
      prev.map((file, i) => 
        i === index ? { ...file, content } : file
      )
    );
  };

  const simulateStreamingResponse = async (message: string) => {
    const streamingId = `stream-${Date.now()}`;
    const newStreamingMessage: StreamingMessage = {
      id: streamingId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      streamType: 'text',
      timestamp: new Date(),
    };

    setStreamingMessages(prev => [...prev, newStreamingMessage]);

    // Simulate different types of responses based on message content
    const responseTypes = [
      { type: 'thinking', content: '🤔 Analyzing your request...', color: 'text-purple-400' },
      { type: 'planning', content: '📋 Planning the solution...', color: 'text-blue-400' },
      { type: 'code', content: '💻 Generating code...', color: 'text-green-400' },
      { type: 'command', content: '⚡ Executing commands...', color: 'text-yellow-400' },
      { type: 'text', content: '📝 Crafting response...', color: 'text-cyan-400' }
    ];

    const randomType = responseTypes[Math.floor(Math.random() * responseTypes.length)];
    
    // Update streaming message with type
    setStreamingMessages(prev => 
      prev.map(msg => 
        msg.id === streamingId 
          ? { ...msg, streamType: randomType.type as any }
          : msg
      )
    );

    // Simulate streaming content with code generation
    const sampleResponses = [
      {
        type: 'thinking',
        content: `I understand you want to ${message.toLowerCase()}. Let me analyze the requirements and create a comprehensive solution.`,
        color: 'text-purple-400'
      },
      {
        type: 'planning',
        content: `Here's my plan:\n\n1. First, I'll set up the basic structure\n2. Then implement the core functionality\n3. Finally, add error handling and optimization`,
        color: 'text-blue-400'
      },
      {
        type: 'code',
        content: `I'll create the following files:\n\n• index.html - Main structure\n• style.css - Styling\n• script.js - Functionality`,
        color: 'text-green-400',
        files: [
          {
            name: 'index.html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Todo App</h1>
        <div class="input-section">
            <input type="text" id="todo-input" placeholder="Enter a new task">
            <button id="add-todo-btn">Add</button>
        </div>
        <ul id="todo-list"></ul>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
            language: 'html'
          },
          {
            name: 'style.css',
            content: `body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

.container {
    max-width: 400px;
    margin: 40px auto;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
    text-align: center;
    color: #333;
    margin-bottom: 30px;
}

.input-section {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

#todo-input {
    flex: 1;
    padding: 12px;
    font-size: 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    outline: none;
}

#todo-input:focus {
    border-color: #007AFF;
}

#add-todo-btn {
    background-color: #007AFF;
    color: white;
    border: none;
    padding: 12px 20px;
    font-size: 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
}

#add-todo-btn:hover {
    background-color: #0056CC;
}

#todo-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

#todo-list li {
    padding: 15px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

#todo-list li:last-child {
    border-bottom: none;
}

.todo-text {
    flex: 1;
    margin-right: 10px;
}

.delete-btn {
    background-color: #FF3B30;
    color: white;
    border: none;
    padding: 8px 12px;
    font-size: 14px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.delete-btn:hover {
    background-color: #D70015;
}`,
            language: 'css'
          },
          {
            name: 'script.js',
            content: `// Todo App JavaScript
console.log('Todo App loaded!');

// Get DOM elements
const todoInput = document.getElementById('todo-input');
const addTodoBtn = document.getElementById('add-todo-btn');
const todoList = document.getElementById('todo-list');

// Add event listeners
addTodoBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

// Add todo function
function addTodo() {
    const userInput = todoInput.value.trim();
    
    if (userInput !== '') {
        // Create list item
        const li = document.createElement('li');
        
        // Create todo text span
        const todoText = document.createElement('span');
        todoText.textContent = userInput;
        todoText.className = 'todo-text';
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', () => {
            li.remove();
        });
        
        // Assemble the todo item
        li.appendChild(todoText);
        li.appendChild(deleteBtn);
        
        // Add to list
        todoList.appendChild(li);
        
        // Clear input
        todoInput.value = '';
        todoInput.focus();
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('Todo App initialized!');
    todoInput.focus();
});`,
            language: 'javascript'
          }
        ]
      },
      {
        type: 'command',
        content: `Commands to run:\n\n\`\`\`bash
# Start the development server
python -m http.server 8000

# Or use Node.js
npx serve .

# Open in browser
open http://localhost:8000
\`\`\``,
        color: 'text-yellow-400'
      }
    ];

    const selectedResponse = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
    
    // Simulate character-by-character streaming
    const content = selectedResponse.content;
    for (let i = 0; i <= content.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50 / replaySpeed));
      setStreamingMessages(prev => 
        prev.map(msg => 
          msg.id === streamingId 
            ? { ...msg, content: content.substring(0, i) }
            : msg
        )
      );
    }

    // If this is a code response, add files to the editor
    if (selectedResponse.type === 'code' && selectedResponse.files) {
      selectedResponse.files.forEach(file => {
        addCodeFile(file.name, file.content, file.language);
      });
    }

    // Mark as complete
    setStreamingMessages(prev => 
      prev.map(msg => 
        msg.id === streamingId 
          ? { ...msg, isStreaming: false }
          : msg
      )
    );
  };

  const handlePlanAction = async () => {
    if (!input.trim() || isLoading || !isConfigured) return;
    const planMessage = `Plan: ${input.trim()}`;
    setInput('');
    await simulateStreamingResponse(planMessage);
    await onSendMessage(planMessage);
  };

  const handleActAction = async () => {
    if (!input.trim() || isLoading || !isConfigured) return;
    const actMessage = `Act: ${input.trim()}`;
    setInput('');
    await simulateStreamingResponse(actMessage);
    await onSendMessage(actMessage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isConfigured) return;

    const message = input.trim();
    setInput('');
    
    try {
      await simulateStreamingResponse(message);
      await onSendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStreamTypeIcon = (type: string) => {
    switch (type) {
      case 'thinking': return <Brain className="w-4 h-4" />;
      case 'planning': return <Lightbulb className="w-4 h-4" />;
      case 'code': return <Code className="w-4 h-4" />;
      case 'command': return <Terminal className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStreamTypeColor = (type: string) => {
    switch (type) {
      case 'thinking': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'planning': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'code': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'command': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default: return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    }
  };

  const renderStreamingMessage = (message: StreamingMessage) => {
    const isStreaming = message.isStreaming;
    const streamType = message.streamType;
    
    return (
      <div key={message.id} className="flex gap-3 justify-start">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-gradient-to-br from-purple-500 to-blue-500">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        
        <div className="max-w-[80%]">
          <div className={`rounded-lg px-4 py-3 border ${getStreamTypeColor(streamType)}`}>
            <div className="flex items-center gap-2 mb-2">
              {getStreamTypeIcon(streamType)}
              <span className="text-xs font-medium capitalize">{streamType}</span>
              {isStreaming && (
                <div className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs">Streaming...</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="whitespace-pre-wrap text-sm">
                {message.content}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{message.timestamp.toLocaleTimeString()}</span>
            <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
              <Cpu className="w-3 h-3 mr-1" />
              AI Assistant
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  const renderMessage = (message: AIMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-gradient-to-br from-purple-500 to-blue-500">
            <img 
              src="/hexkexlogo.png" 
              alt="Hex & Kex" 
              className="w-6 h-6 object-contain"
            />
          </div>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
          <div className={`rounded-lg px-4 py-3 ${
            isUser 
              ? 'bg-blue-600 text-white ml-auto' 
              : 'bg-gray-800 text-white border border-gray-600'
          }`}>
            <MessageContent content={message.content} onCopy={copyToClipboard} copiedCode={copiedCode} />
          </div>
          
          <div className={`flex items-center gap-2 mt-1 text-xs text-gray-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <Clock className="w-3 h-3" />
            <span>{message.timestamp.toLocaleTimeString()}</span>
            {message.tokens && (
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                <Cpu className="w-3 h-3 mr-1" />
                {message.tokens} tokens
              </Badge>
            )}
          </div>
        </div>
        
        {isUser && (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  if (!isConfigured) {
    return (
      <div className="flex h-full bg-[#1a1a1a] text-white">
        {/* Chat Panel */}
        <div className="flex flex-col w-1/2 border-r border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">Visual AI Assistant</span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-purple-500 to-blue-500">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Assistant Not Configured</h3>
              <p className="text-gray-400 mb-4">
                Configure your AI provider to start the visual coding experience.
              </p>
            </div>
          </div>

          {/* BYOK Footer */}
          <div className="border-t border-gray-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-400">BYOK (Bring Your Own Key)</span>
            </div>
            <div className="flex gap-2">
              <select 
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
                value={settings.provider}
                onChange={(e) => handleProviderSelect(e.target.value)}
              >
                {AI_PROVIDERS.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProviderConfig(!showProviderConfig)}
                className="bg-gray-800 border-gray-600 hover:bg-gray-700"
              >
                <Settings2 className="w-4 h-4" />
              </Button>
            </div>
            
            {showProviderConfig && getCurrentProvider().requiresApiKey && (
              <div className="mt-2">
                <Input
                  type="password"
                  placeholder={`Enter ${getCurrentProvider().name} API Key`}
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onSettingsChange({ ...settings, apiKey: tempApiKey });
                      setTempApiKey('');
                      setShowProviderConfig(false);
                    }
                  }}
                />
                <div className="flex gap-1 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onSettingsChange({ ...settings, apiKey: tempApiKey });
                      setTempApiKey('');
                      setShowProviderConfig(false);
                    }}
                    className="text-xs bg-gray-800 border-gray-600 hover:bg-gray-700"
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTempApiKey('');
                      setShowProviderConfig(false);
                    }}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code Editor Panel */}
        <div className="w-1/2 flex flex-col bg-gray-900">
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Configure AI to start coding</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#1a1a1a] text-white" ref={resizeRef}>
      {/* Chat Panel */}
      <div 
        className="flex flex-col border-r border-gray-700"
        style={{ width: `${chatPanelWidth}%` }}
      >
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium">Visual AI Assistant</span>
            {isLoading && (
              <div className="flex items-center gap-1 text-xs text-purple-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing...
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCodeEditor(!showCodeEditor)}
              className="h-6 px-2 text-xs hover:bg-gray-800"
            >
              {showCodeEditor ? <MonitorOff className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
            </Button>
            
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Speed:</span>
              <select 
                value={replaySpeed}
                onChange={(e) => setReplaySpeed(Number(e.target.value))}
                className="bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-xs"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map(renderMessage)}
            {streamingMessages.map(renderStreamingMessage)}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Enhanced Input Area */}
        <div className="border-t border-gray-700 p-3 bg-gray-900">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePlanAction}
                disabled={isLoading || !isConfigured}
                className="bg-purple-600/20 border-purple-500/30 hover:bg-purple-600/30 text-purple-300"
              >
                <Lightbulb className="w-3 h-3 mr-1" />
                Plan
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleActAction}
                disabled={isLoading || !isConfigured}
                className="bg-blue-600/20 border-blue-500/30 hover:bg-blue-600/30 text-blue-300"
              >
                <Play className="w-3 h-3 mr-1" />
                Act
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClearMessages}
                disabled={isLoading}
                className="bg-red-600/20 border-red-500/30 hover:bg-red-600/30 text-red-300"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to build something visually..."
                className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 resize-none"
                rows={3}
              />
              <Button
                type="submit"
                disabled={isLoading || !isConfigured || !input.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Enhanced Footer */}
        <div className="border-t border-gray-700 p-3 bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Auto-approve:</span>
              <div className="flex items-center gap-1">
                <input type="checkbox" className="w-3 h-3" defaultChecked />
                <span className="text-xs text-gray-400">All</span>
              </div>
              <div className="flex items-center gap-1">
                <input type="checkbox" className="w-3 h-3" defaultChecked />
                <span className="text-xs text-gray-400">Read</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{getCurrentProvider().name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProviderConfig(!showProviderConfig)}
                className="h-6 px-2 text-xs hover:bg-gray-800"
              >
                <Settings2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {showProviderConfig && getCurrentProvider().requiresApiKey && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <Input
                type="password"
                placeholder={`Enter ${getCurrentProvider().name} API Key`}
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="bg-gray-800 border-gray-600 text-sm mb-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSettingsChange({ ...settings, apiKey: tempApiKey });
                    setTempApiKey('');
                    setShowProviderConfig(false);
                  }
                }}
              />
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSettingsChange({ ...settings, apiKey: tempApiKey });
                    setTempApiKey('');
                    setShowProviderConfig(false);
                  }}
                  className="text-xs bg-gray-800 border-gray-600 hover:bg-gray-700"
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTempApiKey('');
                    setShowProviderConfig(false);
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        className="w-1 bg-gray-700 hover:bg-gray-600 cursor-col-resize flex items-center justify-center"
        onMouseDown={() => setIsResizing(true)}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Code Editor Panel */}
      {showCodeEditor && (
        <div 
          className="flex flex-col bg-gray-900"
          style={{ width: `${100 - chatPanelWidth}%` }}
        >
          {/* Code Editor Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">Live Code Editor</span>
              {(generatedFiles.length > 0 || codeFiles.length > 0) && (
                <Badge variant="outline" className="text-xs">
                  {generatedFiles.length + codeFiles.length} files
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDevelopmentToolsToggle}
                className="h-6 px-2 text-xs hover:bg-gray-700"
              >
                <Settings className="w-3 h-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCodeFiles([])}
                className="h-6 px-2 text-xs hover:bg-gray-700"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Development Tools Panel */}
          {showDevelopmentTools && (
            <div className="border-b border-gray-700 bg-gray-900">
              <DevelopmentToolsEnhanced
                files={Object.fromEntries([
                  ...generatedFiles.map(file => [
                    file.name,
                    { name: file.name, content: file.content, language: file.type }
                  ]),
                  ...codeFiles.map(file => [
                    file.name,
                    { name: file.name, content: file.content, language: file.language }
                  ])
                ])}
                onFileSelect={(fileId) => {
                  const file = generatedFiles.find(f => f.name === fileId) || 
                              codeFiles.find(f => f.name === fileId);
                  if (file && onFileSelect) {
                    onFileSelect(fileId);
                  }
                }}
                onReplace={(fileId, line, column, oldText, newText) => {
                  if (onFileUpdate) {
                    // This is a simplified replace - in a real implementation you'd need more sophisticated text replacement
                    const file = generatedFiles.find(f => f.name === fileId) || 
                                codeFiles.find(f => f.name === fileId);
                    if (file) {
                      const lines = file.content.split('\n');
                      const targetLine = lines[line - 1];
                      if (targetLine) {
                        const newLine = targetLine.substring(0, column - 1) + newText + targetLine.substring(column - 1 + oldText.length);
                        lines[line - 1] = newLine;
                        const newContent = lines.join('\n');
                        onFileUpdate(fileId, newContent);
                      }
                    }
                  }
                }}
                onFixApply={(fileId, line, column, oldText, newText) => {
                  // Same as onReplace for now
                  if (onFileUpdate) {
                    const file = generatedFiles.find(f => f.name === fileId) || 
                                codeFiles.find(f => f.name === fileId);
                    if (file) {
                      const lines = file.content.split('\n');
                      const targetLine = lines[line - 1];
                      if (targetLine) {
                        const newLine = targetLine.substring(0, column - 1) + newText + targetLine.substring(column - 1 + oldText.length);
                        lines[line - 1] = newLine;
                        const newContent = lines.join('\n');
                        onFileUpdate(fileId, newContent);
                      }
                    }
                  }
                }}
                onSendToChat={(message) => {
                  // This would need to be passed down from the parent
                  console.log('Send to chat:', message);
                }}
                collaborationService={collaborationService}
              />
            </div>
          )}

          {/* File Tabs */}
          {(generatedFiles.length > 0 || codeFiles.length > 0) && (
            <div className="flex border-b border-gray-700 bg-gray-800 overflow-x-auto">
              {/* Generated Files */}
              {generatedFiles.map((file) => (
                <button
                  key={`gen-${file.name}`}
                  onClick={() => onFileSelect?.(file.name)}
                  className={`px-3 py-2 text-xs font-medium border-r border-gray-700 whitespace-nowrap ${
                    selectedFile === file.name
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {file.name}
                    <Badge variant="outline" className="text-xs px-1 py-0 ml-1">
                      {file.type}
                    </Badge>
                  </div>
                </button>
              ))}
              
              {/* Code Files */}
              {codeFiles.map((file, index) => (
                <button
                  key={`code-${index}`}
                  onClick={() => setActiveFileIndex(index)}
                  className={`px-3 py-2 text-xs font-medium border-r border-gray-700 whitespace-nowrap ${
                    index === activeFileIndex
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {file.name}
                    <Badge variant="outline" className="text-xs px-1 py-0 ml-1">
                      {file.language}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Code Editor Content */}
          <div className="flex-1">
            {generatedFiles.length === 0 && codeFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Code will appear here as AI generates it</p>
                  <p className="text-xs mt-2 opacity-60">Start chatting to see the magic happen!</p>
                </div>
              </div>
            ) : (
              <div className="h-full">
                {/* Show generated files first, then code files */}
                {generatedFiles.length > 0 ? (
                  <div className="h-full">
                    <MonacoEditorEnhanced
                      value={generatedFiles.find(f => f.name === selectedFile)?.content || ''}
                      language={generatedFiles.find(f => f.name === selectedFile)?.type || 'typescript'}
                      fileName={selectedFile || 'untitled'}
                      onChange={(newValue) => {
                        if (selectedFile && onFileUpdate) {
                          onFileUpdate(selectedFile, newValue);
                        }
                      }}
                      onSave={() => {
                        // Handle save
                        console.log('Save triggered');
                      }}
                      onRun={() => {
                        // Handle run
                        console.log('Run triggered');
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-full">
                    <MonacoEditorEnhanced
                      value={codeFiles[activeFileIndex]?.content || ''}
                      language={codeFiles[activeFileIndex]?.language || 'typescript'}
                      fileName={codeFiles[activeFileIndex]?.name || 'untitled'}
                      onChange={(newValue) => {
                        updateCodeFile(activeFileIndex, newValue);
                      }}
                      onSave={() => {
                        // Handle save
                        console.log('Save triggered');
                      }}
                      onRun={() => {
                        // Handle run
                        console.log('Run triggered');
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced MessageContent component with visual code rendering
function MessageContent({ content, onCopy, copiedCode }: { 
  content: string; 
  onCopy: (text: string, id: string) => void;
  copiedCode: string | null;
}) {
  // Extract code blocks for visual rendering
  const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
  const textParts = content.split(/```[\s\S]*?```/);
  
  return (
    <div className="space-y-3">
      {textParts.map((text, index) => (
        <div key={index}>
          {text && (
            <div className="whitespace-pre-wrap text-sm">
              {text}
            </div>
          )}
          {codeBlocks[index] && (
            <div className="relative group">
              <div className="flex items-center justify-between p-2 bg-gray-900 border border-gray-700 rounded-t">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400">Code Block</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(codeBlocks[index], `code-${index}`)}
                  className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copiedCode === `code-${index}` ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <div className="bg-gray-900 p-3 rounded-b text-sm font-mono overflow-x-auto">
                <pre className="text-green-300">
                  <code>{codeBlocks[index].replace(/```[\w]*\n?/, '').replace(/```$/, '')}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 