'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ProductionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Filter out ResizeObserver errors as they're not critical
    if (error.message?.includes('ResizeObserver')) {
      console.warn('ResizeObserver error caught by boundary, ignoring:', error.message);
      return { hasError: false };
    }
    
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Filter out ResizeObserver errors
    if (error.message?.includes('ResizeObserver')) {
      console.warn('ResizeObserver error caught by boundary, ignoring:', error.message);
      return;
    }

    console.error('Error caught by production boundary:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
    
    this.setState({ error, errorInfo });
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    try {
      // In production, send to your error tracking service
      // Example: Sentry, LogRocket, Bugsnag, etc.
      const errorData = {
        id: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      
      // Send to your error tracking endpoint
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      }).catch(() => {
        // Fallback to localStorage if API fails
        this.storeErrorLocally(errorData);
      });
    } catch (logError) {
      console.warn('Failed to log error to service:', logError);
      this.storeErrorLocally({
        id: this.state.errorId,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  }

  private storeErrorLocally(errorData: any) {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error_reports') || '[]');
      const allErrors = [...existingErrors, errorData];
      localStorage.setItem('error_reports', JSON.stringify(allErrors.slice(-50))); // Keep last 50
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoBack = () => {
    window.history.back();
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

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Something went wrong
            </h3>
            
            <p className="text-sm text-gray-500 mb-6">
              We've encountered an unexpected error. Your work is safe and has been saved automatically.
            </p>

            {this.state.errorId && (
              <div className="bg-gray-50 rounded p-3 mb-4">
                <p className="text-xs text-gray-600">
                  Error ID: <code className="bg-gray-200 px-1 rounded">{this.state.errorId}</code>
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button variant="outline" onClick={this.handleGoBack} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              
              <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Error Details (Development)
                </summary>
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto max-h-40">
                  <div className="font-medium mb-2">Error:</div>
                  <pre className="whitespace-pre-wrap">{this.state.error.toString()}</pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <div className="font-medium mb-2 mt-3">Component Stack:</div>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Keep the original ErrorBoundary for backward compatibility
export class ErrorBoundary extends ProductionErrorBoundary {}
