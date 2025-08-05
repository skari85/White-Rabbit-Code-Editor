import { AIService } from './ai-service';
import { AISettings } from './ai-config';

export interface NavigationTarget {
  file: string;
  line: number;
  column: number;
  symbol: string;
  type: 'definition' | 'implementation' | 'reference' | 'type-definition';
  preview?: string;
  context?: string;
}

export interface SymbolInformation {
  name: string;
  kind: 'function' | 'variable' | 'class' | 'interface' | 'method' | 'property' | 'constant' | 'enum' | 'module';
  file: string;
  line: number;
  column: number;
  scope: string;
  signature?: string;
  documentation?: string;
  references: NavigationTarget[];
}

export interface BreadcrumbItem {
  label: string;
  file: string;
  line: number;
  column: number;
  type: 'file' | 'class' | 'method' | 'function' | 'property';
  icon?: string;
}

export interface ProjectStructure {
  files: Array<{
    name: string;
    content: string;
    type: string;
    symbols: SymbolInformation[];
  }>;
  dependencies: string[];
  frameworks: string[];
}

export class NavigationService {
  private aiService: AIService | null = null;
  private symbolCache = new Map<string, SymbolInformation[]>();
  private referenceCache = new Map<string, NavigationTarget[]>();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor(private projectStructure: ProjectStructure, aiSettings?: AISettings) {
    if (aiSettings?.apiKey && aiSettings.provider) {
      this.aiService = new AIService(aiSettings);
    }
  }

  updateProjectStructure(structure: ProjectStructure) {
    this.projectStructure = structure;
    this.clearCache();
  }

  updateAISettings(aiSettings: AISettings) {
    if (aiSettings.apiKey && aiSettings.provider) {
      this.aiService = new AIService(aiSettings);
    } else {
      this.aiService = null;
    }
  }

  clearCache() {
    this.symbolCache.clear();
    this.referenceCache.clear();
  }

  // Go to Definition
  async goToDefinition(
    file: string,
    line: number,
    column: number,
    symbol: string
  ): Promise<NavigationTarget[]> {
    const cacheKey = `${file}:${line}:${column}:${symbol}`;
    
    // Check cache first
    const cached = this.referenceCache.get(cacheKey);
    if (cached) return cached;

    const targets: NavigationTarget[] = [];

    // Basic symbol analysis
    const basicTargets = this.findBasicDefinitions(symbol);
    targets.push(...basicTargets);

    // AI-enhanced definition finding
    if (this.aiService) {
      try {
        const aiTargets = await this.findAIDefinitions(file, line, column, symbol);
        targets.push(...aiTargets);
      } catch (error) {
        console.warn('AI definition search failed:', error);
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueTargets = this.deduplicateTargets(targets);
    this.referenceCache.set(cacheKey, uniqueTargets);

    return uniqueTargets;
  }

  // Find Usages
  async findUsages(symbol: string, includeDeclaration = true): Promise<NavigationTarget[]> {
    const cacheKey = `usages:${symbol}:${includeDeclaration}`;
    const cached = this.referenceCache.get(cacheKey);
    if (cached) return cached;

    const usages: NavigationTarget[] = [];

    // Search across all project files
    for (const file of this.projectStructure.files) {
      const fileUsages = this.findSymbolInFile(file.name, file.content, symbol);
      usages.push(...fileUsages);
    }

    // AI-enhanced usage finding
    if (this.aiService) {
      try {
        const aiUsages = await this.findAIUsages(symbol);
        usages.push(...aiUsages);
      } catch (error) {
        console.warn('AI usage search failed:', error);
      }
    }

    const uniqueUsages = this.deduplicateTargets(usages);
    this.referenceCache.set(cacheKey, uniqueUsages);

    return uniqueUsages;
  }

  // Navigate to Related Files
  getRelatedFiles(currentFile: string): Array<{ file: string; relation: string; score: number }> {
    const related: Array<{ file: string; relation: string; score: number }> = [];
    const currentContent = this.projectStructure.files.find(f => f.name === currentFile)?.content || '';

    for (const file of this.projectStructure.files) {
      if (file.name === currentFile) continue;

      let score = 0;
      let relation = 'related';

      // Check for imports
      if (currentContent.includes(file.name) || file.content.includes(currentFile)) {
        score += 10;
        relation = 'imported';
      }

      // Check for similar names
      const currentBase = currentFile.replace(/\.[^/.]+$/, '');
      const fileBase = file.name.replace(/\.[^/.]+$/, '');
      if (currentBase.includes(fileBase) || fileBase.includes(currentBase)) {
        score += 5;
        relation = 'similar-name';
      }

      // Check for shared symbols
      const currentSymbols = this.extractSymbols(currentContent);
      const fileSymbols = this.extractSymbols(file.content);
      const sharedSymbols = currentSymbols.filter(s => fileSymbols.includes(s));
      score += sharedSymbols.length * 2;

      if (score > 0) {
        related.push({ file: file.name, relation, score });
      }
    }

    return related.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  // Generate Breadcrumbs
  generateBreadcrumbs(file: string, line: number, column: number): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];
    const fileContent = this.projectStructure.files.find(f => f.name === file)?.content || '';
    const lines = fileContent.split('\n');

    // Add file breadcrumb
    breadcrumbs.push({
      label: file,
      file,
      line: 1,
      column: 1,
      type: 'file',
      icon: this.getFileIcon(file)
    });

    // Find containing structures
    let currentScope = '';
    let classContext = '';
    let methodContext = '';

    for (let i = 0; i < Math.min(line, lines.length); i++) {
      const currentLine = lines[i];
      
      // Check for class definition
      const classMatch = currentLine.match(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (classMatch) {
        classContext = classMatch[1];
        breadcrumbs.push({
          label: classContext,
          file,
          line: i + 1,
          column: currentLine.indexOf(classMatch[0]) + 1,
          type: 'class',
          icon: '🏛️'
        });
      }

      // Check for method/function definition
      const methodMatch = currentLine.match(/(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*[{=])/);
      if (methodMatch) {
        methodContext = methodMatch[1] || methodMatch[2];
        if (methodContext && i < line - 1) {
          breadcrumbs.push({
            label: methodContext,
            file,
            line: i + 1,
            column: currentLine.indexOf(methodContext) + 1,
            type: classContext ? 'method' : 'function',
            icon: classContext ? '⚙️' : '🔧'
          });
        }
      }
    }

    return breadcrumbs;
  }

  // Symbol Search
  async searchSymbols(query: string, limit = 50): Promise<SymbolInformation[]> {
    const results: SymbolInformation[] = [];
    const queryLower = query.toLowerCase();

    // Search through cached symbols
    for (const [file, symbols] of this.symbolCache) {
      for (const symbol of symbols) {
        if (symbol.name.toLowerCase().includes(queryLower)) {
          results.push(symbol);
        }
      }
    }

    // If no cached results, extract symbols from all files
    if (results.length === 0) {
      for (const file of this.projectStructure.files) {
        const symbols = await this.extractFileSymbols(file.name, file.content);
        this.symbolCache.set(file.name, symbols);
        
        for (const symbol of symbols) {
          if (symbol.name.toLowerCase().includes(queryLower)) {
            results.push(symbol);
          }
        }
      }
    }

    return results
      .sort((a, b) => {
        // Exact matches first
        if (a.name.toLowerCase() === queryLower) return -1;
        if (b.name.toLowerCase() === queryLower) return 1;
        
        // Then by relevance (starts with query)
        const aStarts = a.name.toLowerCase().startsWith(queryLower);
        const bStarts = b.name.toLowerCase().startsWith(queryLower);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        // Finally alphabetically
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit);
  }

  private findBasicDefinitions(symbol: string): NavigationTarget[] {
    const targets: NavigationTarget[] = [];

    for (const file of this.projectStructure.files) {
      const content = file.content;
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Look for function definitions
        const funcMatch = line.match(new RegExp(`(?:function\\s+${symbol}|const\\s+${symbol}\\s*=|${symbol}\\s*:)`));
        if (funcMatch) {
          targets.push({
            file: file.name,
            line: index + 1,
            column: line.indexOf(symbol) + 1,
            symbol,
            type: 'definition',
            preview: line.trim(),
            context: `Function definition in ${file.name}`
          });
        }

        // Look for class definitions
        const classMatch = line.match(new RegExp(`class\\s+${symbol}`));
        if (classMatch) {
          targets.push({
            file: file.name,
            line: index + 1,
            column: line.indexOf(symbol) + 1,
            symbol,
            type: 'definition',
            preview: line.trim(),
            context: `Class definition in ${file.name}`
          });
        }

        // Look for variable definitions
        const varMatch = line.match(new RegExp(`(?:const|let|var)\\s+${symbol}`));
        if (varMatch) {
          targets.push({
            file: file.name,
            line: index + 1,
            column: line.indexOf(symbol) + 1,
            symbol,
            type: 'definition',
            preview: line.trim(),
            context: `Variable definition in ${file.name}`
          });
        }
      });
    }

    return targets;
  }

  private async findAIDefinitions(
    file: string,
    line: number,
    column: number,
    symbol: string
  ): Promise<NavigationTarget[]> {
    if (!this.aiService) return [];

    const fileContent = this.projectStructure.files.find(f => f.name === file)?.content || '';
    const contextLines = fileContent.split('\n').slice(Math.max(0, line - 5), line + 5).join('\n');

    const prompt = `Find the definition of symbol "${symbol}" in this JavaScript/TypeScript project.

Current context (${file}:${line}):
\`\`\`
${contextLines}
\`\`\`

Project files:
${this.projectStructure.files.slice(0, 5).map(f => `${f.name}:\n${f.content.substring(0, 500)}`).join('\n\n')}

Return JSON with possible definitions:
{
  "definitions": [
    {
      "file": "filename.js",
      "line": 10,
      "column": 5,
      "type": "definition|implementation",
      "preview": "function myFunction() {",
      "context": "Function definition"
    }
  ]
}

Focus on finding the actual definition/declaration of the symbol.`;

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
        return data.definitions.map((def: any) => ({
          file: def.file,
          line: def.line,
          column: def.column,
          symbol,
          type: def.type,
          preview: def.preview,
          context: def.context
        }));
      }
    } catch (error) {
      console.warn('AI definition search failed:', error);
    }

    return [];
  }

  private async findAIUsages(symbol: string): Promise<NavigationTarget[]> {
    if (!this.aiService) return [];

    const prompt = `Find all usages of symbol "${symbol}" in this project.

Project files:
${this.projectStructure.files.slice(0, 10).map(f => `${f.name}:\n${f.content.substring(0, 1000)}`).join('\n\n')}

Return JSON with all usages:
{
  "usages": [
    {
      "file": "filename.js",
      "line": 15,
      "column": 8,
      "preview": "const result = myFunction();",
      "context": "Function call"
    }
  ]
}

Include function calls, variable references, property access, etc.`;

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
        return data.usages.map((usage: any) => ({
          file: usage.file,
          line: usage.line,
          column: usage.column,
          symbol,
          type: 'reference' as const,
          preview: usage.preview,
          context: usage.context
        }));
      }
    } catch (error) {
      console.warn('AI usage search failed:', error);
    }

    return [];
  }

  private findSymbolInFile(fileName: string, content: string, symbol: string): NavigationTarget[] {
    const targets: NavigationTarget[] = [];
    const lines = content.split('\n');
    const regex = new RegExp(`\\b${symbol}\\b`, 'g');

    lines.forEach((line, index) => {
      let match;
      while ((match = regex.exec(line)) !== null) {
        targets.push({
          file: fileName,
          line: index + 1,
          column: match.index + 1,
          symbol,
          type: 'reference',
          preview: line.trim(),
          context: `Reference in ${fileName}`
        });
      }
    });

    return targets;
  }

  private async extractFileSymbols(fileName: string, content: string): Promise<SymbolInformation[]> {
    const symbols: SymbolInformation[] = [];
    const lines = content.split('\n');

    // Extract functions
    lines.forEach((line, index) => {
      const funcMatch = line.match(/(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>)/);
      if (funcMatch) {
        const name = funcMatch[1] || funcMatch[2];
        symbols.push({
          name,
          kind: 'function',
          file: fileName,
          line: index + 1,
          column: line.indexOf(name) + 1,
          scope: 'global',
          signature: line.trim(),
          references: []
        });
      }

      // Extract classes
      const classMatch = line.match(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          file: fileName,
          line: index + 1,
          column: line.indexOf(classMatch[1]) + 1,
          scope: 'global',
          signature: line.trim(),
          references: []
        });
      }

      // Extract variables
      const varMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (varMatch) {
        symbols.push({
          name: varMatch[1],
          kind: 'variable',
          file: fileName,
          line: index + 1,
          column: line.indexOf(varMatch[1]) + 1,
          scope: 'global',
          signature: line.trim(),
          references: []
        });
      }
    });

    return symbols;
  }

  private extractSymbols(content: string): string[] {
    const symbols: string[] = [];
    const regex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (!symbols.includes(match[1])) {
        symbols.push(match[1]);
      }
    }

    return symbols;
  }

  private deduplicateTargets(targets: NavigationTarget[]): NavigationTarget[] {
    const seen = new Set<string>();
    return targets.filter(target => {
      const key = `${target.file}:${target.line}:${target.column}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'js': '📄',
      'ts': '📘',
      'jsx': '⚛️',
      'tsx': '⚛️',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'md': '📝',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚡',
      'c': '🔧'
    };
    return iconMap[ext || ''] || '📄';
  }
}
