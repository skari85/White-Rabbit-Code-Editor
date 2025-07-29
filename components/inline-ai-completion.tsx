'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Check, 
  X, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InlineSuggestion {
  id: string;
  text: string;
  confidence: number;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface InlineAICompletionProps {
  currentFile: { id: string; name: string; content: string; language?: string };
  cursorPosition: { line: number; column: number };
  onAcceptSuggestion: (suggestion: InlineSuggestion) => void;
  onRejectSuggestion: (suggestionId: string) => void;
  className?: string;
}

const InlineAICompletion: React.FC<InlineAICompletionProps> = ({
  currentFile,
  cursorPosition,
  onAcceptSuggestion,
  onRejectSuggestion,
  className
}) => {
  const [suggestions, setSuggestions] = useState<InlineSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Generate suggestions based on current context
  const generateSuggestions = useCallback(async () => {
    if (!currentFile.content.trim()) return;

    setIsGenerating(true);
    
    try {
      // Get context around cursor
      const lines = currentFile.content.split('\n');
      const contextLines = lines.slice(Math.max(0, cursorPosition.line - 5), cursorPosition.line);
      const context = contextLines.join('\n');
      
      // Simple pattern-based suggestions (in a real implementation, this would call an AI API)
      const newSuggestions: InlineSuggestion[] = [];
      
      // Common code patterns
      const patterns = [
        { pattern: /function\s+\w*\s*\(/, suggestion: '{\n  \n}' },
        { pattern: /if\s*\(/, suggestion: 'condition) {\n  \n}' },
        { pattern: /for\s*\(/, suggestion: 'let i = 0; i < array.length; i++) {\n  \n}' },
        { pattern: /while\s*\(/, suggestion: 'condition) {\n  \n}' },
        { pattern: /try\s*{/, suggestion: '\n  \n} catch (error) {\n  \n}' },
        { pattern: /const\s+\w+\s*=/, suggestion: ' value' },
        { pattern: /let\s+\w+\s*=/, suggestion: ' value' },
        { pattern: /import\s+{/, suggestion: ' Component } from \'./Component\'' },
        { pattern: /export\s+default/, suggestion: ' Component' },
        { pattern: /className=/, suggestion: '"container"' },
        { pattern: /onClick=/, suggestion: '={() => {\n  \n}}' },
        { pattern: /useState/, suggestion: '(initialValue)' },
        { pattern: /useEffect/, suggestion: '(() => {\n  \n}, [])' },
      ];

      const currentLine = lines[cursorPosition.line - 1] || '';
      const lineBeforeCursor = currentLine.substring(0, cursorPosition.column);

      patterns.forEach(({ pattern, suggestion }) => {
        if (pattern.test(lineBeforeCursor)) {
          newSuggestions.push({
            id: `suggestion-${Date.now()}-${Math.random()}`,
            text: suggestion,
            confidence: 0.8,
            startLine: cursorPosition.line,
            startColumn: cursorPosition.column,
            endLine: cursorPosition.line,
            endColumn: cursorPosition.column
          });
        }
      });

      // Language-specific suggestions
      if (currentFile.language === 'javascript' || currentFile.language === 'typescript') {
        if (lineBeforeCursor.includes('console.')) {
          newSuggestions.push({
            id: `suggestion-${Date.now()}-${Math.random()}`,
            text: 'log(\'debug\')',
            confidence: 0.9,
            startLine: cursorPosition.line,
            startColumn: cursorPosition.column,
            endLine: cursorPosition.line,
            endColumn: cursorPosition.column
          });
        }
        
        if (lineBeforeCursor.includes('return')) {
          newSuggestions.push({
            id: `suggestion-${Date.now()}-${Math.random()}`,
            text: ' value',
            confidence: 0.7,
            startLine: cursorPosition.line,
            startColumn: cursorPosition.column,
            endLine: cursorPosition.line,
            endColumn: cursorPosition.column
          });
        }
      }

      if (currentFile.language === 'html') {
        if (lineBeforeCursor.includes('<div')) {
          newSuggestions.push({
            id: `suggestion-${Date.now()}-${Math.random()}`,
            text: ' className="container">\n  \n</div>',
            confidence: 0.8,
            startLine: cursorPosition.line,
            startColumn: cursorPosition.column,
            endLine: cursorPosition.line,
            endColumn: cursorPosition.column
          });
        }
      }

      if (currentFile.language === 'css') {
        if (lineBeforeCursor.includes(':')) {
          newSuggestions.push({
            id: `suggestion-${Date.now()}-${Math.random()}`,
            text: ' value;',
            confidence: 0.8,
            startLine: cursorPosition.line,
            startColumn: cursorPosition.column,
            endLine: cursorPosition.line,
            endColumn: cursorPosition.column
          });
        }
      }

      setSuggestions(newSuggestions.slice(0, 3)); // Limit to 3 suggestions
      setSelectedSuggestionIndex(0);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [currentFile, cursorPosition]);

  // Debounced suggestion generation
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(generateSuggestions, 500);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [generateSuggestions]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestions.length === 0) return;

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            // Previous suggestion
            setSelectedSuggestionIndex(prev => 
              prev === 0 ? suggestions.length - 1 : prev - 1
            );
          } else {
            // Accept current suggestion
            const currentSuggestion = suggestions[selectedSuggestionIndex];
            if (currentSuggestion) {
              onAcceptSuggestion(currentSuggestion);
              setSuggestions([]);
            }
          }
          break;
        case 'Escape':
          setSuggestions([]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            (prev + 1) % suggestions.length
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev === 0 ? suggestions.length - 1 : prev - 1
          );
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, selectedSuggestionIndex, onAcceptSuggestion]);

  if (suggestions.length === 0) return null;

  return (
    <div className={cn('absolute z-50', className)}>
      <Card className="w-80 shadow-lg border-gray-700 bg-gray-900">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">AI Suggestions</span>
              {isGenerating && (
                <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
              )}
            </div>
            <Badge variant="secondary" className="text-xs">
              {selectedSuggestionIndex + 1}/{suggestions.length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className={cn(
                  'p-2 rounded cursor-pointer transition-colors',
                  index === selectedSuggestionIndex 
                    ? 'bg-blue-600/20 border border-blue-500/50' 
                    : 'hover:bg-gray-800'
                )}
                onClick={() => {
                  setSelectedSuggestionIndex(index);
                  onAcceptSuggestion(suggestion);
                  setSuggestions([]);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        Confidence: {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                    <pre className="text-sm font-mono text-gray-200 whitespace-pre-wrap">
                      {suggestion.text}
                    </pre>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptSuggestion(suggestion);
                        setSuggestions([]);
                      }}
                      className="w-6 h-6 p-0 text-green-400 hover:text-green-300"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRejectSuggestion(suggestion.id);
                      }}
                      className="w-6 h-6 p-0 text-red-400 hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-2 text-xs text-gray-400">
            <p>Tab to accept • Esc to dismiss • ↑↓ to navigate</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InlineAICompletion; 