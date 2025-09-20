"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Terminal, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  Copy,
  ExternalLink,
  Lightbulb,
  Zap,
  Bot
} from 'lucide-react';
import { TerminalCommand } from '@/hooks/use-terminal';
import { DetailedErrorAnalysis } from '@/lib/error-analysis-service';

interface TerminalChatMessage {
  id: string;
  type: 'command' | 'output' | 'error' | 'suggestion' | 'analysis';
  content: string;
  timestamp: Date;
  command?: string;
  errorAnalysis?: DetailedErrorAnalysis;
  suggestions?: Array<{
    command: string;
    description: string;
    confidence: number;
  }>;
}

interface TerminalChatBridgeProps {
  terminalCommands: TerminalCommand[];
  onSendToChat: (message: string, context?: any) => void;
  onExecuteCommand: (command: string) => void;
  onRequestAnalysis: (command: string, output: string) => Promise<DetailedErrorAnalysis>;
  className?: string;
}

export function TerminalChatBridge({
  terminalCommands,
  onSendToChat,
  onExecuteCommand,
  onRequestAnalysis,
  className = ""
}: TerminalChatBridgeProps) {
  const [chatMessages, setChatMessages] = useState<TerminalChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalyzeErrors, setAutoAnalyzeErrors] = useState(true);

  // Convert terminal commands to chat messages
  useEffect(() => {
    const newMessages: TerminalChatMessage[] = [];

    for (const cmd of terminalCommands.slice(-10)) { // Last 10 commands
      // Add command message
      newMessages.push({
        id: `cmd-${cmd.id}`,
        type: 'command',
        content: cmd.command,
        timestamp: cmd.timestamp,
        command: cmd.command
      });

      // Add output message
      if (cmd.output) {
        newMessages.push({
          id: `out-${cmd.id}`,
          type: cmd.status === 'error' ? 'error' : 'output',
          content: cmd.output,
          timestamp: cmd.timestamp,
          command: cmd.command
        });
      }

      // Auto-analyze errors
      if (cmd.status === 'error' && autoAnalyzeErrors && cmd.output) {
        handleAutoAnalysis(cmd);
      }
    }

    setChatMessages(newMessages);
  }, [terminalCommands, autoAnalyzeErrors]);

  const handleAutoAnalysis = useCallback(async (command: TerminalCommand) => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const analysis = await onRequestAnalysis(command.command, command.output);
      
      // Add analysis message
      const analysisMessage: TerminalChatMessage = {
        id: `analysis-${command.id}`,
        type: 'analysis',
        content: analysis.explanation,
        timestamp: new Date(),
        command: command.command,
        errorAnalysis: analysis,
        suggestions: analysis.suggestedFixes
      };

      setChatMessages(prev => [...prev, analysisMessage]);
    } catch (error) {
      console.error('Error analyzing command:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, onRequestAnalysis]);

  const handleSendErrorToChat = (command: string, output: string, analysis?: DetailedErrorAnalysis) => {
    const context = {
      terminalError: true,
      command,
      output,
      analysis
    };

    const message = analysis 
      ? `I'm having trouble with this command: \`${command}\`\n\nError: ${analysis.description}\n\nCan you help me resolve this?`
      : `I'm getting an error with this command: \`${command}\`\n\nOutput:\n\`\`\`\n${output}\n\`\`\`\n\nCan you help me fix this?`;

    onSendToChat(message, context);
  };

  const handleExecuteSuggestion = (command: string) => {
    onExecuteCommand(command);
  };

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
  };

  const getMessageIcon = (type: TerminalChatMessage['type']) => {
    switch (type) {
      case 'command': return <Terminal className="w-4 h-4 text-blue-500" />;
      case 'output': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'analysis': return <Bot className="w-4 h-4 text-purple-500" />;
      case 'suggestion': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMessageBgColor = (type: TerminalChatMessage['type']) => {
    switch (type) {
      case 'command': return 'bg-blue-50 border-blue-200';
      case 'output': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'analysis': return 'bg-purple-50 border-purple-200';
      case 'suggestion': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5" />
            Terminal Chat Bridge
            {isAnalyzing && (
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse mr-1" />
                Analyzing
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={autoAnalyzeErrors ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoAnalyzeErrors(!autoAnalyzeErrors)}
              className="text-xs"
            >
              <Bot className="w-3 h-3 mr-1" />
              Auto-Analyze
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {chatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Terminal activity will appear here</p>
                  <p className="text-xs text-gray-400">Errors will be automatically analyzed</p>
                </div>
              </div>
            ) : (
              chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg border ${getMessageBgColor(message.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getMessageIcon(message.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium capitalize">
                          {message.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="text-sm">
                        {message.type === 'command' ? (
                          <div className="font-mono bg-gray-100 p-2 rounded text-xs">
                            $ {message.content}
                          </div>
                        ) : message.type === 'output' || message.type === 'error' ? (
                          <div className="font-mono text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {message.content}
                          </div>
                        ) : (
                          <div className="text-gray-700">
                            {message.content}
                          </div>
                        )}
                      </div>

                      {/* Error Analysis Details */}
                      {message.errorAnalysis && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {message.errorAnalysis.severity}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {message.errorAnalysis.category}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-gray-600">
                            <strong>Impact:</strong> {message.errorAnalysis.impact}
                          </div>

                          {message.errorAnalysis.preventionTips.length > 0 && (
                            <div className="text-xs">
                              <strong className="text-gray-600">Prevention:</strong>
                              <ul className="list-disc list-inside mt-1 text-gray-500">
                                {message.errorAnalysis.preventionTips.slice(0, 2).map((tip, index) => (
                                  <li key={index}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Suggested Fixes */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs font-medium text-gray-600">Suggested Fixes:</div>
                          {message.suggestions.slice(0, 3).map((suggestion, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-white rounded border"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-mono text-xs truncate">
                                  {suggestion.command}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {suggestion.description}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(suggestion.confidence * 100)}%
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyCommand(suggestion.command)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleExecuteSuggestion(suggestion.command)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Zap className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-3">
                        {(message.type === 'error' || message.type === 'analysis') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendErrorToChat(
                              message.command || '',
                              message.content,
                              message.errorAnalysis
                            )}
                            className="text-xs"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Ask AI for Help
                          </Button>
                        )}
                        
                        {message.command && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCommand(message.command!)}
                            className="text-xs"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy Command
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <Separator className="my-4" />
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-600">Quick Actions</div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendToChat("Help me debug the last error")}
              className="text-xs"
            >
              <Bot className="w-3 h-3 mr-1" />
              Debug Last Error
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendToChat("Explain what went wrong with my recent commands")}
              className="text-xs"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              Explain Issues
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendToChat("Suggest next steps for my project")}
              className="text-xs"
            >
              <ArrowRight className="w-3 h-3 mr-1" />
              Next Steps
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
