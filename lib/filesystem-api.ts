/**
 * White Rabbit Code Editor - FileSystem API Wrapper
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

// FileSystem API wrapper for isomorphic-git compatibility
export interface FileSystemAPI {
  readFile(filepath: string, encoding?: string): Promise<string | Uint8Array>
  writeFile(filepath: string, data: string | Uint8Array): Promise<void>
  unlink(filepath: string): Promise<void>
  readdir(filepath: string): Promise<string[]>
  mkdir(filepath: string): Promise<void>
  rmdir(filepath: string): Promise<void>
  stat(filepath: string): Promise<{
    type: 'file' | 'dir'
    mode: number
    size: number
    ino: number
    mtimeMs: number
    ctimeMs: number
    uid: number
    gid: number
    dev: number
  }>
  lstat(filepath: string): Promise<any>
  readlink?(filepath: string): Promise<string>
  symlink?(target: string, filepath: string): Promise<void>
}

// In-memory filesystem for browser environment
export class BrowserFileSystemAPI implements FileSystemAPI {
  private files: Map<string, string | Uint8Array> = new Map()
  private directories: Set<string> = new Set()

  constructor() {
    // Initialize with root directory
    this.directories.add('/')
  }

  private normalizePath(filepath: string): string {
    // Remove leading slash and normalize path
    return filepath.replace(/^\/+/, '').replace(/\/+/g, '/')
  }

  private getParentDir(filepath: string): string {
    const normalized = this.normalizePath(filepath)
    const parts = normalized.split('/')
    parts.pop()
    return parts.join('/') || '/'
  }

  private ensureParentDir(filepath: string): void {
    const parentDir = this.getParentDir(filepath)
    if (parentDir !== '/' && !this.directories.has(parentDir)) {
      this.ensureParentDir(parentDir)
      this.directories.add(parentDir)
    }
  }

  async readFile(filepath: string, encoding?: string): Promise<string | Uint8Array> {
    const normalized = this.normalizePath(filepath)
    const data = this.files.get(normalized)
    
    if (data === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${filepath}'`)
    }

    if (encoding === 'utf8' && data instanceof Uint8Array) {
      return new TextDecoder().decode(data)
    }

    return data
  }

  async writeFile(filepath: string, data: string | Uint8Array): Promise<void> {
    const normalized = this.normalizePath(filepath)
    this.ensureParentDir(normalized)
    
    if (typeof data === 'string') {
      this.files.set(normalized, data)
    } else {
      this.files.set(normalized, data)
    }
  }

  async unlink(filepath: string): Promise<void> {
    const normalized = this.normalizePath(filepath)
    if (!this.files.has(normalized)) {
      throw new Error(`ENOENT: no such file or directory, unlink '${filepath}'`)
    }
    this.files.delete(normalized)
  }

  async readdir(filepath: string): Promise<string[]> {
    const normalized = this.normalizePath(filepath) || '/'
    
    if (!this.directories.has(normalized)) {
      throw new Error(`ENOENT: no such file or directory, scandir '${filepath}'`)
    }

    const entries: string[] = []
    const prefix = normalized === '/' ? '' : normalized + '/'

    // Find files in this directory
    for (const [filePath] of this.files) {
      if (filePath.startsWith(prefix)) {
        const relativePath = filePath.substring(prefix.length)
        const parts = relativePath.split('/')
        if (parts.length === 1 && parts[0]) {
          entries.push(parts[0])
        }
      }
    }

    // Find subdirectories
    for (const dirPath of this.directories) {
      if (dirPath.startsWith(prefix) && dirPath !== normalized) {
        const relativePath = dirPath.substring(prefix.length)
        const parts = relativePath.split('/')
        if (parts.length === 1 && parts[0]) {
          entries.push(parts[0])
        }
      }
    }

    return [...new Set(entries)].sort()
  }

  async mkdir(filepath: string): Promise<void> {
    const normalized = this.normalizePath(filepath)
    this.ensureParentDir(normalized)
    this.directories.add(normalized)
  }

  async rmdir(filepath: string): Promise<void> {
    const normalized = this.normalizePath(filepath)
    
    if (!this.directories.has(normalized)) {
      throw new Error(`ENOENT: no such file or directory, rmdir '${filepath}'`)
    }

    // Check if directory is empty
    const entries = await this.readdir(filepath)
    if (entries.length > 0) {
      throw new Error(`ENOTEMPTY: directory not empty, rmdir '${filepath}'`)
    }

    this.directories.delete(normalized)
  }

  async stat(filepath: string): Promise<{
    type: 'file' | 'dir'
    mode: number
    size: number
    ino: number
    mtimeMs: number
    ctimeMs: number
    uid: number
    gid: number
    dev: number
  }> {
    const normalized = this.normalizePath(filepath)
    
    if (this.files.has(normalized)) {
      const data = this.files.get(normalized)!
      const size = typeof data === 'string' ? data.length : data.byteLength
      
      return {
        type: 'file',
        mode: 33188, // 0o100644
        size,
        ino: 1,
        mtimeMs: Date.now(),
        ctimeMs: Date.now(),
        uid: 1000,
        gid: 1000,
        dev: 1
      }
    }

    if (this.directories.has(normalized)) {
      return {
        type: 'dir',
        mode: 16877, // 0o40755
        size: 0,
        ino: 1,
        mtimeMs: Date.now(),
        ctimeMs: Date.now(),
        uid: 1000,
        gid: 1000,
        dev: 1
      }
    }

    throw new Error(`ENOENT: no such file or directory, stat '${filepath}'`)
  }

  async lstat(filepath: string): Promise<any> {
    return this.stat(filepath)
  }

  // Load files from existing file system
  loadFromFileSystem(files: Record<string, { content: string; isDirectory: boolean }>): void {
    this.files.clear()
    this.directories.clear()
    this.directories.add('/')

    for (const [path, fileData] of Object.entries(files)) {
      const normalized = this.normalizePath(path)
      
      if (fileData.isDirectory) {
        this.directories.add(normalized)
      } else {
        this.ensureParentDir(normalized)
        this.files.set(normalized, fileData.content)
      }
    }
  }

  // Export current state
  exportFileSystem(): Record<string, { content: string; isDirectory: boolean }> {
    const result: Record<string, { content: string; isDirectory: boolean }> = {}

    // Export files
    for (const [path, data] of this.files) {
      result[path] = {
        content: typeof data === 'string' ? data : new TextDecoder().decode(data),
        isDirectory: false
      }
    }

    // Export directories (excluding root)
    for (const path of this.directories) {
      if (path !== '/') {
        result[path] = {
          content: '',
          isDirectory: true
        }
      }
    }

    return result
  }

  // Get all files (for debugging)
  getAllFiles(): string[] {
    return Array.from(this.files.keys())
  }

  // Get all directories (for debugging)
  getAllDirectories(): string[] {
    return Array.from(this.directories)
  }
}

// Factory function to create appropriate filesystem
export function createFileSystemAPI(): FileSystemAPI {
  // In browser environment, use in-memory filesystem
  if (typeof window !== 'undefined') {
    return new BrowserFileSystemAPI()
  }
  
  // In Node.js environment, could use real filesystem
  // For now, fallback to in-memory
  return new BrowserFileSystemAPI()
}
