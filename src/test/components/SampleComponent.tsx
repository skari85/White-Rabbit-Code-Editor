'use client';

import { cn } from '@/lib/utils';
import React, { useCallback, useState } from 'react';

interface SampleComponentProps {
  text?: string;
  onClick?: () => void;
  className?: string;
  asyncOperation?: () => Promise<string>;
}

export const SampleComponent: React.FC<SampleComponentProps> = ({
  text = 'Default Text',
  onClick,
  className,
  asyncOperation,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsyncOperation = useCallback(async () => {
    if (!asyncOperation) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await asyncOperation();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [asyncOperation]);

  return (
    <div
      data-testid="sample-component"
      className={cn(
        'p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800',
        className
      )}
    >
      <h2 className="text-lg font-semibold mb-2">{text}</h2>
      
      <div className="space-y-2">
        {onClick && (
          <button
            onClick={onClick}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Click Me
          </button>
        )}

        {asyncOperation && (
          <button
            onClick={handleAsyncOperation}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Loading...' : 'Load Data'}
          </button>
        )}
      </div>

      {isLoading && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Loading...
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
          Data loaded: {result}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
};
