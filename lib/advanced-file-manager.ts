/**
 * White Rabbit Code Editor - Advanced File Manager
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

export interface FileSystemEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  lastModified: Date
  permissions: FilePermissions
  isHidden: boolean
  extension?: string
  mimeType?: string
  children?: FileSystemEntry[]
}

export interface FilePermissions {
  readable: boolean
  writable: boolean
  executable: boolean
}

export interface FileOperation {
  id: string
  type: 'create' | 'rename' | 'move' | 'copy' | 'delete'
  source: string
  target?: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  progress?: number
  error?: string
  timestamp: Date
}

export interface FileWatcher {
  id: string
  path: string
  recursive: boolean
  events: FileWatchEvent[]
  callback: (event: FileWatchEvent) => void
}

export interface FileWatchEvent {
  type: 'created' | 'modified' | 'deleted' | 'renamed'
  path: string
  oldPath?: string
  timestamp: Date
}

export interface FileSearchOptions {
  query: string
  path: string
  recursive: boolean
  includeHidden: boolean
  fileTypes: string[]
  maxResults: number
  caseSensitive: boolean
  useRegex: boolean
}

export interface FileSearchResult {
  path: string
  name: string
  type: 'file' | 'directory'
  size: number
  lastModified: Date
  matches?: {
    line: number
    column: number
    text: string
    preview: string
  }[]
}

export interface FileTemplate {
  id: string
  name: string
  description: string
  extension: string
  content: string
  variables: Record<string, string>
}

export interface FileHistory {
  path: string
  operations: FileOperation[]
  snapshots: {
    timestamp: Date
    content: string
    size: number
  }[]
}

export class AdvancedFileManager {
  private fileSystem: Map<string, FileSystemEntry> = new Map()
  private operations: Map<string, FileOperation> = new Map()
  private watchers: Map<string, FileWatcher> = new Map()
  private templates: Map<string, FileTemplate> = new Map()
  private history: Map<string, FileHistory> = new Map()
  private clipboard: { operation: 'copy' | 'cut'; entries: FileSystemEntry[] } | null = null
  
  private onFileSystemChange?: (event: FileWatchEvent) => void
  private onOperationUpdate?: (operation: FileOperation) => void

  constructor(
    onFileSystemChange?: (event: FileWatchEvent) => void,
    onOperationUpdate?: (operation: FileOperation) => void
  ) {
    this.onFileSystemChange = onFileSystemChange
    this.onOperationUpdate = onOperationUpdate
    this.initializeTemplates()
    this.initializeMockFileSystem()
  }

  private initializeTemplates(): void {
    const templates: FileTemplate[] = [
      {
        id: 'react-component',
        name: 'React Component',
        description: 'TypeScript React functional component',
        extension: 'tsx',
        content: `import React from 'react'

interface {{ComponentName}}Props {
  // Add props here
}

export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = () => {
  return (
    <div>
      <h1>{{ComponentName}}</h1>
    </div>
  )
}

export default {{ComponentName}}`,
        variables: {
          ComponentName: 'MyComponent'
        }
      },
      {
        id: 'node-module',
        name: 'Node.js Module',
        description: 'TypeScript Node.js module',
        extension: 'ts',
        content: `/**
 * {{ModuleName}}
 * {{Description}}
 */

export class {{ModuleName}} {
  constructor() {
    // Initialize
  }

  public async execute(): Promise<void> {
    // Implementation
  }
}

export default {{ModuleName}}`,
        variables: {
          ModuleName: 'MyModule',
          Description: 'Module description'
        }
      },
      {
        id: 'python-class',
        name: 'Python Class',
        description: 'Python class with basic structure',
        extension: 'py',
        content: `"""
{{ClassName}} - {{Description}}
"""

class {{ClassName}}:
    """{{Description}}"""
    
    def __init__(self):
        """Initialize the {{ClassName}}."""
        pass
    
    def execute(self):
        """Execute the main functionality."""
        pass

if __name__ == "__main__":
    instance = {{ClassName}}()
    instance.execute()`,
        variables: {
          ClassName: 'MyClass',
          Description: 'Class description'
        }
      }
    ]

    for (const template of templates) {
      this.templates.set(template.id, template)
    }
  }

  private initializeMockFileSystem(): void {
    // Create a mock file system structure
    const mockFiles: FileSystemEntry[] = [
      {
        name: 'src',
        path: '/src',
        type: 'directory',
        lastModified: new Date(),
        permissions: { readable: true, writable: true, executable: true },
        isHidden: false,
        children: [
          {
            name: 'components',
            path: '/src/components',
            type: 'directory',
            lastModified: new Date(),
            permissions: { readable: true, writable: true, executable: true },
            isHidden: false,
            children: [
              {
                name: 'Button.tsx',
                path: '/src/components/Button.tsx',
                type: 'file',
                size: 1024,
                lastModified: new Date(),
                permissions: { readable: true, writable: true, executable: false },
                isHidden: false,
                extension: 'tsx',
                mimeType: 'text/typescript'
              }
            ]
          },
          {
            name: 'utils',
            path: '/src/utils',
            type: 'directory',
            lastModified: new Date(),
            permissions: { readable: true, writable: true, executable: true },
            isHidden: false,
            children: [
              {
                name: 'helpers.ts',
                path: '/src/utils/helpers.ts',
                type: 'file',
                size: 512,
                lastModified: new Date(),
                permissions: { readable: true, writable: true, executable: false },
                isHidden: false,
                extension: 'ts',
                mimeType: 'text/typescript'
              }
            ]
          }
        ]
      },
      {
        name: 'package.json',
        path: '/package.json',
        type: 'file',
        size: 2048,
        lastModified: new Date(),
        permissions: { readable: true, writable: true, executable: false },
        isHidden: false,
        extension: 'json',
        mimeType: 'application/json'
      }
    ]

    // Flatten and index all entries
    const indexEntry = (entry: FileSystemEntry) => {
      this.fileSystem.set(entry.path, entry)
      if (entry.children) {
        entry.children.forEach(indexEntry)
      }
    }

    mockFiles.forEach(indexEntry)
  }

  // Get directory contents
  async getDirectoryContents(path: string): Promise<FileSystemEntry[]> {
    const entry = this.fileSystem.get(path)
    if (!entry || entry.type !== 'directory') {
      throw new Error(`Directory not found: ${path}`)
    }

    return entry.children || []
  }

  // Get file/directory info
  async getEntry(path: string): Promise<FileSystemEntry | null> {
    return this.fileSystem.get(path) || null
  }

  // Create file
  async createFile(path: string, content: string = '', templateId?: string): Promise<FileSystemEntry> {
    if (this.fileSystem.has(path)) {
      throw new Error(`File already exists: ${path}`)
    }

    let fileContent = content
    
    // Apply template if specified
    if (templateId) {
      const template = this.templates.get(templateId)
      if (template) {
        fileContent = this.applyTemplate(template, {})
      }
    }

    const operation: FileOperation = {
      id: `create-${Date.now()}`,
      type: 'create',
      source: path,
      status: 'in-progress',
      timestamp: new Date()
    }

    this.operations.set(operation.id, operation)
    this.onOperationUpdate?.(operation)

    try {
      // Simulate file creation
      await this.simulateAsyncOperation(500)

      const fileName = path.split('/').pop() || ''
      const extension = fileName.includes('.') ? fileName.split('.').pop() : undefined
      
      const entry: FileSystemEntry = {
        name: fileName,
        path,
        type: 'file',
        size: fileContent.length,
        lastModified: new Date(),
        permissions: { readable: true, writable: true, executable: false },
        isHidden: fileName.startsWith('.'),
        extension,
        mimeType: this.getMimeType(extension)
      }

      this.fileSystem.set(path, entry)
      
      // Update parent directory
      const parentPath = path.substring(0, path.lastIndexOf('/'))
      const parent = this.fileSystem.get(parentPath)
      if (parent && parent.type === 'directory') {
        if (!parent.children) parent.children = []
        parent.children.push(entry)
      }

      // Record operation success
      operation.status = 'completed'
      this.onOperationUpdate?.(operation)

      // Notify watchers
      this.notifyWatchers({
        type: 'created',
        path,
        timestamp: new Date()
      })

      console.log(`✅ Created file: ${path}`)
      return entry

    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Unknown error'
      this.onOperationUpdate?.(operation)
      throw error
    }
  }

  // Create directory
  async createDirectory(path: string): Promise<FileSystemEntry> {
    if (this.fileSystem.has(path)) {
      throw new Error(`Directory already exists: ${path}`)
    }

    const operation: FileOperation = {
      id: `create-dir-${Date.now()}`,
      type: 'create',
      source: path,
      status: 'in-progress',
      timestamp: new Date()
    }

    this.operations.set(operation.id, operation)
    this.onOperationUpdate?.(operation)

    try {
      await this.simulateAsyncOperation(300)

      const dirName = path.split('/').pop() || ''
      
      const entry: FileSystemEntry = {
        name: dirName,
        path,
        type: 'directory',
        lastModified: new Date(),
        permissions: { readable: true, writable: true, executable: true },
        isHidden: dirName.startsWith('.'),
        children: []
      }

      this.fileSystem.set(path, entry)
      
      // Update parent directory
      const parentPath = path.substring(0, path.lastIndexOf('/'))
      const parent = this.fileSystem.get(parentPath)
      if (parent && parent.type === 'directory') {
        if (!parent.children) parent.children = []
        parent.children.push(entry)
      }

      operation.status = 'completed'
      this.onOperationUpdate?.(operation)

      this.notifyWatchers({
        type: 'created',
        path,
        timestamp: new Date()
      })

      console.log(`✅ Created directory: ${path}`)
      return entry

    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Unknown error'
      this.onOperationUpdate?.(operation)
      throw error
    }
  }

  // Rename file/directory
  async rename(oldPath: string, newPath: string): Promise<FileSystemEntry> {
    const entry = this.fileSystem.get(oldPath)
    if (!entry) {
      throw new Error(`Entry not found: ${oldPath}`)
    }

    if (this.fileSystem.has(newPath)) {
      throw new Error(`Target already exists: ${newPath}`)
    }

    const operation: FileOperation = {
      id: `rename-${Date.now()}`,
      type: 'rename',
      source: oldPath,
      target: newPath,
      status: 'in-progress',
      timestamp: new Date()
    }

    this.operations.set(operation.id, operation)
    this.onOperationUpdate?.(operation)

    try {
      await this.simulateAsyncOperation(400)

      // Update entry
      const newName = newPath.split('/').pop() || ''
      const updatedEntry: FileSystemEntry = {
        ...entry,
        name: newName,
        path: newPath,
        lastModified: new Date()
      }

      // Update file system
      this.fileSystem.delete(oldPath)
      this.fileSystem.set(newPath, updatedEntry)

      // Update parent directories
      this.updateParentDirectories(oldPath, newPath, updatedEntry)

      operation.status = 'completed'
      this.onOperationUpdate?.(operation)

      this.notifyWatchers({
        type: 'renamed',
        path: newPath,
        oldPath,
        timestamp: new Date()
      })

      console.log(`✅ Renamed: ${oldPath} → ${newPath}`)
      return updatedEntry

    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Unknown error'
      this.onOperationUpdate?.(operation)
      throw error
    }
  }

  // Move file/directory
  async move(sourcePath: string, targetPath: string): Promise<FileSystemEntry> {
    const entry = this.fileSystem.get(sourcePath)
    if (!entry) {
      throw new Error(`Entry not found: ${sourcePath}`)
    }

    if (this.fileSystem.has(targetPath)) {
      throw new Error(`Target already exists: ${targetPath}`)
    }

    const operation: FileOperation = {
      id: `move-${Date.now()}`,
      type: 'move',
      source: sourcePath,
      target: targetPath,
      status: 'in-progress',
      timestamp: new Date()
    }

    this.operations.set(operation.id, operation)
    this.onOperationUpdate?.(operation)

    try {
      await this.simulateAsyncOperation(600)

      // Update entry
      const newName = targetPath.split('/').pop() || ''
      const movedEntry: FileSystemEntry = {
        ...entry,
        name: newName,
        path: targetPath,
        lastModified: new Date()
      }

      // Update file system
      this.fileSystem.delete(sourcePath)
      this.fileSystem.set(targetPath, movedEntry)

      // Update parent directories
      this.updateParentDirectories(sourcePath, targetPath, movedEntry)

      operation.status = 'completed'
      this.onOperationUpdate?.(operation)

      this.notifyWatchers({
        type: 'deleted',
        path: sourcePath,
        timestamp: new Date()
      })

      this.notifyWatchers({
        type: 'created',
        path: targetPath,
        timestamp: new Date()
      })

      console.log(`✅ Moved: ${sourcePath} → ${targetPath}`)
      return movedEntry

    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Unknown error'
      this.onOperationUpdate?.(operation)
      throw error
    }
  }

  // Copy file/directory
  async copy(sourcePath: string, targetPath: string): Promise<FileSystemEntry> {
    const entry = this.fileSystem.get(sourcePath)
    if (!entry) {
      throw new Error(`Entry not found: ${sourcePath}`)
    }

    if (this.fileSystem.has(targetPath)) {
      throw new Error(`Target already exists: ${targetPath}`)
    }

    const operation: FileOperation = {
      id: `copy-${Date.now()}`,
      type: 'copy',
      source: sourcePath,
      target: targetPath,
      status: 'in-progress',
      timestamp: new Date()
    }

    this.operations.set(operation.id, operation)
    this.onOperationUpdate?.(operation)

    try {
      await this.simulateAsyncOperation(800)

      // Create copy
      const newName = targetPath.split('/').pop() || ''
      const copiedEntry: FileSystemEntry = {
        ...entry,
        name: newName,
        path: targetPath,
        lastModified: new Date()
      }

      this.fileSystem.set(targetPath, copiedEntry)

      // Update parent directory
      const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/'))
      const parent = this.fileSystem.get(parentPath)
      if (parent && parent.type === 'directory') {
        if (!parent.children) parent.children = []
        parent.children.push(copiedEntry)
      }

      operation.status = 'completed'
      this.onOperationUpdate?.(operation)

      this.notifyWatchers({
        type: 'created',
        path: targetPath,
        timestamp: new Date()
      })

      console.log(`✅ Copied: ${sourcePath} → ${targetPath}`)
      return copiedEntry

    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Unknown error'
      this.onOperationUpdate?.(operation)
      throw error
    }
  }

  // Delete file/directory
  async delete(path: string): Promise<void> {
    const entry = this.fileSystem.get(path)
    if (!entry) {
      throw new Error(`Entry not found: ${path}`)
    }

    const operation: FileOperation = {
      id: `delete-${Date.now()}`,
      type: 'delete',
      source: path,
      status: 'in-progress',
      timestamp: new Date()
    }

    this.operations.set(operation.id, operation)
    this.onOperationUpdate?.(operation)

    try {
      await this.simulateAsyncOperation(400)

      // Remove from file system
      this.fileSystem.delete(path)

      // Remove from parent directory
      const parentPath = path.substring(0, path.lastIndexOf('/'))
      const parent = this.fileSystem.get(parentPath)
      if (parent && parent.type === 'directory' && parent.children) {
        parent.children = parent.children.filter(child => child.path !== path)
      }

      operation.status = 'completed'
      this.onOperationUpdate?.(operation)

      this.notifyWatchers({
        type: 'deleted',
        path,
        timestamp: new Date()
      })

      console.log(`✅ Deleted: ${path}`)

    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Unknown error'
      this.onOperationUpdate?.(operation)
      throw error
    }
  }

  // Search files
  async searchFiles(options: FileSearchOptions): Promise<FileSearchResult[]> {
    const results: FileSearchResult[] = []
    const searchRegex = options.useRegex 
      ? new RegExp(options.query, options.caseSensitive ? 'g' : 'gi')
      : new RegExp(options.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options.caseSensitive ? 'g' : 'gi')

    const searchInEntry = (entry: FileSystemEntry) => {
      // Skip hidden files if not included
      if (entry.isHidden && !options.includeHidden) return

      // Check file type filter
      if (options.fileTypes.length > 0 && entry.extension) {
        if (!options.fileTypes.includes(entry.extension)) return
      }

      // Check name match
      if (searchRegex.test(entry.name)) {
        results.push({
          path: entry.path,
          name: entry.name,
          type: entry.type,
          size: entry.size || 0,
          lastModified: entry.lastModified
        })
      }

      // Search in children if directory and recursive
      if (entry.type === 'directory' && options.recursive && entry.children) {
        entry.children.forEach(searchInEntry)
      }
    }

    // Start search from specified path
    const startEntry = this.fileSystem.get(options.path)
    if (startEntry) {
      if (startEntry.type === 'directory' && startEntry.children) {
        startEntry.children.forEach(searchInEntry)
      } else {
        searchInEntry(startEntry)
      }
    }

    return results.slice(0, options.maxResults)
  }

  // Watch file system changes
  watchPath(path: string, recursive: boolean, callback: (event: FileWatchEvent) => void): string {
    const watcherId = `watcher-${Date.now()}-${Math.random()}`
    
    const watcher: FileWatcher = {
      id: watcherId,
      path,
      recursive,
      events: [],
      callback
    }

    this.watchers.set(watcherId, watcher)
    console.log(`👀 Started watching: ${path} (recursive: ${recursive})`)
    
    return watcherId
  }

  // Stop watching
  unwatchPath(watcherId: string): void {
    if (this.watchers.delete(watcherId)) {
      console.log(`👁️ Stopped watching: ${watcherId}`)
    }
  }

  // Get file templates
  getFileTemplates(): FileTemplate[] {
    return Array.from(this.templates.values())
  }

  // Apply template
  private applyTemplate(template: FileTemplate, variables: Record<string, string>): string {
    let content = template.content
    const allVariables = { ...template.variables, ...variables }
    
    for (const [key, value] of Object.entries(allVariables)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, value)
    }
    
    return content
  }

  // Get MIME type
  private getMimeType(extension?: string): string {
    const mimeTypes: Record<string, string> = {
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'jsx': 'text/javascript',
      'tsx': 'text/typescript',
      'json': 'application/json',
      'html': 'text/html',
      'css': 'text/css',
      'md': 'text/markdown',
      'txt': 'text/plain',
      'py': 'text/x-python',
      'rs': 'text/x-rust',
      'go': 'text/x-go',
      'java': 'text/x-java',
      'cs': 'text/x-csharp'
    }
    
    return mimeTypes[extension || ''] || 'text/plain'
  }

  // Update parent directories after move/rename
  private updateParentDirectories(oldPath: string, newPath: string, entry: FileSystemEntry): void {
    // Remove from old parent
    const oldParentPath = oldPath.substring(0, oldPath.lastIndexOf('/'))
    const oldParent = this.fileSystem.get(oldParentPath)
    if (oldParent && oldParent.type === 'directory' && oldParent.children) {
      oldParent.children = oldParent.children.filter(child => child.path !== oldPath)
    }

    // Add to new parent
    const newParentPath = newPath.substring(0, newPath.lastIndexOf('/'))
    const newParent = this.fileSystem.get(newParentPath)
    if (newParent && newParent.type === 'directory') {
      if (!newParent.children) newParent.children = []
      newParent.children.push(entry)
    }
  }

  // Notify watchers
  private notifyWatchers(event: FileWatchEvent): void {
    for (const watcher of this.watchers.values()) {
      const shouldNotify = event.path.startsWith(watcher.path) && 
        (watcher.recursive || event.path.split('/').length === watcher.path.split('/').length + 1)
      
      if (shouldNotify) {
        watcher.events.push(event)
        watcher.callback(event)
      }
    }

    this.onFileSystemChange?.(event)
  }

  // Simulate async operation
  private async simulateAsyncOperation(delay: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  // Get operations
  getOperations(): FileOperation[] {
    return Array.from(this.operations.values())
  }

  // Get recent operations
  getRecentOperations(limit: number = 10): FileOperation[] {
    return Array.from(this.operations.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Copy to clipboard
  copyToClipboard(entries: FileSystemEntry[]): void {
    this.clipboard = { operation: 'copy', entries }
    console.log(`📋 Copied ${entries.length} item(s) to clipboard`)
  }

  // Cut to clipboard
  cutToClipboard(entries: FileSystemEntry[]): void {
    this.clipboard = { operation: 'cut', entries }
    console.log(`✂️ Cut ${entries.length} item(s) to clipboard`)
  }

  // Paste from clipboard
  async pasteFromClipboard(targetPath: string): Promise<FileSystemEntry[]> {
    if (!this.clipboard) {
      throw new Error('Clipboard is empty')
    }

    const results: FileSystemEntry[] = []
    
    for (const entry of this.clipboard.entries) {
      const newPath = `${targetPath}/${entry.name}`
      
      if (this.clipboard.operation === 'copy') {
        const copied = await this.copy(entry.path, newPath)
        results.push(copied)
      } else {
        const moved = await this.move(entry.path, newPath)
        results.push(moved)
      }
    }

    if (this.clipboard.operation === 'cut') {
      this.clipboard = null // Clear clipboard after cut operation
    }

    return results
  }

  // Get clipboard contents
  getClipboardContents(): { operation: 'copy' | 'cut'; entries: FileSystemEntry[] } | null {
    return this.clipboard
  }
}
