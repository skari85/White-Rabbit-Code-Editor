'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { configureMonaco, getEditorOptions, getLanguageFromFileName, MonacoConfig } from '@/lib/monaco-config';
import { PersonalityMode } from '@/lib/personality-system';

export interface UseMonacoProps {
  value: string;
  language?: string;
  fileName?: string;
  onChange?: (value: string) => void;
  onCursorPositionChange?: (position: { line: number; column: number }) => void;
  config?: Partial<MonacoConfig>;
  personality?: PersonalityMode;
  readOnly?: boolean;
}

export interface MonacoEditorInstance {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  monaco: typeof monaco;
  focus: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
  getPosition: () => { line: number; column: number };
  setPosition: (line: number, column: number) => void;
  insertText: (text: string) => void;
  formatDocument: () => void;
  findAndReplace: (searchText: string, replaceText: string) => void;
  addBreakpoint: (line: number) => void;
  removeBreakpoint: (line: number) => void;
  getBreakpoints: () => number[];
  setTheme: (theme: string) => void;
  resize: () => void;
}

export const useMonaco = ({
  value,
  language,
  fileName,
  onChange,
  onCursorPositionChange,
  config = {},
  personality = 'hex',
  readOnly = false
}: UseMonacoProps): MonacoEditorInstance => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);

  // Configure Monaco on first load
  useEffect(() => {
    if (!isConfigured) {
      configureMonaco();
      setIsConfigured(true);
    }
  }, [isConfigured]);

  // Determine language from filename if not provided
  const editorLanguage = language || (fileName ? getLanguageFromFileName(fileName) : 'plaintext');

  // Get theme based on personality
  const getTheme = useCallback(() => {
    if (personality === 'hex') return 'hex-dark';
    if (personality === 'kex') return 'kex-light';
    return config.theme || 'vs-dark';
  }, [personality, config.theme]);

  // Initialize editor
  const initializeEditor = useCallback((container: HTMLDivElement) => {
    if (!isConfigured || editorRef.current) return;

    const editorOptions = {
      ...getEditorOptions(config),
      value,
      language: editorLanguage,
      theme: getTheme(),
      readOnly
    };

    const editor = monaco.editor.create(container, editorOptions);
    editorRef.current = editor;

    // Set up change listener
    const disposable = editor.onDidChangeModelContent(() => {
      const currentValue = editor.getValue();
      onChange?.(currentValue);
    });

    // Set up cursor position listener
    const cursorDisposable = editor.onDidChangeCursorPosition((e) => {
      onCursorPositionChange?.({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });

    // Set up breakpoint listener
    const breakpointDisposable = editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
        const line = e.target.position?.lineNumber;
        if (line) {
          toggleBreakpoint(line);
        }
      }
    });

    // Cleanup function
    return () => {
      disposable.dispose();
      cursorDisposable.dispose();
      breakpointDisposable.dispose();
      editor.dispose();
    };
  }, [isConfigured, value, editorLanguage, getTheme, config, readOnly, onChange, onCursorPositionChange]);

  // Update editor value when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      const position = editorRef.current.getPosition();
      editorRef.current.setValue(value);
      if (position) {
        editorRef.current.setPosition(position);
      }
    }
  }, [value]);

  // Update editor language when it changes
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, editorLanguage);
      }
    }
  }, [editorLanguage]);

  // Update theme when personality changes
  useEffect(() => {
    if (editorRef.current) {
      const theme = getTheme();
      monaco.editor.setTheme(theme);
    }
  }, [getTheme]);

  // Breakpoint management
  const toggleBreakpoint = useCallback((line: number) => {
    setBreakpoints(prev => {
      const newBreakpoints = prev.includes(line)
        ? prev.filter(bp => bp !== line)
        : [...prev, line];
      
      // Update editor decorations
      if (editorRef.current) {
        const decorations = newBreakpoints.map(bp => ({
          range: new monaco.Range(bp, 1, bp, 1),
          options: {
            isWholeLine: true,
            className: 'breakpoint-decoration',
            glyphMarginClassName: 'breakpoint-glyph',
            glyphMarginHoverMessage: { value: 'Breakpoint' }
          }
        }));
        editorRef.current.deltaDecorations([], decorations);
      }
      
      return newBreakpoints;
    });
  }, []);

  // API methods
  const focus = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const getValue = useCallback(() => {
    return editorRef.current?.getValue() || '';
  }, []);

  const setValue = useCallback((newValue: string) => {
    editorRef.current?.setValue(newValue);
  }, []);

  const getPosition = useCallback(() => {
    const position = editorRef.current?.getPosition();
    return {
      line: position?.lineNumber || 1,
      column: position?.column || 1
    };
  }, []);

  const setPosition = useCallback((line: number, column: number) => {
    editorRef.current?.setPosition({ lineNumber: line, column });
  }, []);

  const insertText = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const position = editor.getPosition();
    if (position) {
      editor.executeEdits('insert-text', [{
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text
      }]);
    }
  }, []);

  const formatDocument = useCallback(() => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
  }, []);

  const findAndReplace = useCallback((searchText: string, replaceText: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const matches = model.findMatches(searchText, false, false, false, null, false);
    const edits = matches.map(match => ({
      range: match.range,
      text: replaceText
    }));

    editor.executeEdits('find-replace', edits);
  }, []);

  const addBreakpoint = useCallback((line: number) => {
    if (!breakpoints.includes(line)) {
      toggleBreakpoint(line);
    }
  }, [breakpoints, toggleBreakpoint]);

  const removeBreakpoint = useCallback((line: number) => {
    if (breakpoints.includes(line)) {
      toggleBreakpoint(line);
    }
  }, [breakpoints, toggleBreakpoint]);

  const getBreakpoints = useCallback(() => {
    return [...breakpoints];
  }, [breakpoints]);

  const setTheme = useCallback((theme: string) => {
    monaco.editor.setTheme(theme);
  }, []);

  const resize = useCallback(() => {
    editorRef.current?.layout();
  }, []);

  // Set container ref and initialize editor
  const setContainer = useCallback((container: HTMLDivElement | null) => {
    containerRef.current = container;
    if (container && isConfigured) {
      const cleanup = initializeEditor(container);
      return cleanup;
    }
  }, [initializeEditor, isConfigured]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  return {
    editor: editorRef.current,
    monaco,
    focus,
    getValue,
    setValue,
    getPosition,
    setPosition,
    insertText,
    formatDocument,
    findAndReplace,
    addBreakpoint,
    removeBreakpoint,
    getBreakpoints,
    setTheme,
    resize,
    // Internal method for setting container
    setContainer
  } as MonacoEditorInstance & { setContainer: (container: HTMLDivElement | null) => void };
};

// Custom hook for managing multiple editor instances
export const useMonacoMultiple = () => {
  const [editors, setEditors] = useState<Map<string, MonacoEditorInstance>>(new Map());

  const createEditor = useCallback((id: string, props: UseMonacoProps) => {
    const editor = useMonaco(props);
    setEditors(prev => new Map(prev).set(id, editor));
    return editor;
  }, []);

  const getEditor = useCallback((id: string) => {
    return editors.get(id);
  }, [editors]);

  const removeEditor = useCallback((id: string) => {
    const editor = editors.get(id);
    if (editor?.editor) {
      editor.editor.dispose();
    }
    setEditors(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, [editors]);

  const getAllEditors = useCallback(() => {
    return Array.from(editors.values());
  }, [editors]);

  return {
    createEditor,
    getEditor,
    removeEditor,
    getAllEditors,
    editors: Array.from(editors.entries())
  };
};
