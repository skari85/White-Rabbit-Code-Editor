// Monaco Editor worker setup for Next.js
export function setupMonacoEnvironment() {
  if (typeof window !== 'undefined') {
    // Disable Monaco workers to prevent errors during development
    (self as any).MonacoEnvironment = {
      getWorker: function () {
        // Return a dummy worker to prevent errors
        return new Worker(
          URL.createObjectURL(
            new Blob(['self.onmessage = function() { self.postMessage({}); }'], {
              type: 'application/javascript'
            })
          )
        );
      }
    };
  }
}

// Simple setup that disables problematic features
export function setupSimpleMonacoEnvironment() {
  if (typeof window !== 'undefined') {
    // Handle ResizeObserver errors gracefully
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('ResizeObserver loop completed with undelivered notifications') ||
          message.includes('ResizeObserver loop limit exceeded')) {
        // Suppress ResizeObserver errors - they're not critical
        return;
      }
      originalError.apply(console, args);
    };

    // Create a stable ResizeObserver wrapper
    const originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class StableResizeObserver extends originalResizeObserver {
      private timeoutId: number | null = null;
      private lastSize: { width: number; height: number } | null = null;

      constructor(callback: ResizeObserverCallback) {
        super((entries, observer) => {
          // Debounce resize events to prevent loops
          if (this.timeoutId) {
            clearTimeout(this.timeoutId);
          }

          this.timeoutId = window.setTimeout(() => {
            try {
              // Check if size actually changed significantly
              const entry = entries[0];
              if (entry && entry.contentRect) {
                const { width, height } = entry.contentRect;
                if (!this.lastSize || 
                    Math.abs(this.lastSize.width - width) > 1 || 
                    Math.abs(this.lastSize.height - height) > 1) {
                  this.lastSize = { width, height };
                  callback(entries, observer);
                }
              }
            } catch (error) {
              // Silently handle ResizeObserver errors
              console.warn('ResizeObserver error handled gracefully:', error);
            }
          }, 16); // ~60fps
        });
      }

      disconnect() {
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
        super.disconnect();
      }
    };

    (self as any).MonacoEnvironment = {
      getWorker: () => {
        // Create a minimal worker that doesn't do anything
        const workerBlob = new Blob([
          `
          self.onmessage = function(e) {
            // Basic worker that responds to messages
            self.postMessage({ id: e.data.id, result: null });
          };
          `
        ], { type: 'application/javascript' });
        
        return new Worker(URL.createObjectURL(workerBlob));
      }
    };

    // Add global error handler for ResizeObserver issues
    window.addEventListener('error', (event) => {
      if (event.message?.includes('ResizeObserver')) {
        event.preventDefault();
        return false;
      }
    });

    // Handle unhandled promise rejections related to ResizeObserver
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('ResizeObserver')) {
        event.preventDefault();
        return false;
      }
    });
  }
}
