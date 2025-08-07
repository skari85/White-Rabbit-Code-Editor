/**
 * White Rabbit Code Editor - Language Server Protocol Client
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

export type SupportedLanguage = 'typescript' | 'javascript' | 'python' | 'rust' | 'go' | 'java' | 'csharp' | 'cpp' | 'php' | 'ruby'

export interface LSPServerConfig {
  language: SupportedLanguage
  serverName: string
  command: string
  args: string[]
  initializationOptions?: any
  settings?: any
  documentSelector: DocumentFilter[]
  capabilities: ServerCapabilities
}

export interface DocumentFilter {
  language?: string
  scheme?: string
  pattern?: string
}

export interface ServerCapabilities {
  textDocumentSync?: number
  completionProvider?: boolean
  hoverProvider?: boolean
  signatureHelpProvider?: boolean
  definitionProvider?: boolean
  referencesProvider?: boolean
  documentHighlightProvider?: boolean
  documentSymbolProvider?: boolean
  workspaceSymbolProvider?: boolean
  codeActionProvider?: boolean
  codeLensProvider?: boolean
  documentFormattingProvider?: boolean
  documentRangeFormattingProvider?: boolean
  documentOnTypeFormattingProvider?: boolean
  renameProvider?: boolean
  foldingRangeProvider?: boolean
  executeCommandProvider?: boolean
  semanticTokensProvider?: boolean
  inlayHintProvider?: boolean
}

export interface LSPRequest {
  id: string
  method: string
  params?: any
}

export interface LSPResponse {
  id: string
  result?: any
  error?: LSPError
}

export interface LSPError {
  code: number
  message: string
  data?: any
}

export interface LSPNotification {
  method: string
  params?: any
}

export interface Position {
  line: number
  character: number
}

export interface Range {
  start: Position
  end: Position
}

export interface TextDocumentIdentifier {
  uri: string
}

export interface VersionedTextDocumentIdentifier extends TextDocumentIdentifier {
  version: number
}

export interface TextDocumentItem {
  uri: string
  languageId: string
  version: number
  text: string
}

export interface CompletionItem {
  label: string
  kind?: CompletionItemKind
  detail?: string
  documentation?: string
  sortText?: string
  filterText?: string
  insertText?: string
  insertTextFormat?: InsertTextFormat
  textEdit?: TextEdit
  additionalTextEdits?: TextEdit[]
  commitCharacters?: string[]
  command?: Command
  data?: any
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

export enum InsertTextFormat {
  PlainText = 1,
  Snippet = 2
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

export interface Location {
  uri: string
  range: Range
}

export interface DocumentSymbol {
  name: string
  detail?: string
  kind: SymbolKind
  deprecated?: boolean
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

export interface Diagnostic {
  range: Range
  severity?: DiagnosticSeverity
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

export class LanguageServerClient {
  private servers: Map<SupportedLanguage, LSPServerConfig> = new Map()
  private connections: Map<SupportedLanguage, any> = new Map() // WebSocket or Worker connections
  private requestId = 0
  private pendingRequests: Map<string, { resolve: Function; reject: Function }> = new Map()
  private documents: Map<string, TextDocumentItem> = new Map()
  private onDiagnostics?: (uri: string, diagnostics: Diagnostic[]) => void

  constructor(onDiagnostics?: (uri: string, diagnostics: Diagnostic[]) => void) {
    this.onDiagnostics = onDiagnostics
    this.initializeDefaultServers()
  }

  private initializeDefaultServers(): void {
    // TypeScript/JavaScript Language Server
    this.servers.set('typescript', {
      language: 'typescript',
      serverName: 'typescript-language-server',
      command: 'typescript-language-server',
      args: ['--stdio'],
      documentSelector: [
        { language: 'typescript' },
        { language: 'javascript' },
        { language: 'typescriptreact' },
        { language: 'javascriptreact' }
      ],
      capabilities: {
        textDocumentSync: 2,
        completionProvider: true,
        hoverProvider: true,
        signatureHelpProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        codeActionProvider: true,
        documentFormattingProvider: true,
        renameProvider: true,
        foldingRangeProvider: true
      }
    })

    // Python Language Server (Pylsp)
    this.servers.set('python', {
      language: 'python',
      serverName: 'pylsp',
      command: 'pylsp',
      args: [],
      documentSelector: [{ language: 'python' }],
      capabilities: {
        textDocumentSync: 2,
        completionProvider: true,
        hoverProvider: true,
        signatureHelpProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        codeActionProvider: true,
        documentFormattingProvider: true,
        renameProvider: true
      }
    })

    // Rust Language Server (rust-analyzer)
    this.servers.set('rust', {
      language: 'rust',
      serverName: 'rust-analyzer',
      command: 'rust-analyzer',
      args: [],
      documentSelector: [{ language: 'rust' }],
      capabilities: {
        textDocumentSync: 2,
        completionProvider: true,
        hoverProvider: true,
        signatureHelpProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        codeActionProvider: true,
        documentFormattingProvider: true,
        renameProvider: true,
        foldingRangeProvider: true,
        semanticTokensProvider: true,
        inlayHintProvider: true
      }
    })

    // Go Language Server (gopls)
    this.servers.set('go', {
      language: 'go',
      serverName: 'gopls',
      command: 'gopls',
      args: [],
      documentSelector: [{ language: 'go' }],
      capabilities: {
        textDocumentSync: 2,
        completionProvider: true,
        hoverProvider: true,
        signatureHelpProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        codeActionProvider: true,
        documentFormattingProvider: true,
        renameProvider: true,
        foldingRangeProvider: true
      }
    })

    // Java Language Server (Eclipse JDT)
    this.servers.set('java', {
      language: 'java',
      serverName: 'jdtls',
      command: 'jdtls',
      args: [],
      documentSelector: [{ language: 'java' }],
      capabilities: {
        textDocumentSync: 2,
        completionProvider: true,
        hoverProvider: true,
        signatureHelpProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        codeActionProvider: true,
        documentFormattingProvider: true,
        renameProvider: true,
        foldingRangeProvider: true,
        executeCommandProvider: true
      }
    })

    // C# Language Server (OmniSharp)
    this.servers.set('csharp', {
      language: 'csharp',
      serverName: 'omnisharp',
      command: 'omnisharp',
      args: ['--languageserver'],
      documentSelector: [{ language: 'csharp' }],
      capabilities: {
        textDocumentSync: 2,
        completionProvider: true,
        hoverProvider: true,
        signatureHelpProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        codeActionProvider: true,
        documentFormattingProvider: true,
        renameProvider: true
      }
    })
  }

  // Register a custom language server
  registerLanguageServer(config: LSPServerConfig): void {
    this.servers.set(config.language, config)
    console.log(`📝 Registered language server for ${config.language}: ${config.serverName}`)
  }

  // Start language server for a specific language
  async startLanguageServer(language: SupportedLanguage): Promise<void> {
    const config = this.servers.get(language)
    if (!config) {
      throw new Error(`No language server configuration found for ${language}`)
    }

    if (this.connections.has(language)) {
      console.log(`Language server for ${language} is already running`)
      return
    }

    try {
      // In a browser environment, we'll simulate the language server
      // In a real implementation, this would connect to a WebSocket or Web Worker
      const connection = await this.createConnection(config)
      this.connections.set(language, connection)

      // Initialize the language server
      await this.initialize(language)
      
      console.log(`🚀 Started language server for ${language}`)
    } catch (error) {
      console.error(`Failed to start language server for ${language}:`, error)
      throw error
    }
  }

  // Create connection (simulated for browser environment)
  private async createConnection(config: LSPServerConfig): Promise<any> {
    // In a real implementation, this would create a WebSocket connection
    // or spawn a Web Worker that communicates with the language server
    
    // For now, we'll simulate the connection
    return {
      config,
      initialized: false,
      send: (message: any) => {
        // Simulate sending message to language server
        console.log(`Sending to ${config.language} LSP:`, message)
        
        // Simulate response after delay
        setTimeout(() => {
          this.handleMessage(config.language, this.simulateResponse(message))
        }, 100)
      }
    }
  }

  // Simulate language server responses
  private simulateResponse(request: any): any {
    if (request.method === 'initialize') {
      return {
        id: request.id,
        result: {
          capabilities: {
            textDocumentSync: 2,
            completionProvider: true,
            hoverProvider: true,
            signatureHelpProvider: true,
            definitionProvider: true,
            referencesProvider: true,
            documentSymbolProvider: true,
            codeActionProvider: true,
            documentFormattingProvider: true
          }
        }
      }
    }

    if (request.method === 'textDocument/completion') {
      return {
        id: request.id,
        result: {
          isIncomplete: false,
          items: this.generateCompletions(request.params)
        }
      }
    }

    if (request.method === 'textDocument/hover') {
      return {
        id: request.id,
        result: {
          contents: 'Hover information for symbol',
          range: request.params.range
        }
      }
    }

    return { id: request.id, result: null }
  }

  // Generate language-specific completions
  private generateCompletions(params: any): CompletionItem[] {
    const completions: CompletionItem[] = []
    
    // Add some basic completions based on language context
    completions.push(
      {
        label: 'function',
        kind: CompletionItemKind.Keyword,
        insertText: 'function ${1:name}(${2:params}) {\n\t${3}\n}',
        insertTextFormat: InsertTextFormat.Snippet
      },
      {
        label: 'class',
        kind: CompletionItemKind.Keyword,
        insertText: 'class ${1:ClassName} {\n\t${2}\n}',
        insertTextFormat: InsertTextFormat.Snippet
      },
      {
        label: 'interface',
        kind: CompletionItemKind.Keyword,
        insertText: 'interface ${1:InterfaceName} {\n\t${2}\n}',
        insertTextFormat: InsertTextFormat.Snippet
      }
    )

    return completions
  }

  // Handle messages from language server
  private handleMessage(language: SupportedLanguage, message: any): void {
    if (message.id) {
      // Response to a request
      const pending = this.pendingRequests.get(message.id)
      if (pending) {
        if (message.error) {
          pending.reject(new Error(message.error.message))
        } else {
          pending.resolve(message.result)
        }
        this.pendingRequests.delete(message.id)
      }
    } else {
      // Notification from server
      this.handleNotification(language, message)
    }
  }

  // Handle notifications from language server
  private handleNotification(language: SupportedLanguage, notification: LSPNotification): void {
    switch (notification.method) {
      case 'textDocument/publishDiagnostics':
        if (this.onDiagnostics && notification.params) {
          this.onDiagnostics(notification.params.uri, notification.params.diagnostics)
        }
        break
      
      case 'window/logMessage':
        console.log(`${language} LSP:`, notification.params?.message)
        break
      
      case 'window/showMessage':
        console.info(`${language} LSP:`, notification.params?.message)
        break
    }
  }

  // Initialize language server
  private async initialize(language: SupportedLanguage): Promise<void> {
    const connection = this.connections.get(language)
    if (!connection) return

    const initializeParams = {
      processId: null,
      clientInfo: {
        name: 'White Rabbit Code Editor',
        version: '1.0.0'
      },
      rootUri: null,
      capabilities: {
        textDocument: {
          synchronization: {
            dynamicRegistration: false,
            willSave: false,
            willSaveWaitUntil: false,
            didSave: false
          },
          completion: {
            dynamicRegistration: false,
            completionItem: {
              snippetSupport: true,
              commitCharactersSupport: true,
              documentationFormat: ['markdown', 'plaintext']
            }
          },
          hover: {
            dynamicRegistration: false,
            contentFormat: ['markdown', 'plaintext']
          },
          signatureHelp: {
            dynamicRegistration: false,
            signatureInformation: {
              documentationFormat: ['markdown', 'plaintext']
            }
          },
          definition: { dynamicRegistration: false },
          references: { dynamicRegistration: false },
          documentSymbol: { dynamicRegistration: false },
          codeAction: { dynamicRegistration: false },
          formatting: { dynamicRegistration: false },
          rename: { dynamicRegistration: false }
        },
        workspace: {
          workspaceFolders: false,
          configuration: false,
          didChangeConfiguration: { dynamicRegistration: false },
          didChangeWatchedFiles: { dynamicRegistration: false },
          symbol: { dynamicRegistration: false },
          executeCommand: { dynamicRegistration: false }
        }
      }
    }

    await this.sendRequest(language, 'initialize', initializeParams)
    await this.sendNotification(language, 'initialized', {})
    
    connection.initialized = true
  }

  // Send request to language server
  private async sendRequest(language: SupportedLanguage, method: string, params?: any): Promise<any> {
    const connection = this.connections.get(language)
    if (!connection) {
      throw new Error(`No connection for language ${language}`)
    }

    const id = (++this.requestId).toString()
    const request: LSPRequest = { id, method, params }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject })
      connection.send(request)
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error(`Request timeout: ${method}`))
        }
      }, 30000)
    })
  }

  // Send notification to language server
  private async sendNotification(language: SupportedLanguage, method: string, params?: any): Promise<void> {
    const connection = this.connections.get(language)
    if (!connection) return

    const notification: LSPNotification = { method, params }
    connection.send(notification)
  }

  // Open document
  async openDocument(uri: string, languageId: SupportedLanguage, version: number, text: string): Promise<void> {
    const document: TextDocumentItem = { uri, languageId, version, text }
    this.documents.set(uri, document)

    // Start language server if not already running
    if (!this.connections.has(languageId)) {
      await this.startLanguageServer(languageId)
    }

    // Notify language server about opened document
    await this.sendNotification(languageId, 'textDocument/didOpen', {
      textDocument: document
    })
  }

  // Update document
  async updateDocument(uri: string, version: number, changes: any[]): Promise<void> {
    const document = this.documents.get(uri)
    if (!document) return

    document.version = version
    
    // Apply changes to document text
    for (const change of changes) {
      if (change.range) {
        // Incremental change
        // In a real implementation, you'd apply the range-based change
        document.text = change.text
      } else {
        // Full document change
        document.text = change.text
      }
    }

    // Notify language server about document change
    await this.sendNotification(document.languageId, 'textDocument/didChange', {
      textDocument: { uri, version },
      contentChanges: changes
    })
  }

  // Close document
  async closeDocument(uri: string): Promise<void> {
    const document = this.documents.get(uri)
    if (!document) return

    // Notify language server about closed document
    await this.sendNotification(document.languageId, 'textDocument/didClose', {
      textDocument: { uri }
    })

    this.documents.delete(uri)
  }

  // Get completions
  async getCompletions(uri: string, position: Position): Promise<CompletionItem[]> {
    const document = this.documents.get(uri)
    if (!document) return []

    try {
      const result = await this.sendRequest(document.languageId, 'textDocument/completion', {
        textDocument: { uri },
        position
      })

      return result?.items || []
    } catch (error) {
      console.error('Failed to get completions:', error)
      return []
    }
  }

  // Get hover information
  async getHover(uri: string, position: Position): Promise<Hover | null> {
    const document = this.documents.get(uri)
    if (!document) return null

    try {
      const result = await this.sendRequest(document.languageId, 'textDocument/hover', {
        textDocument: { uri },
        position
      })

      return result || null
    } catch (error) {
      console.error('Failed to get hover:', error)
      return null
    }
  }

  // Get signature help
  async getSignatureHelp(uri: string, position: Position): Promise<SignatureHelp | null> {
    const document = this.documents.get(uri)
    if (!document) return null

    try {
      const result = await this.sendRequest(document.languageId, 'textDocument/signatureHelp', {
        textDocument: { uri },
        position
      })

      return result || null
    } catch (error) {
      console.error('Failed to get signature help:', error)
      return null
    }
  }

  // Go to definition
  async getDefinition(uri: string, position: Position): Promise<Location[]> {
    const document = this.documents.get(uri)
    if (!document) return []

    try {
      const result = await this.sendRequest(document.languageId, 'textDocument/definition', {
        textDocument: { uri },
        position
      })

      return Array.isArray(result) ? result : result ? [result] : []
    } catch (error) {
      console.error('Failed to get definition:', error)
      return []
    }
  }

  // Find references
  async getReferences(uri: string, position: Position, includeDeclaration: boolean = false): Promise<Location[]> {
    const document = this.documents.get(uri)
    if (!document) return []

    try {
      const result = await this.sendRequest(document.languageId, 'textDocument/references', {
        textDocument: { uri },
        position,
        context: { includeDeclaration }
      })

      return result || []
    } catch (error) {
      console.error('Failed to get references:', error)
      return []
    }
  }

  // Get document symbols
  async getDocumentSymbols(uri: string): Promise<DocumentSymbol[]> {
    const document = this.documents.get(uri)
    if (!document) return []

    try {
      const result = await this.sendRequest(document.languageId, 'textDocument/documentSymbol', {
        textDocument: { uri }
      })

      return result || []
    } catch (error) {
      console.error('Failed to get document symbols:', error)
      return []
    }
  }

  // Format document
  async formatDocument(uri: string, options: any): Promise<TextEdit[]> {
    const document = this.documents.get(uri)
    if (!document) return []

    try {
      const result = await this.sendRequest(document.languageId, 'textDocument/formatting', {
        textDocument: { uri },
        options
      })

      return result || []
    } catch (error) {
      console.error('Failed to format document:', error)
      return []
    }
  }

  // Get supported languages
  getSupportedLanguages(): SupportedLanguage[] {
    return Array.from(this.servers.keys())
  }

  // Check if language is supported
  isLanguageSupported(language: string): boolean {
    return this.servers.has(language as SupportedLanguage)
  }

  // Stop language server
  async stopLanguageServer(language: SupportedLanguage): Promise<void> {
    const connection = this.connections.get(language)
    if (!connection) return

    try {
      await this.sendRequest(language, 'shutdown', null)
      await this.sendNotification(language, 'exit', null)
    } catch (error) {
      console.error(`Failed to shutdown language server for ${language}:`, error)
    }

    this.connections.delete(language)
    console.log(`🛑 Stopped language server for ${language}`)
  }

  // Stop all language servers
  async stopAllLanguageServers(): Promise<void> {
    const languages = Array.from(this.connections.keys())
    await Promise.all(languages.map(lang => this.stopLanguageServer(lang)))
  }
}
