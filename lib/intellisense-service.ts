export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText?: string;
  sortText?: string;
  filterText?: string;
  range?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

export interface SignatureHelp {
  label: string;
  documentation?: string;
  parameters: ParameterInformation[];
  activeParameter?: number;
}

export interface ParameterInformation {
  label: string;
  documentation?: string;
}

export interface HoverInfo {
  contents: string;
  range?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

export interface Diagnostic {
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  message: string;
  severity: DiagnosticSeverity;
  source?: string;
  code?: string;
}

export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

export interface CodeAction {
  title: string;
  kind: string;
  edit?: {
    changes: {
      [uri: string]: TextEdit[];
    };
  };
  command?: {
    command: string;
    arguments?: any[];
  };
}

export interface TextEdit {
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  newText: string;
}

export interface SymbolInformation {
  name: string;
  kind: SymbolKind;
  location: {
    uri: string;
    range: {
      startLine: number;
      startColumn: number;
      endLine: number;
      endColumn: number;
    };
  };
  containerName?: string;
}

export enum SymbolKind {
  File = 1,
  Module = 2,
  Namespace = 3,
  Package = 4,
  Class = 5,
  Method = 6,
  Property = 7,
  Field = 8,
  Constructor = 9,
  Enum = 10,
  Interface = 11,
  Function = 12,
  Variable = 13,
  Constant = 14,
  String = 15,
  Number = 16,
  Boolean = 17,
  Array = 18,
  Object = 19,
  Key = 20,
  Null = 21,
  EnumMember = 22,
  Struct = 23,
  Event = 24,
  Operator = 25,
  TypeParameter = 26,
}

class IntelliSenseService {
  private languageServers: Map<string, any> = new Map();
  private completionCache: Map<string, CompletionItem[]> = new Map();
  private diagnosticCache: Map<string, Diagnostic[]> = new Map();

  constructor() {
    this.initializeLanguageServers();
  }

  private initializeLanguageServers() {
    // Initialize language-specific servers
    this.languageServers.set('javascript', this.createJavaScriptServer());
    this.languageServers.set('typescript', this.createTypeScriptServer());
    this.languageServers.set('html', this.createHTMLServer());
    this.languageServers.set('css', this.createCSSServer());
    this.languageServers.set('json', this.createJSONServer());
  }

  private createJavaScriptServer() {
    return {
      getCompletions: (content: string, position: { line: number; column: number }) => {
        return this.getJavaScriptCompletions(content, position);
      },
      getDiagnostics: (content: string) => {
        return this.getJavaScriptDiagnostics(content);
      },
      getSignatureHelp: (content: string, position: { line: number; column: number }) => {
        return this.getJavaScriptSignatureHelp(content, position);
      }
    };
  }

  private createTypeScriptServer() {
    return {
      getCompletions: (content: string, position: { line: number; column: number }) => {
        return this.getTypeScriptCompletions(content, position);
      },
      getDiagnostics: (content: string) => {
        return this.getTypeScriptDiagnostics(content);
      },
      getSignatureHelp: (content: string, position: { line: number; column: number }) => {
        return this.getTypeScriptSignatureHelp(content, position);
      }
    };
  }

  private createHTMLServer() {
    return {
      getCompletions: (content: string, position: { line: number; column: number }) => {
        return this.getHTMLCompletions(content, position);
      },
      getDiagnostics: (content: string) => {
        return this.getHTMLDiagnostics(content);
      }
    };
  }

  private createCSSServer() {
    return {
      getCompletions: (content: string, position: { line: number; column: number }) => {
        return this.getCSSCompletions(content, position);
      },
      getDiagnostics: (content: string) => {
        return this.getCSSDiagnostics(content);
      }
    };
  }

  private createJSONServer() {
    return {
      getCompletions: (content: string, position: { line: number; column: number }) => {
        return this.getJSONCompletions(content, position);
      },
      getDiagnostics: (content: string) => {
        return this.getJSONDiagnostics(content);
      }
    };
  }

  async getCompletions(
    content: string,
    position: { line: number; column: number },
    language: string
  ): Promise<CompletionItem[]> {
    const server = this.languageServers.get(language);
    if (!server) return [];

    const cacheKey = `${language}_${position.line}_${position.column}_${content.length}`;
    if (this.completionCache.has(cacheKey)) {
      return this.completionCache.get(cacheKey)!;
    }

    const completions = await server.getCompletions(content, position);
    this.completionCache.set(cacheKey, completions);
    
    return completions;
  }

  async getDiagnostics(content: string, language: string): Promise<Diagnostic[]> {
    const server = this.languageServers.get(language);
    if (!server) return [];

    const cacheKey = `${language}_${content.length}`;
    if (this.diagnosticCache.has(cacheKey)) {
      return this.diagnosticCache.get(cacheKey)!;
    }

    const diagnostics = await server.getDiagnostics(content);
    this.diagnosticCache.set(cacheKey, diagnostics);
    
    return diagnostics;
  }

  async getSignatureHelp(
    content: string,
    position: { line: number; column: number },
    language: string
  ): Promise<SignatureHelp | null> {
    const server = this.languageServers.get(language);
    if (!server || !server.getSignatureHelp) return null;

    return await server.getSignatureHelp(content, position);
  }

  async getHover(
    content: string,
    position: { line: number; column: number },
    language: string
  ): Promise<HoverInfo | null> {
    // Simulate hover information
    const word = this.getWordAtPosition(content, position);
    if (!word) return null;

    const hoverInfo: HoverInfo = {
      contents: `**${word}**\n\nType: \`${this.getTypeForWord(word, language)}\`\n\nDocumentation for ${word}`,
      range: {
        startLine: position.line,
        startColumn: position.column - word.length,
        endLine: position.line,
        endColumn: position.column
      }
    };

    return hoverInfo;
  }

  async getCodeActions(
    content: string,
    range: { startLine: number; startColumn: number; endLine: number; endColumn: number },
    diagnostics: Diagnostic[],
    language: string
  ): Promise<CodeAction[]> {
    const actions: CodeAction[] = [];

    // Generate quick fixes based on diagnostics
    diagnostics.forEach(diagnostic => {
      if (diagnostic.severity === DiagnosticSeverity.Error) {
        actions.push({
          title: `Fix: ${diagnostic.message}`,
          kind: 'quickfix',
          edit: {
            changes: {
              'file:///current': [{
                range: diagnostic.range,
                newText: this.getQuickFixText(diagnostic, language)
              }]
            }
          }
        });
      }
    });

    return actions;
  }

  async getSymbols(content: string, language: string): Promise<SymbolInformation[]> {
    const symbols: SymbolInformation[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      // Parse function declarations
      const functionMatch = line.match(/function\s+(\w+)/);
      if (functionMatch) {
        symbols.push({
          name: functionMatch[1],
          kind: SymbolKind.Function,
          location: {
            uri: 'file:///current',
            range: {
              startLine: lineIndex,
              startColumn: line.indexOf('function'),
              endLine: lineIndex,
              endColumn: line.length
            }
          }
        });
      }

      // Parse class declarations
      const classMatch = line.match(/class\s+(\w+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: SymbolKind.Class,
          location: {
            uri: 'file:///current',
            range: {
              startLine: lineIndex,
              startColumn: line.indexOf('class'),
              endLine: lineIndex,
              endColumn: line.length
            }
          }
        });
      }

      // Parse variable declarations
      const varMatch = line.match(/(?:const|let|var)\s+(\w+)/);
      if (varMatch) {
        symbols.push({
          name: varMatch[1],
          kind: SymbolKind.Variable,
          location: {
            uri: 'file:///current',
            range: {
              startLine: lineIndex,
              startColumn: line.indexOf(varMatch[0]),
              endLine: lineIndex,
              endColumn: line.length
            }
          }
        });
      }
    });

    return symbols;
  }

  // JavaScript-specific completions
  private async getJavaScriptCompletions(content: string, position: { line: number; column: number }): Promise<CompletionItem[]> {
    const completions: CompletionItem[] = [
      {
        label: 'console.log',
        kind: CompletionItemKind.Function,
        detail: 'console.log(message: any): void',
        documentation: 'Prints a message to the console',
        insertText: 'console.log(${1:message})',
        sortText: '01'
      },
      {
        label: 'function',
        kind: CompletionItemKind.Keyword,
        detail: 'function declaration',
        documentation: 'Declares a function',
        insertText: 'function ${1:name}(${2:params}) {\n\t${3}\n}',
        sortText: '02'
      },
      {
        label: 'const',
        kind: CompletionItemKind.Keyword,
        detail: 'const declaration',
        documentation: 'Declares a constant',
        insertText: 'const ${1:name} = ${2:value}',
        sortText: '03'
      },
      {
        label: 'let',
        kind: CompletionItemKind.Keyword,
        detail: 'let declaration',
        documentation: 'Declares a block-scoped variable',
        insertText: 'let ${1:name} = ${2:value}',
        sortText: '04'
      },
      {
        label: 'if',
        kind: CompletionItemKind.Keyword,
        detail: 'if statement',
        documentation: 'Conditional statement',
        insertText: 'if (${1:condition}) {\n\t${2}\n}',
        sortText: '05'
      },
      {
        label: 'for',
        kind: CompletionItemKind.Keyword,
        detail: 'for loop',
        documentation: 'For loop statement',
        insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3}\n}',
        sortText: '06'
      },
      {
        label: 'forEach',
        kind: CompletionItemKind.Method,
        detail: 'Array.forEach(callback)',
        documentation: 'Executes a function for each array element',
        insertText: 'forEach(${1:item} => {\n\t${2}\n})',
        sortText: '07'
      },
      {
        label: 'map',
        kind: CompletionItemKind.Method,
        detail: 'Array.map(callback)',
        documentation: 'Creates a new array with the results of calling a function',
        insertText: 'map(${1:item} => {\n\treturn ${2}\n})',
        sortText: '08'
      },
      {
        label: 'filter',
        kind: CompletionItemKind.Method,
        detail: 'Array.filter(callback)',
        documentation: 'Creates a new array with elements that pass a test',
        insertText: 'filter(${1:item} => {\n\treturn ${2}\n})',
        sortText: '09'
      },
      {
        label: 'async',
        kind: CompletionItemKind.Keyword,
        detail: 'async function',
        documentation: 'Declares an async function',
        insertText: 'async function ${1:name}(${2:params}) {\n\t${3}\n}',
        sortText: '10'
      },
      {
        label: 'await',
        kind: CompletionItemKind.Keyword,
        detail: 'await expression',
        documentation: 'Waits for a Promise to resolve',
        insertText: 'await ${1:promise}',
        sortText: '11'
      }
    ];

    return completions;
  }

  // TypeScript-specific completions
  private async getTypeScriptCompletions(content: string, position: { line: number; column: number }): Promise<CompletionItem[]> {
    const jsCompletions = await this.getJavaScriptCompletions(content, position);
    const tsCompletions: CompletionItem[] = [
      {
        label: 'interface',
        kind: CompletionItemKind.Keyword,
        detail: 'interface declaration',
        documentation: 'Declares an interface',
        insertText: 'interface ${1:Name} {\n\t${2}\n}',
        sortText: '01'
      },
      {
        label: 'type',
        kind: CompletionItemKind.Keyword,
        detail: 'type declaration',
        documentation: 'Declares a type alias',
        insertText: 'type ${1:Name} = ${2}',
        sortText: '02'
      },
      {
        label: 'enum',
        kind: CompletionItemKind.Keyword,
        detail: 'enum declaration',
        documentation: 'Declares an enumeration',
        insertText: 'enum ${1:Name} {\n\t${2}\n}',
        sortText: '03'
      },
      {
        label: 'import',
        kind: CompletionItemKind.Keyword,
        detail: 'import statement',
        documentation: 'Imports modules',
        insertText: 'import { ${1} } from \'${2}\'',
        sortText: '04'
      },
      {
        label: 'export',
        kind: CompletionItemKind.Keyword,
        detail: 'export statement',
        documentation: 'Exports modules',
        insertText: 'export { ${1} }',
        sortText: '05'
      }
    ];

    return [...jsCompletions, ...tsCompletions];
  }

  // HTML-specific completions
  private async getHTMLCompletions(content: string, position: { line: number; column: number }): Promise<CompletionItem[]> {
    return [
      {
        label: 'div',
        kind: CompletionItemKind.Snippet,
        detail: 'div element',
        documentation: 'Generic container element',
        insertText: '<div>\n\t${1}\n</div>',
        sortText: '01'
      },
      {
        label: 'span',
        kind: CompletionItemKind.Snippet,
        detail: 'span element',
        documentation: 'Inline container element',
        insertText: '<span>${1}</span>',
        sortText: '02'
      },
      {
        label: 'button',
        kind: CompletionItemKind.Snippet,
        detail: 'button element',
        documentation: 'Clickable button element',
        insertText: '<button>${1}</button>',
        sortText: '03'
      },
      {
        label: 'input',
        kind: CompletionItemKind.Snippet,
        detail: 'input element',
        documentation: 'Form input element',
        insertText: '<input type="${1:text}" />',
        sortText: '04'
      },
      {
        label: 'form',
        kind: CompletionItemKind.Snippet,
        detail: 'form element',
        documentation: 'Form container element',
        insertText: '<form>\n\t${1}\n</form>',
        sortText: '05'
      }
    ];
  }

  // CSS-specific completions
  private async getCSSCompletions(content: string, position: { line: number; column: number }): Promise<CompletionItem[]> {
    return [
      {
        label: 'display',
        kind: CompletionItemKind.Property,
        detail: 'display property',
        documentation: 'Sets the display type of an element',
        insertText: 'display: ${1|block,inline,flex,grid,none|}',
        sortText: '01'
      },
      {
        label: 'color',
        kind: CompletionItemKind.Property,
        detail: 'color property',
        documentation: 'Sets the text color',
        insertText: 'color: ${1}',
        sortText: '02'
      },
      {
        label: 'background',
        kind: CompletionItemKind.Property,
        detail: 'background property',
        documentation: 'Sets the background',
        insertText: 'background: ${1}',
        sortText: '03'
      },
      {
        label: 'margin',
        kind: CompletionItemKind.Property,
        detail: 'margin property',
        documentation: 'Sets the margin',
        insertText: 'margin: ${1}',
        sortText: '04'
      },
      {
        label: 'padding',
        kind: CompletionItemKind.Property,
        detail: 'padding property',
        documentation: 'Sets the padding',
        insertText: 'padding: ${1}',
        sortText: '05'
      }
    ];
  }

  // JSON-specific completions
  private async getJSONCompletions(content: string, position: { line: number; column: number }): Promise<CompletionItem[]> {
    return [
      {
        label: '"name"',
        kind: CompletionItemKind.Property,
        detail: 'name property',
        documentation: 'Name field',
        insertText: '"name": "${1}"',
        sortText: '01'
      },
      {
        label: '"value"',
        kind: CompletionItemKind.Property,
        detail: 'value property',
        documentation: 'Value field',
        insertText: '"value": ${1}',
        sortText: '02'
      },
      {
        label: '"type"',
        kind: CompletionItemKind.Property,
        detail: 'type property',
        documentation: 'Type field',
        insertText: '"type": "${1}"',
        sortText: '03'
      }
    ];
  }

  // Diagnostic methods
  private async getJavaScriptDiagnostics(content: string): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      // Check for common JavaScript errors
      if (line.includes('console.log(') && !line.includes(')')) {
        diagnostics.push({
          range: {
            startLine: lineIndex,
            startColumn: line.indexOf('console.log('),
            endLine: lineIndex,
            endColumn: line.length
          },
          message: 'Missing closing parenthesis',
          severity: DiagnosticSeverity.Error,
          source: 'JavaScript'
        });
      }

      if (line.includes('function') && !line.includes('{')) {
        diagnostics.push({
          range: {
            startLine: lineIndex,
            startColumn: line.indexOf('function'),
            endLine: lineIndex,
            endColumn: line.length
          },
          message: 'Missing opening brace',
          severity: DiagnosticSeverity.Error,
          source: 'JavaScript'
        });
      }
    });

    return diagnostics;
  }

  private async getTypeScriptDiagnostics(content: string): Promise<Diagnostic[]> {
    const jsDiagnostics = await this.getJavaScriptDiagnostics(content);
    const tsDiagnostics: Diagnostic[] = [];

    // Add TypeScript-specific diagnostics
    const lines = content.split('\n');
    lines.forEach((line, lineIndex) => {
      if (line.includes(':') && !line.includes('=') && !line.includes('function') && !line.includes('class')) {
        tsDiagnostics.push({
          range: {
            startLine: lineIndex,
            startColumn: 0,
            endLine: lineIndex,
            endColumn: line.length
          },
          message: 'Type annotation without assignment',
          severity: DiagnosticSeverity.Warning,
          source: 'TypeScript'
        });
      }
    });

    return [...jsDiagnostics, ...tsDiagnostics];
  }

  private async getHTMLDiagnostics(content: string): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      // Check for unclosed tags
      const openTags = (line.match(/<[^/][^>]*>/g) || []).length;
      const closeTags = (line.match(/<\/[^>]*>/g) || []).length;
      
      if (openTags > closeTags) {
        diagnostics.push({
          range: {
            startLine: lineIndex,
            startColumn: 0,
            endLine: lineIndex,
            endColumn: line.length
          },
          message: 'Unclosed HTML tag',
          severity: DiagnosticSeverity.Error,
          source: 'HTML'
        });
      }
    });

    return diagnostics;
  }

  private async getCSSDiagnostics(content: string): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      if (line.includes(':') && !line.includes(';')) {
        diagnostics.push({
          range: {
            startLine: lineIndex,
            startColumn: line.indexOf(':'),
            endLine: lineIndex,
            endColumn: line.length
          },
          message: 'Missing semicolon',
          severity: DiagnosticSeverity.Error,
          source: 'CSS'
        });
      }
    });

    return diagnostics;
  }

  private async getJSONDiagnostics(content: string): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = [];

    try {
      JSON.parse(content);
    } catch (error) {
      diagnostics.push({
        range: {
          startLine: 0,
          startColumn: 0,
          endLine: content.split('\n').length - 1,
          endColumn: content.length
        },
        message: 'Invalid JSON syntax',
        severity: DiagnosticSeverity.Error,
        source: 'JSON'
      });
    }

    return diagnostics;
  }

  // Signature help methods
  private async getJavaScriptSignatureHelp(content: string, position: { line: number; column: number }): Promise<SignatureHelp | null> {
    const line = content.split('\n')[position.line - 1];
    if (line.includes('console.log(')) {
      return {
        label: 'console.log(message: any): void',
        documentation: 'Prints a message to the console',
        parameters: [
          { label: 'message', documentation: 'The message to print' }
        ],
        activeParameter: 0
      };
    }
    return null;
  }

  private async getTypeScriptSignatureHelp(content: string, position: { line: number; column: number }): Promise<SignatureHelp | null> {
    return await this.getJavaScriptSignatureHelp(content, position);
  }

  // Utility methods
  private getWordAtPosition(content: string, position: { line: number; column: number }): string | null {
    const lines = content.split('\n');
    const line = lines[position.line - 1];
    if (!line) return null;

    const wordRegex = /\b\w+\b/g;
    let match;
    while ((match = wordRegex.exec(line)) !== null) {
      if (match.index <= position.column - 1 && match.index + match[0].length >= position.column - 1) {
        return match[0];
      }
    }
    return null;
  }

  private getTypeForWord(word: string, language: string): string {
    const typeMap: Record<string, Record<string, string>> = {
      javascript: {
        'console': 'Console',
        'log': 'Function',
        'function': 'Keyword',
        'const': 'Keyword',
        'let': 'Keyword',
        'var': 'Keyword'
      },
      typescript: {
        'interface': 'Keyword',
        'type': 'Keyword',
        'enum': 'Keyword',
        'import': 'Keyword',
        'export': 'Keyword'
      }
    };

    return typeMap[language]?.[word] || 'unknown';
  }

  private getQuickFixText(diagnostic: Diagnostic, language: string): string {
    if (diagnostic.message.includes('Missing closing parenthesis')) {
      return ')';
    }
    if (diagnostic.message.includes('Missing opening brace')) {
      return ' {';
    }
    if (diagnostic.message.includes('Missing semicolon')) {
      return ';';
    }
    return '';
  }

  // Cache management
  clearCache(): void {
    this.completionCache.clear();
    this.diagnosticCache.clear();
  }
}

export const intelliSenseService = new IntelliSenseService(); 