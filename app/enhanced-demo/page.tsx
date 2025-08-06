'use client';

import React, { useState, useRef } from 'react';

// Disable static generation for this demo page
export const dynamic = 'force-dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import EnhancedFileSystemManager from '@/components/enhanced-file-system';
import EnhancedMonacoEditor, { MonacoEditorRef } from '@/components/enhanced-monaco-editor';
import { PersonalityToggle } from '@/components/personality-toggle';
import { AIChat } from '@/components/ai-chat';
import { useAIAssistantEnhanced } from '@/hooks/use-ai-assistant-enhanced';
import { PersonalityMode } from '@/lib/personality-system';
import { 
  Code, 
  FileText, 
  Terminal, 
  Bot, 
  Zap, 
  Database,
  Cloud,
  Settings,
  Play,
  Download,
  Upload,
  Search,
  BookOpen,
  Lightbulb,
  Rocket,
  Star
} from 'lucide-react';

export default function EnhancedIDEDemo() {
  const [personality, setPersonality] = useState<PersonalityMode>('rabbit');
  const [activeTab, setActiveTab] = useState('file-system');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  
  const editorRef = useRef<MonacoEditorRef>(null);
  
  const {
    settings: aiSettings,
    messages: aiMessages,
    isLoading: aiLoading,
    isConfigured: aiConfigured,
    saveSettings: saveAISettings,
    sendMessage: sendAIMessage,
    clearMessages: clearAIMessages
  } = useAIAssistantEnhanced();

  const handleFileSelect = (fileId: string) => {
    setSelectedFile(fileId);
    // In a real implementation, you'd load the file content here
    setFileContent(`// File: ${fileId}\n// Enhanced IDE with advanced features\n\nfunction example() {\n  console.log("Hello World!");\n  return "Enhanced IDE Demo";\n}`);
  };

  const handleFileChange = (fileId: string, content: string) => {
    setFileContent(content);
    // In a real implementation, you'd save the content here
  };

  const demoFeatures = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Enhanced File System",
      description: "Project templates, version control, file search, bookmarks, and folder upload support",
      items: [
        "React & Node.js project templates",
        "File version history & git status",
        "Advanced search with tags",
        "Bookmark important files",
        "Drag & drop folder upload",
        "Project export to ZIP"
      ]
    },
    {
      icon: <Code className="w-5 h-5" />,
      title: "IDE-like Code Editor",
      description: "Monaco editor with IntelliSense, diagnostics, themes, and advanced features",
      items: [
        "Syntax highlighting for 20+ languages",
        "IntelliSense & auto-completion",
        "Real-time error detection",
        "Find & replace with regex support",
        "Custom KEX/HEX themes",
        "Code formatting & snippets"
      ]
    },
    {
      icon: <Bot className="w-5 h-5" />,
      title: "AI-Powered Features",
      description: "OCR, multiple AI providers, and intelligent code assistance",
      items: [
        "Image to text OCR extraction",
        "Multiple AI providers (OpenAI, Anthropic)",
        "Code review & suggestions",
        "Automatic bug detection",
        "Smart completions",
        "Context-aware assistance"
      ]
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Performance & UX",
      description: "Fast, responsive interface with modern web technologies",
      items: [
        "Next.js 15 with React 18",
        "TypeScript for type safety",
        "Tailwind CSS styling",
        "PWA capabilities",
        "Dark/light theme support",
        "Keyboard shortcuts"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src="/hexkexlogo.png" 
                  alt="Hex & Kex" 
                  className="w-8 h-8 object-contain"
                />
                <h1 className="text-xl font-bold">Enhanced IDE Demo</h1>
              </div>
              <Badge variant="outline" className="text-xs">
                v2.0 Enhanced
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <PersonalityToggle 
                personality={personality} 
                onPersonalityChange={setPersonality}
              />
              <Button variant="outline" size="sm">
                <Star className="w-4 h-4 mr-1" />
                Star on GitHub
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Feature Overview */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Professional IDE Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience a complete development environment with advanced file management, 
              intelligent code editing, AI assistance, and modern tooling.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {demoFeatures.map((feature, index) => (
              <Card key={index} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    {feature.icon}
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-sm flex items-start gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Interactive Demo */}
        <Card className="h-[600px]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              Interactive Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full pb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="file-system" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Enhanced File System
                </TabsTrigger>
                <TabsTrigger value="code-editor" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  IDE Code Editor
                </TabsTrigger>
                <TabsTrigger value="ai-chat" className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  AI Assistant
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file-system" className="h-full mt-4">
                <div className="h-full border rounded-lg overflow-hidden">
                  <EnhancedFileSystemManager
                    personality={personality}
                    onFileSelect={handleFileSelect}
                    onFileChange={handleFileChange}
                    enableVersionControl={true}
                    enableProjectTemplates={true}
                    enableFileSync={false}
                    className="h-full"
                  />
                </div>
              </TabsContent>

              <TabsContent value="code-editor" className="h-full mt-4">
                <div className="h-full border rounded-lg overflow-hidden">
                  <EnhancedMonacoEditor
                    ref={editorRef}
                    value={fileContent}
                    onChange={setFileContent}
                    language="typescript"
                    theme={personality === 'assistant' ? 'vs-light' : 'vs-dark'}
                    enableDiagnostics={true}
                    enableIntelliSense={true}
                    enableMinimap={true}
                    enableBreadcrumbs={true}
                    enableLineNumbers={true}
                    enableFolding={true}
                    enableAutoSave={false}
                    height="100%"
                    className="h-full"
                  />
                </div>
              </TabsContent>

              <TabsContent value="ai-chat" className="h-full mt-4">
                <div className="h-full border rounded-lg overflow-hidden">
                  <AIChat
                    messages={aiMessages}
                    isLoading={aiLoading}
                    onSendMessage={async (message: string) => {
                      await sendAIMessage(message);
                    }}
                    onClearMessages={clearAIMessages}
                    isConfigured={aiConfigured}
                    settings={aiSettings}
                    onSettingsChange={saveAISettings}
                    personality={personality}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button 
            onClick={() => setActiveTab('file-system')}
            variant={activeTab === 'file-system' ? 'default' : 'outline'}
          >
            <FileText className="w-4 h-4 mr-2" />
            Try File System
          </Button>
          <Button 
            onClick={() => setActiveTab('code-editor')}
            variant={activeTab === 'code-editor' ? 'default' : 'outline'}
          >
            <Code className="w-4 h-4 mr-2" />
            Try Code Editor
          </Button>
          <Button 
            onClick={() => setActiveTab('ai-chat')}
            variant={activeTab === 'ai-chat' ? 'default' : 'outline'}
          >
            <Bot className="w-4 h-4 mr-2" />
            Try AI Assistant
          </Button>
        </div>

        {/* Technical Specs */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="w-5 h-5" />
                Technology Stack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Frontend</span>
                  <Badge variant="outline">Next.js 15</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Language</span>
                  <Badge variant="outline">TypeScript</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Styling</span>
                  <Badge variant="outline">Tailwind CSS</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Editor</span>
                  <Badge variant="outline">Monaco</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">OCR</span>
                  <Badge variant="outline">Tesseract.js</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Cloud className="w-5 h-5" />
                AI Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">OpenAI</span>
                  <Badge variant="outline">GPT-4</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Anthropic</span>
                  <Badge variant="outline">Claude</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Google</span>
                  <Badge variant="outline">Gemini</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Local</span>
                  <Badge variant="outline">Ollama</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">OCR</span>
                  <Badge variant="outline">Image→Text</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5" />
                Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Languages</span>
                  <Badge variant="outline">20+</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Themes</span>
                  <Badge variant="outline">Custom</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Version Control</span>
                  <Badge variant="outline">Git</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Templates</span>
                  <Badge variant="outline">React/Node</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Export</span>
                  <Badge variant="outline">ZIP</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
