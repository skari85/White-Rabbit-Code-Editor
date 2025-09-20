"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Terminal, 
  Code, 
  Workflow, 
  Settings, 
  Zap,
  Brain,
  Rocket,
  Shield,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

import { EnhancedAITerminal } from './enhanced-ai-terminal';
import { TerminalChatBridge } from './terminal-chat-bridge';
import { AIChat } from './ai-chat';
import { useAITerminal } from '@/hooks/use-ai-terminal';
import { useAIAssistantEnhanced } from '@/hooks/use-ai-assistant-enhanced';
import { AISettings } from '@/lib/ai-config';
import { ProjectSetupAutomation } from '@/lib/project-setup-automation';
import { DevServerManagement } from '@/lib/dev-server-management';
import { AdvancedCodeGeneration } from '@/lib/advanced-code-generation';
import { ErrorAnalysisService } from '@/lib/error-analysis-service';

interface AIDevelopmentEnvironmentProps {
  files: Array<{ name: string; content: string; language?: string }>;
  currentFile?: string;
  onFileSelect?: (filename: string) => void;
  onFileCreate?: (filename: string, content: string) => void;
  onFileUpdate?: (filename: string, content: string) => void;
  aiSettings: AISettings;
  onAISettingsChange: (settings: AISettings) => void;
  className?: string;
}

export function AIDevelopmentEnvironment({
  files,
  currentFile,
  onFileSelect,
  onFileCreate,
  onFileUpdate,
  aiSettings,
  onAISettingsChange,
  className = ""
}: AIDevelopmentEnvironmentProps) {
  const [activeTab, setActiveTab] = useState<'terminal' | 'chat' | 'workflow' | 'analysis'>('terminal');
  const [isInitialized, setIsInitialized] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  
  // Initialize AI services
  const aiTerminal = useAITerminal();
  const aiAssistant = useAIAssistantEnhanced();
  
  // Service instances
  const [projectSetup] = useState(() => new ProjectSetupAutomation(aiSettings));
  const [devServerManager] = useState(() => new DevServerManagement());
  const [codeGenerator] = useState(() => new AdvancedCodeGeneration(aiSettings));
  const [errorAnalyzer] = useState(() => new ErrorAnalysisService(aiSettings));

  // Initialize system
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // Update AI settings across all services
        aiTerminal.setAISettings(aiSettings);
        aiAssistant.saveSettings(aiSettings);
        
        // Sync project context
        if (files.length > 0) {
          const fileNames = files.map(f => f.name);
          const packageJsonFile = files.find(f => f.name === 'package.json');
          const packageJson = packageJsonFile ? JSON.parse(packageJsonFile.content) : undefined;
          
          aiTerminal.syncProjectContext(fileNames, packageJson);
        }
        
        setSystemStatus('ready');
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize AI development environment:', error);
        setSystemStatus('error');
      }
    };

    initializeSystem();
  }, [aiSettings, files, aiTerminal, aiAssistant]);

  // Handle AI chat messages
  const handleSendMessage = useCallback(async (message: string, context?: any) => {
    try {
      const chatContext = {
        files,
        selectedFile: currentFile || '',
        appSettings: { name: 'AI Development Environment' },
        ...context
      };
      
      await aiAssistant.sendMessage(message, chatContext);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [files, currentFile, aiAssistant]);

  // Handle code generation
  const handleCodeGenerated = useCallback((filename: string, content: string, language: string) => {
    if (onFileCreate) {
      onFileCreate(filename, content);
    }
  }, [onFileCreate]);

  // Handle terminal command execution
  const handleExecuteCommand = useCallback(async (command: string) => {
    try {
      await aiTerminal.executeCommand(command);
    } catch (error) {
      console.error('Error executing command:', error);
    }
  }, [aiTerminal]);

  // Handle error analysis
  const handleRequestAnalysis = useCallback(async (command: string, output: string) => {
    try {
      const context = {
        command,
        output,
        exitCode: 1,
        workingDirectory: aiTerminal.projectContext.currentDirectory,
        environment: {},
        timestamp: new Date(),
        projectContext: aiTerminal.projectContext
      };
      
      return await errorAnalyzer.analyzeError(context);
    } catch (error) {
      console.error('Error analyzing error:', error);
      throw error;
    }
  }, [aiTerminal.projectContext, errorAnalyzer]);

  // Get system status indicator
  const getStatusIndicator = () => {
    switch (systemStatus) {
      case 'initializing':
        return (
          <Badge variant="outline" className="text-xs">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-1" />
            Initializing
          </Badge>
        );
      case 'ready':
        return (
          <Badge variant="secondary" className="text-xs">
            <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
            Ready
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
    }
  };

  // Get feature status
  const getFeatureStatus = () => {
    const features = [
      { name: 'AI Terminal', enabled: aiTerminal.isAIEnabled, icon: Terminal },
      { name: 'Code Generation', enabled: aiAssistant.isConfigured, icon: Code },
      { name: 'Error Analysis', enabled: aiTerminal.isAIEnabled, icon: Brain },
      { name: 'Workflow Automation', enabled: aiTerminal.isAIEnabled, icon: Workflow }
    ];

    return features;
  };

  if (!isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Initializing AI Development Environment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* System Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-500" />
              AI Development Environment
              {getStatusIndicator()}
            </CardTitle>
            <div className="flex items-center gap-2">
              {getFeatureStatus().map((feature, index) => (
                <Badge
                  key={index}
                  variant={feature.enabled ? "secondary" : "outline"}
                  className="text-xs"
                >
                  <feature.icon className="w-3 h-3 mr-1" />
                  {feature.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Panel - Terminal and Workflow */}
        <div className="space-y-4">
          <EnhancedAITerminal
            files={files}
            currentFile={currentFile}
            aiSettings={aiSettings}
            onAISettingsChange={onAISettingsChange}
            onOpenFile={onFileSelect}
            className="h-96"
          />
          
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage("Help me set up a new React project")}
                  className="text-xs"
                >
                  <Rocket className="w-3 h-3 mr-1" />
                  New Project
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage("Analyze my code for improvements")}
                  className="text-xs"
                >
                  <Brain className="w-3 h-3 mr-1" />
                  Code Review
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage("Generate tests for my components")}
                  className="text-xs"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Generate Tests
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage("Help me debug the latest error")}
                  className="text-xs"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Debug Error
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Chat and Analysis */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="chat" className="text-xs">
                <Bot className="w-3 h-3 mr-1" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="terminal" className="text-xs">
                <Terminal className="w-3 h-3 mr-1" />
                Terminal
              </TabsTrigger>
              <TabsTrigger value="workflow" className="text-xs">
                <Workflow className="w-3 h-3 mr-1" />
                Workflow
              </TabsTrigger>
              <TabsTrigger value="analysis" className="text-xs">
                <Brain className="w-3 h-3 mr-1" />
                Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-4">
              <Card className="h-96">
                <CardContent className="p-0 h-full">
                  <AIChat
                    messages={aiAssistant.messages}
                    isLoading={aiAssistant.isLoading}
                    onSendMessage={handleSendMessage}
                    onClearMessages={aiAssistant.clearMessages}
                    isConfigured={aiAssistant.isConfigured}
                    settings={aiAssistant.settings}
                    onSettingsChange={aiAssistant.saveSettings}
                    onCodeGenerated={handleCodeGenerated}
                    className="h-full"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="terminal" className="mt-4">
              <TerminalChatBridge
                terminalCommands={aiTerminal.getActiveSession()?.commands || []}
                onSendToChat={handleSendMessage}
                onExecuteCommand={handleExecuteCommand}
                onRequestAnalysis={handleRequestAnalysis}
                className="h-96"
              />
            </TabsContent>

            <TabsContent value="workflow" className="mt-4">
              <Card className="h-96">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Active Workflows</CardTitle>
                </CardHeader>
                <CardContent>
                  {aiTerminal.activeWorkflow ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Current Workflow</span>
                        <Badge variant="outline">
                          {aiTerminal.workflowProgress}/{aiTerminal.activeWorkflow.length} steps
                        </Badge>
                      </div>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {aiTerminal.activeWorkflow.map((step, index) => (
                            <div
                              key={step.id}
                              className={`p-2 rounded border text-sm ${
                                index < aiTerminal.workflowProgress
                                  ? 'bg-green-50 border-green-200'
                                  : index === aiTerminal.workflowProgress
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="font-medium">{step.title}</div>
                              <div className="text-xs text-gray-600">{step.description}</div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <Workflow className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No active workflow</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendMessage("Help me create a development workflow")}
                          className="mt-2 text-xs"
                        >
                          Start Workflow
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="mt-4">
              <Card className="h-96">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Code Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center text-gray-500">
                      <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">AI-powered code analysis</p>
                      <p className="text-xs text-gray-400">
                        Select code and ask for analysis, improvements, or reviews
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage("Analyze my current file for potential improvements")}
                        className="w-full text-xs"
                      >
                        Analyze Current File
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage("Review my code for security issues")}
                        className="w-full text-xs"
                      >
                        Security Review
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage("Suggest performance optimizations")}
                        className="w-full text-xs"
                      >
                        Performance Analysis
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
