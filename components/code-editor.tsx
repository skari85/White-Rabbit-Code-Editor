import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { useCodeBuilder, FileContent } from "@/hooks/use-code-builder";
import { useAIAssistantEnhanced } from "@/hooks/use-ai-assistant-enhanced";
import { TerminalComponent } from "@/components/terminal";
import { AIChat } from "@/components/ai-chat";
import { useTerminal } from "@/hooks/use-terminal";
import LiveCodingEngine from "@/components/live-coding-engine";
import { useSession } from "next-auth/react";
import {
  Download,
  ExternalLink,
  Plus,
  FileText,

  Terminal,
  X,
  Server,
  RefreshCw,
  Package,
  Settings
} from "lucide-react";
import LazyMonacoEditor from './lazy-monaco-editor';
import AIEnhancedMonacoEditor from './ai-enhanced-monaco-editor';
import { ErrorBoundary } from './error-boundary';
import { useAutoSave } from '@/hooks/use-debounced-auto-save';
import FileTabs from './file-tabs';

import LivePreview from './live-preview';
import Marketplace from './marketplace';
import AdvancedEditorToolbar from './advanced-editor-toolbar';
import BYOKAISettings from './byok-ai-settings';
import DocumentationPanel from './documentation-panel';
import CodeInspectionPanel from './code-inspection-panel';

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
    saveSettings: updateAISettings,
    generateDocumentation,
    getCachedDocumentation,
    setFileGenerationCallbacks
  } = useAIAssistantEnhanced();

  const terminal = useTerminal();

  const [viewMode, setViewMode] = useState<"code" | "terminal" | "preview" | "marketplace">("code");

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

        addNewFile(name, getFileType(name));
        // Update content after file is created
        setTimeout(() => updateFileContent(name, content), 100);
      },
      onUpdate: (name: string, content: string) => {
        updateFileContent(name, content);
      },
      onSelect: (name: string) => {
        setSelectedFile(name);
      }
    });
  }, [setFileGenerationCallbacks, addNewFile, updateFileContent, setSelectedFile]);
  const [codeColor, setCodeColor] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);

  // Documentation state
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [documentationData, setDocumentationData] = useState<any>(null);
  const [documentationLoading, setDocumentationLoading] = useState(false);

  // AI-enhanced editor state
  const [useAIEnhancedEditor, setUseAIEnhancedEditor] = useState(true);

  // Code inspection state
  const [showInspections, setShowInspections] = useState(false);
  const [inspections, setInspections] = useState<any[]>([]);
  const [inspectionLoading, setInspectionLoading] = useState(false);

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

    setDocumentationLoading(true);
    try {
      const fileType = fileName.split('.').pop()?.toLowerCase() || 'txt';
      const documentation = await generateDocumentation(code, fileName, fileType);
      setDocumentationData(documentation);
    } catch (error) {
      console.error('Failed to generate documentation:', error);
    } finally {
      setDocumentationLoading(false);
    }
  }, [generateDocumentation]);

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
    if (!selectedFile || !getSelectedFileContent()) return;

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
      const language = fileType === 'js' ? 'javascript' : fileType === 'ts' ? 'typescript' : fileType;

      const results = await service.inspectCode(
        getSelectedFileContent(),
        selectedFile,
        language,
        { files: files.slice(0, 5) }
      );

      setInspections(results);
    } catch (error) {
      console.error('Code inspection failed:', error);
      setInspections([]);
    } finally {
      setInspectionLoading(false);
    }
  }, [selectedFile, getSelectedFileContent, aiConfigured, aiSettings, files]);

  const handleInspectionClick = useCallback((inspection: any) => {
    // Navigate to the inspection location in the editor
    console.log('Navigate to inspection:', inspection);
  }, []);

  const handleQuickFix = useCallback(async (inspection: any) => {
    if (!inspection.quickFix || !selectedFile) return;

    try {
      const { QuickFixService } = await import('@/lib/code-inspection-service');
      const currentCode = getSelectedFileContent();
      const fixedCode = QuickFixService.applyQuickFix(currentCode, inspection.quickFix);
      updateFileContent(selectedFile, fixedCode);

      // Re-run inspections after applying fix
      setTimeout(handleRunInspections, 500);
    } catch (error) {
      console.error('Quick fix failed:', error);
      throw error;
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

  // Memoize the onCodeGenerated callback to prevent infinite re-renders
  const handleCodeGenerated = useCallback((filename: string, content: string) => {
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
        <div className="border-t flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0">
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

          {/* Live Coding Engine */}
          <div className="border-t bg-gray-50 p-2">
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
              className="max-h-64"
            />
          </div>
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
                  {/* Code Editor */}
                  <div className={`${
                    showDocumentation && showInspections ? 'flex-1' :
                    showDocumentation || showInspections ? 'flex-1' : 'w-full'
                  } transition-all duration-300`}>
                    <ErrorBoundary>
                      {useAIEnhancedEditor && aiConfigured ? (
                        <AIEnhancedMonacoEditor
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
                          enableAICompletions={true}
                        />
                      ) : (
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
                      )}
                    </ErrorBoundary>
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
                            onRefresh={handleRunInspections}
                            onClose={handleCloseInspections}
                            className="h-full"
                          />
                        </div>
                      )}
                    </div>
                  )}
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
