/**
 * White Rabbit Code Editor - Extension System
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

export interface ExtensionManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  license?: string
  homepage?: string
  repository?: string
  
  // Extension metadata
  displayName: string
  icon?: string
  category: ExtensionCategory
  keywords: string[]
  
  // Compatibility
  engines: {
    whiterabbit: string // semver range
  }
  
  // Extension points
  contributes: {
    commands?: CommandContribution[]
    menus?: MenuContribution[]
    keybindings?: KeybindingContribution[]
    languages?: LanguageContribution[]
    themes?: ThemeContribution[]
    snippets?: SnippetContribution[]
    grammars?: GrammarContribution[]
    debuggers?: DebuggerContribution[]
    taskProviders?: TaskProviderContribution[]
    views?: ViewContribution[]
    viewsContainers?: ViewContainerContribution[]
    configuration?: ConfigurationContribution[]
  }
  
  // Activation events
  activationEvents: string[]
  
  // Main entry point
  main?: string
  
  // Dependencies
  dependencies?: Record<string, string>
  extensionDependencies?: string[]
  
  // Capabilities
  capabilities?: {
    virtualWorkspaces?: boolean
    untrustedWorkspaces?: boolean
  }
}

export type ExtensionCategory = 
  | 'Programming Languages'
  | 'Snippets'
  | 'Linters'
  | 'Themes'
  | 'Debuggers'
  | 'Formatters'
  | 'Keymaps'
  | 'SCM Providers'
  | 'Other'

export interface CommandContribution {
  command: string
  title: string
  category?: string
  icon?: string
  enablement?: string
}

export interface MenuContribution {
  commandPalette?: MenuItemContribution[]
  editor?: {
    context?: MenuItemContribution[]
    title?: MenuItemContribution[]
  }
  explorer?: {
    context?: MenuItemContribution[]
  }
  view?: {
    title?: MenuItemContribution[]
    item?: {
      context?: MenuItemContribution[]
    }
  }
}

export interface MenuItemContribution {
  command: string
  when?: string
  group?: string
  alt?: string
}

export interface KeybindingContribution {
  command: string
  key: string
  mac?: string
  linux?: string
  when?: string
  args?: any
}

export interface LanguageContribution {
  id: string
  aliases?: string[]
  extensions?: string[]
  filenames?: string[]
  firstLine?: string
  configuration?: string
}

export interface ThemeContribution {
  label: string
  uiTheme: 'vs' | 'vs-dark' | 'hc-black'
  path: string
}

export interface SnippetContribution {
  language: string
  path: string
}

export interface GrammarContribution {
  language: string
  scopeName: string
  path: string
  embeddedLanguages?: Record<string, string>
  tokenTypes?: Record<string, string>
}

export interface DebuggerContribution {
  type: string
  label: string
  program?: string
  runtime?: string
  configurationAttributes?: any
  initialConfigurations?: any[]
  configurationSnippets?: any[]
  variables?: Record<string, string>
}

export interface TaskProviderContribution {
  type: string
  required?: string[]
  properties?: any
}

export interface ViewContribution {
  id: string
  name: string
  when?: string
  icon?: string
  contextualTitle?: string
}

export interface ViewContainerContribution {
  id: string
  title: string
  icon: string
}

export interface ConfigurationContribution {
  title: string
  properties: Record<string, ConfigurationProperty>
}

export interface ConfigurationProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  default?: any
  description: string
  enum?: any[]
  enumDescriptions?: string[]
  markdownDescription?: string
  deprecationMessage?: string
  scope?: 'application' | 'machine' | 'window' | 'resource'
}

export interface Extension {
  manifest: ExtensionManifest
  extensionPath: string
  isActive: boolean
  exports?: any
  subscriptions: any[]
  packageJSON: any
}

export interface ExtensionContext {
  subscriptions: any[]
  workspaceState: any
  globalState: any
  extensionPath: string
  storagePath?: string
  globalStoragePath?: string
  logPath: string
  extensionUri: string
  environmentVariableCollection: any
  secrets: any
  extension: Extension
}

export interface ExtensionAPI {
  // Core APIs
  commands: {
    registerCommand(command: string, callback: (...args: any[]) => any): any
    executeCommand(command: string, ...args: any[]): Promise<any>
    getCommands(filterInternal?: boolean): Promise<string[]>
  }
  
  window: {
    showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>
    showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>
    showErrorMessage(message: string, ...items: string[]): Promise<string | undefined>
    showInputBox(options?: any): Promise<string | undefined>
    showQuickPick(items: string[] | any[], options?: any): Promise<any>
    createStatusBarItem(alignment?: any, priority?: number): any
    createOutputChannel(name: string): any
    createWebviewPanel(viewType: string, title: string, showOptions: any, options?: any): any
  }
  
  workspace: {
    workspaceFolders?: any[]
    rootPath?: string
    name?: string
    getConfiguration(section?: string, resource?: any): any
    onDidChangeConfiguration: any
    onDidChangeWorkspaceFolders: any
    findFiles(include: string, exclude?: string, maxResults?: number): Promise<any[]>
    openTextDocument(uri: any): Promise<any>
    saveAll(includeUntitled?: boolean): Promise<boolean>
  }
  
  languages: {
    registerCompletionItemProvider(selector: any, provider: any, ...triggerCharacters: string[]): any
    registerHoverProvider(selector: any, provider: any): any
    registerDefinitionProvider(selector: any, provider: any): any
    registerReferenceProvider(selector: any, provider: any): any
    registerDocumentSymbolProvider(selector: any, provider: any): any
    registerCodeActionsProvider(selector: any, provider: any): any
    registerDocumentFormattingEditProvider(selector: any, provider: any): any
    setLanguageConfiguration(languageId: string, configuration: any): any
  }
  
  debug: {
    registerDebugConfigurationProvider(debugType: string, provider: any): any
    registerDebugAdapterDescriptorFactory(debugType: string, factory: any): any
    startDebugging(folder: any, nameOrConfiguration: string | any): Promise<boolean>
  }
  
  tasks: {
    registerTaskProvider(type: string, provider: any): any
    executeTask(task: any): Promise<any>
    fetchTasks(filter?: any): Promise<any[]>
  }
  
  // File system
  fs: {
    readFile(uri: any): Promise<Uint8Array>
    writeFile(uri: any, content: Uint8Array): Promise<void>
    delete(uri: any, options?: any): Promise<void>
    rename(source: any, target: any, options?: any): Promise<void>
    copy(source: any, target: any, options?: any): Promise<void>
    createDirectory(uri: any): Promise<void>
    readDirectory(uri: any): Promise<[string, any][]>
    stat(uri: any): Promise<any>
  }
}

export class ExtensionSystem {
  private extensions: Map<string, Extension> = new Map()
  private activatedExtensions: Set<string> = new Set()
  private extensionAPI: ExtensionAPI
  private onExtensionActivated?: (extension: Extension) => void
  private onExtensionDeactivated?: (extension: Extension) => void

  constructor(
    onExtensionActivated?: (extension: Extension) => void,
    onExtensionDeactivated?: (extension: Extension) => void
  ) {
    this.onExtensionActivated = onExtensionActivated
    this.onExtensionDeactivated = onExtensionDeactivated
    this.extensionAPI = this.createExtensionAPI()
  }

  private createExtensionAPI(): ExtensionAPI {
    return {
      commands: {
        registerCommand: (command: string, callback: (...args: any[]) => any) => {
          console.log(`Registering command: ${command}`)
          // In a real implementation, this would register with the command system
          return { dispose: () => {} }
        },
        executeCommand: async (command: string, ...args: any[]) => {
          console.log(`Executing command: ${command}`, args)
          // In a real implementation, this would execute the command
          return undefined
        },
        getCommands: async (filterInternal?: boolean) => {
          // Return list of available commands
          return []
        }
      },
      
      window: {
        showInformationMessage: async (message: string, ...items: string[]) => {
          console.log('Info:', message)
          return items[0]
        },
        showWarningMessage: async (message: string, ...items: string[]) => {
          console.warn('Warning:', message)
          return items[0]
        },
        showErrorMessage: async (message: string, ...items: string[]) => {
          console.error('Error:', message)
          return items[0]
        },
        showInputBox: async (options?: any) => {
          // In a real implementation, this would show an input dialog
          return prompt(options?.prompt || 'Enter value:') || undefined
        },
        showQuickPick: async (items: string[] | any[], options?: any) => {
          // In a real implementation, this would show a quick pick dialog
          return items[0]
        },
        createStatusBarItem: (alignment?: any, priority?: number) => {
          return {
            text: '',
            tooltip: '',
            show: () => {},
            hide: () => {},
            dispose: () => {}
          }
        },
        createOutputChannel: (name: string) => {
          return {
            name,
            append: (value: string) => console.log(`[${name}]`, value),
            appendLine: (value: string) => console.log(`[${name}]`, value),
            clear: () => {},
            show: () => {},
            hide: () => {},
            dispose: () => {}
          }
        },
        createWebviewPanel: (viewType: string, title: string, showOptions: any, options?: any) => {
          return {
            viewType,
            title,
            webview: {
              html: '',
              postMessage: (message: any) => {},
              onDidReceiveMessage: () => ({ dispose: () => {} })
            },
            dispose: () => {}
          }
        }
      },
      
      workspace: {
        workspaceFolders: [],
        rootPath: undefined,
        name: undefined,
        getConfiguration: (section?: string, resource?: any) => {
          return {
            get: (key: string, defaultValue?: any) => defaultValue,
            has: (key: string) => false,
            inspect: (key: string) => undefined,
            update: (key: string, value: any, configurationTarget?: any) => Promise.resolve()
          }
        },
        onDidChangeConfiguration: () => ({ dispose: () => {} }),
        onDidChangeWorkspaceFolders: () => ({ dispose: () => {} }),
        findFiles: async (include: string, exclude?: string, maxResults?: number) => {
          return []
        },
        openTextDocument: async (uri: any) => {
          return {
            uri,
            fileName: uri.path,
            languageId: 'plaintext',
            version: 1,
            isDirty: false,
            isClosed: false,
            save: () => Promise.resolve(true),
            getText: () => '',
            lineAt: (line: number) => ({ text: '', range: null }),
            offsetAt: (position: any) => 0,
            positionAt: (offset: number) => ({ line: 0, character: 0 })
          }
        },
        saveAll: async (includeUntitled?: boolean) => true
      },
      
      languages: {
        registerCompletionItemProvider: (selector: any, provider: any, ...triggerCharacters: string[]) => {
          console.log('Registered completion provider for', selector)
          return { dispose: () => {} }
        },
        registerHoverProvider: (selector: any, provider: any) => {
          console.log('Registered hover provider for', selector)
          return { dispose: () => {} }
        },
        registerDefinitionProvider: (selector: any, provider: any) => {
          console.log('Registered definition provider for', selector)
          return { dispose: () => {} }
        },
        registerReferenceProvider: (selector: any, provider: any) => {
          console.log('Registered reference provider for', selector)
          return { dispose: () => {} }
        },
        registerDocumentSymbolProvider: (selector: any, provider: any) => {
          console.log('Registered document symbol provider for', selector)
          return { dispose: () => {} }
        },
        registerCodeActionsProvider: (selector: any, provider: any) => {
          console.log('Registered code actions provider for', selector)
          return { dispose: () => {} }
        },
        registerDocumentFormattingEditProvider: (selector: any, provider: any) => {
          console.log('Registered formatting provider for', selector)
          return { dispose: () => {} }
        },
        setLanguageConfiguration: (languageId: string, configuration: any) => {
          console.log('Set language configuration for', languageId)
          return { dispose: () => {} }
        }
      },
      
      debug: {
        registerDebugConfigurationProvider: (debugType: string, provider: any) => {
          console.log('Registered debug configuration provider for', debugType)
          return { dispose: () => {} }
        },
        registerDebugAdapterDescriptorFactory: (debugType: string, factory: any) => {
          console.log('Registered debug adapter factory for', debugType)
          return { dispose: () => {} }
        },
        startDebugging: async (folder: any, nameOrConfiguration: string | any) => {
          console.log('Starting debug session', nameOrConfiguration)
          return true
        }
      },
      
      tasks: {
        registerTaskProvider: (type: string, provider: any) => {
          console.log('Registered task provider for', type)
          return { dispose: () => {} }
        },
        executeTask: async (task: any) => {
          console.log('Executing task', task)
          return undefined
        },
        fetchTasks: async (filter?: any) => {
          return []
        }
      },
      
      fs: {
        readFile: async (uri: any) => new Uint8Array(),
        writeFile: async (uri: any, content: Uint8Array) => {},
        delete: async (uri: any, options?: any) => {},
        rename: async (source: any, target: any, options?: any) => {},
        copy: async (source: any, target: any, options?: any) => {},
        createDirectory: async (uri: any) => {},
        readDirectory: async (uri: any) => [],
        stat: async (uri: any) => ({
          type: 1, // File
          ctime: Date.now(),
          mtime: Date.now(),
          size: 0
        })
      }
    }
  }

  // Install extension from manifest
  async installExtension(manifest: ExtensionManifest, extensionPath: string): Promise<Extension> {
    if (this.extensions.has(manifest.id)) {
      throw new Error(`Extension ${manifest.id} is already installed`)
    }

    // Validate manifest
    this.validateManifest(manifest)

    const extension: Extension = {
      manifest,
      extensionPath,
      isActive: false,
      subscriptions: [],
      packageJSON: manifest
    }

    this.extensions.set(manifest.id, extension)
    console.log(`📦 Installed extension: ${manifest.displayName} (${manifest.id})`)

    return extension
  }

  // Activate extension
  async activateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId)
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`)
    }

    if (extension.isActive) {
      console.log(`Extension ${extensionId} is already active`)
      return
    }

    try {
      // Check activation events
      const shouldActivate = this.shouldActivateExtension(extension)
      if (!shouldActivate) {
        console.log(`Extension ${extensionId} activation conditions not met`)
        return
      }

      // Create extension context
      const context: ExtensionContext = {
        subscriptions: extension.subscriptions,
        workspaceState: {},
        globalState: {},
        extensionPath: extension.extensionPath,
        logPath: `${extension.extensionPath}/logs`,
        extensionUri: extension.extensionPath,
        environmentVariableCollection: {},
        secrets: {},
        extension
      }

      // Load and execute extension main file
      if (extension.manifest.main) {
        try {
          // In a real implementation, this would load the extension's main file
          // For now, we'll simulate the activation
          console.log(`Loading extension main file: ${extension.manifest.main}`)
          
          // Simulate extension activation
          const exports = await this.loadExtensionMain(extension, context)
          extension.exports = exports
        } catch (error) {
          console.error(`Failed to load extension ${extensionId}:`, error)
          throw error
        }
      }

      extension.isActive = true
      this.activatedExtensions.add(extensionId)
      this.onExtensionActivated?.(extension)

      console.log(`✅ Activated extension: ${extension.manifest.displayName}`)
    } catch (error) {
      console.error(`Failed to activate extension ${extensionId}:`, error)
      throw error
    }
  }

  // Deactivate extension
  async deactivateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId)
    if (!extension || !extension.isActive) {
      return
    }

    try {
      // Call extension's deactivate function if it exists
      if (extension.exports?.deactivate) {
        await extension.exports.deactivate()
      }

      // Dispose all subscriptions
      for (const subscription of extension.subscriptions) {
        if (subscription.dispose) {
          subscription.dispose()
        }
      }
      extension.subscriptions.length = 0

      extension.isActive = false
      this.activatedExtensions.delete(extensionId)
      this.onExtensionDeactivated?.(extension)

      console.log(`🛑 Deactivated extension: ${extension.manifest.displayName}`)
    } catch (error) {
      console.error(`Failed to deactivate extension ${extensionId}:`, error)
    }
  }

  // Uninstall extension
  async uninstallExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId)
    if (!extension) {
      return
    }

    // Deactivate first
    if (extension.isActive) {
      await this.deactivateExtension(extensionId)
    }

    this.extensions.delete(extensionId)
    console.log(`🗑️ Uninstalled extension: ${extension.manifest.displayName}`)
  }

  // Load extension main file (simulated)
  private async loadExtensionMain(extension: Extension, context: ExtensionContext): Promise<any> {
    // In a real implementation, this would:
    // 1. Load the extension's main JavaScript file
    // 2. Execute it in a sandboxed environment
    // 3. Call the activate function with the context
    // 4. Return the exports

    // For now, we'll simulate this
    const exports = {
      activate: (ctx: ExtensionContext) => {
        console.log(`Activating extension: ${extension.manifest.displayName}`)
        
        // Register contributions from manifest
        this.registerContributions(extension, ctx)
        
        return {
          // Extension can return API for other extensions
        }
      },
      deactivate: () => {
        console.log(`Deactivating extension: ${extension.manifest.displayName}`)
      }
    }

    // Call activate function
    if (exports.activate) {
      await exports.activate(context)
    }

    return exports
  }

  // Register extension contributions
  private registerContributions(extension: Extension, context: ExtensionContext): void {
    const { contributes } = extension.manifest

    if (!contributes) return

    // Register commands
    if (contributes.commands) {
      for (const command of contributes.commands) {
        console.log(`Registering command: ${command.command}`)
        // In a real implementation, register with command system
      }
    }

    // Register languages
    if (contributes.languages) {
      for (const language of contributes.languages) {
        console.log(`Registering language: ${language.id}`)
        // In a real implementation, register with language system
      }
    }

    // Register themes
    if (contributes.themes) {
      for (const theme of contributes.themes) {
        console.log(`Registering theme: ${theme.label}`)
        // In a real implementation, register with theme system
      }
    }

    // Register other contributions...
  }

  // Check if extension should be activated
  private shouldActivateExtension(extension: Extension): boolean {
    const { activationEvents } = extension.manifest

    for (const event of activationEvents) {
      if (event === '*') {
        return true // Always activate
      }
      
      if (event === 'onStartupFinished') {
        return true // Activate after startup
      }
      
      if (event.startsWith('onLanguage:')) {
        // Check if language is active
        const language = event.substring('onLanguage:'.length)
        // In a real implementation, check if language is being used
        return false
      }
      
      if (event.startsWith('onCommand:')) {
        // Activate when command is executed
        return false
      }
      
      if (event.startsWith('workspaceContains:')) {
        // Check if workspace contains specific files
        return false
      }
    }

    return false
  }

  // Validate extension manifest
  private validateManifest(manifest: ExtensionManifest): void {
    if (!manifest.id) {
      throw new Error('Extension manifest must have an id')
    }
    
    if (!manifest.name) {
      throw new Error('Extension manifest must have a name')
    }
    
    if (!manifest.version) {
      throw new Error('Extension manifest must have a version')
    }
    
    if (!manifest.engines?.whiterabbit) {
      throw new Error('Extension manifest must specify White Rabbit engine compatibility')
    }
    
    if (!manifest.activationEvents || manifest.activationEvents.length === 0) {
      throw new Error('Extension manifest must specify activation events')
    }
  }

  // Get all extensions
  getExtensions(): Extension[] {
    return Array.from(this.extensions.values())
  }

  // Get extension by ID
  getExtension(extensionId: string): Extension | undefined {
    return this.extensions.get(extensionId)
  }

  // Get active extensions
  getActiveExtensions(): Extension[] {
    return Array.from(this.extensions.values()).filter(ext => ext.isActive)
  }

  // Check if extension is installed
  isExtensionInstalled(extensionId: string): boolean {
    return this.extensions.has(extensionId)
  }

  // Check if extension is active
  isExtensionActive(extensionId: string): boolean {
    return this.activatedExtensions.has(extensionId)
  }

  // Get extension API
  getExtensionAPI(): ExtensionAPI {
    return this.extensionAPI
  }

  // Create sample extension manifest
  createSampleExtension(): ExtensionManifest {
    return {
      id: 'whiterabbit.sample-extension',
      name: 'sample-extension',
      version: '1.0.0',
      description: 'A sample extension for White Rabbit Code Editor',
      author: 'White Rabbit Team',
      displayName: 'Sample Extension',
      category: 'Other',
      keywords: ['sample', 'demo'],
      engines: {
        whiterabbit: '^1.0.0'
      },
      contributes: {
        commands: [
          {
            command: 'sample.helloWorld',
            title: 'Hello World',
            category: 'Sample'
          }
        ],
        menus: {
          commandPalette: [
            {
              command: 'sample.helloWorld'
            }
          ]
        }
      },
      activationEvents: [
        'onCommand:sample.helloWorld'
      ],
      main: './out/extension.js'
    }
  }
}
