/**
 * White Rabbit Code Editor - Search Panel Component
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Collapsible,
    CollapsibleContent
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAnalytics } from '@/hooks/use-analytics'
import {
    ReplaceOptions,
    ReplaceSummary,
    SearchOptions,
    SearchReplaceService,
    SearchResult,
    SearchSummary
} from '@/lib/search-replace-service'
import {
    ChevronDown,
    ChevronRight,
    FileText,
    Filter,
    History,
    RefreshCw,
    Replace,
    Search
} from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'

interface SearchPanelProps {
  searchService: SearchReplaceService
  onFileSelect?: (file: string, line?: number, column?: number) => void
  className?: string
}

export function SearchPanel({ searchService, onFileSelect, className }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    query: '',
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    includePatterns: [],
    excludePatterns: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
    maxResults: 1000
  })
  const [searchResults, setSearchResults] = useState<SearchSummary | null>(null)
  const [replaceResults, setReplaceResults] = useState<ReplaceSummary | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)
  const [searchProgress, setSearchProgress] = useState<{ current: number; total: number; file?: string } | null>(null)
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [includePattern, setIncludePattern] = useState('')
  const [excludePattern, setExcludePattern] = useState('node_modules/**,dist/**,build/**,.git/**')
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  const { trackFeatureUsed } = useAnalytics()

  // Load search history
  useEffect(() => {
    const history = searchService.getSearchHistory().map(h => h.query).slice(0, 10)
    setSearchHistory(history)
  }, [searchService])

  // Set up search progress callback
  useEffect(() => {
    searchService['onSearchProgress'] = (progress) => {
      setSearchProgress(progress)
    }

    return () => {
      searchService['onSearchProgress'] = undefined
    }
  }, [searchService])

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchProgress({ current: 0, total: 100 })

    try {
      const options: SearchOptions = {
        ...searchOptions,
        query: searchQuery,
        includePatterns: includePattern ? includePattern.split(',').map(p => p.trim()) : [],
        excludePatterns: excludePattern ? excludePattern.split(',').map(p => p.trim()) : []
      }

      const results = await searchService.search(options)
      setSearchResults(results)
      trackFeatureUsed('search_execute')
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
      setSearchProgress(null)
    }
  }, [searchQuery, searchOptions, includePattern, excludePattern, searchService, trackFeatureUsed])

  // Handle replace
  const handleReplace = useCallback(async () => {
    if (!searchQuery.trim() || !replaceQuery) return

    setIsReplacing(true)

    try {
      const options: ReplaceOptions = {
        ...searchOptions,
        query: searchQuery,
        replacement: replaceQuery,
        confirmEach: false,
        includePatterns: includePattern ? includePattern.split(',').map(p => p.trim()) : [],
        excludePatterns: excludePattern ? excludePattern.split(',').map(p => p.trim()) : []
      }

      const results = await searchService.replace(options)
      setReplaceResults(results)
      
      // Refresh search results after replace
      await handleSearch()
      
      trackFeatureUsed('search_replace')
    } catch (error) {
      console.error('Replace failed:', error)
    } finally {
      setIsReplacing(false)
    }
  }, [searchQuery, replaceQuery, searchOptions, includePattern, excludePattern, searchService, handleSearch, trackFeatureUsed])

  // Handle quick search
  const handleQuickSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    setIsSearching(true)

    try {
      const results = await searchService.quickSearch(query, searchOptions.caseSensitive)
      setSearchResults(results)
      trackFeatureUsed('search_quick')
    } catch (error) {
      console.error('Quick search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }, [searchService, searchOptions.caseSensitive, trackFeatureUsed])

  // Toggle file expansion
  const toggleFileExpansion = (file: string) => {
    const newExpanded = new Set(expandedFiles)
    if (newExpanded.has(file)) {
      newExpanded.delete(file)
    } else {
      newExpanded.add(file)
    }
    setExpandedFiles(newExpanded)
  }

  // Navigate to search result
  const handleResultClick = (result: SearchResult) => {
    onFileSelect?.(result.file, result.line, result.column)
  }

  // Group results by file
  const groupResultsByFile = (results: SearchResult[]) => {
    const grouped = new Map<string, SearchResult[]>()
    for (const result of results) {
      if (!grouped.has(result.file)) {
        grouped.set(result.file, [])
      }
      grouped.get(result.file)!.push(result)
    }
    return grouped
  }

  // Handle search on Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Handle replace on Enter
  const handleReplaceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleReplace()
    }
  }

  // Format file path
  const formatFilePath = (filePath: string) => {
    const parts = filePath.split('/')
    return parts[parts.length - 1]
  }

  // Get file directory
  const getFileDirectory = (filePath: string) => {
    const parts = filePath.split('/')
    return parts.slice(0, -1).join('/')
  }

  const groupedResults = searchResults ? groupResultsByFile(searchResults.results) : new Map()

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Search className="w-4 h-4" />
          Search & Replace
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="replace">Replace</TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-8"
                />
              </div>

              {/* Search Options */}
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="case-sensitive"
                    checked={searchOptions.caseSensitive}
                    onCheckedChange={(checked) => 
                      setSearchOptions(prev => ({ ...prev, caseSensitive: !!checked }))
                    }
                  />
                  <label htmlFor="case-sensitive">Aa</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="whole-word"
                    checked={searchOptions.wholeWord}
                    onCheckedChange={(checked) => 
                      setSearchOptions(prev => ({ ...prev, wholeWord: !!checked }))
                    }
                  />
                  <label htmlFor="whole-word">Ab</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="regex"
                    checked={searchOptions.useRegex}
                    onCheckedChange={(checked) => 
                      setSearchOptions(prev => ({ ...prev, useRegex: !!checked }))
                    }
                  />
                  <label htmlFor="regex">.*</label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <Filter className="w-3 h-3" />
                </Button>
              </div>

              {/* Advanced Options */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleContent className="space-y-2">
                  <Input
                    placeholder="Include patterns (comma-separated)"
                    value={includePattern}
                    onChange={(e) => setIncludePattern(e.target.value)}
                  />
                  <Input
                    placeholder="Exclude patterns (comma-separated)"
                    value={excludePattern}
                    onChange={(e) => setExcludePattern(e.target.value)}
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="w-full"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {isSearching ? 'Searching...' : 'Search'}
            </Button>

            {/* Search Progress */}
            {searchProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Searching files...</span>
                  <span>{searchProgress.current}/{searchProgress.total}</span>
                </div>
                <Progress value={(searchProgress.current / searchProgress.total) * 100} />
                {searchProgress.file && (
                  <div className="text-xs text-muted-foreground truncate">
                    {searchProgress.file}
                  </div>
                )}
              </div>
            )}

            {/* Search Results */}
            {searchResults && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {searchResults.totalResults} results in {searchResults.totalFiles} files
                  </span>
                  <span className="text-muted-foreground">
                    {searchResults.duration}ms
                  </span>
                </div>

                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {Array.from(groupedResults.entries()).map(([file, results]) => (
                      <div key={file} className="border rounded">
                        <div
                          className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted"
                          onClick={() => toggleFileExpansion(file)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedFiles.has(file) ? 
                              <ChevronDown className="w-3 h-3" /> : 
                              <ChevronRight className="w-3 h-3" />
                            }
                            <FileText className="w-3 h-3" />
                            <span className="text-sm font-medium">{formatFilePath(file)}</span>
                            <Badge variant="outline" className="text-xs">
                              {results.length}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {getFileDirectory(file)}
                          </span>
                        </div>
                        
                        <Collapsible open={expandedFiles.has(file)}>
                          <CollapsibleContent>
                            <div className="border-t">
                              {results.map((result: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 p-2 pl-8 hover:bg-muted cursor-pointer text-sm"
                                  onClick={() => handleResultClick(result)}
                                >
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {result.line}:{result.column}
                                  </Badge>
                                  <div className="flex-1 min-w-0">
                                    <div className="truncate font-mono text-xs">
                                      {result.preview || result.text}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {searchResults.hasMore && (
                  <div className="text-center text-sm text-muted-foreground">
                    More results available. Refine your search to see all results.
                  </div>
                )}
              </div>
            )}

            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <History className="w-3 h-3" />
                  Recent Searches
                </div>
                <div className="flex flex-wrap gap-1">
                  {searchHistory.slice(0, 5).map((query, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => handleQuickSearch(query)}
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Replace Tab */}
          <TabsContent value="replace" className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Find..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-8"
              />
            </div>

            {/* Replace Input */}
            <div className="relative">
              <Replace className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Replace..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                onKeyDown={handleReplaceKeyDown}
                className="pl-8"
              />
            </div>

            {/* Replace Options */}
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="replace-case-sensitive"
                  checked={searchOptions.caseSensitive}
                  onCheckedChange={(checked) => 
                    setSearchOptions(prev => ({ ...prev, caseSensitive: !!checked }))
                  }
                />
                <label htmlFor="replace-case-sensitive">Aa</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="replace-whole-word"
                  checked={searchOptions.wholeWord}
                  onCheckedChange={(checked) => 
                    setSearchOptions(prev => ({ ...prev, wholeWord: !!checked }))
                  }
                />
                <label htmlFor="replace-whole-word">Ab</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="replace-regex"
                  checked={searchOptions.useRegex}
                  onCheckedChange={(checked) => 
                    setSearchOptions(prev => ({ ...prev, useRegex: !!checked }))
                  }
                />
                <label htmlFor="replace-regex">.*</label>
              </div>
            </div>

            {/* Replace Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                variant="outline"
                className="flex-1"
              >
                <Search className="w-4 h-4 mr-2" />
                Find
              </Button>
              <Button
                onClick={handleReplace}
                disabled={isReplacing || !searchQuery.trim() || !replaceQuery}
                className="flex-1"
              >
                {isReplacing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Replace className="w-4 h-4 mr-2" />
                )}
                Replace All
              </Button>
            </div>

            {/* Replace Results */}
            {replaceResults && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {replaceResults.totalReplacements} replacements in {replaceResults.totalFiles} files
                  </span>
                  <span className="text-muted-foreground">
                    {replaceResults.duration}ms
                  </span>
                </div>

                {replaceResults.errors.length > 0 && (
                  <div className="p-2 rounded border border-red-200 bg-red-50">
                    <div className="text-sm font-medium text-red-700 mb-1">Errors:</div>
                    {replaceResults.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-600">{error}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Show search results here too */}
            {searchResults && groupedResults.size > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Preview:</div>
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {Array.from(groupedResults.entries()).slice(0, 3).map(([file, results]) => (
                      <div key={file} className="text-xs">
                        <div className="font-medium">{formatFilePath(file)}</div>
                        <div className="text-muted-foreground ml-2">
                          {results.length} match{results.length !== 1 ? 'es' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
