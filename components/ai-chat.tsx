import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { AIMessage, AI_PROVIDERS, AISettings } from '@/lib/ai-config';
import { Send, Trash2, User, Loader2, ChevronDown, Settings2, Target, Wand2 } from 'lucide-react';
import PromptOptimizerComponent from './prompt-optimizer';
import LiveAIResponse from './live-ai-response';

// Import OCR utility (Node.js require for demo; use dynamic import or API in production)
// @ts-ignore
const { ocrText } = typeof window === 'undefined' ? require('../ocr-util.js') : { ocrText: null };

interface AIChatProps {
  messages: AIMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onClearMessages: () => void;
  isConfigured: boolean;
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  streamedMessage?: string;
  onCodeBlocks?: (blocks: { code: string; lang?: string; messageId?: string }[]) => void;
  onCodeGenerated?: (filename: string, content: string, language: string) => void;
  personality?: 'rabbit' | 'assistant'; // Optional, for visual mode
  isStreaming?: boolean;
}

export function AIChat({
  messages,
  isLoading,
  onSendMessage,
  onClearMessages,
  isConfigured,
  settings,
  onSettingsChange,
  streamedMessage,
  onCodeBlocks,
  onCodeGenerated,
  personality,
  isStreaming
}: AIChatProps) {
  const [input, setInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<{ [key: string]: boolean }>({});
  const [codeTheme, setCodeTheme] = useState<'dark' | 'light'>('dark');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showProviderConfig, setShowProviderConfig] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showPromptOptimizer, setShowPromptOptimizer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Handle OCR
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setOcrLoading(true);
    try {
      const fileUrl = URL.createObjectURL(file);
      
      if (typeof window !== 'undefined' && ocrText) {
        // Browser context, use dynamic import
        const { ocrText: browserOcrText } = await import('../ocr-util.js');
        const text = await browserOcrText(fileUrl);
        setOcrResult(text);
        setInput(prev => prev + (prev ? '\n' : '') + text);
      } else {
        // Server context or fallback
        console.warn('OCR not available in this context');
      }
      
      URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to extract text from image');
    } finally {
      setOcrLoading(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Auto-scroll logic
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const nearBottom = distanceFromBottom < 100;
      setIsNearBottom(nearBottom);
      setShowScrollButton(!nearBottom && (messages?.length || 0) > 0);
    }
  };

  // Auto-scroll when new messages arrive if user is near bottom
  useEffect(() => {
    if (isNearBottom && ((messages?.length || 0) > 0 || streamedMessage)) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, streamedMessage, isNearBottom]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    setOcrResult(null);
    await onSendMessage(message);
  };

  const getCurrentProvider = () => {
    return AI_PROVIDERS.find(p => p.id === settings?.provider) || AI_PROVIDERS[0];
  };

  const handleProviderSelect = (providerId: string) => {
    const provider = AI_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      onSettingsChange({
        ...settings,
        provider: providerId,
        model: provider.models[0] || 'gpt-3.5-turbo'
      });
      setShowProviderConfig(provider.requiresApiKey && !settings?.apiKey);
    }
  };

  const handleModelSelect = (model: string) => {
    onSettingsChange({ ...settings, model });
    setShowModelDropdown(false);
  };

  const handleOptimizedPrompt = (optimizedPrompt: string) => {
    setInput(optimizedPrompt);
    setShowPromptOptimizer(false);
    // Auto-focus the textarea after setting the optimized prompt
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openInPlayground = (code: string, lang: string | undefined) => {
    let url = '';
    if (lang === 'js' || lang === 'javascript' || lang === 'ts' || lang === 'typescript') {
      url = `https://codesandbox.io/s/new?file=/App.${lang === 'ts' || lang === 'typescript' ? 'tsx' : 'js'}&initialpath=%2F&code=${encodeURIComponent(code)}`;
    } else if (lang === 'python' || lang === 'py') {
      url = `https://replit.com/languages/python3?code=${encodeURIComponent(code)}`;
    } else {
      url = `https://carbon.now.sh/?code=${encodeURIComponent(code)}`;
    }
    window.open(url, '_blank');
  };

  const shareCodeLink = async (code: string) => {
    await copyToClipboard(code, 'share');
    alert('Code copied to clipboard! Paste it anywhere to share.');
  };

  // Collect code blocks for all messages and send to parent if callback provided
  useEffect(() => {
    if (!onCodeBlocks) return;
    const allBlocks: { code: string; lang?: string; messageId?: string }[] = [];
    messages.forEach((message) => {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let match;
      while ((match = codeBlockRegex.exec(message.content)) !== null) {
        allBlocks.push({ code: match[2], lang: match[1], messageId: message.id });
      }
    });
    onCodeBlocks(allBlocks);
  }, [messages, onCodeBlocks]);

  const renderMessage = (message: AIMessage, isStreamed = false) => {
    const isUser = message.role === 'user';
    const isRabbit = personality === 'rabbit' || settings?.personality === 'rabbit';

    // For assistant messages, use LiveAIResponse component
    if (!isUser) {
      return (
        <div key={message.id || (isStreamed ? 'streamed' : undefined)} className="mb-4">
          <LiveAIResponse
            response={message.content}
            onCodeGenerated={onCodeGenerated}
            className="w-full"
          />
        </div>
      );
    }

    // For user messages, use the original rendering
    return (
      <div
        key={message.id || (isStreamed ? 'streamed' : undefined)}
        className={`flex gap-3 justify-end`}
      >
        <div className="max-w-[80%] flex flex-col gap-2 items-end">
          {/* Chat bubble for user message */}
          <div className={`rounded-lg px-4 py-3 ${
            isRabbit
              ? 'bg-gradient-to-r from-blue-400 to-purple-500 text-white font-medium'
              : 'bg-blue-600 text-white'
          }`}>
            <div className="whitespace-pre-wrap text-sm">{message.content}</div>
            {isStreamed && (
              <span className="animate-pulse text-green-400 ml-1">|</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 justify-end">
            <span>{message.timestamp ? message.timestamp.toLocaleTimeString() : ''}</span>
            {message.tokens && (
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
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

  // Return early if not configured
  if (!isConfigured) {
    return (
      <div className="flex flex-col h-full bg-[#1a1a1a] text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <img
              src="/whitebunnylogo.png"
              alt="White Rabbit"
              className="w-8 h-8 object-contain"
            />
            <span className="text-sm font-medium">What can I do for you?</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <img
                src="/whitebunnylogo.png"
                alt="White Rabbit"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Assistant Not Configured</h3>
            <p className="text-gray-400 mb-4">
              Configure your AI provider below to start chatting.
            </p>
          </div>
        </div>


      </div>
    );
  }

  // Determine if Rabbit mode is active
  const isRabbit = personality === 'rabbit' || settings?.personality === 'rabbit';

  return (
    <div
      className={`flex flex-col h-full bg-gray-800 text-white relative ${isRabbit ? 'rabbit-active' : ''}`}
      style={isRabbit ? {
        boxShadow: '0 0 0 4px #60a5fa, 0 0 24px 4px #60a5fa55',
        border: '2px solid #60a5fa',
        transition: 'box-shadow 0.3s, border 0.3s',
        zIndex: 10
      } : {}}
    >
      {/* White Rabbit Banner */}
      {isRabbit && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-b-xl bg-blue-400 text-white font-bold text-sm flex items-center gap-2 animate-pulse shadow-lg border-b-2 border-blue-500" style={{letterSpacing:'0.05em'}}>
          <span className="text-lg">🐰</span> WHITE RABBIT MODE <span className="text-lg">🐰</span>
        </div>
      )}
      
      {/* Simplified Header with Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">AI Assistant</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProviderConfig(!showProviderConfig)}
            className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-xs gap-1"
            title="AI Settings"
          >
            <Settings2 className="w-3 h-3" />
            <span className="hidden sm:inline">Settings</span>
          </Button>

          {/* Model Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-xs gap-1"
            >
              <span className="max-w-24 truncate">{settings?.model || 'gpt-3.5-turbo'}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
            
            {showModelDropdown && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50">
                <div className="p-2 border-b border-gray-600">
                  <div className="text-xs text-gray-400 mb-2">Provider</div>
                  <select
                    id="ai-provider-select"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                    value={settings?.provider || 'openai'}
                    onChange={(e) => handleProviderSelect(e.target.value)}
                    aria-label="Select AI provider"
                  >
                    {AI_PROVIDERS.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="p-2">
                  <div className="text-xs text-gray-400 mb-2">Model</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {getCurrentProvider().models.map(model => (
                      <button
                        key={model}
                        onClick={() => handleModelSelect(model)}
                        className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-700 ${
                          settings?.model === model ? 'bg-gray-700 text-blue-400' : ''
                        }`}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {(messages?.length || 0) > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearMessages}
              className="bg-gray-800 border-gray-600 hover:bg-gray-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showProviderConfig && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-600 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">AI Settings</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProviderConfig(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  AI Provider
                </label>
                <select
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  value={settings?.provider || 'openai'}
                  onChange={(e) => handleProviderSelect(e.target.value)}
                >
                  {AI_PROVIDERS.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Choose your preferred AI provider. BYOK (Bring Your Own Key) required.
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Model
                </label>
                <select
                  id="ai-model-select"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  value={settings?.model || getCurrentProvider().models[0]}
                  onChange={(e) => handleModelSelect(e.target.value)}
                  aria-label="Select AI model"
                >
                  {getCurrentProvider().models.map(model => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Select the specific model to use with {getCurrentProvider().name}.
                </p>
              </div>

              {/* API Key */}
              {getCurrentProvider().requiresApiKey && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    API Key
                  </label>
                  <Input
                    type="password"
                    placeholder={`Enter your ${getCurrentProvider().name} API Key`}
                    value={tempApiKey || settings?.apiKey || ''}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Your API key is stored locally and never sent to our servers.
                  </p>
                  {settings?.apiKey && (
                    <p className="text-xs text-green-400 mt-1">
                      ✓ API key configured
                    </p>
                  )}
                </div>
              )}

              {/* Save Button */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    if (tempApiKey) {
                      onSettingsChange({ ...settings, apiKey: tempApiKey });
                      setTempApiKey('');
                    }
                    setShowProviderConfig(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Settings
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTempApiKey('');
                    setShowProviderConfig(false);
                  }}
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 bg-gray-850">
        <div
          className="p-6 space-y-8 h-full w-full"
          ref={scrollAreaRef}
          onScroll={handleScroll}
          style={{ overflow: 'auto' }}
        >
          {(messages?.length || 0) === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <img
                  src="/whitebunnylogo.png"
                  alt="White Rabbit"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <h3 className="text-lg font-medium mb-2">
                How can I help you today?
              </h3>
              <p className="text-gray-400 text-sm">
                Ask me anything about coding, debugging, or project ideas.
              </p>
            </div>
          ) : (
            <>
              {messages.map(message => renderMessage(message))}
              {streamedMessage && renderMessage({
                id: 'streaming',
                role: 'assistant',
                content: streamedMessage,
                timestamp: new Date()
              }, true)}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          size="sm"
          className="absolute bottom-20 right-4 z-10 bg-gray-700 hover:bg-gray-600 border border-gray-600"
        >
          Scroll to latest
        </Button>
      )}

      {/* Input */}
      <div className="border-t border-gray-600 p-4 bg-gray-750">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              id="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask me anything... (Shift+Enter for new line)"
              className="min-h-[60px] max-h-[140px] resize-none bg-gray-700 border-gray-500 text-white placeholder-gray-400 pr-24 text-sm leading-relaxed"
              disabled={isLoading}
              aria-label="AI chat message input"
            />
            
            {/* Action Buttons */}
            <div className="absolute right-2 top-2 flex gap-1">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />

              {/* Prompt Optimizer Button */}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowPromptOptimizer(!showPromptOptimizer)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-purple-400"
                title="Optimize Prompt"
              >
                <Wand2 className="w-3 h-3" />
              </Button>

              {/* OCR Button */}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                title="Image to Text (OCR)"
              >
                {ocrLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Target className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        
        {ocrResult && (
          <div className="mt-2 p-2 bg-gray-800 rounded text-sm">
            <div className="text-gray-400 text-xs mb-1">OCR Result:</div>
            <div className="text-gray-200">{ocrResult}</div>
          </div>
        )}

        {/* Prompt Optimizer */}
        {showPromptOptimizer && (
          <div className="mt-2">
            <PromptOptimizerComponent
              onOptimizedPrompt={handleOptimizedPrompt}
              className="bg-gray-800 border-gray-600"
            />
          </div>
        )}
      </div>
    </div>
  );
}
