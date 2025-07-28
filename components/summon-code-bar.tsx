"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Command, 
  Search, 
  Zap, 
  Code, 
  Bug, 
  RefreshCw, 
  FileText, 
  Wand2,
  ArrowRight,
  Clock,
  Star
} from 'lucide-react';
import { PersonalityMode } from '@/lib/personality-system';

export interface CodeCommand {
  id: string;
  command: string;
  description: string;
  category: 'build' | 'fix' | 'convert' | 'analyze' | 'generate' | 'refactor';
  icon: React.ReactNode;
  examples: string[];
  shortcut?: string;
  popularity?: number;
}

export const BUILT_IN_COMMANDS: CodeCommand[] = [
  {
    id: 'build',
    command: '/build',
    description: 'Build applications, components, or features',
    category: 'build',
    icon: <Wand2 className="w-4 h-4" />,
    examples: [
      '/build a Flask app with login screen',
      '/build a React todo component',
      '/build a REST API with authentication'
    ],
    popularity: 95
  },
  {
    id: 'fix',
    command: '/fix',
    description: 'Fix bugs, errors, or issues in code',
    category: 'fix',
    icon: <Bug className="w-4 h-4" />,
    examples: [
      '/fix the import bug in line 23',
      '/fix TypeScript errors in this file',
      '/fix the async/await issue'
    ],
    popularity: 88
  },
  {
    id: 'convert',
    command: '/convert',
    description: 'Convert code between formats or languages',
    category: 'convert',
    icon: <RefreshCw className="w-4 h-4" />,
    examples: [
      "/convert all 'var' to 'let'",
      '/convert this to TypeScript',
      '/convert CSS to Tailwind classes'
    ],
    popularity: 76
  },
  {
    id: 'analyze',
    command: '/analyze',
    description: 'Analyze code for issues, patterns, or improvements',
    category: 'analyze',
    icon: <Search className="w-4 h-4" />,
    examples: [
      '/analyze this function for performance',
      '/analyze security vulnerabilities',
      '/analyze code complexity'
    ],
    popularity: 65
  },
  {
    id: 'generate',
    command: '/generate',
    description: 'Generate code, tests, or documentation',
    category: 'generate',
    icon: <FileText className="w-4 h-4" />,
    examples: [
      '/generate unit tests for this component',
      '/generate API documentation',
      '/generate mock data'
    ],
    popularity: 82
  },
  {
    id: 'refactor',
    command: '/refactor',
    description: 'Refactor and improve existing code',
    category: 'refactor',
    icon: <Code className="w-4 h-4" />,
    examples: [
      '/refactor this function to be more readable',
      '/refactor to use modern React hooks',
      '/refactor for better performance'
    ],
    popularity: 71
  }
];

interface SummonCodeBarProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (command: string) => void;
  personality: PersonalityMode;
  recentCommands?: string[];
}

export function SummonCodeBar({ 
  isOpen, 
  onClose, 
  onExecuteCommand, 
  personality,
  recentCommands = []
}: SummonCodeBarProps) {
  const [input, setInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<CodeCommand[]>([]);
  const [showExamples, setShowExamples] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter commands based on input
  useEffect(() => {
    if (!input.trim()) {
      // Show popular commands when no input
      const popular = BUILT_IN_COMMANDS
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 6);
      setFilteredCommands(popular);
      setSelectedIndex(0);
      return;
    }

    const filtered = BUILT_IN_COMMANDS.filter(cmd => 
      cmd.command.toLowerCase().includes(input.toLowerCase()) ||
      cmd.description.toLowerCase().includes(input.toLowerCase()) ||
      cmd.examples.some(ex => ex.toLowerCase().includes(input.toLowerCase()))
    );

    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [input]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setInput('');
      setShowExamples(false);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            Math.min(prev + 1, filteredCommands.length - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (input.trim()) {
            executeCommand(input);
          } else if (filteredCommands[selectedIndex]) {
            const cmd = filteredCommands[selectedIndex];
            if (showExamples && cmd.examples.length > 0) {
              setInput(cmd.examples[0]);
              setShowExamples(false);
            } else {
              setInput(cmd.command + ' ');
              setShowExamples(true);
            }
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            const cmd = filteredCommands[selectedIndex];
            setInput(cmd.command + ' ');
            setShowExamples(true);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, input, selectedIndex, filteredCommands, showExamples]);

  const executeCommand = (command: string) => {
    onExecuteCommand(command);
    onClose();
    setInput('');
    setShowExamples(false);
  };

  const getCategoryColor = (category: CodeCommand['category']) => {
    switch (category) {
      case 'build': return 'bg-green-500';
      case 'fix': return 'bg-red-500';
      case 'convert': return 'bg-blue-500';
      case 'analyze': return 'bg-purple-500';
      case 'generate': return 'bg-yellow-500';
      case 'refactor': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getPersonalityPrompt = () => {
    return personality === 'hex' 
      ? 'Enter command for precise execution...'
      : 'What magical code shall we conjure? ✨';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]">
      <Card 
        ref={containerRef}
        className="w-full max-w-2xl mx-4 bg-gray-900 border-gray-700 shadow-2xl"
        style={{
          background: personality === 'hex' 
            ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
            : 'linear-gradient(135deg, #581c87 0%, #3730a3 100%)'
        }}
      >
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Command className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-white">
                {personality === 'hex' ? 'Command Executor' : 'Code Summoner'}
              </span>
            </div>
            <div className="flex-1" />
            <Badge variant="outline" className="text-xs">
              {personality.toUpperCase()}
            </Badge>
          </div>

          {/* Input */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getPersonalityPrompt()}
                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
              />
              {input && (
                <Button
                  onClick={() => executeCommand(input)}
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2 bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No commands found</p>
                <p className="text-sm mt-1">Try typing /build, /fix, or /convert</p>
              </div>
            ) : (
              <div className="p-2">
                {filteredCommands.map((cmd, index) => (
                  <div key={cmd.id}>
                    <div
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        index === selectedIndex 
                          ? 'bg-blue-600/20 border border-blue-500/50' 
                          : 'hover:bg-gray-800/50'
                      }`}
                      onClick={() => {
                        if (showExamples && cmd.examples.length > 0) {
                          setInput(cmd.examples[0]);
                          setShowExamples(false);
                        } else {
                          setInput(cmd.command + ' ');
                          setShowExamples(true);
                        }
                      }}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getCategoryColor(cmd.category)}`}>
                        {cmd.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{cmd.command}</span>
                          <Badge variant="outline" className="text-xs">
                            {cmd.category}
                          </Badge>
                          {cmd.popularity && cmd.popularity > 80 && (
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 truncate">{cmd.description}</p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {cmd.shortcut && (
                          <kbd className="px-1 py-0.5 bg-gray-700 rounded">{cmd.shortcut}</kbd>
                        )}
                        <span>Tab</span>
                      </div>
                    </div>

                    {/* Examples */}
                    {index === selectedIndex && showExamples && cmd.examples.length > 0 && (
                      <div className="ml-11 mt-2 space-y-1">
                        {cmd.examples.map((example, exIndex) => (
                          <div
                            key={exIndex}
                            className="flex items-center gap-2 p-2 bg-gray-800/30 rounded cursor-pointer hover:bg-gray-800/50 transition-colors"
                            onClick={() => executeCommand(example)}
                          >
                            <Zap className="w-3 h-3 text-blue-400" />
                            <span className="text-sm text-gray-300 font-mono">{example}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Commands */}
          {recentCommands.length > 0 && !input && (
            <div className="border-t border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Recent Commands</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentCommands.slice(0, 3).map((cmd, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => executeCommand(cmd)}
                    className="text-xs h-6 px-2 bg-gray-800 border-gray-600 hover:bg-gray-700"
                  >
                    {cmd.length > 30 ? cmd.substring(0, 30) + '...' : cmd}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-700 p-3 bg-gray-800/30">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-4">
                <span><kbd>↑↓</kbd> Navigate</span>
                <span><kbd>Tab</kbd> Expand</span>
                <span><kbd>Enter</kbd> Execute</span>
                <span><kbd>Esc</kbd> Close</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Powered by</span>
                <span className="text-blue-400 font-medium">
                  {personality === 'hex' ? 'HEX' : 'KEX'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for managing the summon code bar
export function useSummonCodeBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const executeCommand = (command: string) => {
    // Add to recent commands
    setRecentCommands(prev => {
      const filtered = prev.filter(cmd => cmd !== command);
      return [command, ...filtered].slice(0, 10); // Keep last 10
    });
    
    return command;
  };

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    recentCommands,
    open,
    close,
    executeCommand
  };
}

// Command parser utility
export class CommandParser {
  static parse(command: string): {
    action: string;
    target?: string;
    context?: string;
    parameters?: Record<string, string>;
  } {
    const trimmed = command.trim();
    
    // Handle slash commands
    if (trimmed.startsWith('/')) {
      const parts = trimmed.slice(1).split(' ');
      const action = parts[0];
      const rest = parts.slice(1).join(' ');
      
      return {
        action,
        target: rest || undefined,
        context: 'command'
      };
    }
    
    // Handle natural language
    return {
      action: 'chat',
      target: trimmed,
      context: 'natural'
    };
  }

  static generatePrompt(command: string, personality: PersonalityMode): string {
    const parsed = this.parse(command);
    
    if (parsed.context === 'command') {
      const basePrompt = this.getCommandPrompt(parsed.action, parsed.target || '');
      return personality === 'hex' 
        ? `${basePrompt} Please provide a clean, professional implementation.`
        : `${basePrompt} Let's make this awesome and creative! 🚀`;
    }
    
    return personality === 'hex'
      ? `Please help with: ${parsed.target}`
      : `Let's work some magic on: ${parsed.target} ✨`;
  }

  private static getCommandPrompt(action: string, target: string): string {
    switch (action) {
      case 'build':
        return `Build ${target}. Include all necessary files, dependencies, and setup instructions.`;
      case 'fix':
        return `Fix the following issue: ${target}. Provide the corrected code and explanation.`;
      case 'convert':
        return `Convert ${target}. Show the before and after code with explanations.`;
      case 'analyze':
        return `Analyze ${target}. Provide insights, potential issues, and recommendations.`;
      case 'generate':
        return `Generate ${target}. Include comprehensive examples and documentation.`;
      case 'refactor':
        return `Refactor ${target}. Improve code quality, readability, and performance.`;
      default:
        return `Help with: ${target}`;
    }
  }
}
