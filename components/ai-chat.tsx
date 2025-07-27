import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { AIMessage, AI_PROVIDERS, AISettings } from '@/lib/ai-config';
import { Send, Trash2, Copy, Check, Bot, User, Loader2, ChevronDown, Settings2, Zap, Target } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AIChatProps {
  messages: AIMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onClearMessages: () => void;
  isConfigured: boolean;
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
}

export function AIChat({ messages, isLoading, onSendMessage, onClearMessages, isConfigured, settings, onSettingsChange }: AIChatProps) {
  const [input, setInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showProviderConfig, setShowProviderConfig] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handlePlanAction = () => {
    if (!input.trim() || isLoading || !isConfigured) return;
    const planMessage = `Plan: ${input.trim()}`;
    setInput('');
    onSendMessage(planMessage);
  };

  const handleActAction = () => {
    if (!input.trim() || isLoading || !isConfigured) return;
    const actMessage = `Act: ${input.trim()}`;
    setInput('');
    onSendMessage(actMessage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isConfigured) return;

    const message = input.trim();
    setInput('');
    
    try {
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
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const renderMessage = (message: AIMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <img 
              src="/hexkexlogo.png" 
              alt="Hex & Kex" 
              className="w-8 h-8 object-contain"
            />
          </div>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
          <div className={`rounded-lg px-4 py-3 ${
            isUser 
              ? 'bg-blue-600 text-white ml-auto' 
              : 'bg-gray-800 text-white'
          }`}>
            <MessageContent content={message.content} onCopy={copyToClipboard} copiedCode={copiedCode} />
          </div>
          
          <div className={`flex items-center gap-2 mt-1 text-xs text-gray-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span>{message.timestamp.toLocaleTimeString()}</span>
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
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] text-white">
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
              <span className="max-w-24 truncate">{settings.model}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
            
            {showModelDropdown && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50">
                <div className="p-2 border-b border-gray-600">
                  <div className="text-xs text-gray-400 mb-2">Provider</div>
                  <select 
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                    value={settings.provider}
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
                          settings.model === model ? 'bg-gray-700 text-blue-400' : ''
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
          
          {messages.length > 0 && (
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
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <img 
                  src="/hexkexlogo.png" 
                  alt="Hex & Kex" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              <h3 className="text-lg font-medium mb-2">
                Hex & Kex - One step at a time
              </h3>
              <p className="text-gray-400 text-sm">
                Transform your ideas into powerful web applications with precision and style.
              </p>
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <img 
                      src="/hexkexlogo.png" 
                      alt="Hex & Kex" 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div className="bg-gray-800 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-gray-300">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input with Plan/Act buttons */}
      <div className="border-t border-gray-700 p-3">
        <form onSubmit={handleSubmit} encType="application/x-www-form-urlencoded" className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your task here..."
            className="w-full bg-gray-800 border-gray-600 text-white placeholder-gray-400 resize-none min-h-[60px] max-h-32"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>Type @ for context, / for slash commands</span>
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePlanAction}
                disabled={!input.trim() || isLoading}
                className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-xs"
              >
                <Target className="w-3 h-3 mr-1" />
                Plan
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleActAction}
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                <Zap className="w-3 h-3 mr-1" />
                Act
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* BYOK Footer */}
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
  );
}

// Component to render message content with syntax highlighting
function MessageContent({ content, onCopy, copiedCode }: { 
  content: string; 
  onCopy: (text: string, id: string) => void;
  copiedCode: string | null;
}) {
  // Parse code blocks from content
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      });
    }

    // Add code block
    parts.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trim(),
      id: `code-${match.index}`
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex)
    });
  }

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <div key={index} className="whitespace-pre-wrap text-sm">
              {part.content}
            </div>
          );
        } else {
          return (
            <div key={index} className="relative">
              <div className="flex items-center justify-between bg-gray-900 text-gray-200 px-3 py-2 rounded-t-md">
                <span className="text-xs font-mono">{part.language}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                  onClick={() => onCopy(part.content, part.id || `code-${index}`)}
                >
                  {copiedCode === (part.id || `code-${index}`) ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <SyntaxHighlighter
                language={part.language}
                style={oneDark}
                customStyle={{
                  margin: 0,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  fontSize: '12px',
                }}
              >
                {part.content}
              </SyntaxHighlighter>
            </div>
          );
        }
      })}
    </div>
  );
}
