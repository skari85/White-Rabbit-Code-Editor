'use client';

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useMonaco, UseMonacoProps, MonacoEditorInstance } from '@/hooks/use-monaco';
import { cn } from '@/lib/utils';

export interface MonacoEditorProps extends UseMonacoProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  loading?: React.ReactNode;
  onMount?: (editor: MonacoEditorInstance) => void;
}

export interface MonacoEditorRef extends MonacoEditorInstance {}

const MonacoEditor = forwardRef<MonacoEditorRef, MonacoEditorProps>(({
  className,
  height = '100%',
  width = '100%',
  loading,
  onMount,
  ...monacoProps
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const monacoInstance = useMonaco(monacoProps) as MonacoEditorInstance & { setContainer: (container: HTMLDivElement | null) => void };

  // Expose Monaco instance methods through ref
  useImperativeHandle(ref, () => ({
    editor: monacoInstance.editor,
    monaco: monacoInstance.monaco,
    focus: monacoInstance.focus,
    getValue: monacoInstance.getValue,
    setValue: monacoInstance.setValue,
    getPosition: monacoInstance.getPosition,
    setPosition: monacoInstance.setPosition,
    insertText: monacoInstance.insertText,
    formatDocument: monacoInstance.formatDocument,
    findAndReplace: monacoInstance.findAndReplace,
    addBreakpoint: monacoInstance.addBreakpoint,
    removeBreakpoint: monacoInstance.removeBreakpoint,
    getBreakpoints: monacoInstance.getBreakpoints,
    setTheme: monacoInstance.setTheme,
    resize: monacoInstance.resize
  }), [monacoInstance]);

  // Initialize editor when container is ready
  useEffect(() => {
    if (containerRef.current) {
      monacoInstance.setContainer(containerRef.current);
    }
  }, [monacoInstance]);

  // Call onMount when editor is ready
  useEffect(() => {
    if (monacoInstance.editor && onMount) {
      onMount(monacoInstance);
    }
  }, [monacoInstance.editor, onMount, monacoInstance]);

  // Handle resize when dimensions change
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      monacoInstance.resize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [monacoInstance]);

  const containerStyle: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: typeof width === 'number' ? `${width}px` : width,
  };

  return (
    <div className={cn('relative', className)} style={containerStyle}>
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '200px' }}
      />
      {!monacoInstance.editor && loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          {loading}
        </div>
      )}
    </div>
  );
});

MonacoEditor.displayName = 'MonacoEditor';

export default MonacoEditor;

// Additional utility components

export const MonacoEditorSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse bg-gray-800 rounded', className)}>
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-700 rounded w-5/6"></div>
      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
    </div>
  </div>
);

export const MonacoEditorLoading: React.FC = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
    <span className="text-sm text-gray-400">Loading editor...</span>
  </div>
);

// Diff editor component for comparing files
export interface MonacoDiffEditorProps {
  original: string;
  modified: string;
  language?: string;
  originalFileName?: string;
  modifiedFileName?: string;
  className?: string;
  height?: string | number;
  width?: string | number;
  readOnly?: boolean;
  onMount?: (editor: any) => void;
}

export const MonacoDiffEditor: React.FC<MonacoDiffEditorProps> = ({
  original,
  modified,
  language = 'javascript',
  originalFileName,
  modifiedFileName,
  className,
  height = '100%',
  width = '100%',
  readOnly = true,
  onMount
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamic import to avoid SSR issues
    import('monaco-editor').then((monaco) => {
      const originalModel = monaco.editor.createModel(original, language);
      const modifiedModel = monaco.editor.createModel(modified, language);

      const diffEditor = monaco.editor.createDiffEditor(containerRef.current!, {
        readOnly,
        automaticLayout: true,
        theme: 'vs-dark',
        renderSideBySide: true,
        ignoreTrimWhitespace: false,
        renderIndicators: true,
        originalEditable: false
      });

      diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel
      });

      editorRef.current = diffEditor;

      if (onMount) {
        onMount(diffEditor);
      }

      return () => {
        originalModel.dispose();
        modifiedModel.dispose();
        diffEditor.dispose();
      };
    });
  }, [original, modified, language, readOnly, onMount]);

  const containerStyle: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: typeof width === 'number' ? `${width}px` : width,
  };

  return (
    <div className={cn('relative', className)} style={containerStyle}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

// Minimap component for file overview
export interface MonacoMinimapProps {
  content: string;
  language?: string;
  className?: string;
  onLineClick?: (line: number) => void;
}

export const MonacoMinimap: React.FC<MonacoMinimapProps> = ({
  content,
  language = 'javascript',
  className,
  onLineClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    import('monaco-editor').then((monaco) => {
      const model = monaco.editor.createModel(content, language);
      
      const editor = monaco.editor.create(containerRef.current!, {
        model,
        readOnly: true,
        minimap: { enabled: true, scale: 2 },
        scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
        lineNumbers: 'off',
        glyphMargin: false,
        folding: false,
        selectOnLineNumbers: false,
        selectionHighlight: false,
        cursorStyle: 'line-thin',
        theme: 'vs-dark',
        fontSize: 8,
        automaticLayout: true
      });

      if (onLineClick) {
        editor.onMouseDown((e) => {
          if (e.target.position) {
            onLineClick(e.target.position.lineNumber);
          }
        });
      }

      return () => {
        model.dispose();
        editor.dispose();
      };
    });
  }, [content, language, onLineClick]);

  return (
    <div className={cn('relative', className)}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
