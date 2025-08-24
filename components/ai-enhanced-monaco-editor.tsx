'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Maximize2, Minimize2, Zap } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { AICompletionService, CompletionContext } from '@/lib/ai-completion-service';
import { useAIAssistantEnhanced } from '@/hooks/use-ai-assistant-enhanced';
import { useCodeBuilder } from '@/hooks/use-code-builder';
import '../styles/monaco-editor-fixes.css';

interface AIEnhancedMonacoEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  theme?: string;
  height?: string | number;
  width?: string | number;
  readOnly?: boolean;
  enableAICompletions?: boolean;
}

export default function AIEnhancedMonacoEditor({
  value,
  onChange,
  language = 'javascript',
  theme = 'vs-dark',
  height = '400px',
  width = '100%',
  readOnly = false,
  enableAICompletions = true
}: AIEnhancedMonacoEditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const completionServiceRef = useRef<AICompletionService | null>(null);
  
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiCompletionsEnabled, setAICompletionsEnabled] = useState(enableAICompletions);
  const [completionStats, setCompletionStats] = useState({ total: 0, aiGenerated: 0 });

  // Hooks
  const { settings: aiSettings, isConfigured: aiConfigured } = useAIAssistantEnhanced();
  const { 
    files, 
    selectedFile, 
    getProjectContext, 
    getRelatedFiles, 
    extractFileSymbols 
  } = useCodeBuilder();

  // Initialize AI completion service
  useEffect(() => {
    if (aiConfigured && aiSettings) {
      completionServiceRef.current = new AICompletionService(aiSettings);
    } else {
      completionServiceRef.current = null;
    }
  }, [aiSettings, aiConfigured]);

  // Update completion service when settings change
  useEffect(() => {
    if (completionServiceRef.current && aiSettings) {
      completionServiceRef.current.updateSettings(aiSettings);
    }
  }, [aiSettings]);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Enhance AI capabilities with advanced AI models
    if (aiCompletionsEnabled && completionServiceRef.current) {
      // Register AI-powered completion provider with advanced AI models
      const disposable = monaco.languages.registerCompletionItemProvider(language, {
        triggerCharacters: ['.', '(', '<', '"', "'", '/', ' '],
        
        provideCompletionItems: async (model: any, position: any, context: any) => {
          if (!completionServiceRef.current || !selectedFile) {
            return { suggestions: [] };
          }

          try {
            // Build completion context
            const completionContext: CompletionContext = {
              currentFile: selectedFile,
              currentCode: model.getValue(),
              cursorPosition: {
                lineNumber: position.lineNumber,
                column: position.column
              },
              projectFiles: getRelatedFiles(selectedFile, 3).map(file => ({
                name: file.name,
                content: file.content,
                type: file.type
              })),
              language,
              triggerCharacter: context.triggerCharacter
            };

            // Get enhanced AI completions with advanced features
            const aiCompletions = await completionServiceRef.current.getEnhancedCompletions(completionContext);
            const monacoCompletions = completionServiceRef.current.toMonacoCompletions(aiCompletions, monaco);

            // Update stats
            setCompletionStats(prev => ({
              total: prev.total + monacoCompletions.length,
              aiGenerated: prev.aiGenerated + aiCompletions.length
            }));

            return {
              suggestions: monacoCompletions
            };
          } catch (error) {
            console.warn('AI completion provider error:', error);
            return { suggestions: [] };
          }
        }
      });

      // Register signature help provider
      const signatureDisposable = monaco.languages.registerSignatureHelpProvider(language, {
        signatureHelpTriggerCharacters: ['(', ','],

        provideSignatureHelp: async (model: any, position: any) => {
          if (!completionServiceRef.current || !selectedFile) {
            return { signatures: [], activeSignature: 0, activeParameter: 0 };
          }

          try {
            const completionContext: CompletionContext = {
              currentFile: selectedFile,
              currentCode: model.getValue(),
              cursorPosition: {
                lineNumber: position.lineNumber,
                column: position.column
              },
              projectFiles: getRelatedFiles(selectedFile, 3).map(file => ({
                name: file.name,
                content: file.content,
                type: file.type
              })),
              language
            };

            const signatures = await completionServiceRef.current.getMethodSignatures(completionContext);

            return {
              signatures: signatures.map(sig => ({
                label: sig.label,
                documentation: sig.documentation,
                parameters: sig.parameters || []
              })),
              activeSignature: 0,
              activeParameter: 0
            };
          } catch (error) {
            console.warn('Signature help provider error:', error);
            return { signatures: [], activeSignature: 0, activeParameter: 0 };
          }
        }
      });

      // Register hover provider
      const hoverDisposable = monaco.languages.registerHoverProvider(language, {
        provideHover: async (model: any, position: any) => {
          if (!completionServiceRef.current || !selectedFile) {
            return null;
          }

          try {
            const word = model.getWordAtPosition(position);
            if (!word) return null;

            const completionContext: CompletionContext = {
              currentFile: selectedFile,
              currentCode: model.getValue(),
              cursorPosition: {
                lineNumber: position.lineNumber,
                column: position.column
              },
              projectFiles: getRelatedFiles(selectedFile, 3).map(file => ({
                name: file.name,
                content: file.content,
                type: file.type
              })),
              language
            };

            // Get cross-file references for hover info
            const crossFileRefs = await completionServiceRef.current.getCrossFileReferences(completionContext);
            const matchingRef = crossFileRefs.find(ref => ref.label === word.word);

            if (matchingRef) {
              return {
                range: new monaco.Range(
                  position.lineNumber,
                  word.startColumn,
                  position.lineNumber,
                  word.endColumn
                ),
                contents: [
                  { value: `**${matchingRef.label}**` },
                  { value: matchingRef.documentation || matchingRef.detail || 'No documentation available' }
                ]
              };
            }

            return null;
          } catch (error) {
            console.warn('Hover provider error:', error);
            return null;
          }
        }
      });

      // Cleanup on unmount
      return () => {
        disposable.dispose();
        signatureDisposable.dispose();
        hoverDisposable.dispose();
      };
    }
  }, [aiCompletionsEnabled, completionServiceRef, language, selectedFile]);

  const toggleTheme = () => {
    setCurrentTheme(currentTheme === 'vs-dark' ? 'light' : 'vs-dark');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleAICompletions = () => {
    setAICompletionsEnabled(!aiCompletionsEnabled);
    if (completionServiceRef.current) {
      completionServiceRef.current.clearCache();
    }
  };

  const getLanguageFromFileName = (fileName: string): string => {
    if (!fileName) return language;
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin'
    };
    
    return languageMap[ext || ''] || language;
  };

  const editorLanguage = selectedFile ? getLanguageFromFileName(selectedFile) : language;
  const isDark = currentTheme === 'vs-dark';

  const editorOptions = {
    // Core editor options
    fontSize: 14,
    fontFamily: '"Fira Code", "JetBrains Mono", "Monaco", "Menlo", "Ubuntu Mono", monospace',
    fontLigatures: true,
    lineHeight: 1.6,
    readOnly,

    // Line numbers and folding
    lineNumbers: 'on' as const,
    lineNumbersMinChars: 3,
    glyphMargin: true,
    folding: true,
    foldingHighlight: true,
    foldingStrategy: 'indentation' as const,
    showFoldingControls: 'always' as const,

    // Minimap
    minimap: {
      enabled: false,
    },

    // Scrolling
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    mouseWheelZoom: true,

    // Layout
    automaticLayout: true,
    wordWrap: 'on' as const,
    wordWrapColumn: 120,
    wrappingIndent: 'indent' as const,

    // Selection and cursor
    selectOnLineNumbers: true,
    selectionHighlight: true,
    occurrencesHighlight: 'singleFile' as const,
    cursorBlinking: 'smooth' as const,
    cursorSmoothCaretAnimation: 'on' as const,
    cursorWidth: 2,

    // Indentation
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: true,
    trimAutoWhitespace: true,

    // Bracket matching
    matchBrackets: 'always' as const,
    bracketPairColorization: {
      enabled: true,
    },
    guides: {
      bracketPairs: true,
      bracketPairsHorizontal: true,
      highlightActiveBracketPair: true,
      indentation: true,
      highlightActiveIndentation: true,
    },

    // Enhanced IntelliSense and suggestions
    quickSuggestions: {
      other: aiCompletionsEnabled,
      comments: aiCompletionsEnabled,
      strings: editorLanguage === 'html' || editorLanguage === 'css',
    },
    quickSuggestionsDelay: aiCompletionsEnabled ? 100 : 300,
    suggestOnTriggerCharacters: aiCompletionsEnabled,
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: 'on' as const,
    tabCompletion: 'on' as const,
    wordBasedSuggestions: 'matchingDocuments' as const,
    suggestSelection: 'first' as const,
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
      filterGraceful: true,
      snippetsPreventQuickSuggestions: false,
      localityBonus: true,
      shareSuggestSelections: true,
      showInlineDetails: true,
      showStatusBar: true
    },

    // Hover and parameter hints
    hover: {
      enabled: true,
      delay: 300,
      sticky: true,
    },
    parameterHints: {
      enabled: true,
      cycle: true,
    },

    // Find and replace
    find: {
      addExtraSpaceOnTop: false,
      autoFindInSelection: 'never' as const,
      seedSearchStringFromSelection: 'always' as const,
    },

    // Context menu
    contextmenu: true,
    
    // Performance
    renderWhitespace: 'selection' as const,
    renderControlCharacters: false,
    renderIndentGuides: true,
    renderLineHighlight: 'line' as const,
    renderLineHighlightOnlyWhenFocus: false,

    // Accessibility
    accessibilitySupport: 'auto' as const,
    ariaLabel: 'AI-Enhanced Code Editor',
  };

  return (
    <div 
      className={`relative border border-gray-300 rounded-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''
      }`}
      style={{
        height: isFullscreen ? '100vh' : height,
        width: isFullscreen ? '100vw' : width
      }}
    >
      {/* Editor Toolbar */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${
            isDark ? 'text-gray-200' : 'text-gray-700'
          }`}>
            {selectedFile || 'Code Editor'}
          </span>
          {aiCompletionsEnabled && aiConfigured && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              <Zap className="w-3 h-3" />
              AI Enhanced
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* AI Completions Toggle */}
          {aiConfigured && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAICompletions}
              className={`h-7 px-2 text-xs ${
                aiCompletionsEnabled 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'hover:bg-gray-200'
              }`}
              title={`${aiCompletionsEnabled ? 'Disable' : 'Enable'} AI completions`}
            >
              <Zap className="w-3 h-3 mr-1" />
              AI
            </Button>
          )}
          
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-7 px-2"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          
          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-7 px-2"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div style={{
        height: 'calc(100% - 44px)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Editor
          value={value}
          onChange={(newValue) => onChange?.(newValue || '')}
          language={editorLanguage}
          theme={currentTheme}
          options={editorOptions}
          onMount={handleEditorDidMount}
          loading={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
              color: isDark ? '#cccccc' : '#666666'
            }}>
              Loading AI-enhanced editor...
            </div>
          }
        />
      </div>

      {/* Completion Stats (Debug) */}
      {process.env.NODE_ENV === 'development' && completionStats.total > 0 && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          Completions: {completionStats.aiGenerated}/{completionStats.total} AI
        </div>
      )}
    </div>
  );
}
