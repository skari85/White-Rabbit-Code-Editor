// Monaco Editor environment setup for Next.js
//
// Monaco is self-hosted from public/monaco-vs (see monaco-editor-client.tsx's
// loader.config + MonacoEnvironment.getWorkerUrl override, and
// scripts/copy-monaco.cjs) instead of fetched from @monaco-editor/react's
// default CDN loader. This file just needs to quiet the benign ResizeObserver
// warning Monaco's layout triggers on some browsers — critically, it must NOT
// stub out MonacoEnvironment.getWorker with a dummy no-op worker, which is
// what previously broke language services and surfaced as "Monaco
// initialization" errors.
export function setupSimpleMonacoEnvironment() {
  if (typeof window === 'undefined') return;

  const originalError = console.error;
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes(
        'ResizeObserver loop completed with undelivered notifications'
      ) ||
      message.includes('ResizeObserver loop limit exceeded')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  window.addEventListener('error', event => {
    if (event.message?.includes('ResizeObserver')) {
      event.preventDefault();
    }
  });
}
