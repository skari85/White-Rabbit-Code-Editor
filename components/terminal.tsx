"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, X, Minimize2, Maximize2, Play, Square, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TerminalCommand, TerminalSession } from '@/hooks/use-terminal';

interface TerminalComponentProps {
  session: TerminalSession;
  onExecuteCommand: (command: string) => Promise<void>;
  onClose?: () => void;
  onMinimize?: () => void;
  onOpenFile?: (filePath: string, lineNumber?: number, columnNumber?: number) => void;
  className?: string;
}

export function TerminalComponent({
  session,
  onExecuteCommand,
  onClose,
  onMinimize,
  onOpenFile,
  className = ""
}: TerminalComponentProps) {
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [collapsedCommands, setCollapsedCommands] = useState<Set<string>>(new Set());
  const [hoveredError, setHoveredError] = useState<string | null>(null);
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

  // Handle file path clicks in stack traces
  const handleFilePathClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const filePath = target.getAttribute('data-file-path');
    const lineNumber = target.getAttribute('data-line');
    const columnNumber = target.getAttribute('data-column');

    if (filePath && onOpenFile) {
      onOpenFile(
        filePath,
        lineNumber ? parseInt(lineNumber) : undefined,
        columnNumber ? parseInt(columnNumber) : undefined
      );
    }
  };

  // Toggle command output collapse
  const toggleCommandCollapse = (commandId: string) => {
    setCollapsedCommands(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commandId)) {
        newSet.delete(commandId);
      } else {
        newSet.add(commandId);
      }
      return newSet;
    });
  };

  // Check if output should be collapsible (more than 10 lines)
  const isOutputCollapsible = (output: string): boolean => {
    return output.split('\n').length > 10;
  };

  // Get collapsed output preview
  const getCollapsedPreview = (output: string): string => {
    const lines = output.split('\n');
    const hiddenCount = lines.length - 3;
    return `${lines.slice(0, 3).join('\n')}\n... ${hiddenCount} lines hidden - click to expand`;
  };

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

  // Error explanation system
  const getErrorExplanation = (output: string): { title: string; explanation: string; suggestions: string[] } | null => {
    const lowerOutput = output.toLowerCase();

    if (lowerOutput.includes('module not found') || lowerOutput.includes('cannot resolve module')) {
      return {
        title: 'Module Not Found Error',
        explanation: 'The application is trying to import a module that cannot be found.',
        suggestions: [
          'Run "npm install" to install missing dependencies',
          'Check if the module name is spelled correctly',
          'Verify the file path is correct',
          'Check if the module is listed in package.json'
        ]
      };
    }

    if (lowerOutput.includes('syntaxerror') || lowerOutput.includes('unexpected token')) {
      return {
        title: 'Syntax Error',
        explanation: 'There is a syntax error in your code that prevents it from being parsed correctly.',
        suggestions: [
          'Check for missing brackets, parentheses, or semicolons',
          'Verify proper indentation and formatting',
          'Look for unclosed strings or comments',
          'Use a code formatter to identify issues'
        ]
      };
    }

    if (lowerOutput.includes('port') && lowerOutput.includes('already in use')) {
      return {
        title: 'Port Already in Use',
        explanation: 'The port you are trying to use is already occupied by another process.',
        suggestions: [
          'Use a different port number',
          'Kill the process using the port',
          'Check what is running on the port with "lsof -i :PORT"',
          'Restart your development server'
        ]
      };
    }

    if (lowerOutput.includes('permission denied') || lowerOutput.includes('eacces')) {
      return {
        title: 'Permission Denied',
        explanation: 'You do not have the necessary permissions to perform this operation.',
        suggestions: [
          'Try running the command with sudo (use with caution)',
          'Check file and directory permissions',
          'Ensure you own the files you are trying to modify',
          'Use npm config to set proper permissions'
        ]
      };
    }

    return null;
  };

  // Enhanced output formatting with syntax highlighting
  const formatOutput = (output: string) => {
    let formattedOutput = output;

    // Apply syntax highlighting patterns
    formattedOutput = applySyntaxHighlighting(formattedOutput);

    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    formattedOutput = formattedOutput.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">${url}</a>`;
    });

    return formattedOutput;
  };

  // Syntax highlighting function
  const applySyntaxHighlighting = (text: string): string => {
    let highlighted = text;

    // Error patterns (red text with background)
    const errorPatterns = [
      /\b(error|Error|ERROR|failed|Failed|FAILED|exception|Exception|EXCEPTION)\b/g,
      /\b(npm ERR!|yarn error|pnpm ERR!)\b/g,
      /\b(SyntaxError|TypeError|ReferenceError|RangeError|EvalError|URIError)\b/g,
      /\b(ModuleNotFoundError|ImportError|AttributeError|NameError)\b/g,
      /\b(fatal|Fatal|FATAL)\b/g
    ];

    errorPatterns.forEach(pattern => {
      highlighted = highlighted.replace(pattern, (match) =>
        `<span class="text-red-400 bg-red-900/20 px-1 rounded font-semibold">${match}</span>`
      );
    });

    // Warning patterns (yellow/amber text)
    const warningPatterns = [
      /\b(warning|Warning|WARNING|warn|Warn|WARN)\b/g,
      /\b(deprecated|Deprecated|DEPRECATED)\b/g,
      /\b(npm WARN|yarn warn|pnpm WARN)\b/g
    ];

    warningPatterns.forEach(pattern => {
      highlighted = highlighted.replace(pattern, (match) =>
        `<span class="text-amber-400 bg-amber-900/20 px-1 rounded font-medium">${match}</span>`
      );
    });

    // Success patterns (green text)
    const successPatterns = [
      /\b(success|Success|SUCCESS|completed|Completed|COMPLETED|done|Done|DONE)\b/g,
      /\b(✓|✔|✅|✨|🎉)\s*[^<\n]*/g,
      /\b(installed|built|compiled|deployed|started)\b/g
    ];

    successPatterns.forEach(pattern => {
      highlighted = highlighted.replace(pattern, (match) =>
        `<span class="text-green-400 font-medium">${match}</span>`
      );
    });

    // Info patterns (blue/cyan text)
    const infoPatterns = [
      /\b(info|Info|INFO|note|Note|NOTE)\b/g,
      /\b(Local:|Network:|Port:|URL:)\s*[^\s<\n]+/g,
      /\b(npm info|yarn info|pnpm info)\b/g
    ];

    infoPatterns.forEach(pattern => {
      highlighted = highlighted.replace(pattern, (match) =>
        `<span class="text-cyan-400 font-medium">${match}</span>`
      );
    });

    // File paths and line numbers (for stack traces)
    const filePathPattern = /([a-zA-Z0-9_\-./\\]+\.(js|ts|jsx|tsx|py|java|cpp|c|php|rb|go|rs|swift|kt|scala|clj|hs|ml|fs|vb|cs|dart|lua|perl|sh|bash|zsh|fish|ps1|bat|cmd|html|css|scss|sass|less|styl|vue|svelte|astro|md|mdx|json|yaml|yml|toml|ini|cfg|conf|xml|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot)):(\d+)(?::(\d+))?/g;

    highlighted = highlighted.replace(filePathPattern, (match, filePath, extension, lineNumber, columnNumber) => {
      const clickableClass = "text-blue-300 hover:text-blue-200 underline cursor-pointer hover:bg-blue-900/20 px-1 rounded transition-colors";
      return `<span class="${clickableClass}" data-file-path="${filePath}" data-line="${lineNumber}" data-column="${columnNumber || ''}">${match}</span>`;
    });

    // Highlight numbers and versions
    highlighted = highlighted.replace(/\b(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?)\b/g,
      '<span class="text-purple-400">$1</span>'
    );

    // Highlight timestamps
    highlighted = highlighted.replace(/\b(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?)\b/g,
      '<span class="text-gray-400">$1</span>'
    );

    return highlighted;
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
                  <div className="pl-4">
                    {/* Collapsible toggle for long outputs */}
                    {isOutputCollapsible(command.output) && (
                      <button
                        onClick={() => toggleCommandCollapse(command.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 mb-1 flex items-center gap-1"
                      >
                        {collapsedCommands.has(command.id) ? '▶' : '▼'}
                        {collapsedCommands.has(command.id) ? 'Expand output' : 'Collapse output'}
                      </button>
                    )}

                    {/* Output content with error tooltip */}
                    <div
                      className={`whitespace-pre-wrap text-xs relative ${
                        command.status === 'error' ? 'text-red-300' : 'text-gray-300'
                      }`}
                      onClick={handleFilePathClick}
                      onMouseEnter={() => {
                        if (command.status === 'error') {
                          setHoveredError(command.id);
                        }
                      }}
                      onMouseLeave={() => setHoveredError(null)}
                      dangerouslySetInnerHTML={{
                        __html: formatOutput(
                          collapsedCommands.has(command.id) && isOutputCollapsible(command.output)
                            ? getCollapsedPreview(command.output)
                            : command.output
                        )
                      }}
                    />

                    {/* Error explanation tooltip */}
                    {hoveredError === command.id && command.status === 'error' && (
                      (() => {
                        const errorInfo = getErrorExplanation(command.output);
                        return errorInfo ? (
                          <div className="absolute z-10 bg-gray-800 border border-gray-600 rounded-lg p-3 mt-2 max-w-md shadow-lg">
                            <h4 className="text-sm font-semibold text-red-400 mb-2">{errorInfo.title}</h4>
                            <p className="text-xs text-gray-300 mb-2">{errorInfo.explanation}</p>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-400">Suggestions:</p>
                              {errorInfo.suggestions.map((suggestion, index) => (
                                <div key={index} className="text-xs text-gray-300 flex items-start gap-1">
                                  <span className="text-green-400">•</span>
                                  <span>{suggestion}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()
                    )}
                  </div>
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
