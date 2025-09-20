'use client'

import { AIService } from './ai-service';
import { AISettings, AIMessage } from './ai-config';
import { TerminalCommand, TerminalSession } from '@/hooks/use-terminal';

export interface ProjectContext {
  rootPath: string;
  currentDirectory: string;
  projectType: 'react' | 'vue' | 'angular' | 'node' | 'next' | 'vite' | 'unknown';
  packageJson?: any;
  gitBranch?: string;
  gitStatus?: string;
  openFiles: string[];
  currentFile?: string;
  dependencies: string[];
  devDependencies: string[];
}

export interface CommandIntent {
  type: 'setup' | 'install' | 'run' | 'build' | 'test' | 'debug' | 'deploy' | 'git' | 'file' | 'help';
  action: string;
  target?: string;
  parameters?: Record<string, any>;
  confidence: number;
}

export interface ErrorAnalysis {
  errorType: 'syntax' | 'dependency' | 'permission' | 'network' | 'configuration' | 'runtime' | 'unknown';
  description: string;
  suggestedFixes: Array<{
    command: string;
    description: string;
    confidence: number;
  }>;
  explanation: string;
  relatedFiles?: string[];
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  commands: string[];
  expectedOutput?: string;
  onError?: string;
  dependencies?: string[];
}

export interface AITerminalResponse {
  commands: string[];
  explanation: string;
  workflow?: WorkflowStep[];
  followUpQuestions?: string[];
}

export class AITerminalBridge {
  private aiService: AIService;
  private projectContext: ProjectContext | null = null;
  private commandHistory: TerminalCommand[] = [];

  constructor(aiSettings: AISettings) {
    this.aiService = new AIService(aiSettings);
  }

  // Update project context
  updateProjectContext(context: Partial<ProjectContext>): void {
    this.projectContext = {
      ...this.projectContext,
      ...context
    } as ProjectContext;
  }

  // Add command to history for learning
  addCommandToHistory(command: TerminalCommand): void {
    this.commandHistory.push(command);
    // Keep only last 50 commands for context
    if (this.commandHistory.length > 50) {
      this.commandHistory = this.commandHistory.slice(-50);
    }
  }

  // Parse natural language input and convert to terminal commands
  async parseNaturalLanguage(input: string): Promise<AITerminalResponse> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input);

    const messages: AIMessage[] = [
      {
        id: Date.now().toString(),
        role: 'user',
        content: userPrompt,
        timestamp: new Date()
      }
    ];

    try {
      const response = await this.aiService.sendMessage(messages);
      return this.parseAIResponse(response.content);
    } catch (error) {
      console.error('Error parsing natural language:', error);
      throw new Error('Failed to parse command. Please try again.');
    }
  }

  // Analyze terminal errors and provide solutions
  async analyzeError(errorOutput: string, command: string): Promise<ErrorAnalysis> {
    const systemPrompt = `You are an expert developer assistant specializing in terminal error analysis.
    Analyze the error output and provide specific, actionable solutions.
    
    Project Context:
    ${this.getContextString()}
    
    Return a JSON object with this structure:
    {
      "errorType": "syntax|dependency|permission|network|configuration|runtime|unknown",
      "description": "Clear description of what went wrong",
      "suggestedFixes": [
        {
          "command": "exact command to run",
          "description": "what this command does",
          "confidence": 0.9
        }
      ],
      "explanation": "Detailed explanation of the error and why the fixes work",
      "relatedFiles": ["file1.js", "file2.json"]
    }`;

    const userPrompt = `Command that failed: ${command}
    
    Error output:
    ${errorOutput}
    
    Please analyze this error and provide solutions.`;

    const messages: AIMessage[] = [
      {
        id: Date.now().toString(),
        role: 'user',
        content: userPrompt,
        timestamp: new Date()
      }
    ];

    try {
      const response = await this.aiService.sendMessage(messages);
      return this.parseErrorAnalysis(response.content);
    } catch (error) {
      console.error('Error analyzing error:', error);
      return {
        errorType: 'unknown',
        description: 'Unable to analyze error',
        suggestedFixes: [],
        explanation: 'Error analysis failed. Please check the command and try again.'
      };
    }
  }

  // Suggest workflow for complex tasks
  async suggestWorkflow(intent: string): Promise<WorkflowStep[]> {
    const systemPrompt = `You are an expert development workflow designer.
    Create step-by-step workflows for complex development tasks.
    
    Project Context:
    ${this.getContextString()}
    
    Return a JSON array of workflow steps with this structure:
    [
      {
        "id": "step1",
        "title": "Step Title",
        "description": "What this step does",
        "commands": ["command1", "command2"],
        "expectedOutput": "What to expect",
        "onError": "What to do if this fails",
        "dependencies": ["previous_step_id"]
      }
    ]`;

    const messages: AIMessage[] = [
      {
        id: Date.now().toString(),
        role: 'user',
        content: `Create a workflow for: ${intent}`,
        timestamp: new Date()
      }
    ];

    try {
      const response = await this.aiService.sendMessage(messages);
      return this.parseWorkflow(response.content);
    } catch (error) {
      console.error('Error suggesting workflow:', error);
      return [];
    }
  }

  // Build system prompt with context
  private buildSystemPrompt(): string {
    return `You are an expert terminal assistant for developers. You help convert natural language requests into precise terminal commands.

    IMPORTANT RULES:
    1. Always return valid JSON in this format:
    {
      "commands": ["command1", "command2"],
      "explanation": "Clear explanation of what these commands do",
      "workflow": [optional workflow steps],
      "followUpQuestions": ["question1", "question2"]
    }

    2. Only suggest safe, commonly used commands
    3. Consider the project context when suggesting commands
    4. If unsure, ask clarifying questions
    5. Provide explanations for complex commands

    Project Context:
    ${this.getContextString()}

    Recent Commands:
    ${this.getRecentCommandsString()}`;
  }

  private buildUserPrompt(input: string): string {
    return `User request: "${input}"

    Please convert this to appropriate terminal commands with explanations.`;
  }

  private getContextString(): string {
    if (!this.projectContext) return 'No project context available';

    return `
    - Project Type: ${this.projectContext.projectType}
    - Current Directory: ${this.projectContext.currentDirectory}
    - Dependencies: ${this.projectContext.dependencies.slice(0, 10).join(', ')}
    - Git Branch: ${this.projectContext.gitBranch || 'unknown'}
    - Open Files: ${this.projectContext.openFiles.slice(0, 5).join(', ')}`;
  }

  private getRecentCommandsString(): string {
    return this.commandHistory
      .slice(-5)
      .map(cmd => `${cmd.command} (${cmd.status})`)
      .join('\n');
  }

  private parseAIResponse(content: string): AITerminalResponse {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          commands: parsed.commands || [],
          explanation: parsed.explanation || '',
          workflow: parsed.workflow || undefined,
          followUpQuestions: parsed.followUpQuestions || undefined
        };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    // Fallback parsing
    return {
      commands: [],
      explanation: content,
      followUpQuestions: ['Could you be more specific about what you want to do?']
    };
  }

  private parseErrorAnalysis(content: string): ErrorAnalysis {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing error analysis:', error);
    }

    return {
      errorType: 'unknown',
      description: 'Unable to parse error analysis',
      suggestedFixes: [],
      explanation: content
    };
  }

  private parseWorkflow(content: string): WorkflowStep[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing workflow:', error);
    }

    return [];
  }
}
