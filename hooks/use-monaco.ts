'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { configureMonaco, getEditorOptions, getLanguageFromFileName, MonacoConfig } from '@/lib/monaco-config';
import { PersonalityMode } from '@/lib/personality-system';

// Type definitions for Monaco Editor
type Monaco = typeof import('monaco-editor');
type IStandaloneCodeEditor = import('monaco-editor').editor.IStandaloneCodeEditor;

// Dynamic import of Monaco Editor to prevent SSR issues
let monacoInstance: Monaco | null = null;

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
  editor: IStandaloneCodeEditor | null;
  monaco: Monaco | null;
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

export const useMonaco = (props: UseMonacoProps): MonacoEditorInstance => {
  const {
    value,
    language,
    fileName,
    onChange,
    onCursorPositionChange,
    config = {},
    personality = 'hex',
    readOnly = false,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Dynamic import and initialization of Monaco Editor
  useEffect(() => {
    if (!isClient) return;

    const loadMonaco = async () => {
      try {
        if (!monacoInstance) {
          monacoInstance = await import('monaco-editor');
          // Configure Monaco Editor with our settings
          configureMonaco(monacoInstance);
        }
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load Monaco Editor:', error);
      }
    };

    loadMonaco();
  }, [isClient, config]);

  // Initialize editor function
  const initializeEditor = useCallback((container: HTMLDivElement) => {
    if (!isLoaded || !monacoInstance) return;

    const editorLanguage = language || getLanguageFromFileName(fileName || '');
    const editorOptions = getEditorOptions(editorLanguage, config, personality);

    // Create editor
    const editor = monacoInstance.editor.create(container, {
      ...editorOptions,
      value,
      readOnly,
    });

    editorRef.current = editor;

    // Setup change listener
    const disposable = editor.onDidChangeModelContent(() => {
      if (onChange) {
        onChange(editor.getValue());
      }
    });

    // Setup cursor position listener
    const cursorDisposable = editor.onDidChangeCursorPosition((e) => {
      if (onCursorPositionChange) {
        onCursorPositionChange({ line: e.position.lineNumber, column: e.position.column });
      }
    });

    return () => {
      disposable.dispose();
      cursorDisposable.dispose();
      editor.dispose();
    };
  }, [isLoaded, monacoInstance, language, fileName, config, personality, value, readOnly, onChange, onCursorPositionChange]);

  // Initialize editor when container is available
  useEffect(() => {
    if (!isLoaded || !monacoInstance || !containerRef.current) return;

    const cleanup = initializeEditor(containerRef.current);
    return cleanup;
  }, [initializeEditor]);

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
    if (editorRef.current && monacoInstance) {
      const model = editorRef.current.getModel();
      if (model) {
        const editorLanguage = language || getLanguageFromFileName(fileName || '');
        monacoInstance.editor.setModelLanguage(model, editorLanguage);
      }
    }
  }, [language, fileName, monacoInstance]);

  // Update theme when personality changes
  useEffect(() => {
    if (editorRef.current && monacoInstance) {
      const theme = config.theme || 'vs-dark';
      monacoInstance.editor.setTheme(theme);
    }
  }, [config.theme, monacoInstance]);

  // Breakpoints state
  const [breakpoints, setBreakpoints] = useState<number[]>([]);

  // Breakpoint management
  const toggleBreakpoint = useCallback((line: number) => {
    setBreakpoints(prev => {
      const newBreakpoints = prev.includes(line)
        ? prev.filter(bp => bp !== line)
        : [...prev, line];

      // Update editor decorations
      if (editorRef.current && monacoInstance) {
        const decorations = newBreakpoints.map(bp => ({
          range: new monacoInstance!.Range(bp, 1, bp, 1),
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
  }, [monacoInstance]);

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
    if (!editor || !monacoInstance) return;

    const position = editor.getPosition();
    if (position) {
      editor.executeEdits('insert-text', [{
        range: new monacoInstance.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text
      }]);
    }
  }, [monacoInstance]);

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
    if (monacoInstance) {
      monacoInstance.editor.setTheme(theme);
    }
  }, [monacoInstance]);

  const resize = useCallback(() => {
    editorRef.current?.layout();
  }, []);

  // Set container ref and initialize editor
  const setContainer = useCallback((container: HTMLDivElement | null) => {
    containerRef.current = container;
    if (container && isLoaded) {
      const cleanup = initializeEditor(container);
      return cleanup;
    }
  }, [initializeEditor, isLoaded]);

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
    monaco: monacoInstance,
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
