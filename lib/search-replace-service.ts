/**
 * White Rabbit Code Editor - Search and Replace Service
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

export interface SearchOptions {
  query: string
  caseSensitive: boolean
  wholeWord: boolean
  useRegex: boolean
  includePatterns: string[]
  excludePatterns: string[]
  maxResults?: number
}

export interface ReplaceOptions extends SearchOptions {
  replacement: string
  confirmEach: boolean
}

export interface SearchResult {
  file: string
  line: number
  column: number
  text: string
  match: string
  context: {
    before: string
    after: string
  }
  preview?: string
}

export interface SearchSummary {
  query: string
  totalResults: number
  totalFiles: number
  duration: number
  results: SearchResult[]
  hasMore: boolean
}

export interface ReplaceResult {
  file: string
  line: number
  column: number
  originalText: string
  newText: string
  success: boolean
  error?: string
}

export interface ReplaceSummary {
  query: string
  replacement: string
  totalReplacements: number
  totalFiles: number
  duration: number
  results: ReplaceResult[]
  errors: string[]
}

export interface FileSearchIndex {
  file: string
  content: string
  lines: string[]
  lastModified: number
}

export class SearchReplaceService {
  private fileIndex: Map<string, FileSearchIndex> = new Map()
  private searchHistory: SearchOptions[] = []
  private replaceHistory: ReplaceOptions[] = []
  private onSearchProgress?: (progress: { current: number; total: number; file?: string }) => void

  constructor(onSearchProgress?: (progress: { current: number; total: number; file?: string }) => void) {
    this.onSearchProgress = onSearchProgress
  }

  // Index files for searching
  indexFiles(files: Record<string, { content: string; lastModified?: number }>): void {
    console.log(`📚 Indexing ${Object.keys(files).length} files for search...`)
    
    for (const [filePath, fileData] of Object.entries(files)) {
      // Skip binary files and large files
      if (this.shouldSkipFile(filePath, fileData.content)) {
        continue
      }

      const index: FileSearchIndex = {
        file: filePath,
        content: fileData.content,
        lines: fileData.content.split('\n'),
        lastModified: fileData.lastModified || Date.now()
      }

      this.fileIndex.set(filePath, index)
    }

    console.log(`✅ Indexed ${this.fileIndex.size} files`)
  }

  // Update file in index
  updateFileIndex(filePath: string, content: string): void {
    if (this.shouldSkipFile(filePath, content)) {
      this.fileIndex.delete(filePath)
      return
    }

    const index: FileSearchIndex = {
      file: filePath,
      content,
      lines: content.split('\n'),
      lastModified: Date.now()
    }

    this.fileIndex.set(filePath, index)
  }

  // Remove file from index
  removeFileIndex(filePath: string): void {
    this.fileIndex.delete(filePath)
  }

  // Check if file should be skipped
  private shouldSkipFile(filePath: string, content: string): boolean {
    // Skip binary files
    const binaryExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip', '.exe', '.dll']
    if (binaryExtensions.some(ext => filePath.toLowerCase().endsWith(ext))) {
      return true
    }

    // Skip very large files (>1MB)
    if (content.length > 1024 * 1024) {
      return true
    }

    // Skip node_modules and other common ignore patterns
    const ignorePatterns = [
      'node_modules/',
      '.git/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      '.nyc_output/',
      'logs/'
    ]

    return ignorePatterns.some(pattern => filePath.includes(pattern))
  }

  // Search across files
  async search(options: SearchOptions): Promise<SearchSummary> {
    const startTime = Date.now()
    console.log(`🔍 Searching for: "${options.query}"`)

    // Add to search history
    this.searchHistory.unshift(options)
    if (this.searchHistory.length > 50) {
      this.searchHistory.pop()
    }

    const results: SearchResult[] = []
    const filesWithResults = new Set<string>()
    
    // Get files to search
    const filesToSearch = this.getFilesToSearch(options)
    let currentFile = 0

    for (const fileIndex of filesToSearch) {
      currentFile++
      this.onSearchProgress?.({
        current: currentFile,
        total: filesToSearch.length,
        file: fileIndex.file
      })

      const fileResults = await this.searchInFile(fileIndex, options)
      
      for (const result of fileResults) {
        if (options.maxResults && results.length >= options.maxResults) {
          break
        }
        results.push(result)
        filesWithResults.add(result.file)
      }

      if (options.maxResults && results.length >= options.maxResults) {
        break
      }
    }

    const duration = Date.now() - startTime
    const hasMore = options.maxResults ? results.length >= options.maxResults : false

    console.log(`✅ Search completed: ${results.length} results in ${filesWithResults.size} files (${duration}ms)`)

    return {
      query: options.query,
      totalResults: results.length,
      totalFiles: filesWithResults.size,
      duration,
      results,
      hasMore
    }
  }

  // Get files to search based on include/exclude patterns
  private getFilesToSearch(options: SearchOptions): FileSearchIndex[] {
    const files: FileSearchIndex[] = []

    for (const fileIndex of this.fileIndex.values()) {
      // Check include patterns
      if (options.includePatterns.length > 0) {
        const included = options.includePatterns.some(pattern => 
          this.matchesPattern(fileIndex.file, pattern)
        )
        if (!included) continue
      }

      // Check exclude patterns
      if (options.excludePatterns.length > 0) {
        const excluded = options.excludePatterns.some(pattern => 
          this.matchesPattern(fileIndex.file, pattern)
        )
        if (excluded) continue
      }

      files.push(fileIndex)
    }

    return files
  }

  // Check if file matches pattern (supports glob-like patterns)
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')

    const regex = new RegExp(regexPattern, 'i')
    return regex.test(filePath)
  }

  // Search within a single file
  private async searchInFile(fileIndex: FileSearchIndex, options: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    
    try {
      let searchRegex: RegExp

      if (options.useRegex) {
        const flags = options.caseSensitive ? 'g' : 'gi'
        searchRegex = new RegExp(options.query, flags)
      } else {
        let escapedQuery = options.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        
        if (options.wholeWord) {
          escapedQuery = `\\b${escapedQuery}\\b`
        }
        
        const flags = options.caseSensitive ? 'g' : 'gi'
        searchRegex = new RegExp(escapedQuery, flags)
      }

      // Search line by line
      for (let lineIndex = 0; lineIndex < fileIndex.lines.length; lineIndex++) {
        const line = fileIndex.lines[lineIndex]
        let match: RegExpExecArray | null

        // Reset regex lastIndex for global search
        searchRegex.lastIndex = 0

        while ((match = searchRegex.exec(line)) !== null) {
          const result: SearchResult = {
            file: fileIndex.file,
            line: lineIndex + 1, // 1-based line numbers
            column: match.index + 1, // 1-based column numbers
            text: line,
            match: match[0],
            context: {
              before: lineIndex > 0 ? fileIndex.lines[lineIndex - 1] : '',
              after: lineIndex < fileIndex.lines.length - 1 ? fileIndex.lines[lineIndex + 1] : ''
            },
            preview: this.generatePreview(line, match.index, match[0].length)
          }

          results.push(result)

          // Prevent infinite loop with zero-width matches
          if (match[0].length === 0) {
            searchRegex.lastIndex++
          }
        }
      }
    } catch (error) {
      console.warn(`Search error in file ${fileIndex.file}:`, error)
    }

    return results
  }

  // Generate preview with highlighted match
  private generatePreview(line: string, matchIndex: number, matchLength: number): string {
    const maxLength = 100
    const before = line.substring(0, matchIndex)
    const match = line.substring(matchIndex, matchIndex + matchLength)
    const after = line.substring(matchIndex + matchLength)

    let preview = ''
    let start = 0

    // If line is too long, center around the match
    if (line.length > maxLength) {
      const halfMax = Math.floor(maxLength / 2)
      start = Math.max(0, matchIndex - halfMax)
      const end = Math.min(line.length, start + maxLength)
      
      preview = (start > 0 ? '...' : '') + 
                line.substring(start, end) + 
                (end < line.length ? '...' : '')
    } else {
      preview = line
    }

    return preview
  }

  // Replace across files
  async replace(options: ReplaceOptions): Promise<ReplaceSummary> {
    const startTime = Date.now()
    console.log(`🔄 Replacing "${options.query}" with "${options.replacement}"`)

    // Add to replace history
    this.replaceHistory.unshift(options)
    if (this.replaceHistory.length > 50) {
      this.replaceHistory.pop()
    }

    // First, search for all matches
    const searchSummary = await this.search(options)
    
    const results: ReplaceResult[] = []
    const errors: string[] = []
    const filesModified = new Set<string>()

    // Group results by file for efficient replacement
    const resultsByFile = new Map<string, SearchResult[]>()
    for (const result of searchSummary.results) {
      if (!resultsByFile.has(result.file)) {
        resultsByFile.set(result.file, [])
      }
      resultsByFile.get(result.file)!.push(result)
    }

    // Replace in each file
    for (const [filePath, fileResults] of resultsByFile.entries()) {
      try {
        const replaceResults = await this.replaceInFile(filePath, fileResults, options)
        results.push(...replaceResults)
        
        if (replaceResults.some(r => r.success)) {
          filesModified.add(filePath)
        }
      } catch (error) {
        const errorMsg = `Failed to replace in ${filePath}: ${error}`
        errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    const duration = Date.now() - startTime
    const successfulReplacements = results.filter(r => r.success).length

    console.log(`✅ Replace completed: ${successfulReplacements} replacements in ${filesModified.size} files (${duration}ms)`)

    return {
      query: options.query,
      replacement: options.replacement,
      totalReplacements: successfulReplacements,
      totalFiles: filesModified.size,
      duration,
      results,
      errors
    }
  }

  // Replace within a single file
  private async replaceInFile(
    filePath: string, 
    searchResults: SearchResult[], 
    options: ReplaceOptions
  ): Promise<ReplaceResult[]> {
    const fileIndex = this.fileIndex.get(filePath)
    if (!fileIndex) {
      throw new Error(`File not found in index: ${filePath}`)
    }

    const results: ReplaceResult[] = []
    let content = fileIndex.content
    let offset = 0 // Track offset due to replacements

    // Sort results by position (reverse order to maintain positions)
    const sortedResults = [...searchResults].sort((a, b) => {
      if (a.line !== b.line) return b.line - a.line
      return b.column - a.column
    })

    for (const searchResult of sortedResults) {
      try {
        const lineIndex = searchResult.line - 1
        const columnIndex = searchResult.column - 1
        
        // Calculate actual position in content
        const lineStart = fileIndex.lines.slice(0, lineIndex).reduce((sum, line) => sum + line.length + 1, 0)
        const matchStart = lineStart + columnIndex
        const matchEnd = matchStart + searchResult.match.length

        // Perform replacement
        const before = content.substring(0, matchStart)
        const after = content.substring(matchEnd)
        const newContent = before + options.replacement + after

        const replaceResult: ReplaceResult = {
          file: filePath,
          line: searchResult.line,
          column: searchResult.column,
          originalText: searchResult.match,
          newText: options.replacement,
          success: true
        }

        results.push(replaceResult)
        content = newContent

        // Update offset
        offset += options.replacement.length - searchResult.match.length

      } catch (error) {
        const replaceResult: ReplaceResult = {
          file: filePath,
          line: searchResult.line,
          column: searchResult.column,
          originalText: searchResult.match,
          newText: options.replacement,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }

        results.push(replaceResult)
      }
    }

    // Update file index with new content
    if (results.some(r => r.success)) {
      this.updateFileIndex(filePath, content)
    }

    return results
  }

  // Get search history
  getSearchHistory(): SearchOptions[] {
    return [...this.searchHistory]
  }

  // Get replace history
  getReplaceHistory(): ReplaceOptions[] {
    return [...this.replaceHistory]
  }

  // Clear search history
  clearSearchHistory(): void {
    this.searchHistory = []
  }

  // Clear replace history
  clearReplaceHistory(): void {
    this.replaceHistory = []
  }

  // Get search suggestions based on history
  getSearchSuggestions(query: string): string[] {
    const suggestions = new Set<string>()
    
    // Add from search history
    for (const search of this.searchHistory) {
      if (search.query.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(search.query)
      }
    }

    // Add from replace history
    for (const replace of this.replaceHistory) {
      if (replace.query.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(replace.query)
      }
    }

    return Array.from(suggestions).slice(0, 10)
  }

  // Get file statistics
  getIndexStats(): {
    totalFiles: number
    totalLines: number
    totalSize: number
    lastIndexed: number
  } {
    let totalLines = 0
    let totalSize = 0
    let lastIndexed = 0

    for (const fileIndex of this.fileIndex.values()) {
      totalLines += fileIndex.lines.length
      totalSize += fileIndex.content.length
      lastIndexed = Math.max(lastIndexed, fileIndex.lastModified)
    }

    return {
      totalFiles: this.fileIndex.size,
      totalLines,
      totalSize,
      lastIndexed
    }
  }

  // Search in specific files only
  async searchInFiles(filePaths: string[], options: SearchOptions): Promise<SearchSummary> {
    const filteredOptions = {
      ...options,
      includePatterns: filePaths,
      excludePatterns: []
    }

    return this.search(filteredOptions)
  }

  // Quick search (simplified options)
  async quickSearch(query: string, caseSensitive = false): Promise<SearchSummary> {
    const options: SearchOptions = {
      query,
      caseSensitive,
      wholeWord: false,
      useRegex: false,
      includePatterns: [],
      excludePatterns: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      maxResults: 1000
    }

    return this.search(options)
  }
}
