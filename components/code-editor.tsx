"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useCodeBuilder, useCodeExport } from "@/hooks/use-code-builder"
import { useAIAssistantEnhanced } from "@/hooks/use-ai-assistant-enhanced"
import { TerminalComponent } from "@/components/terminal"
import { AIChat } from "@/components/ai-chat"
import { AISettingsPanel } from "@/components/ai-settings-panel"
import { useTerminal } from "@/hooks/use-terminal"
import {
  Download,
  ExternalLink,
  Plus,
  FileText,
  Bot,
  Settings,
  Terminal,
  X,
  Play,
  Server
} from "lucide-react"

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
    currentProject
  } = useCodeBuilder();
  
  const { exportAsZip, previewInNewTab } = useCodeExport();
  const { 
    settings: aiSettings, 
    messages: aiMessages, 
    isLoading: aiLoading, 
    isConfigured: aiConfigured,
    saveSettings: saveAISettings,
    sendMessage: sendAIMessage,
    clearMessages: clearAIMessages,
    testConnection: testAIConnection
  } = useAIAssistantEnhanced();

  const terminal = useTerminal();

  const [viewMode, setViewMode] = useState<"code" | "ai" | "terminal">("code")
  const [aiPanelMode, setAIPanelMode] = useState<"chat" | "settings">("chat")

  // Enhanced AI integration
  const handleSendMessage = useCallback(async (message: string) => {
    try {
      const context = {
        files: files,
        selectedFile: selectedFile,
        appSettings: { name: currentProject?.name || "My Project" }
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
  }, [sendAIMessage, files, selectedFile, parseAndApplyAIResponse, currentProject]);

  const addFile = () => {
    const fileName = prompt("Enter file name (with extension):")
    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase()
      let fileType: 'html' | 'css' | 'js' | 'json' | 'md' | 'tsx' | 'ts' | 'py' | 'txt' = 'txt'
      
      if (extension === 'html') fileType = 'html'
      else if (extension === 'css') fileType = 'css'
      else if (extension === 'js') fileType = 'js'
      else if (extension === 'json') fileType = 'json'
      else if (extension === 'md') fileType = 'md'
      else if (extension === 'tsx') fileType = 'tsx'
      else if (extension === 'ts') fileType = 'ts'
      else if (extension === 'py') fileType = 'py'
      
      addNewFile(fileName, fileType)
    }
  }

  const handleExport = () => {
    exportAsZip(files, currentProject?.name || "project")
  }

  const handlePreview = () => {
    previewInNewTab(files)
  }

  const startDevServer = async () => {
    if (!terminal.getActiveSession()) {
      terminal.createSession("Dev Server");
    }
    await terminal.executeCommand("npm run dev");
  }

  const handleTerminalCommand = async (command: string) => {
    await terminal.executeCommand(command);
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'html': return '🌐'
      case 'css': return '🎨'
      case 'js': return '⚡'
      case 'tsx': 
      case 'ts': return '🔷'
      case 'py': return '🐍'
      case 'json': return '📋'
      case 'md': return '📝'
      default: return '📄'
    }
  }

  const getLanguageFromFileName = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'html': return 'html'
      case 'css': return 'css'
      case 'js': return 'javascript'
      case 'tsx': return 'typescript'
      case 'ts': return 'typescript'
      case 'py': return 'python'
      case 'json': return 'json'
      case 'md': return 'markdown'
      default: return 'text'
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - File Explorer */}
      <div className="w-64 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">H&K</span>
            </div>
            <div>
              <h2 className="font-semibold text-sm">Hex & Kex</h2>
              <p className="text-xs text-gray-500">Code Editor</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 space-y-2">
          <Button
            onClick={addFile}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New File
          </Button>
          
          <Button
            onClick={handleExport}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Project
          </Button>

          <Button
            onClick={startDevServer}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Server className="w-4 h-4 mr-2" />
            Start Server
          </Button>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Files ({files.length})
            </h3>
            <div className="space-y-1">
              {files.map((file) => (
                <div
                  key={file.name}
                  onClick={() => setSelectedFile(file.name)}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer group ${
                    selectedFile === file.name
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm">{getFileIcon(file.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(file.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteFile(file.name)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
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
                  variant={viewMode === "ai" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("ai")}
                >
                  <Bot className="w-4 h-4 mr-2" />
                  AI Assistant
                </Button>
                <Button
                  variant={viewMode === "terminal" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("terminal")}
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  Terminal
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handlePreview}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "code" && (
            <div className="h-full flex">
              {/* Editor */}
              <div className="flex-1 flex flex-col">
                {/* File Tab */}
                {selectedFile && (
                  <div className="bg-gray-100 px-4 py-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getFileIcon(selectedFile)}</span>
                      <span className="text-sm font-medium">{selectedFile}</span>
                      <Badge variant="secondary" className="text-xs">
                        {getLanguageFromFileName(selectedFile)}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {/* Code Editor */}
                <div className="flex-1 p-0">
                  <Textarea
                    value={getSelectedFileContent()}
                    onChange={(e) => updateFileContent(selectedFile, e.target.value)}
                    className="w-full h-full resize-none border-0 rounded-none font-mono text-sm leading-relaxed"
                    placeholder={selectedFile ? `Edit ${selectedFile}...` : "Select a file to edit"}
                    style={{ minHeight: '100%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {viewMode === "ai" && (
            <div className="h-full flex">
              {/* AI Panel Navigation */}
              <div className="w-64 bg-white border-r">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">AI Assistant</h3>
                </div>
                <div className="flex flex-col">
                  <button
                    onClick={() => setAIPanelMode("chat")}
                    className={`p-3 text-left ${
                      aiPanelMode === "chat" ? "bg-blue-50 text-blue-600" : ""
                    }`}
                  >
                    <Bot className="w-4 h-4 inline mr-2" />
                    Chat
                  </button>
                  <button
                    onClick={() => setAIPanelMode("settings")}
                    className={`p-3 text-left ${
                      aiPanelMode === "settings" ? "bg-blue-50 text-blue-600" : ""
                    }`}
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Settings
                  </button>
                </div>
              </div>
              
              {/* AI Content */}
              <div className="flex-1">
                {aiPanelMode === "chat" ? (
                  <AIChat
                    messages={aiMessages}
                    onSendMessage={handleSendMessage}
                    isLoading={aiLoading}
                    isConfigured={aiConfigured}
                    onClearMessages={clearAIMessages}
                    settings={aiSettings}
                    onSettingsChange={saveAISettings}
                  />
                ) : (
                  <AISettingsPanel
                    settings={aiSettings}
                    onSettingsChange={saveAISettings}
                    onTestConnection={testAIConnection}
                    isConfigured={aiConfigured}
                  />
                )}
              </div>
            </div>
          )}

          {viewMode === "terminal" && (
            <div className="h-full">
              <TerminalComponent
                session={terminal.getActiveSession() || {
                  id: 'default',
                  name: 'Terminal',
                  commands: [],
                  isActive: true,
                  workingDirectory: '/Users/georgalbert/pwa-code',
                  environment: {}
                }}
                onExecuteCommand={handleTerminalCommand}
                onClose={() => {}}
                onMinimize={() => {}}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
