'use client';

import WorkspaceLayout from '@/components/workspace-layout';
import { ErrorBoundary } from '@/components/error-boundary';

/**
 * /w — Workspace root.
 *
 * Renders the full workspace layout. The store manages active
 * workspace/category selection internally via localStorage, so
 * no redirect logic is needed — this just renders the layout.
 */
export default function WorkspaceRootPage() {
  return (
    <ErrorBoundary>
      <WorkspaceLayout />
    </ErrorBoundary>
  );
}
