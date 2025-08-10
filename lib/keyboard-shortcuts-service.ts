/**
 * White Rabbit Code Editor - Keyboard Shortcuts Service
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

export interface KeyboardShortcut {
  id: string
  name: string
  description: string
  category: ShortcutCategory
  keys: string[]
  command: string
  when?: string // Context condition
  args?: any[]
  enabled: boolean
  customizable: boolean
}

export type ShortcutCategory = 
  | 'file'
  | 'edit'
  | 'selection'
  | 'view'
  | 'go'
  | 'run'
  | 'debug'
  | 'terminal'
  | 'git'
  | 'search'
  | 'general'

export interface CommandPaletteItem {
  id: string
  title: string
  description?: string
  category: string
  command: string
  args?: any[]
  keybinding?: string
  icon?: string
}

export interface ShortcutContext {
  activeEditor: boolean
  hasSelection: boolean
  isDebugging: boolean
  terminalFocused: boolean
  searchFocused: boolean
  modalOpen: boolean
}

export type ShortcutHandler = (args?: any[]) => void | Promise<void>

export class KeyboardShortcutsService {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private handlers: Map<string, ShortcutHandler> = new Map()
  private keyBindings: Map<string, string> = new Map() // key combination -> command id
  private context: ShortcutContext = {
    activeEditor: false,
    hasSelection: false,
    isDebugging: false,
    terminalFocused: false,
    searchFocused: false,
    modalOpen: false
  }
  private commandPalette: CommandPaletteItem[] = []
  private isListening = false

  constructor() {
    this.initializeDefaultShortcuts()
    this.initializeCommandPalette()
  }

  // Add a new shortcut at runtime
  addShortcut(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.id, shortcut)
    for (const key of shortcut.keys) {
      this.keyBindings.set(this.normalizeKey(key), shortcut.id)
    }
    // Also add to command palette if not present
    if (!this.commandPalette.find(i => i.id === shortcut.id)) {
      this.commandPalette.push({
        id: shortcut.id,
        title: shortcut.name,
        description: shortcut.description,
        category: shortcut.category,
        command: shortcut.command,
        args: shortcut.args,
        keybinding: shortcut.keys[0]
      })
    }
  }

  // Add a command palette item without a shortcut
  addCommandPaletteItem(item: CommandPaletteItem): void {
    if (!this.commandPalette.find(i => i.id === item.id)) {
      this.commandPalette.push(item)
    }
  }

  private initializeDefaultShortcuts(): void {
    const defaultShortcuts: KeyboardShortcut[] = [
      // File operations
      {
        id: 'file.new',
        name: 'New File',
        description: 'Create a new file',
        category: 'file',
        keys: ['Ctrl+N', 'Cmd+N'],
        command: 'file.new',
        enabled: true,
        customizable: true
      },
      {
        id: 'file.open',
        name: 'Open File',
        description: 'Open an existing file',
        category: 'file',
        keys: ['Ctrl+O', 'Cmd+O'],
        command: 'file.open',
        enabled: true,
        customizable: true
      },
      {
        id: 'file.save',
        name: 'Save File',
        description: 'Save the current file',
        category: 'file',
        keys: ['Ctrl+S', 'Cmd+S'],
        command: 'file.save',
        when: 'activeEditor',
        enabled: true,
        customizable: true
      },
      {
        id: 'file.saveAs',
        name: 'Save As',
        description: 'Save the current file with a new name',
        category: 'file',
        keys: ['Ctrl+Shift+S', 'Cmd+Shift+S'],
        command: 'file.saveAs',
        when: 'activeEditor',
        enabled: true,
        customizable: true
      },

      // Edit operations
      {
        id: 'edit.undo',
        name: 'Undo',
        description: 'Undo the last action',
        category: 'edit',
        keys: ['Ctrl+Z', 'Cmd+Z'],
        command: 'edit.undo',
        when: 'activeEditor',
        enabled: true,
        customizable: true
      },
      {
        id: 'edit.redo',
        name: 'Redo',
        description: 'Redo the last undone action',
        category: 'edit',
        keys: ['Ctrl+Y', 'Cmd+Shift+Z'],
        command: 'edit.redo',
        when: 'activeEditor',
        enabled: true,
        customizable: true
      },
      {
        id: 'edit.cut',
        name: 'Cut',
        description: 'Cut selected text',
        category: 'edit',
        keys: ['Ctrl+X', 'Cmd+X'],
        command: 'edit.cut',
        when: 'activeEditor && hasSelection',
        enabled: true,
        customizable: true
      },
      {
        id: 'edit.copy',
        name: 'Copy',
        description: 'Copy selected text',
        category: 'edit',
        keys: ['Ctrl+C', 'Cmd+C'],
        command: 'edit.copy',
        when: 'activeEditor && hasSelection',
        enabled: true,
        customizable: true
      },
      {
        id: 'edit.paste',
        name: 'Paste',
        description: 'Paste text from clipboard',
        category: 'edit',
        keys: ['Ctrl+V', 'Cmd+V'],
        command: 'edit.paste',
        when: 'activeEditor',
        enabled: true,
        customizable: true
      },
      {
        id: 'edit.selectAll',
        name: 'Select All',
        description: 'Select all text',
        category: 'edit',
        keys: ['Ctrl+A', 'Cmd+A'],
        command: 'edit.selectAll',
        when: 'activeEditor',
        enabled: true,
        customizable: true
      },

      // Search operations
      {
        id: 'search.find',
        name: 'Find',
        description: 'Open find dialog',
        category: 'search',
        keys: ['Ctrl+F', 'Cmd+F'],
        command: 'search.find',
        enabled: true,
        customizable: true
      },
      {
        id: 'search.replace',
        name: 'Replace',
        description: 'Open find and replace dialog',
        category: 'search',
        keys: ['Ctrl+H', 'Cmd+Alt+F'],
        command: 'search.replace',
        enabled: true,
        customizable: true
      },
      {
        id: 'search.findInFiles',
        name: 'Find in Files',
        description: 'Search across all files',
        category: 'search',
        keys: ['Ctrl+Shift+F', 'Cmd+Shift+F'],
        command: 'search.findInFiles',
        enabled: true,
        customizable: true
      },
      {
        id: 'search.findNext',
        name: 'Find Next',
        description: 'Find next occurrence',
        category: 'search',
        keys: ['F3', 'Cmd+G'],
        command: 'search.findNext',
        enabled: true,
        customizable: true
      },
      {
        id: 'search.findPrevious',
        name: 'Find Previous',
        description: 'Find previous occurrence',
        category: 'search',
        keys: ['Shift+F3', 'Cmd+Shift+G'],
        command: 'search.findPrevious',
        enabled: true,
        customizable: true
      },

      // Go operations
      {
        id: 'go.toLine',
        name: 'Go to Line',
        description: 'Go to a specific line number',
        category: 'go',
        keys: ['Ctrl+G', 'Cmd+L'],
        command: 'go.toLine',
        when: 'activeEditor',
        enabled: true,
        customizable: true
      },
      {
        id: 'go.toDefinition',
        name: 'Go to Definition',
        description: 'Go to symbol definition',
        category: 'go',
        keys: ['F12', 'Cmd+Click'],
        command: 'go.toDefinition',
        when: 'activeEditor',
        enabled: true,
        customizable: true
      },
      {
        id: 'go.back',
        name: 'Go Back',
        description: 'Go back to previous location',
        category: 'go',
        keys: ['Alt+Left', 'Ctrl+-'],
        command: 'go.back',
        enabled: true,
        customizable: true
      },
      {
        id: 'go.forward',
        name: 'Go Forward',
        description: 'Go forward to next location',
        category: 'go',
        keys: ['Alt+Right', 'Ctrl+Shift+-'],
        command: 'go.forward',
        enabled: true,
        customizable: true
      },

      // View operations
      {
        id: 'view.commandPalette',
        name: 'Command Palette',
        description: 'Open command palette',
        category: 'view',
        keys: ['Ctrl+Shift+P', 'Cmd+Shift+P'],
        command: 'view.commandPalette',
        enabled: true,
        customizable: true
      },
      {
        id: 'view.quickOpen',
        name: 'Quick Open',
        description: 'Quickly open files',
        category: 'view',
        keys: ['Ctrl+P', 'Cmd+P'],
        command: 'view.quickOpen',
        enabled: true,
        customizable: true
      },
      {
        id: 'view.toggleSidebar',
        name: 'Toggle Sidebar',
        description: 'Show/hide sidebar',
        category: 'view',
        keys: ['Ctrl+B', 'Cmd+B'],
        command: 'view.toggleSidebar',
        enabled: true,
        customizable: true
      },
      {
        id: 'view.toggleTerminal',
        name: 'Toggle Terminal',
        description: 'Show/hide terminal',
        category: 'view',
        keys: ['Ctrl+`', 'Cmd+`'],
        command: 'view.toggleTerminal',
        enabled: true,
        customizable: true
      },
      {
        id: 'view.zoomIn',
        name: 'Zoom In',
        description: 'Increase font size',
        category: 'view',
        keys: ['Ctrl+=', 'Cmd+='],
        command: 'view.zoomIn',
        enabled: true,
        customizable: true
      },
      {
        id: 'view.zoomOut',
        name: 'Zoom Out',
        description: 'Decrease font size',
        category: 'view',
        keys: ['Ctrl+-', 'Cmd+-'],
        command: 'view.zoomOut',
        enabled: true,
        customizable: true
      },

      // Debug operations
      {
        id: 'debug.start',
        name: 'Start Debugging',
        description: 'Start debug session',
        category: 'debug',
        keys: ['F5'],
        command: 'debug.start',
        enabled: true,
        customizable: true
      },
      {
        id: 'debug.stop',
        name: 'Stop Debugging',
        description: 'Stop debug session',
        category: 'debug',
        keys: ['Shift+F5'],
        command: 'debug.stop',
        when: 'isDebugging',
        enabled: true,
        customizable: true
      },
      {
        id: 'debug.stepOver',
        name: 'Step Over',
        description: 'Step over current line',
        category: 'debug',
        keys: ['F10'],
        command: 'debug.stepOver',
        when: 'isDebugging',
        enabled: true,
        customizable: true
      },
      {
        id: 'debug.stepInto',
        name: 'Step Into',
        description: 'Step into function',
        category: 'debug',
        keys: ['F11'],
        command: 'debug.stepInto',
        when: 'isDebugging',
        enabled: true,
        customizable: true
      },
      {
        id: 'debug.stepOut',
        name: 'Step Out',
        description: 'Step out of function',
        category: 'debug',
        keys: ['Shift+F11'],
        command: 'debug.stepOut',
        when: 'isDebugging',
        enabled: true,
        customizable: true
      },
      {
        id: 'debug.toggleBreakpoint',
        name: 'Toggle Breakpoint',
        description: 'Toggle breakpoint on current line',
        category: 'debug',
        keys: ['F9'],
        command: 'debug.toggleBreakpoint',
        when: 'activeEditor',
        enabled: true,
        customizable: true
      },

      // Git operations
      {
        id: 'git.commit',
        name: 'Git Commit',
        description: 'Commit changes',
        category: 'git',
        keys: ['Ctrl+Enter', 'Cmd+Enter'],
        command: 'git.commit',
        enabled: true,
        customizable: true
      },
      {
        id: 'git.push',
        name: 'Git Push',
        description: 'Push changes to remote',
        category: 'git',
        keys: ['Ctrl+Shift+K', 'Cmd+Shift+K'],
        command: 'git.push',
        enabled: true,
        customizable: true
      },
      {
        id: 'git.pull',
        name: 'Git Pull',
        description: 'Pull changes from remote',
        category: 'git',
        keys: ['Ctrl+Shift+L', 'Cmd+Shift+L'],
        command: 'git.pull',
        enabled: true,
        customizable: true
      },

      // General operations
      {
        id: 'general.escape',
        name: 'Escape',
        description: 'Close dialogs and panels',
        category: 'general',
        keys: ['Escape'],
        command: 'general.escape',
        enabled: true,
        customizable: false
      }
    ]

    // Register all default shortcuts
    for (const shortcut of defaultShortcuts) {
      this.shortcuts.set(shortcut.id, shortcut)
      
      // Create key bindings for each key combination
      for (const key of shortcut.keys) {
        this.keyBindings.set(this.normalizeKey(key), shortcut.id)
      }
    }
  }

  private initializeCommandPalette(): void {
    // Convert shortcuts to command palette items
    for (const shortcut of this.shortcuts.values()) {
      this.commandPalette.push({
        id: shortcut.id,
        title: shortcut.name,
        description: shortcut.description,
        category: shortcut.category,
        command: shortcut.command,
        args: shortcut.args,
        keybinding: shortcut.keys[0] // Use first key binding
      })
    }

    // Add additional commands that don't have shortcuts
    const additionalCommands: CommandPaletteItem[] = [
      {
        id: 'file.closeAll',
        title: 'Close All Files',
        description: 'Close all open files',
        category: 'file',
        command: 'file.closeAll'
      },
      {
        id: 'edit.formatDocument',
        title: 'Format Document',
        description: 'Format the current document',
        category: 'edit',
        command: 'edit.formatDocument'
      },
      {
        id: 'view.showProblems',
        title: 'Show Problems',
        description: 'Show problems panel',
        category: 'view',
        command: 'view.showProblems'
      },
      {
        id: 'terminal.new',
        title: 'New Terminal',
        description: 'Create a new terminal',
        category: 'terminal',
        command: 'terminal.new'
      }
    ]

    this.commandPalette.push(...additionalCommands)
  }

  // Normalize key combination for consistent lookup
  private normalizeKey(key: string): string {
    return key
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace('cmd', 'meta')
      .replace('ctrl', 'control')
  }

  // Check if shortcut context matches current state
  private checkContext(when?: string): boolean {
    if (!when) return true

    const conditions = when.split('&&').map(c => c.trim())
    
    for (const condition of conditions) {
      const negate = condition.startsWith('!')
      const prop = negate ? condition.slice(1) : condition
      
      let value = false
      switch (prop) {
        case 'activeEditor':
          value = this.context.activeEditor
          break
        case 'hasSelection':
          value = this.context.hasSelection
          break
        case 'isDebugging':
          value = this.context.isDebugging
          break
        case 'terminalFocused':
          value = this.context.terminalFocused
          break
        case 'searchFocused':
          value = this.context.searchFocused
          break
        case 'modalOpen':
          value = this.context.modalOpen
          break
        default:
          value = false
      }

      if (negate ? value : !value) {
        return false
      }
    }

    return true
  }

  // Start listening for keyboard events
  startListening(): void {
    if (this.isListening) return

    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    this.isListening = true
    console.log('⌨️ Keyboard shortcuts service started')
  }

  // Stop listening for keyboard events
  stopListening(): void {
    if (!this.isListening) return

    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    this.isListening = false
    console.log('⌨️ Keyboard shortcuts service stopped')
  }

  // Handle keydown events
  private handleKeyDown(event: KeyboardEvent): void {
    // Don't handle shortcuts when typing in input fields
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // Allow some shortcuts even in input fields
      const allowedInInputs = ['Escape', 'Ctrl+A', 'Cmd+A', 'Ctrl+Z', 'Cmd+Z', 'Ctrl+Y', 'Cmd+Shift+Z']
      const keyCombo = this.getKeyCombo(event)
      if (!allowedInInputs.some(allowed => this.normalizeKey(allowed) === this.normalizeKey(keyCombo))) {
        return
      }
    }

    const keyCombo = this.getKeyCombo(event)
    const normalizedKey = this.normalizeKey(keyCombo)
    const shortcutId = this.keyBindings.get(normalizedKey)

    if (shortcutId) {
      const shortcut = this.shortcuts.get(shortcutId)
      if (shortcut && shortcut.enabled && this.checkContext(shortcut.when)) {
        event.preventDefault()
        event.stopPropagation()
        
        const handler = this.handlers.get(shortcut.command)
        if (handler) {
          handler(shortcut.args)
        } else {
          console.warn(`No handler registered for command: ${shortcut.command}`)
        }
      }
    }
  }

  // Get key combination string from event
  private getKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = []
    
    if (event.ctrlKey) parts.push('Ctrl')
    if (event.altKey) parts.push('Alt')
    if (event.shiftKey) parts.push('Shift')
    if (event.metaKey) parts.push('Cmd')
    
    // Handle special keys
    let key = event.key
    if (key === ' ') key = 'Space'
    if (key === 'Control' || key === 'Alt' || key === 'Shift' || key === 'Meta') return ''
    
    parts.push(key)
    return parts.join('+')
  }

  // Register command handler
  registerHandler(command: string, handler: ShortcutHandler): void {
    this.handlers.set(command, handler)
  }

  // Unregister command handler
  unregisterHandler(command: string): void {
    this.handlers.delete(command)
  }

  // Update context
  updateContext(updates: Partial<ShortcutContext>): void {
    this.context = { ...this.context, ...updates }
  }

  // Get all shortcuts
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  // Get shortcuts by category
  getShortcutsByCategory(category: ShortcutCategory): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).filter(s => s.category === category)
  }

  // Get command palette items
  getCommandPaletteItems(query?: string): CommandPaletteItem[] {
    if (!query) return this.commandPalette

    const lowerQuery = query.toLowerCase()
    return this.commandPalette.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    )
  }

  // Execute command
  executeCommand(command: string, args?: any[]): void {
    const handler = this.handlers.get(command)
    if (handler) {
      handler(args)
    } else {
      console.warn(`No handler registered for command: ${command}`)
    }
  }

  // Update shortcut key binding
  updateShortcut(id: string, keys: string[]): void {
    const shortcut = this.shortcuts.get(id)
    if (!shortcut || !shortcut.customizable) return

    // Remove old key bindings
    for (const key of shortcut.keys) {
      this.keyBindings.delete(this.normalizeKey(key))
    }

    // Add new key bindings
    shortcut.keys = keys
    for (const key of keys) {
      this.keyBindings.set(this.normalizeKey(key), id)
    }

    // Update command palette
    const paletteItem = this.commandPalette.find(item => item.id === id)
    if (paletteItem) {
      paletteItem.keybinding = keys[0]
    }
  }

  // Enable/disable shortcut
  toggleShortcut(id: string, enabled: boolean): void {
    const shortcut = this.shortcuts.get(id)
    if (shortcut) {
      shortcut.enabled = enabled
    }
  }

  // Get shortcut by command
  getShortcutByCommand(command: string): KeyboardShortcut | null {
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.command === command) {
        return shortcut
      }
    }
    return null
  }

  // Export shortcuts configuration
  exportConfiguration(): Record<string, any> {
    const config: Record<string, any> = {}
    
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.customizable) {
        config[shortcut.id] = {
          keys: shortcut.keys,
          enabled: shortcut.enabled
        }
      }
    }

    return config
  }

  // Import shortcuts configuration
  importConfiguration(config: Record<string, any>): void {
    for (const [id, settings] of Object.entries(config)) {
      const shortcut = this.shortcuts.get(id)
      if (shortcut && shortcut.customizable) {
        if (settings.keys) {
          this.updateShortcut(id, settings.keys)
        }
        if (typeof settings.enabled === 'boolean') {
          this.toggleShortcut(id, settings.enabled)
        }
      }
    }
  }

  // Reset shortcuts to defaults
  resetToDefaults(): void {
    // Clear current shortcuts and reinitialize
    this.shortcuts.clear()
    this.keyBindings.clear()
    this.commandPalette = []
    
    this.initializeDefaultShortcuts()
    this.initializeCommandPalette()
  }
}
