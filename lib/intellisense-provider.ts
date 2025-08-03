import { FileContent } from '@/hooks/use-code-builder';
import { AIContextAnalyzer, ProjectContext } from './ai-context-analyzer';

export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText?: string;
  sortText?: string;
  filterText?: string;
  preselect?: boolean;
  additionalTextEdits?: TextEdit[];
  command?: Command;
}

export interface TextEdit {
  range: Range;
  newText: string;
}

export interface Range {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface Command {
  id: string;
  title: string;
  arguments?: any[];
}

export enum CompletionItemKind {
  Method = 0,
  Function = 1,
  Constructor = 2,
  Field = 3,
  Variable = 4,
  Class = 5,
  Struct = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Event = 10,
  Operator = 11,
  Unit = 12,
  Value = 13,
  Constant = 14,
  Enum = 15,
  EnumMember = 16,
  Keyword = 17,
  Text = 18,
  Color = 19,
  File = 20,
  Reference = 21,
  Customcolor = 22,
  Folder = 23,
  TypeParameter = 24,
  User = 25,
  Issue = 26,
  Snippet = 27
}

export interface Position {
  lineNumber: number;
  column: number;
}

export class IntelliSenseProvider {
  private files: FileContent[] = [];
  private contextAnalyzer: AIContextAnalyzer | null = null;
  private projectContext: ProjectContext | null = null;

  constructor(files: FileContent[]) {
    this.updateFiles(files);
  }

  updateFiles(files: FileContent[]): void {
    this.files = files;
    this.contextAnalyzer = new AIContextAnalyzer(files);
    this.projectContext = this.contextAnalyzer.getContext();
  }

  // Main completion provider
  async provideCompletionItems(
    fileName: string,
    position: Position,
    context: string,
    triggerCharacter?: string
  ): Promise<CompletionItem[]> {
    const file = this.files.find(f => f.name === fileName);
    if (!file) return [];

    const completions: CompletionItem[] = [];

    // Get current line and word
    const lines = file.content.split('\n');
    const currentLine = lines[position.lineNumber - 1] || '';
    const wordMatch = currentLine.slice(0, position.column - 1).match(/[\w$]+$/);
    const currentWord = wordMatch ? wordMatch[0] : '';

    // Add different types of completions
    completions.push(...this.getKeywordCompletions(fileName, currentLine, currentWord));
    completions.push(...this.getVariableCompletions(file, currentWord));
    completions.push(...this.getFunctionCompletions(file, currentWord));
    completions.push(...this.getImportCompletions(fileName, currentWord));
    completions.push(...this.getProjectAwareCompletions(currentWord));
    completions.push(...this.getFrameworkCompletions(currentLine, currentWord));
    completions.push(...this.getSnippetCompletions(fileName, currentLine, currentWord));

    // Sort by relevance
    return this.sortCompletions(completions, currentWord);
  }

  private getKeywordCompletions(fileName: string, currentLine: string, currentWord: string): CompletionItem[] {
    const language = this.getLanguageFromFileName(fileName);
    const keywords: Record<string, string[]> = {
      javascript: [
        'const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while', 'do',
        'switch', 'case', 'default', 'break', 'continue', 'return', 'try', 'catch',
        'finally', 'throw', 'async', 'await', 'import', 'export', 'from', 'as'
      ],
      typescript: [
        'interface', 'type', 'enum', 'namespace', 'declare', 'abstract', 'implements',
        'extends', 'public', 'private', 'protected', 'readonly', 'static'
      ],
      html: [
        'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'ul', 'ol', 'li',
        'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'select', 'option'
      ],
      css: [
        'display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height',
        'margin', 'padding', 'border', 'background', 'color', 'font-size', 'font-family'
      ]
    };

    const langKeywords = [
      ...(keywords[language] || []),
      ...(language === 'typescript' ? keywords.javascript || [] : [])
    ];

    return langKeywords
      .filter(keyword => keyword.toLowerCase().includes(currentWord.toLowerCase()))
      .map(keyword => ({
        label: keyword,
        kind: CompletionItemKind.Keyword,
        detail: `${language} keyword`,
        insertText: keyword,
        sortText: `0_${keyword}`
      }));
  }

  private getVariableCompletions(file: FileContent, currentWord: string): CompletionItem[] {
    const completions: CompletionItem[] = [];
    const lines = file.content.split('\n');

    // Extract variable declarations
    const variableRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    const functionParamRegex = /function\s+\w*\s*\(([^)]*)\)/g;
    const arrowFunctionRegex = /(?:const|let|var)\s+\w+\s*=\s*\(([^)]*)\)\s*=>/g;

    lines.forEach((line, index) => {
      // Variable declarations
      let match;
      while ((match = variableRegex.exec(line)) !== null) {
        const varName = match[1];
        if (varName.toLowerCase().includes(currentWord.toLowerCase())) {
          completions.push({
            label: varName,
            kind: CompletionItemKind.Variable,
            detail: `Variable (line ${index + 1})`,
            insertText: varName,
            sortText: `1_${varName}`
          });
        }
      }

      // Function parameters
      while ((match = functionParamRegex.exec(line)) !== null) {
        const params = match[1].split(',').map(p => p.trim().split(/\s+/)[0]);
        params.forEach(param => {
          if (param && param.toLowerCase().includes(currentWord.toLowerCase())) {
            completions.push({
              label: param,
              kind: CompletionItemKind.Variable,
              detail: `Parameter (line ${index + 1})`,
              insertText: param,
              sortText: `1_${param}`
            });
          }
        });
      }
    });

    return completions;
  }

  private getFunctionCompletions(file: FileContent, currentWord: string): CompletionItem[] {
    const completions: CompletionItem[] = [];
    const lines = file.content.split('\n');

    // Extract function declarations
    const functionRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)/g;
    const arrowFunctionRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:\([^)]*\)\s*=>|[^=]*=>)/g;
    const methodRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g;

    lines.forEach((line, index) => {
      let match;

      // Regular functions
      while ((match = functionRegex.exec(line)) !== null) {
        const funcName = match[1];
        const params = match[2];
        if (funcName.toLowerCase().includes(currentWord.toLowerCase())) {
          completions.push({
            label: funcName,
            kind: CompletionItemKind.Function,
            detail: `function ${funcName}(${params})`,
            insertText: `${funcName}($1)`,
            sortText: `2_${funcName}`
          });
        }
      }

      // Arrow functions
      while ((match = arrowFunctionRegex.exec(line)) !== null) {
        const funcName = match[1];
        if (funcName.toLowerCase().includes(currentWord.toLowerCase())) {
          completions.push({
            label: funcName,
            kind: CompletionItemKind.Function,
            detail: `Arrow function (line ${index + 1})`,
            insertText: `${funcName}($1)`,
            sortText: `2_${funcName}`
          });
        }
      }
    });

    return completions;
  }

  private getImportCompletions(fileName: string, currentWord: string): CompletionItem[] {
    const completions: CompletionItem[] = [];
    
    // Get available files for import
    this.files.forEach(file => {
      if (file.name !== fileName && file.name.endsWith('.js') || file.name.endsWith('.ts')) {
        const baseName = file.name.replace(/\.(js|ts)x?$/, '');
        if (baseName.toLowerCase().includes(currentWord.toLowerCase())) {
          completions.push({
            label: baseName,
            kind: CompletionItemKind.Module,
            detail: `Import from ./${file.name}`,
            insertText: baseName,
            sortText: `3_${baseName}`
          });
        }
      }
    });

    return completions;
  }

  private getProjectAwareCompletions(currentWord: string): CompletionItem[] {
    if (!this.projectContext) return [];

    const completions: CompletionItem[] = [];

    // Add completions based on project patterns
    this.projectContext.codePatterns.forEach(pattern => {
      if (pattern.name.toLowerCase().includes(currentWord.toLowerCase())) {
        completions.push({
          label: pattern.name,
          kind: this.getKindFromPatternType(pattern.type),
          detail: `${pattern.type} from ${pattern.file}`,
          insertText: pattern.name,
          sortText: `4_${pattern.name}`
        });
      }
    });

    return completions;
  }

  private getFrameworkCompletions(currentLine: string, currentWord: string): CompletionItem[] {
    const completions: CompletionItem[] = [];

    if (!this.projectContext) return completions;

    // React-specific completions
    if (this.projectContext.framework === 'React') {
      const reactCompletions = [
        { label: 'useState', kind: CompletionItemKind.Function, detail: 'React Hook', insertText: 'useState($1)' },
        { label: 'useEffect', kind: CompletionItemKind.Function, detail: 'React Hook', insertText: 'useEffect(() => {\n  $1\n}, [])' },
        { label: 'useContext', kind: CompletionItemKind.Function, detail: 'React Hook', insertText: 'useContext($1)' },
        { label: 'useCallback', kind: CompletionItemKind.Function, detail: 'React Hook', insertText: 'useCallback(() => {\n  $1\n}, [])' },
        { label: 'useMemo', kind: CompletionItemKind.Function, detail: 'React Hook', insertText: 'useMemo(() => $1, [])' }
      ];

      completions.push(...reactCompletions.filter(comp => 
        comp.label.toLowerCase().includes(currentWord.toLowerCase())
      ));
    }

    return completions;
  }

  private getSnippetCompletions(fileName: string, currentLine: string, currentWord: string): CompletionItem[] {
    const language = this.getLanguageFromFileName(fileName);
    const snippets: Record<string, CompletionItem[]> = {
      javascript: [
        {
          label: 'log',
          kind: CompletionItemKind.Snippet,
          detail: 'Console log',
          insertText: 'console.log($1);',
          sortText: '9_log'
        },
        {
          label: 'func',
          kind: CompletionItemKind.Snippet,
          detail: 'Function declaration',
          insertText: 'function ${1:name}(${2:params}) {\n  $3\n}',
          sortText: '9_func'
        },
        {
          label: 'arrow',
          kind: CompletionItemKind.Snippet,
          detail: 'Arrow function',
          insertText: 'const ${1:name} = (${2:params}) => {\n  $3\n};',
          sortText: '9_arrow'
        }
      ]
    };

    const langSnippets = snippets[language] || [];
    return langSnippets.filter(snippet => 
      snippet.label.toLowerCase().includes(currentWord.toLowerCase())
    );
  }

  private sortCompletions(completions: CompletionItem[], currentWord: string): CompletionItem[] {
    return completions.sort((a, b) => {
      // Exact matches first
      if (a.label === currentWord) return -1;
      if (b.label === currentWord) return 1;

      // Starts with current word
      const aStarts = a.label.toLowerCase().startsWith(currentWord.toLowerCase());
      const bStarts = b.label.toLowerCase().startsWith(currentWord.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Sort by sortText, then by label
      if (a.sortText && b.sortText) {
        return a.sortText.localeCompare(b.sortText);
      }
      return a.label.localeCompare(b.label);
    });
  }

  private getLanguageFromFileName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json'
    };
    return langMap[ext || ''] || 'javascript';
  }

  private getKindFromPatternType(type: string): CompletionItemKind {
    const kindMap: Record<string, CompletionItemKind> = {
      'component': CompletionItemKind.Class,
      'function': CompletionItemKind.Function,
      'class': CompletionItemKind.Class,
      'hook': CompletionItemKind.Function,
      'api': CompletionItemKind.Method,
      'config': CompletionItemKind.Property
    };
    return kindMap[type] || CompletionItemKind.Property;
  }
}
