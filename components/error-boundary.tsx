'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'feature';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Filter out ResizeObserver errors as they're not critical
    if (error.message?.includes('ResizeObserver')) {
      console.warn('ResizeObserver error caught by boundary, ignoring:', error.message);
      return { hasError: false };
    }
    
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Filter out ResizeObserver errors
    if (error.message?.includes('ResizeObserver')) {
      console.warn('ResizeObserver error caught by boundary, ignoring:', error.message);
      return;
    }

    this.setState({
      error,
      errorInfo
    });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (if available)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Here you could integrate with error tracking services like Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('hex-kex-errors') || '[]');
      existingErrors.push(errorReport);
      // Keep only last 10 errors
      const recentErrors = existingErrors.slice(-10);
      localStorage.setItem('hex-kex-errors', JSON.stringify(recentErrors));
    } catch (e) {
      console.error('Failed to store error report:', e);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private copyErrorDetails = async () => {
    const { error, errorInfo, errorId } = this.state;
    const errorDetails = `
Error ID: ${errorId}
Time: ${new Date().toISOString()}
Message: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorDetails);
      // Could show a toast notification here
    } catch (e) {
      console.error('Failed to copy error details:', e);
    }
  };

  private reportIssue = () => {
    const { error, errorId } = this.state;
    const issueTitle = encodeURIComponent(`Bug Report: ${error?.message || 'Unknown Error'}`);
    const issueBody = encodeURIComponent(`
**Error ID:** ${errorId}
**Error Message:** ${error?.message}
**Steps to Reproduce:** 
1. 
2. 
3. 

**Expected Behavior:** 

**Actual Behavior:** 

**Additional Context:** 
- Browser: ${navigator.userAgent}
- URL: ${window.location.href}
- Time: ${new Date().toISOString()}
    `);
    
    const githubUrl = `https://github.com/skari85/pwa-code/issues/new?title=${issueTitle}&body=${issueBody}`;
    window.open(githubUrl, '_blank');
  };

  render() {
    if (this.state.hasError) {
      // Filter out ResizeObserver errors from rendering fallback
      if (this.state.error?.message?.includes('ResizeObserver')) {
        return this.props.children;
      }

      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId } = this.state;
      const { level = 'component', showDetails = true } = this.props;

      return (
        <div className="flex items-center justify-center min-h-[200px] p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              {level === 'page' ? 'Page Error' : level === 'feature' ? 'Feature Error' : 'Something went wrong'}
            </h2>
            
            <p className="text-red-600 mb-4">
              {level === 'page' 
                ? 'The page encountered an error and cannot be displayed.'
                : level === 'feature'
                ? 'This feature is temporarily unavailable due to an error.'
                : 'A component error occurred. You can try refreshing or continue using other features.'
              }
            </p>

            {showDetails && error && (
              <details className="text-left mb-4 p-3 bg-red-100 rounded border">
                <summary className="cursor-pointer text-red-700 font-medium mb-2">
                  Error Details
                </summary>
                <div className="text-sm text-red-600 space-y-2">
                  <div>
                    <strong>Error:</strong> {error.message}
                  </div>
                  <div>
                    <strong>ID:</strong> {errorId}
                  </div>
                  {errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="text-xs mt-1 overflow-auto max-h-32 bg-red-50 p-2 rounded">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              {level === 'page' && (
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
              )}
              
              {showDetails && (
                <>
                  <Button
                    onClick={this.copyErrorDetails}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Details
                  </Button>
                  
                  <Button
                    onClick={this.reportIssue}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Bug className="w-4 h-4" />
                    Report Issue
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}
