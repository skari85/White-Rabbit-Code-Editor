'use client';

import { useCallback, useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type {
  Artifact,
  ArtifactType,
  Category,
  OutputEntry,
  PromptState,
  Workspace,
  WorkspaceStore,
} from '@/types/workspace';
import { DEFAULT_CATEGORIES } from '@/types/workspace';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'wr-workspace-store';
const PANEL_SIZES_KEY = 'wr-panel-sizes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function loadStore(): WorkspaceStore | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorkspaceStore;
  } catch {
    return null;
  }
}

function persistStore(store: WorkspaceStore) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Failed to persist workspace store', e);
  }
}

/** Create a fresh default workspace with seed categories. */
function createDefaultStore(): WorkspaceStore {
  const workspaceId = uuid();
  const ts = now();

  const workspace: Workspace = {
    id: workspaceId,
    name: 'My Workspace',
    createdAt: ts,
  };

  const categories: Category[] = DEFAULT_CATEGORIES.map((c) => ({
    id: uuid(),
    workspaceId,
    name: c.name,
    icon: c.icon,
    createdAt: ts,
  }));

  return {
    workspaces: [workspace],
    categories,
    artifacts: [],
    prompts: [],
    outputs: [],
    activeWorkspaceId: workspaceId,
    activeCategoryId: categories[0]?.id ?? null,
  };
}

// ---------------------------------------------------------------------------
// Panel sizes helper
// ---------------------------------------------------------------------------

export interface PanelSizes {
  sidebarWidth: number; // percentage
  editorWidth: number;
  promptHeight: number;
  outputHeight: number;
}

const DEFAULT_PANEL_SIZES: PanelSizes = {
  sidebarWidth: 18,
  editorWidth: 45,
  promptHeight: 50,
  outputHeight: 50,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizePanelSizes(sizes: PanelSizes): PanelSizes {
  const normalized: PanelSizes = {
    sidebarWidth: clamp(sizes.sidebarWidth, 10, 25),
    editorWidth: clamp(sizes.editorWidth, 25, 80),
    promptHeight: clamp(sizes.promptHeight, 10, 80),
    outputHeight: clamp(sizes.outputHeight, 10, 80),
  };

  // Keep room for the artifacts/tasks panel in the right column.
  const maxCombinedHeight = 90;
  const combined = normalized.promptHeight + normalized.outputHeight;
  if (combined > maxCombinedHeight) {
    const scale = maxCombinedHeight / combined;
    normalized.promptHeight = Math.round(normalized.promptHeight * scale);
    normalized.outputHeight = Math.round(normalized.outputHeight * scale);
  }

  return normalized;
}

function loadPanelSizes(): PanelSizes {
  if (typeof window === 'undefined') return DEFAULT_PANEL_SIZES;
  try {
    const raw = localStorage.getItem(PANEL_SIZES_KEY);
    if (!raw) return DEFAULT_PANEL_SIZES;
    return normalizePanelSizes({ ...DEFAULT_PANEL_SIZES, ...JSON.parse(raw) });
  } catch {
    return DEFAULT_PANEL_SIZES;
  }
}

function persistPanelSizes(sizes: PanelSizes) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PANEL_SIZES_KEY, JSON.stringify(sizes));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWorkspaceStore() {
  const [store, setStore] = useState<WorkspaceStore>(() => {
    const saved = loadStore();
    return saved ?? createDefaultStore();
  });

  const [panelSizes, setPanelSizesState] = useState<PanelSizes>(loadPanelSizes);

  // Persist store on every change
  useEffect(() => {
    persistStore(store);
  }, [store]);

  // Re-hydrate on mount (covers SSR/hydration) + auto-migrate legacy project data
  useEffect(() => {
    const saved = loadStore();
    if (saved) {
      setStore(saved);
    }

    // ---------- Migration from single-project mode ----------
    // If the user has existing project data in the old `white-rabbit-project`
    // localStorage key but no artifacts in the workspace store, we import
    // those files as artifacts in the default "Coding" category.
    try {
      const migrated = localStorage.getItem('wr-migration-v1-done');
      if (migrated) return;

      const legacyRaw = localStorage.getItem('white-rabbit-project');
      if (!legacyRaw) return;

      const legacyProject = JSON.parse(legacyRaw);
      if (!legacyProject?.files || !Array.isArray(legacyProject.files)) return;

      const currentStore = loadStore() ?? store;
      // Find the first "Coding" category in the active workspace
      const codingCat = currentStore.categories.find(
        (c) =>
          c.workspaceId === currentStore.activeWorkspaceId &&
          c.name === 'Coding'
      );
      if (!codingCat) return;

      const newArtifacts = legacyProject.files.map((f: any) => ({
        id: `migrated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        categoryId: codingCat.id,
        type: 'code' as const,
        title: f.name ?? 'untitled',
        content: f.content ?? '',
        language: f.type ?? 'txt',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      if (newArtifacts.length > 0) {
        setStore((prev) => ({
          ...prev,
          artifacts: [...prev.artifacts, ...newArtifacts],
        }));
      }

      localStorage.setItem('wr-migration-v1-done', '1');
    } catch {
      // migration is best-effort
    }
  }, []);

  // ------ derived getters ------

  const activeWorkspace = store.workspaces.find(
    (w) => w.id === store.activeWorkspaceId
  ) ?? store.workspaces[0] ?? null;

  const categoriesForWorkspace = store.categories.filter(
    (c) => c.workspaceId === store.activeWorkspaceId
  );

  const activeCategory = store.categories.find(
    (c) => c.id === store.activeCategoryId
  ) ?? categoriesForWorkspace[0] ?? null;

  const artifactsForCategory = store.artifacts.filter(
    (a) => a.categoryId === store.activeCategoryId
  );

  const promptForCategory: PromptState | null =
    store.prompts.find((p) => p.categoryId === store.activeCategoryId) ?? null;

  const outputsForCategory = store.outputs.filter(
    (o) => o.categoryId === store.activeCategoryId
  );

  // ------ workspace CRUD ------

  const createWorkspace = useCallback((name: string): Workspace => {
    const ws: Workspace = { id: uuid(), name, createdAt: now() };
    const cats: Category[] = DEFAULT_CATEGORIES.map((c) => ({
      id: uuid(),
      workspaceId: ws.id,
      name: c.name,
      icon: c.icon,
      createdAt: now(),
    }));
    setStore((prev) => ({
      ...prev,
      workspaces: [...prev.workspaces, ws],
      categories: [...prev.categories, ...cats],
      activeWorkspaceId: ws.id,
      activeCategoryId: cats[0]?.id ?? null,
    }));
    return ws;
  }, []);

  const renameWorkspace = useCallback((id: string, name: string) => {
    setStore((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((w) =>
        w.id === id ? { ...w, name } : w
      ),
    }));
  }, []);

  const deleteWorkspace = useCallback((id: string) => {
    setStore((prev) => {
      const remaining = prev.workspaces.filter((w) => w.id !== id);
      const catIds = prev.categories.filter((c) => c.workspaceId === id).map((c) => c.id);
      const remainingCategories = prev.categories.filter((c) => c.workspaceId !== id);
      const nextActiveWorkspaceId =
        prev.activeWorkspaceId === id
          ? (remaining[0]?.id ?? null)
          : prev.activeWorkspaceId;
      const nextActiveCategoryId = remainingCategories.find(
        (c) => c.workspaceId === nextActiveWorkspaceId
      )?.id ?? null;

      return {
        ...prev,
        workspaces: remaining,
        categories: remainingCategories,
        artifacts: prev.artifacts.filter((a) => !catIds.includes(a.categoryId)),
        prompts: prev.prompts.filter((p) => !catIds.includes(p.categoryId)),
        outputs: prev.outputs.filter((o) => !catIds.includes(o.categoryId)),
        activeWorkspaceId: nextActiveWorkspaceId,
        activeCategoryId: nextActiveCategoryId,
      };
    });
  }, []);

  const selectWorkspace = useCallback((id: string) => {
    setStore((prev) => {
      const workspaceExists = prev.workspaces.some((w) => w.id === id);
      if (!workspaceExists) return prev;

      const firstCat = prev.categories.find((c) => c.workspaceId === id);
      return {
        ...prev,
        activeWorkspaceId: id,
        activeCategoryId: firstCat?.id ?? null,
      };
    });
  }, []);

  // ------ category CRUD ------

  const createCategory = useCallback(
    (name: string, icon?: string): Category => {
      const cat: Category = {
        id: uuid(),
        workspaceId: store.activeWorkspaceId!,
        name,
        icon,
        createdAt: now(),
      };
      setStore((prev) => ({
        ...prev,
        categories: [...prev.categories, cat],
        activeCategoryId: cat.id,
      }));
      return cat;
    },
    [store.activeWorkspaceId]
  );

  const renameCategory = useCallback((id: string, name: string) => {
    setStore((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === id ? { ...c, name } : c
      ),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setStore((prev) => {
      const targetCategory = prev.categories.find((c) => c.id === id);
      if (!targetCategory) return prev;

      const sameWorkspaceCount = prev.categories.filter(
        (c) => c.workspaceId === targetCategory.workspaceId
      ).length;

      // Prevent removing the final category from a workspace.
      if (sameWorkspaceCount <= 1) return prev;

      const remaining = prev.categories.filter((c) => c.id !== id);
      const firstInWorkspace = remaining.find(
        (c) => c.workspaceId === targetCategory.workspaceId
      );

      return {
        ...prev,
        categories: remaining,
        artifacts: prev.artifacts.filter((a) => a.categoryId !== id),
        prompts: prev.prompts.filter((p) => p.categoryId !== id),
        outputs: prev.outputs.filter((o) => o.categoryId !== id),
        activeCategoryId:
          prev.activeCategoryId === id
            ? (firstInWorkspace?.id ?? null)
            : prev.activeCategoryId,
      };
    });
  }, []);

  const selectCategory = useCallback((id: string) => {
    setStore((prev) => ({
      ...prev,
      activeCategoryId: id,
    }));
  }, []);

  // ------ prompt state ------

  const updatePrompt = useCallback((text: string) => {
    setStore((prev) => {
      const catId = prev.activeCategoryId;
      if (!catId) return prev;
      const existing = prev.prompts.findIndex((p) => p.categoryId === catId);
      const entry: PromptState = {
        categoryId: catId,
        instructionsText: text,
        lastUsedAt: now(),
      };
      const prompts = [...prev.prompts];
      if (existing >= 0) {
        prompts[existing] = entry;
      } else {
        prompts.push(entry);
      }
      return { ...prev, prompts };
    });
  }, []);

  // ------ artifacts ------

  const addArtifact = useCallback(
    (title: string, content: string, type: ArtifactType = 'code', language?: string): Artifact => {
      const a: Artifact = {
        id: uuid(),
        categoryId: store.activeCategoryId!,
        type,
        title,
        content,
        language,
        createdAt: now(),
        updatedAt: now(),
      };
      setStore((prev) => ({
        ...prev,
        artifacts: [...prev.artifacts, a],
      }));
      return a;
    },
    [store.activeCategoryId]
  );

  const updateArtifact = useCallback((id: string, updates: Partial<Pick<Artifact, 'title' | 'content' | 'language'>>) => {
    setStore((prev) => ({
      ...prev,
      artifacts: prev.artifacts.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: now() } : a
      ),
    }));
  }, []);

  const deleteArtifact = useCallback((id: string) => {
    setStore((prev) => ({
      ...prev,
      artifacts: prev.artifacts.filter((a) => a.id !== id),
    }));
  }, []);

  // ------ output log ------

  const addOutput = useCallback(
    (role: OutputEntry['role'], content: string): OutputEntry => {
      const entry: OutputEntry = {
        id: uuid(),
        categoryId: store.activeCategoryId!,
        role,
        content,
        timestamp: now(),
      };
      setStore((prev) => ({
        ...prev,
        outputs: [...prev.outputs, entry],
      }));
      return entry;
    },
    [store.activeCategoryId]
  );

  const clearOutputs = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      outputs: prev.outputs.filter(
        (o) => o.categoryId !== prev.activeCategoryId
      ),
    }));
  }, []);

  // ------ panel sizes ------

  const savePanelSizes = useCallback((sizes: Partial<PanelSizes>) => {
    setPanelSizesState((prev) => {
      const next = normalizePanelSizes({ ...prev, ...sizes });
      persistPanelSizes(next);
      return next;
    });
  }, []);

  // ------ public API ------

  return {
    // full store (for debug / migration)
    store,

    // derived
    activeWorkspace,
    activeCategory,
    categoriesForWorkspace,
    artifactsForCategory,
    promptForCategory,
    outputsForCategory,

    // workspace
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
    selectWorkspace,

    // category
    createCategory,
    renameCategory,
    deleteCategory,
    selectCategory,

    // prompt
    updatePrompt,

    // artifacts
    addArtifact,
    updateArtifact,
    deleteArtifact,

    // output
    addOutput,
    clearOutputs,

    // panel sizes
    panelSizes,
    savePanelSizes,
  };
}
