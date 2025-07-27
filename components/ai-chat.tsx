import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AIMessage } from '@/lib/ai-config';
import { Send, Trash2, Copy, Check, Bot, User, Loader2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AIChatProps {
  messages: AIMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onClearMessages: () => void;
  isConfigured: boolean;
}

export function AIChat({ messages, isLoading, onSendMessage, onClearMessages, isConfigured }: AIChatProps) {
  const [input, setInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="w-4 h-4 text-blue-600" />
          </div>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
          <div className={`rounded-lg px-4 py-3 ${
            isUser 
              ? 'bg-blue-600 text-white ml-auto' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            <MessageContent content={message.content} onCopy={copyToClipboard} copiedCode={copiedCode} />
          </div>
          
          <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span>{message.timestamp.toLocaleTimeString()}</span>
            {message.tokens && (
              <Badge variant="outline" className="text-xs">
                {message.tokens} tokens
              </Badge>
            )}
          </div>
        </div>
        
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
            <User className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>
    );
  };

  const quickPrompts = [
    "Help me create a responsive navigation bar",
    "Add a contact form to my PWA",
    "Create a dark mode toggle",
    "Optimize my PWA for offline use",
    "Add push notifications",
    "Create a loading spinner component"
  ];

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Bot className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant Not Configured</h3>
        <p className="text-gray-600 mb-4">
          Please configure your AI provider in the settings to start chatting with your coding assistant.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold">AI Coding Assistant</h2>
          <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>
        </div>
        
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={onClearMessages}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to your AI Coding Assistant!
              </h3>
              <p className="text-gray-600 mb-6">
                I'm here to help you build amazing PWAs. Ask me anything about HTML, CSS, JavaScript, or PWA features.
              </p>
              
              <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                <p className="text-sm font-medium text-gray-700 mb-2">Try asking:</p>
                {quickPrompts.slice(0, 3).map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto py-2 px-3"
                    onClick={() => setInput(prompt)}
                  >
                    "{prompt}"
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about PWA development..."
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading} className="self-end">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {quickPrompts.slice(3).map((prompt, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => setInput(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
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
            <div key={index} className="whitespace-pre-wrap">
              {part.content}
            </div>
          );
        } else {
          return (
            <div key={index} className="relative">
              <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 rounded-t-md">
                <span className="text-sm font-mono">{part.language}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
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
