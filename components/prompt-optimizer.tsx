'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PromptOptimizer, PromptOptimization, promptTemplates } from '@/lib/prompt-optimizer';
import { 
  Wand2, 
  Copy, 
  Check, 
  ArrowRight, 
  Lightbulb, 
  Target,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface PromptOptimizerProps {
  onOptimizedPrompt: (prompt: string) => void;
  className?: string;
}

export default function PromptOptimizerComponent({ onOptimizedPrompt, className }: PromptOptimizerProps) {
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [optimization, setOptimization] = useState<PromptOptimization | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = PromptOptimizer.generatePromptSuggestions('coding');

  const handleOptimize = async () => {
    if (!originalPrompt.trim()) return;
    
    setIsOptimizing(true);
    
    // Simulate processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = PromptOptimizer.optimizePrompt(originalPrompt);
    setOptimization(result);
    setIsOptimizing(false);
  };

  const handleUseOptimized = () => {
    if (optimization) {
      onOptimizedPrompt(optimization.optimized);
    }
  };

  const handleCopyOptimized = async () => {
    if (optimization) {
      await navigator.clipboard.writeText(optimization.optimized);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUseSuggestion = (suggestion: string) => {
    setOriginalPrompt(suggestion);
    setShowSuggestions(false);
  };

  const handleUseTemplate = (templateKey: string) => {
    const template = promptTemplates[templateKey as keyof typeof promptTemplates];
    setOriginalPrompt(template);
    setSelectedTemplate(templateKey);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Excellent';
    if (confidence >= 0.6) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <Card className={`${className} border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-500" />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Prompt Optimizer
            </span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            Tips
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Template Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quick Templates:</label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(promptTemplates).map((templateKey) => (
              <Button
                key={templateKey}
                variant={selectedTemplate === templateKey ? "default" : "outline"}
                size="sm"
                onClick={() => handleUseTemplate(templateKey)}
                className="text-xs"
              >
                {templateKey.charAt(0).toUpperCase() + templateKey.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Suggestions Panel */}
        {showSuggestions && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Prompt Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUseSuggestion(suggestion)}
                  className="w-full text-left justify-start h-auto p-2 text-xs"
                >
                  <Target className="w-3 h-3 mr-2 flex-shrink-0" />
                  {suggestion}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Original Prompt Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Prompt:</label>
          <Textarea
            value={originalPrompt}
            onChange={(e) => setOriginalPrompt(e.target.value)}
            placeholder="Enter your prompt here... (e.g., 'help me create a login form')"
            className="min-h-[100px] resize-none"
          />
        </div>

        {/* Optimize Button */}
        <Button
          onClick={handleOptimize}
          disabled={!originalPrompt.trim() || isOptimizing}
          className="w-full"
        >
          {isOptimizing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Optimize Prompt
            </>
          )}
        </Button>

        {/* Optimization Results */}
        {optimization && (
          <div className="space-y-4 border-t pt-4">
            {/* Confidence Score */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Optimization Quality:</span>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getConfidenceColor(optimization.confidence)}`} />
                <Badge variant="outline">
                  {getConfidenceText(optimization.confidence)} ({Math.round(optimization.confidence * 100)}%)
                </Badge>
              </div>
            </div>

            {/* Improvements Made */}
            {optimization.improvements.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Improvements Applied:</label>
                <div className="space-y-1">
                  {optimization.improvements.map((improvement, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                      <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {improvement}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Before/After Comparison */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {/* Original */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Original:</label>
                  <div className="text-xs p-3 bg-gray-50 rounded border-l-4 border-gray-300">
                    {optimization.original}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowRight className="w-4 h-4 text-green-500" />
                </div>

                {/* Optimized */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-green-600">Optimized:</label>
                  <div className="text-xs p-3 bg-green-50 rounded border-l-4 border-green-500">
                    {optimization.optimized}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleUseOptimized}
                className="flex-1"
                size="sm"
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                Use Optimized
              </Button>
              <Button
                onClick={handleCopyOptimized}
                variant="outline"
                size="sm"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
