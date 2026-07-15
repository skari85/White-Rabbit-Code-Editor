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

import MonacoEditorClient from '@/components/monaco-editor-client';
import { Button } from '@/components/ui/button';
import { FileContent } from '@/hooks/use-code-builder';
import { useAIAssistant } from '@/hooks/use-ai-assistant';
import { AIService } from '@/lib/ai-service';
import {
  SPACE_TEMPLATES,
  buildPreviewHtml,
  fileTypeFromName,
  monacoLanguageFromName,
  parseFilesFromAIResponse,
  templateToFiles,
} from '@/lib/space-engine';
import JSZip from 'jszip';
import {
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
  Plus,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const PROJECT_STORAGE_KEY = 'wr-space-project';

interface SavedProject {
  name: string;
  files: Array<Pick<FileContent, 'name' | 'content' | 'type'>>;
}

function loadSavedProject(): SavedProject | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.name && Array.isArray(parsed.files) && parsed.files.length) {
      return parsed;
    }
  } catch {
    localStorage.removeItem(PROJECT_STORAGE_KEY);
  }
  return null;
}

const AI_FILE_INSTRUCTION =
  'Respond with complete files only, each in a fenced code block whose info ' +
  'string is the language followed by `// filename` (e.g. ```html // index.html). ' +
  'Include every file that needs to change, in full.';

export default function CoderSpace() {
  const [stage, setStage] = useState<'launch' | 'workspace'>('launch');
  const [projectName, setProjectName] = useState('untitled-space');
  const [files, setFiles] = useState<FileContent[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [showPreview, setShowPreview] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const promptRef = useRef<HTMLInputElement>(null);

  const { isConfigured, settings } = useAIAssistant();

  useEffect(() => {
    setHasSaved(loadSavedProject() !== null);
  }, []);

  // Autosave while in the workspace
  useEffect(() => {
    if (stage !== 'workspace' || files.length === 0) return;
    const saved: SavedProject = {
      name: projectName,
      files: files.map(({ name, content, type }) => ({ name, content, type })),
    };
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(saved));
  }, [stage, files, projectName]);

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

  const previewHtml = useMemo(() => buildPreviewHtml(files), [files]);

  const currentFile = files.find(f => f.name === selectedFile);

  const enterWorkspace = useCallback(
    (nextFiles: FileContent[], name: string) => {
      setFiles(nextFiles);
      setSelectedFile(nextFiles[0]?.name ?? '');
      setProjectName(name);
      setStage('workspace');
      setStatus('');
    },
    []
  );

  const startFromTemplate = (templateId: string) => {
    const template = SPACE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    enterWorkspace(
      templateToFiles(template),
      template.name.toLowerCase().replace(/\s+/g, '-')
    );
  };

  const resumeSaved = () => {
    const saved = loadSavedProject();
    if (!saved) return;
    enterWorkspace(
      saved.files.map(f => ({ ...f, lastModified: new Date() })),
      saved.name
    );
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
      setStatus(
        'Add an AI API key in the main editor settings to use prompts — templates work without one.'
      );
      return;
    }
    setBusy(true);
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

      const service = new AIService(settings);
      let response = '';
      for await (const chunk of service.sendMessageStream([
        {
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date(),
        },
      ])) {
        response += chunk;
        setStatus(`Writing code… ${response.length} chars`);
      }

      const applied = applyAIFiles(parseFilesFromAIResponse(response));
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

  if (stage === 'launch') {
    return (
      <div className='min-h-screen bg-[#0d0d0d] text-[#eaeaea] flex flex-col items-center justify-center px-4'>
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

          {hasSaved && (
            <div className='text-center'>
              <button
                onClick={resumeSaved}
                className='text-sm text-[#00ffe1] hover:underline'
              >
                Resume your last project →
              </button>
            </div>
          )}
        </div>
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
          onClick={exportZip}
          className='p-1.5 rounded-lg hover:bg-[#161616] text-[#7a7a7a] hover:text-[#eaeaea]'
          aria-label='Export project as ZIP'
        >
          <Download className='w-4 h-4' />
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

      {/* AI command bar */}
      <footer className='shrink-0 border-t border-[#262626] p-3 space-y-1.5'>
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
                : 'Templates are live — add an AI key in editor settings to unlock prompts'
            }
            className='flex-1 rounded-xl bg-[#161616] border border-[#262626] focus:border-[#6c2fff] outline-none px-4 py-2.5 text-sm placeholder:text-[#555]'
          />
          <Button
            type='submit'
            disabled={busy}
            className='rounded-xl bg-[#6c2fff] hover:bg-[#5a1fe0]'
            aria-label='Send prompt'
          >
            <Send className='w-4 h-4' />
          </Button>
        </form>
        {status && (
          <p className='text-xs text-[#7a7a7a] px-1' role='status'>
            {status}
          </p>
        )}
      </footer>
    </div>
  );
}
