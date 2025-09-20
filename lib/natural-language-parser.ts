'use client'

import { AITerminalBridge, ProjectContext, CommandIntent, AITerminalResponse } from './ai-terminal-bridge';
import { AISettings } from './ai-config';

export interface ParsedCommand {
  originalInput: string;
  intent: CommandIntent;
  commands: string[];
  explanation: string;
  confidence: number;
  requiresConfirmation: boolean;
  estimatedTime?: string;
  warnings?: string[];
}

export interface CommandTemplate {
  pattern: RegExp;
  intent: CommandIntent['type'];
  action: string;
  template: string;
  examples: string[];
}

export class NaturalLanguageParser {
  private aiTerminalBridge: AITerminalBridge;
  private commandTemplates: CommandTemplate[] = [];
  private commonPatterns: Map<string, string[]> = new Map();

  constructor(aiSettings: AISettings) {
    this.aiTerminalBridge = new AITerminalBridge(aiSettings);
    this.initializeTemplates();
    this.initializeCommonPatterns();
  }

  // Update project context
  updateProjectContext(context: Partial<ProjectContext>): void {
    this.aiTerminalBridge.updateProjectContext(context);
  }

  // Parse natural language input
  async parseCommand(input: string): Promise<ParsedCommand> {
    const normalizedInput = input.toLowerCase().trim();
    
    // Try pattern matching first for common commands
    const quickMatch = this.tryQuickMatch(normalizedInput);
    if (quickMatch) {
      return quickMatch;
    }

    // Use AI for complex parsing
    try {
      const aiResponse = await this.aiTerminalBridge.parseNaturalLanguage(input);
      return this.buildParsedCommand(input, aiResponse);
    } catch (error) {
      console.error('Error parsing command:', error);
      return {
        originalInput: input,
        intent: { type: 'help', action: 'unknown', confidence: 0.1 },
        commands: [],
        explanation: 'Sorry, I couldn\'t understand that command. Try being more specific.',
        confidence: 0.1,
        requiresConfirmation: false,
        warnings: ['Command parsing failed']
      };
    }
  }

  // Get command suggestions based on partial input
  async getSuggestions(partialInput: string): Promise<string[]> {
    const normalizedInput = partialInput.toLowerCase();
    const suggestions: string[] = [];

    // Add pattern-based suggestions
    for (const template of this.commandTemplates) {
      if (template.examples.some(ex => ex.toLowerCase().includes(normalizedInput))) {
        suggestions.push(...template.examples);
      }
    }

    // Add common pattern suggestions
    for (const [key, commands] of this.commonPatterns) {
      if (key.includes(normalizedInput)) {
        suggestions.push(...commands);
      }
    }

    return [...new Set(suggestions)].slice(0, 10);
  }

  // Try quick pattern matching for common commands
  private tryQuickMatch(input: string): ParsedCommand | null {
    for (const template of this.commandTemplates) {
      if (template.pattern.test(input)) {
        const commands = this.expandTemplate(template, input);
        return {
          originalInput: input,
          intent: {
            type: template.intent,
            action: template.action,
            confidence: 0.9
          },
          commands,
          explanation: `Executing ${template.action} command`,
          confidence: 0.9,
          requiresConfirmation: this.requiresConfirmation(template.intent),
          estimatedTime: this.estimateTime(commands)
        };
      }
    }
    return null;
  }

  // Expand command template with actual values
  private expandTemplate(template: CommandTemplate, input: string): string[] {
    // Simple template expansion - in a real implementation, this would be more sophisticated
    const match = template.pattern.exec(input);
    if (match) {
      let command = template.template;
      for (let i = 1; i < match.length; i++) {
        command = command.replace(`$${i}`, match[i] || '');
      }
      return [command];
    }
    return [];
  }

  // Build parsed command from AI response
  private buildParsedCommand(input: string, aiResponse: AITerminalResponse): ParsedCommand {
    const intent = this.inferIntent(aiResponse.commands);
    
    return {
      originalInput: input,
      intent,
      commands: aiResponse.commands,
      explanation: aiResponse.explanation,
      confidence: this.calculateConfidence(aiResponse),
      requiresConfirmation: this.requiresConfirmation(intent.type),
      estimatedTime: this.estimateTime(aiResponse.commands),
      warnings: this.detectWarnings(aiResponse.commands)
    };
  }

  // Infer intent from commands
  private inferIntent(commands: string[]): CommandIntent {
    if (commands.length === 0) {
      return { type: 'help', action: 'unknown', confidence: 0.1 };
    }

    const firstCommand = commands[0].toLowerCase();
    
    if (firstCommand.includes('npm install') || firstCommand.includes('yarn add')) {
      return { type: 'install', action: 'install_package', confidence: 0.9 };
    }
    if (firstCommand.includes('npm run') || firstCommand.includes('yarn')) {
      return { type: 'run', action: 'run_script', confidence: 0.9 };
    }
    if (firstCommand.includes('git')) {
      return { type: 'git', action: 'git_operation', confidence: 0.9 };
    }
    if (firstCommand.includes('mkdir') || firstCommand.includes('touch')) {
      return { type: 'file', action: 'create', confidence: 0.8 };
    }
    if (firstCommand.includes('test')) {
      return { type: 'test', action: 'run_tests', confidence: 0.8 };
    }

    return { type: 'help', action: 'general', confidence: 0.5 };
  }

  // Calculate confidence based on AI response
  private calculateConfidence(aiResponse: AITerminalResponse): number {
    if (aiResponse.commands.length === 0) return 0.1;
    if (aiResponse.followUpQuestions && aiResponse.followUpQuestions.length > 0) return 0.6;
    if (aiResponse.explanation.includes('not sure') || aiResponse.explanation.includes('unclear')) return 0.5;
    return 0.8;
  }

  // Check if command requires confirmation
  private requiresConfirmation(intentType: CommandIntent['type']): boolean {
    const dangerousTypes = ['deploy', 'git'];
    return dangerousTypes.includes(intentType);
  }

  // Estimate execution time
  private estimateTime(commands: string[]): string {
    if (commands.length === 0) return '0s';
    
    const hasInstall = commands.some(cmd => cmd.includes('install') || cmd.includes('add'));
    const hasBuild = commands.some(cmd => cmd.includes('build'));
    const hasTest = commands.some(cmd => cmd.includes('test'));

    if (hasInstall) return '30s - 2m';
    if (hasBuild) return '10s - 1m';
    if (hasTest) return '5s - 30s';
    
    return '< 5s';
  }

  // Detect potential warnings
  private detectWarnings(commands: string[]): string[] {
    const warnings: string[] = [];
    
    for (const command of commands) {
      if (command.includes('rm -rf')) {
        warnings.push('This command will permanently delete files');
      }
      if (command.includes('sudo')) {
        warnings.push('This command requires administrator privileges');
      }
      if (command.includes('--force')) {
        warnings.push('This command uses force flag - be careful');
      }
    }
    
    return warnings;
  }

  // Initialize command templates
  private initializeTemplates(): void {
    this.commandTemplates = [
      {
        pattern: /install (.+)/i,
        intent: 'install',
        action: 'install_package',
        template: 'npm install $1',
        examples: ['install react', 'install lodash', 'install @types/node']
      },
      {
        pattern: /run (dev|development|start)/i,
        intent: 'run',
        action: 'start_dev',
        template: 'npm run dev',
        examples: ['run dev', 'start development server', 'run development']
      },
      {
        pattern: /build (project|app)?/i,
        intent: 'build',
        action: 'build_project',
        template: 'npm run build',
        examples: ['build project', 'build app', 'create build']
      },
      {
        pattern: /test/i,
        intent: 'test',
        action: 'run_tests',
        template: 'npm test',
        examples: ['run tests', 'test project', 'execute tests']
      },
      {
        pattern: /commit (.+)/i,
        intent: 'git',
        action: 'commit',
        template: 'git add . && git commit -m "$1"',
        examples: ['commit changes', 'commit "fix bug"', 'commit with message']
      },
      {
        pattern: /create (.+) (file|component)/i,
        intent: 'file',
        action: 'create_file',
        template: 'touch $1',
        examples: ['create new file', 'create component', 'create index.js file']
      }
    ];
  }

  // Initialize common patterns
  private initializeCommonPatterns(): void {
    this.commonPatterns.set('install', [
      'install dependencies',
      'install react',
      'install typescript',
      'install eslint',
      'install prettier'
    ]);
    
    this.commonPatterns.set('run', [
      'run dev server',
      'run tests',
      'run build',
      'run lint',
      'run format'
    ]);
    
    this.commonPatterns.set('git', [
      'git status',
      'git add all',
      'git commit',
      'git push',
      'git pull'
    ]);
    
    this.commonPatterns.set('create', [
      'create new component',
      'create new file',
      'create new folder',
      'create package.json'
    ]);
  }
}
