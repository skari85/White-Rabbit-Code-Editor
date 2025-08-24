'use client';

import React from 'react';
import CodeEditor from '@/components/code-editor';
import { ErrorBoundary } from '@/components/error-boundary';
import Link from 'next/link';

export default function EnterEditor() {
  return (
    <ErrorBoundary>
      <div className="w-full h-screen bg-background">
        <CodeEditor />
        <Link
          href="/visual-tools"
          className="fixed bottom-4 right-4 z-50 rounded-full bg-gradient-to-r from-purple-600 to-cyan-400 text-white px-4 py-2 shadow-lg hover:shadow-xl transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Visual Tools
        </Link>
      </div>
    </ErrorBoundary>
  );
}


