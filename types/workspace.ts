/**
 * Workspace data model types.
 *
 * Minimal but extensible: Workspace > Category > Document/Artifact + PromptState
 * Stored in localStorage (same approach the rest of the app uses).
 */

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export interface Workspace {
  id: string;
  name: string;
  createdAt: string; // ISO date – serialisable to JSON
}

export interface Category {
  id: string;
  workspaceId: string;
  name: string;
  icon?: string; // lucide icon name or emoji
  createdAt: string;
}

export type ArtifactType = 'code' | 'note' | 'file';

export interface Artifact {
  id: string;
  categoryId: string;
  type: ArtifactType;
  title: string;
  content: string; // text content or serialised file reference
  language?: string; // language hint for code artifacts
  createdAt: string;
  updatedAt: string;
}

export interface PromptState {
  categoryId: string;
  instructionsText: string;
  lastUsedAt: string;
}

// ---------------------------------------------------------------------------
// Output / task execution log entries
// ---------------------------------------------------------------------------

export interface OutputEntry {
  id: string;
  categoryId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Aggregate store shape (what lives in localStorage)
// ---------------------------------------------------------------------------

export interface WorkspaceStore {
  workspaces: Workspace[];
  categories: Category[];
  artifacts: Artifact[];
  prompts: PromptState[];
  outputs: OutputEntry[];

  // UI state
  activeWorkspaceId: string | null;
  activeCategoryId: string | null;
}

// ---------------------------------------------------------------------------
// Default seed data
// ---------------------------------------------------------------------------

export const DEFAULT_CATEGORIES: Array<Omit<Category, 'id' | 'workspaceId' | 'createdAt'>> = [
  { name: 'Coding', icon: 'Code2' },
  { name: 'Templates', icon: 'LayoutTemplate' },
  { name: 'Planning', icon: 'ClipboardList' },
  { name: 'Notes', icon: 'StickyNote' },
  { name: 'Exports', icon: 'Download' },
];
