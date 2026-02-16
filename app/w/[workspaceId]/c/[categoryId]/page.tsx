'use client';

import WorkspaceLayout from '@/components/workspace-layout';
import { ErrorBoundary } from '@/components/error-boundary';

/**
 * Workspace / Category page.
 *
 * The actual workspace and category selection is handled by the
 * useWorkspaceStore hook (localStorage-based), so the URL params
 * are primarily for deep-linking and bookmarking. The layout
 * component syncs with the store on mount.
 */
export default function WorkspaceCategoryPage() {
  return (
    <ErrorBoundary>
      <WorkspaceLayout />
    </ErrorBoundary>
  );
}
