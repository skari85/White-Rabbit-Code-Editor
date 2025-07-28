"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  ChevronRight, 
  ChevronDown, 
  Zap, 
  Code2, 
  Braces,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { PersonalityMode } from '@/lib/personality-system';

export interface CodeFunction {
  id: string;
  name: string;
  type: 'function' | 'method' | 'class' | 'interface' | 'variable' | 'const';
  signature: string;
  startLine: number;
  endLine: number;
  complexity: number;
  parameters: string[];
  returnType?: string;
  isAsync: boolean;
  isExported: boolean;
  children?: CodeFunction[];
}

interface FunctionNavigatorProps {
  code: string;
  fileName: string;
  onJumpToFunction: (line: number) => void;
  onEditFunction: (func: CodeFunction) => void;
  personality: PersonalityMode;
  isVisible: boolean;
  onToggleVisibility: (visible: boolean) => void;
}

export function FunctionNavigator({
  code,
  fileName,
  onJumpToFunction,
  onEditFunction,
  personality,
  isVisible,
  onToggleVisibility
}: FunctionNavigatorProps) {
  const [functions, setFunctions] = useState<CodeFunction[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [hoveredFunction, setHoveredFunction] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Parse functions from code
  useEffect(() => {
    const parsedFunctions = parseCodeFunctions(code, fileName);
    setFunctions(parsedFunctions);
    generateWaveform(parsedFunctions);
  }, [code, fileName]);

  const parseCodeFunctions = (code: string, fileName: string): CodeFunction[] => {
    const lines = code.split('\n');
    const functions: CodeFunction[] = [];
    const fileType = fileName.split('.').pop()?.toLowerCase();

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // JavaScript/TypeScript function patterns
      if (fileType === 'js' || fileType === 'ts' || fileType === 'tsx') {
        // Function declarations
        const funcMatch = trimmed.match(/^(export\s+)?(async\s+)?function\s+(\w+)\s*\(([^)]*)\)(\s*:\s*([^{]+))?\s*\{?/);
        if (funcMatch) {
          const [, isExported, isAsync, name, params, , returnType] = funcMatch;
          functions.push({
            id: `func-${index}-${name}`,
            name,
            type: 'function',
            signature: trimmed,
            startLine: index,
            endLine: findEndLine(lines, index),
            complexity: calculateComplexity(line),
            parameters: params ? params.split(',').map(p => p.trim()) : [],
            returnType: returnType?.trim(),
            isAsync: !!isAsync,
            isExported: !!isExported
          });
        }

        // Arrow functions
        const arrowMatch = trimmed.match(/^(export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s+)?\(([^)]*)\)\s*=>\s*/);
        if (arrowMatch) {
          const [, isExported, , name, isAsync, params] = arrowMatch;
          functions.push({
            id: `arrow-${index}-${name}`,
            name,
            type: 'function',
            signature: trimmed,
            startLine: index,
            endLine: findEndLine(lines, index),
            complexity: calculateComplexity(line),
            parameters: params ? params.split(',').map(p => p.trim()) : [],
            isAsync: !!isAsync,
            isExported: !!isExported
          });
        }

        // Class declarations
        const classMatch = trimmed.match(/^(export\s+)?(abstract\s+)?class\s+(\w+)/);
        if (classMatch) {
          const [, isExported, , name] = classMatch;
          functions.push({
            id: `class-${index}-${name}`,
            name,
            type: 'class',
            signature: trimmed,
            startLine: index,
            endLine: findEndLine(lines, index),
            complexity: calculateComplexity(line),
            parameters: [],
            isAsync: false,
            isExported: !!isExported
          });
        }

        // Interface declarations
        const interfaceMatch = trimmed.match(/^(export\s+)?interface\s+(\w+)/);
        if (interfaceMatch) {
          const [, isExported, name] = interfaceMatch;
          functions.push({
            id: `interface-${index}-${name}`,
            name,
            type: 'interface',
            signature: trimmed,
            startLine: index,
            endLine: findEndLine(lines, index),
            complexity: 1,
            parameters: [],
            isAsync: false,
            isExported: !!isExported
          });
        }
      }

      // Python function patterns
      if (fileType === 'py') {
        const pythonFuncMatch = trimmed.match(/^(async\s+)?def\s+(\w+)\s*\(([^)]*)\)(\s*->\s*([^:]+))?\s*:/);
        if (pythonFuncMatch) {
          const [, isAsync, name, params, , returnType] = pythonFuncMatch;
          functions.push({
            id: `py-func-${index}-${name}`,
            name,
            type: 'function',
            signature: trimmed,
            startLine: index,
            endLine: findEndLine(lines, index),
            complexity: calculateComplexity(line),
            parameters: params ? params.split(',').map(p => p.trim()) : [],
            returnType: returnType?.trim(),
            isAsync: !!isAsync,
            isExported: true // Python functions are generally accessible
          });
        }

        const pythonClassMatch = trimmed.match(/^class\s+(\w+)/);
        if (pythonClassMatch) {
          const [, name] = pythonClassMatch;
          functions.push({
            id: `py-class-${index}-${name}`,
            name,
            type: 'class',
            signature: trimmed,
            startLine: index,
            endLine: findEndLine(lines, index),
            complexity: calculateComplexity(line),
            parameters: [],
            isAsync: false,
            isExported: true
          });
        }
      }
    });

    return functions.sort((a, b) => a.startLine - b.startLine);
  };

  const findEndLine = (lines: string[], startLine: number): number => {
    let braceCount = 0;
    let inFunction = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('{')) {
        braceCount += (line.match(/\{/g) || []).length;
        inFunction = true;
      }
      if (line.includes('}')) {
        braceCount -= (line.match(/\}/g) || []).length;
      }
      
      if (inFunction && braceCount === 0) {
        return i;
      }
    }
    
    return Math.min(startLine + 10, lines.length - 1);
  };

  const calculateComplexity = (line: string): number => {
    let complexity = 1;
    
    // Add complexity for control structures
    if (line.match(/\b(if|else|while|for|switch|case|catch|try)\b/)) complexity += 1;
    if (line.match(/\b(&&|\|\|)\b/)) complexity += 1;
    if (line.match(/\?.*:/)) complexity += 1; // Ternary operator
    
    return Math.min(complexity, 5);
  };

  const generateWaveform = (functions: CodeFunction[]) => {
    const waveform: number[] = [];
    const maxLines = Math.max(...functions.map(f => f.endLine), 100);
    
    for (let i = 0; i <= maxLines; i += 5) {
      const functionsAtLine = functions.filter(f => i >= f.startLine && i <= f.endLine);
      const complexity = functionsAtLine.reduce((sum, f) => sum + f.complexity, 0);
      waveform.push(Math.min(complexity * 20, 100));
    }
    
    setWaveformData(waveform);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getTypeIcon = (type: CodeFunction['type']) => {
    switch (type) {
      case 'function': return <Code className="w-4 h-4 text-blue-400" />;
      case 'method': return <Zap className="w-4 h-4 text-green-400" />;
      case 'class': return <Braces className="w-4 h-4 text-purple-400" />;
      case 'interface': return <Code2 className="w-4 h-4 text-yellow-400" />;
      case 'variable': return <div className="w-4 h-4 rounded bg-orange-400" />;
      case 'const': return <div className="w-4 h-4 rounded bg-red-400" />;
      default: return <Code className="w-4 h-4 text-gray-400" />;
    }
  };

  const getComplexityColor = (complexity: number) => {
    if (complexity <= 2) return 'bg-green-500';
    if (complexity <= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isVisible) {
    return (
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40">
        <Button
          onClick={() => onToggleVisibility(true)}
          variant="outline"
          size="sm"
          className="bg-gray-900 border-gray-700 hover:bg-gray-800"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-gray-950 border-l border-gray-800 z-30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">
              {personality === 'hex' ? 'Function Navigator' : 'Code Explorer'}
            </h3>
          </div>
          <Button
            onClick={() => onToggleVisibility(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <EyeOff className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          <span>{functions.length} functions</span>
          <span>•</span>
          <span>{fileName}</span>
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-xs text-gray-400">
            {personality === 'hex' ? 'Complexity Map' : 'Code Waveform'}
          </span>
        </div>
        
        <div className="h-12 bg-gray-900 rounded-lg p-2 flex items-end gap-1 overflow-hidden">
          {waveformData.map((height, index) => (
            <div
              key={index}
              className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-sm transition-all duration-300 hover:from-blue-500 hover:to-blue-300"
              style={{ height: `${height}%` }}
              title={`Line ${index * 5}: Complexity ${Math.round(height / 20)}`}
            />
          ))}
        </div>
      </div>

      {/* Function List */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        {functions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No functions detected</p>
            <p className="text-xs mt-1">
              {personality === 'hex' 
                ? 'Write some code to see the structure' 
                : 'Let\'s create some magical functions! ✨'
              }
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {functions.map((func) => (
              <div
                key={func.id}
                className={`group relative transition-all duration-200 ${
                  hoveredFunction === func.id ? 'transform scale-105' : ''
                }`}
                onMouseEnter={() => setHoveredFunction(func.id)}
                onMouseLeave={() => setHoveredFunction(null)}
              >
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                    hoveredFunction === func.id
                      ? 'bg-blue-600/20 border border-blue-500/50 shadow-lg'
                      : 'hover:bg-gray-800/50'
                  }`}
                  onClick={() => onJumpToFunction(func.startLine)}
                >
                  {/* Type Icon */}
                  <div className="flex-shrink-0">
                    {getTypeIcon(func.type)}
                  </div>

                  {/* Function Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {func.name}
                      </span>
                      
                      {/* Badges */}
                      <div className="flex items-center gap-1">
                        {func.isAsync && (
                          <Badge variant="outline" className="text-xs px-1 py-0 bg-purple-600/20 border-purple-500/50">
                            async
                          </Badge>
                        )}
                        {func.isExported && (
                          <Badge variant="outline" className="text-xs px-1 py-0 bg-green-600/20 border-green-500/50">
                            export
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        Line {func.startLine + 1}
                      </span>
                      
                      {/* Complexity Indicator */}
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getComplexityColor(func.complexity)}`} />
                        <span className="text-xs text-gray-500">
                          {func.complexity}
                        </span>
                      </div>
                      
                      {/* Parameters Count */}
                      {func.parameters.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {func.parameters.length} param{func.parameters.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditFunction(func);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-blue-600/20"
                      title="Edit function"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Signature Tooltip */}
                {hoveredFunction === func.id && (
                  <div className="absolute left-full ml-2 top-0 z-50 max-w-md">
                    <Card className="bg-gray-900 border-gray-700 shadow-xl">
                      <CardContent className="p-3">
                        <div className="text-xs font-mono text-gray-300 whitespace-pre-wrap">
                          {func.signature}
                        </div>
                        
                        {func.parameters.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <div className="text-xs text-gray-400 mb-1">Parameters:</div>
                            {func.parameters.map((param, index) => (
                              <div key={index} className="text-xs font-mono text-gray-300">
                                {param}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {func.returnType && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <div className="text-xs text-gray-400">Returns:</div>
                            <div className="text-xs font-mono text-gray-300">
                              {func.returnType}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* KEX Personality Animation */}
                {personality === 'kex' && hoveredFunction === func.id && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-gray-800 p-3 bg-gray-900/50">
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          <div>
            <div className="text-gray-400">Functions</div>
            <div className="font-medium text-white">
              {functions.filter(f => f.type === 'function').length}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Classes</div>
            <div className="font-medium text-white">
              {functions.filter(f => f.type === 'class').length}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Avg Complexity</div>
            <div className="font-medium text-white">
              {functions.length > 0 
                ? (functions.reduce((sum, f) => sum + f.complexity, 0) / functions.length).toFixed(1)
                : '0'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing function navigator
export function useFunctionNavigator() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFunction, setCurrentFunction] = useState<CodeFunction | null>(null);

  const jumpToFunction = (line: number) => {
    // This would typically scroll to the line in the code editor
    console.log(`Jumping to line ${line + 1}`);
  };

  const editFunction = (func: CodeFunction) => {
    setCurrentFunction(func);
    // This would typically open an edit dialog or focus the editor
    console.log(`Editing function: ${func.name}`);
  };

  return {
    isVisible,
    setIsVisible,
    currentFunction,
    jumpToFunction,
    editFunction
  };
}
