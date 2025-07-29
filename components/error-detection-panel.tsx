'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  ChevronUp, 
  ChevronDown,
  FileText,
  Lightbulb,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LintError {
  id: string;
  fileId: string;
  fileName: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  code?: string;
  suggestion?: string;
  fix?: () => void;
}

export interface ErrorDetectionPanelProps {
  files: Record<string, { name: string; content: string; language?: string }>;
  onFileSelect?: (fileId: string, line?: number, column?: number) => void;
  onFixApply?: (fileId: string, line: number, column: number, oldText: string, newText: string) => void;
  onSendToChat?: (message: string) => void;
  className?: string;
}

const ErrorDetectionPanel: React.FC<ErrorDetectionPanelProps> = ({
  files,
  onFileSelect,
  onFixApply,
  onSendToChat,
  className
}) => {
  const [errors, setErrors] = useState<LintError[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze files for errors
  const analyzeFiles = useCallback(async () => {
    setIsAnalyzing(true);
    const newErrors: LintError[] = [];

    Object.entries(files).forEach(([fileId, file]) => {
      const lines = file.content.split('\n');
      const language = file.language || 'javascript';

      // Basic syntax checking
      lines.forEach((line, lineIndex) => {
        const lineNumber = lineIndex + 1;
        const trimmedLine = line.trim();

        // Check for common issues
        if (language === 'javascript' || language === 'typescript') {
          // Check for missing semicolons
          if (trimmedLine && !trimmedLine.endsWith(';') && !trimmedLine.endsWith('{') && 
              !trimmedLine.endsWith('}') && !trimmedLine.endsWith('(') && !trimmedLine.endsWith(')') &&
              !trimmedLine.includes('function') && !trimmedLine.includes('if') && !trimmedLine.includes('for') &&
              !trimmedLine.includes('while') && !trimmedLine.includes('return') && !trimmedLine.includes('const') &&
              !trimmedLine.includes('let') && !trimmedLine.includes('var') && !trimmedLine.includes('import') &&
              !trimmedLine.includes('export') && !trimmedLine.includes('class') && !trimmedLine.includes('try') &&
              !trimmedLine.includes('catch') && !trimmedLine.includes('finally') && !trimmedLine.includes('switch') &&
              !trimmedLine.includes('case') && !trimmedLine.includes('default') && !trimmedLine.includes('break') &&
              !trimmedLine.includes('continue') && !trimmedLine.includes('throw') && !trimmedLine.includes('debugger')) {
            newErrors.push({
              id: `${fileId}-${lineNumber}-missing-semicolon`,
              fileId,
              fileName: file.name,
              line: lineNumber,
              column: line.length + 1,
              severity: 'warning',
              message: 'Missing semicolon',
              code: trimmedLine,
              suggestion: 'Add semicolon at the end of the line',
              fix: () => onFixApply?.(fileId, lineNumber, line.length + 1, '', ';')
            });
          }

          // Check for unused variables (basic check)
          const varMatch = trimmedLine.match(/(?:const|let|var)\s+(\w+)/);
          if (varMatch) {
            const varName = varMatch[1];
            const isUsed = file.content.includes(varName) && 
                          file.content.split(varName).length > 2; // More than just declaration
            if (!isUsed) {
              newErrors.push({
                id: `${fileId}-${lineNumber}-unused-variable`,
                fileId,
                fileName: file.name,
                line: lineNumber,
                column: trimmedLine.indexOf(varName) + 1,
                severity: 'warning',
                message: `Unused variable '${varName}'`,
                code: trimmedLine,
                suggestion: 'Remove unused variable or use it in your code'
              });
            }
          }

          // Check for console.log statements
          if (trimmedLine.includes('console.log')) {
            newErrors.push({
              id: `${fileId}-${lineNumber}-console-log`,
              fileId,
              fileName: file.name,
              line: lineNumber,
              column: trimmedLine.indexOf('console.log') + 1,
              severity: 'info',
              message: 'Console.log statement found',
              code: trimmedLine,
              suggestion: 'Consider removing console.log for production code'
            });
          }
        }

        // HTML specific checks
        if (language === 'html') {
          // Check for unclosed tags
          const openTags = (trimmedLine.match(/<[^/][^>]*>/g) || []).length;
          const closeTags = (trimmedLine.match(/<\/[^>]*>/g) || []).length;
          if (openTags > closeTags) {
            newErrors.push({
              id: `${fileId}-${lineNumber}-unclosed-tag`,
              fileId,
              fileName: file.name,
              line: lineNumber,
              column: 1,
              severity: 'error',
              message: 'Unclosed HTML tag',
              code: trimmedLine,
              suggestion: 'Close the HTML tag properly'
            });
          }
        }

        // CSS specific checks
        if (language === 'css') {
          // Check for missing closing braces
          const openBraces = (trimmedLine.match(/\{/g) || []).length;
          const closeBraces = (trimmedLine.match(/\}/g) || []).length;
          if (openBraces > closeBraces) {
            newErrors.push({
              id: `${fileId}-${lineNumber}-unclosed-brace`,
              fileId,
              fileName: file.name,
              line: lineNumber,
              column: 1,
              severity: 'error',
              message: 'Unclosed CSS rule',
              code: trimmedLine,
              suggestion: 'Add closing brace to complete the CSS rule'
            });
          }
        }
      });

      // Check for file-level issues
      if (language === 'javascript' || language === 'typescript') {
        // Check for syntax errors using basic regex
        try {
          // Basic syntax validation
          if (file.content.includes('function') && !file.content.includes('{')) {
            newErrors.push({
              id: `${fileId}-syntax-error`,
              fileId,
              fileName: file.name,
              line: 1,
              column: 1,
              severity: 'error',
              message: 'Potential syntax error in function declaration',
              suggestion: 'Check function syntax and ensure proper braces'
            });
          }
        } catch (error) {
          newErrors.push({
            id: `${fileId}-syntax-error`,
            fileId,
            fileName: file.name,
            line: 1,
            column: 1,
            severity: 'error',
            message: 'Syntax error detected',
            suggestion: 'Check for missing brackets, semicolons, or other syntax issues'
          });
        }
      }
    });

    setErrors(newErrors);
    setIsAnalyzing(false);
  }, [files, onFixApply]);

  // Auto-analyze when files change
  useEffect(() => {
    const timeoutId = setTimeout(analyzeFiles, 1000);
    return () => clearTimeout(timeoutId);
  }, [analyzeFiles]);

  // Navigate to error location
  const navigateToError = useCallback((error: LintError) => {
    setSelectedError(error.id);
    onFileSelect?.(error.fileId, error.line, error.column);
  }, [onFileSelect]);

  // Apply fix
  const applyFix = useCallback((error: LintError) => {
    if (error.fix) {
      error.fix();
      // Remove the error from the list
      setErrors(prev => prev.filter(e => e.id !== error.id));
    }
  }, []);

  // Get error count by severity
  const errorCounts = {
    error: errors.filter(e => e.severity === 'error').length,
    warning: errors.filter(e => e.severity === 'warning').length,
    info: errors.filter(e => e.severity === 'info').length
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info': return <Info className="w-4 h-4 text-blue-400" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-400 bg-red-400/10';
      case 'warning': return 'text-yellow-400 bg-yellow-400/10';
      case 'info': return 'text-blue-400 bg-blue-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {errorCounts.error + errorCounts.warning + errorCounts.info > 0 ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
            Error Detection
            {(errorCounts.error + errorCounts.warning + errorCounts.info) > 0 && (
              <Badge variant="secondary" className="ml-2">
                {errorCounts.error + errorCounts.warning + errorCounts.info}
              </Badge>
            )}
          </CardTitle>
          {onSendToChat && errors.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const summary = `Found ${errors.length} issues in the codebase:\n${errors.map(e => `- ${e.severity.toUpperCase()}: ${e.message} in ${e.fileName}:${e.line}:${e.column}`).join('\n')}`;
                onSendToChat(summary);
              }}
              className="text-xs"
            >
              Send to Chat
            </Button>
          )}
          <div className="flex items-center gap-2">
            {isAnalyzing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Error Summary */}
        {(errorCounts.error + errorCounts.warning + errorCounts.info) > 0 && (
          <div className="flex gap-2 text-xs">
            {errorCounts.error > 0 && (
              <Badge variant="destructive" className="text-xs">
                {errorCounts.error} Errors
              </Badge>
            )}
            {errorCounts.warning > 0 && (
              <Badge variant="secondary" className="text-xs bg-yellow-600/20 text-yellow-400">
                {errorCounts.warning} Warnings
              </Badge>
            )}
            {errorCounts.info > 0 && (
              <Badge variant="secondary" className="text-xs bg-blue-600/20 text-blue-400">
                {errorCounts.info} Info
              </Badge>
            )}
          </div>
        )}

        {/* Errors List */}
        {isExpanded && errors.length > 0 && (
          <div className="border-t border-gray-800 pt-3">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {errors.map((error) => (
                  <div
                    key={error.id}
                    className={cn(
                      'p-3 rounded cursor-pointer hover:bg-gray-800 transition-colors border',
                      selectedError === error.id ? 'border-blue-500 bg-blue-600/20' : 'border-gray-700',
                      getSeverityColor(error.severity)
                    )}
                    onClick={() => navigateToError(error)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        {getSeverityIcon(error.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-3 h-3 text-gray-400" />
                            <span className="font-mono text-xs text-gray-400">
                              {error.fileName}:{error.line}:{error.column}
                            </span>
                          </div>
                          <p className="text-sm font-medium mt-1">{error.message}</p>
                          {error.code && (
                            <p className="text-xs font-mono mt-1 text-gray-300 bg-gray-800 p-1 rounded">
                              {error.code}
                            </p>
                          )}
                          {error.suggestion && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                              <Lightbulb className="w-3 h-3" />
                              <span>{error.suggestion}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {error.fix && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyFix(error);
                          }}
                          className="text-xs"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Fix
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* No Errors */}
        {isExpanded && errors.length === 0 && (
          <div className="text-center py-4 text-gray-400">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="text-sm">No issues found</p>
            <p className="text-xs mt-1">Your code looks good!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ErrorDetectionPanel; 