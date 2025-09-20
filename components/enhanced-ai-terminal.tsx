"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Terminal, 
  Bot, 
  Settings, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Square,
  Minimize2,
  Maximize2,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { TerminalComponent } from './terminal';
import { AITerminalAssistant } from './ai-terminal-assistant';
import { useAITerminal } from '@/hooks/use-ai-terminal';
import { AISettings } from '@/lib/ai-config';

interface EnhancedAITerminalProps {
  onOpenFile?: (filePath: string, lineNumber?: number, columnNumber?: number) => void;
  onClose?: () => void;
  onMinimize?: () => void;
  files?: Array<{ name: string; content: string; language?: string }>;
  currentFile?: string;
  aiSettings: AISettings;
  onAISettingsChange: (settings: AISettings) => void;
  className?: string;
}

export function EnhancedAITerminal({
  onOpenFile,
  onClose,
  onMinimize,
  files = [],
  currentFile,
  aiSettings,
  onAISettingsChange,
  className = ""
}: EnhancedAITerminalProps) {
  const [activeTab, setActiveTab] = useState<'terminal' | 'assistant' | 'workflow'>('assistant');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  const aiTerminal = useAITerminal();

  // Update AI settings when they change
  useEffect(() => {
    aiTerminal.setAISettings(aiSettings);
  }, [aiSettings, aiTerminal]);

  // Sync project context when files change
  useEffect(() => {
    if (files.length > 0) {
      const fileNames = files.map(f => f.name);
      const packageJsonFile = files.find(f => f.name === 'package.json');
      const packageJson = packageJsonFile ? JSON.parse(packageJsonFile.content) : undefined;
      
      aiTerminal.syncProjectContext(fileNames, packageJson);
    }
  }, [files, aiTerminal]);

  const handleExecuteCommand = async (command: string) => {
    try {
      await aiTerminal.executeCommand(command);
    } catch (error) {
      console.error('Error executing command:', error);
    }
  };

  const handleExecuteNaturalLanguage = async (input: string) => {
    try {
      await aiTerminal.executeNaturalLanguage(input);
    } catch (error) {
      console.error('Error executing natural language command:', error);
    }
  };

  const quickActions = aiTerminal.getQuickActions();
  const activeSession = aiTerminal.getActiveSession();

  if (!isExpanded) {
    return (
      <Card className={`${className} h-12`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <span className="text-sm font-medium">AI Terminal</span>
              {aiTerminal.isAIEnabled && (
                <Badge variant="secondary" className="text-xs">
                  <Bot className="w-3 h-3 mr-1" />
                  AI Enabled
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="h-6 w-6 p-0"
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            AI-Enhanced Terminal
            {aiTerminal.isAIEnabled && (
              <Badge variant="secondary" className="text-xs">
                <Bot className="w-3 h-3 mr-1" />
                AI Enabled
              </Badge>
            )}
            {aiTerminal.isProcessingNL && (
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1" />
                Processing
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6 p-0"
            >
              <Minimize2 className="w-3 h-3" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Actions */}
        {showQuickActions && quickActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="w-4 h-4" />
                Quick Actions
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickActions(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickActions.slice(0, 4).map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExecuteCommand(action.command)}
                  className="text-xs"
                >
                  <Play className="w-3 h-3 mr-1" />
                  {action.description}
                </Button>
              ))}
            </div>
            <Separator />
          </div>
        )}

        {/* Main Interface */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assistant" className="text-xs">
              <Bot className="w-3 h-3 mr-1" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="terminal" className="text-xs">
              <Terminal className="w-3 h-3 mr-1" />
              Terminal
            </TabsTrigger>
            <TabsTrigger value="workflow" className="text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Workflow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assistant" className="mt-4">
            <AITerminalAssistant
              onExecuteCommand={handleExecuteCommand}
              onExecuteNaturalLanguage={handleExecuteNaturalLanguage}
              onGetSuggestions={aiTerminal.getCommandSuggestions}
              onStartWorkflow={aiTerminal.startWorkflow}
              suggestions={aiTerminal.currentSuggestions}
              activeWorkflow={aiTerminal.activeWorkflow}
              workflowProgress={aiTerminal.workflowProgress}
              onExecuteWorkflowStep={aiTerminal.executeWorkflowStep}
              onCancelWorkflow={aiTerminal.cancelWorkflow}
              isProcessing={aiTerminal.isProcessingNL}
              isAIEnabled={aiTerminal.isAIEnabled}
            />
          </TabsContent>

          <TabsContent value="terminal" className="mt-4">
            {activeSession ? (
              <TerminalComponent
                session={activeSession}
                onExecuteCommand={handleExecuteCommand}
                onOpenFile={onOpenFile}
                className="border-0 shadow-none"
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active terminal session</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => aiTerminal.createSession('AI Terminal')}
                    className="mt-2"
                  >
                    Create Session
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="workflow" className="mt-4">
            <div className="space-y-4">
              {aiTerminal.activeWorkflow ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Active Workflow</h3>
                    <Badge variant="outline">
                      {aiTerminal.workflowProgress}/{aiTerminal.activeWorkflow.length} steps
                    </Badge>
                  </div>
                  
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {aiTerminal.activeWorkflow.map((step, index) => (
                        <Card
                          key={step.id}
                          className={`p-3 ${
                            index < aiTerminal.workflowProgress
                              ? 'bg-green-50 border-green-200'
                              : index === aiTerminal.workflowProgress
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {index < aiTerminal.workflowProgress ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : index === aiTerminal.workflowProgress ? (
                                <Clock className="w-4 h-4 text-blue-500" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm">{step.title}</h4>
                              <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                              {step.commands.length > 0 && (
                                <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                                  {step.commands.join(' && ')}
                                </div>
                              )}
                              {index === aiTerminal.workflowProgress && (
                                <Button
                                  size="sm"
                                  onClick={() => aiTerminal.executeWorkflowStep(index)}
                                  className="mt-2 h-6 px-2 text-xs"
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Execute Step
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <Button
                    variant="outline"
                    onClick={aiTerminal.cancelWorkflow}
                    className="w-full"
                  >
                    Cancel Workflow
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active workflow</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Use the AI Assistant to start a workflow
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Status Bar */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-4">
            <span>Project: {aiTerminal.projectContext.projectType}</span>
            <span>Dir: {aiTerminal.projectContext.currentDirectory.split('/').pop()}</span>
          </div>
          <div className="flex items-center gap-2">
            {aiTerminal.isAIEnabled ? (
              <Badge variant="secondary" className="text-xs">
                <Bot className="w-3 h-3 mr-1" />
                AI Ready
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                AI Disabled
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
