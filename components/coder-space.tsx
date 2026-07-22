'use client';

/**
 * White Rabbit Code Editor - Coder Space
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 *
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 *
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

import { AISettingsPanel } from '@/components/ai-settings-panel';
import MonacoEditorClient from '@/components/monaco-editor-client';
import PublishModal from '@/components/publish-modal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FileContent } from '@/hooks/use-code-builder';
import { useAIAssistant } from '@/hooks/use-ai-assistant';
import { AIService } from '@/lib/ai-service';
import {
  ConsoleEntry,
  PROMPT_OPTIMIZER_SYSTEM_PROMPT,
  SPACE_SYSTEM_PROMPT,
  SPACE_TEMPLATES,
  SpaceProject,
  buildPreviewHtml,
  decodeProjectFromHash,
  encodeProjectToHash,
  fileTypeFromName,
  monacoLanguageFromName,
  parseFilesFromAIResponse,
  parseStreamingAIResponse,
  templateToFiles,
  upsertProject,
} from '@/lib/space-engine';
import JSZip from 'jszip';
import {
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
  Plus,
  Rocket,
  Send,
  Settings,
  Share2,
  Sparkles,
  Square,
  Terminal,
  Undo2,
  Wand2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const PROJECTS_STORAGE_KEY = 'wr-space-projects';
const LEGACY_PROJECT_KEY = 'wr-space-project';

function newProjectId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Read the project list, migrating the old single-project slot once. */
function loadProjects(): SpaceProject[] {
  if (typeof window === 'undefined') return [];
  let projects: SpaceProject[] = [];
  try {
    const parsed = JSON.parse(
      localStorage.getItem(PROJECTS_STORAGE_KEY) || '[]'
    );
    if (Array.isArray(parsed)) {
      projects = parsed.filter(
        p => p?.id && p?.name && Array.isArray(p.files) && p.files.length
      );
    }
  } catch {
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
  }
  try {
    const legacyRaw = localStorage.getItem(LEGACY_PROJECT_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      if (legacy?.name && Array.isArray(legacy.files) && legacy.files.length) {
        projects = upsertProject(projects, {
          id: newProjectId(),
          name: legacy.name,
          updatedAt: Date.now(),
          files: legacy.files,
        });
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
      }
      localStorage.removeItem(LEGACY_PROJECT_KEY);
    }
  } catch {
    localStorage.removeItem(LEGACY_PROJECT_KEY);
  }
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

function timeAgo(timestamp: number): string {
  const mins = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const AI_FILE_INSTRUCTION =
  'Respond with complete files only, each in a fenced code block whose info ' +
  'string is the language followed by `// filename` (e.g. ```html // index.html). ' +
  'Include every file that needs to change, in full.';

const HINT_DISMISSED_KEY = 'wr-space-hint-dismissed';

// One-tap prompt ideas per template — the fastest possible next step,
// so there is never a blank-prompt moment.
const IDEA_CHIPS: Record<string, string[]> = {
  blank: [
    'Make a colorful todo list',
    'Add a button that does something fun',
    'Center everything beautifully',
  ],
  landing: [
    'Add a pricing section',
    'Give it a pastel color scheme',
    'Add a FAQ with 3 questions',
  ],
  game: [
    'Make the snake rainbow colored',
    'Speed the game up over time',
    'Add a proper game-over screen',
  ],
  dashboard: [
    'Animate the bars growing in',
    'Add a second chart',
    'Switch to a light theme',
  ],
  pomodoro: [
    'Add a circular progress ring',
    'Let me set custom session lengths',
    'Celebrate finished sessions',
  ],
  canvas: [
    'Make the brush leave sparkles',
    'Turn it into fireworks on click',
    'Add a color picker instead of rainbow',
  ],
  'modular-board': [
    'Add a weather widget',
    'Add a quick-links widget',
    'Add a dark/light theme toggle',
  ],
  default: [
    'Make it more colorful',
    'Improve the layout',
    'Add a delightful animation',
  ],
};

/** Brief sparkle burst for micro-wins. Skipped for reduced-motion users. */
function Celebration({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      aria-hidden
      className='pointer-events-none fixed inset-0 z-50 motion-reduce:hidden'
    >
      <style>{`
        @keyframes wr-sparkle {
          0% { transform: translateY(0) scale(0.6); opacity: 1; }
          100% { transform: translateY(-90px) scale(1.2); opacity: 0; }
        }
      `}</style>
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className='absolute text-xl'
          style={{
            left: `${8 + i * 9}%`,
            top: `${45 + (i % 3) * 12}%`,
            animation: `wr-sparkle 0.9s ease-out ${i * 0.05}s forwards`,
          }}
        >
          {['✨', '🎉', '⚡'][i % 3]}
        </span>
      ))}
    </div>
  );
}

export default function CoderSpace() {
  const [stage, setStage] = useState<'launch' | 'workspace'>('launch');
  const [projectId, setProjectId] = useState<string>('');
  const [projectName, setProjectName] = useState('untitled-space');
  const [files, setFiles] = useState<FileContent[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [showPreview, setShowPreview] = useState(true);
  const [projects, setProjects] = useState<SpaceProject[]>([]);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [aiBackup, setAiBackup] = useState<{
    files: FileContent[];
    selectedFile: string;
  } | null>(null);
  const [templateId, setTemplateId] = useState<string>('default');
  const [showHint, setShowHint] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const promptRef = useRef<HTMLInputElement>(null);
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelRef = useRef(false);

  const triggerCelebration = useCallback(() => {
    if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    setCelebrate(true);
    celebrateTimer.current = setTimeout(() => setCelebrate(false), 1200);
  }, []);

  useEffect(() => {
    return () => {
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    };
  }, []);

  const { isConfigured, settings, saveSettings, testConnection } =
    useAIAssistant();

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  // Autosave the current project into the project list
  useEffect(() => {
    if (stage !== 'workspace' || files.length === 0 || !projectId) return;
    setProjects(prev => {
      const next = upsertProject(prev, {
        id: projectId,
        name: projectName,
        updatedAt: Date.now(),
        files: files.map(({ name, content, type }) => ({
          name,
          content,
          type,
        })),
      });
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [stage, files, projectName, projectId]);

  // Cmd/Ctrl+K focuses the prompt from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        promptRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Collect console output posted up from the preview iframe's bridge script
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== 'wr-console') return;
      setConsoleEntries(prev =>
        [...prev, { level: e.data.level, text: String(e.data.text) }].slice(
          -200
        )
      );
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Debounce preview rebuilds so typing doesn't restart the running app on
  // every keystroke; the first build after entering a project is immediate.
  const [previewHtml, setPreviewHtml] = useState('');
  useEffect(() => {
    if (files.length === 0) return;
    if (!previewHtml) {
      setPreviewHtml(buildPreviewHtml(files));
      return;
    }
    const timer = setTimeout(
      () => setPreviewHtml(buildPreviewHtml(files)),
      500
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // Each preview re-render is a fresh run; stale logs would mislead
  useEffect(() => {
    setConsoleEntries([]);
  }, [previewHtml]);

  const currentFile = files.find(f => f.name === selectedFile);

  const enterWorkspace = useCallback(
    (
      nextFiles: FileContent[],
      name: string,
      fromTemplate = 'default',
      existingId?: string
    ) => {
      setProjectId(existingId ?? newProjectId());
      setFiles(nextFiles);
      setSelectedFile(nextFiles[0]?.name ?? '');
      setProjectName(name);
      setTemplateId(fromTemplate);
      setStage('workspace');
      setStatus('');
      setPreviewHtml('');
      setShowHint(!localStorage.getItem(HINT_DISMISSED_KEY));
      triggerCelebration();
    },
    [triggerCelebration]
  );

  // A shared project link (#p=…) opens straight into the workspace
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith('#p=')) return;
    void decodeProjectFromHash(hash.slice(3)).then(shared => {
      if (!shared) return;
      window.history.replaceState(null, '', window.location.pathname);
      enterWorkspace(
        shared.files.map(f => ({ ...f, lastModified: new Date() })),
        shared.name
      );
    });
  }, [enterWorkspace]);

  const startFromTemplate = (id: string) => {
    const template = SPACE_TEMPLATES.find(t => t.id === id);
    if (!template) return;
    enterWorkspace(
      templateToFiles(template),
      template.name.toLowerCase().replace(/\s+/g, '-'),
      template.id
    );
  };

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem(HINT_DISMISSED_KEY, '1');
  };

  const openProject = (project: SpaceProject) => {
    enterWorkspace(
      project.files.map(f => ({ ...f, lastModified: new Date() })),
      project.name,
      'default',
      project.id
    );
  };

  const deleteProject = (id: string) => {
    if (!window.confirm('Delete this project?')) return;
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const shareProject = async () => {
    const encoded = await encodeProjectToHash(
      projectName,
      files.map(({ name, content, type }) => ({ name, content, type }))
    );
    if (encoded.length > 24000) {
      setStatus('Project too big for a share link — use the ZIP export.');
      return;
    }
    const url = `${window.location.origin}/#p=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      setStatus('Share link copied — anyone can open this project with it.');
    } catch {
      window.prompt('Copy your share link:', url);
    }
  };

  const applyAIFiles = useCallback(
    (parsed: ReturnType<typeof parseFilesFromAIResponse>) => {
      if (parsed.length === 0) return 0;
      setFiles(prev => {
        const next = [...prev];
        for (const p of parsed) {
          const existing = next.findIndex(f => f.name === p.filename);
          const file: FileContent = {
            name: p.filename,
            content: p.code,
            type: fileTypeFromName(p.filename),
            lastModified: new Date(),
          };
          if (existing >= 0) next[existing] = file;
          else next.push(file);
        }
        return next;
      });
      setSelectedFile(parsed[0].filename);
      return parsed.length;
    },
    []
  );

  const runPrompt = async (text: string, filesOverride?: FileContent[]) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (!isConfigured) {
      setPrompt(trimmed);
      setSettingsOpen(true);
      setStatus('Add your AI key, then send that prompt again.');
      return;
    }
    setBusy(true);
    cancelRef.current = false;
    setStatus('Thinking…');
    setPrompt('');
    try {
      // filesOverride covers the launch flow, where state hasn't settled yet
      const fileContext = (filesOverride ?? files)
        .map(
          f =>
            `\`\`\`${monacoLanguageFromName(f.name)} // ${f.name}\n${f.content}\n\`\`\``
        )
        .join('\n\n');
      const content = `${trimmed}\n\nCurrent project "${projectName}" files:\n\n${fileContext}\n\n${AI_FILE_INSTRUCTION}`;

      const backupFiles = filesOverride ?? files;
      // The Space has its own system prompt; the user's stored chat prompt
      // (with its step-by-step narration style) stays untouched.
      const service = new AIService({
        ...settings,
        systemPrompt: SPACE_SYSTEM_PROMPT,
      });
      let response = '';
      let watchingEditor = false;
      for await (const chunk of service.sendMessageStream([
        {
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date(),
        },
      ])) {
        if (cancelRef.current) break;
        response += chunk;
        const { streaming } = parseStreamingAIResponse(response);
        if (streaming) {
          // Show the code being typed into the editor, live
          if (!watchingEditor) {
            watchingEditor = true;
            setShowPreview(false);
          }
          const live = streaming;
          setFiles(prev => {
            const existing = prev.findIndex(f => f.name === live.filename);
            const file: FileContent = {
              name: live.filename,
              content: live.code,
              type: fileTypeFromName(live.filename),
              lastModified: new Date(),
            };
            if (existing >= 0) {
              const next = [...prev];
              next[existing] = file;
              return next;
            }
            return [...prev, file];
          });
          setSelectedFile(live.filename);
          setStatus(`Writing ${live.filename}…`);
        } else {
          setStatus(`Thinking… ${response.length} chars`);
        }
      }

      const applied = applyAIFiles(parseFilesFromAIResponse(response));
      if (applied > 0) {
        setAiBackup({ files: backupFiles, selectedFile });
        triggerCelebration();
        // Writing is done — flip back to the running result
        if (watchingEditor) setShowPreview(true);
      }
      setStatus(
        applied > 0
          ? `Updated ${applied} file${applied === 1 ? '' : 's'}`
          : 'No files found in the response — try rephrasing.'
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    } finally {
      setBusy(false);
    }
  };

  // Rewrites the draft prompt into a sharper one before it's sent to the
  // coder. Reuses the same configured AI connection (provider/key/model) as
  // everything else in Coder Space — just a one-off system prompt override,
  // the same pattern runPrompt above uses for SPACE_SYSTEM_PROMPT.
  const optimizePrompt = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || busy || optimizing) return;
    if (!isConfigured) {
      setSettingsOpen(true);
      setStatus('Add your AI key, then optimize that prompt again.');
      return;
    }
    setOptimizing(true);
    try {
      const optimizer = new AIService({
        ...settings,
        systemPrompt: PROMPT_OPTIMIZER_SYSTEM_PROMPT,
      });
      const response = await optimizer.sendMessage([
        {
          id: Date.now().toString(),
          role: 'user',
          content: trimmed,
          timestamp: new Date(),
        },
      ]);
      setPrompt(response.content.trim());
      promptRef.current?.focus();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Optimize failed: ${error.message}`
          : 'Optimize failed'
      );
    } finally {
      setOptimizing(false);
    }
  };

  const launchWithPrompt = () => {
    const trimmed = prompt.trim();
    const blank = SPACE_TEMPLATES.find(t => t.id === 'blank')!;
    const blankFiles = templateToFiles(blank);
    enterWorkspace(blankFiles, 'untitled-space');
    if (trimmed) {
      // Fire the prompt against the fresh project
      void runPrompt(trimmed, blankFiles);
    }
  };

  const addFile = () => {
    const name = window.prompt('File name', 'notes.md')?.trim();
    if (!name || files.some(f => f.name === name)) return;
    setFiles(prev => [
      ...prev,
      {
        name,
        content: '',
        type: fileTypeFromName(name),
        lastModified: new Date(),
      },
    ]);
    setSelectedFile(name);
  };

  const removeFile = (name: string) => {
    if (files.length <= 1) return;
    if (!window.confirm(`Delete ${name}?`)) return;
    const next = files.filter(f => f.name !== name);
    setFiles(next);
    if (name === selectedFile) setSelectedFile(next[0]?.name ?? '');
  };

  const undoAIChange = () => {
    if (!aiBackup) return;
    setFiles(aiBackup.files);
    setSelectedFile(aiBackup.selectedFile);
    setAiBackup(null);
    setStatus('Reverted last AI change');
  };

  const exportZip = async () => {
    const zip = new JSZip();
    files.forEach(f => zip.file(f.name, f.content));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const settingsDialog = (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
        <DialogTitle className='sr-only'>AI settings</DialogTitle>
        <AISettingsPanel
          settings={settings}
          isConfigured={isConfigured}
          onTestConnection={testConnection}
          onSettingsChange={next => {
            saveSettings(next);
            setSettingsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );

  if (stage === 'launch') {
    return (
      <div className='relative min-h-screen bg-[#0d0d0d] text-[#eaeaea] flex flex-col items-center justify-center px-4'>
        <button
          onClick={() => setSettingsOpen(true)}
          className='absolute top-4 right-4 p-2 rounded-lg hover:bg-[#161616] text-[#7a7a7a] hover:text-[#00ffe1]'
          aria-label='AI settings'
        >
          <Settings className='w-5 h-5' />
        </button>
        <div className='w-full max-w-2xl space-y-8'>
          <div className='text-center space-y-2'>
            <div className='inline-flex items-center gap-2 text-[#00ffe1] text-sm font-mono'>
              <Sparkles className='w-4 h-4' />
              Coder Space
            </div>
            <h1 className='text-3xl sm:text-5xl font-bold tracking-tight'>
              What are you building?
            </h1>
            <p className='text-[#7a7a7a]'>
              Describe it, or pick a template — you&apos;ll be coding in
              seconds.
            </p>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              launchWithPrompt();
            }}
            className='flex gap-2'
          >
            <input
              ref={promptRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder='A pomodoro timer with a dark theme…'
              autoFocus
              className='flex-1 rounded-xl bg-[#161616] border border-[#262626] focus:border-[#6c2fff] outline-none px-4 py-3 text-base placeholder:text-[#555]'
            />
            <Button
              type='button'
              variant='outline'
              disabled={!prompt.trim() || busy || optimizing}
              onClick={() => void optimizePrompt()}
              className='rounded-xl border-[#262626] bg-[#161616] hover:border-[#00ffe1] hover:text-[#00ffe1] disabled:opacity-40 px-3'
              aria-label='Magic Wand — pimp up this prompt'
              title='Magic Wand: let AI sharpen this prompt'
            >
              {optimizing ? (
                <div className='w-4 h-4 animate-spin rounded-full border-2 border-[#7a7a7a] border-t-[#00ffe1]' />
              ) : (
                <Wand2 className='w-4 h-4' />
              )}
            </Button>
            <Button
              type='submit'
              className='rounded-xl bg-[#6c2fff] hover:bg-[#5a1fe0] px-5'
            >
              Build
            </Button>
          </form>

          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            {SPACE_TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => startFromTemplate(t.id)}
                className='group rounded-xl bg-[#161616] border border-[#262626] hover:border-[#00ffe1] p-4 text-left transition-colors'
              >
                <div className='text-2xl mb-2'>{t.icon}</div>
                <div className='text-sm font-medium'>{t.name}</div>
                <div className='text-xs text-[#7a7a7a]'>{t.tagline}</div>
              </button>
            ))}
          </div>

          {projects.length > 0 && (
            <div className='space-y-2'>
              <p className='text-xs font-mono text-[#555] uppercase tracking-wider'>
                Your projects
              </p>
              {projects.slice(0, 5).map(p => (
                <div
                  key={p.id}
                  className='flex items-center gap-2 rounded-xl bg-[#161616] border border-[#262626] hover:border-[#6c2fff] px-4 py-2.5'
                >
                  <button
                    onClick={() => openProject(p)}
                    className='flex-1 flex items-center justify-between text-left min-w-0'
                  >
                    <span className='text-sm truncate'>{p.name}</span>
                    <span className='text-xs text-[#555] font-mono shrink-0 ml-3'>
                      {timeAgo(p.updatedAt)}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteProject(p.id)}
                    className='text-[#555] hover:text-[#ff3c75] shrink-0'
                    aria-label={`Delete ${p.name}`}
                  >
                    <X className='w-3.5 h-3.5' />
                  </button>
                </div>
              ))}
            </div>
          )}

          <nav className='flex justify-center gap-5 text-xs font-mono text-[#555]'>
            <Link href='/enter' className='hover:text-[#eaeaea]'>
              classic editor
            </Link>
            <Link href='/w' className='hover:text-[#eaeaea]'>
              workspace
            </Link>
            <Link href='/visual-tools' className='hover:text-[#eaeaea]'>
              visual tools
            </Link>
            <Link href='/landing' className='hover:text-[#eaeaea]'>
              about
            </Link>
          </nav>
        </div>
        {settingsDialog}
      </div>
    );
  }

  return (
    <div className='h-screen bg-[#0d0d0d] text-[#eaeaea] flex flex-col'>
      {/* Top bar */}
      <header className='flex items-center gap-3 px-3 py-2 border-b border-[#262626] shrink-0'>
        <button
          onClick={() => setStage('launch')}
          className='p-1.5 rounded-lg hover:bg-[#161616] text-[#7a7a7a] hover:text-[#eaeaea]'
          aria-label='Back to launch screen'
        >
          <ArrowLeft className='w-4 h-4' />
        </button>
        <input
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          className='bg-transparent outline-none text-sm font-mono w-40 sm:w-56 border-b border-transparent focus:border-[#6c2fff]'
          aria-label='Project name'
        />
        <div className='flex-1' />
        <button
          onClick={() => setShowPreview(p => !p)}
          className='p-1.5 rounded-lg hover:bg-[#161616] text-[#7a7a7a] hover:text-[#eaeaea]'
          aria-label={showPreview ? 'Hide preview' : 'Show preview'}
        >
          {showPreview ? (
            <EyeOff className='w-4 h-4' />
          ) : (
            <Eye className='w-4 h-4' />
          )}
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className='p-1.5 rounded-lg hover:bg-[#161616] text-[#7a7a7a] hover:text-[#eaeaea]'
          aria-label='AI settings'
        >
          <Settings className='w-4 h-4' />
        </button>
        <button
          onClick={() => setConsoleOpen(o => !o)}
          className={`relative p-1.5 rounded-lg hover:bg-[#161616] ${
            consoleOpen
              ? 'text-[#00ffe1]'
              : 'text-[#7a7a7a] hover:text-[#eaeaea]'
          }`}
          aria-label={consoleOpen ? 'Hide console' : 'Show console'}
        >
          <Terminal className='w-4 h-4' />
          {consoleEntries.some(e => e.level === 'error') && (
            <span className='absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#ff3c75]' />
          )}
        </button>
        <button
          onClick={() => void shareProject()}
          className='p-1.5 rounded-lg hover:bg-[#161616] text-[#7a7a7a] hover:text-[#00ffe1]'
          aria-label='Copy share link'
        >
          <Share2 className='w-4 h-4' />
        </button>
        <button
          onClick={exportZip}
          className='p-1.5 rounded-lg hover:bg-[#161616] text-[#7a7a7a] hover:text-[#eaeaea]'
          aria-label='Export project as ZIP'
        >
          <Download className='w-4 h-4' />
        </button>
        <button
          onClick={() => setPublishOpen(true)}
          className='p-1.5 rounded-lg hover:bg-[#161616] text-[#7a7a7a] hover:text-[#00ffe1]'
          aria-label='Deploy project'
        >
          <Rocket className='w-4 h-4' />
        </button>
      </header>

      {/* File tabs */}
      <nav className='flex items-center gap-1 px-3 pt-2 shrink-0 overflow-x-auto'>
        {files.map(f => (
          <span
            key={f.name}
            className={`flex items-center rounded-t-lg text-xs font-mono whitespace-nowrap ${
              f.name === selectedFile
                ? 'bg-[#161616] text-[#00ffe1] border border-b-0 border-[#262626]'
                : 'text-[#7a7a7a] hover:text-[#eaeaea]'
            }`}
          >
            <button
              onClick={() => setSelectedFile(f.name)}
              className='px-3 py-1.5'
            >
              {f.name}
            </button>
            {f.name === selectedFile && files.length > 1 && (
              <button
                onClick={() => removeFile(f.name)}
                className='pr-2 text-[#7a7a7a] hover:text-[#ff3c75]'
                aria-label={`Delete ${f.name}`}
              >
                <X className='w-3 h-3' />
              </button>
            )}
          </span>
        ))}
        <button
          onClick={addFile}
          className='p-1.5 text-[#7a7a7a] hover:text-[#00ffe1]'
          aria-label='Add file'
        >
          <Plus className='w-3.5 h-3.5' />
        </button>
      </nav>

      {/* One-time orientation hint */}
      {showHint && (
        <div className='flex items-center gap-2 mx-3 mt-2 px-3 py-2 rounded-lg bg-[#6c2fff1a] border border-[#6c2fff4d] text-xs text-[#b9a3ff] shrink-0'>
          <Sparkles className='w-3.5 h-3.5 shrink-0' />
          <span className='flex-1'>
            This is your code — change anything and the preview updates
            instantly. Nothing can break: every AI change has an undo.
          </span>
          <button
            onClick={dismissHint}
            className='hover:text-white'
            aria-label='Dismiss hint'
          >
            <X className='w-3.5 h-3.5' />
          </button>
        </div>
      )}

      {/* Editor + preview: side by side on md+, either/or on mobile */}
      <div className='flex-1 min-h-0 flex'>
        <div
          className={
            showPreview ? 'hidden md:block md:w-1/2 min-w-0' : 'w-full min-w-0'
          }
        >
          {currentFile && (
            <MonacoEditorClient
              value={currentFile.content}
              language={monacoLanguageFromName(currentFile.name)}
              height='100%'
              onChange={value => {
                if (value === undefined) return;
                setFiles(prev =>
                  prev.map(f =>
                    f.name === selectedFile
                      ? { ...f, content: value, lastModified: new Date() }
                      : f
                  )
                );
              }}
            />
          )}
        </div>
        {showPreview && (
          <div className='w-full md:w-1/2 min-w-0 md:border-l border-[#262626] bg-white'>
            <iframe
              title='Live preview'
              sandbox='allow-scripts'
              srcDoc={previewHtml}
              className='w-full h-full border-0'
            />
          </div>
        )}
      </div>

      {/* Console panel */}
      {consoleOpen && (
        <div className='shrink-0 border-t border-[#262626] bg-[#0a0a0a] max-h-36 overflow-y-auto font-mono text-xs'>
          <div className='flex items-center justify-between px-3 py-1 border-b border-[#161616] text-[#555]'>
            <span>console</span>
            <button
              onClick={() => setConsoleEntries([])}
              className='hover:text-[#eaeaea]'
            >
              clear
            </button>
          </div>
          {consoleEntries.length === 0 ? (
            <p className='px-3 py-2 text-[#555]'>
              Console is empty — logs and errors from the preview appear here.
            </p>
          ) : (
            consoleEntries.map((entry, i) => (
              <p
                key={i}
                className={`px-3 py-0.5 border-b border-[#161616] whitespace-pre-wrap break-all ${
                  entry.level === 'error'
                    ? 'text-[#ff3c75]'
                    : entry.level === 'warn'
                      ? 'text-yellow-400'
                      : 'text-[#7a7a7a]'
                }`}
              >
                {entry.text}
              </p>
            ))
          )}
        </div>
      )}

      {/* AI command bar */}
      <footer className='shrink-0 border-t border-[#262626] p-3 space-y-1.5'>
        {/* One-tap ideas: always a next step, never a blank prompt */}
        <div className='flex gap-1.5 overflow-x-auto pb-0.5'>
          {consoleEntries.some(e => e.level === 'error') && (
            <button
              type='button'
              disabled={busy}
              onClick={() => {
                const errors = consoleEntries
                  .filter(e => e.level === 'error')
                  .slice(-3)
                  .map(e => e.text)
                  .join('\n');
                void runPrompt(
                  `The preview console shows these errors — fix them:\n${errors}`
                );
              }}
              className='shrink-0 rounded-full border border-[#ff3c75] bg-[#ff3c751a] px-3 py-1 text-xs text-[#ff3c75] hover:bg-[#ff3c7533] disabled:opacity-40'
            >
              🔧 Fix the errors
            </button>
          )}
          {(IDEA_CHIPS[templateId] ?? IDEA_CHIPS.default).map(idea => (
            <button
              key={idea}
              type='button'
              disabled={busy}
              onClick={() => {
                if (isConfigured) {
                  void runPrompt(idea);
                } else {
                  setPrompt(idea);
                  promptRef.current?.focus();
                }
              }}
              className='shrink-0 rounded-full border border-[#262626] bg-[#161616] px-3 py-1 text-xs text-[#7a7a7a] hover:border-[#00ffe1] hover:text-[#eaeaea] disabled:opacity-40'
            >
              {idea}
            </button>
          ))}
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            void runPrompt(prompt);
          }}
          className='flex gap-2'
        >
          <input
            ref={promptRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={
              isConfigured
                ? 'Tell the AI what to change… (⌘K)'
                : 'Add your AI key (gear icon above) to unlock prompts'
            }
            className='flex-1 rounded-xl bg-[#161616] border border-[#262626] focus:border-[#6c2fff] outline-none px-4 py-2.5 text-sm placeholder:text-[#555]'
          />
          <Button
            type='button'
            variant='outline'
            disabled={!prompt.trim() || busy || optimizing}
            onClick={() => void optimizePrompt()}
            className='rounded-xl border-[#262626] bg-[#161616] hover:border-[#00ffe1] hover:text-[#00ffe1] disabled:opacity-40'
            aria-label='Magic Wand — pimp up this prompt'
            title='Magic Wand: let AI sharpen this prompt'
          >
            {optimizing ? (
              <div className='w-4 h-4 animate-spin rounded-full border-2 border-[#7a7a7a] border-t-[#00ffe1]' />
            ) : (
              <Wand2 className='w-4 h-4' />
            )}
          </Button>
          {busy ? (
            <Button
              type='button'
              onClick={() => {
                cancelRef.current = true;
                setStatus('Stopping…');
              }}
              className='rounded-xl bg-[#ff3c75] hover:bg-[#e02a60]'
              aria-label='Stop generating'
            >
              <Square className='w-4 h-4' />
            </Button>
          ) : (
            <Button
              type='submit'
              className='rounded-xl bg-[#6c2fff] hover:bg-[#5a1fe0]'
              aria-label='Send prompt'
            >
              <Send className='w-4 h-4' />
            </Button>
          )}
        </form>
        {(status || aiBackup) && (
          <div className='flex items-center gap-3 px-1'>
            {status && (
              <p className='text-xs text-[#7a7a7a]' role='status'>
                {status}
              </p>
            )}
            {aiBackup && (
              <button
                onClick={undoAIChange}
                className='inline-flex items-center gap-1 text-xs text-[#00ffe1] hover:underline'
              >
                <Undo2 className='w-3 h-3' />
                Undo AI change
              </button>
            )}
          </div>
        )}
      </footer>

      <PublishModal
        open={publishOpen}
        onOpenChange={setPublishOpen}
        files={files}
      />
      {settingsDialog}
      <Celebration show={celebrate} />
    </div>
  );
}
