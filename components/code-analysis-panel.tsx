'use client';

import React, { useState } from 'react';
import { AlertTriangle, Info, Lightbulb, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CodeQualityIssue } from '@/lib/ai-context-analyzer';

interface CodeAnalysisPanelProps {
  issues: CodeQualityIssue[];
  onIssueClick?: (issue: CodeQualityIssue) => void;
  onFixIssue?: (issue: CodeQualityIssue) => void;
  className?: string;
}

export default function CodeAnalysisPanel({
  issues,
  onIssueClick,
  onFixIssue,
  className = ''
}: CodeAnalysisPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['errors']));
  const [dismissedIssues, setDismissedIssues] = useState<Set<string>>(new Set());

  const visibleIssues = issues.filter(issue => 
    !dismissedIssues.has(`${issue.file}-${issue.line}-${issue.rule}`)
  );

  const groupedIssues = visibleIssues.reduce((groups, issue) => {
    if (!groups[issue.type]) {
      groups[issue.type] = [];
    }
    groups[issue.type].push(issue);
    return groups;
  }, {} as Record<string, CodeQualityIssue[]>);

  const getIssueIcon = (type: CodeQualityIssue['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'suggestion':
        return <Lightbulb className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: CodeQualityIssue['severity']) => {
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

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const dismissIssue = (issue: CodeQualityIssue) => {
    const issueKey = `${issue.file}-${issue.line}-${issue.rule}`;
    setDismissedIssues(prev => new Set([...prev, issueKey]));
  };

  const handleIssueClick = (issue: CodeQualityIssue) => {
    if (onIssueClick) {
      onIssueClick(issue);
    }
  };

  const handleFixIssue = (issue: CodeQualityIssue) => {
    if (onFixIssue) {
      onFixIssue(issue);
    }
  };

  if (visibleIssues.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <p className="text-sm">No code issues found!</p>
          <p className="text-xs text-gray-400 mt-1">Your code looks clean.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg ${className}`}>
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          Code Analysis
          <Badge variant="secondary" className="text-xs">
            {visibleIssues.length} issues
          </Badge>
        </h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {Object.entries(groupedIssues).map(([type, typeIssues]) => (
          <div key={type} className="border-b last:border-b-0">
            <button
              onClick={() => toggleSection(type)}
              className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {getIssueIcon(type as CodeQualityIssue['type'])}
                <span className="font-medium text-sm capitalize">{type}s</span>
                <Badge variant="outline" className="text-xs">
                  {typeIssues.length}
                </Badge>
              </div>
              {expandedSections.has(type) ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expandedSections.has(type) && (
              <div className="pb-2">
                {typeIssues.map((issue, index) => (
                  <div
                    key={`${issue.file}-${issue.line}-${issue.rule}-${index}`}
                    className="mx-3 mb-2 p-3 bg-gray-50 rounded border-l-4 border-l-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getSeverityColor(issue.severity)}`}
                          >
                            {issue.severity}
                          </Badge>
                          <span className="text-xs text-gray-500 font-mono">
                            {issue.rule}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-800 mb-1">{issue.message}</p>
                        
                        <button
                          onClick={() => handleIssueClick(issue)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {issue.file}:{issue.line}
                          {issue.column && `:${issue.column}`}
                        </button>
                        
                        {issue.suggestion && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                            <strong>Suggestion:</strong> {issue.suggestion}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {issue.fixable && onFixIssue && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFixIssue(issue)}
                            className="text-xs h-6 px-2"
                          >
                            Fix
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissIssue(issue)}
                          className="text-xs h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {dismissedIssues.size > 0 && (
        <div className="p-3 border-t bg-gray-50">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDismissedIssues(new Set())}
            className="text-xs"
          >
            Show {dismissedIssues.size} dismissed issues
          </Button>
        </div>
      )}
    </div>
  );
}
