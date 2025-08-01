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
  }
}
