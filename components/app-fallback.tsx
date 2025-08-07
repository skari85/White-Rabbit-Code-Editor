'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppFallbackProps {
  error?: Error;
  resetError?: () => void;
}

export function AppFallback({ error, resetError }: AppFallbackProps) {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            White Rabbit Code Editor
          </h1>
          <h2 className="text-lg font-semibold text-red-600">
            Application Error
          </h2>
          <p className="text-muted-foreground">
            The application encountered an error and needs to be reloaded.
          </p>
        </div>

        {error && (
          <details className="text-left p-4 bg-muted rounded-lg">
            <summary className="cursor-pointer font-medium mb-2">
              Error Details
            </summary>
            <div className="text-sm text-muted-foreground">
              <div className="mb-2">
                <strong>Message:</strong> {error.message}
              </div>
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="text-xs mt-1 overflow-auto max-h-32 bg-background p-2 rounded">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {resetError && (
            <Button onClick={resetError} variant="default" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
          
          <Button onClick={handleReload} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Reload App
          </Button>
          
          <Button onClick={handleGoHome} variant="outline" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>If this problem persists, please report it on our GitHub repository.</p>
        </div>
      </div>
    </div>
  );
}
