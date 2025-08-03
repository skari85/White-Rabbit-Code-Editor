'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Replace, X, ChevronDown, ChevronUp, RotateCcw, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileContent } from '@/hooks/use-code-builder';

interface SearchResult {
  file: string;
  line: number;
  column: number;
  match: string;
  context: string;
  lineText: string;
}

interface FindReplacePanelProps {
  files: FileContent[];
  selectedFile?: string;
  onNavigateToResult: (file: string, line: number, column: number) => void;
  onReplaceInFile: (file: string, searchText: string, replaceText: string, options: SearchOptions) => void;
  className?: string;
}

interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
  searchInFiles: boolean;
  includeFileTypes: string[];
  excludeFileTypes: string[];
}

export default function FindReplacePanel({
  files,
  selectedFile,
  onNavigateToResult,
  onReplaceInFile,
  className = ''
}: FindReplacePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
    searchInFiles: true,
    includeFileTypes: ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.json'],
    excludeFileTypes: []
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when expanded
  useEffect(() => {
    if (isExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isExpanded]);

  // Perform search when search text or options change
  useEffect(() => {
    if (searchText.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
      setCurrentResultIndex(0);
    }
  }, [searchText, options, files]);

  const performSearch = async () => {
    if (!searchText.trim()) return;

    setIsSearching(true);
    const results: SearchResult[] = [];

    try {
      const searchRegex = createSearchRegex(searchText, options);
      const filesToSearch = options.searchInFiles 
        ? files.filter(file => shouldIncludeFile(file.name))
        : files.filter(file => file.name === selectedFile);

      filesToSearch.forEach(file => {
        const lines = file.content.split('\n');
        lines.forEach((line, lineIndex) => {
          let match;
          const regex = new RegExp(searchRegex.source, searchRegex.flags + 'g');
          
          while ((match = regex.exec(line)) !== null) {
            results.push({
              file: file.name,
              line: lineIndex + 1,
              column: match.index + 1,
              match: match[0],
              context: getContextAroundMatch(lines, lineIndex, match.index, match[0].length),
              lineText: line
            });
          }
        });
      });

      setSearchResults(results);
      setCurrentResultIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const createSearchRegex = (text: string, opts: SearchOptions): RegExp => {
    let pattern = text;
    
    if (!opts.regex) {
      // Escape special regex characters
      pattern = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    if (opts.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
    
    const flags = opts.caseSensitive ? '' : 'i';
    return new RegExp(pattern, flags);
  };

  const shouldIncludeFile = (fileName: string): boolean => {
    const ext = '.' + fileName.split('.').pop()?.toLowerCase();
    
    if (options.excludeFileTypes.includes(ext)) return false;
    if (options.includeFileTypes.length === 0) return true;
    return options.includeFileTypes.includes(ext);
  };

  const getContextAroundMatch = (lines: string[], lineIndex: number, columnIndex: number, matchLength: number): string => {
    const contextRadius = 30;
    const line = lines[lineIndex];
    const start = Math.max(0, columnIndex - contextRadius);
    const end = Math.min(line.length, columnIndex + matchLength + contextRadius);
    
    let context = line.substring(start, end);
    if (start > 0) context = '...' + context;
    if (end < line.length) context = context + '...';
    
    return context;
  };

  const navigateToResult = (index: number) => {
    if (index >= 0 && index < searchResults.length) {
      const result = searchResults[index];
      setCurrentResultIndex(index);
      onNavigateToResult(result.file, result.line, result.column);
    }
  };

  const navigateNext = () => {
    const nextIndex = (currentResultIndex + 1) % searchResults.length;
    navigateToResult(nextIndex);
  };

  const navigatePrevious = () => {
    const prevIndex = currentResultIndex === 0 ? searchResults.length - 1 : currentResultIndex - 1;
    navigateToResult(prevIndex);
  };

  const replaceAll = () => {
    if (!replaceText && replaceText !== '') return;
    
    const filesToReplace = options.searchInFiles 
      ? files.filter(file => shouldIncludeFile(file.name))
      : files.filter(file => file.name === selectedFile);

    filesToReplace.forEach(file => {
      if (searchResults.some(result => result.file === file.name)) {
        onReplaceInFile(file.name, searchText, replaceText, options);
      }
    });

    // Refresh search after replace
    setTimeout(() => performSearch(), 100);
  };

  const replaceNext = () => {
    if (searchResults.length === 0 || !replaceText && replaceText !== '') return;
    
    const currentResult = searchResults[currentResultIndex];
    onReplaceInFile(currentResult.file, searchText, replaceText, options);
    
    // Refresh search and move to next result
    setTimeout(() => {
      performSearch();
      if (currentResultIndex < searchResults.length - 1) {
        navigateNext();
      }
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        navigatePrevious();
      } else {
        navigateNext();
      }
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        variant="outline"
        size="sm"
        className={`flex items-center gap-2 ${className}`}
      >
        <Search className="w-4 h-4" />
        Find
      </Button>
    );
  }

  return (
    <div className={`bg-white border rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm">Find & Replace</span>
          {searchResults.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {currentResultIndex + 1} of {searchResults.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => setShowReplace(!showReplace)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <Replace className="w-3 h-3" />
          </Button>
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <Settings className="w-3 h-3" />
          </Button>
          <Button
            onClick={() => setIsExpanded(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Input
            ref={searchInputRef}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="flex-1 text-sm"
          />
          <div className="flex items-center gap-1">
            <Button
              onClick={navigatePrevious}
              disabled={searchResults.length === 0}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button
              onClick={navigateNext}
              disabled={searchResults.length === 0}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Replace Input */}
        {showReplace && (
          <div className="flex items-center gap-2">
            <Input
              ref={replaceInputRef}
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace with..."
              className="flex-1 text-sm"
            />
            <Button
              onClick={replaceNext}
              disabled={searchResults.length === 0}
              variant="outline"
              size="sm"
              className="text-xs px-2"
            >
              Replace
            </Button>
            <Button
              onClick={replaceAll}
              disabled={searchResults.length === 0}
              variant="outline"
              size="sm"
              className="text-xs px-2"
            >
              All
            </Button>
          </div>
        )}

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={options.caseSensitive}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, caseSensitive: !!checked }))
                  }
                />
                Case sensitive
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={options.wholeWord}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, wholeWord: !!checked }))
                  }
                />
                Whole word
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={options.regex}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, regex: !!checked }))
                  }
                />
                Regex
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={options.searchInFiles}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, searchInFiles: !!checked }))
                }
              />
              Search in all files
            </label>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="border-t max-h-64 overflow-y-auto">
          <div className="p-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Results ({searchResults.length})
            </h4>
            <div className="space-y-1">
              {searchResults.map((result, index) => (
                <div
                  key={`${result.file}-${result.line}-${result.column}`}
                  onClick={() => navigateToResult(index)}
                  className={`p-2 rounded cursor-pointer text-xs ${
                    index === currentResultIndex
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3 h-3 text-gray-400" />
                    <span className="font-medium text-gray-700">{result.file}</span>
                    <span className="text-gray-500">:{result.line}:{result.column}</span>
                  </div>
                  <div className="text-gray-600 font-mono">
                    {result.context.split(result.match).map((part, i) => (
                      <span key={i}>
                        {part}
                        {i < result.context.split(result.match).length - 1 && (
                          <mark className="bg-yellow-200 px-1">{result.match}</mark>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {searchText && searchResults.length === 0 && !isSearching && (
        <div className="p-4 text-center text-gray-500 text-sm">
          No results found for "{searchText}"
        </div>
      )}

      {/* Loading */}
      {isSearching && (
        <div className="p-4 text-center text-gray-500 text-sm">
          Searching...
        </div>
      )}
    </div>
  );
}
