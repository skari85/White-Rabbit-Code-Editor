'use client';

import dynamic from 'next/dynamic';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditorEnhanced = dynamic(
  () => import('./monaco-editor-enhanced').then(mod => ({ default: mod.MonacoEditorEnhanced })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">Loading editor...</p>
        </div>
      </div>
    )
  }
);

export { MonacoEditorEnhanced }; 