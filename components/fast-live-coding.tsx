/**
 * Fast Live Coding System
 * Real-time AI code generation directly in Monaco editor
 * Optimized for speed and responsiveness like modern IDEs
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAIAssistantEnhanced } from '@/hooks/use-ai-assistant-enhanced';
import { useAnalytics } from '@/hooks/use-analytics';
import {
    Pause,
    Play,
    Send,
    Square,
    Zap
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import LazyMonacoEditor from './lazy-monaco-editor';

interface FastLiveCodingProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  theme?: string;
  height?: string;
  onLanguageChange?: (language: string) => void;
}

interface StreamingState {
  isStreaming: boolean;
  currentText: string;
  cursorPosition: number;
  isPaused: boolean;
}

export default function FastLiveCoding({
  value,
  onChange,
  language,
  theme = 'vs-dark',
  height = '500px',
  onLanguageChange
}: FastLiveCodingProps) {
  const { sendStreamingMessage, isStreaming } = useAIAssistantEnhanced();
  const { trackCodeGeneration, trackLiveCoding } = useAnalytics();
  
  // Streaming state for real-time code generation
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentText: '',
    cursorPosition: 0,
    isPaused: false
  });
  
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [quickCommands] = useState([
    { command: 'Create React component', icon: '⚛️', shortcut: 'Ctrl+1' },
    { command: 'Add TypeScript types', icon: '📝', shortcut: 'Ctrl+2' },
    { command: 'Generate API endpoint', icon: '🔌', shortcut: 'Ctrl+3' },
    { command: 'Add error handling', icon: '🛡️', shortcut: 'Ctrl+4' },
    { command: 'Optimize performance', icon: '⚡', shortcut: 'Ctrl+5' },
    { command: 'Add tests', icon: '🧪', shortcut: 'Ctrl+6' }
  ]);

  const monacoRef = useRef<any>(null);
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fast streaming implementation
  const startFastStreaming = useCallback(async (prompt: string) => {
    if (streamingState.isStreaming) return;

    setStreamingState(prev => ({
      ...prev,
      isStreaming: true,
      currentText: value,
      cursorPosition: value.length,
      isPaused: false
    }));

    trackLiveCoding('streaming_started', { language, promptLength: prompt.length });

    try {
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();
      
      // Start streaming with minimal latency
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          language,
          context: value,
          stream: true,
          maxTokens: 1000, // Limit for speed
          temperature: 0.7 // Balanced creativity/speed
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let buffer = '';
      let generatedCode = '';

      // Fast streaming loop
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += new TextDecoder().decode(value);
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                generatedCode += data.content;
                
                // Update Monaco editor in real-time
                setStreamingState(prev => ({
                  ...prev,
                  currentText: value + generatedCode,
                  cursorPosition: (value + generatedCode).length
                }));

                // Update the actual editor value
                onChange(value + generatedCode);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      trackLiveCoding('streaming_completed', { 
        language, 
        generatedLength: generatedCode.length,
        duration: Date.now() - Date.now()
      });

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Streaming error:', error);
        trackLiveCoding('streaming_error', { error: error.message });
      }
    } finally {
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        isPaused: false
      }));
      abortControllerRef.current = null;
    }
  }, [value, language, onChange, streamingState.isStreaming, trackLiveCoding]);

  // Handle natural language commands
  const handleNaturalLanguageCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;

    const enhancedPrompt = `Generate ${language} code for: ${command}. 
    Current code context: ${value.slice(-500)} // Last 500 chars for context
    Requirements: 
    - Generate clean, production-ready code
    - Follow ${language} best practices
    - Include proper error handling
    - Add comments for clarity
    - Make it fast and efficient`;

    await startFastStreaming(enhancedPrompt);
    setNaturalLanguageInput('');
  }, [command, language, value, startFastStreaming]);

  // Keyboard shortcuts for quick commands
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key;
        const commandIndex = parseInt(key) - 1;
        
        if (commandIndex >= 0 && commandIndex < quickCommands.length) {
          e.preventDefault();
          handleNaturalLanguageCommand(quickCommands[commandIndex].command);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [quickCommands, handleNaturalLanguageCommand]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Fast Command Bar */}
      <div className="flex items-center gap-2 p-3 bg-background border-b">
        <div className="flex items-center gap-2 flex-1">
          <Textarea
            value={naturalLanguageInput}
            onChange={(e) => setNaturalLanguageInput(e.target.value)}
            placeholder="Describe what you want to code... (e.g., 'Create a login form with validation')"
            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleNaturalLanguageCommand(naturalLanguageInput);
              }
            }}
          />
          <Button
            onClick={() => handleNaturalLanguageCommand(naturalLanguageInput)}
            disabled={!naturalLanguageInput.trim() || streamingState.isStreaming}
            size="sm"
            className="h-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Streaming Controls */}
        {streamingState.isStreaming && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setStreamingState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
              size="sm"
              variant="outline"
            >
              {streamingState.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              onClick={() => {
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                }
              }}
              size="sm"
              variant="destructive"
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Quick Commands */}
      <div className="flex items-center gap-2 p-2 bg-muted/50 border-b overflow-x-auto">
        <span className="text-sm font-medium text-muted-foreground">Quick:</span>
        {quickCommands.map((cmd, index) => (
          <Button
            key={index}
            onClick={() => handleNaturalLanguageCommand(cmd.command)}
            disabled={streamingState.isStreaming}
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
          >
            <span className="mr-1">{cmd.icon}</span>
            {cmd.command}
            <Badge variant="secondary" className="ml-1 text-xs">
              {cmd.shortcut}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 relative">
        <LazyMonacoEditor
          ref={monacoRef}
          value={streamingState.isStreaming ? streamingState.currentText : value}
          onChange={onChange}
          language={language}
          theme={theme}
          height={height}
          options={{
            fontSize: 14,
            lineNumbers: 'on',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            // Live coding optimizations
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showFunctions: true,
              showConstructors: true,
              showFields: true,
              showVariables: true,
              showClasses: true,
              showStructs: true,
              showInterfaces: true,
              showModules: true,
              showProperties: true,
              showEvents: true,
              showOperators: true,
              showUnits: true,
              showValues: true,
              showConstants: true,
              showEnums: true,
              showEnumMembers: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
              showIssues: true,
              showUsers: true,
              showWords: true,
            },
            // Fast typing optimizations
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: true,
            smoothScrolling: true,
            // Live coding features
            inlineSuggest: {
              enabled: true,
            },
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordBasedSuggestions: 'matchingDocuments',
          }}
        />
        
        {/* Streaming Indicator */}
        {streamingState.isStreaming && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">AI Coding...</span>
            </div>
            {streamingState.isPaused && (
              <Badge variant="secondary" className="text-xs">
                Paused
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 bg-muted/30 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Language: {language}</span>
          <span>Lines: {value.split('\n').length}</span>
          <span>Chars: {value.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {streamingState.isStreaming && (
            <Badge variant="default" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Live Coding
            </Badge>
          )}
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
}
