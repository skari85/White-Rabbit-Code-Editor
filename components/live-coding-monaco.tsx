/**
 * Live Coding Monaco Editor
 * Integrates AI directly into Monaco for real-time code generation
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAIAssistantEnhanced } from '@/hooks/use-ai-assistant-enhanced';
import { useAnalytics } from '@/hooks/use-analytics';
import { useCodeBuilder } from '@/hooks/use-code-builder';
import {
    MessageSquare,
    Send,
    Sparkles,
    X,
    Zap
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import LazyMonacoEditor from './lazy-monaco-editor';

interface LiveCodingMonacoProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  theme?: string;
  height?: string;
  className?: string;
}

interface LiveCodingState {
  isGenerating: boolean;
  currentSuggestion: string;
  isStreaming: boolean;
  naturalLanguageInput: string;
  showNaturalLanguagePanel: boolean;
}

export default function LiveCodingMonaco({
  value,
  onChange,
  language,
  theme = 'vs-dark',
  height = '100%',
  className = ''
}: LiveCodingMonacoProps) {
  const editorRef = useRef<any>(null);
  const [state, setState] = useState<LiveCodingState>({
    isGenerating: false,
    currentSuggestion: '',
    isStreaming: false,
    naturalLanguageInput: '',
    showNaturalLanguagePanel: false
  });

  const { 
    sendStreamingMessage, 
    isConfigured: aiConfigured,
    settings: aiSettings 
  } = useAIAssistantEnhanced();
  
  const { 
    files, 
    selectedFile, 
    getSelectedFileContent,
    getProjectContext 
  } = useCodeBuilder();
  
  const { trackAIInteraction } = useAnalytics();

  // Live coding: Generate code directly in Monaco
  const generateCodeInMonaco = useCallback(async (prompt: string) => {
    if (!aiConfigured || !selectedFile) return;

    setState(prev => ({ ...prev, isGenerating: true, isStreaming: true }));
    trackAIInteraction('message_sent');

    try {
      const currentCode = getSelectedFileContent();
      const projectContext = getProjectContext();
      
      // Enhanced prompt for live coding
      const enhancedPrompt = `You are a live coding assistant. Generate code directly in the ${language} file "${selectedFile}".

Current file content:
\`\`\`${language}
${currentCode}
\`\`\`

Project context:
${projectContext}

User request: ${prompt}

IMPORTANT: 
- Generate ONLY the code, no explanations or markdown
- Write code that fits naturally into the existing file
- Use proper indentation and formatting
- If it's a new function/component, place it appropriately
- Make it production-ready code

Generate the code now:`;

      let generatedCode = '';
      let isFirstChunk = true;

      // Stream the response directly into Monaco
      for await (const chunk of sendStreamingMessage(enhancedPrompt)) {
        if (chunk.content) {
          generatedCode += chunk.content;
          
          // Update Monaco editor in real-time
          if (editorRef.current) {
            const currentValue = editorRef.current.getValue();
            const newValue = isFirstChunk 
              ? currentValue + '\n' + generatedCode
              : currentValue.replace(/\n[^\n]*$/, '\n' + generatedCode);
            
            editorRef.current.setValue(newValue);
            onChange(newValue);
            isFirstChunk = false;
          }
        }
      }

      trackAIInteraction('response_received');
    } catch (error) {
      console.error('Live coding error:', error);
    } finally {
      setState(prev => ({ ...prev, isGenerating: false, isStreaming: false }));
    }
  }, [aiConfigured, selectedFile, language, getSelectedFileContent, getProjectContext, sendStreamingMessage, onChange, trackAIInteraction]);

  // Handle natural language input
  const handleNaturalLanguageSubmit = useCallback(() => {
    if (state.naturalLanguageInput.trim()) {
      generateCodeInMonaco(state.naturalLanguageInput);
      setState(prev => ({ ...prev, naturalLanguageInput: '' }));
    }
  }, [state.naturalLanguageInput, generateCodeInMonaco]);

  // Keyboard shortcuts for live coding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + L for live coding
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setState(prev => ({ ...prev, showNaturalLanguagePanel: !prev.showNaturalLanguagePanel }));
      }
      
      // Ctrl/Cmd + Enter in natural language input
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && state.showNaturalLanguagePanel) {
        e.preventDefault();
        handleNaturalLanguageSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleNaturalLanguageSubmit, state.showNaturalLanguagePanel]);

  return (
    <div className={`relative ${className}`}>
      {/* Monaco Editor */}
      <div className="relative" style={{ height }}>
        <LazyMonacoEditor
          value={value}
          onChange={onChange}
          language={language}
          theme={theme}
          height="100%"
          onEditorDidMount={(editor) => {
            editorRef.current = editor;
          }}
        />
        
        {/* Live Coding Overlay */}
        {state.isStreaming && (
          <div className="absolute top-4 right-4 z-10">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 animate-pulse">
              <Sparkles className="w-3 h-3 mr-1" />
              AI is coding...
            </Badge>
          </div>
        )}
      </div>

      {/* Natural Language Panel */}
      {state.showNaturalLanguagePanel && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <Card className="bg-gray-900 border-gray-700 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  Live Coding Assistant
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, showNaturalLanguagePanel: false }))}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <Textarea
                  placeholder="Describe what you want to code... (e.g., 'Create a React component for user profile', 'Add error handling to this function', 'Generate a utility function for date formatting')"
                  value={state.naturalLanguageInput}
                  onChange={(e) => setState(prev => ({ ...prev, naturalLanguageInput: e.target.value }))}
                  className="min-h-[60px] bg-gray-800 border-gray-600 text-white placeholder-gray-400 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleNaturalLanguageSubmit();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MessageSquare className="w-3 h-3" />
                    <span>Ctrl+Enter to generate</span>
                  </div>
                  <Button
                    onClick={handleNaturalLanguageSubmit}
                    disabled={!state.naturalLanguageInput.trim() || state.isGenerating}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {state.isGenerating ? (
                      <>
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3 mr-2" />
                        Generate Code
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Action Button */}
      {!state.showNaturalLanguagePanel && (
        <Button
          onClick={() => setState(prev => ({ ...prev, showNaturalLanguagePanel: true }))}
          className="absolute bottom-4 right-4 z-10 rounded-full w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          size="sm"
        >
          <Zap className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
