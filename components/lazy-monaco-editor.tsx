'use client';

import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Loader2, Code } from 'lucide-react';

// Lazy load Monaco Editor
const MonacoEditor = lazy(() => import('./simple-code-editor'));

interface LazyMonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: string;
  height?: string;
  className?: string;
  readOnly?: boolean;
}

// Loading component for Monaco Editor
const MonacoEditorLoading = () => (
  <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-50 border rounded-lg">
    <div className="text-center">
      <div className="relative">
        <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin absolute -top-1 -right-1" />
      </div>
      <p className="text-gray-600 font-medium">Loading Code Editor...</p>
      <p className="text-gray-500 text-sm mt-1">Preparing Monaco Editor</p>
    </div>
  </div>
);

// Error fallback component
const MonacoEditorError = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="flex items-center justify-center h-full min-h-[400px] bg-red-50 border border-red-200 rounded-lg">
    <div className="text-center p-6">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Code className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-red-800 font-semibold mb-2">Editor Failed to Load</h3>
      <p className="text-red-600 text-sm mb-4">
        {error.message || 'An error occurred while loading the code editor'}
      </p>
      <button
        onClick={retry}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

export default function LazyMonacoEditor(props: LazyMonacoEditorProps) {
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = () => {
    setLoadError(null);
    setRetryKey(prev => prev + 1);
  };

  // Error boundary for Monaco Editor
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.filename?.includes('monaco') || event.message?.includes('monaco')) {
        setLoadError(new Error(event.message));
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (loadError) {
    return <MonacoEditorError error={loadError} retry={handleRetry} />;
  }

  // Map custom themes to Monaco themes
  const getMonacoTheme = (customTheme: string) => {
    switch (customTheme) {
      case 'hex-light':
        return 'light';
      case 'kex-dark':
        return 'vs-dark';
      default:
        return customTheme;
    }
  };

  // Update props with proper theme mapping
  const updatedProps = {
    ...props,
    theme: getMonacoTheme(props.theme || 'vs-dark')
  };

  return (
    <Suspense key={retryKey} fallback={<MonacoEditorLoading />}>
      <MonacoEditor {...updatedProps} />
    </Suspense>
  );
}
