import { useState, useCallback, useRef, useEffect } from 'react';
import { useTerminal, TerminalCommand, TerminalSession } from './use-terminal';
import { NaturalLanguageParser, ParsedCommand } from '@/lib/natural-language-parser';
import { AITerminalBridge, ProjectContext, ErrorAnalysis, WorkflowStep } from '@/lib/ai-terminal-bridge';
import { AISettings, DEFAULT_AI_SETTINGS } from '@/lib/ai-config';

export interface AITerminalCommand extends TerminalCommand {
  isAIGenerated?: boolean;
  originalInput?: string;
  confidence?: number;
  suggestions?: string[];
  errorAnalysis?: ErrorAnalysis;
}

export interface AITerminalSession extends TerminalSession {
  aiCommands: AITerminalCommand[];
  context: ProjectContext;
}

export interface CommandSuggestion {
  command: string;
  description: string;
  confidence: number;
  category: 'quick' | 'workflow' | 'fix' | 'suggestion';
}

export function useAITerminal() {
  const terminal = useTerminal();
  const [aiSettings, setAISettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [isProcessingNL, setIsProcessingNL] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<CommandSuggestion[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowStep[] | null>(null);
  const [workflowProgress, setWorkflowProgress] = useState<number>(0);
  
  const nlParserRef = useRef<NaturalLanguageParser | null>(null);
  const aiTerminalBridgeRef = useRef<AITerminalBridge | null>(null);
  const projectContextRef = useRef<ProjectContext>({
    rootPath: process.cwd?.() || '/Users/georgalbert/pwa-code',
    currentDirectory: process.cwd?.() || '/Users/georgalbert/pwa-code',
    projectType: 'unknown',
    openFiles: [],
    dependencies: [],
    devDependencies: []
  });

  // Initialize AI services when settings change
  useEffect(() => {
    if (aiSettings.apiKey && aiSettings.provider) {
      nlParserRef.current = new NaturalLanguageParser(aiSettings);
      aiTerminalBridgeRef.current = new AITerminalBridge(aiSettings);
      setIsAIEnabled(true);
    } else {
      setIsAIEnabled(false);
    }
  }, [aiSettings]);

  // Update project context
  const updateProjectContext = useCallback((context: Partial<ProjectContext>) => {
    projectContextRef.current = { ...projectContextRef.current, ...context };
    
    if (nlParserRef.current) {
      nlParserRef.current.updateProjectContext(projectContextRef.current);
    }
    if (aiTerminalBridgeRef.current) {
      aiTerminalBridgeRef.current.updateProjectContext(projectContextRef.current);
    }
  }, []);

  // Execute natural language command
  const executeNaturalLanguage = useCallback(async (input: string): Promise<void> => {
    if (!isAIEnabled || !nlParserRef.current) {
      throw new Error('AI terminal is not enabled. Please configure your AI settings.');
    }

    setIsProcessingNL(true);
    try {
      const parsedCommand = await nlParserRef.current.parseCommand(input);
      
      if (parsedCommand.requiresConfirmation) {
        // In a real implementation, show confirmation dialog
        const confirmed = window.confirm(
          `This will execute: ${parsedCommand.commands.join(', ')}\n\n${parsedCommand.explanation}\n\nContinue?`
        );
        if (!confirmed) {
          setIsProcessingNL(false);
          return;
        }
      }

      // Execute each command
      for (const command of parsedCommand.commands) {
        const result = await terminal.executeCommand(command);
        
        // Add AI metadata to command
        const aiCommand: AITerminalCommand = {
          ...result,
          isAIGenerated: true,
          originalInput: input,
          confidence: parsedCommand.confidence
        };

        // Add to AI bridge history for learning
        if (aiTerminalBridgeRef.current) {
          aiTerminalBridgeRef.current.addCommandToHistory(aiCommand);
        }

        // Analyze errors if command failed
        if (result.status === 'error' && aiTerminalBridgeRef.current) {
          try {
            const errorAnalysis = await aiTerminalBridgeRef.current.analyzeError(
              result.output,
              command
            );
            aiCommand.errorAnalysis = errorAnalysis;
            
            // Generate suggestions based on error analysis
            const suggestions = errorAnalysis.suggestedFixes.map(fix => ({
              command: fix.command,
              description: fix.description,
              confidence: fix.confidence,
              category: 'fix' as const
            }));
            setCurrentSuggestions(suggestions);
          } catch (error) {
            console.error('Error analyzing command failure:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error executing natural language command:', error);
      throw error;
    } finally {
      setIsProcessingNL(false);
    }
  }, [isAIEnabled, terminal]);

  // Get command suggestions
  const getCommandSuggestions = useCallback(async (partialInput: string): Promise<CommandSuggestion[]> => {
    if (!isAIEnabled || !nlParserRef.current) {
      return [];
    }

    try {
      const suggestions = await nlParserRef.current.getSuggestions(partialInput);
      return suggestions.map(suggestion => ({
        command: suggestion,
        description: `Execute: ${suggestion}`,
        confidence: 0.8,
        category: 'suggestion' as const
      }));
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }, [isAIEnabled]);

  // Start a workflow
  const startWorkflow = useCallback(async (intent: string): Promise<void> => {
    if (!isAIEnabled || !aiTerminalBridgeRef.current) {
      throw new Error('AI terminal is not enabled.');
    }

    try {
      const workflow = await aiTerminalBridgeRef.current.suggestWorkflow(intent);
      setActiveWorkflow(workflow);
      setWorkflowProgress(0);
    } catch (error) {
      console.error('Error starting workflow:', error);
      throw error;
    }
  }, [isAIEnabled]);

  // Execute next workflow step
  const executeWorkflowStep = useCallback(async (stepIndex: number): Promise<void> => {
    if (!activeWorkflow || stepIndex >= activeWorkflow.length) {
      return;
    }

    const step = activeWorkflow[stepIndex];
    
    try {
      // Execute all commands in the step
      for (const command of step.commands) {
        await terminal.executeCommand(command);
      }
      
      setWorkflowProgress(stepIndex + 1);
      
      // If this was the last step, clear the workflow
      if (stepIndex === activeWorkflow.length - 1) {
        setActiveWorkflow(null);
        setWorkflowProgress(0);
      }
    } catch (error) {
      console.error(`Error executing workflow step ${stepIndex}:`, error);
      throw error;
    }
  }, [activeWorkflow, terminal]);

  // Cancel active workflow
  const cancelWorkflow = useCallback(() => {
    setActiveWorkflow(null);
    setWorkflowProgress(0);
  }, []);

  // Generate quick action suggestions based on project context
  const getQuickActions = useCallback((): CommandSuggestion[] => {
    const context = projectContextRef.current;
    const actions: CommandSuggestion[] = [];

    // Project type specific suggestions
    if (context.projectType === 'react' || context.projectType === 'next') {
      actions.push(
        {
          command: 'npm run dev',
          description: 'Start development server',
          confidence: 0.9,
          category: 'quick'
        },
        {
          command: 'npm run build',
          description: 'Build for production',
          confidence: 0.9,
          category: 'quick'
        }
      );
    }

    if (context.projectType === 'node') {
      actions.push({
        command: 'npm start',
        description: 'Start the application',
        confidence: 0.9,
        category: 'quick'
      });
    }

    // Common actions
    actions.push(
      {
        command: 'npm install',
        description: 'Install dependencies',
        confidence: 0.8,
        category: 'quick'
      },
      {
        command: 'git status',
        description: 'Check git status',
        confidence: 0.8,
        category: 'quick'
      },
      {
        command: 'npm test',
        description: 'Run tests',
        confidence: 0.7,
        category: 'quick'
      }
    );

    return actions;
  }, []);

  // Detect project type from files
  const detectProjectType = useCallback((files: string[]): ProjectContext['projectType'] => {
    if (files.includes('next.config.js') || files.includes('next.config.mjs')) {
      return 'next';
    }
    if (files.includes('package.json')) {
      // Could analyze package.json to determine React, Vue, etc.
      return 'react'; // Default assumption
    }
    if (files.includes('vue.config.js')) {
      return 'vue';
    }
    if (files.includes('angular.json')) {
      return 'angular';
    }
    if (files.includes('vite.config.js') || files.includes('vite.config.ts')) {
      return 'vite';
    }
    return 'unknown';
  }, []);

  // Auto-update project context based on file changes
  const syncProjectContext = useCallback((files: string[], packageJson?: any) => {
    const projectType = detectProjectType(files);
    const dependencies = packageJson?.dependencies ? Object.keys(packageJson.dependencies) : [];
    const devDependencies = packageJson?.devDependencies ? Object.keys(packageJson.devDependencies) : [];

    updateProjectContext({
      projectType,
      openFiles: files,
      dependencies,
      devDependencies,
      packageJson
    });
  }, [detectProjectType, updateProjectContext]);

  return {
    // Original terminal functionality
    ...terminal,
    
    // AI-enhanced functionality
    isAIEnabled,
    isProcessingNL,
    aiSettings,
    setAISettings,
    
    // Natural language processing
    executeNaturalLanguage,
    getCommandSuggestions,
    
    // Workflow management
    activeWorkflow,
    workflowProgress,
    startWorkflow,
    executeWorkflowStep,
    cancelWorkflow,
    
    // Suggestions and quick actions
    currentSuggestions,
    getQuickActions,
    
    // Project context
    updateProjectContext,
    syncProjectContext,
    projectContext: projectContextRef.current
  };
}
