"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Send, 
  Lightbulb, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Workflow,
  X,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { CommandSuggestion, WorkflowStep } from '@/hooks/use-ai-terminal';

interface AITerminalAssistantProps {
  onExecuteCommand: (command: string) => Promise<void>;
  onExecuteNaturalLanguage: (input: string) => Promise<void>;
  onGetSuggestions: (input: string) => Promise<CommandSuggestion[]>;
  onStartWorkflow: (intent: string) => Promise<void>;
  suggestions: CommandSuggestion[];
  activeWorkflow: WorkflowStep[] | null;
  workflowProgress: number;
  onExecuteWorkflowStep: (stepIndex: number) => Promise<void>;
  onCancelWorkflow: () => void;
  isProcessing: boolean;
  isAIEnabled: boolean;
  className?: string;
}

export function AITerminalAssistant({
  onExecuteCommand,
  onExecuteNaturalLanguage,
  onGetSuggestions,
  onStartWorkflow,
  suggestions,
  activeWorkflow,
  workflowProgress,
  onExecuteWorkflowStep,
  onCancelWorkflow,
  isProcessing,
  isAIEnabled,
  className = ""
}: AITerminalAssistantProps) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'command' | 'natural' | 'workflow'>('natural');
  const [liveSuggestions, setLiveSuggestions] = useState<CommandSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get live suggestions as user types
  useEffect(() => {
    if (input.length > 2 && mode === 'natural') {
      const timeoutId = setTimeout(async () => {
        setIsLoadingSuggestions(true);
        try {
          const newSuggestions = await onGetSuggestions(input);
          setLiveSuggestions(newSuggestions);
        } catch (error) {
          console.error('Error getting suggestions:', error);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setLiveSuggestions([]);
    }
  }, [input, mode, onGetSuggestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const command = input.trim();
    setInput('');
    setLiveSuggestions([]);

    try {
      if (mode === 'natural') {
        await onExecuteNaturalLanguage(command);
      } else if (mode === 'workflow') {
        await onStartWorkflow(command);
      } else {
        await onExecuteCommand(command);
      }
    } catch (error) {
      console.error('Error executing command:', error);
    }
  };

  const handleSuggestionClick = async (suggestion: CommandSuggestion) => {
    try {
      if (suggestion.category === 'fix' || suggestion.category === 'quick') {
        await onExecuteCommand(suggestion.command);
      } else {
        setInput(suggestion.command);
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Error executing suggestion:', error);
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'natural': return <Bot className="w-4 h-4" />;
      case 'workflow': return <Workflow className="w-4 h-4" />;
      case 'command': return <Terminal className="w-4 h-4" />;
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case 'natural': return 'bg-blue-500';
      case 'workflow': return 'bg-purple-500';
      case 'command': return 'bg-green-500';
    }
  };

  if (!isAIEnabled) {
    return (
      <Card className={`${className} border-amber-200 bg-amber-50`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">AI Terminal Assistant is disabled. Configure your AI settings to enable.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5 text-blue-500" />
          AI Terminal Assistant
          {isProcessing && (
            <div className="ml-auto flex items-center gap-1 text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Processing...
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mode Selector */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <Button
            variant={mode === 'natural' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('natural')}
            className="flex-1 text-xs"
          >
            <Bot className="w-3 h-3 mr-1" />
            Natural
          </Button>
          <Button
            variant={mode === 'workflow' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('workflow')}
            className="flex-1 text-xs"
          >
            <Workflow className="w-3 h-3 mr-1" />
            Workflow
          </Button>
          <Button
            variant={mode === 'command' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('command')}
            className="flex-1 text-xs"
          >
            <Terminal className="w-3 h-3 mr-1" />
            Command
          </Button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <div className={`w-2 h-8 rounded-full ${getModeColor()}`} />
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'natural' 
                  ? "Describe what you want to do..." 
                  : mode === 'workflow'
                  ? "Describe a complex task or workflow..."
                  : "Enter terminal command..."
              }
              disabled={isProcessing}
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="sm" 
              disabled={!input.trim() || isProcessing}
              className="px-3"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Mode Description */}
          <div className="text-xs text-gray-500">
            {mode === 'natural' && "Use natural language like 'install react' or 'start dev server'"}
            {mode === 'workflow' && "Describe complex tasks like 'set up a new React project with TypeScript'"}
            {mode === 'command' && "Enter direct terminal commands"}
          </div>
        </form>

        {/* Live Suggestions */}
        {liveSuggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Lightbulb className="w-4 h-4" />
              Suggestions
              {isLoadingSuggestions && (
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <div className="space-y-1">
              {liveSuggestions.slice(0, 3).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full justify-start text-left h-auto py-2"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Zap className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs truncate">{suggestion.command}</div>
                      <div className="text-xs text-gray-500 truncate">{suggestion.description}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(suggestion.confidence * 100)}%
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Current Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Suggested Fixes
            </div>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full justify-start text-left h-auto py-2 border-amber-200 hover:bg-amber-50"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Play className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs truncate">{suggestion.command}</div>
                      <div className="text-xs text-gray-500 truncate">{suggestion.description}</div>
                    </div>
                    <Badge variant="outline" className="text-xs border-amber-300">
                      Fix
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Active Workflow */}
        {activeWorkflow && (
          <div className="space-y-2">
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Workflow className="w-4 h-4 text-purple-500" />
                Active Workflow ({workflowProgress}/{activeWorkflow.length})
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelWorkflow}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {activeWorkflow.map((step, index) => (
                  <div
                    key={step.id}
                    className={`p-2 rounded border text-sm ${
                      index < workflowProgress
                        ? 'bg-green-50 border-green-200'
                        : index === workflowProgress
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {index < workflowProgress ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : index === workflowProgress ? (
                        <Clock className="w-4 h-4 text-blue-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span className="font-medium">{step.title}</span>
                      {index === workflowProgress && (
                        <Button
                          size="sm"
                          onClick={() => onExecuteWorkflowStep(index)}
                          className="ml-auto h-6 px-2 text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Execute
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{step.description}</div>
                    {step.commands.length > 0 && (
                      <div className="text-xs font-mono text-gray-500 mt-1">
                        {step.commands.join(' && ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
