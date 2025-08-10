"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';

const DiffEditor = dynamic(() => import('@monaco-editor/react').then(m => m.DiffEditor), { ssr: false });

interface MonacoDiffOverlayProps {
  filename: string;
  original: string;
  modified: string;
  language?: string;
  onClose: () => void;
}

export default function MonacoDiffOverlay({ filename, original, modified, language = 'javascript', onClose }: MonacoDiffOverlayProps) {
  const lang = useMemo(() => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'ts' || ext === 'tsx') return 'typescript';
    if (ext === 'js' || ext === 'jsx') return 'javascript';
    if (ext === 'css') return 'css';
    if (ext === 'html') return 'html';
    if (ext === 'json') return 'json';
    if (ext === 'md') return 'markdown';
    if (ext === 'py') return 'python';
    return language;
  }, [filename, language]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-700">
        <div className="text-xs text-gray-300 font-mono truncate">Diff: {filename}</div>
        <button className="text-sm px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded" onClick={onClose}>Close</button>
      </div>
      <div className="flex-1 min-h-0">
        <DiffEditor
          original={original}
          modified={modified}
          language={lang}
          theme="vs-dark"
          options={{
            readOnly: true,
            renderSideBySide: true,
            automaticLayout: true,
            minimap: { enabled: false },
          }}
          height="100%"
        />
      </div>
    </div>
  );
}

