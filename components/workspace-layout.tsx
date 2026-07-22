'use client';

/**
 * WorkspaceLayout
 *
 * Orchestrates the multi-panel workspace view:
 *   Sidebar | [ TopBar                             ]
 *           | [ EditorPanel | PromptPanel           ]
 *           |               | OutputPanel           ]
 *           |               | ArtifactsPanel        ]
 *
 * Uses the existing `react-resizable-panels` library (already in the project)
 * for drag-to-resize between panels.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';

// Existing UI primitives already in the project
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

// Workspace building blocks
import WorkspaceSidebar from '@/components/workspace-sidebar';
import WorkspaceTopBar from '@/components/workspace-topbar';

// Panel components
import ArtifactsPanel from '@/components/panels/artifacts-panel';
import EditorPanel from '@/components/panels/editor-panel';
import OutputPanel from '@/components/panels/output-panel';
import PromptPanel from '@/components/panels/prompt-panel';
import TaskListPanel from '@/components/panels/task-list-panel';

// BYOK settings (existing component, untouched)
import BYOKAISettings from '@/components/byok-ai-settings';

// Hooks
import { useCodeBuilder } from '@/hooks/use-code-builder';
import { useAIAssistantEnhanced } from '@/hooks/use-ai-assistant-enhanced';
import { useWorkspaceStore } from '@/hooks/use-workspace-store';

// Types
import type { Artifact } from '@/types/workspace';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorkspaceLayout() {
  // ---- workspace store ----
  const ws = useWorkspaceStore();

  // ---- code builder (files in Monaco) – reuse existing hook ----
  const cb = useCodeBuilder();

  // ---- AI / BYOK – reuse existing hook exactly as-is ----
  const ai = useAIAssistantEnhanced();

  // ---- routing ----
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  // ---- local UI state ----
  const [showSettings, setShowSettings] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ---- derived ----
  const workspaceName = ws.activeWorkspace?.name ?? 'Workspace';
  const categoryName = ws.activeCategory?.name ?? 'Category';
  const promptText = ws.promptForCategory?.instructionsText ?? '';
  const routeWorkspaceParam = params?.workspaceId;
  const routeCategoryParam = params?.categoryId;
  const routeWorkspaceId = Array.isArray(routeWorkspaceParam)
    ? routeWorkspaceParam[0]
    : routeWorkspaceParam;
  const routeCategoryId = Array.isArray(routeCategoryParam)
    ? routeCategoryParam[0]
    : routeCategoryParam;
  const artifactsDefaultHeight = Math.max(
    10,
    100 - ws.panelSizes.promptHeight - ws.panelSizes.outputHeight
  );

  // ---- URL sync: apply route params into the workspace store (deep-linking) ----
  useEffect(() => {
    if (!routeWorkspaceId) return;

    const workspaceExists = ws.store.workspaces.some(
      (workspace) => workspace.id === routeWorkspaceId
    );
    if (!workspaceExists) return;

    if (ws.activeWorkspace?.id !== routeWorkspaceId) {
      ws.selectWorkspace(routeWorkspaceId);
      return;
    }

    if (!routeCategoryId) return;
    const categoryExists = ws.store.categories.some(
      (category) =>
        category.workspaceId === routeWorkspaceId &&
        category.id === routeCategoryId
    );

    if (categoryExists && ws.activeCategory?.id !== routeCategoryId) {
      ws.selectCategory(routeCategoryId);
    }
  }, [
    routeWorkspaceId,
    routeCategoryId,
    ws.activeWorkspace,
    ws.activeCategory,
    ws.store.workspaces,
    ws.store.categories,
    ws.selectWorkspace,
    ws.selectCategory,
  ]);

  // ---- URL sync: keep browser URL aligned with store selection ----
  useEffect(() => {
    if (!ws.activeWorkspace || !ws.activeCategory) return;
    const target = `/w/${ws.activeWorkspace.id}/c/${ws.activeCategory.id}`;
    if (pathname !== target) {
      // Replace rather than push to avoid cluttering history on every switch
      router.replace(target, { scroll: false });
    }
  }, [ws.activeWorkspace, ws.activeCategory, pathname, router]);

  // ---- handlers ----

  /** Save: persist current file state + prompt (already auto-persisted, but explicit) */
  const handleSave = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  /** Run Task: send editor content + instructions to the BYOK pipeline, stream to OutputPanel */
  const handleRunTask = useCallback(async () => {
    if (!ai.isConfigured) return;

    setIsRunning(true);
    setStreamingContent('');

    // Build the prompt from editor content + category instructions
    const editorContent = cb.getSelectedFileContent() || '';
    const instructions = ws.promptForCategory?.instructionsText || '';

    // Collect selected artifacts for context
    const artifactContext = ws.artifactsForCategory
      .slice(0, 5) // limit to avoid huge prompts
      .map((a) => `[Artifact: ${a.title}]\n${a.content}`)
      .join('\n\n');

    const combinedPrompt = [
      instructions && `INSTRUCTIONS:\n${instructions}`,
      editorContent && `CURRENT CODE (${cb.selectedFile}):\n\`\`\`\n${editorContent}\n\`\`\``,
      artifactContext && `REFERENCE ARTIFACTS:\n${artifactContext}`,
      'Please process the above and produce the requested output.',
    ]
      .filter(Boolean)
      .join('\n\n');

    // Log the user prompt into outputs (truncated for display)
    ws.addOutput(
      'user',
      combinedPrompt.slice(0, 500) + (combinedPrompt.length > 500 ? '…' : '')
    );

    try {
      // Use the existing BYOK AI pipeline (sendMessage from the hook)
      const response = await ai.sendMessage(combinedPrompt, {
        files: cb.files.map((f) => ({
          name: f.name,
          content: f.content,
          type: f.type,
        })),
        selectedFile: cb.selectedFile,
        appSettings: {},
      });

      const content = response?.content ?? '(empty response)';

      // Log the response into outputs
      ws.addOutput('assistant', content);
      setStreamingContent('');
    } catch (err: any) {
      ws.addOutput('system', `Error: ${err.message ?? 'unknown error'}`);
      setStreamingContent('');
    } finally {
      setIsRunning(false);
    }
  }, [ai, cb, ws]);

  /** Save output text as a new artifact */
  const handleSaveAsArtifact = useCallback(
    (content: string) => {
      ws.addArtifact(
        `Output ${new Date().toLocaleTimeString()}`,
        content,
        'code'
      );
    },
    [ws]
  );

  /** When user clicks an artifact, load it into editor */
  const handleSelectArtifact = useCallback(
    (artifact: Artifact) => {
      const ext = artifact.language ?? 'txt';
      const fileName = artifact.title.includes('.')
        ? artifact.title
        : `${artifact.title}.${ext}`;
      const typeMap: Record<string, any> = {
        js: 'js',
        ts: 'ts',
        tsx: 'tsx',
        html: 'html',
        css: 'css',
        json: 'json',
        md: 'md',
        py: 'py',
        txt: 'txt',
      };
      const exists = cb.files.some((f) => f.name === fileName);
      if (!exists) {
        cb.addNewFile(fileName, typeMap[ext] ?? 'txt');
      }
      setTimeout(() => cb.updateFileContent(fileName, artifact.content), 0);
      cb.setSelectedFile(fileName);
    },
    [cb]
  );

  // Track unsaved state
  const handleEditorChange = useCallback(
    (name: string, content: string) => {
      cb.updateFileContent(name, content);
      setHasUnsavedChanges(true);
    },
    [cb]
  );

  // ---- render ----

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-200 overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* ====== Sidebar (resizable) ====== */}
        <ResizablePanel
          defaultSize={ws.panelSizes.sidebarWidth}
          minSize={10}
          maxSize={25}
          onResize={(size) => ws.savePanelSizes({ sidebarWidth: size })}
        >
          <WorkspaceSidebar
            workspaces={ws.store.workspaces}
            activeWorkspace={ws.activeWorkspace}
            categories={ws.categoriesForWorkspace}
            activeCategory={ws.activeCategory}
            onSelectWorkspace={ws.selectWorkspace}
            onCreateWorkspace={ws.createWorkspace}
            onRenameWorkspace={ws.renameWorkspace}
            onDeleteWorkspace={ws.deleteWorkspace}
            onSelectCategory={ws.selectCategory}
            onCreateCategory={ws.createCategory}
            onRenameCategory={ws.renameCategory}
            onDeleteCategory={ws.deleteCategory}
          />
        </ResizablePanel>

        <ResizableHandle />

        {/* ====== Main area ====== */}
        <ResizablePanel defaultSize={100 - ws.panelSizes.sidebarWidth} minSize={50}>
          <div className="flex flex-col h-full min-w-0">
            {/* Top bar */}
            <WorkspaceTopBar
              workspaceName={workspaceName}
              categoryName={categoryName}
              isBYOKConfigured={ai.isConfigured}
              isRunning={isRunning}
              hasUnsavedChanges={hasUnsavedChanges}
              onRunTask={handleRunTask}
              onSave={handleSave}
              onOpenSettings={() => setShowSettings(true)}
            />

            {/* Panels area (resizable) */}
            <div className="flex-1 min-h-0">
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* ---- Left: Editor ---- */}
                <ResizablePanel
                  defaultSize={ws.panelSizes.editorWidth}
                  minSize={25}
                  onResize={(size) => ws.savePanelSizes({ editorWidth: size })}
                >
                  <EditorPanel
                    files={cb.files}
                    selectedFile={cb.selectedFile}
                    onSelectFile={cb.setSelectedFile}
                    onUpdateContent={handleEditorChange}
                    onAddFile={cb.addNewFile}
                    onDeleteFile={cb.deleteFile}
                    theme="vs-dark"
                  />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* ---- Right: Prompt + Output + Artifacts (vertical stack) ---- */}
                <ResizablePanel
                  defaultSize={100 - ws.panelSizes.editorWidth}
                  minSize={20}
                >
                  <ResizablePanelGroup direction="vertical" className="h-full">
                    {/* Prompt / Instructions */}
                    <ResizablePanel
                      defaultSize={ws.panelSizes.promptHeight}
                      minSize={10}
                      onResize={(size) => ws.savePanelSizes({ promptHeight: size })}
                    >
                      <PromptPanel
                        instructionsText={promptText}
                        onInstructionsChange={ws.updatePrompt}
                        categoryName={categoryName}
                      />
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Output / Logs */}
                    <ResizablePanel
                      defaultSize={ws.panelSizes.outputHeight}
                      minSize={10}
                      onResize={(size) => ws.savePanelSizes({ outputHeight: size })}
                    >
                      <OutputPanel
                        outputs={ws.outputsForCategory}
                        onClear={ws.clearOutputs}
                        onSaveAsArtifact={handleSaveAsArtifact}
                        streamingContent={streamingContent}
                        isStreaming={isRunning}
                      />
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Artifacts + Tasks (tabbed bottom section) */}
                    <ResizablePanel defaultSize={artifactsDefaultHeight} minSize={10}>
                      <BottomTabs
                        artifacts={ws.artifactsForCategory}
                        onSelectArtifact={handleSelectArtifact}
                        onDeleteArtifact={ws.deleteArtifact}
                        onRenameArtifact={(id, title) =>
                          ws.updateArtifact(id, { title })
                        }
                        categoryId={ws.activeCategory?.id ?? ''}
                      />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* ====== BYOK Settings Modal (untouched) ====== */}
      <BYOKAISettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentSettings={ai.settings}
        onSaveSettings={ai.saveSettings}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// BottomTabs – Artifacts + Tasks in a simple tab view
// ---------------------------------------------------------------------------

function BottomTabs({
  artifacts,
  onSelectArtifact,
  onDeleteArtifact,
  onRenameArtifact,
  categoryId,
}: {
  artifacts: Artifact[];
  onSelectArtifact: (a: Artifact) => void;
  onDeleteArtifact: (id: string) => void;
  onRenameArtifact: (id: string, title: string) => void;
  categoryId: string;
}) {
  const [tab, setTab] = React.useState<'artifacts' | 'tasks'>('artifacts');

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-zinc-900 border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setTab('artifacts')}
          className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
            tab === 'artifacts'
              ? 'bg-zinc-800 text-zinc-200'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Artifacts
        </button>
        <button
          type="button"
          onClick={() => setTab('tasks')}
          className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
            tab === 'tasks'
              ? 'bg-zinc-800 text-zinc-200'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Tasks
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {tab === 'artifacts' ? (
          <ArtifactsPanel
            artifacts={artifacts}
            onSelect={onSelectArtifact}
            onDelete={onDeleteArtifact}
            onRename={onRenameArtifact}
          />
        ) : (
          <TaskListPanel categoryId={categoryId} />
        )}
      </div>
    </div>
  );
}
