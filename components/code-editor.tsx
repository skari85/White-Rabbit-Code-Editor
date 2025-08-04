import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCodeBuilder } from "@/hooks/use-code-builder";
import { useAIAssistantEnhanced } from "@/hooks/use-ai-assistant-enhanced";
import { TerminalComponent } from "@/components/terminal";
import { AIChat } from "@/components/ai-chat";
import { useTerminal } from "@/hooks/use-terminal";
import { useSession } from "next-auth/react";
import {
  Download,
  ExternalLink,
  Plus,
  FileText,
  Bot,
  Terminal,
  X,
  Server,
  RefreshCw,
  Package,
  Settings
} from "lucide-react";
import LazyMonacoEditor from './lazy-monaco-editor';
import { ErrorBoundary } from './error-boundary';
import { useAutoSave } from '@/hooks/use-debounced-auto-save';
import FileTabs from './file-tabs';

import LivePreview from './live-preview';
import AISettingsSidebar from './ai-settings-sidebar';
import GitHubIntegration from './github-integration';
import VercelIntegrationComponent from './vercel-integration';
import Marketplace from './marketplace';
import CodeAnalysisPanel from './code-analysis-panel';
import AdvancedEditorToolbar from './advanced-editor-toolbar';
import BYOKAISettings from './byok-ai-settings';

export default function CodeEditor() {
  // Code Builder hooks
  const {
    files,
    selectedFile,
    setSelectedFile,
    updateFileContent,
    addNewFile,
    deleteFile,
    getSelectedFileContent,
    parseAndApplyAIResponse,
    initializeDefaultProject
  } = useCodeBuilder();

  // AI Assistant
  const {
    sendMessage: sendAIMessage,
    isLoading: aiLoading,
    settings: aiSettings,
    messages: aiMessages,
    clearMessages: clearAIMessages,
    isConfigured: aiConfigured,
    saveSettings: updateAISettings
  } = useAIAssistantEnhanced();

  const terminal = useTerminal();

  const [viewMode, setViewMode] = useState<"code" | "terminal" | "preview" | "marketplace">("code");
  const [codeColor, setCodeColor] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);

  // GitHub integration
  const { data: session } = useSession();

  // Auto-save functionality
  const autoSave = useAutoSave({
    delay: 2000,
    onSave: async (data) => {
      console.log('Auto-saving:', data);
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
    try {
      // Simple context for AI
      const context = {
        files: files,
        selectedFile: selectedFile,
        appSettings: aiSettings
      };

      const response = await sendAIMessage(message, context);

      if (response) {
        const changesApplied = parseAndApplyAIResponse(response.content);
        if (changesApplied > 0) {
          console.log(`Applied ${changesApplied} file changes from AI response`);
        }
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
    }
  }, [sendAIMessage, files, selectedFile, parseAndApplyAIResponse, aiSettings]);

  const handleCodeColorToggle = () => {
    setCodeColor(!codeColor);
  };

  // Memoize the onCodeGenerated callback to prevent infinite re-renders
  const handleCodeGenerated = useCallback((filename: string, content: string, language: string) => {
    // Determine file type from extension
    const getFileType = (name: string): 'html' | 'css' | 'js' | 'json' | 'md' | 'tsx' | 'ts' | 'py' | 'txt' => {
      const ext = name.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'html': case 'htm': return 'html';
        case 'css': return 'css';
        case 'js': case 'jsx': return 'js';
        case 'ts': return 'ts';
        case 'tsx': return 'tsx';
        case 'json': return 'json';
        case 'md': return 'md';
        case 'py': return 'py';
        default: return 'txt';
      }
    };

    // Add the generated file to the project
    addNewFile(filename, getFileType(filename));
    // Update the file content
    updateFileContent(filename, content);
    // Select the newly created file
    setSelectedFile(filename);
  }, [addNewFile, updateFileContent, setSelectedFile]);



  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - File Explorer & AI Chat */}
      <div className="w-96 bg-white border-r flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">H&K</span>
              </div>
              <div>
                <h2 className="font-semibold text-sm">Hex & Kex</h2>
                <p className="text-xs text-gray-500">Code Editor</p>
              </div>
            </div>

            {/* Settings and User Profile */}
            <div className="flex items-center gap-2">
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
                  <span className="text-xs text-gray-600">
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
        <div className="border-t flex-1 min-h-0">
          <AIChat
            messages={aiMessages || []}
            onSendMessage={handleSendMessage}
            onClearMessages={clearAIMessages}
            isLoading={aiLoading}
            isConfigured={aiConfigured}
            settings={aiSettings}
            onSettingsChange={updateAISettings}
            onCodeGenerated={handleCodeGenerated}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                onFormatCode={(fileName) => {
                  // Implement format functionality
                  console.log('Format code for:', fileName);
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
                />

                {/* Code Editor */}
                <div className="flex-1">
                  <ErrorBoundary>
                    <LazyMonacoEditor
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
                    />
                  </ErrorBoundary>
                </div>
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
                    console.error('Terminal command failed:', error);
                  }
                }}
                onOpenFile={(filePath, lineNumber, columnNumber) => {
                  // Check if file exists in current project
                  const existingFile = files.find(f => f.name === filePath || f.name.endsWith(filePath));
                  if (existingFile) {
                    setSelectedFile(existingFile.name);
                    // TODO: Navigate to specific line number in Monaco editor
                    console.log(`Opening file: ${existingFile.name} at line ${lineNumber}:${columnNumber}`);
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
                selectedFile={selectedFile}
                className="h-full"
              />
            </div>
          )}

          {(viewMode as string) === "marketplace" && (
            <div className="h-full p-4">
              <Marketplace className="h-full" />
            </div>
          )}
        </div>
      </div>

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
