'use client';

import React from 'react';
import CodeEditor from '@/components/code-editor';

export default function CodeConsole() {
  return (
    <div className="w-full h-screen bg-background">
      <CodeEditor />
    </div>
  );
}
