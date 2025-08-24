'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  XCircle, 
  Info, 
  RefreshCw, 
  Copy, 
  ExternalLink,
  Bug,
  Wifi,
  Server,
  FileX
} from 'lucide-react';

export type ErrorType = 'network' | 'server' | 'validation' | 'file' | 'ai' | 'auth' | 'generic';

interface ErrorDisplayProps {
  error: Error | string;
  type?: ErrorType;
  title?: string;
  description?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
  variant?: 'alert' | 'card' | 'inline';
}

const errorIcons = {
  network: Wifi,
  server: Server,
  validation: AlertTriangle,
  file: FileX,
  ai: Bug,
  auth: XCircle,
  generic: AlertTriangle
};

const errorMessages = {
  network: {
    title: 'Connection Error',
    description: 'Unable to connect to the server. Please check your internet connection.'
  },
  server: {
    title: 'Server Error',
    description: 'The server encountered an error. Please try again later.'
  },
  validation: {
    title: 'Validation Error',
    description: 'Please check your input and try again.'
  },
  file: {
    title: 'File Error',
    description: 'Unable to process the file. Please check the file format and try again.'
  },
  ai: {
    title: 'AI Service Error',
    description: 'The AI service is temporarily unavailable. Please try again.'
  },
  auth: {
    title: 'Authentication Error',
    description: 'Please sign in to continue.'
  },
  generic: {
    title: 'Error',
    description: 'An unexpected error occurred.'
  }
};

export function ErrorDisplay({
  error,
  type = 'generic',
  title,
  description,
  onRetry,
  onDismiss,
  showDetails = false,
  className,
  variant = 'alert'
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' ? error.stack : undefined;
  
  const Icon = errorIcons[type];
  const defaultMessage = errorMessages[type];
  
  const finalTitle = title || defaultMessage.title;
  const finalDescription = description || defaultMessage.description;

  const copyErrorDetails = () => {
    const details = `Error: ${errorMessage}\n${errorStack || ''}`;
    navigator.clipboard.writeText(details);
  };

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-destructive", className)}>
        <Icon className="w-4 h-4" />
        <span>{errorMessage}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Icon className="w-5 h-5" />
            {finalTitle}
          </CardTitle>
          <CardDescription>{finalDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showDetails && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-mono text-muted-foreground break-all">
                {errorMessage}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            {showDetails && (
              <Button variant="ghost" onClick={copyErrorDetails}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Details
              </Button>
            )}
            {onDismiss && (
              <Button variant="ghost" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Alert variant="destructive" className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{finalTitle}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{finalDescription}</p>
        {showDetails && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium">
              Technical Details
            </summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
              {errorMessage}
            </pre>
          </details>
        )}
        <div className="flex gap-2 mt-3">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Specialized error components
export function NetworkError({ onRetry, ...props }: Omit<ErrorDisplayProps, 'type'>) {
  return <ErrorDisplay type="network" onRetry={onRetry} {...props} />;
}

export function AIError({ onRetry, ...props }: Omit<ErrorDisplayProps, 'type'>) {
  return <ErrorDisplay type="ai" onRetry={onRetry} {...props} />;
}

export function FileError({ onRetry, ...props }: Omit<ErrorDisplayProps, 'type'>) {
  return <ErrorDisplay type="file" onRetry={onRetry} {...props} />;
}

export function ValidationError({ ...props }: Omit<ErrorDisplayProps, 'type'>) {
  return <ErrorDisplay type="validation" variant="inline" {...props} />;
}

// Error boundary fallback
export function ErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void; 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <ErrorDisplay
        error={error}
        type="generic"
        title="Application Error"
        description="Something went wrong with the application."
        onRetry={resetError}
        showDetails={true}
        variant="card"
        className="max-w-md"
      />
    </div>
  );
}
