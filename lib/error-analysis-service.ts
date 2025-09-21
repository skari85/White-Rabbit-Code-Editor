'use client'

import { AIMessage, AISettings } from './ai-config';
import { AIService } from './ai-service';
import { ErrorAnalysis, ProjectContext } from './ai-terminal-bridge';

export interface ErrorPattern {
  pattern: RegExp;
  type: ErrorAnalysis['errorType'];
  commonCauses: string[];
  quickFixes: Array<{
    command: string;
    description: string;
    confidence: number;
  }>;
}

export interface ErrorContext {
  command: string;
  output: string;
  exitCode?: number;
  workingDirectory: string;
  environment: Record<string, string>;
  timestamp: Date;
  projectContext?: ProjectContext;
}

export interface DetailedErrorAnalysis extends ErrorAnalysis {
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'build' | 'runtime' | 'dependency' | 'configuration' | 'permission' | 'network' | 'git';
  impact: string;
  preventionTips: string[];
  learnMoreLinks: string[];
  similarIssues: Array<{
    description: string;
    solution: string;
    frequency: number;
  }>;
}

export class ErrorAnalysisService {
  private aiService: AIService;
  private errorPatterns: ErrorPattern[] = [];
  private errorHistory: Map<string, DetailedErrorAnalysis[]> = new Map();
  private maxHistorySize = 100;

  constructor(aiSettings: AISettings) {
    this.aiService = new AIService(aiSettings);
    this.initializeErrorPatterns();
  }

  // Analyze error with full context
  async analyzeError(context: ErrorContext): Promise<DetailedErrorAnalysis> {
    // Try pattern matching first for quick resolution
    const quickAnalysis = this.tryPatternMatching(context);
    if (quickAnalysis && quickAnalysis.confidence > 0.8) {
      this.addToHistory(context.command, quickAnalysis);
      return quickAnalysis;
    }

    // Use AI for complex analysis
    try {
      const aiAnalysis = await this.performAIAnalysis(context);
      this.addToHistory(context.command, aiAnalysis);
      return aiAnalysis;
    } catch (error) {
      console.error('AI analysis failed:', error);
      return quickAnalysis || this.getFallbackAnalysis(context);
    }
  }

  // Get error history for learning
  getErrorHistory(command?: string): DetailedErrorAnalysis[] {
    if (command) {
      return this.errorHistory.get(command) || [];
    }
    
    const allErrors: DetailedErrorAnalysis[] = [];
    for (const errors of this.errorHistory.values()) {
      allErrors.push(...errors);
    }
    
    return allErrors.sort((a, b) => 
      new Date(b.relatedFiles?.[0] || '').getTime() - new Date(a.relatedFiles?.[0] || '').getTime()
    ).slice(0, 50);
  }

  // Get common error patterns for prevention
  getCommonErrorPatterns(): Array<{ pattern: string; prevention: string; frequency: number }> {
    const patterns = new Map<string, number>();
    
    for (const errors of this.errorHistory.values()) {
      for (const error of errors) {
        const key = `${error.errorType}:${error.category}`;
        patterns.set(key, (patterns.get(key) || 0) + 1);
      }
    }

    return Array.from(patterns.entries())
      .map(([pattern, frequency]) => {
        const [type, category] = pattern.split(':');
        return {
          pattern: `${type} (${category})`,
          prevention: this.getPreventionTip(type as ErrorAnalysis['errorType']),
          frequency
        };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  // Try pattern matching for quick resolution
  private tryPatternMatching(context: ErrorContext): DetailedErrorAnalysis | null {
    for (const pattern of this.errorPatterns) {
      if (pattern.pattern.test(context.output)) {
        return {
          errorType: pattern.type,
          description: this.extractErrorDescription(context.output, pattern),
          suggestedFixes: pattern.quickFixes,
          explanation: this.generateExplanation(pattern, context),
          relatedFiles: this.extractRelatedFiles(context.output),
          confidence: 0.9, // High confidence for pattern matches
          severity: this.determineSeverity(pattern.type),
          category: this.determineCategory(pattern.type),
          impact: this.determineImpact(pattern.type),
          preventionTips: this.getPreventionTips(pattern.type),
          learnMoreLinks: this.getLearnMoreLinks(pattern.type),
          similarIssues: this.getSimilarIssues(pattern.type)
        };
      }
    }
    return null;
  }

  // Perform AI-powered analysis
  private async performAIAnalysis(context: ErrorContext): Promise<DetailedErrorAnalysis> {
    const systemPrompt = this.buildAnalysisPrompt();
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
    return this.parseAIAnalysis(response.content, context);
  }

  private buildAnalysisPrompt(): string {
    return `You are an expert developer assistant specializing in terminal error analysis and resolution.

    Analyze the error output and provide comprehensive solutions and insights.

    Return a JSON object with this structure:
    {
      "errorType": "syntax|dependency|permission|network|configuration|runtime|unknown",
      "description": "Clear, concise description of the error",
      "suggestedFixes": [
        {
          "command": "exact command to run",
          "description": "what this command does and why it helps",
          "confidence": 0.9
        }
      ],
      "explanation": "Detailed explanation of why this error occurred",
      "relatedFiles": ["file1.js", "package.json"],
      "severity": "low|medium|high|critical",
      "category": "build|runtime|dependency|configuration|permission|network|git",
      "impact": "description of how this affects the project",
      "preventionTips": ["tip1", "tip2"],
      "learnMoreLinks": ["https://example.com/docs"],
      "similarIssues": [
        {
          "description": "similar issue description",
          "solution": "how it was solved",
          "frequency": 0.8
        }
      ]
    }

    Guidelines:
    1. Provide specific, actionable solutions
    2. Explain the root cause clearly
    3. Suggest prevention strategies
    4. Include relevant documentation links
    5. Consider project context and environment`;
  }

  private buildContextPrompt(context: ErrorContext): string {
    const projectInfo = context.projectContext ? `
    Project Type: ${context.projectContext.projectType}
    Dependencies: ${context.projectContext.dependencies.slice(0, 10).join(', ')}
    Current Directory: ${context.projectContext.currentDirectory}
    ` : 'No project context available';

    return `Error Analysis Request:

    Command: ${context.command}
    Exit Code: ${context.exitCode || 'unknown'}
    Working Directory: ${context.workingDirectory}
    
    Error Output:
    ${context.output}
    
    Project Context:
    ${projectInfo}
    
    Environment Variables:
    ${Object.entries(context.environment).slice(0, 5).map(([k, v]) => `${k}=${v}`).join('\n')}
    
    Please analyze this error and provide comprehensive solutions.`;
  }

  private parseAIAnalysis(content: string, context: ErrorContext): DetailedErrorAnalysis {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          errorType: parsed.errorType || 'unknown',
          description: parsed.description || 'Unknown error',
          suggestedFixes: parsed.suggestedFixes || [],
          explanation: parsed.explanation || 'No explanation available',
          relatedFiles: parsed.relatedFiles || [],
          confidence: parsed.confidence || 0.7, // Medium confidence for AI analysis
          severity: parsed.severity || 'medium',
          category: parsed.category || 'runtime',
          impact: parsed.impact || 'Unknown impact',
          preventionTips: parsed.preventionTips || [],
          learnMoreLinks: parsed.learnMoreLinks || [],
          similarIssues: parsed.similarIssues || []
        };
      }
    } catch (error) {
      console.error('Error parsing AI analysis:', error);
    }

    return this.getFallbackAnalysis(context);
  }

  private getFallbackAnalysis(context: ErrorContext): DetailedErrorAnalysis {
    return {
      errorType: 'unknown',
      description: 'An error occurred while executing the command',
      suggestedFixes: [
        {
          command: context.command,
          description: 'Try running the command again',
          confidence: 0.3
        }
      ],
      explanation: 'Unable to analyze this error automatically. Please check the command syntax and try again.',
      relatedFiles: [],
      confidence: 0.3, // Low confidence for fallback analysis
      severity: 'medium',
      category: 'runtime',
      impact: 'Command execution failed',
      preventionTips: ['Double-check command syntax', 'Verify file permissions'],
      learnMoreLinks: [],
      similarIssues: []
    };
  }

  private addToHistory(command: string, analysis: DetailedErrorAnalysis): void {
    if (!this.errorHistory.has(command)) {
      this.errorHistory.set(command, []);
    }
    
    const history = this.errorHistory.get(command)!;
    history.unshift(analysis);
    
    // Limit history size
    if (history.length > 10) {
      history.splice(10);
    }
    
    // Limit total history size
    if (this.errorHistory.size > this.maxHistorySize) {
      const oldestKey = this.errorHistory.keys().next().value;
      if (oldestKey) {
        this.errorHistory.delete(oldestKey);
      }
    }
  }

  private initializeErrorPatterns(): void {
    this.errorPatterns = [
      {
        pattern: /npm ERR! code ENOENT/i,
        type: 'dependency',
        commonCauses: ['Missing package.json', 'Invalid npm command', 'Corrupted npm cache'],
        quickFixes: [
          { command: 'npm init -y', description: 'Initialize package.json', confidence: 0.8 },
          { command: 'npm cache clean --force', description: 'Clear npm cache', confidence: 0.6 }
        ]
      },
      {
        pattern: /Module not found|Cannot resolve module/i,
        type: 'dependency',
        commonCauses: ['Missing dependency', 'Incorrect import path', 'Case sensitivity'],
        quickFixes: [
          { command: 'npm install', description: 'Install missing dependencies', confidence: 0.9 },
          { command: 'npm install --save', description: 'Install and save dependency', confidence: 0.7 }
        ]
      },
      {
        pattern: /Permission denied|EACCES/i,
        type: 'permission',
        commonCauses: ['Insufficient permissions', 'File ownership issues'],
        quickFixes: [
          { command: 'sudo chown -R $(whoami) .', description: 'Fix ownership', confidence: 0.8 },
          { command: 'chmod +x', description: 'Add execute permission', confidence: 0.6 }
        ]
      },
      {
        pattern: /Port \d+ is already in use|EADDRINUSE/i,
        type: 'network',
        commonCauses: ['Port already occupied', 'Previous process not terminated'],
        quickFixes: [
          { command: 'lsof -ti:3000 | xargs kill -9', description: 'Kill process on port 3000', confidence: 0.9 },
          { command: 'npm run dev -- --port 3001', description: 'Use different port', confidence: 0.8 }
        ]
      },
      {
        pattern: /SyntaxError|Unexpected token/i,
        type: 'syntax',
        commonCauses: ['Invalid JavaScript/JSON syntax', 'Missing brackets or quotes'],
        quickFixes: [
          { command: 'npm run lint', description: 'Check for syntax errors', confidence: 0.8 },
          { command: 'npm run format', description: 'Auto-format code', confidence: 0.6 }
        ]
      }
    ];
  }

  private extractErrorDescription(output: string, pattern: ErrorPattern): string {
    const lines = output.split('\n');
    const errorLine = lines.find(line => pattern.pattern.test(line));
    return errorLine?.trim() || 'Error detected';
  }

  private extractRelatedFiles(output: string): string[] {
    const filePattern = /(?:at|in|from)\s+([^\s]+\.(js|ts|jsx|tsx|json|css|scss))/gi;
    const matches = output.match(filePattern) || [];
    return [...new Set(matches.map(match => match.replace(/^(?:at|in|from)\s+/, '')))];
  }

  private generateExplanation(pattern: ErrorPattern, context: ErrorContext): string {
    return `This ${pattern.type} error typically occurs due to: ${pattern.commonCauses.join(', ')}. 
    The command '${context.command}' failed because of this issue.`;
  }

  private determineSeverity(errorType: ErrorAnalysis['errorType']): DetailedErrorAnalysis['severity'] {
    const severityMap: Record<ErrorAnalysis['errorType'], DetailedErrorAnalysis['severity']> = {
      syntax: 'high',
      dependency: 'medium',
      permission: 'high',
      network: 'medium',
      configuration: 'medium',
      runtime: 'high',
      unknown: 'medium'
    };
    return severityMap[errorType] || 'medium';
  }

  private determineCategory(errorType: ErrorAnalysis['errorType']): DetailedErrorAnalysis['category'] {
    const categoryMap: Record<ErrorAnalysis['errorType'], DetailedErrorAnalysis['category']> = {
      syntax: 'build',
      dependency: 'dependency',
      permission: 'permission',
      network: 'network',
      configuration: 'configuration',
      runtime: 'runtime',
      unknown: 'runtime'
    };
    return categoryMap[errorType] || 'runtime';
  }

  private determineImpact(errorType: ErrorAnalysis['errorType']): string {
    const impactMap: Record<ErrorAnalysis['errorType'], string> = {
      syntax: 'Code compilation and execution blocked',
      dependency: 'Missing functionality, build may fail',
      permission: 'File operations blocked, commands may fail',
      network: 'Network operations blocked, services unavailable',
      configuration: 'Application may not work as expected',
      runtime: 'Application execution interrupted',
      unknown: 'Unknown impact on application'
    };
    return impactMap[errorType] || 'Unknown impact';
  }

  private getPreventionTips(errorType: ErrorAnalysis['errorType']): string[] {
    const tipsMap: Record<ErrorAnalysis['errorType'], string[]> = {
      syntax: ['Use a linter', 'Enable syntax highlighting', 'Use TypeScript for type checking'],
      dependency: ['Keep dependencies updated', 'Use exact versions in package.json', 'Regular dependency audits'],
      permission: ['Avoid using sudo with npm', 'Set proper file permissions', 'Use nvm for Node.js management'],
      network: ['Check for running processes', 'Use different ports for development', 'Implement graceful shutdowns'],
      configuration: ['Validate configuration files', 'Use environment variables', 'Document configuration requirements'],
      runtime: ['Add error handling', 'Use try-catch blocks', 'Implement logging'],
      unknown: ['Add debugging output', 'Check logs', 'Reproduce in isolated environment']
    };
    return tipsMap[errorType] || [];
  }

  private getPreventionTip(errorType: ErrorAnalysis['errorType']): string {
    const tips = this.getPreventionTips(errorType);
    return tips[0] || 'Follow best practices';
  }

  private getLearnMoreLinks(errorType: ErrorAnalysis['errorType']): string[] {
    const linksMap: Record<ErrorAnalysis['errorType'], string[]> = {
      syntax: ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors'],
      dependency: ['https://docs.npmjs.com/troubleshooting'],
      permission: ['https://docs.npmjs.com/resolving-eacces-permissions-errors'],
      network: ['https://nodejs.org/api/net.html'],
      configuration: ['https://nodejs.org/api/process.html#process_process_env'],
      runtime: ['https://nodejs.org/api/errors.html'],
      unknown: ['https://nodejs.org/api/']
    };
    return linksMap[errorType] || [];
  }

  private getSimilarIssues(errorType: ErrorAnalysis['errorType']): DetailedErrorAnalysis['similarIssues'] {
    // This would typically come from a database of known issues
    return [
      {
        description: `Common ${errorType} error pattern`,
        solution: 'Standard resolution approach',
        frequency: 0.7
      }
    ];
  }
}
