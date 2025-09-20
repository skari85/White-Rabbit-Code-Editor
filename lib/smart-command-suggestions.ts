'use client'

import { ProjectContext, CommandIntent } from './ai-terminal-bridge';
import { AIService } from './ai-service';
import { AISettings, AIMessage } from './ai-config';

export interface SmartSuggestion {
  command: string;
  description: string;
  category: 'setup' | 'development' | 'testing' | 'deployment' | 'maintenance' | 'git';
  confidence: number;
  reasoning: string;
  prerequisites?: string[];
  estimatedTime?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SuggestionContext {
  currentCommand?: string;
  recentCommands: string[];
  errorHistory: Array<{ command: string; error: string; timestamp: Date }>;
  projectFiles: string[];
  gitStatus?: string;
  packageJsonExists: boolean;
  hasNodeModules: boolean;
  hasTests: boolean;
}

export class SmartCommandSuggestions {
  private aiService: AIService;
  private projectContext: ProjectContext | null = null;
  private suggestionCache: Map<string, SmartSuggestion[]> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(aiSettings: AISettings) {
    this.aiService = new AIService(aiSettings);
  }

  updateProjectContext(context: ProjectContext): void {
    this.projectContext = context;
    // Clear cache when context changes
    this.suggestionCache.clear();
  }

  // Get contextual suggestions based on current state
  async getContextualSuggestions(context: SuggestionContext): Promise<SmartSuggestion[]> {
    const cacheKey = this.generateCacheKey(context);
    
    // Check cache first
    if (this.suggestionCache.has(cacheKey)) {
      const cached = this.suggestionCache.get(cacheKey)!;
      return cached;
    }

    try {
      const suggestions = await this.generateSuggestions(context);
      
      // Cache the results
      this.suggestionCache.set(cacheKey, suggestions);
      setTimeout(() => this.suggestionCache.delete(cacheKey), this.cacheTimeout);
      
      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return this.getFallbackSuggestions(context);
    }
  }

  // Get suggestions for specific scenarios
  async getSuggestionsForScenario(scenario: string): Promise<SmartSuggestion[]> {
    const scenarios = {
      'new-project': this.getNewProjectSuggestions(),
      'dependency-issues': this.getDependencyIssueSuggestions(),
      'build-errors': this.getBuildErrorSuggestions(),
      'git-workflow': this.getGitWorkflowSuggestions(),
      'testing': this.getTestingSuggestions(),
      'deployment': this.getDeploymentSuggestions()
    };

    return scenarios[scenario as keyof typeof scenarios] || [];
  }

  // Generate AI-powered suggestions
  private async generateSuggestions(context: SuggestionContext): Promise<SmartSuggestion[]> {
    const systemPrompt = this.buildSuggestionsPrompt();
    const userPrompt = this.buildContextPrompt(context);

    const messages: AIMessage[] = [
      {
        id: Date.now().toString(),
        role: 'user',
        content: userPrompt,
        timestamp: new Date()
      }
    ];

    const response = await this.aiService.sendMessage(messages);
    return this.parseSuggestionsResponse(response.content);
  }

  private buildSuggestionsPrompt(): string {
    return `You are an expert development assistant that provides smart command suggestions.
    
    Analyze the project context and provide relevant terminal command suggestions.
    
    Return a JSON array of suggestions with this structure:
    [
      {
        "command": "exact command to run",
        "description": "clear description of what this does",
        "category": "setup|development|testing|deployment|maintenance|git",
        "confidence": 0.9,
        "reasoning": "why this command is suggested",
        "prerequisites": ["optional array of prerequisites"],
        "estimatedTime": "estimated execution time",
        "riskLevel": "low|medium|high"
      }
    ]
    
    Guidelines:
    1. Suggest 3-5 most relevant commands
    2. Consider project type, current state, and recent activity
    3. Prioritize safe, commonly used commands
    4. Include both immediate actions and workflow improvements
    5. Consider error history to suggest preventive measures`;
  }

  private buildContextPrompt(context: SuggestionContext): string {
    const projectInfo = this.projectContext ? `
    Project Type: ${this.projectContext.projectType}
    Dependencies: ${this.projectContext.dependencies.slice(0, 10).join(', ')}
    Current Directory: ${this.projectContext.currentDirectory}
    ` : 'No project context available';

    return `Project Context:
    ${projectInfo}
    
    Current State:
    - Recent Commands: ${context.recentCommands.slice(-5).join(', ')}
    - Has package.json: ${context.packageJsonExists}
    - Has node_modules: ${context.hasNodeModules}
    - Has tests: ${context.hasTests}
    - Project Files: ${context.projectFiles.slice(0, 10).join(', ')}
    
    ${context.errorHistory.length > 0 ? `
    Recent Errors:
    ${context.errorHistory.slice(-3).map(e => `${e.command}: ${e.error}`).join('\n')}
    ` : ''}
    
    Please suggest relevant commands for this development context.`;
  }

  private parseSuggestionsResponse(content: string): SmartSuggestion[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((item: any) => ({
          command: item.command || '',
          description: item.description || '',
          category: item.category || 'development',
          confidence: item.confidence || 0.5,
          reasoning: item.reasoning || '',
          prerequisites: item.prerequisites || [],
          estimatedTime: item.estimatedTime || '< 1m',
          riskLevel: item.riskLevel || 'low'
        }));
      }
    } catch (error) {
      console.error('Error parsing suggestions response:', error);
    }
    
    return [];
  }

  private getFallbackSuggestions(context: SuggestionContext): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Basic project setup suggestions
    if (!context.packageJsonExists) {
      suggestions.push({
        command: 'npm init -y',
        description: 'Initialize a new Node.js project',
        category: 'setup',
        confidence: 0.9,
        reasoning: 'No package.json found, project needs initialization',
        estimatedTime: '< 30s',
        riskLevel: 'low'
      });
    }

    if (context.packageJsonExists && !context.hasNodeModules) {
      suggestions.push({
        command: 'npm install',
        description: 'Install project dependencies',
        category: 'setup',
        confidence: 0.95,
        reasoning: 'package.json exists but node_modules is missing',
        estimatedTime: '30s - 2m',
        riskLevel: 'low'
      });
    }

    // Development suggestions based on project type
    if (this.projectContext?.projectType === 'react' || this.projectContext?.projectType === 'next') {
      suggestions.push({
        command: 'npm run dev',
        description: 'Start development server',
        category: 'development',
        confidence: 0.8,
        reasoning: 'React/Next.js project detected',
        estimatedTime: '< 10s',
        riskLevel: 'low'
      });
    }

    // Git suggestions
    suggestions.push({
      command: 'git status',
      description: 'Check git repository status',
      category: 'git',
      confidence: 0.7,
      reasoning: 'Always useful to check current git state',
      estimatedTime: '< 5s',
      riskLevel: 'low'
    });

    return suggestions;
  }

  // Predefined suggestion sets for common scenarios
  private getNewProjectSuggestions(): SmartSuggestion[] {
    return [
      {
        command: 'npm init -y',
        description: 'Initialize new Node.js project',
        category: 'setup',
        confidence: 0.9,
        reasoning: 'Standard first step for new projects',
        estimatedTime: '< 30s',
        riskLevel: 'low'
      },
      {
        command: 'git init',
        description: 'Initialize git repository',
        category: 'git',
        confidence: 0.9,
        reasoning: 'Version control is essential for any project',
        estimatedTime: '< 5s',
        riskLevel: 'low'
      },
      {
        command: 'touch README.md',
        description: 'Create project README file',
        category: 'setup',
        confidence: 0.8,
        reasoning: 'Documentation is important from the start',
        estimatedTime: '< 5s',
        riskLevel: 'low'
      }
    ];
  }

  private getDependencyIssueSuggestions(): SmartSuggestion[] {
    return [
      {
        command: 'npm install',
        description: 'Reinstall dependencies',
        category: 'maintenance',
        confidence: 0.8,
        reasoning: 'Often fixes dependency-related issues',
        estimatedTime: '30s - 2m',
        riskLevel: 'low'
      },
      {
        command: 'rm -rf node_modules package-lock.json && npm install',
        description: 'Clean reinstall of dependencies',
        category: 'maintenance',
        confidence: 0.9,
        reasoning: 'Resolves most dependency conflicts',
        estimatedTime: '1-3m',
        riskLevel: 'medium'
      },
      {
        command: 'npm audit fix',
        description: 'Fix security vulnerabilities',
        category: 'maintenance',
        confidence: 0.7,
        reasoning: 'Addresses security issues in dependencies',
        estimatedTime: '30s - 1m',
        riskLevel: 'medium'
      }
    ];
  }

  private getBuildErrorSuggestions(): SmartSuggestion[] {
    return [
      {
        command: 'npm run build',
        description: 'Retry build process',
        category: 'development',
        confidence: 0.6,
        reasoning: 'Sometimes transient issues resolve on retry',
        estimatedTime: '30s - 2m',
        riskLevel: 'low'
      },
      {
        command: 'npm run lint',
        description: 'Check for code style issues',
        category: 'development',
        confidence: 0.8,
        reasoning: 'Linting errors often cause build failures',
        estimatedTime: '10s - 30s',
        riskLevel: 'low'
      },
      {
        command: 'npm run type-check',
        description: 'Check TypeScript types',
        category: 'development',
        confidence: 0.7,
        reasoning: 'Type errors are common build failure causes',
        estimatedTime: '10s - 1m',
        riskLevel: 'low'
      }
    ];
  }

  private getGitWorkflowSuggestions(): SmartSuggestion[] {
    return [
      {
        command: 'git add .',
        description: 'Stage all changes',
        category: 'git',
        confidence: 0.8,
        reasoning: 'Common first step in git workflow',
        estimatedTime: '< 5s',
        riskLevel: 'low'
      },
      {
        command: 'git commit -m "Update"',
        description: 'Commit staged changes',
        category: 'git',
        confidence: 0.7,
        reasoning: 'Next step after staging changes',
        estimatedTime: '< 5s',
        riskLevel: 'low'
      },
      {
        command: 'git push',
        description: 'Push commits to remote',
        category: 'git',
        confidence: 0.6,
        reasoning: 'Share changes with remote repository',
        estimatedTime: '5s - 30s',
        riskLevel: 'medium'
      }
    ];
  }

  private getTestingSuggestions(): SmartSuggestion[] {
    return [
      {
        command: 'npm test',
        description: 'Run test suite',
        category: 'testing',
        confidence: 0.9,
        reasoning: 'Essential for code quality assurance',
        estimatedTime: '10s - 2m',
        riskLevel: 'low'
      },
      {
        command: 'npm run test:watch',
        description: 'Run tests in watch mode',
        category: 'testing',
        confidence: 0.8,
        reasoning: 'Useful for continuous testing during development',
        estimatedTime: 'continuous',
        riskLevel: 'low'
      },
      {
        command: 'npm run test:coverage',
        description: 'Run tests with coverage report',
        category: 'testing',
        confidence: 0.7,
        reasoning: 'Helps identify untested code areas',
        estimatedTime: '15s - 3m',
        riskLevel: 'low'
      }
    ];
  }

  private getDeploymentSuggestions(): SmartSuggestion[] {
    return [
      {
        command: 'npm run build',
        description: 'Build for production',
        category: 'deployment',
        confidence: 0.9,
        reasoning: 'Required before deployment',
        estimatedTime: '30s - 5m',
        riskLevel: 'low'
      },
      {
        command: 'npm run preview',
        description: 'Preview production build',
        category: 'deployment',
        confidence: 0.8,
        reasoning: 'Test production build locally',
        estimatedTime: '< 10s',
        riskLevel: 'low'
      },
      {
        command: 'npm run deploy',
        description: 'Deploy to production',
        category: 'deployment',
        confidence: 0.6,
        reasoning: 'Final deployment step',
        estimatedTime: '1-10m',
        riskLevel: 'high'
      }
    ];
  }

  private generateCacheKey(context: SuggestionContext): string {
    return JSON.stringify({
      projectType: this.projectContext?.projectType,
      recentCommands: context.recentCommands.slice(-3),
      packageJsonExists: context.packageJsonExists,
      hasNodeModules: context.hasNodeModules,
      hasTests: context.hasTests
    });
  }
}
