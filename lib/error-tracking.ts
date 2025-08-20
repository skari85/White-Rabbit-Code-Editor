/**
 * White Rabbit Code Editor - Error Tracking Service
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This file provides comprehensive error tracking and monitoring
 * for the White Rabbit Code Editor application.
 */

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  component?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private sessionId: string;
  private userId?: string;
  private errorQueue: ErrorReport[] = [];
  private isOnline = true;

  private constructor() {
    this.sessionId = this.generateSessionId();

    // Only set up browser-specific handlers on the client side
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandlers();
      this.setupNetworkMonitoring();
    }
  }

  static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        component: 'global',
        severity: 'high',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        component: 'promise',
        severity: 'high',
        context: {
          reason: event.reason
        }
      });
    });

    // Handle React errors (if using React error boundaries)
    if (typeof window !== 'undefined') {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        // Check if this is a React error
        const message = args.join(' ');
        if (message.includes('React') || message.includes('component')) {
          this.captureError({
            message: `React Error: ${message}`,
            component: 'react',
            severity: 'medium',
            context: { args }
          });
        }
        originalConsoleError.apply(console, args);
      };
    }
  }

  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  captureError(error: Partial<ErrorReport>): void {
    // Skip error capture on server side
    if (typeof window === 'undefined') {
      return;
    }

    // Filter out non-critical browser errors
    if (this.shouldSkipError(error)) {
      return;
    }

    const errorReport: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message || 'Unknown error',
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      component: error.component || 'unknown',
      severity: error.severity || 'medium',
      context: error.context || {}
    };

    // Add to queue
    this.errorQueue.push(errorReport);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', errorReport);
    }

    // Try to send immediately if online
    if (this.isOnline) {
      this.flushErrorQueue();
    }
  }

  private shouldSkipError(error: Partial<ErrorReport>): boolean {
    const message = error.message || '';
    
    // Skip ResizeObserver errors (common with Monaco Editor and resizable components)
    if (message.includes('ResizeObserver loop completed with undelivered notifications')) {
      return true;
    }
    
    // Skip other common browser errors that aren't critical
    if (message.includes('Script error')) {
      return true;
    }
    
    if (message.includes('ResizeObserver loop limit exceeded')) {
      return true;
    }
    
    // Skip errors from external scripts or browser extensions
    if (message.includes('Extension context invalidated')) {
      return true;
    }
    
    return false;
  }

  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0 || typeof window === 'undefined') return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Send to your error tracking service
      await this.sendErrors(errors);
    } catch (error) {
      // If sending fails, put errors back in queue
      this.errorQueue.unshift(...errors);
      console.warn('Failed to send error reports:', error);
    }
  }

  private async sendErrors(errors: ErrorReport[]): Promise<void> {
    // In a real implementation, you would send to your error tracking service
    // For now, we'll store in localStorage as a fallback
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error_reports') || '[]');
      const allErrors = [...existingErrors, ...errors];
      
      // Keep only the last 100 errors to prevent storage bloat
      const recentErrors = allErrors.slice(-100);
      localStorage.setItem('error_reports', JSON.stringify(recentErrors));

      // In production, you might send to services like:
      // - Sentry
      // - LogRocket
      // - Bugsnag
      // - Your own error tracking endpoint
      
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to your error tracking endpoint
        // await fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(errors)
        // });
      }
    } catch (error) {
      console.warn('Failed to store error reports:', error);
    }
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  addContext(key: string, value: any): void {
    // Add global context that will be included in all future error reports
    if (!window.__errorContext) {
      window.__errorContext = {};
    }
    window.__errorContext[key] = value;
  }

  getErrorReports(): ErrorReport[] {
    if (typeof window === 'undefined') return [];

    try {
      return JSON.parse(localStorage.getItem('error_reports') || '[]');
    } catch {
      return [];
    }
  }

  clearErrorReports(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('error_reports');
  }
}

// Global error context
declare global {
  interface Window {
    __errorContext?: Record<string, any>;
  }
}

// Export singleton instance
export const errorTracker = ErrorTrackingService.getInstance();

// Helper function for manual error reporting
export function reportError(
  message: string, 
  component?: string, 
  severity?: ErrorReport['severity'],
  context?: Record<string, any>
): void {
  errorTracker.captureError({
    message,
    component,
    severity,
    context
  });
}

// Helper function for async error handling
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  component?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      reportError(
        error instanceof Error ? error.message : String(error),
        component,
        'high',
        { args, stack: error instanceof Error ? error.stack : undefined }
      );
      throw error;
    }
  }) as T;
}
