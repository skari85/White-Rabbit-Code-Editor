'use client';

import React, { useCallback } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import { FileText, Plus, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { FileContent } from '@/hooks/use-code-builder';

// Lazy-load Monaco to keep initial bundle small
const FastLiveCoding = dynamic(() => import('@/components/fast-live-coding'), {
  loading: () => (
    <div className="ios-glass-surface flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-foreground/55">Loading editor...</p>
      </div>
    </div>
  ),
  ssr: false,
});

// ---------------------------------------------------------------------------

interface EditorPanelProps {
  files: FileContent[];
  selectedFile: string;
  onSelectFile: (name: string) => void;
  onUpdateContent: (name: string, content: string) => void;
  onAddFile: (name: string, type?: FileContent['type']) => void;
  onDeleteFile: (name: string) => void;
  theme?: string;
  className?: string;
}

// ---------------------------------------------------------------------------

export default function EditorPanel({
  files,
  selectedFile,
  onSelectFile,
  onUpdateContent,
  onAddFile,
  onDeleteFile,
  theme = 'vs-dark',
  className = '',
}: EditorPanelProps) {
  const getLanguage = useCallback((fileName: string | null): string => {
    if (!fileName) return 'javascript';
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      default:
        return 'javascript';
    }
  }, []);

  const currentContent =
    files.find((f) => f.name === selectedFile)?.content ?? '';

  return (
    <div className={`ios-glass-surface-strong flex flex-col h-full ${className}`}>
      {/* Tab bar */}
      <div className="ios-glass-panel-header flex items-center gap-1 px-2 py-1 overflow-x-auto scrollbar-none">
        {files.map((f) => (
          <button
            key={f.name}
            type="button"
            onClick={() => onSelectFile(f.name)}
            className={`ios-glass-chip flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-colors ${
              selectedFile === f.name
                ? 'ios-glass-chip-active text-foreground'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <FileText className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[120px]">{f.name}</span>
            {selectedFile === f.name && (
              <X
                className="w-3 h-3 shrink-0 opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFile(f.name);
                }}
              />
            )}
          </button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 ml-1 shrink-0 text-foreground/60 hover:text-foreground"
          onClick={() => onAddFile('new-file.js', 'js')}
          title="New file"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Monaco editor */}
      <div className="flex-1 min-h-0">
        <ErrorBoundary>
          <FastLiveCoding
            value={currentContent}
            onChange={(content) => {
              if (selectedFile && content !== undefined) {
                onUpdateContent(selectedFile, content);
              }
            }}
            language={getLanguage(selectedFile)}
            theme={theme}
            height="100%"
            onLanguageChange={() => {}}
            onFileCreate={(filename, content) => {
              const ext = filename.split('.').pop()?.toLowerCase() ?? 'js';
              const typeMap: Record<string, FileContent['type']> = {
                js: 'js', jsx: 'js', ts: 'ts', tsx: 'tsx', html: 'html',
                css: 'css', json: 'json', md: 'md', py: 'py',
              };
              onAddFile(filename, typeMap[ext] ?? 'txt');
              setTimeout(() => onUpdateContent(filename, content), 0);
              onSelectFile(filename);
            }}
            onMultipleFilesCreate={(list) => {
              list.forEach((f, i) => {
                const ext = f.filename.split('.').pop()?.toLowerCase() ?? 'js';
                const typeMap: Record<string, FileContent['type']> = {
                  js: 'js', jsx: 'js', ts: 'ts', tsx: 'tsx', html: 'html',
                  css: 'css', json: 'json', md: 'md', py: 'py',
                };
                onAddFile(f.filename, typeMap[ext] ?? 'txt');
                setTimeout(() => onUpdateContent(f.filename, f.content), i * 50);
              });
              if (list.length > 0) {
                setTimeout(() => onSelectFile(list[0].filename), 100);
              }
            }}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
