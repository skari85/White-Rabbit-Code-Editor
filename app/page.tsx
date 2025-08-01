'use client';

import React, { useState, useEffect } from 'react';
import { setupSimpleMonacoEnvironment } from '@/lib/monaco-setup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, MessageSquare, Code, Download, Play, HardDrive, X, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AIChat } from '@/components/ai-chat';
import { AISettingsPanel } from '@/components/ai-settings-panel';
import { LocalStorageManager } from '@/components/local-storage-manager';
import { useAIAssistantEnhanced } from '@/hooks/use-ai-assistant-enhanced';
import { useLocalStorage, LocalProject, LocalFile } from '@/hooks/use-local-storage';
import { PersonalityToggle, PersonalityThemeProvider } from '@/components/personality-toggle';
import { ContextSuggestions } from '@/components/context-suggestions';
import { GlitchPreview, useGlitchPreview } from '@/components/glitch-preview';
import { DNAThreads, useDNAThreads, CodeGeneration } from '@/components/dna-threads';
import { personalitySystem, PersonalityMode, CodeSuggestion } from '@/lib/personality-system';
import { GitHubAuth } from '@/components/github-auth';
import { CodeModeDial, useCodeMode, CodeMode } from '@/components/code-mode-dial';
import { SummonCodeBar, useSummonCodeBar, CommandParser } from '@/components/summon-code-bar';
import { useTerminal } from '@/hooks/use-terminal';
import HexLayoutSwitcher from '@/components/hex-layout-switcher';
import DevelopmentToolsPanel from '@/components/development-tools-panel';

import { FileExplorer } from '@/components/file-explorer';
import { EditorTabs } from '@/components/editor-tabs';
import { AICodeSpace } from '@/components/ai-code-space';
import { AIDebugPanel } from '@/components/ai-debug-panel';

// Setup Monaco Environment early
if (typeof window !== 'undefined') {
  setupSimpleMonacoEnvironment();
}

interface GeneratedFile {
  name: string;
  content: string;
  type: string;
}

export default function CodeConsole() {
  const [activeTab, setActiveTab] = useState('chat');
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [personality, setPersonality] = useState<PersonalityMode>('hex');
  const [cursorPosition, setCursorPosition] = useState({ lineNumber: 1, column: 1 });
  const [showDNAThreads, setShowDNAThreads] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showDevelopmentTools, setShowDevelopmentTools] = useState(false);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [aiCodeBlocks, setAICodeBlocks] = useState<{ code: string; lang?: string; messageId?: string }[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // Code Mode Dial hook
  const { currentMode, transformCode, setMode } = useCodeMode();
  
  // Summon Code Bar hook
  const { 
    isOpen: isSummonBarOpen, 
    recentCommands, 
    open: openSummonBar, 
    close: closeSummonBar, 
    executeCommand 
  } = useSummonCodeBar();
  
  const {
    settings,
    messages,
    isLoading,
    isConfigured,
    saveSettings,
    sendMessage,
    sendStreamingMessage,
    clearMessages,
    testConnection,
    streamedMessage,
    isStreaming
  } = useAIAssistantEnhanced();

  // Local storage hook
  const {
    currentProject: localProject,
    saveFile,
    isSupported: isLocalStorageSupported
  } = useLocalStorage();

  // Glitch Preview hook
  const {
    isGenerating,
    pendingCode,
    solidifiedCode,
    startGeneration,
    solidify,
    cancel
  } = useGlitchPreview();

  // DNA Threads hook
  const {
    generations,
    branches,
    currentGenerationId,
    addGeneration,
    rewindTo,
    forkFrom,
    deleteGeneration,
    markAsRejected
  } = useDNAThreads();

  // Terminal hook
  const {
    sessions: terminalSessions,
    activeSessionId,
    executeCommand: terminalExecuteCommand
  } = useTerminal();

  const terminalSession = terminalSessions.find(s => s.id === activeSessionId) || null;

  useEffect(() => {
    setMounted(true);
    // Initialize personality system after mounting
    personalitySystem.setPersonality(personality);
  }, [personality]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Hex & Kex AI Console...</p>
        </div>
      </div>
    );
  }

  // Extract files from AI responses
  const extractFilesFromMessage = (content: string): GeneratedFile[] => {
    const files: GeneratedFile[] = [];
    const codeBlockRegex = /```(\w+)?\n?(?:\/\/ (.+?)\n)?([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const [, language, filename, code] = match;
      if (filename && code.trim()) {
        files.push({
          name: filename,
          content: code.trim(),
          type: language || 'text'
        });
      }
    }
    return files;
  };

  // Handle AI message and extract files
  const handleSendMessage = async (message: string) => {
    try {
      const response = await sendStreamingMessage(message);
      
      // Extract files from the response
      const newFiles = extractFilesFromMessage(response.content);
      if (newFiles.length > 0) {
        // Start glitch preview for each new file
        newFiles.forEach(newFile => {
          startGeneration(newFile.content);
          
          // Add to DNA threads
          addGeneration(
            newFile.content,
            `Generated ${newFile.name} via ${personality.toUpperCase()} personality`,
            personality,
            newFile.name,
            currentGenerationId || undefined
          );
        });

        setGeneratedFiles(prev => {
          const updated = [...prev];
          newFiles.forEach(newFile => {
            const existingIndex = updated.findIndex(f => f.name === newFile.name);
            if (existingIndex >= 0) {
              updated[existingIndex] = newFile;
            } else {
              updated.push(newFile);
            }
          });
          return updated;
        });
        
        // Select the first new file
        if (!selectedFile && newFiles.length > 0) {
          setSelectedFile(newFiles[0].name);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Download project as ZIP
  const downloadProject = () => {
    if (generatedFiles.length === 0) return;

    // Create a simple ZIP-like structure (for demo purposes)
    const projectData = {
      files: generatedFiles,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-generated-project.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Save current file to local storage
  const saveToLocal = async () => {
    if (!selectedFileContent || !localProject) return;
    
    const success = await saveFile(selectedFileContent.name, selectedFileContent.content);
    if (success) {
      // Could show a success toast here
      console.log('File saved to local storage');
    }
  };

  // Handle local project load
  const handleLocalProjectLoad = (project: LocalProject) => {
    // Convert local project files to generated files format
    const convertedFiles = project.files.map(file => ({
      name: file.name,
      content: file.content,
      type: getFileType(file.name)
    }));
    
    setGeneratedFiles(convertedFiles);
    if (convertedFiles.length > 0) {
      setSelectedFile(convertedFiles[0].name);
    }
  };

  // Handle local project creation
  const handleLocalProjectCreate = (project: LocalProject) => {
    handleLocalProjectLoad(project);
  };

  // Helper function to determine file type from extension
  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'js';
      case 'ts': return 'ts';
      case 'tsx': return 'tsx';
      case 'json': return 'json';
      case 'md': return 'md';
      case 'py': return 'py';
      default: return 'text';
    }
  };

  // Preview HTML files
  const previewFile = (file: GeneratedFile) => {
    if (file.type === 'html') {
      const blob = new Blob([file.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  // Open localhost for testing
  const openLocalhost = (port: number = 3000) => {
    window.open(`http://localhost:${port}`, '_blank');
  };

  // Test current app
  const testCurrentApp = () => {
    if (selectedFileContent && selectedFileContent.type === 'html') {
      previewFile(selectedFileContent);
    } else {
      // If no HTML file is selected, try to find one
      const htmlFile = generatedFiles.find(f => f.type === 'html');
      if (htmlFile) {
        previewFile(htmlFile);
      } else {
        // Create a simple test HTML file
        const testHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Test App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .test-info { background: #f0f0f0; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Test App</h1>
        <div class="test-info">
            <h2>Generated Files:</h2>
            <ul>
                ${generatedFiles.map(f => `<li><strong>${f.name}</strong> (${f.type})</li>`).join('')}
            </ul>
            <p>This is a test page. Your actual app files are ready for development!</p>
        </div>
    </div>
</body>
</html>`;
        
        const testFile = { name: 'test.html', content: testHtml, type: 'html' };
        previewFile(testFile);
      }
    }
  };

  const selectedFileContent = generatedFiles.find(f => f.name === selectedFile);

  const handleApplySuggestion = (suggestion: CodeSuggestion) => {
    // Apply the suggestion to the selected file
    if (selectedFileContent && suggestion.replacement) {
      const updatedFiles = generatedFiles.map(file => {
        if (file.name === selectedFileContent.name) {
          const lines = file.content.split('\n');
          lines[suggestion.line] = suggestion.replacement || '';
          return { ...file, content: lines.join('\n') };
        }
        return file;
      });
      setGeneratedFiles(updatedFiles);
    }
  };

  // Handle Summon Code Bar command execution
  const handleSummonCommand = async (command: string) => {
    const processedCommand = executeCommand(command);
    const prompt = CommandParser.generatePrompt(processedCommand, personality);
    
    // Switch to chat tab and send the command
    setActiveTab('chat');
    await handleSendMessage(prompt);
  };

  // Handle Code Mode change
  const handleCodeModeChange = (newMode: CodeMode) => {
    if (selectedFileContent) {
      const transformedCode = transformCode(selectedFileContent.content, newMode, personality);
      
      // Update the selected file with transformed code
      const updatedFiles = generatedFiles.map(file => 
        file.name === selectedFileContent.name 
          ? { ...file, content: transformedCode }
          : file
      );
      setGeneratedFiles(updatedFiles);
    }
    setMode(newMode);
  };

  // Handle file operations for development tools
  const handleFileSelect = (fileId: string, line?: number, column?: number) => {
    const file = generatedFiles.find(f => f.name === fileId);
    if (file) {
      setSelectedFile(fileId);
      // TODO: Navigate to specific line/column in editor
    }
  };

  const handleFileReplace = (fileId: string, line: number, column: number, oldText: string, newText: string) => {
    const updatedFiles = generatedFiles.map(file => {
      if (file.name === fileId) {
        const lines = file.content.split('\n');
        const targetLine = lines[line - 1];
        if (targetLine) {
          const newLine = targetLine.substring(0, column - 1) + newText + targetLine.substring(column - 1 + oldText.length);
          lines[line - 1] = newLine;
          return { ...file, content: lines.join('\n') };
        }
      }
      return file;
    });
    setGeneratedFiles(updatedFiles);
  };

  const handleFileFix = (fileId: string, line: number, column: number, oldText: string, newText: string) => {
    handleFileReplace(fileId, line, column, oldText, newText);
  };

  return (
    <PersonalityThemeProvider personality={personality}>
      <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <img 
              src="/hexkexlogo.png" 
              alt="Hex & Kex Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>
          
          <div className="flex items-center gap-4">
            {/* Summon Code Bar Button */}
            <Button
              onClick={openSummonBar}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden md:inline">Summon Code</span>
              <kbd className="hidden lg:inline-flex px-1 py-0.5 bg-gray-700 rounded text-xs">⌘K</kbd>
            </Button>

            {/* Development Tools Button */}
            <Button
              onClick={() => setShowDevelopmentTools(!showDevelopmentTools)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-orange-600/20 border-orange-500/50 hover:bg-orange-600/30"
            >
              <Code className="w-4 h-4" />
              <span className="hidden md:inline">Dev Tools</span>
            </Button>

            {/* Settings Button */}
            <Button
              onClick={() => setShowSettings(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Settings</span>
            </Button>

            {/* Debug Button */}
            <Button
              onClick={() => setShowDebugPanel(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden md:inline">Debug AI</span>
            </Button>

            {/* GitHub Authentication */}
            <GitHubAuth />
            
            {/* Personality Toggle */}
            <PersonalityToggle
              personality={personality}
              onPersonalityChange={(newPersonality) => {
                setPersonality(newPersonality);
                personalitySystem.setPersonality(newPersonality);
              }}
            />
            
            {isConfigured && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                AI Ready
              </Badge>
            )}
            {generatedFiles.length > 0 && (
              <>
                <Button
                  onClick={downloadProject}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Project
                </Button>
                
                <Button
                  onClick={testCurrentApp}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-green-600/20 border-green-500/50 hover:bg-green-600/30"
                >
                  <Play className="w-4 h-4" />
                  Test App
                </Button>

                <Button
                  onClick={() => openLocalhost(3000)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-blue-600/20 border-blue-500/50 hover:bg-blue-600/30"
                >
                  <Code className="w-4 h-4" />
                  Open Localhost
                </Button>

                <Button
                  onClick={() => openLocalhost(3005)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30"
                >
                  <Code className="w-4 h-4" />
                  Open Dev Server
                </Button>
                
                {isLocalStorageSupported && selectedFileContent && localProject && (
                  <Button
                    onClick={saveToLocal}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <HardDrive className="w-4 h-4" />
                    Save to Local
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Side - AI Chat Sidebar */}
        <div className="w-96 border-r border-gray-800 bg-gray-950 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <h3 className="font-medium text-sm text-gray-300">AI Chat</h3>
              {isConfigured && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  Ready
                </Badge>
              )}
            </div>
          </div>
          
          {/* AI Chat - Full Height with Input at Bottom */}
          <div className="flex-1 flex flex-col">
            <AIChat
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isConfigured={isConfigured}
              onClearMessages={clearMessages}
              settings={settings}
              onSettingsChange={saveSettings}
              personality={personality}
              onCodeBlocks={setAICodeBlocks}
              streamedMessage={streamedMessage}
              isStreaming={isStreaming}
            />
          </div>
        </div>

        {/* Right Side - Code Space */}
        <div className="flex-1 flex flex-col">
          {/* Code Header */}
          <div className="p-4 border-b border-gray-800 bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-400" />
                <h3 className="font-medium text-sm text-gray-300">AI Code Space</h3>
                <Badge variant="outline" className="text-xs">
                  {aiCodeBlocks.length} blocks
                </Badge>
              </div>
              
              {/* Development Tools Panel */}
              {showDevelopmentTools && (
                <div className="absolute top-full left-0 right-0 z-50 bg-gray-900 border-b border-gray-800">
                  <DevelopmentToolsPanel
                    files={Object.fromEntries(
                      generatedFiles.map(file => [
                        file.name,
                        { name: file.name, content: file.content, language: file.type }
                      ])
                    )}
                    onFileSelect={handleFileSelect}
                    onReplace={handleFileReplace}
                    onFixApply={handleFileFix}
                    onSendToChat={(message) => {
                      handleSendMessage(message);
                    }}
                  />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {generatedFiles.length > 0 && (
                  <>
                    <Button
                      onClick={downloadProject}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    
                    {isLocalStorageSupported && selectedFileContent && localProject && (
                      <Button
                        onClick={saveToLocal}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <HardDrive className="w-4 h-4" />
                        Save Local
                      </Button>
                    )}
                  </>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDNAThreads(!showDNAThreads)}
                  className="text-xs"
                >
                  🧬 {showDNAThreads ? 'Hide' : 'Show'} DNA
                </Button>
              </div>
            </div>
          </div>

          {/* AI Code Blocks Bar */}
          {aiCodeBlocks.length > 0 && (
            <div className="p-2 border-b border-gray-800 bg-gray-900/50">
              <div className="flex gap-1 overflow-x-auto">
                {aiCodeBlocks.map((block, index) => (
                  <button
                    key={index}
                    className={`flex items-center gap-2 px-3 py-1 rounded text-sm whitespace-nowrap bg-blue-800 text-white`}
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-400 opacity-60" />
                    {block.lang || 'code'} #{index + 1}
                    <Badge variant="outline" className="text-xs px-1 py-0 ml-1 border-blue-400 text-blue-400">
                      {block.lang || 'text'}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Code Content Area - Scrollable */}
          <div className="flex-1 overflow-auto">
            {/* Hex Layout Switcher - Split Screen Feature */}
            <div className="p-4">
              <HexLayoutSwitcher
                onLayoutChange={(layout) => {
                  console.log('Layout changed to:', layout);
                }}
                selectedFile={selectedFileContent}
                generatedFiles={generatedFiles}
                onFileSelect={(fileName) => setSelectedFile(fileName)}
                dnaProps={{
                  generations,
                  branches,
                  currentGenerationId: currentGenerationId || undefined,
                  onRewind: (generationId: string) => {
                    rewindTo(generationId);
                    const generation = generations.find(g => g.id === generationId);
                    if (generation && selectedFileContent) {
                      const updatedFiles = generatedFiles.map(file => 
                        file.name === selectedFileContent.name 
                          ? { ...file, content: generation.code }
                          : file
                      );
                      setGeneratedFiles(updatedFiles);
                    }
                  },
                  onFork: (generationId: string) => {
                    const branchId = forkFrom(generationId);
                  },
                  onDelete: deleteGeneration,
                  onPreview: (generationId: string) => {
                    const generation = generations.find(g => g.id === generationId);
                    if (generation) {
                      startGeneration(generation.code);
                    }
                  },
                  personality
                }}
                terminalProps={{
                  session: terminalSession,
                  onExecuteCommand: executeCommand,
                  onClose: () => console.log('Terminal closed'),
                  onMinimize: () => console.log('Terminal minimized')
                }}
              >
                {/* AI Code Space - Replace the old Code Space */}
                <div className="h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Code className="w-5 h-5 text-blue-400" />
                      <h3 className="font-medium text-sm text-gray-300">AI Code Space</h3>
                      <Badge variant="outline" className="text-xs">
                        {aiCodeBlocks.length} blocks
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="bg-black/40 p-4 rounded border border-blue-500/20 min-h-[500px] h-full overflow-auto">
                    <AICodeSpace codeBlocks={aiCodeBlocks} personality={personality} />
                  </div>
                </div>
              </HexLayoutSwitcher>

              {/* DNA Threads Panel - Positioned separately */}
              {showDNAThreads && (
                <div className="mt-4">
                  <DNAThreads
                    generations={generations}
                    branches={branches}
                    currentGenerationId={currentGenerationId || undefined}
                    onRewind={(generationId) => {
                      rewindTo(generationId);
                      // Find the generation and restore its code
                      const generation = generations.find(g => g.id === generationId);
                      if (generation && selectedFileContent) {
                        const updatedFiles = generatedFiles.map(file => 
                          file.name === selectedFileContent.name 
                            ? { ...file, content: generation.code }
                            : file
                        );
                        setGeneratedFiles(updatedFiles);
                      }
                    }}
                    onFork={(generationId) => {
                      const branchId = forkFrom(generationId);
                      // Could add UI feedback here
                    }}
                    onDelete={deleteGeneration}
                    onPreview={(generationId) => {
                      const generation = generations.find(g => g.id === generationId);
                      if (generation) {
                        startGeneration(generation.code);
                      }
                    }}
                    personality={personality}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Context Suggestions */}
      {selectedFileContent && activeTab === 'code' && (
        <ContextSuggestions
          code={selectedFileContent.content}
          fileName={selectedFileContent.name}
          cursorPosition={{ line: cursorPosition.lineNumber, column: cursorPosition.column }}
          onApplySuggestion={handleApplySuggestion}
          personality={personality}
        />
      )}

      {/* Summon Code Bar */}
      <SummonCodeBar
        isOpen={isSummonBarOpen}
        onClose={closeSummonBar}
        onExecuteCommand={handleSummonCommand}
        personality={personality}
        recentCommands={recentCommands}
      />

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Settings className="w-5 h-5" />
              AI Settings & Configuration
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <Tabs defaultValue="ai-settings" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="ai-settings" className="data-[state=active]:bg-blue-600">
                  AI Configuration
                </TabsTrigger>
                <TabsTrigger value="local-storage" className="data-[state=active]:bg-blue-600">
                  Local Storage
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="ai-settings" className="mt-4">
                <AISettingsPanel
                  settings={settings}
                  onSettingsChange={saveSettings}
                  onTestConnection={testConnection}
                  isConfigured={isConfigured}
                />
              </TabsContent>
              
              <TabsContent value="local-storage" className="mt-4">
                <LocalStorageManager
                  onProjectLoad={handleLocalProjectLoad}
                  onProjectCreate={handleLocalProjectCreate}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Debug Panel Dialog */}
      <Dialog open={showDebugPanel} onOpenChange={setShowDebugPanel}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Connection Debug</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <AIDebugPanel 
              settings={settings} 
              isConfigured={isConfigured} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </PersonalityThemeProvider>
  );
}
