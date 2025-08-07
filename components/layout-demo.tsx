/**
 * White Rabbit Code Editor - Layout System Demo
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import React from 'react'
import { IntegratedLayoutSystem } from './integrated-layout-system'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Code, 
  MessageSquare, 
  Eye, 
  Terminal as TerminalIcon, 
  FolderOpen,
  Play,
  Save,
  Settings
} from 'lucide-react'

// Mock components for demonstration
const MockCodeEditor = () => (
  <div className="h-full bg-gray-900 text-green-400 p-4 font-mono text-sm overflow-auto">
    <div className="mb-2 text-gray-500">// White Rabbit Code Editor</div>
    <div className="mb-1">function helloWorld() {`{`}</div>
    <div className="mb-1 ml-4">console.log('Hello, White Rabbit!');</div>
    <div className="mb-1">{'}'}</div>
    <div className="mt-4 text-gray-500">// Your code here...</div>
    <div className="mt-2 animate-pulse">|</div>
  </div>
)

const MockAIChat = () => (
  <div className="h-full bg-background p-4 flex flex-col">
    <div className="flex-1 space-y-3 overflow-auto">
      <div className="bg-muted p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <p className="text-sm">How can I help you with your code today?</p>
      </div>
      <div className="bg-primary/10 p-3 rounded-lg">
        <p className="text-sm">Create a React component for a todo list</p>
      </div>
      <div className="bg-muted p-3 rounded-lg">
        <p className="text-sm">I'll help you create a React todo list component. Here's a basic implementation...</p>
      </div>
    </div>
    <div className="mt-4 flex gap-2">
      <input 
        className="flex-1 px-3 py-2 border border-border rounded-md text-sm" 
        placeholder="Ask me anything..."
      />
      <Button size="sm">Send</Button>
    </div>
  </div>
)

const MockLivePreview = () => (
  <div className="h-full bg-white border border-border flex flex-col">
    <div className="p-2 border-b border-border bg-muted/50 flex items-center gap-2">
      <Eye className="w-4 h-4" />
      <span className="text-sm font-medium">Live Preview</span>
      <Badge variant="secondary" className="text-xs">localhost:3012</Badge>
    </div>
    <div className="flex-1 p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
          <Eye className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Live Preview</h3>
        <p className="text-sm text-muted-foreground">Your app preview will appear here</p>
        <Button className="mt-4" size="sm">
          <Play className="w-4 h-4 mr-2" />
          Run Preview
        </Button>
      </div>
    </div>
  </div>
)

const MockTerminal = () => (
  <div className="h-full bg-black text-green-400 p-4 font-mono text-sm overflow-auto">
    <div className="mb-2">
      <span className="text-blue-400">user@whiterabbit</span>
      <span className="text-white">:</span>
      <span className="text-yellow-400">~/project</span>
      <span className="text-white">$ </span>
      <span>npm run dev</span>
    </div>
    <div className="mb-1 text-gray-400">
      > white-rabbit-editor@1.0.0 dev
    </div>
    <div className="mb-1 text-gray-400">
      > next dev -p 3012
    </div>
    <div className="mb-2 text-green-400">
      ✓ Ready on http://localhost:3012
    </div>
    <div className="mb-2">
      <span className="text-blue-400">user@whiterabbit</span>
      <span className="text-white">:</span>
      <span className="text-yellow-400">~/project</span>
      <span className="text-white">$ </span>
      <span className="animate-pulse">|</span>
    </div>
  </div>
)

const MockFileExplorer = () => (
  <div className="h-full bg-background p-2">
    <div className="mb-3 flex items-center gap-2">
      <FolderOpen className="w-4 h-4" />
      <span className="text-sm font-medium">Explorer</span>
    </div>
    <div className="space-y-1 text-sm">
      <div className="flex items-center gap-2 p-1 hover:bg-muted rounded">
        <span>📁</span>
        <span>components</span>
      </div>
      <div className="flex items-center gap-2 p-1 hover:bg-muted rounded ml-4">
        <span>📄</span>
        <span>code-editor.tsx</span>
      </div>
      <div className="flex items-center gap-2 p-1 hover:bg-muted rounded ml-4">
        <span>📄</span>
        <span>ai-chat.tsx</span>
      </div>
      <div className="flex items-center gap-2 p-1 hover:bg-muted rounded">
        <span>📁</span>
        <span>hooks</span>
      </div>
      <div className="flex items-center gap-2 p-1 hover:bg-muted rounded ml-4">
        <span>📄</span>
        <span>use-code-builder.ts</span>
      </div>
      <div className="flex items-center gap-2 p-1 hover:bg-muted rounded">
        <span>📄</span>
        <span>package.json</span>
      </div>
      <div className="flex items-center gap-2 p-1 hover:bg-muted rounded">
        <span>📄</span>
        <span>README.md</span>
      </div>
    </div>
  </div>
)

export function LayoutDemo() {
  return (
    <div className="h-screen bg-background">
      <IntegratedLayoutSystem
        children={{
          codeEditor: <MockCodeEditor />,
          aiChat: <MockAIChat />,
          livePreview: <MockLivePreview />,
          terminal: <MockTerminal />,
          fileExplorer: <MockFileExplorer />
        }}
      />
    </div>
  )
}

// Usage instructions component
export function LayoutSystemInstructions() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          White Rabbit Layout System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">🎯 Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Split Screen Options</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Single pane (focus mode)</li>
                <li>• Horizontal split (code + terminal)</li>
                <li>• Vertical split (code + AI chat)</li>
                <li>• Grid layout (4-pane view)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Resizable Windows</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Drag handles between panes</li>
                <li>• Minimum/maximum size constraints</li>
                <li>• Snap-to-size functionality</li>
                <li>• Persistent size preferences</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Configurable Content</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Code editor with Monaco</li>
                <li>• AI chat interface</li>
                <li>• Live preview panel</li>
                <li>• Terminal/console</li>
                <li>• File explorer</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Layout Persistence</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Auto-save layout changes</li>
                <li>• Custom layout creation</li>
                <li>• Import/export layouts</li>
                <li>• Reset to defaults</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">🚀 How to Use</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Badge>1</Badge>
              <div>
                <p className="font-medium">Choose Layout Mode</p>
                <p className="text-muted-foreground">Click the layout buttons in the toolbar to switch between single, horizontal, vertical, or grid layouts.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge>2</Badge>
              <div>
                <p className="font-medium">Resize Panes</p>
                <p className="text-muted-foreground">Drag the handles between panes to adjust their sizes. Your preferences are automatically saved.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge>3</Badge>
              <div>
                <p className="font-medium">Customize Content</p>
                <p className="text-muted-foreground">Click the menu button in each pane header to change what content is displayed in that pane.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge>4</Badge>
              <div>
                <p className="font-medium">Save Custom Layouts</p>
                <p className="text-muted-foreground">Create your perfect workspace and save it as a custom layout for future use.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">💡 Pro Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use keyboard shortcuts to quickly switch between layouts</li>
            <li>• Hide the layout controls for maximum screen space</li>
            <li>• Export your layouts to share with team members</li>
            <li>• Each pane remembers its scroll position and state</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
