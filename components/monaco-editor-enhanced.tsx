'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Download, 
  Play, 
  Settings, 
  Eye, 
  EyeOff,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';

interface MonacoEditorEnhancedProps {
  value: string;
  language: string;
  fileName: string;
  onChange?: (value: string) => void;
  onSave?: () => void;
  onRun?: () => void;
  readOnly?: boolean;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black';
  showLineNumbers?: boolean;
  showMinimap?: boolean;
  fontSize?: number;
  className?: string;
}

export function MonacoEditorEnhanced({
  value,
  language,
  fileName,
  onChange,
  onSave,
  onRun,
  readOnly = false,
  theme = 'vs-dark',
  showLineNumbers = true,
  showMinimap = true,
  fontSize = 14,
  className = ''
}: MonacoEditorEnhancedProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [monaco, setMonaco] = useState<any>(null);

  // Initialize Monaco Editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Dynamically import Monaco
    import('monaco-editor').then((monacoModule) => {
      const monaco = monacoModule.default;
      setMonaco(monaco);

      // Configure Monaco
      monaco.editor.defineTheme('hex-kex-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorCursor.foreground': '#aeafad',
        'editor.lineHighlightBackground': '#2a2d2e',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
      }
    });

    // Create editor
    const editor = monaco.editor.create(editorRef.current, {
      value,
      language,
      theme: 'hex-kex-dark',
      automaticLayout: true,
      fontSize,
      lineNumbers: showLineNumbers ? 'on' : 'off',
      minimap: {
        enabled: showMinimap,
        side: 'right',
        size: 'proportional'
      },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      readOnly,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      parameterHints: {
        enabled: true
      },
      hover: {
        enabled: true
      },
      contextmenu: true,
      mouseWheelZoom: true,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      renderWhitespace: 'selection',
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',
      matchBrackets: 'always',
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoClosingOvertype: 'always',
      autoSurround: 'quotes',
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true,
      dragAndDrop: true,
      links: true,
      colorDecorators: true,
              lightbulb: {
          enabled: 'on' as any
        },
      codeActionsOnSave: {
        'source.fixAll': 'explicit',
        'source.organizeImports': 'explicit'
      }
    });

    monacoEditorRef.current = editor;

    // Set up event listeners
    if (onChange) {
      editor.onDidChangeModelContent(() => {
        const newValue = editor.getValue();
        onChange(newValue);
      });
    }

    // Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
      onRun?.();
    });

    return () => {
      if (monacoEditorRef.current) {
        monacoEditorRef.current.dispose();
      }
    };
  }, [monaco]);
    }, []);

  // Update editor value when prop changes
  useEffect(() => {
    if (monacoEditorRef.current && monacoEditorRef.current.getValue() !== value) {
      monacoEditorRef.current.setValue(value);
    }
  }, [value, monaco]);

  // Update language when prop changes
  useEffect(() => {
    if (monacoEditorRef.current && monaco) {
      const model = monacoEditorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [language, monaco]);

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Format code
  const formatCode = () => {
    if (monacoEditorRef.current && monaco) {
      monacoEditorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  // Toggle preview mode
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {language.toUpperCase()}
          </Badge>
          <span className="text-sm font-mono text-gray-300">{fileName}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-6 px-2 text-xs"
          >
            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={formatCode}
            className="h-6 px-2 text-xs"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePreviewMode}
            className="h-6 px-2 text-xs"
          >
            {isPreviewMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
          
          {onSave && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              className="h-6 px-2 text-xs"
            >
              <Save className="w-3 h-3" />
            </Button>
          )}
          
          {onRun && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRun}
              className="h-6 px-2 text-xs"
            >
              <Play className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 relative">
        <div 
          ref={editorRef} 
          className="w-full h-full"
          style={{ 
            opacity: isPreviewMode ? 0.5 : 1,
            transition: 'opacity 0.2s ease-in-out'
          }}
        />
        
        {isPreviewMode && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <p className="text-sm text-gray-300">Preview Mode</p>
              <p className="text-xs text-gray-500 mt-1">Editor is in read-only mode</p>
            </div>
          </div>
        )}
      </div>

      {/* Editor Footer */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Line: {monacoEditorRef.current?.getPosition()?.lineNumber || 1}</span>
          <span>Column: {monacoEditorRef.current?.getPosition()?.column || 1}</span>
          <span>Length: {value.length}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span>Theme: {theme}</span>
          <span>Font: {fontSize}px</span>
        </div>
      </div>
    </div>
  );
} 