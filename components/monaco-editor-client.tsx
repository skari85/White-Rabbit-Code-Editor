'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { loader } from '@monaco-editor/react';
import { setupSimpleMonacoEnvironment } from '@/lib/monaco-setup';

// Setup Monaco Environment before importing
if (typeof window !== 'undefined') {
  setupSimpleMonacoEnvironment();
  // Point @monaco-editor/react at our own copy of Monaco's static AMD
  // build (public/monaco-vs, populated by scripts/copy-monaco.cjs on
  // install) instead of its default CDN loader (jsdelivr) — self-hosted,
  // works offline, and can't be blocked by an ad-blocker or restrictive
  // network. This keeps Monaco's own CSS out of our webpack/Tailwind
  // pipeline entirely, unlike bundling the npm package directly.
  const vsBase = `${window.location.origin}/monaco-vs/vs`;
  loader.config({ paths: { vs: vsBase } });

  // The classic AMD loader spins up language workers via a same-origin
  // Worker whose default script is itself served from a blob: URL — inside
  // that worker, root-relative URLs like "/monaco-vs/vs/..." can't be
  // resolved (a blob: URL has no path to resolve against), so every worker
  // fetch throws "Failed to parse URL". Overriding getWorkerUrl to hand back
  // a blob that importScripts() the worker's *absolute* URL fixes this —
  // the standard approach for self-hosting Monaco outside webpack (see
  // monaco-editor's own samples/browser-amd-monaco example).
  (
    window as unknown as { MonacoEnvironment: Record<string, unknown> }
  ).MonacoEnvironment = {
    getWorkerUrl: (_moduleId: string, _label: string) =>
      URL.createObjectURL(
        new Blob(
          [
            `self.MonacoEnvironment = { baseUrl: '${window.location.origin}/monaco-vs/' };\n` +
              `importScripts('${vsBase}/base/worker/workerMain.js');`,
          ],
          { type: 'text/javascript' }
        )
      ),
  };
}

// Dynamically import Monaco Editor with no SSR
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className='min-h-[400px] bg-gray-900 border border-gray-700 rounded flex items-center justify-center'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4'></div>
        <p className='text-gray-400'>Loading Monaco Editor...</p>
      </div>
    </div>
  ),
});

export interface MonacoEditorClientProps {
  value: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  onCursorPositionChange?: (position: { line: number; column: number }) => void;
  className?: string;
  height?: string | number;
  width?: string | number;
}

export default function MonacoEditorClient({
  value,
  language,
  onChange,
  onCursorPositionChange,
  className,
  height = '400px',
  width = '100%',
}: MonacoEditorClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`min-h-[400px] bg-gray-900 border border-gray-700 rounded flex items-center justify-center ${className}`}
        style={{ height, width }}
      >
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4'></div>
          <p className='text-gray-400'>Loading Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ height, width }}>
      <Editor
        height={height}
        width={width}
        language={language}
        value={value}
        onChange={onChange}
        theme='vs-dark'
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
          },
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          contextmenu: true,
          mouseWheelZoom: true,
          cursorBlinking: 'blink',
          cursorSmoothCaretAnimation: 'on',
          renderWhitespace: 'selection',
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
        }}
        onMount={(editor, monaco) => {
          // Set up cursor position tracking
          if (onCursorPositionChange) {
            editor.onDidChangeCursorPosition(e => {
              onCursorPositionChange({
                line: e.position.lineNumber,
                column: e.position.column,
              });
            });
          }

          // Configure theme
          monaco.editor.defineTheme('hex-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { token: 'comment', foreground: '6A9955' },
              { token: 'keyword', foreground: '569CD6' },
              { token: 'string', foreground: 'CE9178' },
              { token: 'number', foreground: 'B5CEA8' },
              { token: 'regexp', foreground: 'D16969' },
              { token: 'type', foreground: '4EC9B0' },
              { token: 'class', foreground: '4EC9B0' },
              { token: 'function', foreground: 'DCDCAA' },
              { token: 'variable', foreground: '9CDCFE' },
              { token: 'constant', foreground: '4FC1FF' },
            ],
            colors: {
              'editor.background': '#0d1117',
              'editor.foreground': '#e6edf3',
              'editorLineNumber.foreground': '#6e7681',
              'editorLineNumber.activeForeground': '#e6edf3',
              'editor.selectionBackground': '#264f78',
              'editor.inactiveSelectionBackground': '#264f7840',
              'editorCursor.foreground': '#10b981',
              'editor.lineHighlightBackground': '#21262d40',
              'editorIndentGuide.background': '#21262d',
              'editorIndentGuide.activeBackground': '#30363d',
            },
          });
          monaco.editor.setTheme('hex-dark');
        }}
      />
    </div>
  );
}
