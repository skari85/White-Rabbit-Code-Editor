import { AIService } from './ai-service';
import { AISettings, AIMessage } from './ai-config';

export interface CompletionContext {
  currentFile: string;
  currentCode: string;
  cursorPosition: {
    lineNumber: number;
    column: number;
  };
  projectFiles: Array<{
    name: string;
    content: string;
    type: string;
  }>;
  language: string;
  triggerCharacter?: string;
}

export interface AICompletionItem {
  label: string;
  kind: 'method' | 'function' | 'variable' | 'class' | 'interface' | 'property' | 'keyword' | 'snippet' | 'text';
  detail?: string;
  documentation?: string;
  insertText: string;
  sortText?: string;
  filterText?: string;
  range?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  command?: {
    id: string;
    title: string;
  };
}

export class AICompletionService {
  private aiService: AIService | null = null;
  private cache = new Map<string, { completions: AICompletionItem[]; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor(settings: AISettings) {
    if (settings.apiKey && settings.provider) {
      this.aiService = new AIService(settings);
    }
  }

  updateSettings(settings: AISettings) {
    if (settings.apiKey && settings.provider) {
      this.aiService = new AIService(settings);
    } else {
      this.aiService = null;
    }
    this.clearCache();
  }

  private getCacheKey(context: CompletionContext): string {
    const { currentFile, cursorPosition, language, triggerCharacter } = context;
    const lineContent = context.currentCode.split('\n')[cursorPosition.lineNumber - 1] || '';
    return `${currentFile}:${cursorPosition.lineNumber}:${cursorPosition.column}:${language}:${triggerCharacter || ''}:${lineContent}`;
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  clearCache() {
    this.cache.clear();
  }

  async getCompletions(context: CompletionContext): Promise<AICompletionItem[]> {
    if (!this.aiService) {
      return this.getFallbackCompletions(context);
    }

    const cacheKey = this.getCacheKey(context);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isValidCache(cached.timestamp)) {
      return cached.completions;
    }

    try {
      const completions = await this.generateAICompletions(context);
      this.cache.set(cacheKey, { completions, timestamp: Date.now() });
      return completions;
    } catch (error) {
      console.warn('AI completion failed, falling back to basic completions:', error);
      return this.getFallbackCompletions(context);
    }
  }

  private async generateAICompletions(context: CompletionContext): Promise<AICompletionItem[]> {
    if (!this.aiService) return [];

    const { currentCode, cursorPosition, projectFiles, language, currentFile } = context;
    const lines = currentCode.split('\n');
    const currentLine = lines[cursorPosition.lineNumber - 1] || '';
    const beforeCursor = currentLine.substring(0, cursorPosition.column - 1);
    const afterCursor = currentLine.substring(cursorPosition.column - 1);

    // Get context around cursor
    const contextStart = Math.max(0, cursorPosition.lineNumber - 10);
    const contextEnd = Math.min(lines.length, cursorPosition.lineNumber + 5);
    const contextLines = lines.slice(contextStart, contextEnd);

    // Build project context
    const projectContext = projectFiles
      .filter(file => file.name !== currentFile)
      .slice(0, 3) // Limit to 3 files for context
      .map(file => `// ${file.name}\n${file.content.substring(0, 500)}`)
      .join('\n\n');

    const prompt = `You are an intelligent code completion assistant. Provide relevant code completions for the current context.

Current file: ${currentFile}
Language: ${language}
Current line: ${currentLine}
Text before cursor: "${beforeCursor}"
Text after cursor: "${afterCursor}"

Context (lines ${contextStart + 1}-${contextEnd}):
\`\`\`${language}
${contextLines.join('\n')}
\`\`\`

Project context:
\`\`\`
${projectContext}
\`\`\`

Provide completions in JSON format:
{
  "completions": [
    {
      "label": "completion text",
      "kind": "method|function|variable|class|interface|property|keyword|snippet|text",
      "detail": "brief description",
      "documentation": "detailed explanation",
      "insertText": "text to insert",
      "sortText": "sort priority (lower = higher priority)"
    }
  ]
}

Focus on:
- Context-aware suggestions based on current code
- Import statements and module completions
- Method/property completions for objects
- Framework-specific completions (React, Vue, etc.)
- Type-aware completions for TypeScript
- CSS class/property completions
- API endpoint completions
- Variable and function names from project context

Provide 5-10 most relevant completions. Return only the JSON object.`;

    const messages: AIMessage[] = [
      {
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        timestamp: new Date()
      }
    ];

    const response = await this.aiService.sendMessage(messages);
    
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.completions || [];
      }
    } catch (parseError) {
      console.warn('Failed to parse AI completion response:', parseError);
    }

    return [];
  }

  private getFallbackCompletions(context: CompletionContext): AICompletionItem[] {
    const { language, currentCode, cursorPosition } = context;
    const lines = currentCode.split('\n');
    const currentLine = lines[cursorPosition.lineNumber - 1] || '';
    const beforeCursor = currentLine.substring(0, cursorPosition.column - 1);
    
    const completions: AICompletionItem[] = [];

    // Basic keyword completions
    const keywords = this.getLanguageKeywords(language);
    keywords.forEach(keyword => {
      if (keyword.toLowerCase().startsWith(beforeCursor.toLowerCase()) && beforeCursor.length > 0) {
        completions.push({
          label: keyword,
          kind: 'keyword',
          detail: `${language} keyword`,
          insertText: keyword,
          sortText: `0_${keyword}`
        });
      }
    });

    // Variable completions from current file
    const variableRegex = /(?:const|let|var|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    let match;
    while ((match = variableRegex.exec(currentCode)) !== null) {
      const varName = match[1];
      if (varName.toLowerCase().includes(beforeCursor.toLowerCase()) && beforeCursor.length > 0) {
        completions.push({
          label: varName,
          kind: 'variable',
          detail: 'Variable from current file',
          insertText: varName,
          sortText: `1_${varName}`
        });
      }
    }

    return completions.slice(0, 10);
  }

  private getLanguageKeywords(language: string): string[] {
    const keywords: Record<string, string[]> = {
      javascript: [
        'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
        'switch', 'case', 'default', 'break', 'continue', 'try', 'catch', 'finally',
        'throw', 'new', 'this', 'super', 'class', 'extends', 'import', 'export',
        'async', 'await', 'Promise', 'console', 'document', 'window'
      ],
      typescript: [
        'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
        'switch', 'case', 'default', 'break', 'continue', 'try', 'catch', 'finally',
        'throw', 'new', 'this', 'super', 'class', 'extends', 'import', 'export',
        'async', 'await', 'Promise', 'console', 'document', 'window',
        'interface', 'type', 'enum', 'namespace', 'module', 'declare', 'public',
        'private', 'protected', 'readonly', 'static', 'abstract'
      ],
      html: [
        'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'ul', 'ol', 'li',
        'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'select', 'option', 'textarea',
        'header', 'footer', 'nav', 'section', 'article', 'aside', 'main'
      ],
      css: [
        'display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height',
        'margin', 'padding', 'border', 'background', 'color', 'font-size', 'font-family',
        'text-align', 'text-decoration', 'line-height', 'letter-spacing', 'word-spacing',
        'flex', 'grid', 'justify-content', 'align-items', 'flex-direction', 'flex-wrap'
      ]
    };

    return keywords[language] || keywords.javascript;
  }

  // Convert AI completion items to Monaco completion items
  toMonacoCompletions(aiCompletions: AICompletionItem[], monaco: any): any[] {
    return aiCompletions.map(completion => ({
      label: completion.label,
      kind: this.getMonacoCompletionKind(completion.kind, monaco),
      detail: completion.detail,
      documentation: completion.documentation,
      insertText: completion.insertText,
      sortText: completion.sortText || completion.label,
      filterText: completion.filterText || completion.label,
      range: completion.range,
      command: completion.command
    }));
  }

  private getMonacoCompletionKind(kind: string, monaco: any): any {
    const kindMap: Record<string, any> = {
      method: monaco.languages.CompletionItemKind.Method,
      function: monaco.languages.CompletionItemKind.Function,
      variable: monaco.languages.CompletionItemKind.Variable,
      class: monaco.languages.CompletionItemKind.Class,
      interface: monaco.languages.CompletionItemKind.Interface,
      property: monaco.languages.CompletionItemKind.Property,
      keyword: monaco.languages.CompletionItemKind.Keyword,
      snippet: monaco.languages.CompletionItemKind.Snippet,
      text: monaco.languages.CompletionItemKind.Text
    };

    return kindMap[kind] || monaco.languages.CompletionItemKind.Text;
  }

  // Advanced IntelliSense features
  async getImportSuggestions(context: CompletionContext): Promise<AICompletionItem[]> {
    const { currentCode, cursorPosition, projectFiles } = context;
    const lines = currentCode.split('\n');
    const currentLine = lines[cursorPosition.lineNumber - 1] || '';

    // Check if we're in an import statement
    if (!currentLine.trim().startsWith('import') && !currentLine.includes('from')) {
      return [];
    }

    const suggestions: AICompletionItem[] = [];

    // Suggest local files for import
    projectFiles.forEach(file => {
      if (file.name !== context.currentFile) {
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        const relativePath = `./${fileName}`;

        suggestions.push({
          label: fileName,
          kind: 'text',
          detail: `Import from ${file.name}`,
          documentation: `Import from local file: ${file.name}`,
          insertText: relativePath,
          sortText: `0_${fileName}`
        });
      }
    });

    // Suggest common npm packages
    const commonPackages = [
      'react', 'react-dom', 'lodash', 'axios', 'moment', 'uuid',
      'classnames', 'prop-types', 'styled-components', '@types/react'
    ];

    commonPackages.forEach(pkg => {
      if (pkg.toLowerCase().includes(currentLine.toLowerCase().replace(/['"]/g, ''))) {
        suggestions.push({
          label: pkg,
          kind: 'text',
          detail: `npm package`,
          documentation: `Import ${pkg} package`,
          insertText: pkg,
          sortText: `1_${pkg}`
        });
      }
    });

    return suggestions;
  }

  async getMethodSignatures(context: CompletionContext): Promise<any[]> {
    const { currentCode, cursorPosition } = context;
    const lines = currentCode.split('\n');
    const currentLine = lines[cursorPosition.lineNumber - 1] || '';

    // Simple method signature detection
    const methodMatch = currentLine.match(/(\w+)\s*\(/);
    if (!methodMatch) return [];

    const methodName = methodMatch[1];
    const signatures = [];

    // Common JavaScript/TypeScript method signatures
    const commonMethods: Record<string, any> = {
      'console.log': {
        label: 'console.log(message?: any, ...optionalParams: any[]): void',
        documentation: 'Outputs a message to the console',
        parameters: [
          { label: 'message', documentation: 'The message to log' },
          { label: '...optionalParams', documentation: 'Additional parameters to log' }
        ]
      },
      'fetch': {
        label: 'fetch(input: RequestInfo, init?: RequestInit): Promise<Response>',
        documentation: 'Fetch API for making HTTP requests',
        parameters: [
          { label: 'input', documentation: 'URL or Request object' },
          { label: 'init', documentation: 'Request configuration options' }
        ]
      },
      'setTimeout': {
        label: 'setTimeout(callback: Function, delay: number): number',
        documentation: 'Executes a function after a specified delay',
        parameters: [
          { label: 'callback', documentation: 'Function to execute' },
          { label: 'delay', documentation: 'Delay in milliseconds' }
        ]
      },
      'addEventListener': {
        label: 'addEventListener(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): void',
        documentation: 'Adds an event listener to the element',
        parameters: [
          { label: 'type', documentation: 'Event type (e.g., "click", "load")' },
          { label: 'listener', documentation: 'Function to handle the event' },
          { label: 'options', documentation: 'Event listener options' }
        ]
      }
    };

    if (commonMethods[methodName]) {
      signatures.push(commonMethods[methodName]);
    }

    return signatures;
  }

  async getCrossFileReferences(context: CompletionContext): Promise<AICompletionItem[]> {
    const { projectFiles, currentFile } = context;
    const suggestions: AICompletionItem[] = [];

    // Find exports from other files
    projectFiles.forEach(file => {
      if (file.name === currentFile) return;

      // Extract exports
      const exportMatches = file.content.match(/export\s+(?:default\s+)?(?:const|let|var|function|class)?\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/g);

      if (exportMatches) {
        exportMatches.forEach(match => {
          const exportName = match.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)$/)?.[1];
          if (exportName) {
            suggestions.push({
              label: exportName,
              kind: 'variable',
              detail: `From ${file.name}`,
              documentation: `Exported from ${file.name}`,
              insertText: exportName,
              sortText: `2_${exportName}`,
              command: {
                id: 'editor.action.addImport',
                title: `Add import from ${file.name}`
              }
            });
          }
        });
      }
    });

    return suggestions;
  }

  // Enhanced completion with advanced features
  async getEnhancedCompletions(context: CompletionContext): Promise<AICompletionItem[]> {
    const allCompletions: AICompletionItem[] = [];

    // Get base AI completions
    const baseCompletions = await this.getCompletions(context);
    allCompletions.push(...baseCompletions);

    // Add import suggestions
    const importSuggestions = await this.getImportSuggestions(context);
    allCompletions.push(...importSuggestions);

    // Add cross-file references
    const crossFileRefs = await this.getCrossFileReferences(context);
    allCompletions.push(...crossFileRefs);

    // Remove duplicates and sort
    const uniqueCompletions = allCompletions.filter((completion, index, self) =>
      index === self.findIndex(c => c.label === completion.label)
    );

    return uniqueCompletions.sort((a, b) => {
      const sortA = a.sortText || a.label;
      const sortB = b.sortText || b.label;
      return sortA.localeCompare(sortB);
    });
  }
}
