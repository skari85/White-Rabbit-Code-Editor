"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, X, Minimize2, Maximize2, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TerminalCommand, TerminalSession } from '@/hooks/use-terminal';

interface TerminalComponentProps {
  session: TerminalSession;
  onExecuteCommand: (command: string) => Promise<void>;
  onClose?: () => void;
  onMinimize?: () => void;
  className?: string;
}

export function TerminalComponent({ 
  session, 
  onExecuteCommand, 
  onClose, 
  onMinimize,
  className = "" 
}: TerminalComponentProps) {
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new commands are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [session.commands]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isExecuting) return;

    const command = input.trim();
    setInput('');
    setIsExecuting(true);

    try {
      await onExecuteCommand(command);
    } catch (error) {
      console.error('Error executing command:', error);
    } finally {
      setIsExecuting(false);
      // Focus back to input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const getCommandStatusColor = (status: TerminalCommand['status']) => {
    switch (status) {
      case 'running':
        return 'text-yellow-400';
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatOutput = (output: string) => {
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return output.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">${url}</a>`;
    });
  };

  return (
    <div className={`bg-gray-900 text-gray-100 border border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-gray-800 px-3 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium">{session.name}</span>
          <span className="text-xs text-gray-400">
            {session.workingDirectory}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onMinimize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMinimize}
              className="w-6 h-6 p-0 hover:bg-gray-700"
            >
              <Minimize2 className="w-3 h-3" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-6 h-6 p-0 hover:bg-gray-700 hover:text-red-400"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex flex-col h-96">
        {/* Command History */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-3">
          <div className="space-y-2 font-mono text-sm">
            {session.commands.map((command) => (
              <div key={command.id} className="space-y-1">
                {/* Command Line */}
                <div className="flex items-center gap-2">
                  <span className="text-green-400">$</span>
                  <span className="text-gray-300">{command.command}</span>
                  <div className={`ml-auto ${getCommandStatusColor(command.status)}`}>
                    {command.status === 'running' && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                        <span className="text-xs">Running</span>
                      </div>
                    )}
                    {command.status === 'completed' && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <span className="text-xs">Done</span>
                      </div>
                    )}
                    {command.status === 'error' && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                        <span className="text-xs">Error</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Command Output */}
                {command.output && (
                  <div 
                    className={`pl-4 whitespace-pre-wrap text-xs ${
                      command.status === 'error' ? 'text-red-300' : 'text-gray-300'
                    }`}
                    dangerouslySetInnerHTML={{ 
                      __html: formatOutput(command.output) 
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Command Input */}
        <div className="border-t border-gray-700 p-3">
          <form onSubmit={handleSubmit} encType="application/x-www-form-urlencoded" className="flex items-center gap-2">
            <span className="text-green-400 font-mono">$</span>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter command..."
              disabled={isExecuting}
              className="flex-1 bg-transparent border-none focus:ring-0 focus:ring-offset-0 font-mono text-sm"
              autoComplete="off"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isExecuting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isExecuting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Quick actions component for common commands
export function TerminalQuickActions({ 
  onExecuteCommand 
}: { 
  onExecuteCommand: (command: string) => Promise<void> 
}) {
  const quickCommands = [
    { label: 'Install Dependencies', command: 'npm install', icon: '📦' },
    { label: 'Start Dev Server', command: 'npm run dev', icon: '🚀' },
    { label: 'Build Project', command: 'npm run build', icon: '🔨' },
    { label: 'Run Tests', command: 'npm test', icon: '🧪' },
    { label: 'List Files', command: 'ls -la', icon: '📂' },
    { label: 'Git Status', command: 'git status', icon: '📊' }
  ];

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-t">
      {quickCommands.map((cmd) => (
        <Button
          key={cmd.command}
          variant="outline"
          size="sm"
          onClick={() => onExecuteCommand(cmd.command)}
          className="text-xs"
        >
          <span className="mr-1">{cmd.icon}</span>
          {cmd.label}
        </Button>
      ))}
    </div>
  );
}
