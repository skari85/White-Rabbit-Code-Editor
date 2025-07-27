"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeSuggestion, PersonalityMode, personalitySystem } from '@/lib/personality-system';
import { Lightbulb, Zap, RefreshCw, ArrowUpRight, Bug, Sparkles, X } from 'lucide-react';

interface ContextSuggestionsProps {
  code: string;
  fileName: string;
  cursorPosition: { line: number; column: number };
  onApplySuggestion: (suggestion: CodeSuggestion) => void;
  personality: PersonalityMode;
}

export function ContextSuggestions({ 
  code, 
  fileName, 
  cursorPosition, 
  onApplySuggestion,
  personality 
}: ContextSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // Generate suggestions based on current code and cursor position
    const newSuggestions = personalitySystem.generateSuggestions(code, fileName, cursorPosition);
    setSuggestions(newSuggestions);
  }, [code, fileName, cursorPosition, personality]);

  const getSuggestionIcon = (type: CodeSuggestion['type']) => {
    switch (type) {
      case 'optimization': return <Zap className="w-3 h-3" />;
      case 'refactor': return <RefreshCw className="w-3 h-3" />;
      case 'extract': return <ArrowUpRight className="w-3 h-3" />;
      case 'fix': return <Bug className="w-3 h-3" />;
      case 'enhance': return <Sparkles className="w-3 h-3" />;
      default: return <Lightbulb className="w-3 h-3" />;
    }
  };

  const getSuggestionColor = (suggestion: CodeSuggestion) => {
    if (suggestion.personality === 'hex') {
      return 'border-purple-500 bg-purple-50 text-purple-900';
    } else {
      return 'border-cyan-500 bg-cyan-50 text-cyan-900';
    }
  };

  const getPersonalityStyle = (suggestion: CodeSuggestion) => {
    if (suggestion.personality === 'hex') {
      return {
        background: 'linear-gradient(135deg, rgba(108, 47, 255, 0.1) 0%, rgba(76, 27, 255, 0.1) 100%)',
        borderColor: '#6c2fff'
      };
    } else {
      return {
        background: 'linear-gradient(135deg, rgba(0, 255, 225, 0.1) 0%, rgba(0, 212, 170, 0.1) 100%)',
        borderColor: '#00ffe1'
      };
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSuggestions(!showSuggestions)}
        className="mb-2 bg-white shadow-lg border-2"
        style={{
          borderColor: personality === 'hex' ? '#6c2fff' : '#00ffe1',
          color: personality === 'hex' ? '#6c2fff' : '#00ffe1'
        }}
      >
        <Lightbulb className="w-4 h-4 mr-1" />
        {suggestions.length} hints
      </Button>

      {/* Suggestions Panel */}
      {showSuggestions && (
        <div className="bg-white rounded-lg shadow-xl border-2 p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: personality === 'hex' ? '#6c2fff' : '#00ffe1',
                  color: personality === 'hex' ? 'white' : 'black'
                }}
              >
                {personality === 'hex' ? '🔮' : '⚡'}
              </div>
              <h3 className="font-semibold text-sm">
                {personality === 'hex' ? 'HEX' : 'KEX'} Suggestions
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all"
                style={getPersonalityStyle(suggestion)}
                onClick={() => onApplySuggestion(suggestion)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {suggestion.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{
                          borderColor: suggestion.personality === 'hex' ? '#6c2fff' : '#00ffe1',
                          color: suggestion.personality === 'hex' ? '#6c2fff' : '#00ffe1'
                        }}
                      >
                        Line {suggestion.line + 1}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500 text-center">
              {personality === 'hex' 
                ? 'Clean, precise suggestions from HEX' 
                : 'Wild, creative ideas from KEX'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Line-attached suggestion hints
interface LineSuggestionProps {
  lineNumber: number;
  suggestions: CodeSuggestion[];
  onApplySuggestion: (suggestion: CodeSuggestion) => void;
  personality: PersonalityMode;
}

export function LineSuggestion({ 
  lineNumber, 
  suggestions, 
  onApplySuggestion,
  personality 
}: LineSuggestionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const lineSuggestions = suggestions.filter(s => s.line === lineNumber);

  if (lineSuggestions.length === 0) {
    return null;
  }

  const getSuggestionIcon = (type: CodeSuggestion['type']) => {
    switch (type) {
      case 'optimization': return <Zap className="w-2 h-2" />;
      case 'refactor': return <RefreshCw className="w-2 h-2" />;
      case 'extract': return <ArrowUpRight className="w-2 h-2" />;
      case 'fix': return <Bug className="w-2 h-2" />;
      case 'enhance': return <Sparkles className="w-2 h-2" />;
      default: return <Lightbulb className="w-2 h-2" />;
    }
  };

  return (
    <div 
      className="absolute left-0 flex items-center"
      style={{ top: `${lineNumber * 24}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Line number indicator */}
      <div 
        className="w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
        style={{
          background: personality === 'hex' ? '#6c2fff' : '#00ffe1',
          color: personality === 'hex' ? 'white' : 'black'
        }}
      >
        <Lightbulb className="w-2 h-2" />
      </div>

      {/* Hover tooltip */}
      {isHovered && (
        <div 
          className="absolute left-6 bg-white border-2 rounded-lg shadow-lg p-2 w-64 z-50"
          style={{
            borderColor: personality === 'hex' ? '#6c2fff' : '#00ffe1'
          }}
        >
          {lineSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-2 rounded cursor-pointer hover:bg-gray-50"
              onClick={() => onApplySuggestion(suggestion)}
            >
              <div className="flex items-center gap-2 mb-1">
                {getSuggestionIcon(suggestion.type)}
                <span className="font-medium text-xs">{suggestion.title}</span>
              </div>
              <p className="text-xs text-gray-600">{suggestion.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
