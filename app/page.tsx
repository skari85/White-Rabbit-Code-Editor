'use client';

import React from 'react';
import CodeEditor from '@/components/code-editor';
import { ErrorBoundary } from '@/components/error-boundary';

export default function CodeConsole() {
  return (
    <ErrorBoundary>
      <div className="w-full h-screen bg-background">
        <CodeEditor />
      </div>
    </ErrorBoundary>
  );
}
