/**
 * White Rabbit Code Editor
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 *
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 *
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AIChat } from "@/components/ai-chat";
import LiveCodingEngine from "@/components/live-coding-engine";
import { TerminalComponent } from "@/components/terminal";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useAIAssistantEnhanced } from "@/hooks/use-ai-assistant-enhanced";
import { useAnalytics } from "@/hooks/use-analytics";
import { FileContent, useCodeBuilder } from "@/hooks/use-code-builder";
import { useAutoSave } from '@/hooks/use-debounced-auto-save';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useTerminal } from "@/hooks/use-terminal";
import {
    Code,
    Download,
    ExternalLink,
    FileText,
    Keyboard,
    Package,
    Plus,
    RefreshCw,
    Rocket,
    Server,
    Settings,
    Sparkles,
    Terminal,
    X
} from "lucide-react";
import { useSession } from "next-auth/react";
import { ErrorBoundary } from './error-boundary';
import FastLiveCoding from './fast-live-coding';
import FileTabs from './file-tabs';
import SplitControls, { useSplitKeyboardShortcuts } from './split-controls';
import SplitEditorLayout from './split-editor-layout';

import { notificationUtils, useNotifications } from '@/components/ui/notification-system';
import { useAIShortcuts, useIDEShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { KeyboardShortcutsService } from '@/lib/keyboard-shortcuts-service';
import dynamic from 'next/dynamic';
import AdvancedEditorToolbar from './advanced-editor-toolbar';
import BYOKAISettings from './byok-ai-settings';
import CodeInspectionPanel from './code-inspection-panel';
import { CommandPalette } from './command-palette';
import CompactKeyboardShortcuts from './compact-keyboard-shortcuts';
import DarkModeToggleButton from './DarkModeToggleButton';
import DocumentationPanel from './documentation-panel';
import EnhancedOnboarding from './enhanced-onboarding';
import ExtensionMarketplace from './extension-marketplace';
import LiveDiffDock, { type DiffEntry } from './live-diff-dock';
import LivePreview from './live-preview';
import MonacoDiffOverlay from './monaco-diff-overlay';
import NewAppWizard, { NewAppOptions } from './new-app-wizard';
import OnboardingModal from './onboarding-modal';
import PublishModal from './publish-modal';
import StylePanel from './style-panel';
import VisualToolsDemo from './visual-tools-demo-simple';

// Code splitting for heavy components

const VisualProgrammingInterface = dynamic(() => import('./visual-programming-interface'), {
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading Visual Programming...</p>
      </div>
    </div>
  ),
  ssr: false
});

const GitPanel = dynamic(() => import('./git-panel'), {
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading Git Panel...</p>
      </div>
    </div>
  ),
  ssr: false
});

const ExtensionConsole = dynamic(() => import('./extension-console'), {
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading Extension Console...</p>
      </div>
    </div>
  ),
  ssr: false
});

export default function CodeEditor() {
  // Analytics
  const {
    trackFileCreated,
    trackUserSession
  } = useAnalytics();

  // Notifications
  const notifications = useNotifications();

  // Keyboard shortcuts
  useIDEShortcuts({
    onSave: () => {
      if (selectedFile) {
        const notif = notificationUtils.fileSaved(selectedFile);
        notifications.success(notif.title, notif.description);
      }
    },
    onNew: () => {
      const fileName = prompt('Enter file name:');
      if (fileName) {
        addNewFile(fileName, 'txt');
        setSelectedFile(fileName);
        notifications.success('File Created', `${fileName} has been created`);
      }
    },
    onToggleTerminal: () => setViewMode(prev => prev === 'terminal' ? 'code' : 'terminal'),
    onToggleSidebar: () => {
      // Toggle sidebar logic would go here
    }
  });

  useAIShortcuts({
    onAIChat: () => setViewMode('code'), // Focus on AI chat
    onGenerateCode: () => {
      // Trigger AI code generation
    }
  });

  // Code Builder hooks
  const {
    files,
    selectedFile,
    setSelectedFile,
    updateFileContent,
    addNewFile,
    deleteFile,
    getSelectedFileContent,
    initializeDefaultProject
  } = useCodeBuilder();

  // AI Assistant
  const {
    sendStreamingMessage: sendAIStreamingMessage,
    isLoading: aiLoading,
    settings: aiSettings,
    messages: aiMessages,
    clearMessages: clearAIMessages,
    isConfigured: aiConfigured,
    saveSettings: updateAISettings,
    generateDocumentation,
    getCachedDocumentation,
    setFileGenerationCallbacks,
    streamedMessage: aiStreamedMessage,
    isStreaming: aiIsStreaming
  } = useAIAssistantEnhanced();

  const terminal = useTerminal();
  const { getActiveSession, createSession, executeCommand } = terminal;



  const [viewMode, setViewMode] = useState<"code" | "terminal" | "preview" | "marketplace" | "git" | "extensions" | "visual" | "visual-tools">("code");
  // Live diff tracking (simple per-file snapshot)
  const [diffs, setDiffs] = useState<Record<string, DiffEntry>>({});
  const [openDiff, setOpenDiff] = useState<DiffEntry | null>(null);

  // Loading states
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true);
        setLoadingMessage('Initializing application...');
        
        // Initialize default project
        await initializeDefaultProject();
        
        // Initialize layout system
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async init
        
        setIsInitializing(false);
      } catch (error) {
        // Log error to monitoring service in production
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [initializeDefaultProject]);

  // Track user session
  // Expose project files for GitHub commit API (client-only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).wrGetProjectFiles = () => files.map(f => ({ name: f.name, content: f.content }));
    }
    return () => {
      if (typeof window !== 'undefined') delete (window as any).wrGetProjectFiles;
    };
  }, [files]);

  useEffect(() => {
    const sessionStart = Date.now();
    trackUserSession('session_start');

    return () => {
      const sessionDuration = Date.now() - sessionStart;
      trackUserSession('session_end', sessionDuration);
    };
  }, []); // Remove trackUserSession dependency to prevent infinite loop

  // Set up file generation callbacks for AI
  useEffect(() => {
    setFileGenerationCallbacks({
      onCreate: (name: string, content: string) => {
        // Determine file type from extension
        const getFileType = (filename: string): FileContent['type'] => {
          const ext = filename.split('.').pop()?.toLowerCase();
          switch (ext) {
            case 'js': case 'jsx': return 'js';
            case 'ts': case 'tsx': return 'tsx';
            case 'html': return 'html';
            case 'css': return 'css';
            case 'json': return 'json';
            case 'md': return 'md';
            case 'py': return 'py';
            default: return 'txt';
          }
        };

        // Idempotent create: only add file once, then keep updating content
        const exists = files.some(f => f.name === name);
        const prev = files.find(f => f.name === name)?.content || '';
        if (!exists) {
          addNewFile(name, getFileType(name));
          trackFileCreated(getFileType(name), name);
        }
        setDiffs(d => ({ ...d, [name]: { filename: name, before: d[name]?.before ?? prev, after: content } }));
        updateFileContent(name, content);
      },
      onUpdate: (name: string, content: string) => {
        const prev = files.find(f => f.name === name)?.content || '';
        setDiffs(d => ({ ...d, [name]: { filename: name, before: d[name]?.before ?? prev, after: content } }));
        updateFileContent(name, content);
      },
      onSelect: (name: string) => {
        setSelectedFile(name);
      }
    });
  }, [setFileGenerationCallbacks, addNewFile, updateFileContent, setSelectedFile]);
  const [codeColor, setCodeColor] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);

  // Responsive layout
  const responsiveConfig = useResponsiveLayout();

  // Split-screen state - disable on mobile/tablet
  const [useSplitLayout, setUseSplitLayout] = useState(false);

  // Automatically disable split layout on mobile/tablet
  useEffect(() => {
    if (responsiveConfig.shouldDisableSplits && useSplitLayout) {
      setUseSplitLayout(false);
    }
  }, [responsiveConfig.shouldDisableSplits, useSplitLayout]);

  // Split-screen keyboard shortcuts
  useSplitKeyboardShortcuts(
    () => !responsiveConfig.shouldDisableSplits && setUseSplitLayout(true), // Split horizontal
    () => !responsiveConfig.shouldDisableSplits && setUseSplitLayout(true), // Split vertical
    () => setUseSplitLayout(false) // Reset layout
  );

  // Documentation state
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [documentationData, setDocumentationData] = useState<any>(null);
  const [documentationLoading, setDocumentationLoading] = useState(false);

  // AI-enhanced editor state
  const [useAIEnhancedEditor, setUseAIEnhancedEditor] = useState(true);

  // New App, Publish, Style modals
  const [showNewApp, setShowNewApp] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [showStyle, setShowStyle] = useState(false)
  // Onboarding modal state
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    try {
      const seen = localStorage.getItem('wr-onboarded');
      if (!seen) setShowOnboarding(true);
    } catch {}
    (window as any).wrOpenOnboarding = () => setShowOnboarding(true);
    return () => { delete (window as any).wrOpenOnboarding };
  }, []);


  useEffect(() => {
    // Expose open functions globally for minimal invasive wiring
    (window as any).wrOpenNewAppWizard = () => setShowNewApp(true)
    ;(window as any).wrOpenPublishModal = () => setShowPublish(true)
    ;(window as any).wrOpenStylePanel = () => setShowStyle(true)
    ;(window as any).wrOpenGit = () => setViewMode('git')
    ;(window as any).wrOpenExtensions = () => setViewMode('extensions')
    // Cleanup
    return () => {
      delete (window as any).wrOpenNewAppWizard
      delete (window as any).wrOpenPublishModal
      delete (window as any).wrOpenStylePanel
      delete (window as any).wrOpenGit
      delete (window as any).wrOpenExtensions
    }
  }, [])

  // Register run/build/lint/type-check handlers
  useEffect(() => {
    const ks = new KeyboardShortcutsService();
    ks.addShortcut({ id: 'run.dev', name: 'Run Dev Server', description: 'Start dev server', category: 'run', keys: ['Ctrl+R','Cmd+R'], command: 'run.dev', enabled: true, customizable: true });
    ks.addShortcut({ id: 'run.build', name: 'Build', description: 'Build project', category: 'run', keys: ['Ctrl+B','Cmd+B'], command: 'run.build', enabled: true, customizable: true });
    ks.addShortcut({ id: 'run.typecheck', name: 'Type Check', description: 'TypeScript check', category: 'run', keys: ['Ctrl+Shift+T','Cmd+Shift+T'], command: 'run.typecheck', enabled: true, customizable: true });
    ks.addShortcut({ id: 'run.lint', name: 'Lint', description: 'Run linter', category: 'run', keys: ['Ctrl+Shift+L','Cmd+Shift+L'], command: 'run.lint', enabled: true, customizable: true });

    ks.registerHandler('run.dev', async () => {
      // Implement type narrowing for terminal session
      const sid = terminal.getActiveSession();
      if (typeof sid !== 'string' && sid) {
        await terminal.executeCommand('npm run dev', sid.id, true);
      }
      setViewMode('terminal');
    });
    ks.registerHandler('run.build', async () => {
      // Implement type narrowing for terminal session
      const sid = terminal.getActiveSession();
      if (typeof sid !== 'string' && sid) {
        await terminal.executeCommand('npm run build', sid.id);
      }
      setViewMode('terminal');
    });
    ks.registerHandler('run.typecheck', async () => {
      // Implement type narrowing for terminal session
      const sid = terminal.getActiveSession();
      if (typeof sid !== 'string' && sid) {
        await terminal.executeCommand('npx tsc -p .', sid.id);
      }
      setViewMode('terminal');
    });
    ks.registerHandler('run.lint', async () => {
      // Implement type narrowing for terminal session
      const sid = terminal.getActiveSession();
      if (typeof sid !== 'string' && sid) {
        await terminal.executeCommand('npm run lint', sid.id);
      }
      setViewMode('terminal');
    });

    ks.startListening();

    // expose for toolbar buttons
    (window as any).wrRunDev = () => ks.executeCommand('run.dev');
    (window as any).wrRunBuild = () => ks.executeCommand('run.build');
    (window as any).wrRunTypecheck = () => ks.executeCommand('run.typecheck');
    (window as any).wrRunLint = () => ks.executeCommand('run.lint');
    // add to command palette
    ks.addCommandPaletteItem({ id: 'cmd.run.dev', title: 'Run Dev Server', category: 'run', command: 'run.dev', keybinding: 'Cmd+R' });
    ks.addCommandPaletteItem({ id: 'cmd.run.build', title: 'Build', category: 'run', command: 'run.build', keybinding: 'Cmd+B' });
    ks.addCommandPaletteItem({ id: 'cmd.run.typecheck', title: 'Type Check', category: 'run', command: 'run.typecheck', keybinding: 'Cmd+Shift+T' });
    ks.addCommandPaletteItem({ id: 'cmd.run.lint', title: 'Lint', category: 'run', command: 'run.lint', keybinding: 'Cmd+Shift+L' });


    return () => {
      ks.stopListening();
      delete (window as any).wrRunDev;
      delete (window as any).wrRunBuild;
      delete (window as any).wrRunTypecheck;
      delete (window as any).wrRunLint;
    };
  }, [getActiveSession, createSession, executeCommand]);

  // Command Palette integration (Cmd/Ctrl+K)
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [ksInstance] = useState(() => new KeyboardShortcutsService());
  // Register Section Library commands in Command Palette
  useEffect(() => {
    // Slash-commands basic support
    ksInstance.addCommandPaletteItem({ id: 'slash.help', title: '/help Show Help', category: 'general', command: 'slash.help' });
    ksInstance.addCommandPaletteItem({ id: 'slash.dev', title: '/dev Run Dev Server', category: 'run', command: 'run.dev' });
    ksInstance.addCommandPaletteItem({ id: 'slash.build', title: '/build Build Project', category: 'run', command: 'run.build' });
    ksInstance.addCommandPaletteItem({ id: 'slash.test', title: '/test Run Tests', category: 'run', command: 'test.run' });
    ksInstance.addCommandPaletteItem({ id: 'slash.watch', title: '/watch Toggle Test Watch', category: 'run', command: 'test.watch.toggle' });
    ksInstance.registerHandler?.('slash.help', async () => {
      alert('Try /dev, /build, /test, /watch');
    });

    ksInstance.addCommandPaletteItem({ id: 'section.hero', title: 'Insert: Hero Section', category: 'edit', command: 'section.insert', args: ['hero'] });
    ksInstance.addCommandPaletteItem({ id: 'section.pricing', title: 'Insert: Pricing Section', category: 'edit', command: 'section.insert', args: ['pricing'] });
    ksInstance.addCommandPaletteItem({ id: 'section.faq', title: 'Insert: FAQ Section', category: 'edit', command: 'section.insert', args: ['faq'] });
    ksInstance.addCommandPaletteItem({ id: 'section.testimonials', title: 'Insert: Testimonials Section', category: 'edit', command: 'section.insert', args: ['testimonials'] });
    ksInstance.addCommandPaletteItem({ id: 'section.features', title: 'Insert: Features Section', category: 'edit', command: 'section.insert', args: ['features'] });
    ksInstance.addCommandPaletteItem({ id: 'section.footer', title: 'Insert: Footer', category: 'edit', command: 'section.insert', args: ['footer'] });
    ksInstance.addCommandPaletteItem({ id: 'section.contact', title: 'Insert: Contact Section', category: 'edit', command: 'section.insert', args: ['contact'] });
    ksInstance.addCommandPaletteItem({ id: 'section.bloglist', title: 'Insert: Blog List', category: 'edit', command: 'section.insert', args: ['bloglist'] });

    ksInstance.registerHandler?.('section.insert', async (args?: any[]) => {
      const kind = args?.[0] as string;
      const snippet = getSectionSnippet(kind);
      // Prefer index.html or create sections.html
      const target = files.find(f => f.name === 'index.html') ? 'index.html' : 'sections.html';
      if (!files.find(f => f.name === target)) {
        addNewFile(target, 'html');
      }
      const existing = files.find(f => f.name === target)?.content || '';
      const newContent = injectSection(existing, snippet);
      updateFileContent(target, newContent);
      setSelectedFile(target);
    });
  }, [ksInstance, files, addNewFile, updateFileContent, setSelectedFile]);

  const getSectionSnippet = (kind: string): string => {
    const brand = 'var(--brand)';
    switch (kind) {
      case 'hero':
        return `<section class="hero" style="padding:48px 0">
  <h1 style="font-size:40px;margin:0 0 12px">Build faster with White Rabbit</h1>
  <p style="max-width:640px;color:#666">A modern, tokenized starter you can style in seconds. Ship pages with zero boilerplate.</p>
  <div style="margin-top:16px"><a class="btn" style="background:${brand};color:white;padding:10px 16px;border-radius:8px;text-decoration:none" href="#">Get Started</a></div>
</section>`;
      case 'pricing':
        return `<section class="pricing" style="padding:48px 0">
  <h2 style="font-size:28px;margin-bottom:16px">Pricing</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px">
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px"><h3>Starter</h3><p>$0/mo</p><ul><li>Basic features</li></ul></div>
    <div style="border:2px solid ${brand};border-radius:12px;padding:16px"><h3>Pro</h3><p>$12/mo</p><ul><li>All features</li></ul></div>
  </div>
</section>`;
      case 'faq':
        return `<section class="faq" style="padding:48px 0">
  <h2 style="font-size:28px;margin-bottom:16px">FAQ</h2>
  <details><summary>How do I deploy?</summary><p>Click Publish to deploy to Vercel in one step.</p></details>
  <details><summary>Can I customize styles?</summary><p>Yes—change tokens in the Style panel.</p></details>
</section>`;
      case 'testimonials':
        return `<section class="testimonials" style="padding:48px 0">
  <h2 style="font-size:28px;margin-bottom:16px">Loved by makers</h2>
  <blockquote style="border-left:4px solid ${brand};padding-left:12px">“I shipped my MVP in a weekend.” — Indie dev</blockquote>
</section>`;
      default:
        return `<section style="padding:32px 0"><h2>New Section</h2><p>Content here</p></section>`;
    }
  };

  const injectSection = (html: string, section: string): string => {
    if (!html.trim()) {
      return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8"/>\n<meta name="viewport" content="width=device-width, initial-scale=1.0"/>\n<link rel="stylesheet" href="style.css"/>\n<title>New Page</title>\n</head>\n<body>\n${section}\n</body>\n</html>`;
    }
    if (html.includes('</main>')) {
      return html.replace('</main>', `${section}\n</main>`);
    }
    if (html.includes('</body>')) {
      return html.replace('</body>', `${section}\n</body>`);
    }
    return `${html}\n${section}`;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Quick open slash-commands with '/'
      if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key === '/') {
        setShowCommandPalette(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);


  // Code inspection state
  const [showInspections, setShowInspections] = useState(false);
  const [inspections, setInspections] = useState<any[]>([]);
  const [inspectionLoading, setInspectionLoading] = useState(false);

  // GitHub integration
  const { data: session } = useSession();

  // Auto-save functionality
  const autoSave = useAutoSave({
    delay: 2000,
    onSave: async () => {
      // Auto-save completed
    }
  });

  // Handle file closing
  const handleCloseFile = useCallback((filename: string) => {
    // If closing the selected file, select another file first
    if (filename === selectedFile && files.length > 1) {
      const remainingFiles = files.filter(f => f.name !== filename);
      setSelectedFile(remainingFiles[0].name);
    }
    // Delete the file
    deleteFile(filename);
  }, [selectedFile, files, setSelectedFile, deleteFile]);

  // Helper functions
  const getFileTypeIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html': return '🌐';
      case 'css': return '🎨';
      case 'js': return '⚡';
      case 'tsx':
      case 'ts': return '🔷';
      case 'jsx': return '⚛️';
      case 'py': return '🐍';
      case 'json': return '📋';
      case 'md': return '📝';
      default: return '📄';
    }
  };

  const getLanguageFromFileName = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'javascript';
      case 'jsx': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'json': return 'json';
      case 'py': return 'python';
      case 'md': return 'markdown';
      default: return 'text';
    }
  };

  // Enhanced AI integration with context awareness
  const handleSendMessage = useCallback(async (message: string) => {
    const loadingId = notifications.loading('AI Processing', 'Generating response...');

    try {
      const context = {
        files: files,
        selectedFile: selectedFile,
        appSettings: aiSettings
      };

      // Stream the response and let the assistant apply file commands directly
      await sendAIStreamingMessage(message, context);
      notifications.removeNotification(loadingId);
      notifications.success('AI Response', 'Response generated successfully');
    } catch (error) {
      notifications.removeNotification(loadingId);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      notifications.error('AI Error', `Failed to generate response: ${errorMessage}`);
    }
  }, [sendAIStreamingMessage, files, selectedFile, aiSettings, notifications]);

  // Expose error Explain/Fix for terminal tooltip actions
  useEffect(() => {
    (window as any).wrExplainError = (output: string) => {
      const prompt = `Explain this error and propose safe fixes. Keep it concise and give steps:
\n\n${output}`;
      handleSendMessage(prompt);
      setViewMode('code');
    };
    (window as any).wrFixError = (output: string) => {
      const prompt = `Given this terminal error, suggest minimal code changes or commands to fix:
\n\n${output}`;
      handleSendMessage(prompt);
      setViewMode('code');
    };
    return () => {
      delete (window as any).wrExplainError;
      delete (window as any).wrFixError;
    };
  }, []);

  const handleCodeColorToggle = () => {
    setCodeColor(!codeColor);
  };

  // Documentation handlers
  const handleToggleDocumentation = useCallback(() => {
    setShowDocumentation(!showDocumentation);

    // Load cached documentation if available
    if (!showDocumentation && selectedFile && !documentationData) {
      const cached = getCachedDocumentation(selectedFile);
      if (cached) {
        setDocumentationData(cached);
      }
    }
  }, [showDocumentation, selectedFile, documentationData, getCachedDocumentation]);

  const handleGenerateDocumentation = useCallback(async (fileName: string, code: string) => {
    if (!fileName || !code.trim()) return;

    const loadingId = notifications.loading('Generating Documentation', `Creating documentation for ${fileName}...`);
    setDocumentationLoading(true);

    try {
      const fileType = fileName.split('.').pop()?.toLowerCase() || 'txt';
      const documentation = await generateDocumentation(code, fileName, fileType);
      setDocumentationData(documentation);
      notifications.removeNotification(loadingId);
      notifications.success('Documentation Generated', `Documentation for ${fileName} is ready`);
    } catch (error) {
      notifications.removeNotification(loadingId);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      notifications.error('Documentation Error', `Failed to generate documentation: ${errorMessage}`);
    } finally {
      setDocumentationLoading(false);
    }
  }, [generateDocumentation, notifications]);

  const handleCloseDocumentation = useCallback(() => {
    setShowDocumentation(false);
  }, []);

  const handleToggleAIEditor = useCallback(() => {
    setUseAIEnhancedEditor(!useAIEnhancedEditor);
  }, [useAIEnhancedEditor]);

  // Code inspection handlers
  const handleToggleInspections = useCallback(() => {
    setShowInspections(!showInspections);
  }, [showInspections]);

  const handleRunInspections = useCallback(async () => {
    if (!selectedFile || !getSelectedFileContent()) {
      notifications.warning('No File Selected', 'Please select a file to run inspections');
      return;
    }

    const loadingId = notifications.loading('Running Code Inspection', `Analyzing ${selectedFile}...`);
    setInspectionLoading(true);

    try {
      // Import the service dynamically to avoid SSR issues
      const { CodeInspectionService } = await import('@/lib/code-inspection-service');

      const config = {
        enabledCategories: ['syntax', 'code-style', 'performance', 'security', 'unused-code', 'complexity'] as any[],
        severity: {},
        customRules: [],
        aiEnhanced: aiConfigured
      };

      const service = new CodeInspectionService(config, aiSettings);
      const fileType = selectedFile.split('.').pop()?.toLowerCase() || 'javascript';
      const language = fileType === 'js' ? 'javascript' :
                      fileType === 'ts' ? 'typescript' :
                      fileType === 'tsx' ? 'typescript' :
                      fileType === 'jsx' ? 'javascript' :
                      fileType === 'py' ? 'python' :
                      fileType === 'css' ? 'css' :
                      fileType === 'html' ? 'html' :
                      'javascript';

      const results = await service.inspectCode(
        getSelectedFileContent(),
        selectedFile,
        language,
        { files: files.slice(0, 5).map(f => ({ name: f.name, content: f.content })) }
      );

      setInspections(results);
      notifications.removeNotification(loadingId);

      if (results.length === 0) {
        notifications.success('Code Inspection Complete', 'No issues found in your code!');
      } else {
        notifications.info('Code Inspection Complete', `Found ${results.length} issue${results.length > 1 ? 's' : ''} to review`);
      }

    } catch (error) {
      notifications.removeNotification(loadingId);
      notifications.error('Inspection Error', 'Failed to run code inspection. Using fallback analysis.');

      setInspections([]);

      // Add some basic fallback inspections for demonstration
      const fallbackInspections = [
        {
          id: 'demo-1',
          type: 'warning' as const,
          severity: 'warning' as const,
          message: 'Code inspection service is initializing',
          description: 'The inspection service is still loading. Try again in a moment.',
          category: 'syntax' as const,
          range: {
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 10
          },
          source: 'white-rabbit'
        }
      ];
      setInspections(fallbackInspections);
    } finally {
      setInspectionLoading(false);
    }
  }, [selectedFile, getSelectedFileContent, aiConfigured, aiSettings, files, notifications]);

  const handleInspectionClick = useCallback((inspection: any) => {
    // If the inspection is for a different file, switch to that file first
    if (inspection.fileName && inspection.fileName !== selectedFile) {
      setSelectedFile(inspection.fileName);
    }

    // Try to navigate to the line in Monaco editor
    // This will work if Monaco is loaded and available
    setTimeout(() => {
      try {
        // Try to find Monaco editor instance
        const monacoContainer = document.querySelector('.monaco-editor');
        if (monacoContainer) {
          // Dispatch a custom event that Monaco can listen to
          const event = new CustomEvent('navigateToLine', {
            detail: {
              lineNumber: inspection.range.startLineNumber,
              column: inspection.range.startColumn || 1
            }
          });
          monacoContainer.dispatchEvent(event);
        }
      } catch (error) {
        // Handle navigation error silently
      }
    }, 100);
  }, [selectedFile, setSelectedFile]);

  const handleQuickFix = useCallback(async (inspection: any) => {
    if (!inspection.quickFix || !selectedFile) {
      return;
    }

    try {
      const { QuickFixService } = await import('@/lib/code-inspection-service');
      const currentCode = getSelectedFileContent();

      if (!currentCode) {
        return;
      }

      const fixedCode = QuickFixService.applyQuickFix(currentCode, inspection.quickFix);
      updateFileContent(selectedFile, fixedCode);

      // Re-run inspections after applying fix to see if issue is resolved
      setTimeout(() => {
        handleRunInspections();
      }, 500);

    } catch (error) {
      // Handle quick fix error silently
    }
  }, [selectedFile, getSelectedFileContent, updateFileContent, handleRunInspections]);

  const handleCloseInspections = useCallback(() => {
    setShowInspections(false);
  }, []);

  // Check if current file has cached documentation
  const hasDocumentation = useMemo(() => {
    if (!selectedFile) return false;
    const cached = getCachedDocumentation(selectedFile);
    return !!cached;
  }, [selectedFile, getCachedDocumentation]);



  // Helper function to get file type from language
  const getFileTypeFromLanguage = (language: string): 'html' | 'css' | 'js' | 'json' | 'md' | 'tsx' | 'ts' | 'py' | 'txt' => {
    const lang = language.toLowerCase();
    switch (lang) {
      case 'javascript':
      case 'js':
        return 'js';
      case 'typescript':
      case 'ts':
        return 'tsx';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'markdown':
      case 'md':
        return 'md';
      case 'python':
      case 'py':
        return 'py';
      case 'php':
      case 'java':
      case 'c':
      case 'cpp':
      case 'c++':
      case 'csharp':
      case 'c#':
      case 'go':
      case 'rust':
      case 'ruby':
      case 'swift':
      case 'kotlin':
        return 'txt'; // Map unsupported languages to txt
      default:
        return 'txt';
    }
  };

  const [showEnhancedOnboarding, setShowEnhancedOnboarding] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    try {
      return localStorage.getItem('wr-welcome-dismissed') === '1' ? false : true;
    } catch {
      return true;
    }
  });
  const dismissWelcome = useCallback(() => {
    try { localStorage.setItem('wr-welcome-dismissed', '1'); } catch {}
    setShowWelcome(false);
  }, []);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('wr-onboarding-completed');
    if (!hasCompletedOnboarding && !showEnhancedOnboarding) {
      // Show onboarding after a short delay
      const timer = setTimeout(() => {
        setShowEnhancedOnboarding(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showEnhancedOnboarding]);


  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">White Rabbit Code Editor</h2>
          <p className="text-gray-600 mb-4">{loadingMessage}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      {/* New App Wizard & Publish Modals */}
      <NewAppWizard
        open={showNewApp}
        onOpenChange={setShowNewApp}
        onCreate={(opts: NewAppOptions) => {
          // Minimal scaffold: set brand color var and create basic nav + pages
          const css = `:root{--brand:${opts.brandColor};--radius:8px;--shadow:12px}`;
          addNewFile('style.css', 'css');
          updateFileContent('style.css', css);
          // Basic index.html with nav and optional login
          const navLogin = opts.authEnabled ? '<a href="#" class="nav-link">Login</a>' : '';
          const logoTag = opts.logoUrl ? `<img src="${opts.logoUrl}" alt="${opts.name}" style="height:24px"/>` : opts.name;
          const html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8"/>\n<meta name="viewport" content="width=device-width, initial-scale=1.0"/>\n<title>${opts.name}</title>\n<link rel="stylesheet" href="style.css"/>\n</head>\n<body>\n<nav class="navbar"><div class="brand">${logoTag}</div><div class="nav-links"><a href="#" class="nav-link">Home</a><a href="#" class="nav-link">Features</a>${navLogin}</div></nav>\n<main class="container">\n  <section class="hero"><h1>${opts.name}</h1><p>Welcome! Your app is ready.</p><a class="btn" href="#">Get Started</a></section>\n  <section class="features"><h2>Features</h2><ul><li>Fast setup</li><li>Clean design</li><li>Easy deploy</li></ul></section>\n</main>\n</body>\n</html>`;
          addNewFile('index.html', 'html');
          updateFileContent('index.html', html);
          setSelectedFile('index.html');
        }}
      />
      <PublishModal open={showPublish} onOpenChange={setShowPublish} files={files} />
      <StylePanel open={showStyle} onOpenChange={setShowStyle} />
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Sidebar - File Explorer & AI Chat */}
        <ResizablePanel
          defaultSize={responsiveConfig.sidebarDefaultSize}
          minSize={responsiveConfig.sidebarMinSize}
          maxSize={responsiveConfig.sidebarMaxSize}
        >
          <div className="bg-gray-800 border-r border-gray-700 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-750">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center p-1">
                <img
                  src="/whitebunnylogo.png"
                  alt="White Rabbit"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">White Rabbit</h2>
                <p className="text-xs text-gray-400">Code Editor</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <DarkModeToggleButton />

              {/* Settings Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAISettings(!showAISettings)}
                className="h-8 w-8 p-0"
                title="AI Settings (BYOK)"
              >
                <Settings className="w-4 h-4" />
              </Button>

              {/* User Profile */}
              {session?.user ? (
                <div className="flex items-center gap-2">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-6 h-6 rounded-full"
                    />

                  )}
                  <span className="text-xs text-gray-300">
                    {session.user.name || session.user.email}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = '/setup'}
                  >
                    Setup GitHub
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = '/auth/signin'}
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* File Explorer */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Files</h3>
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => initializeDefaultProject()}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="New Project"
                >
                  <FileText className="w-3 h-3" />
                </Button>
                <Button
                  onClick={() => addNewFile('new-file.js')}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="Add File"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              {files.map((file) => (
                <button
                  key={file.name}
                  onClick={() => setSelectedFile(file.name)}
                  className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 ${
                    selectedFile === file.name
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm">{getFileTypeIcon(file.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(file.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedFile === file.name && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file.name);
                      }}
                      className="h-4 w-4 p-0 opacity-50 hover:opacity-100 cursor-pointer inline-flex items-center justify-center rounded hover:bg-gray-200"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteFile(file.name);
                        }
                      }}
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Chat - Expanded */}
        <div className="border-t flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-hidden">
            <AIChat
              messages={aiMessages || []}
              onSendMessage={handleSendMessage}
              onClearMessages={clearAIMessages}
              isLoading={aiLoading}
              isConfigured={aiConfigured}
              settings={aiSettings}
              onSettingsChange={updateAISettings}
              streamedMessage={aiStreamedMessage}
              isStreaming={aiIsStreaming}
              onCodeGenerated={(filename, content, language) => {
                // Create or update the target file in Monaco and focus it
                const fileType = getFileTypeFromLanguage(language);
                const exists = files.some(f => f.name === filename);
                if (!exists) {
                  addNewFile(filename, fileType);
                }
                setTimeout(() => updateFileContent(filename, content), 0);
                setSelectedFile(filename);
                setViewMode('code');
              }}
            />
          </div>

          {/* Live Coding Engine - Fixed at bottom */}
          <LiveCodingEngine
            onFileCreate={(name, content) => {
              const getFileType = (filename: string): FileContent['type'] => {
                const ext = filename.split('.').pop()?.toLowerCase();
                switch (ext) {
                  case 'js': case 'jsx': return 'js';
                  case 'ts': case 'tsx': return 'tsx';
                  case 'html': return 'html';
                  case 'css': return 'css';
                  case 'json': return 'json';
                  case 'md': return 'md';
                  case 'py': return 'py';
                  default: return 'txt';
                }
              };

              addNewFile(name, getFileType(name));
              setTimeout(() => updateFileContent(name, content), 100);
            }}
            onFileUpdate={updateFileContent}
            onFileSelect={setSelectedFile}
          />
          {/* Live Diff Dock */}
          <LiveDiffDock
            diffs={Object.values(diffs)}
            onRevertChunk={(filename) => {
              const entry = diffs[filename];
              if (entry) {
                updateFileContent(filename, entry.before);
                setDiffs(prev => ({ ...prev, [filename]: { ...entry, after: entry.before } }));
              }
            }}
            onApproveAll={() => {
              setDiffs({});
            }}
            onOpenDiff={(filename) => {
              const entry = diffs[filename];
              if (entry) setOpenDiff(entry);
            }}
          />
          {openDiff && (
            <MonacoDiffOverlay
              filename={openDiff.filename}
              original={openDiff.before}
              modified={openDiff.after}
              onClose={() => setOpenDiff(null)}
            />
          )}
        </div>
          </div>
        </ResizablePanel>

        {/* Resizable Handle */}
        <ResizableHandle withHandle />

        {/* Main Content Area */}
        <ResizablePanel 
          defaultSize={100 - responsiveConfig.sidebarDefaultSize} 
          minSize={100 - responsiveConfig.sidebarMaxSize}
        >
          <div className="flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <Button
                  variant={viewMode === "code" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("code")}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Editor
                </Button>

                <Button
                  variant={viewMode === "terminal" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("terminal")}
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  Terminal
                </Button>
                <Button
                  variant={viewMode === "preview" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("preview")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant={viewMode === "marketplace" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("marketplace")}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Extensions
                </Button>
                <Button
                  variant={viewMode === "visual" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("visual")}
                >
                  <Code className="w-4 h-4 mr-2" />
                  Visual
                </Button>

                <Button
                  variant={viewMode === "visual-tools" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("visual-tools")}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Visual Tools
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEnhancedOnboarding(true)}
                  className="flex items-center gap-2"
                  title="Interactive Onboarding"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Onboarding
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKeyboardShortcuts(true)}
                  className="flex items-center gap-2"
                  title="Keyboard Shortcuts"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Shortcuts
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Split Controls - Hidden on mobile/tablet */}
              {!responsiveConfig.shouldDisableSplits && (
                <SplitControls
                  onSplitHorizontal={() => {
                    setUseSplitLayout(true);
                    // Split functionality will be handled by the SplitEditorLayout component
                  }}
                  onSplitVertical={() => {
                    setUseSplitLayout(true);
                    // Split functionality will be handled by the SplitEditorLayout component
                  }}
                  onResetLayout={() => {
                    setUseSplitLayout(false);
                  }}
                  showInToolbar={true}
                />
              )}

              <Button
                onClick={handleCodeColorToggle}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {codeColor ? 'Light' : 'Dark'}
              </Button>

              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              <Button variant="outline" size="sm">
                <Server className="w-4 h-4 mr-2" />
                Deploy
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "code" && (
            <div className="h-full flex flex-col">
              {/* Advanced Editor Toolbar */}
              <AdvancedEditorToolbar
                files={files}
                selectedFile={selectedFile}
                onNavigateToResult={(file) => {
                  setSelectedFile(file);
                }}
                onReplaceInFile={(fileName, searchText, replaceText) => {
                  // Implement replace functionality
                  const file = files.find(f => f.name === fileName);
                  if (file) {
                    const newContent = file.content.replace(new RegExp(searchText, 'g'), replaceText);
                    updateFileContent(fileName, newContent);
                  }
                }}
                onFormatCode={() => {
                  // Implement format functionality
                }}
              />

              <div className="flex-1 flex flex-col">
                {/* File Tabs */}
                <FileTabs
                  files={files}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                  onCloseFile={handleCloseFile}
                  hasUnsavedChanges={autoSave.hasUnsavedChanges}
                  showDocumentation={showDocumentation}
                  onToggleDocumentation={handleToggleDocumentation}
                  hasDocumentation={hasDocumentation}
                  useAIEnhancedEditor={useAIEnhancedEditor}
                  onToggleAIEditor={handleToggleAIEditor}
                  aiConfigured={aiConfigured}
                  showInspections={showInspections}
                  onToggleInspections={handleToggleInspections}
                  onRunInspections={handleRunInspections}
                  inspectionCount={inspections.length}
                />

                {/* Code Editor and Side Panels */}
                <div className="flex-1 flex">
                  {/* Code Editor - Split Layout or Single Editor */}
                  <div className={`${
                    showDocumentation && showInspections ? 'flex-1' :
                    showDocumentation || showInspections ? 'flex-1' : 'w-full'
                  } transition-all duration-300`}>
                    {useSplitLayout ? (
                      <SplitEditorLayout
                        files={files}
                        selectedFile={selectedFile}
                        onSelectFile={setSelectedFile}
                        onCloseFile={handleCloseFile}
                        onUpdateFileContent={(filename, content) => {
                          updateFileContent(filename, content);
                          autoSave.save({
                            file: filename,
                            content
                          });
                        }}
                        getFileContent={getSelectedFileContent}
                        getLanguageFromFileName={getLanguageFromFileName}
                        hasUnsavedChanges={autoSave.hasUnsavedChanges}
                        useAIEnhancedEditor={useAIEnhancedEditor}
                        aiConfigured={aiConfigured}
                        theme={codeColor ? "hex-light" : "kex-dark"}
                        showDocumentation={showDocumentation}
                        onToggleDocumentation={handleToggleDocumentation}
                        hasDocumentation={hasDocumentation}
                        showInspections={showInspections}
                        onToggleInspections={handleToggleInspections}
                        onRunInspections={handleRunInspections}
                        inspectionCount={inspections.length}
                        onToggleAIEditor={handleToggleAIEditor}
                      />
                    ) : (
                      <ErrorBoundary>
                        <FastLiveCoding
                          value={getSelectedFileContent() || ''}
                          onChange={(content) => {
                            if (selectedFile && content !== undefined) {
                              updateFileContent(selectedFile, content);
                              autoSave.save({
                                file: selectedFile,
                                content
                              });
                            }
                          }}
                          language={getLanguageFromFileName(selectedFile)}
                          theme={codeColor ? "hex-light" : "kex-dark"}
                          height="100%"
                          onLanguageChange={(newLanguage) => {
                            // Handle language change if needed
                            console.log('Language changed to:', newLanguage);
                          }}
                        />
                      </ErrorBoundary>
                    )}
                  </div>

                  {/* Right Side Panels */}
                  {(showDocumentation || showInspections) && (
                    <div className={`${
                      showDocumentation && showInspections ? 'w-[800px]' : 'w-96'
                    } border-l border-gray-200 bg-white flex transition-all duration-300`}>

                      {/* Documentation Panel */}
                      {showDocumentation && (
                        <div className={`${showInspections ? 'w-1/2 border-r border-gray-200' : 'w-full'}`}>
                          <DocumentationPanel
                            documentation={documentationData}
                            isLoading={documentationLoading}
                            onGenerate={handleGenerateDocumentation}
                            onClose={handleCloseDocumentation}
                            currentFile={selectedFile}
                            currentCode={getSelectedFileContent() || ''}
                            className="h-full"
                          />
                        </div>
                      )}

                      {/* Code Inspection Panel */}
                      {showInspections && (
                        <div className={`${showDocumentation ? 'w-1/2' : 'w-full'}`}>
                          <CodeInspectionPanel
                            inspections={inspections}
                            isLoading={inspectionLoading}
                            onInspectionClick={handleInspectionClick}
                            onQuickFix={handleQuickFix}
                            onExplain={(inspection) => {
                              const prompt = `Explain this issue in plain English and propose safe fixes.\n\nFile: ${selectedFile}\nIssue: ${inspection.message}\nCategory: ${inspection.category}\nRange: ${inspection.range.startLineNumber}:${inspection.range.startColumn}-${inspection.range.endLineNumber}:${inspection.range.endColumn}\n\nCode:\n\n\`\`\`${selectedFile.split('.').pop()}\n${getSelectedFileContent()}\n\`\`\``;
                              handleSendMessage(prompt);
                            }}
                            onAutoFixAI={(inspection) => {
                              const prompt = `Provide a minimal patch to fix this issue. Output only as UPDATE_FILE:${selectedFile} with a single \`\`\` block.\n\nIssue: ${inspection.message}\nCategory: ${inspection.category}\nRange: ${inspection.range.startLineNumber}:${inspection.range.startColumn}-${inspection.range.endLineNumber}:${inspection.range.endColumn}\n\nCurrent code:\n\n\`\`\`${selectedFile.split('.').pop()}\n${getSelectedFileContent()}\n\`\`\``;
                              handleSendMessage(prompt);
                            }}
                            onRefresh={handleRunInspections}
                            onClose={handleCloseInspections}
                            className="h-full"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

              {(viewMode as string) === "git" && (
                <div className="h-full">
                  <GitPanel className="h-full" />
                </div>
              )}

              {(viewMode as string) === "extensions" && (
                <div className="h-full">
                  <ExtensionConsole className="h-full" />
                </div>
              )}

              {(viewMode as string) === "visual" && (
                <div className="h-full">
                  <VisualProgrammingInterface
                    onCodeGenerated={(code, language) => {
                      // Create a new file with the generated code
                      const fileName = `visual-generated.${language === 'javascript' ? 'js' : 'js'}`;
                      addNewFile(fileName, 'js');
                      setTimeout(() => updateFileContent(fileName, code), 100);
                      setSelectedFile(fileName);
                      setViewMode('code');
                    }}
                    onSaveTemplate={() => {
                      // Implementation for saving templates
                    }}
                    onLoadTemplate={() => {
                      // Implementation for loading templates
                    }}
                    className="h-full"
                  />
                </div>
              )}

              </div>
            </div>
          )}

          {(viewMode as string) === "terminal" && (
            <div className="h-full">
              <TerminalComponent
                session={terminal.getActiveSession() || {
                  id: 'default',
                  name: 'Terminal',
                  commands: [],
                  isActive: true,
                  workingDirectory: '/Users/georgalbert/pwa-code-3',
                  environment: {}
                }}
                onExecuteCommand={async (command) => {
                  try {
                    if (!terminal.getActiveSession()) {
                      terminal.createSession('Default Terminal');
                    }
                    await terminal.executeCommand(command);
                  } catch (error) {
                    // Handle terminal command error
                  }
                }}
                onOpenFile={(filePath, lineNumber, columnNumber) => {
                  // Check if file exists in current project
                  const existingFile = files.find(f => f.name === filePath || f.name.endsWith(filePath));
                  if (existingFile) {
                    setSelectedFile(existingFile.name);
                    // TODO: Navigate to specific line number in Monaco editor
                  } else {
                    // Try to create a new file if it doesn't exist
                    const fileName = filePath.split('/').pop() || filePath;
                    addNewFile(fileName, 'txt');
                    // Update the content after creation
                    setTimeout(() => {
                      updateFileContent(fileName, `// File: ${filePath}\n// Line ${lineNumber}${columnNumber ? `:${columnNumber}` : ''}\n\n// This file was opened from a terminal stack trace`);
                    }, 0);
                    setSelectedFile(fileName);
                  }
                }}
                onClose={() => {}}
                onMinimize={() => {}}
              />
            </div>
          )}

          {(viewMode as string) === "preview" && (
            <div className="h-full p-4">
              <LivePreview
                files={files}
                className="h-full"
              />
            </div>
          )}

          {(viewMode as string) === "marketplace" && (
            <div className="h-full p-4">
              <ExtensionMarketplace className="h-full" />
            </div>
          )}

          {(viewMode as string) === "visual-tools" && (
            <div className="h-full">
              <VisualToolsDemo />
            </div>
          )}
        </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Overlays */}
      {showWelcome && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
          onClick={dismissWelcome}
          onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') dismissWelcome(); }}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="mx-4 w-full max-w-xl rounded-2xl border border-white/10 bg-neutral-900/90 p-6 shadow-2xl pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded bg-white flex items-center justify-center overflow-hidden">
                <img src="/whitebunnylogo.png" alt="White Rabbit" className="h-full w-full object-contain" />
              </div>
              <h3 className="text-lg font-semibold text-white flex-1">Welcome</h3>
              <button type="button" onClick={dismissWelcome} className="text-neutral-300 hover:text-white">✕</button>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed mb-5">
              Welcome, human. How are we doing today? Choose an action to get started.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={dismissWelcome}
                className="bg-gradient-to-r from-purple-600 to-cyan-400 text-white"
              >
                Enter Editor
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  const name = 'welcome.txt';
                  if (!files.find(f => f.name === name)) {
                    addNewFile(name, 'txt');
                  }
                  setTimeout(() => {
                    updateFileContent(name, `# Welcome\n\nTell me what you want to build.`);
                    setSelectedFile(name);
                  }, 0);
                  dismissWelcome();
                }}
              >
                Create Welcome File
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setViewMode('visual-tools');
                  dismissWelcome();
                }}
              >
                Explore Visual Tools
              </Button>
            </div>
          </div>
        </div>
      )}
      <OnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} />
      <CommandPalette keyboardService={ksInstance} open={showCommandPalette} onOpenChange={setShowCommandPalette} />
      <EnhancedOnboarding
        isOpen={showEnhancedOnboarding}
        onClose={() => setShowEnhancedOnboarding(false)}
        onComplete={() => {
          setShowEnhancedOnboarding(false);
          localStorage.setItem('wr-onboarding-completed', 'true');
        }}
      />
      <CompactKeyboardShortcuts
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      {/* BYOK AI Settings Modal */}
      <BYOKAISettings
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
        currentSettings={aiSettings}
        onSaveSettings={updateAISettings}
      />
    </div>
  );
}
