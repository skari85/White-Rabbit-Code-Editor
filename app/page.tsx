'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, MessageSquare, Code, Download, Play, HardDrive } from 'lucide-react';
import { AIChat } from '@/components/ai-chat';
import { AISettingsPanel } from '@/components/ai-settings-panel';
import { LocalStorageManager } from '@/components/local-storage-manager';
import { useAIAssistantEnhanced } from '@/hooks/use-ai-assistant-enhanced';
import { useLocalStorage, LocalProject } from '@/hooks/use-local-storage';
import { PersonalityToggle, PersonalityThemeProvider } from '@/components/personality-toggle';
import { ContextSuggestions } from '@/components/context-suggestions';
import { GlitchPreview, useGlitchPreview } from '@/components/glitch-preview';
import { DNAThreads, useDNAThreads, CodeGeneration } from '@/components/dna-threads';
import { personalitySystem, PersonalityMode, CodeSuggestion } from '@/lib/personality-system';
import { GitHubAuth } from '@/components/github-auth';
import { CodeModeDial, useCodeMode, CodeMode } from '@/components/code-mode-dial';
import { SummonCodeBar, useSummonCodeBar, CommandParser } from '@/components/summon-code-bar';
import HexLayoutSwitcher from '@/components/hex-layout-switcher';

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
  const [cursorPosition, setCursorPosition] = useState({ line: 0, column: 0 });
  const [showDNAThreads, setShowDNAThreads] = useState(true);
  
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
    clearMessages,
    testConnection
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
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
      const response = await sendMessage(message);
      
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
        {/* Sidebar - Generated Files */}
        <div className="w-64 border-r border-gray-800 bg-gray-950">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-medium text-sm text-gray-300">Generated Files</h3>
            <p className="text-xs text-gray-500 mt-1">{generatedFiles.length} files</p>
          </div>
          
          <div className="p-2">
            {generatedFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No files generated yet</p>
                <p className="text-xs mt-1">Chat with AI to create files</p>
              </div>
            ) : (
              <div className="space-y-1">
                {generatedFiles.map((file) => (
                  <div
                    key={file.name}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-800 ${
                      selectedFile === file.name ? 'bg-gray-800 border border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedFile(file.name)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {file.type}
                      </Badge>
                      {file.type === 'html' && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            previewFile(file);
                          }}
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start bg-gray-900 border-b border-gray-800 rounded-none p-0">
              <TabsTrigger 
                value="chat" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <MessageSquare className="w-4 h-4" />
                AI Chat
              </TabsTrigger>
              <TabsTrigger 
                value="code" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Code className="w-4 h-4" />
                Code View
              </TabsTrigger>
              <TabsTrigger 
                value="local" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <HardDrive className="w-4 h-4" />
                Local Storage
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Settings className="w-4 h-4" />
                AI Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 m-0">
              <AIChat
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                isConfigured={isConfigured}
                onClearMessages={clearMessages}
                settings={settings}
                onSettingsChange={saveSettings}
              />
            </TabsContent>

            <TabsContent value="code" className="flex-1 m-0 p-4">
              {/* Hex Layout Switcher - Split Screen Feature */}
              <HexLayoutSwitcher
                onLayoutChange={(layout) => {
                  console.log('Layout changed to:', layout);
                }}
              >
                {selectedFileContent ? (
                  <div className="h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-mono text-sm">{selectedFileContent.name}</span>
                        <Badge variant="outline" className="text-xs">{selectedFileContent.type}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
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
                    
                    {/* Code Mode Dial */}
                    <div className="mb-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <CodeModeDial
                        currentMode={currentMode}
                        onModeChange={handleCodeModeChange}
                        personality={personality}
                      />
                    </div>

                    <div className="bg-black/40 p-4 rounded border border-green-500/20 h-[300px] overflow-auto">
                      {isGenerating && pendingCode ? (
                        <GlitchPreview
                          code={pendingCode}
                          isGenerating={isGenerating}
                          onSolidify={() => {
                            solidify();
                            // Update the file content with solidified code
                            if (selectedFileContent) {
                              const updatedFiles = generatedFiles.map(file => 
                                file.name === selectedFileContent.name 
                                  ? { ...file, content: solidifiedCode || pendingCode }
                                  : file
                              );
                              setGeneratedFiles(updatedFiles);
                            }
                          }}
                          personality={personality}
                        />
                      ) : (
                        <pre className="text-green-300 font-mono text-sm">
                          <code>{selectedFileContent.content}</code>
                        </pre>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-green-400/60">
                    <div className="text-center">
                      <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-mono text-sm">No file selected</p>
                      <p className="font-mono text-xs mt-1 opacity-60">Choose a file to begin hex magic</p>
                    </div>
                  </div>
                )}
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
            </TabsContent>

            <TabsContent value="local" className="flex-1 m-0 p-4">
              <div className="max-w-4xl mx-auto">
                <LocalStorageManager
                  onProjectLoad={handleLocalProjectLoad}
                  onProjectCreate={handleLocalProjectCreate}
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 m-0 p-4">
              <div className="max-w-2xl mx-auto">
                <AISettingsPanel
                  settings={settings}
                  onSettingsChange={saveSettings}
                  onTestConnection={testConnection}
                  isConfigured={isConfigured}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Context Suggestions */}
      {selectedFileContent && activeTab === 'code' && (
        <ContextSuggestions
          code={selectedFileContent.content}
          fileName={selectedFileContent.name}
          cursorPosition={cursorPosition}
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
    </div>
    </PersonalityThemeProvider>
  );
}
