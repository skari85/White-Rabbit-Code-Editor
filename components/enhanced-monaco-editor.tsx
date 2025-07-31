'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Replace, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  Info,
  Lightbulb,
  Code,
  FileText,
  Settings,
  Play,
  Square,
  RefreshCw,
  Terminal,
  Zap,
  Target,
  Bookmark,
  GitBranch,
  History,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Download,
  Upload,
  Palette,
  Moon,
  Sun,
  Type,
  Hash,
  Braces,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Monaco Editor types and imports
interface MonacoEditor {
  getValue(): string;
  setValue(value: string): void;
  onDidChangeModelContent(listener: () => void): { dispose(): void };
  getModel(): any;
  setModel(model: any): void;
  focus(): void;
  layout(): void;
  dispose(): void;
  addAction(action: any): void;
  trigger(source: string, handlerId: string, payload?: any): void;
  getSelection(): any;
  setSelection(selection: any): void;
  revealLine(lineNumber: number): void;
  deltaDecorations(oldDecorations: string[], newDecorations: any[]): string[];
  getPosition(): any;
  setPosition(position: any): void;
}

interface MonacoModule {
  editor: {
    create(container: HTMLElement, options: any): MonacoEditor;
    defineTheme(themeName: string, themeData: any): void;
    setTheme(themeName: string): void;
    createModel(value: string, language?: string, uri?: any): any;
  };
  languages: {
    registerCompletionItemProvider(languageId: string, provider: any): { dispose(): void };
    registerHoverProvider(languageId: string, provider: any): { dispose(): void };
    registerSignatureHelpProvider(languageId: string, provider: any): { dispose(): void };
    setLanguageConfiguration(languageId: string, configuration: any): { dispose(): void };
  };
  Uri: {
    parse(uri: string): any;
  };
  KeyMod: any;
  KeyCode: any;
  Range: any;
  Position: any;
  Selection: any;
}

export interface MonacoEditorRef {
  editor: MonacoEditor | null;
  focus: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
  getSelection: () => any;
  setSelection: (selection: any) => void;
  formatDocument: () => void;
  findAndReplace: (searchText: string, replaceText?: string) => void;
}

interface EnhancedMonacoEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black' | 'kex-dark' | 'hex-light';
  options?: any;
  className?: string;
  height?: string | number;
  width?: string | number;
  enableDiagnostics?: boolean;
  enableIntelliSense?: boolean;
  enableMinimap?: boolean;
  enableBreadcrumbs?: boolean;
  enableLineNumbers?: boolean;
  enableFolding?: boolean;
  enableAutoSave?: boolean;
  readOnly?: boolean;
  onMount?: (editor: MonacoEditor, monaco: MonacoModule) => void;
  onError?: (error: any) => void;
}

// Enhanced diagnostics and error checking
interface Diagnostic {
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  code?: string;
  source?: string;
  relatedInformation?: Array<{
    message: string;
    range: any;
  }>;
}

// Custom IntelliSense providers
const createCompletionProvider = (language: string) => ({
  provideCompletionItems: (model: any, position: any) => {
    const suggestions = getLanguageCompletions(language, model, position);
    return { suggestions };
  }
});

const createHoverProvider = (language: string) => ({
  provideHover: (model: any, position: any) => {
    const word = model.getWordAtPosition(position);
    if (!word) return null;
    
    const hoverInfo = getHoverInformation(language, word.word);
    return hoverInfo ? {
      range: {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      },
      contents: [{ value: hoverInfo }]
    } : null;
  }
});

// Language-specific completions
const getLanguageCompletions = (language: string, model: any, position: any) => {
  const suggestions: any[] = [];
  
  switch (language) {
    case 'javascript':
    case 'typescript':
      suggestions.push(
        {
          label: 'console.log',
          kind: 2, // Method
          insertText: 'console.log(${1:message});',
          insertTextRules: 4, // InsertTextRule.InsertAsSnippet
          documentation: 'Log a message to the console'
        },
        {
          label: 'function',
          kind: 14, // Snippet
          insertText: 'function ${1:name}(${2:params}) {\n\t${3:// body}\n}',
          insertTextRules: 4,
          documentation: 'Function declaration'
        },
        {
          label: 'if',
          kind: 14,
          insertText: 'if (${1:condition}) {\n\t${2:// body}\n}',
          insertTextRules: 4,
          documentation: 'If statement'
        },
        {
          label: 'for',
          kind: 14,
          insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${3:// body}\n}',
          insertTextRules: 4,
          documentation: 'For loop'
        }
      );
      break;
      
    case 'python':
      suggestions.push(
        {
          label: 'print',
          kind: 2,
          insertText: 'print(${1:message})',
          insertTextRules: 4,
          documentation: 'Print a message'
        },
        {
          label: 'def',
          kind: 14,
          insertText: 'def ${1:function_name}(${2:params}):\n\t${3:pass}',
          insertTextRules: 4,
          documentation: 'Function definition'
        },
        {
          label: 'class',
          kind: 14,
          insertText: 'class ${1:ClassName}:\n\tdef __init__(self${2:, params}):\n\t\t${3:pass}',
          insertTextRules: 4,
          documentation: 'Class definition'
        }
      );
      break;
      
    case 'html':
      suggestions.push(
        {
          label: 'div',
          kind: 14,
          insertText: '<div${1: class="${2:className}"}>\n\t${3:content}\n</div>',
          insertTextRules: 4,
          documentation: 'Div element'
        },
        {
          label: 'script',
          kind: 14,
          insertText: '<script${1: src="${2:url}"}>\n\t${3:// JavaScript code}\n</script>',
          insertTextRules: 4,
          documentation: 'Script element'
        }
      );
      break;
  }
  
  return suggestions;
};

const getHoverInformation = (language: string, word: string): string | null => {
  const docs: Record<string, Record<string, string>> = {
    javascript: {
      'console': 'The console object provides access to the browser\'s debugging console.',
      'document': 'The Document interface represents any web page loaded in the browser.',
      'window': 'The window object represents an open window in a browser.',
      'localStorage': 'The localStorage property allows you to access a Storage object for the Document\'s origin.',
      'setTimeout': 'The setTimeout() method calls a function or evaluates an expression after a specified number of milliseconds.',
      'fetch': 'The fetch() method starts the process of fetching a resource from the network.'
    },
    python: {
      'print': 'Print objects to the text stream file, separated by sep and followed by end.',
      'len': 'Return the length of an object.',
      'range': 'Return an object which is an iterator of arithmetic progressions.',
      'list': 'Return a new list object which is a mutable sequence type.',
      'dict': 'Return a new dictionary object.'
    }
  };
  
  return docs[language]?.[word] || null;
};

// Custom themes
const customThemes = {
  'kex-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '00FFE1', fontStyle: 'bold' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'regexp', foreground: 'D16969' },
      { token: 'operator', foreground: '00D4AA' },
      { token: 'namespace', foreground: '4EC9B0' },
      { token: 'type', foreground: '4FC1FF' },
      { token: 'struct', foreground: '86C691' },
      { token: 'class', foreground: '4EC9B0' },
      { token: 'interface', foreground: 'B8D7A3' },
      { token: 'enum', foreground: 'B8D7A3' },
      { token: 'typeParameter', foreground: 'B8D7A3' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'method', foreground: 'DCDCAA' },
      { token: 'decorator', foreground: 'C586C0' },
      { token: 'macro', foreground: 'C586C0' }
    ],
    colors: {
      'editor.background': '#0F1419',
      'editor.foreground': '#BFBDB6',
      'editorLineNumber.foreground': '#495162',
      'editorLineNumber.activeForeground': '#00FFE1',
      'editor.selectionBackground': '#00FFE120',
      'editor.inactiveSelectionBackground': '#00FFE110',
      'editorCursor.foreground': '#00FFE1',
      'editor.findMatchBackground': '#00D4AA40',
      'editor.findMatchHighlightBackground': '#00D4AA20',
      'editorBracketMatch.background': '#00FFE140',
      'editorBracketMatch.border': '#00FFE1'
    }
  },
  'hex-light': {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
      { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
      { token: 'string', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'regexp', foreground: '811F3F' },
      { token: 'operator', foreground: '000000' },
      { token: 'function', foreground: '795E26' },
      { token: 'method', foreground: '795E26' }
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      'editorLineNumber.foreground': '#237893',
      'editor.selectionBackground': '#ADD6FF',
      'editorCursor.foreground': '#000000'
    }
  }
};

const EnhancedMonacoEditor = React.forwardRef<MonacoEditorRef, EnhancedMonacoEditorProps>(({
  value,
  onChange,
  language = 'javascript',
  theme = 'vs-dark',
  options = {},
  className,
  height = '400px',
  width = '100%',
  enableDiagnostics = true,
  enableIntelliSense = true,
  enableMinimap = true,
  enableBreadcrumbs = true,
  enableLineNumbers = true,
  enableFolding = true,
  enableAutoSave = false,
  readOnly = false,
  onMount,
  onError
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MonacoEditor | null>(null);
  const monacoRef = useRef<MonacoModule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [editorOptions, setEditorOptions] = useState({});

  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || !editorRef.current) return;
    
    const autoSaveInterval = setInterval(() => {
      if (editorRef.current && onChange) {
        onChange(editorRef.current.getValue());
      }
    }, 2000); // Auto-save every 2 seconds

    return () => clearInterval(autoSaveInterval);
  }, [enableAutoSave, onChange]);

  // Initialize Monaco Editor
  useEffect(() => {
    const initMonaco = async () => {
      try {
        // Dynamic import of Monaco Editor
        const monaco = await import('monaco-editor');
        monacoRef.current = monaco as any;

        // Register custom themes
        Object.entries(customThemes).forEach(([themeName, themeData]) => {
          monaco.editor.defineTheme(themeName, themeData as any);
        });

        if (containerRef.current) {
          const editorOptions = {
            value,
            language,
            theme: currentTheme,
            readOnly,
            minimap: { enabled: enableMinimap },
            lineNumbers: enableLineNumbers ? 'on' : 'off',
            folding: enableFolding,
            wordWrap: 'on',
            automaticLayout: true,
            fontSize: 14,
            fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", Consolas, monospace',
            fontLigatures: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true
            },
            suggest: {
              preview: true,
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
              showUsers: true
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false
            },
            inlineSuggest: { enabled: true },
            parameterHints: { enabled: true },
            hover: { enabled: true },
            contextmenu: true,
            mouseWheelZoom: true,
            ...options
          };

          const editor = monaco.editor.create(containerRef.current, editorOptions);
          editorRef.current = editor;

          // Register IntelliSense providers
          if (enableIntelliSense) {
            monaco.languages.registerCompletionItemProvider(language, createCompletionProvider(language));
            monaco.languages.registerHoverProvider(language, createHoverProvider(language));
          }

          // Add custom commands
          editor.addAction({
            id: 'find-and-replace',
            label: 'Find and Replace',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH],
            run: () => setShowFindReplace(true)
          });

          editor.addAction({
            id: 'toggle-diagnostics',
            label: 'Toggle Diagnostics Panel',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyM],
            run: () => setShowDiagnostics(prev => !prev)
          });

          // Content change handler
          const disposable = editor.onDidChangeModelContent(() => {
            const currentValue = editor.getValue();
            onChange?.(currentValue);
            
            // Run diagnostics
            if (enableDiagnostics) {
              runDiagnostics(currentValue, language);
            }
          });

          // Call onMount callback
          onMount?.(editor, monaco as any);

          setIsLoading(false);

          return () => {
            disposable.dispose();
            editor.dispose();
          };
        }
      } catch (error) {
        console.error('Failed to initialize Monaco Editor:', error);
        onError?.(error);
        setIsLoading(false);
      }
    };

    initMonaco();
  }, []);

  // Update editor value when prop changes
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Update theme
  useEffect(() => {
    if (monacoRef.current && currentTheme) {
      monacoRef.current.editor.setTheme(currentTheme);
    }
  }, [currentTheme]);

  // Simple diagnostics runner
  const runDiagnostics = useCallback((code: string, lang: string) => {
    const newDiagnostics: Diagnostic[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Basic linting rules
      if (lang === 'javascript' || lang === 'typescript') {
        // Check for console.log
        if (line.includes('console.log')) {
          newDiagnostics.push({
            severity: 'warning',
            message: 'Remove console.log statements before production',
            range: {
              startLineNumber: lineNumber,
              startColumn: line.indexOf('console.log') + 1,
              endLineNumber: lineNumber,
              endColumn: line.indexOf('console.log') + 'console.log'.length + 1
            },
            code: 'no-console',
            source: 'eslint'
          });
        }
        
        // Check for var usage
        if (line.includes('var ')) {
          newDiagnostics.push({
            severity: 'warning',
            message: 'Use let or const instead of var',
            range: {
              startLineNumber: lineNumber,
              startColumn: line.indexOf('var ') + 1,
              endLineNumber: lineNumber,
              endColumn: line.indexOf('var ') + 4
            },
            code: 'no-var',
            source: 'eslint'
          });
        }
        
        // Check for missing semicolons (basic check)
        if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
          const trimmed = line.trim();
          if (trimmed.includes('=') || trimmed.includes('return') || trimmed.includes('break') || trimmed.includes('continue')) {
            newDiagnostics.push({
              severity: 'info',
              message: 'Missing semicolon',
              range: {
                startLineNumber: lineNumber,
                startColumn: line.length,
                endLineNumber: lineNumber,
                endColumn: line.length + 1
              },
              code: 'semi',
              source: 'eslint'
            });
          }
        }
      }
    });

    setDiagnostics(newDiagnostics);
    
    // Update editor decorations
    if (editorRef.current && monacoRef.current) {
      const decorations = newDiagnostics.map(diagnostic => ({
        range: new monacoRef.current!.Range(
          diagnostic.range.startLineNumber,
          diagnostic.range.startColumn,
          diagnostic.range.endLineNumber,
          diagnostic.range.endColumn
        ),
        options: {
          inlineClassName: cn(
            'editor-diagnostic',
            {
              'editor-diagnostic-error': diagnostic.severity === 'error',
              'editor-diagnostic-warning': diagnostic.severity === 'warning',
              'editor-diagnostic-info': diagnostic.severity === 'info',
              'editor-diagnostic-hint': diagnostic.severity === 'hint'
            }
          ),
          hoverMessage: { value: diagnostic.message },
          glyphMarginClassName: cn(
            'editor-diagnostic-glyph',
            {
              'editor-diagnostic-glyph-error': diagnostic.severity === 'error',
              'editor-diagnostic-glyph-warning': diagnostic.severity === 'warning',
              'editor-diagnostic-glyph-info': diagnostic.severity === 'info',
              'editor-diagnostic-glyph-hint': diagnostic.severity === 'hint'
            }
          )
        }
      }));
      
      editorRef.current.deltaDecorations([], decorations);
    }
  }, []);

  // Find and replace functionality
  const handleFind = useCallback(() => {
    if (!editorRef.current || !searchText) return;
    
    editorRef.current.trigger('find', 'actions.find', {
      searchString: searchText,
      replaceString: replaceText,
      isRegex: false,
      matchCase: false,
      matchWholeWord: false
    });
  }, [searchText, replaceText]);

  const handleReplace = useCallback(() => {
    if (!editorRef.current || !searchText) return;
    
    editorRef.current.trigger('replace', 'editor.action.startFindReplaceAction', {
      searchString: searchText,
      replaceString: replaceText
    });
  }, [searchText, replaceText]);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    editor: editorRef.current,
    focus: () => editorRef.current?.focus(),
    getValue: () => editorRef.current?.getValue() || '',
    setValue: (newValue: string) => editorRef.current?.setValue(newValue),
    getSelection: () => editorRef.current?.getSelection(),
    setSelection: (selection: any) => editorRef.current?.setSelection(selection),
    formatDocument: () => {
      editorRef.current?.trigger('format', 'editor.action.formatDocument', {});
    },
    findAndReplace: (search: string, replace?: string) => {
      setSearchText(search);
      if (replace !== undefined) setReplaceText(replace);
      setShowFindReplace(true);
    }
  }));

  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warningCount = diagnostics.filter(d => d.severity === 'warning').length;
  const infoCount = diagnostics.filter(d => d.severity === 'info').length;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Enhanced Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {language}
          </Badge>
          
          {enableDiagnostics && (diagnostics.length > 0) && (
            <div className="flex items-center gap-1">
              {errorCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {errorCount}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {warningCount}
                </Badge>
              )}
              {infoCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Info className="w-3 h-3 mr-1" />
                  {infoCount}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFindReplace(true)}
            className="h-7 w-7 p-0"
            title="Find & Replace (Ctrl+H)"
          >
            <Search className="w-3 h-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editorRef.current?.trigger('format', 'editor.action.formatDocument', {})}
            className="h-7 w-7 p-0"
            title="Format Document"
          >
            <Code className="w-3 h-3" />
          </Button>

          {enableDiagnostics && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDiagnostics(prev => !prev)}
              className="h-7 w-7 p-0"
              title="Toggle Diagnostics"
            >
              <AlertTriangle className="w-3 h-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentTheme(currentTheme === 'vs-dark' ? 'vs-light' : 'vs-dark')}
            className="h-7 w-7 p-0"
            title="Toggle Theme"
          >
            {currentTheme === 'vs-dark' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading editor...</span>
            </div>
          </div>
        )}
        
        <div
          ref={containerRef}
          style={{ height, width }}
          className="border rounded-md overflow-hidden"
        />
      </div>

      {/* Diagnostics Panel */}
      {showDiagnostics && diagnostics.length > 0 && (
        <div className="border-t bg-muted/20">
          <div className="flex items-center justify-between p-2 border-b">
            <h3 className="text-sm font-medium">Problems ({diagnostics.length})</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDiagnostics(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <ScrollArea className="h-32">
            <div className="p-2 space-y-1">
              {diagnostics.map((diagnostic, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 rounded text-xs hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    if (editorRef.current) {
                      editorRef.current.revealLine(diagnostic.range.startLineNumber);
                      editorRef.current.setPosition({
                        lineNumber: diagnostic.range.startLineNumber,
                        column: diagnostic.range.startColumn
                      });
                      editorRef.current.focus();
                    }
                  }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {diagnostic.severity === 'error' && (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    )}
                    {diagnostic.severity === 'warning' && (
                      <AlertTriangle className="w-3 h-3 text-yellow-500" />
                    )}
                    {diagnostic.severity === 'info' && (
                      <Info className="w-3 h-3 text-blue-500" />
                    )}
                    {diagnostic.severity === 'hint' && (
                      <Lightbulb className="w-3 h-3 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{diagnostic.message}</div>
                    <div className="text-muted-foreground">
                      Line {diagnostic.range.startLineNumber}, Column {diagnostic.range.startColumn}
                      {diagnostic.source && ` • ${diagnostic.source}`}
                      {diagnostic.code && ` • ${diagnostic.code}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Find and Replace Dialog */}
      <Dialog open={showFindReplace} onOpenChange={setShowFindReplace}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Find and Replace
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Find</label>
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Enter search text"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleFind();
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Replace</label>
              <Input
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Enter replacement text"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleReplace();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFind} size="sm">
                <Search className="w-3 h-3 mr-1" />
                Find
              </Button>
              <Button onClick={handleReplace} variant="outline" size="sm">
                <Replace className="w-3 h-3 mr-1" />
                Replace
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

EnhancedMonacoEditor.displayName = 'EnhancedMonacoEditor';

export default EnhancedMonacoEditor;
