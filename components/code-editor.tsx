// Import necessary libraries
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useCodeBuilder, useCodeExport } from "@/hooks/use-code-builder"
import { useAIAssistantEnhanced } from "@/hooks/use-ai-assistant-enhanced"
import { TerminalComponent } from "@/components/terminal"
import { AIChat } from "@/components/ai-chat"
import { AICodeSpace } from "./ai-code-space"

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
  Server,
  RefreshCw
} from "lucide-react"
// import EnhancedMonacoEditor from './enhanced-monaco-editor'; // Temporarily disabled
import SimpleCodeEditor from './simple-code-editor';
import LivePreview from './live-preview';

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

  const [viewMode, setViewMode] = useState<"code" | "terminal" | "preview">("code")
  // Store code blocks extracted from AIChat
  const [aiCodeBlocks, setAICodeBlocks] = useState<{ code: string; lang?: string; messageId?: string }[]>([
    // Test data to debug rendering issues
    { code: 'console.log("Hello World!");', lang: 'javascript', messageId: 'test-1' },
    { code: 'function test() {\n  return "test";\n}', lang: 'javascript', messageId: 'test-2' },
    { code: '<div class="container">\n  <p>Hello HTML</p>\n</div>', lang: 'html', messageId: 'test-3' }
  ]);
  const [selectedAICodeIdx, setSelectedAICodeIdx] = useState<number>(0);

  const [codeColor, setCodeColor] = useState(false);

  const handleCodeColorToggle = () => {
    setCodeColor(!codeColor);
  }

  // Define the getLanguageFromFileName function
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

  // ... rest of the code ...

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - File Explorer & AI Chat */}
      <div className="w-80 bg-white border-r flex flex-col h-screen overflow-hidden">
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
            onClick={() => addNewFile('newfile.txt', 'txt')}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New File
          </Button>

          <Button
            onClick={handleCodeColorToggle}
            className="w-full"
            variant="outline"
            size="sm"
          >
            {codeColor ? 'Light Theme' : 'Dark Theme'}
          </Button>



          <Button
            onClick={() => {
              // Create a comprehensive demo with HTML, CSS, and JS

              // Create HTML file
              addNewFile('index.html', 'html');
              const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hex & Kex Demo</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🚀 Hex & Kex Live Preview Demo</h1>
            <p>This demo shows the live preview feature in action!</p>
        </header>

        <main class="content">
            <div class="card">
                <h2>Interactive Demo</h2>
                <p>Current time: <span id="time">${new Date().toLocaleString()}</span></p>
                <button id="updateBtn" class="btn">Update Time</button>
                <div id="counter">Clicks: <span id="count">0</span></div>
            </div>

            <div class="card">
                <h2>Features</h2>
                <ul>
                    <li>✅ Live HTML/CSS/JS bundling</li>
                    <li>✅ Sandboxed iframe preview</li>
                    <li>✅ Real-time updates</li>
                    <li>✅ Fullscreen mode</li>
                    <li>✅ External link support</li>
                </ul>
            </div>
        </main>
    </div>
    <script src="script.js"></script>
</body>
</html>`;

              // Create CSS file
              addNewFile('style.css', 'css');
              const cssContent = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
}

.container {
    max-width: 800px;
    margin: 0 auto;
}

.header {
    text-align: center;
    color: white;
    margin-bottom: 30px;
}

.header h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.card {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.card:hover {
    transform: translateY(-5px);
}

.card h2 {
    color: #4a5568;
    margin-bottom: 15px;
    font-size: 1.5rem;
}

.btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s ease;
    margin: 10px 0;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

#counter {
    margin-top: 15px;
    font-size: 18px;
    font-weight: bold;
    color: #2d3748;
}

ul {
    list-style: none;
    padding-left: 0;
}

li {
    padding: 8px 0;
    font-size: 16px;
}

#time {
    font-weight: bold;
    color: #667eea;
}`;

              // Create JS file
              addNewFile('script.js', 'js');
              const jsContent = `// Interactive demo script
let clickCount = 0;

document.addEventListener('DOMContentLoaded', function() {
    const updateBtn = document.getElementById('updateBtn');
    const timeSpan = document.getElementById('time');
    const countSpan = document.getElementById('count');

    // Update time function
    function updateTime() {
        timeSpan.textContent = new Date().toLocaleString();
        clickCount++;
        countSpan.textContent = clickCount;

        // Add some visual feedback
        updateBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            updateBtn.style.transform = 'scale(1)';
        }, 150);
    }

    // Attach event listener
    updateBtn.addEventListener('click', updateTime);

    // Auto-update time every 30 seconds
    setInterval(() => {
        timeSpan.textContent = new Date().toLocaleString();
    }, 30000);

    console.log('Hex & Kex Demo loaded successfully!');
});`;

              // Update file contents
              updateFileContent('index.html', htmlContent);
              updateFileContent('style.css', cssContent);
              updateFileContent('script.js', jsContent);

              // Switch to preview mode
              setSelectedFile('index.html');
              setViewMode('preview');
            }}
            className="w-full"
            variant="outline"
            size="sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Create Live Demo
          </Button>

          <Button
            onClick={() => {
              // Clear localStorage and reinitialize
              localStorage.removeItem('hex-kex-project');
              localStorage.removeItem('hex-kex-projects-list');
              window.location.reload();
            }}
            className="w-full"
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Project
          </Button>

          <Button
            onClick={() => exportAsZip(files, currentProject?.name || "My Project")}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Project
          </Button>

          <Button
            onClick={async () => {
              try {
                const sessionId = terminal.createSession("Dev Server");
                if (sessionId) {
                  await terminal.executeCommand("npm run dev");
                }
              } catch (error) {
                console.error('Failed to start dev server:', error);
              }
            }}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Server className="w-4 h-4 mr-2" />
            Start Server
          </Button>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto min-h-0">
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
                  <span className="text-sm">{getFileTypeIcon(file.name)}</span>
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

        {/* AI Chat Section */}
        <div className="border-t bg-gray-50 flex flex-col h-96 min-h-0">
          <div className="p-3 border-b bg-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              {aiConfigured && (
                <div className="w-2 h-2 bg-green-500 rounded-full" title="AI Connected" />
              )}
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="h-full">
              <AIChat
                messages={aiMessages}
                onSendMessage={handleSendMessage}
                isLoading={aiLoading}
                onClearMessages={clearAIMessages}
                isConfigured={aiConfigured}
                settings={aiSettings}
                onSettingsChange={saveAISettings}
              />
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
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => previewInNewTab(files)}
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
                      <span className="text-sm">{getFileTypeIcon(selectedFile)}</span>
                      <span className="text-sm font-medium">{selectedFile}</span>
                      <Badge variant="secondary" className="text-xs">
                        {getLanguageFromFileName(selectedFile)}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {/* Code Editor */}
                <div className="flex-1 p-0">
                  <SimpleCodeEditor
                    value={getSelectedFileContent()}
                    onChange={(content) => updateFileContent(selectedFile, content)}
                    language={getLanguageFromFileName(selectedFile)}
                    theme={codeColor ? "hex-light" : "kex-dark"}
                    height="100%"
                  />
                </div>
              </div>
            </div>
          )}



          {viewMode === "terminal" && (
            <div className="h-full">
              <TerminalComponent
                session={terminal.getActiveSession() || (() => {
                  // Create a default session if none exists
                  const sessionId = terminal.createSession('Default Terminal');
                  return terminal.getActiveSession() || {
                    id: 'default',
                    name: 'Terminal',
                    commands: [],
                    isActive: true,
                    workingDirectory: '/Users/georgalbert/pwa-code-3',
                    environment: {}
                  };
                })()}
                onExecuteCommand={async (command) => {
                  try {
                    // Ensure we have an active session
                    if (!terminal.getActiveSession()) {
                      terminal.createSession('Default Terminal');
                    }
                    await terminal.executeCommand(command);
                  } catch (error) {
                    console.error('Terminal command failed:', error);
                  }
                }}
                onClose={() => {}}
                onMinimize={() => {}}
              />
            </div>
          )}

          {viewMode === "preview" && (
            <div className="h-full p-4">
              <LivePreview
                files={files}
                selectedFile={selectedFile}
                className="h-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const getFileTypeIcon = (fileName: string) => {
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
