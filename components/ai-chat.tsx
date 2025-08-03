import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { AIMessage, AI_PROVIDERS, AISettings } from '@/lib/ai-config';
import { PERSONALITIES } from '@/lib/personality-system';
import { Send, Trash2, Copy, Check, Bot, User, Loader2, ChevronDown, Settings2, Zap, Target, Wand2 } from 'lucide-react';
import PromptOptimizerComponent from './prompt-optimizer';

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
  personality?: 'hex' | 'kex'; // Optional, for visual mode
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
    const isKex = personality === 'kex' || settings?.personality === 'kex';
    
    // Parse content for code blocks and text
    const parts: Array<{ type: 'text' | 'code'; value: string; lang?: string }> = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: message.content.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'code', value: match[2], lang: match[1] });
      lastIndex = codeBlockRegex.lastIndex;
    }
    if (lastIndex < message.content.length) {
      parts.push({ type: 'text', value: message.content.slice(lastIndex) });
    }

    // Only show text parts in chat, code blocks are handled by CodeEditor
    const textParts = parts.filter(p => p.type === 'text' && p.value.trim() !== '');

    return (
      <div 
        key={message.id || (isStreamed ? 'streamed' : undefined)} 
        className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
        style={isKex && !isUser ? {
          filter: 'drop-shadow(0 0 8px #00ffe155)',
          background: 'linear-gradient(135deg, rgba(0, 255, 225, 0.05) 0%, rgba(0, 212, 170, 0.05) 100%)',
          borderRadius: '12px',
          padding: '8px'
        } : {}}
      >
        {!isUser && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <img 
              src="/hexkexlogo.png" 
              alt="Hex & Kex" 
              className="w-8 h-8 object-contain"
            />
          </div>
        )}
        <div className={`max-w-[80%] flex flex-col gap-2 ${isUser ? 'order-first items-end' : 'items-start'}`}> 
          {/* Chat bubble for text only */}
          {textParts.length > 0 && (
            <div className={`rounded-lg px-4 py-3 ${
              isUser 
                ? isKex
                  ? 'bg-gradient-to-r from-[#00ffe1] to-[#00d4aa] text-black font-medium'
                  : 'bg-blue-600 text-white ml-auto'
                : 'bg-gray-800 text-white'
            }`}>
              {textParts.map((part, i) => (
                <div key={i} className="whitespace-pre-wrap text-sm text-gray-200">{part.value}</div>
              ))}
              {isStreamed && (
                <span className="animate-pulse text-green-400 ml-1">|</span>
              )}
            </div>
          )}
          {/* Code blocks are displayed in the AI Code Space panel, not inline */}
          <div className={`flex items-center gap-2 mt-1 text-xs text-gray-400 ${isUser ? 'justify-end' : 'justify-start'}`}> 
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
              src="/hexkexlogo.png" 
              alt="Hex & Kex" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-sm font-medium">What can I do for you?</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <img 
                src="/hexkexlogo.png" 
                alt="Hex & Kex" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Assistant Not Configured</h3>
            <p className="text-gray-400 mb-4">
              Configure your AI provider below to start chatting.
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
              value={settings?.provider || 'openai'}
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
    );
  }

  // Determine if KEX mode is active
  const isKex = personality === 'kex' || settings?.personality === 'kex';

  return (
    <div
      className={`flex flex-col h-full bg-[#1a1a1a] text-white relative ${isKex ? 'kex-active' : ''}`}
      style={isKex ? {
        boxShadow: '0 0 0 4px #00ffe1, 0 0 24px 4px #00ffe155',
        border: '2px solid #00ffe1',
        transition: 'box-shadow 0.3s, border 0.3s',
        zIndex: 10
      } : {}}
    >
      {/* KEX Banner */}
      {isKex && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-b-xl bg-[#00ffe1] text-black font-bold text-sm flex items-center gap-2 animate-pulse shadow-lg border-b-2 border-[#00d4aa]" style={{letterSpacing:'0.05em'}}>
          <span className="text-lg">⚡</span> KEX MODE ACTIVE <span className="text-lg">⚡</span>
        </div>
      )}
      
      {/* Header with Model Dropdown */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <img 
            src="/hexkexlogo.png" 
            alt="Hex & Kex" 
            className="w-8 h-8 object-contain"
          />
          <span className="text-sm font-medium">What can I do for you?</span>
        </div>
        
        <div className="flex items-center gap-2">
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
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                    value={settings?.provider || 'openai'}
                    onChange={(e) => handleProviderSelect(e.target.value)}
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

      {/* Messages */}
      <ScrollArea className="flex-1" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <div
          className="p-4 space-y-6 h-full w-full"
          ref={scrollAreaRef}
          onScroll={handleScroll}
          style={{ overflow: 'auto' }}
        >
          {(messages?.length || 0) === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <img 
                  src="/hexkexlogo.png" 
                  alt="Hex & Kex" 
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
      <div className="border-t border-gray-700 p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask me anything..."
              className="min-h-[40px] max-h-[120px] resize-none bg-gray-800 border-gray-600 pr-20"
              disabled={isLoading}
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
