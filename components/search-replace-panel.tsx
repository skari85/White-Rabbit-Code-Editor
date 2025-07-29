'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Replace, 
  X, 
  ChevronUp, 
  ChevronDown, 
  FileText,
  ArrowUp,
  ArrowDown,
  Regex,
  CaseSensitive
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchResult {
  fileId: string;
  fileName: string;
  line: number;
  column: number;
  match: string;
  context: string;
  fullLine: string;
}

export interface SearchReplacePanelProps {
  files: Record<string, { name: string; content: string }>;
  onFileSelect?: (fileId: string, line?: number, column?: number) => void;
  onReplace?: (fileId: string, line: number, column: number, oldText: string, newText: string) => void;
  className?: string;
}

const SearchReplacePanel: React.FC<SearchReplacePanelProps> = ({
  files,
  onFileSelect,
  onReplace,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Search across all files
  const performSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const newResults: SearchResult[] = [];
    const searchRegex = isRegex 
      ? new RegExp(searchQuery, isCaseSensitive ? 'g' : 'gi')
      : new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), isCaseSensitive ? 'g' : 'gi');

    Object.entries(files).forEach(([fileId, file]) => {
      const lines = file.content.split('\n');
      
      lines.forEach((line, lineIndex) => {
        let match;
        const lineRegex = new RegExp(searchRegex.source, searchRegex.flags);
        
        while ((match = lineRegex.exec(line)) !== null) {
          const startColumn = match.index;
          const endColumn = startColumn + match[0].length;
          
          // Get context (surrounding text)
          const contextStart = Math.max(0, startColumn - 20);
          const contextEnd = Math.min(line.length, endColumn + 20);
          const context = line.substring(contextStart, contextEnd);
          
          newResults.push({
            fileId,
            fileName: file.name,
            line: lineIndex + 1,
            column: startColumn + 1,
            match: match[0],
            context: contextStart > 0 ? '...' + context : context,
            fullLine: line
          });
        }
      });
    });

    setResults(newResults);
    setSelectedResultIndex(0);
  }, [searchQuery, replaceQuery, isRegex, isCaseSensitive, files]);

  // Perform search when query changes
  useEffect(() => {
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [performSearch]);

  // Navigate to selected result
  const navigateToResult = useCallback((index: number) => {
    if (index >= 0 && index < results.length) {
      setSelectedResultIndex(index);
      const result = results[index];
      onFileSelect?.(result.fileId, result.line, result.column);
    }
  }, [results, onFileSelect]);

  // Navigate to next/previous result
  const navigateNext = useCallback(() => {
    if (results.length > 0) {
      const nextIndex = (selectedResultIndex + 1) % results.length;
      navigateToResult(nextIndex);
    }
  }, [selectedResultIndex, results.length, navigateToResult]);

  const navigatePrev = useCallback(() => {
    if (results.length > 0) {
      const prevIndex = selectedResultIndex === 0 ? results.length - 1 : selectedResultIndex - 1;
      navigateToResult(prevIndex);
    }
  }, [selectedResultIndex, results.length, navigateToResult]);

  // Replace current match
  const replaceCurrent = useCallback(() => {
    if (selectedResultIndex >= 0 && selectedResultIndex < results.length && replaceQuery !== undefined) {
      const result = results[selectedResultIndex];
      onReplace?.(result.fileId, result.line, result.column, result.match, replaceQuery);
      
      // Remove the replaced result and adjust index
      const newResults = results.filter((_, index) => index !== selectedResultIndex);
      setResults(newResults);
      setSelectedResultIndex(Math.min(selectedResultIndex, newResults.length - 1));
    }
  }, [selectedResultIndex, results, replaceQuery, onReplace]);

  // Replace all matches
  const replaceAll = useCallback(() => {
    if (replaceQuery !== undefined) {
      results.forEach(result => {
        onReplace?.(result.fileId, result.line, result.column, result.match, replaceQuery);
      });
      setResults([]);
      setSelectedResultIndex(0);
    }
  }, [results, replaceQuery, onReplace]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            // Focus search input
            break;
          case 'h':
            e.preventDefault();
            setIsReplaceMode(true);
            break;
        }
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        if (e.shiftKey) {
          navigatePrev();
        } else {
          navigateNext();
        }
      } else if (e.key === 'Escape') {
        setSearchQuery('');
        setResults([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigateNext, navigatePrev, results.length]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search & Replace
            {results.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedResultIndex + 1}/{results.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRegex(!isRegex)}
            className={cn(isRegex && "bg-blue-600/20 text-blue-400")}
            title="Regex"
          >
            <Regex className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCaseSensitive(!isCaseSensitive)}
            className={cn(isCaseSensitive && "bg-blue-600/20 text-blue-400")}
            title="Case Sensitive"
          >
            <CaseSensitive className="w-4 h-4" />
          </Button>
        </div>

        {/* Replace Input */}
        {isReplaceMode && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Replace className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Replace with..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={replaceCurrent}
              disabled={selectedResultIndex < 0 || selectedResultIndex >= results.length}
            >
              Replace
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={replaceAll}
              disabled={results.length === 0}
            >
              Replace All
            </Button>
          </div>
        )}

        {/* Toggle Replace Mode */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="replace-mode"
            checked={isReplaceMode}
            onCheckedChange={(checked) => setIsReplaceMode(checked as boolean)}
          />
          <label htmlFor="replace-mode" className="text-sm">Replace mode</label>
        </div>

        {/* Results */}
        {isExpanded && results.length > 0 && (
          <div className="border-t border-gray-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigatePrev}
                  disabled={results.length === 0}
                >
                  <ArrowUp className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigateNext}
                  disabled={results.length === 0}
                >
                  <ArrowDown className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-48">
              <div className="space-y-1">
                {results.map((result, index) => (
                  <div
                    key={`${result.fileId}-${result.line}-${result.column}`}
                    className={cn(
                      'p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors',
                      index === selectedResultIndex && 'bg-blue-600/20 border border-blue-500/50'
                    )}
                    onClick={() => navigateToResult(index)}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-3 h-3 text-gray-400" />
                      <span className="font-mono text-xs text-gray-400">
                        {result.fileName}:{result.line}:{result.column}
                      </span>
                    </div>
                    <div className="mt-1 text-sm">
                      <span className="text-gray-300">{result.context}</span>
                      <span className="bg-yellow-600/50 text-yellow-100 px-1 rounded">
                        {result.match}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* No Results */}
        {isExpanded && searchQuery && results.length === 0 && (
          <div className="text-center py-4 text-gray-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No matches found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchReplacePanel; 