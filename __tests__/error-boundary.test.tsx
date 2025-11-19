/**
 * Error Boundary Tests
 * Ensures error handling works properly in privacy-first console
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../components/error-boundary';

// Component that throws an error
const ErrorThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for privacy-first testing');
  }
  return <div>No error here</div>;
};

// Component that throws ResizeObserver error (should be ignored)
const ResizeObserverErrorComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    const error = new Error('ResizeObserver loop completed with undelivered notifications');
    throw error;
  }
  return <div>ResizeObserver test</div>;
};

describe('ErrorBoundary - Privacy First', () => {
  beforeEach(() => {
    // Mock console methods to avoid test output noise
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders custom fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  it('ignores ResizeObserver errors for privacy-first UX', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Test that component renders normally with ResizeObserver error
    // This test verifies the error boundary's filtering behavior
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );

    // Simulate a ResizeObserver error being caught
    const resizeObserverError = new Error('ResizeObserver loop completed with undelivered notifications');
    
    // Test getDerivedStateFromError static method directly
    const stateResult = ErrorBoundary.getDerivedStateFromError(resizeObserverError);
    
    // Should return hasError: false to ignore the error
    expect(stateResult.hasError).toBe(false);
    
    // Test componentDidCatch handles the error properly
    const boundary = new ErrorBoundary({ children: null });
    boundary.componentDidCatch(resizeObserverError, { componentStack: 'test stack' });
    
    // Verify that the ResizeObserver error was logged as ignored
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('ResizeObserver error caught by boundary, ignoring:'),
      expect.stringContaining('ResizeObserver loop completed with undelivered notifications')
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });

  it('generates unique error IDs for tracking', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // The error ID is split across elements, so check for the "Error ID:" text and the code element separately
    expect(screen.getByText('Error ID:')).toBeInTheDocument();
    
    // Check that there's a code element containing the error ID pattern
    const errorCodeElement = screen.getByText((content) => {
      return content.match(/^error_\d+_[a-z0-9]+$/) !== null;
    });
    expect(errorCodeElement).toBeInTheDocument();
  });

  it('shows error details in development mode only', () => {
    // Mock process.env for testing
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'development' },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();

    // Restore original environment
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: originalEnv },
      writable: true,
    });
  });

  it('hides error details in production mode', () => {
    // Mock process.env for testing
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'production' },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument();

    // Restore original environment
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: originalEnv },
      writable: true,
    });
  });
});
