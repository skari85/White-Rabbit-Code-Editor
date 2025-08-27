'use client';

import { Button } from '@/components/ui/button';
import Editor from '@monaco-editor/react';
import { Maximize2, Minimize2, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import '../styles/monaco-editor-fixes.css';

interface SimpleCodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  theme?: string;
  height?: string | number;
  width?: string | number;
}

// Map file extensions to Monaco languages
const getLanguageFromExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'cpp':
    case 'c':
      return 'cpp';
    case 'php':
      return 'php';
    case 'xml':
      return 'xml';
    case 'sql':
      return 'sql';
    default:
      return 'plaintext';
  }
};

export default function SimpleCodeEditor({
  value,
  onChange,
  language = 'javascript',
  theme = 'vs-dark',
  height = '400px',
  width = '100%'
}: SimpleCodeEditorProps) {
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorLanguage, setEditorLanguage] = useState(language);

  // Update language based on content or filename
  useEffect(() => {
    if (language !== 'javascript') {
      setEditorLanguage(language);
    }
  }, [language]);

  const toggleTheme = () => {
    setCurrentTheme(currentTheme === 'vs-dark' ? 'light' : 'vs-dark');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const isDark = currentTheme.includes('dark');

  const containerStyle = {
    position: 'relative' as const,
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    height: isFullscreen ? '100vh' : height,
    width: isFullscreen ? '100vw' : width,
    ...(isFullscreen && {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      zIndex: 50
    })
  };

  const toolbarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: isDark ? '#2d2d30' : '#f8f9fa',
    borderBottomColor: isDark ? '#3e3e42' : '#e5e7eb'
  };

  const editorOptions = {
    // Core editor options
    fontSize: 14,
    fontFamily: '"Fira Code", "JetBrains Mono", "Monaco", "Menlo", "Ubuntu Mono", monospace',
    fontLigatures: true,
    lineHeight: 1.6,

    // Line numbers and folding
    lineNumbers: 'on' as const,
    lineNumbersMinChars: 3,
    glyphMargin: true,
    folding: true,
    foldingHighlight: true,
    foldingStrategy: 'indentation' as const,
    showFoldingControls: 'always' as const,

    // Minimap - disable to prevent blinking issues
    minimap: {
      enabled: false,
    },

    // Scrolling and layout
    scrollBeyondLastLine: false,
    scrollBeyondLastColumn: 5,
    smoothScrolling: false,
    automaticLayout: true,
    scrollbar: {
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      vertical: 'visible' as const,
      horizontal: 'visible' as const,
      verticalScrollbarSize: 14,
      horizontalScrollbarSize: 14,
    },

    // Selection and cursor
    selectOnLineNumbers: true,
    selectionHighlight: true,
    occurrencesHighlight: 'singleFile' as const,
    renderLineHighlight: 'all' as const,
    renderLineHighlightOnlyWhenFocus: false,
    cursorBlinking: 'blink' as const,
    cursorSmoothCaretAnimation: 'off' as const,
    cursorWidth: 2,

    // Indentation and formatting
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: true,
    trimAutoWhitespace: true,
    autoIndent: 'full' as const,

    // Word wrapping
    wordWrap: 'on' as const,
    wordWrapColumn: 120,
    wrappingIndent: 'indent' as const,

    // Bracket matching and guides
    matchBrackets: 'always' as const,
    bracketPairColorization: {
      enabled: true,
      independentColorPoolPerBracketType: true,
    },
    guides: {
      bracketPairs: true,
      bracketPairsHorizontal: true,
      highlightActiveBracketPair: true,
      indentation: true,
      highlightActiveIndentation: true,
    },

    // IntelliSense and suggestions
    quickSuggestions: {
      other: true,
      comments: true,
      strings: editorLanguage === 'html' || editorLanguage === 'css',
    },
    quickSuggestionsDelay: 100,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: 'on' as const,
    tabCompletion: 'on' as const,
    wordBasedSuggestions: 'matchingDocuments' as const,
    suggestSelection: 'first' as const,

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

    // Code lens and lightbulb
    codeLens: true,

    // Find and replace
    find: {
      addExtraSpaceOnTop: false,
      autoFindInSelection: 'never' as const,
      seedSearchStringFromSelection: 'always' as const,
    },

    // Performance and stability
    stopRenderingLineAfter: 10000,
    disableLayerHinting: false,
    disableMonospaceOptimizations: false,

    // Prevent visual glitches
    renderValidationDecorations: 'on' as const,
    renderFinalNewline: 'on' as const,
    renderControlCharacters: false,
    renderWhitespace: 'none' as const,
  };

  return (
    <div style={containerStyle}>
      {/* Enhanced toolbar */}
      <div style={toolbarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '12px',
            color: isDark ? '#cccccc' : '#6b7280',
            fontWeight: '500'
          }}>
            {editorLanguage.toUpperCase()}
          </span>
          <div style={{
            width: '1px',
            height: '16px',
            backgroundColor: isDark ? '#3e3e42' : '#e5e7eb'
          }} />
          <span style={{
            fontSize: '11px',
            color: isDark ? '#969696' : '#9ca3af'
          }}>
            Lines: {value.split('\n').length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Button
            variant="ghost"
            size="sm"
            style={{ height: '28px', width: '28px', padding: 0 }}
            title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            onClick={toggleTheme}
          >
            {isDark ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            style={{ height: '28px', width: '28px', padding: 0 }}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
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
          onMount={(editor: any, monaco: any) => {
            let focusDecorationIds: string[] = [];
            const injectOriginStyle = (className: string, originPercent: number) => {
              const style = document.createElement('style');
              style.setAttribute('data-wr-focus-style', className);
              style.textContent = `.monaco-editor .${className}::before{transform-origin:${Math.max(0, Math.min(100, originPercent))}% 50% !important;}`;
              document.head.appendChild(style);
              setTimeout(() => {
                document.querySelectorAll(`style[data-wr-focus-style="${className}"]`).forEach(n => n.remove());
              }, 600);
            };

            const applyFocusRipple = (lineNumber: number, column?: number) => {
              try {
                const model = editor.getModel();
                if (!model) return;
                const className = `wr-focus-line-${Date.now()}`;
                let origin = 50;
                try {
                  const start = editor.getScrolledVisiblePosition({ lineNumber, column: 1 });
                  const end = editor.getScrolledVisiblePosition({ lineNumber, column: model.getLineMaxColumn(lineNumber) });
                  const hit = editor.getScrolledVisiblePosition({ lineNumber, column: Math.max(1, Math.min(model.getLineMaxColumn(lineNumber), column || 1)) });
                  if (start && end && hit) {
                    const span = Math.max(1, (end.left - start.left));
                    origin = ((hit.left - start.left) / span) * 100;
                  }
                } catch {}
                injectOriginStyle(className, origin);
                focusDecorationIds = editor.deltaDecorations(
                  focusDecorationIds,
                  [
                    {
                      range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                      options: { isWholeLine: true, className: `wr-focus-line ${className}`, zIndex: 5 }
                    }
                  ]
                );
              } catch {}
            };

            const mouseDownDispose = editor.onMouseDown((e: any) => {
              if (!e?.target?.position) return;
              const { lineNumber, column } = e.target.position;
              applyFocusRipple(lineNumber, column);
            });

            const cursorDispose = editor.onDidChangeCursorPosition((e: any) => {
              if (!e?.position) return;
              applyFocusRipple(e.position.lineNumber);
            });

            editor.onDidDispose(() => {
              mouseDownDispose?.dispose?.();
              cursorDispose?.dispose?.();
            });
          }}
          loading={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
              color: isDark ? '#cccccc' : '#666666'
            }}>
              Loading editor...
            </div>
          }
        />
        {/* Prevent any blinking elements */}
        <style>{`
          .monaco-editor .cursors-layer .cursor {
            animation: none !important;
          }
          .monaco-editor .view-overlays .current-line {
            animation: none !important;
          }
          .monaco-scrollable-element > .scrollbar > .slider {
            animation: none !important;
          }
        `}</style>
      </div>
    </div>
  );
}
