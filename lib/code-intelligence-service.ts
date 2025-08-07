/**
 * White Rabbit Code Editor - Code Intelligence Service
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

export type Language = 'typescript' | 'javascript' | 'python' | 'rust' | 'go' | 'java' | 'csharp'

export interface Position {
  line: number
  character: number
}

export interface Range {
  start: Position
  end: Position
}

export interface Location {
  uri: string
  range: Range
}

export interface CompletionItem {
  label: string
  kind: CompletionItemKind
  detail?: string
  documentation?: string
  insertText?: string
  filterText?: string
  sortText?: string
  additionalTextEdits?: TextEdit[]
  command?: Command
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
  TypeParameter = 25
}

export interface TextEdit {
  range: Range
  newText: string
}

export interface Command {
  title: string
  command: string
  arguments?: any[]
}

export interface Diagnostic {
  range: Range
  severity: DiagnosticSeverity
  code?: string | number
  source?: string
  message: string
  relatedInformation?: DiagnosticRelatedInformation[]
}

export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4
}

export interface DiagnosticRelatedInformation {
  location: Location
  message: string
}

export interface Hover {
  contents: string | string[]
  range?: Range
}

export interface SignatureHelp {
  signatures: SignatureInformation[]
  activeSignature?: number
  activeParameter?: number
}

export interface SignatureInformation {
  label: string
  documentation?: string
  parameters?: ParameterInformation[]
}

export interface ParameterInformation {
  label: string
  documentation?: string
}

export interface DefinitionResult {
  location: Location
  originSelectionRange?: Range
}

export interface ReferenceResult {
  locations: Location[]
}

export interface DocumentSymbol {
  name: string
  detail?: string
  kind: SymbolKind
  range: Range
  selectionRange: Range
  children?: DocumentSymbol[]
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
  TypeParameter = 26
}

export interface WorkspaceEdit {
  changes?: { [uri: string]: TextEdit[] }
  documentChanges?: TextDocumentEdit[]
}

export interface TextDocumentEdit {
  textDocument: { uri: string; version: number }
  edits: TextEdit[]
}

export interface RenameResult {
  changes: WorkspaceEdit
}

export interface CodeAction {
  title: string
  kind?: string
  diagnostics?: Diagnostic[]
  edit?: WorkspaceEdit
  command?: Command
}

export interface FormattingOptions {
  tabSize: number
  insertSpaces: boolean
  trimTrailingWhitespace?: boolean
  insertFinalNewline?: boolean
  trimFinalNewlines?: boolean
}

export class CodeIntelligenceService {
  private languageServers: Map<Language, any> = new Map()
  private documents: Map<string, { content: string; version: number; language: Language }> = new Map()
  private diagnostics: Map<string, Diagnostic[]> = new Map()
  private onDiagnosticsUpdate?: (uri: string, diagnostics: Diagnostic[]) => void

  constructor(onDiagnosticsUpdate?: (uri: string, diagnostics: Diagnostic[]) => void) {
    this.onDiagnosticsUpdate = onDiagnosticsUpdate
    this.initializeLanguageServers()
  }

  private async initializeLanguageServers(): Promise<void> {
    // In a real implementation, this would initialize actual language servers
    // For now, we'll simulate the language server capabilities
    console.log('🧠 Initializing language servers...')
    
    // Simulate TypeScript language server
    this.languageServers.set('typescript', {
      initialized: true,
      capabilities: {
        completionProvider: true,
        hoverProvider: true,
        signatureHelpProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        codeActionProvider: true,
        documentFormattingProvider: true,
        documentRangeFormattingProvider: true,
        renameProvider: true
      }
    })

    // Simulate JavaScript language server
    this.languageServers.set('javascript', {
      initialized: true,
      capabilities: {
        completionProvider: true,
        hoverProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        documentFormattingProvider: true
      }
    })

    console.log('✅ Language servers initialized')
  }

  // Open document
  async openDocument(uri: string, content: string, language: Language): Promise<void> {
    this.documents.set(uri, { content, version: 1, language })
    
    // Run initial diagnostics
    await this.validateDocument(uri)
  }

  // Update document
  async updateDocument(uri: string, content: string): Promise<void> {
    const doc = this.documents.get(uri)
    if (doc) {
      doc.content = content
      doc.version += 1
      
      // Run diagnostics on change
      await this.validateDocument(uri)
    }
  }

  // Close document
  closeDocument(uri: string): void {
    this.documents.delete(uri)
    this.diagnostics.delete(uri)
  }

  // Get completions
  async getCompletions(uri: string, position: Position): Promise<CompletionItem[]> {
    const doc = this.documents.get(uri)
    if (!doc) return []

    const languageServer = this.languageServers.get(doc.language)
    if (!languageServer?.capabilities.completionProvider) return []

    // Simulate completion items based on language
    return this.generateCompletions(doc, position)
  }

  private generateCompletions(doc: any, position: Position): CompletionItem[] {
    const completions: CompletionItem[] = []
    
    // Get current line content
    const lines = doc.content.split('\n')
    const currentLine = lines[position.line] || ''
    const beforeCursor = currentLine.substring(0, position.character)

    // JavaScript/TypeScript completions
    if (doc.language === 'typescript' || doc.language === 'javascript') {
      // Console methods
      if (beforeCursor.includes('console.')) {
        completions.push(
          { label: 'log', kind: CompletionItemKind.Method, detail: '(method) Console.log(...data: any[]): void' },
          { label: 'error', kind: CompletionItemKind.Method, detail: '(method) Console.error(...data: any[]): void' },
          { label: 'warn', kind: CompletionItemKind.Method, detail: '(method) Console.warn(...data: any[]): void' },
          { label: 'info', kind: CompletionItemKind.Method, detail: '(method) Console.info(...data: any[]): void' }
        )
      }

      // Array methods
      if (beforeCursor.match(/\w+\./)) {
        completions.push(
          { label: 'map', kind: CompletionItemKind.Method, detail: '(method) Array<T>.map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[]' },
          { label: 'filter', kind: CompletionItemKind.Method, detail: '(method) Array<T>.filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): T[]' },
          { label: 'reduce', kind: CompletionItemKind.Method, detail: '(method) Array<T>.reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T): T' },
          { label: 'forEach', kind: CompletionItemKind.Method, detail: '(method) Array<T>.forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void' }
        )
      }

      // Keywords
      if (!beforeCursor.match(/\w+\./)) {
        completions.push(
          { label: 'function', kind: CompletionItemKind.Keyword, insertText: 'function ${1:name}(${2:params}) {\n\t${3}\n}' },
          { label: 'const', kind: CompletionItemKind.Keyword, insertText: 'const ${1:name} = ${2:value}' },
          { label: 'let', kind: CompletionItemKind.Keyword, insertText: 'let ${1:name} = ${2:value}' },
          { label: 'if', kind: CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\n\t${2}\n}' },
          { label: 'for', kind: CompletionItemKind.Keyword, insertText: 'for (${1:let i = 0}; ${2:i < length}; ${3:i++}) {\n\t${4}\n}' }
        )
      }

      // React completions for TypeScript
      if (doc.language === 'typescript' && doc.content.includes('React')) {
        completions.push(
          { label: 'useState', kind: CompletionItemKind.Function, detail: 'React Hook', insertText: 'useState(${1:initialState})' },
          { label: 'useEffect', kind: CompletionItemKind.Function, detail: 'React Hook', insertText: 'useEffect(() => {\n\t${1}\n}, [${2:dependencies}])' },
          { label: 'useCallback', kind: CompletionItemKind.Function, detail: 'React Hook', insertText: 'useCallback(${1:callback}, [${2:dependencies}])' },
          { label: 'useMemo', kind: CompletionItemKind.Function, detail: 'React Hook', insertText: 'useMemo(() => ${1:computation}, [${2:dependencies}])' }
        )
      }
    }

    return completions
  }

  // Get hover information
  async getHover(uri: string, position: Position): Promise<Hover | null> {
    const doc = this.documents.get(uri)
    if (!doc) return null

    const languageServer = this.languageServers.get(doc.language)
    if (!languageServer?.capabilities.hoverProvider) return null

    // Simulate hover information
    const lines = doc.content.split('\n')
    const currentLine = lines[position.line] || ''
    const word = this.getWordAtPosition(currentLine, position.character)

    if (!word) return null

    // Generate hover content based on word
    const hoverContent = this.generateHoverContent(word, doc.language)
    if (!hoverContent) return null

    return {
      contents: hoverContent,
      range: {
        start: { line: position.line, character: position.character - word.length },
        end: { line: position.line, character: position.character }
      }
    }
  }

  private getWordAtPosition(line: string, character: number): string {
    const before = line.substring(0, character)
    const after = line.substring(character)
    
    const beforeMatch = before.match(/\w+$/)
    const afterMatch = after.match(/^\w+/)
    
    const beforePart = beforeMatch ? beforeMatch[0] : ''
    const afterPart = afterMatch ? afterMatch[0] : ''
    
    return beforePart + afterPart
  }

  private generateHoverContent(word: string, language: Language): string | null {
    const hoverMap: Record<string, string> = {
      'console': '**Console** - Provides access to the browser\'s debugging console',
      'log': '**console.log()** - Outputs a message to the web console',
      'function': '**function** - Declares a function',
      'const': '**const** - Declares a read-only named constant',
      'let': '**let** - Declares a block-scoped local variable',
      'var': '**var** - Declares a variable',
      'if': '**if** - Executes a statement if a specified condition is truthy',
      'for': '**for** - Creates a loop that consists of three optional expressions',
      'while': '**while** - Creates a loop that executes a specified statement as long as the test condition evaluates to true',
      'return': '**return** - Ends function execution and specifies a value to be returned',
      'import': '**import** - Used to import bindings which are exported by another module',
      'export': '**export** - Used when creating JavaScript modules to export functions, objects, or primitive values',
      'class': '**class** - Declares a class',
      'interface': '**interface** - Declares an interface (TypeScript)',
      'type': '**type** - Declares a type alias (TypeScript)'
    }

    return hoverMap[word] || null
  }

  // Get signature help
  async getSignatureHelp(uri: string, position: Position): Promise<SignatureHelp | null> {
    const doc = this.documents.get(uri)
    if (!doc) return null

    const languageServer = this.languageServers.get(doc.language)
    if (!languageServer?.capabilities.signatureHelpProvider) return null

    // Simulate signature help
    const lines = doc.content.split('\n')
    const currentLine = lines[position.line] || ''
    const beforeCursor = currentLine.substring(0, position.character)

    // Check if we're inside function call
    const functionMatch = beforeCursor.match(/(\w+)\s*\([^)]*$/)
    if (!functionMatch) return null

    const functionName = functionMatch[1]
    const signatures = this.generateSignatures(functionName)

    if (signatures.length === 0) return null

    return {
      signatures,
      activeSignature: 0,
      activeParameter: 0
    }
  }

  private generateSignatures(functionName: string): SignatureInformation[] {
    const signatureMap: Record<string, SignatureInformation> = {
      'log': {
        label: 'log(...data: any[]): void',
        documentation: 'Outputs a message to the console',
        parameters: [
          { label: 'data', documentation: 'Data to output' }
        ]
      },
      'map': {
        label: 'map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[]',
        documentation: 'Calls a defined callback function on each element of an array, and returns an array that contains the results',
        parameters: [
          { label: 'callbackfn', documentation: 'A function that accepts up to three arguments' },
          { label: 'thisArg', documentation: 'An object to which the this keyword can refer in the callbackfn function' }
        ]
      },
      'filter': {
        label: 'filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): T[]',
        documentation: 'Returns the elements of an array that meet the condition specified in a callback function',
        parameters: [
          { label: 'predicate', documentation: 'A function that accepts up to three arguments' },
          { label: 'thisArg', documentation: 'An object to which the this keyword can refer in the predicate function' }
        ]
      }
    }

    const signature = signatureMap[functionName]
    return signature ? [signature] : []
  }

  // Go to definition
  async getDefinition(uri: string, position: Position): Promise<DefinitionResult[]> {
    const doc = this.documents.get(uri)
    if (!doc) return []

    const languageServer = this.languageServers.get(doc.language)
    if (!languageServer?.capabilities.definitionProvider) return []

    // Simulate definition lookup
    const lines = doc.content.split('\n')
    const currentLine = lines[position.line] || ''
    const word = this.getWordAtPosition(currentLine, position.character)

    if (!word) return []

    // Find definition in current document (simplified)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.includes(`function ${word}`) || 
          line.includes(`const ${word}`) || 
          line.includes(`let ${word}`) ||
          line.includes(`class ${word}`)) {
        return [{
          location: {
            uri,
            range: {
              start: { line: i, character: line.indexOf(word) },
              end: { line: i, character: line.indexOf(word) + word.length }
            }
          }
        }]
      }
    }

    return []
  }

  // Find references
  async getReferences(uri: string, position: Position): Promise<ReferenceResult> {
    const doc = this.documents.get(uri)
    if (!doc) return { locations: [] }

    const languageServer = this.languageServers.get(doc.language)
    if (!languageServer?.capabilities.referencesProvider) return { locations: [] }

    // Simulate reference finding
    const lines = doc.content.split('\n')
    const currentLine = lines[position.line] || ''
    const word = this.getWordAtPosition(currentLine, position.character)

    if (!word) return { locations: [] }

    const locations: Location[] = []

    // Find all occurrences in current document
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      let index = 0
      while ((index = line.indexOf(word, index)) !== -1) {
        locations.push({
          uri,
          range: {
            start: { line: i, character: index },
            end: { line: i, character: index + word.length }
          }
        })
        index += word.length
      }
    }

    return { locations }
  }

  // Get document symbols
  async getDocumentSymbols(uri: string): Promise<DocumentSymbol[]> {
    const doc = this.documents.get(uri)
    if (!doc) return []

    const languageServer = this.languageServers.get(doc.language)
    if (!languageServer?.capabilities.documentSymbolProvider) return []

    // Simulate symbol extraction
    const symbols: DocumentSymbol[] = []
    const lines = doc.content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Functions
      const functionMatch = line.match(/function\s+(\w+)/)
      if (functionMatch) {
        symbols.push({
          name: functionMatch[1],
          kind: SymbolKind.Function,
          range: { start: { line: i, character: 0 }, end: { line: i, character: line.length } },
          selectionRange: { start: { line: i, character: functionMatch.index! }, end: { line: i, character: functionMatch.index! + functionMatch[0].length } }
        })
      }

      // Classes
      const classMatch = line.match(/class\s+(\w+)/)
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: SymbolKind.Class,
          range: { start: { line: i, character: 0 }, end: { line: i, character: line.length } },
          selectionRange: { start: { line: i, character: classMatch.index! }, end: { line: i, character: classMatch.index! + classMatch[0].length } }
        })
      }

      // Variables
      const varMatch = line.match(/(const|let|var)\s+(\w+)/)
      if (varMatch) {
        symbols.push({
          name: varMatch[2],
          kind: SymbolKind.Variable,
          range: { start: { line: i, character: 0 }, end: { line: i, character: line.length } },
          selectionRange: { start: { line: i, character: varMatch.index! }, end: { line: i, character: varMatch.index! + varMatch[0].length } }
        })
      }
    }

    return symbols
  }

  // Format document
  async formatDocument(uri: string, options: FormattingOptions): Promise<TextEdit[]> {
    const doc = this.documents.get(uri)
    if (!doc) return []

    const languageServer = this.languageServers.get(doc.language)
    if (!languageServer?.capabilities.documentFormattingProvider) return []

    // Simulate formatting (in real implementation, would use prettier or similar)
    const edits: TextEdit[] = []
    const lines = doc.content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      if (trimmed && line !== trimmed) {
        // Fix indentation
        const indentLevel = this.calculateIndentLevel(lines, i)
        const indent = options.insertSpaces 
          ? ' '.repeat(indentLevel * options.tabSize)
          : '\t'.repeat(indentLevel)
        
        edits.push({
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: line.length }
          },
          newText: indent + trimmed
        })
      }
    }

    return edits
  }

  private calculateIndentLevel(lines: string[], lineIndex: number): number {
    // Simple indentation calculation
    let level = 0
    for (let i = 0; i < lineIndex; i++) {
      const line = lines[i].trim()
      if (line.endsWith('{')) level++
      if (line.startsWith('}')) level--
    }
    return Math.max(0, level)
  }

  // Validate document and generate diagnostics
  private async validateDocument(uri: string): Promise<void> {
    const doc = this.documents.get(uri)
    if (!doc) return

    const diagnostics: Diagnostic[] = []
    const lines = doc.content.split('\n')

    // Simple validation rules
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Check for console.log (warning)
      if (line.includes('console.log')) {
        diagnostics.push({
          range: {
            start: { line: i, character: line.indexOf('console.log') },
            end: { line: i, character: line.indexOf('console.log') + 'console.log'.length }
          },
          severity: DiagnosticSeverity.Warning,
          message: 'Unexpected console statement',
          source: 'white-rabbit'
        })
      }

      // Check for missing semicolons (error)
      if (doc.language === 'javascript' || doc.language === 'typescript') {
        const trimmed = line.trim()
        if (trimmed && 
            !trimmed.endsWith(';') && 
            !trimmed.endsWith('{') && 
            !trimmed.endsWith('}') &&
            !trimmed.startsWith('//') &&
            !trimmed.includes('if ') &&
            !trimmed.includes('for ') &&
            !trimmed.includes('while ')) {
          diagnostics.push({
            range: {
              start: { line: i, character: line.length },
              end: { line: i, character: line.length }
            },
            severity: DiagnosticSeverity.Error,
            message: 'Missing semicolon',
            source: 'white-rabbit'
          })
        }
      }
    }

    this.diagnostics.set(uri, diagnostics)
    this.onDiagnosticsUpdate?.(uri, diagnostics)
  }

  // Get diagnostics for document
  getDiagnostics(uri: string): Diagnostic[] {
    return this.diagnostics.get(uri) || []
  }

  // Get all diagnostics
  getAllDiagnostics(): Map<string, Diagnostic[]> {
    return new Map(this.diagnostics)
  }

  // Rename symbol
  async rename(uri: string, position: Position, newName: string): Promise<RenameResult | null> {
    const references = await this.getReferences(uri, position)
    if (references.locations.length === 0) return null

    const changes: { [uri: string]: TextEdit[] } = {}
    
    for (const location of references.locations) {
      if (!changes[location.uri]) {
        changes[location.uri] = []
      }
      
      changes[location.uri].push({
        range: location.range,
        newText: newName
      })
    }

    return { changes: { changes } }
  }

  // Get code actions
  async getCodeActions(uri: string, range: Range, diagnostics: Diagnostic[]): Promise<CodeAction[]> {
    const actions: CodeAction[] = []
    
    for (const diagnostic of diagnostics) {
      if (diagnostic.message === 'Missing semicolon') {
        actions.push({
          title: 'Add semicolon',
          kind: 'quickfix',
          diagnostics: [diagnostic],
          edit: {
            changes: {
              [uri]: [{
                range: diagnostic.range,
                newText: ';'
              }]
            }
          }
        })
      }
      
      if (diagnostic.message === 'Unexpected console statement') {
        actions.push({
          title: 'Remove console statement',
          kind: 'quickfix',
          diagnostics: [diagnostic],
          edit: {
            changes: {
              [uri]: [{
                range: {
                  start: { line: diagnostic.range.start.line, character: 0 },
                  end: { line: diagnostic.range.start.line + 1, character: 0 }
                },
                newText: ''
              }]
            }
          }
        })
      }
    }

    return actions
  }
}
