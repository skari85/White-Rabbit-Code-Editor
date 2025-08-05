import { AIService } from './ai-service';
import { AISettings } from './ai-config';

export interface CodeInspection {
  id: string;
  type: 'error' | 'warning' | 'info' | 'hint';
  severity: 'critical' | 'major' | 'minor';
  message: string;
  description?: string;
  quickFix?: QuickFix;
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  category: InspectionCategory;
  ruleId?: string;
}

export interface QuickFix {
  title: string;
  description: string;
  edits: CodeEdit[];
  kind: 'quickfix' | 'refactor' | 'source';
}

export interface CodeEdit {
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  text: string;
}

export type InspectionCategory = 
  | 'syntax' 
  | 'type-checking' 
  | 'code-style' 
  | 'performance' 
  | 'security' 
  | 'accessibility' 
  | 'best-practices' 
  | 'unused-code' 
  | 'complexity';

export interface InspectionConfig {
  enabledCategories: InspectionCategory[];
  severity: Record<string, 'error' | 'warning' | 'info' | 'hint'>;
  customRules: CustomRule[];
  aiEnhanced: boolean;
}

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'hint';
  category: InspectionCategory;
}

export class QuickFixService {
  static applyQuickFix(code: string, quickFix: QuickFix): string {
    let result = code;
    const lines = code.split('\n');

    // Apply edits in reverse order to maintain line/column positions
    const sortedEdits = [...quickFix.edits].sort((a, b) => {
      if (a.range.startLineNumber !== b.range.startLineNumber) {
        return b.range.startLineNumber - a.range.startLineNumber;
      }
      return b.range.startColumn - a.range.startColumn;
    });

    for (const edit of sortedEdits) {
      const lineIndex = edit.range.startLineNumber - 1;
      const line = lines[lineIndex];

      if (line !== undefined) {
        const before = line.substring(0, edit.range.startColumn - 1);
        const after = line.substring(edit.range.endColumn - 1);
        lines[lineIndex] = before + edit.text + after;
      }
    }

    return lines.join('\n');
  }

  static generateQuickFix(
    inspection: CodeInspection,
    code: string
  ): QuickFix | null {
    const lines = code.split('\n');
    const lineIndex = inspection.range.startLineNumber - 1;
    const line = lines[lineIndex];

    if (!line) return null;

    // Generate context-specific quick fixes
    switch (inspection.category) {
      case 'code-style':
        return QuickFixService.generateStyleFix(inspection, line);
      case 'unused-code':
        return QuickFixService.generateUnusedCodeFix(inspection, line);
      case 'performance':
        return QuickFixService.generatePerformanceFix(inspection, line);
      case 'security':
        return QuickFixService.generateSecurityFix(inspection, line);
      default:
        return null;
    }
  }

  private static generateStyleFix(inspection: CodeInspection, line: string): QuickFix | null {
    if (inspection.message.includes('semicolon')) {
      return {
        title: 'Add semicolon',
        description: 'Add missing semicolon',
        kind: 'quickfix',
        edits: [{
          range: inspection.range,
          text: ';'
        }]
      };
    }

    if (inspection.message.includes('trailing whitespace')) {
      return {
        title: 'Remove trailing whitespace',
        description: 'Remove trailing whitespace',
        kind: 'quickfix',
        edits: [{
          range: inspection.range,
          text: ''
        }]
      };
    }

    return null;
  }

  private static generateUnusedCodeFix(inspection: CodeInspection, line: string): QuickFix | null {
    if (inspection.message.includes('Unused variable')) {
      return {
        title: 'Remove unused variable',
        description: 'Remove the unused variable declaration',
        kind: 'quickfix',
        edits: [{
          range: {
            startLineNumber: inspection.range.startLineNumber,
            startColumn: 1,
            endLineNumber: inspection.range.startLineNumber + 1,
            endColumn: 1
          },
          text: ''
        }]
      };
    }

    return null;
  }

  private static generatePerformanceFix(inspection: CodeInspection, line: string): QuickFix | null {
    if (inspection.message.includes('DOM query in loop')) {
      return {
        title: 'Cache DOM query',
        description: 'Move DOM query outside the loop',
        kind: 'refactor',
        edits: [{
          range: inspection.range,
          text: '// TODO: Cache this DOM query outside the loop'
        }]
      };
    }

    return null;
  }

  private static generateSecurityFix(inspection: CodeInspection, line: string): QuickFix | null {
    if (inspection.message.includes('eval')) {
      return {
        title: 'Replace eval with safer alternative',
        description: 'Replace eval() with JSON.parse() or other safe methods',
        kind: 'quickfix',
        edits: [{
          range: inspection.range,
          text: '// TODO: Replace eval() with safer alternative like JSON.parse()'
        }]
      };
    }

    return null;
  }
}

export class CodeInspectionService {
  private aiService: AIService | null = null;
  private cache = new Map<string, { inspections: CodeInspection[]; timestamp: number }>();
  private readonly CACHE_DURATION = 10000; // 10 seconds

  constructor(private config: InspectionConfig, aiSettings?: AISettings) {
    if (aiSettings?.apiKey && aiSettings.provider) {
      this.aiService = new AIService(aiSettings);
    }
  }

  updateConfig(config: InspectionConfig) {
    this.config = config;
    this.clearCache();
  }

  updateAISettings(aiSettings: AISettings) {
    if (aiSettings.apiKey && aiSettings.provider) {
      this.aiService = new AIService(aiSettings);
    } else {
      this.aiService = null;
    }
    this.clearCache();
  }

  private getCacheKey(code: string, fileName: string, language: string): string {
    return `${fileName}:${language}:${this.hashCode(code)}`;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  clearCache() {
    this.cache.clear();
  }

  async inspectCode(
    code: string, 
    fileName: string, 
    language: string,
    projectContext?: { files: Array<{ name: string; content: string }> }
  ): Promise<CodeInspection[]> {
    const cacheKey = this.getCacheKey(code, fileName, language);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isValidCache(cached.timestamp)) {
      return cached.inspections;
    }

    const inspections: CodeInspection[] = [];

    // Run basic inspections
    inspections.push(...this.runBasicInspections(code, fileName, language));

    // Run AI-enhanced inspections if available
    if (this.config.aiEnhanced && this.aiService) {
      try {
        const aiInspections = await this.runAIInspections(code, fileName, language, projectContext);
        inspections.push(...aiInspections);
      } catch (error) {
        console.warn('AI inspections failed:', error);
      }
    }

    // Filter by enabled categories and apply severity overrides
    const filteredInspections = this.filterAndProcessInspections(inspections);

    // Cache results
    this.cache.set(cacheKey, { inspections: filteredInspections, timestamp: Date.now() });

    return filteredInspections;
  }

  private runBasicInspections(code: string, fileName: string, language: string): CodeInspection[] {
    const inspections: CodeInspection[] = [];
    const lines = code.split('\n');

    // Syntax and basic checks
    inspections.push(...this.checkSyntaxIssues(code, lines, language));
    inspections.push(...this.checkCodeStyle(code, lines, language));
    inspections.push(...this.checkUnusedCode(code, lines, language));
    inspections.push(...this.checkComplexity(code, lines, language));
    inspections.push(...this.checkSecurity(code, lines, language));
    inspections.push(...this.checkPerformance(code, lines, language));

    return inspections;
  }

  private checkSyntaxIssues(code: string, lines: string[], language: string): CodeInspection[] {
    const inspections: CodeInspection[] = [];

    if (language === 'javascript' || language === 'typescript') {
      // Check for common syntax issues
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        
        // Missing semicolons (basic check)
        if (line.trim().match(/^(const|let|var|return|throw)\s+.*[^;{}\s]$/)) {
          inspections.push({
            id: `missing-semicolon-${lineNumber}`,
            type: 'warning',
            severity: 'minor',
            message: 'Missing semicolon',
            description: 'Consider adding a semicolon for consistency',
            category: 'code-style',
            range: {
              startLineNumber: lineNumber,
              startColumn: line.length,
              endLineNumber: lineNumber,
              endColumn: line.length + 1
            },
            quickFix: {
              title: 'Add semicolon',
              description: 'Add missing semicolon',
              kind: 'quickfix',
              edits: [{
                range: {
                  startLineNumber: lineNumber,
                  startColumn: line.length + 1,
                  endLineNumber: lineNumber,
                  endColumn: line.length + 1
                },
                text: ';'
              }]
            }
          });
        }

        // Unused variables (basic check)
        const varMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
        if (varMatch) {
          const varName = varMatch[1];
          const isUsed = code.includes(varName) && code.indexOf(varName) !== code.lastIndexOf(varName);
          
          if (!isUsed) {
            inspections.push({
              id: `unused-variable-${lineNumber}-${varName}`,
              type: 'warning',
              severity: 'minor',
              message: `Unused variable '${varName}'`,
              description: 'This variable is declared but never used',
              category: 'unused-code',
              range: {
                startLineNumber: lineNumber,
                startColumn: line.indexOf(varName) + 1,
                endLineNumber: lineNumber,
                endColumn: line.indexOf(varName) + varName.length + 1
              },
              quickFix: {
                title: `Remove unused variable '${varName}'`,
                description: 'Remove the unused variable declaration',
                kind: 'quickfix',
                edits: [{
                  range: {
                    startLineNumber: lineNumber,
                    startColumn: 1,
                    endLineNumber: lineNumber + 1,
                    endColumn: 1
                  },
                  text: ''
                }]
              }
            });
          }
        }
      });
    }

    return inspections;
  }

  private checkCodeStyle(code: string, lines: string[], language: string): CodeInspection[] {
    const inspections: CodeInspection[] = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for trailing whitespace
      if (line.match(/\s+$/)) {
        inspections.push({
          id: `trailing-whitespace-${lineNumber}`,
          type: 'info',
          severity: 'minor',
          message: 'Trailing whitespace',
          description: 'Remove trailing whitespace for cleaner code',
          category: 'code-style',
          range: {
            startLineNumber: lineNumber,
            startColumn: line.trimEnd().length + 1,
            endLineNumber: lineNumber,
            endColumn: line.length + 1
          },
          quickFix: {
            title: 'Remove trailing whitespace',
            description: 'Remove trailing whitespace from this line',
            kind: 'quickfix',
            edits: [{
              range: {
                startLineNumber: lineNumber,
                startColumn: line.trimEnd().length + 1,
                endLineNumber: lineNumber,
                endColumn: line.length + 1
              },
              text: ''
            }]
          }
        });
      }

      // Check for inconsistent indentation (basic check)
      if (line.match(/^\t+ +/) || line.match(/^ +\t/)) {
        inspections.push({
          id: `mixed-indentation-${lineNumber}`,
          type: 'warning',
          severity: 'minor',
          message: 'Mixed indentation',
          description: 'Use consistent indentation (either tabs or spaces)',
          category: 'code-style',
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: line.search(/[^\s]/) + 1
          }
        });
      }
    });

    return inspections;
  }

  private checkUnusedCode(code: string, lines: string[], language: string): CodeInspection[] {
    // Basic unused code detection - can be enhanced with AST parsing
    return [];
  }

  private checkComplexity(code: string, lines: string[], language: string): CodeInspection[] {
    const inspections: CodeInspection[] = [];

    // Check for long functions (basic metric)
    let functionStart = -1;
    let braceCount = 0;
    
    lines.forEach((line, index) => {
      if (line.match(/function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>/)) {
        functionStart = index;
        braceCount = 0;
      }
      
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      if (functionStart >= 0 && braceCount === 0 && index - functionStart > 50) {
        inspections.push({
          id: `long-function-${functionStart}`,
          type: 'warning',
          severity: 'major',
          message: 'Function is too long',
          description: 'Consider breaking this function into smaller, more focused functions',
          category: 'complexity',
          range: {
            startLineNumber: functionStart + 1,
            startColumn: 1,
            endLineNumber: index + 1,
            endColumn: lines[index].length + 1
          }
        });
        functionStart = -1;
      }
    });

    return inspections;
  }

  private checkSecurity(code: string, lines: string[], language: string): CodeInspection[] {
    const inspections: CodeInspection[] = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for potential security issues
      if (line.includes('eval(')) {
        inspections.push({
          id: `eval-usage-${lineNumber}`,
          type: 'error',
          severity: 'critical',
          message: 'Avoid using eval()',
          description: 'eval() can execute arbitrary code and is a security risk',
          category: 'security',
          range: {
            startLineNumber: lineNumber,
            startColumn: line.indexOf('eval(') + 1,
            endLineNumber: lineNumber,
            endColumn: line.indexOf('eval(') + 5
          }
        });
      }

      if (line.includes('innerHTML') && line.includes('=')) {
        inspections.push({
          id: `innerHTML-xss-${lineNumber}`,
          type: 'warning',
          severity: 'major',
          message: 'Potential XSS vulnerability',
          description: 'Using innerHTML with user input can lead to XSS attacks',
          category: 'security',
          range: {
            startLineNumber: lineNumber,
            startColumn: line.indexOf('innerHTML') + 1,
            endLineNumber: lineNumber,
            endColumn: line.indexOf('innerHTML') + 9
          }
        });
      }
    });

    return inspections;
  }

  private checkPerformance(code: string, lines: string[], language: string): CodeInspection[] {
    const inspections: CodeInspection[] = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for performance issues
      if (line.includes('document.getElementById') && line.includes('for')) {
        inspections.push({
          id: `dom-query-in-loop-${lineNumber}`,
          type: 'warning',
          severity: 'major',
          message: 'DOM query in loop',
          description: 'Cache DOM queries outside loops for better performance',
          category: 'performance',
          range: {
            startLineNumber: lineNumber,
            startColumn: line.indexOf('document.getElementById') + 1,
            endLineNumber: lineNumber,
            endColumn: line.indexOf('document.getElementById') + 23
          }
        });
      }
    });

    return inspections;
  }

  private async runAIInspections(
    code: string, 
    fileName: string, 
    language: string,
    projectContext?: { files: Array<{ name: string; content: string }> }
  ): Promise<CodeInspection[]> {
    if (!this.aiService) return [];

    const contextInfo = projectContext ? 
      projectContext.files.slice(0, 3).map(f => `// ${f.name}\n${f.content.substring(0, 500)}`).join('\n\n') : '';

    const prompt = `Analyze this ${language} code for potential issues and improvements:

File: ${fileName}
\`\`\`${language}
${code}
\`\`\`

${contextInfo ? `Project Context:\n${contextInfo}` : ''}

Provide analysis in JSON format:
{
  "inspections": [
    {
      "type": "error|warning|info|hint",
      "severity": "critical|major|minor", 
      "message": "Brief issue description",
      "description": "Detailed explanation",
      "category": "syntax|type-checking|code-style|performance|security|accessibility|best-practices|unused-code|complexity",
      "lineNumber": 1,
      "startColumn": 1,
      "endColumn": 10,
      "quickFix": {
        "title": "Fix description",
        "newText": "replacement text"
      }
    }
  ]
}

Focus on:
- Code quality and best practices
- Performance optimizations
- Security vulnerabilities
- Accessibility issues
- Type safety (for TypeScript)
- Framework-specific patterns
- Potential bugs and edge cases

Return only the JSON object.`;

    try {
      const response = await this.aiService.sendMessage([{
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        timestamp: new Date()
      }]);

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.inspections.map((inspection: any, index: number) => ({
          id: `ai-inspection-${index}`,
          type: inspection.type,
          severity: inspection.severity,
          message: inspection.message,
          description: inspection.description,
          category: inspection.category,
          range: {
            startLineNumber: inspection.lineNumber,
            startColumn: inspection.startColumn,
            endLineNumber: inspection.lineNumber,
            endColumn: inspection.endColumn
          },
          quickFix: inspection.quickFix ? {
            title: inspection.quickFix.title,
            description: inspection.quickFix.title,
            kind: 'quickfix' as const,
            edits: [{
              range: {
                startLineNumber: inspection.lineNumber,
                startColumn: inspection.startColumn,
                endLineNumber: inspection.lineNumber,
                endColumn: inspection.endColumn
              },
              text: inspection.quickFix.newText
            }]
          } : undefined
        }));
      }
    } catch (error) {
      console.warn('AI inspection parsing failed:', error);
    }

    return [];
  }

  private filterAndProcessInspections(inspections: CodeInspection[]): CodeInspection[] {
    return inspections
      .filter(inspection => this.config.enabledCategories.includes(inspection.category))
      .map(inspection => ({
        ...inspection,
        type: this.config.severity[inspection.ruleId || inspection.id] || inspection.type
      }))
      .sort((a, b) => {
        const severityOrder = { critical: 0, major: 1, minor: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
  }
}
