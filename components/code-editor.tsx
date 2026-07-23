'use client';

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

import { Button } from '@/components/ui/button';
import { useCallback, useEffect, useState } from 'react';

import { AIChat } from '@/components/ai-chat';
import { AIDevelopmentOracleComponent } from '@/components/ai-development-oracle';
import BYOKAISettings from '@/components/byok-ai-settings';
import { CompileVibesOverlay } from '@/components/compile-vibes-overlay';
import DarkModeToggleButton from '@/components/DarkModeToggleButton';
import { DeveloperWellnessSuite } from '@/components/developer-wellness-suite';
import { ErrorBoundary } from '@/components/error-boundary';
import ExtensionMarketplace from '@/components/extension-marketplace';
import GitPanel from '@/components/git-panel';
import LiveCodingEngine from '@/components/live-coding-engine';
import LivePreview from '@/components/live-preview';
import MonacoCodeSpace from '@/components/monaco-code-space';
import NewAppWizard from '@/components/new-app-wizard';
import PublishModal from '@/components/publish-modal';
import SplitControls from '@/components/split-controls';
import SplitEditorLayout from '@/components/split-editor-layout';
import StylePanel from '@/components/style-panel';
import { TerminalComponent } from '@/components/terminal';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { VisualCodeIntelligenceComponent } from '@/components/visual-code-intelligence';
import { useAIAssistantEnhanced } from '@/hooks/use-ai-assistant-enhanced';
import { useAnalytics } from '@/hooks/use-analytics';
import { FileContent, useCodeBuilder } from '@/hooks/use-code-builder';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useTerminal } from '@/hooks/use-terminal';
import {
  Brain,
  Download,
  ExternalLink,
  FileText,
  GitBranch,
  Heart,
  Keyboard,
  Network,
  Package,
  Plus,
  RefreshCw,
  Rocket,
  Server,
  Settings,
  Terminal,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const LazyMonacoEditor = dynamic(() => import('./lazy-monaco-editor'), {
  loading: () => (
    <div className='flex items-center justify-center h-full'>
      <div className='text-center'>
        <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
        <p className='text-sm text-gray-600'>Loading Monaco Editor...</p>
      </div>
    </div>
  ),
  ssr: false,
});

const FastLiveCoding = dynamic(() => import('./fast-live-coding'), {
  loading: () => (
    <div className='flex items-center justify-center h-full'>
      <div className='text-center'>
        <div className='w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
        <p className='text-sm text-gray-600'>Loading Live Coding...</p>
      </div>
    </div>
  ),
  ssr: false,
});

// Interface for New App Wizard
interface NewAppOptions {
  name: string;
  brandColor: string;
  logoUrl?: string;
  authEnabled: boolean;
}

// Helper function to get file type icon
const getFileTypeIcon = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return '📄';
    case 'ts':
    case 'tsx':
      return '🔷';
    case 'html':
      return '🌐';
    case 'css':
      return '🎨';
    case 'json':
      return '📋';
    case 'md':
      return '📝';
    case 'py':
      return '🐍';
    case 'txt':
      return '📄';
    default:
      return '📄';
  }
};

export default function CodeEditor() {
  // Analytics
  const { trackFileCreated, trackUserSession } = useAnalytics();

  // Core state
  const {
    files,
    selectedFile,
    setSelectedFile,
    addNewFile,
    deleteFile,
    updateFileContent,
    getSelectedFileContent,
    getSelectedFileType,
    initializeDefaultProject,
    hasUnsavedChanges,
  } = useCodeBuilder();

  // AI Assistant
  const {
    messages: aiMessages,
    sendMessage: sendAIMessage,
    clearMessages: clearAIMessages,
    isLoading: aiLoading,
    isConfigured: aiConfigured,
    settings: aiSettings,
    saveSettings: saveAISettings,
    streamedMessage: aiStreamedMessage,
    isStreaming: aiIsStreaming,
  } = useAIAssistantEnhanced();

  // Wrapper function to match AIChat expected signature
  const handleSendMessage = useCallback(
    async (message: string): Promise<void> => {
      await sendAIMessage(message, {
        files: files.map(f => ({
          name: f.name,
          content: f.content,
          type: f.type,
        })),
        selectedFile,
        appSettings: {},
      });
    },
    [sendAIMessage, files, selectedFile]
  );

  // Terminal
  const terminal = useTerminal();

  // Responsive layout
  const responsiveConfig = useResponsiveLayout();

  // UI state
  const [viewMode, setViewMode] = useState<
    | 'code'
    | 'preview'
    | 'terminal'
    | 'git'
    | 'extensions'
    | 'oracle'
    | 'wellness'
    | 'intelligence'
  >('code');
  const [codeColor, setCodeColor] = useState(false);
  const [useSplitLayout, setUseSplitLayout] = useState(false);
  const [useAIEnhancedEditor, setUseAIEnhancedEditor] = useState(false);
  const [useMonacoCodeSpace, setUseMonacoCodeSpace] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    'Initializing workspace...'
  );

  // Modal states
  const [showNewApp, setShowNewApp] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showStyle, setShowStyle] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showEnhancedOnboarding, setShowEnhancedOnboarding] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    try {
      return localStorage.getItem('wr-welcome-dismissed') === '1'
        ? false
        : true;
    } catch {
      return true;
    }
  });

  // Helper functions

  const getLanguageFromFileName = useCallback(
    (fileName: string | null): string => {
      if (!fileName) return 'javascript';
      const ext = fileName.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'js':
        case 'jsx':
          return 'javascript';
        case 'ts':
        case 'tsx':
          return 'typescript';
        case 'html':
          return 'html';
        case 'css':
          return 'css';
        case 'json':
          return 'json';
        case 'md':
          return 'markdown';
        case 'py':
          return 'python';
        default:
          return 'javascript';
      }
    },
    []
  );

  const handleCodeColorToggle = useCallback(() => {
    setCodeColor(prev => !prev);
  }, []);

  const dismissWelcome = useCallback(() => {
    try {
      localStorage.setItem('wr-welcome-dismissed', '1');
    } catch {}
    setShowWelcome(false);
  }, []);

  // Helper function to get file type from language
  const getFileTypeFromLanguage = (language: string): FileContent['type'] => {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return 'js';
      case 'typescript':
      case 'ts':
        return 'ts';
      case 'tsx':
      case 'jsx':
        return 'tsx';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'python':
      case 'py':
        return 'py';
      case 'markdown':
      case 'md':
        return 'md';
      default:
        return 'txt';
    }
  };

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoadingMessage('Setting up workspace...');
        await initializeDefaultProject();

        setLoadingMessage('Loading components...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async init

        setIsInitializing(false);
      } catch (error) {
        // Log error to monitoring service in production
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [initializeDefaultProject]);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem(
      'wr-onboarding-completed'
    );
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
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            White Rabbit Code Editor
          </h2>
          <p className='text-gray-600 mb-4'>{loadingMessage}</p>
          <div className='flex items-center justify-center gap-2 text-sm text-gray-500'>
            <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse'></div>
            <div
              className='w-2 h-2 bg-blue-500 rounded-full animate-pulse'
              style={{ animationDelay: '0.2s' }}
            ></div>
            <div
              className='w-2 h-2 bg-blue-500 rounded-full animate-pulse'
              style={{ animationDelay: '0.4s' }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='h-screen bg-gray-900'>
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
          const navLogin = opts.authEnabled
            ? '<a href="#" class="nav-link">Login</a>'
            : '';
          const logoTag = opts.logoUrl
            ? `<img src="${opts.logoUrl}" alt="${opts.name}" style="height:24px"/>`
            : opts.name;
          const html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8"/>\n<meta name="viewport" content="width=device-width, initial-scale=1.0"/>\n<title>${opts.name}</title>\n<link rel="stylesheet" href="style.css"/>\n</head>\n<body>\n<nav class="navbar"><div class="brand">${logoTag}</div><div class="nav-links"><a href="#" class="nav-link">Home</a><a href="#" class="nav-link">Features</a>${navLogin}</div></nav>\n<main class="container">\n  <section class="hero"><h1>${opts.name}</h1><p>Welcome! Your app is ready.</p><a class="btn" href="#">Get Started</a></section>\n  <section class="features"><h2>Features</h2><ul><li>Fast setup</li><li>Clean design</li><li>Easy deploy</li></ul></section>\n</main>\n</body>\n</html>`;
          addNewFile('index.html', 'html');
          updateFileContent('index.html', html);
          setSelectedFile('index.html');
        }}
      />
      <PublishModal
        open={showPublish}
        onOpenChange={setShowPublish}
        files={files}
      />
      <StylePanel open={showStyle} onOpenChange={setShowStyle} />
      <ResizablePanelGroup direction='horizontal' className='h-full'>
        {/* Left Sidebar - File Explorer & AI Chat */}
        <ResizablePanel
          defaultSize={responsiveConfig.sidebarDefaultSize}
          minSize={responsiveConfig.sidebarMinSize}
          maxSize={responsiveConfig.sidebarMaxSize}
        >
          <div className='bg-gray-800 border-r border-gray-700 flex flex-col h-full overflow-hidden'>
            {/* Header */}
            <div className='p-4 border-b border-gray-700 bg-gray-750'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='w-8 h-8 bg-white rounded flex items-center justify-center p-1'>
                    <img
                      src='/whitebunnylogo.png'
                      alt='White Rabbit'
                      className='w-full h-full object-contain'
                    />
                  </div>
                  <div>
                    <h2 className='font-semibold text-sm text-white'>
                      White Rabbit
                    </h2>
                    <p className='text-xs text-gray-400'>Code Editor</p>
                  </div>
                </div>

                {/* Controls */}
                <div className='flex items-center gap-2'>
                  {/* Dark Mode Toggle */}
                  <DarkModeToggleButton />

                  {/* Settings Button */}
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowAISettings(!showAISettings)}
                    className='h-8 w-8 p-0'
                    title='AI Settings (BYOK)'
                  >
                    <Settings className='w-4 h-4' />
                  </Button>

                  {/* User label */}
                  <span className='text-xs text-gray-400'>White Rabbit</span>
                </div>
              </div>
            </div>

            {/* File Explorer */}
            <div className='flex-1 overflow-y-auto'>
              <div className='p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-sm font-medium'>Files</h3>
                  <div className='flex items-center gap-1'>
                    <Button
                      onClick={() => initializeDefaultProject()}
                      variant='ghost'
                      size='sm'
                      className='h-6 w-6 p-0'
                      title='New Project'
                    >
                      <FileText className='w-3 h-3' />
                    </Button>
                    <Button
                      onClick={() => addNewFile('new-file.js')}
                      variant='ghost'
                      size='sm'
                      className='h-6 w-6 p-0'
                      title='Add File'
                    >
                      <Plus className='w-3 h-3' />
                    </Button>
                  </div>
                </div>

                <div className='space-y-1'>
                  {files.map(file => (
                    <button
                      key={file.name}
                      onClick={() => setSelectedFile(file.name)}
                      className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 ${
                        selectedFile === file.name
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className='text-sm'>
                        {getFileTypeIcon(file.name)}
                      </span>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium truncate'>
                          {file.name}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {new Date(file.lastModified).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedFile === file.name && (
                        <span
                          onClick={e => {
                            e.stopPropagation();
                            deleteFile(file.name);
                          }}
                          className='h-4 w-4 p-0 opacity-50 hover:opacity-100 cursor-pointer inline-flex items-center justify-center rounded hover:bg-gray-200'
                          role='button'
                          tabIndex={0}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteFile(file.name);
                            }
                          }}
                        >
                          <X className='w-3 h-3' />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Chat - Expanded */}
            <div className='border-t flex-1 min-h-0 flex flex-col'>
              <div className='flex-1 min-h-0 overflow-hidden'>
                <AIChat
                  messages={aiMessages || []}
                  onSendMessage={handleSendMessage}
                  onClearMessages={clearAIMessages}
                  isLoading={aiLoading}
                  isConfigured={aiConfigured}
                  settings={aiSettings}
                  onSettingsChange={saveAISettings}
                  streamedMessage={aiStreamedMessage}
                  isStreaming={aiIsStreaming}
                  onCodeGenerated={(filename, content, language) => {
                    try {
                      // Validate inputs
                      if (!filename || !content) {
                        console.warn(
                          'onCodeGenerated: Invalid filename or content:',
                          { filename, content }
                        );
                        return;
                      }

                      // Create or update the target file in Monaco and focus it
                      const fileType = getFileTypeFromLanguage(language);
                      const exists = files.some(f => f.name === filename);
                      if (!exists) {
                        addNewFile(filename, fileType);
                      }
                      setTimeout(() => updateFileContent(filename, content), 0);
                      setSelectedFile(filename);
                      setViewMode('code');
                    } catch (error) {
                      console.error('Error in onCodeGenerated:', error);
                    }
                  }}
                />
              </div>

              {/* Live Coding Engine - Fixed at bottom */}
              <LiveCodingEngine
                onFileCreate={(name, content) => {
                  const getFileType = (
                    filename: string
                  ): FileContent['type'] => {
                    const ext = filename.split('.').pop()?.toLowerCase();
                    switch (ext) {
                      case 'js':
                      case 'jsx':
                        return 'js';
                      case 'ts':
                      case 'tsx':
                        return 'tsx';
                      case 'html':
                        return 'html';
                      case 'css':
                        return 'css';
                      case 'json':
                        return 'json';
                      case 'md':
                        return 'md';
                      case 'py':
                        return 'py';
                      default:
                        return 'txt';
                    }
                  };

                  addNewFile(name, getFileType(name));
                  setTimeout(() => updateFileContent(name, content), 100);
                }}
                onFileUpdate={updateFileContent}
                onFileSelect={setSelectedFile}
              />
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
          <div className='flex flex-col h-full overflow-hidden'>
            {/* Top Bar */}
            <div className='bg-white border-b px-4 py-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='flex gap-1'>
                    <Button
                      variant={viewMode === 'code' ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => setViewMode('code')}
                    >
                      <FileText className='w-4 h-4 mr-2' />
                      Editor
                    </Button>

                    <Button
                      variant={viewMode === 'terminal' ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => setViewMode('terminal')}
                    >
                      <Terminal className='w-4 h-4 mr-2' />
                      Terminal
                    </Button>
                    <Button
                      variant={viewMode === 'preview' ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => setViewMode('preview')}
                    >
                      <ExternalLink className='w-4 h-4 mr-2' />
                      Preview
                    </Button>
                    <Button
                      variant={viewMode === 'git' ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => setViewMode('git')}
                    >
                      <GitBranch className='w-4 h-4 mr-2' />
                      Git
                    </Button>
                    <Button
                      variant={viewMode === 'extensions' ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => setViewMode('extensions')}
                    >
                      <Package className='w-4 h-4 mr-2' />
                      Extensions
                    </Button>
                    <Button
                      variant={viewMode === 'oracle' ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => setViewMode('oracle')}
                    >
                      <Brain className='w-4 h-4 mr-2' />
                      Oracle
                    </Button>
                    <Button
                      variant={viewMode === 'wellness' ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => setViewMode('wellness')}
                    >
                      <Heart className='w-4 h-4 mr-2' />
                      Wellness
                    </Button>
                    <Button
                      variant={
                        viewMode === 'intelligence' ? 'default' : 'ghost'
                      }
                      size='sm'
                      onClick={() => setViewMode('intelligence')}
                    >
                      <Network className='w-4 h-4 mr-2' />
                      Intelligence
                    </Button>

                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setShowEnhancedOnboarding(true)}
                      className='flex items-center gap-2'
                      title='Interactive Onboarding'
                    >
                      <Rocket className='w-4 h-4 mr-2' />
                      Onboarding
                    </Button>

                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setShowKeyboardShortcuts(true)}
                      className='flex items-center gap-2'
                      title='Keyboard Shortcuts'
                    >
                      <Keyboard className='w-4 h-4 mr-2' />
                      Shortcuts
                    </Button>

                    <Button
                      variant={useMonacoCodeSpace ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => setUseMonacoCodeSpace(!useMonacoCodeSpace)}
                      className='flex items-center gap-2'
                      title='Monaco Code Space - Multi-tab editor'
                    >
                      <FileText className='w-4 h-4 mr-2' />
                      Tabs
                    </Button>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
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
                    variant='outline'
                    size='sm'
                  >
                    <RefreshCw className='w-4 h-4 mr-2' />
                    {codeColor ? 'Light' : 'Dark'}
                  </Button>

                  <Button variant='outline' size='sm'>
                    <Download className='w-4 h-4 mr-2' />
                    Export
                  </Button>

                  <Button variant='outline' size='sm'>
                    <Server className='w-4 h-4 mr-2' />
                    Deploy
                  </Button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className='flex-1 overflow-hidden'>
              {viewMode === 'code' && (
                <div className='h-full flex flex-col'>
                  <div className='flex-1 flex flex-col'>
                    {/* Code Editor - Monaco Code Space, Split Layout, or Single Editor */}
                    <div className='w-full transition-all duration-300'>
                      {useMonacoCodeSpace ? (
                        <MonacoCodeSpace
                          files={files}
                          selectedFile={selectedFile}
                          onFileUpdate={updateFileContent}
                          onFileSelect={setSelectedFile}
                          onFileCreate={(filename, content, language) => {
                            // Create new file from Monaco Code Space
                            const fileType = getFileTypeFromLanguage(language);
                            const exists = files.some(f => f.name === filename);
                            if (!exists) {
                              addNewFile(filename, fileType);
                            }
                            setTimeout(
                              () => updateFileContent(filename, content),
                              0
                            );
                            setSelectedFile(filename);
                            trackFileCreated(fileType, filename);
                          }}
                          theme={codeColor ? 'vs-light' : 'vs-dark'}
                          height='calc(100vh - 120px)'
                          className='h-full'
                        />
                      ) : useSplitLayout ? (
                        <SplitEditorLayout
                          files={files}
                          selectedFile={selectedFile}
                          onSelectFile={setSelectedFile}
                          onCloseFile={filename => {
                            deleteFile(filename);
                          }}
                          onUpdateFileContent={(filename, content) => {
                            updateFileContent(filename, content);
                          }}
                          getFileContent={getSelectedFileContent}
                          getLanguageFromFileName={getLanguageFromFileName}
                          hasUnsavedChanges={hasUnsavedChanges}
                          useAIEnhancedEditor={useAIEnhancedEditor}
                          aiConfigured={aiConfigured}
                          theme={codeColor ? 'hex-light' : 'kex-dark'}
                          onFileCreate={(filename, content, language) => {
                            // Create new file from AI generation in split pane
                            const fileType = getFileTypeFromLanguage(language);
                            const exists = files.some(f => f.name === filename);
                            if (!exists) {
                              addNewFile(filename, fileType);
                            }
                            setTimeout(
                              () => updateFileContent(filename, content),
                              0
                            );
                            setSelectedFile(filename);
                            trackFileCreated(fileType, filename);
                          }}
                          onMultipleFilesCreate={fileList => {
                            // Create multiple files from AI generation in split pane
                            fileList.forEach((file, index) => {
                              const fileType = getFileTypeFromLanguage(
                                file.language
                              );
                              const exists = files.some(
                                f => f.name === file.filename
                              );
                              if (!exists) {
                                addNewFile(file.filename, fileType);
                              }
                              setTimeout(
                                () =>
                                  updateFileContent(
                                    file.filename,
                                    file.content
                                  ),
                                index * 100
                              );
                              trackFileCreated(fileType, file.filename);
                            });
                            // Select the first created file
                            if (fileList.length > 0) {
                              setTimeout(
                                () => setSelectedFile(fileList[0].filename),
                                200
                              );
                            }
                          }}
                        />
                      ) : (
                        <ErrorBoundary>
                          <FastLiveCoding
                            value={getSelectedFileContent() || ''}
                            onChange={content => {
                              if (selectedFile && content !== undefined) {
                                updateFileContent(selectedFile, content);
                              }
                            }}
                            language={getLanguageFromFileName(selectedFile)}
                            theme={codeColor ? 'hex-light' : 'kex-dark'}
                            height='100%'
                            onLanguageChange={newLanguage => {
                              // Handle language change if needed
                            }}
                            onFileCreate={(filename, content, language) => {
                              // Create new file from AI generation
                              const fileType =
                                getFileTypeFromLanguage(language);
                              const exists = files.some(
                                f => f.name === filename
                              );
                              if (!exists) {
                                addNewFile(filename, fileType);
                              }
                              setTimeout(
                                () => updateFileContent(filename, content),
                                0
                              );
                              setSelectedFile(filename);
                              trackFileCreated(fileType, filename);
                            }}
                            onMultipleFilesCreate={fileList => {
                              // Create multiple files from AI generation
                              fileList.forEach((file, index) => {
                                const fileType = getFileTypeFromLanguage(
                                  file.language
                                );
                                const exists = files.some(
                                  f => f.name === file.filename
                                );
                                if (!exists) {
                                  addNewFile(file.filename, fileType);
                                }
                                setTimeout(
                                  () =>
                                    updateFileContent(
                                      file.filename,
                                      file.content
                                    ),
                                  index * 100
                                );
                                trackFileCreated(fileType, file.filename);
                              });
                              // Select the first created file
                              if (fileList.length > 0) {
                                setTimeout(
                                  () => setSelectedFile(fileList[0].filename),
                                  200
                                );
                              }
                            }}
                          />
                        </ErrorBoundary>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'terminal' && (
                <div className='h-full'>
                  <TerminalComponent
                    session={
                      terminal.getActiveSession() || {
                        id: 'default',
                        name: 'Terminal',
                        commands: [],
                        isActive: true,
                        workingDirectory: '/Users/georgalbert/pwa-code-3',
                        environment: {},
                      }
                    }
                    onExecuteCommand={async command => {
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
                      const existingFile = files.find(
                        f => f.name === filePath || f.name.endsWith(filePath)
                      );
                      if (existingFile) {
                        setSelectedFile(existingFile.name);
                        // TODO: Navigate to specific line number in Monaco editor
                      } else {
                        // Try to create a new file if it doesn't exist
                        const fileName = filePath.split('/').pop() || filePath;
                        addNewFile(fileName, 'txt');
                        // Update the content after creation
                        setTimeout(() => {
                          updateFileContent(
                            fileName,
                            `// File: ${filePath}\n// Line ${lineNumber}${columnNumber ? `:${columnNumber}` : ''}\n\n// This file was opened from a terminal stack trace`
                          );
                        }, 0);
                        setSelectedFile(fileName);
                      }
                    }}
                    onClose={() => {}}
                    onMinimize={() => {}}
                  />
                </div>
              )}

              {viewMode === 'preview' && (
                <div className='h-full p-4'>
                  <LivePreview files={files} className='h-full' />
                </div>
              )}

              {viewMode === 'git' && (
                <div className='h-full'>
                  <GitPanel className='h-full' />
                </div>
              )}

              {viewMode === 'extensions' && (
                <div className='h-full p-4'>
                  <ExtensionMarketplace className='h-full' />
                </div>
              )}

              {viewMode === 'oracle' && (
                <div className='h-full p-4'>
                  <AIDevelopmentOracleComponent
                    className='h-full'
                    onArchitectureGenerated={architecture => {
                      // Handle architecture generation - could create files automatically
                      console.log('Architecture generated:', architecture);
                    }}
                    onBugsDetected={bugs => {
                      // Handle bug detection - could show notifications
                      console.log('Bugs detected:', bugs);
                    }}
                  />
                </div>
              )}

              {viewMode === 'wellness' && (
                <div className='h-full p-4'>
                  <DeveloperWellnessSuite
                    className='h-full'
                    onThemeChange={theme => {
                      // Handle adaptive theme changes
                      console.log('Theme adapted:', theme);
                    }}
                    onBreakRecommended={() => {
                      // Handle break recommendations
                      console.log('Break recommended');
                    }}
                  />
                </div>
              )}

              {viewMode === 'intelligence' && (
                <div className='h-full p-4'>
                  <VisualCodeIntelligenceComponent
                    className='h-full'
                    onFocusModeChange={focusMode => {
                      // Handle focus mode changes
                      console.log('Focus mode changed:', focusMode);
                    }}
                    onPatternDetected={patterns => {
                      // Handle pattern detection
                      console.log('Patterns detected:', patterns);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Overlays */}
      {showWelcome && (
        <div
          className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto'
          onClick={dismissWelcome}
          onKeyDown={e => {
            if (e.key === 'Escape' || e.key === 'Enter') dismissWelcome();
          }}
          tabIndex={0}
          role='dialog'
          aria-modal='true'
        >
          <div
            className='mx-4 w-full max-w-xl rounded-2xl border border-white/10 bg-neutral-900/90 p-6 shadow-2xl pointer-events-auto'
            onClick={e => e.stopPropagation()}
          >
            <div className='flex items-center gap-3 mb-4'>
              <div className='h-9 w-9 rounded bg-white flex items-center justify-center overflow-hidden'>
                <img
                  src='/whitebunnylogo.png'
                  alt='White Rabbit'
                  className='h-full w-full object-contain'
                />
              </div>
              <h3 className='text-lg font-semibold text-white flex-1'>
                Welcome
              </h3>
              <button
                type='button'
                onClick={dismissWelcome}
                className='text-neutral-300 hover:text-white'
              >
                ✕
              </button>
            </div>
            <p className='text-neutral-300 text-sm leading-relaxed mb-5'>
              Welcome, human. How are we doing today? Choose an action to get
              started.
            </p>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                onClick={dismissWelcome}
                className='bg-gradient-to-r from-purple-600 to-cyan-400 text-white'
              >
                Enter Editor
              </Button>
              <Button
                variant='outline'
                type='button'
                onClick={() => {
                  const name = 'welcome.txt';
                  if (!files.find(f => f.name === name)) {
                    addNewFile(name, 'txt');
                  }
                  setTimeout(() => {
                    updateFileContent(
                      name,
                      `# Welcome\n\nTell me what you want to build.`
                    );
                    setSelectedFile(name);
                  }, 0);
                  dismissWelcome();
                }}
              >
                Create Welcome File
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BYOK AI Settings Modal */}
      <BYOKAISettings
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
        currentSettings={aiSettings}
        onSaveSettings={saveAISettings}
      />

      {/* Compile Vibes Overlay - Shows organic animations for build processes */}
      <CompileVibesOverlay
        enabled={true}
        position='top-right'
        size='medium'
        sensitivity='medium'
      />
    </div>
  );
}
