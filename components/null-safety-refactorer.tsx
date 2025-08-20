'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  Shield, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Play,
  Undo,
  Settings,
  Info,
  Lightbulb,
  Target,
  TrendingUp,
  FileText,
  Code
} from 'lucide-react';
import { NullSafetyService, NullSafetyIssue, NullSafetyRefactoring } from '@/lib/null-safety-service';
import { toast } from 'sonner';

interface NullSafetyRefactorerProps {
  code: string;
  file: string;
  onCodeChange: (newCode: string) => void;
  className?: string;
}

export default function NullSafetyRefactorer({
  code,
  file,
  onCodeChange,
  className = ''
}: NullSafetyRefactorerProps) {
  const [issues, setIssues] = useState<NullSafetyIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<NullSafetyIssue | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCode, setPreviewCode] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);
  const [showIgnored, setShowIgnored] = useState(false);
  const [ignoredIssues, setIgnoredIssues] = useState<Set<string>>(new Set());

  // Analyze code for null-safety issues
  const analyzeCode = useCallback(async () => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const detectedIssues = NullSafetyService.detectIssues(code, file);
      setIssues(detectedIssues);
    } catch (error) {
      console.error('Error analyzing code:', error);
      toast.error('Failed to analyze code for null-safety issues');
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, file]);

  // Auto-fix issues if enabled
  useEffect(() => {
    if (autoFixEnabled && issues.length > 0) {
      const highSeverityIssues = issues.filter(issue => 
        issue.severity === 'high' && !ignoredIssues.has(issue.id)
      );
      
      if (highSeverityIssues.length > 0) {
        const refactoring = NullSafetyService.createRefactoring(highSeverityIssues[0]);
        const fixedCode = NullSafetyService.applyRefactoring(code, refactoring);
        onCodeChange(fixedCode);
        toast.success(`Auto-fixed ${highSeverityIssues.length} high-severity null-safety issue(s)`);
      }
    }
  }, [autoFixEnabled, issues, ignoredIssues, code, onCodeChange]);

  // Initial analysis
  useEffect(() => {
    analyzeCode();
  }, [analyzeCode]);

  // Get filtered issues
  const visibleIssues = useMemo(() => {
    return issues.filter(issue => 
      !ignoredIssues.has(issue.id) || showIgnored
    );
  }, [issues, ignoredIssues, showIgnored]);

  // Get summary statistics
  const summary = useMemo(() => {
    return NullSafetyService.getSummary(visibleIssues);
  }, [visibleIssues]);

  // Handle issue selection
  const handleIssueSelect = useCallback((issue: NullSafetyIssue) => {
    setSelectedIssue(issue);
    setShowPreview(false);
  }, []);

  // Handle preview
  const handlePreview = useCallback(() => {
    if (!selectedIssue) return;
    
    const refactoring = NullSafetyService.createRefactoring(selectedIssue);
    const preview = NullSafetyService.applyRefactoring(code, refactoring);
    setPreviewCode(preview);
    setShowPreview(true);
  }, [selectedIssue, code]);

  // Handle apply fix
  const handleApplyFix = useCallback(() => {
    if (!selectedIssue) return;
    
    const refactoring = NullSafetyService.createRefactoring(selectedIssue);
    const fixedCode = NullSafetyService.applyRefactoring(code, refactoring);
    onCodeChange(fixedCode);
    
    // Remove the fixed issue from the list
    setIssues(prev => prev.filter(issue => issue.id !== selectedIssue.id));
    setSelectedIssue(null);
    setShowPreview(false);
    
    toast.success('Null-safety issue fixed!');
  }, [selectedIssue, code, onCodeChange]);

  // Handle ignore issue
  const handleIgnoreIssue = useCallback((issue: NullSafetyIssue) => {
    setIgnoredIssues(prev => new Set([...prev, issue.id]));
    toast.info(`Ignored ${issue.type} issue`);
  }, []);

  // Handle unignore issue
  const handleUnignoreIssue = useCallback((issue: NullSafetyIssue) => {
    setIgnoredIssues(prev => {
      const newSet = new Set(prev);
      newSet.delete(issue.id);
      return newSet;
    });
    toast.info(`Unignored ${issue.type} issue`);
  }, []);

  // Get issue icon
  const getIssueIcon = (type: NullSafetyIssue['type']) => {
    switch (type) {
      case 'property-chain':
        return <Code className="w-4 h-4 text-blue-500" />;
      case 'method-call':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'array-access':
        return <Target className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: NullSafetyIssue['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (visibleIssues.length === 0 && !showIgnored) {
    return (
      <div className={`p-4 ${className}`}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-green-500" />
              Null-Safety Guardian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-sm font-medium">No null-safety issues found!</p>
              <p className="text-xs text-gray-400 mt-1">Your code is protected against runtime errors.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-blue-500" />
              Null-Safety Guardian
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeCode}
                disabled={isAnalyzing}
              >
                <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analyzing...' : 'Refresh'}
              </Button>
              <Button
                variant={autoFixEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoFixEnabled(!autoFixEnabled)}
              >
                <Zap className="w-4 h-4" />
                Auto-Fix
              </Button>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">
                {summary.bySeverity.high} High
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {summary.bySeverity.medium} Medium
              </Badge>
              <Badge variant="outline" className="text-xs">
                {summary.bySeverity.low} Low
              </Badge>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="text-sm text-gray-600">
              Total: {summary.total} issues
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="issues" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="issues">Issues ({visibleIssues.length})</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="mt-4">
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {visibleIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedIssue?.id === issue.id
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleIssueSelect(issue)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {issue.message}
                              </p>
                              <Badge className={`text-xs ${getSeverityColor(issue.severity)}`}>
                                {issue.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {issue.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <FileText className="w-3 h-3" />
                              Line {issue.line}:{issue.column}
                              <span className="text-gray-400">→</span>
                              <code className="bg-gray-100 px-1 py-0.5 rounded">
                                {issue.code}
                              </code>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {ignoredIssues.has(issue.id) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnignoreIssue(issue);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleIgnoreIssue(issue);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <EyeOff className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {selectedIssue && (
                <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-900">Selected Issue</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreview}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleApplyFix}
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        Apply Fix
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-blue-800 mb-2">
                      <strong>Current:</strong> <code className="bg-blue-100 px-1 py-0.5 rounded">{selectedIssue.code}</code>
                    </p>
                    <p className="text-blue-800">
                      <strong>Suggested:</strong> <code className="bg-green-100 px-1 py-0.5 rounded">{selectedIssue.suggestedFix}</code>
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              {showPreview && previewCode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Preview of Changes</h4>
                    <Button
                      size="sm"
                      onClick={handleApplyFix}
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Apply Changes
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Before</h5>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
                        <code>{code}</code>
                      </pre>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">After</h5>
                      <pre className="bg-green-100 p-3 rounded text-xs overflow-auto max-h-48">
                        <code>{previewCode}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Select an issue and click Preview to see changes</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
