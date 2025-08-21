'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  MousePointer, 
  Scroll, 
  Sparkles, 
  Eye, 
  Code, 
  Zap,
  Palette,
  Monitor,
  Smartphone,
  Accessibility
} from 'lucide-react'

export default function VisualEnhancementsDemoPage() {
  const [activeTab, setActiveTab] = useState('demo')
  const [currentLine, setCurrentLine] = useState(1)
  const [showScrollDemo, setShowScrollDemo] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Simulate line highlighting for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLine(prev => (prev % 20) + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const scrollToLine = (line: number) => {
    setCurrentLine(line)
    if (scrollAreaRef.current) {
      const lineElement = scrollAreaRef.current.querySelector(`[data-line="${line}"]`)
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  const sampleCode = `// Welcome to the Visual Enhancements Demo!
// This showcases the beautiful Monaco Editor improvements

import React, { useState, useEffect } from 'react'
import { MonacoEditor } from '@/components/monaco-editor'

interface CodeEditorProps {
  language: string
  theme: 'vs-dark' | 'vs-light' | 'hc-black'
  value: string
  onChange: (value: string) => void
}

export function CodeEditor({ 
  language, 
  theme, 
  value, 
  onChange 
}: CodeEditorProps) {
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Simulate editor loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <div className="loading-spinner">Loading editor...</div>
  }

  return (
    <MonacoEditor
      language={language}
      theme={theme}
      value={value}
      onChange={onChange}
      options={{
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: 'smooth'
      }}
    />
  )
}

// Try clicking on different lines to see the ripple effect!
// Use Page Up/Down or scroll to see smooth scrolling in action

const features = [
  '✨ Smooth Scrolling',
  '🎯 Ripple Line Highlighting', 
  '🎨 Enhanced Visual Feedback',
  '🚀 Performance Optimized',
  '📱 Mobile Responsive',
  '♿ Accessibility Friendly'
]

export default CodeEditor`

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Visual Enhancements Demo
        </h1>
        <p className="text-muted-foreground">
          Experience the beautiful Monaco Editor improvements with smooth scrolling and ripple line highlighting
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="demo" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Live Demo
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Implementation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monaco Editor Demo */}
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Enhanced Monaco Editor
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click on lines or use Page Up/Down to see smooth scrolling
                </p>
              </CardHeader>
              <CardContent className="h-full">
                <div className="relative h-full bg-[#1e1e1e] rounded-lg overflow-hidden">
                  {/* Simulated Monaco Editor */}
                  <div className="h-full flex flex-col">
                    {/* Editor Header */}
                    <div className="bg-[#2d2d30] px-4 py-2 border-b border-[#3c3c3c]">
                      <div className="flex items-center gap-4 text-sm text-gray-300">
                        <span>TypeScript</span>
                        <span>•</span>
                        <span>Enhanced</span>
                        <span>•</span>
                        <span>Visual</span>
                      </div>
                    </div>
                    
                    {/* Editor Content */}
                    <div className="flex-1 relative overflow-hidden">
                      <ScrollArea ref={scrollAreaRef} className="h-full">
                        <div className="p-4 font-mono text-sm text-gray-300 leading-6">
                          {sampleCode.split('\n').map((line, index) => (
                            <div
                              key={index}
                              data-line={index + 1}
                              className={`relative px-2 py-1 rounded transition-all duration-200 ${
                                currentLine === index + 1 
                                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20' 
                                  : ''
                              }`}
                              onClick={() => scrollToLine(index + 1)}
                            >
                              {/* Line Number */}
                              <span className="inline-block w-8 text-gray-500 text-xs mr-4">
                                {index + 1}
                              </span>
                              
                              {/* Code Line */}
                              <span className="cursor-pointer hover:text-white transition-colors">
                                {line}
                              </span>
                              
                              {/* Ripple Effect for Current Line */}
                              {currentLine === index + 1 && (
                                <>
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded animate-pulse" />
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded animate-ping" />
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Interactive Controls
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Test the visual enhancements
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Line Navigation</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 15, 20, 25, 30].map((line) => (
                      <Button
                        key={line}
                        variant="outline"
                        size="sm"
                        onClick={() => scrollToLine(line)}
                        className="text-xs"
                      >
                        Line {line}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Scroll Demo</h4>
                  <Button
                    onClick={() => setShowScrollDemo(!showScrollDemo)}
                    variant={showScrollDemo ? "default" : "outline"}
                    className="w-full"
                  >
                    {showScrollDemo ? 'Hide' : 'Show'} Scroll Demo
                  </Button>
                </div>

                {showScrollDemo && (
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <h5 className="font-medium text-sm">Scroll Behavior</h5>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p>• Use Page Up/Down for smooth scrolling</p>
                      <p>• Click line numbers for smooth navigation</p>
                      <p>• Scroll wheel provides smooth movement</p>
                      <p>• Keyboard navigation is enhanced</p>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Current Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Current Line:</span>
                      <Badge variant="secondary">{currentLine}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Ripple Effect:</span>
                      <Badge variant="outline" className="text-green-600">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Smooth Scrolling:</span>
                      <Badge variant="outline" className="text-blue-600">
                        Enabled
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Smooth Scrolling */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scroll className="w-5 h-5 text-blue-600" />
                  Smooth Scrolling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Instead of instant jumps, the editor glides smoothly to new positions, 
                  helping users maintain context and visual orientation.
                </p>
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">Page Up/Down</Badge>
                  <Badge variant="outline" className="text-xs">Search Results</Badge>
                  <Badge variant="outline" className="text-xs">Line Navigation</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Ripple Line Highlighting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="w-5 h-5 text-purple-600" />
                  Ripple Line Highlighting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  When clicking on a line, the highlight expands smoothly like a ripple of light, 
                  providing tactile feedback and visual connection.
                </p>
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">Click Feedback</Badge>
                  <Badge variant="outline" className="text-xs">Smooth Animation</Badge>
                  <Badge variant="outline" className="text-xs">Visual Connection</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Visual Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-green-600" />
                  Enhanced Visual Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Improved scrollbars, hover effects, and transitions create a more 
                  polished and professional editing experience.
                </p>
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">Hover Effects</Badge>
                  <Badge variant="outline" className="text-xs">Smooth Transitions</Badge>
                  <Badge variant="outline" className="text-xs">Enhanced UI</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Performance Optimized */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Performance Optimized
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  All animations use hardware acceleration and optimized timing functions 
                  for smooth performance even on lower-end devices.
                </p>
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">Hardware Acceleration</Badge>
                  <Badge variant="outline" className="text-xs">Optimized Timing</Badge>
                  <Badge variant="outline" className="text-xs">Smooth Performance</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Responsive */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  Mobile Responsive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Enhanced touch interactions and responsive design ensure the 
                  visual enhancements work beautifully on all devices.
                </p>
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">Touch Optimized</Badge>
                  <Badge variant="outline" className="text-xs">Responsive Design</Badge>
                  <Badge variant="outline" className="text-xs">Cross Platform</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Accessibility Friendly */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Accessibility className="w-5 h-5 text-pink-600" />
                  Accessibility Friendly
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Respects user preferences for reduced motion and provides 
                  graceful degradation for accessibility tools.
                </p>
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">Reduced Motion</Badge>
                  <Badge variant="outline" className="text-xs">Graceful Degradation</Badge>
                  <Badge variant="outline" className="text-xs">Accessibility Tools</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CSS Implementation</CardTitle>
              <p className="text-sm text-muted-foreground">
                The visual enhancements are implemented using advanced CSS animations and transitions
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Smooth Scrolling</h4>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`.monaco-editor .monaco-scrollable-element {
  scroll-behavior: smooth;
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Ripple Line Highlighting</h4>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`.monaco-editor .view-lines .current-line::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    rgba(100, 100, 120, 0.15) 0%, 
    rgba(100, 100, 120, 0.25) 50%, 
    rgba(100, 100, 120, 0.15) 100%);
  transform: scaleX(0);
  transform-origin: left;
  animation: ripple-highlight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Enhanced Scrollbar</h4>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`.monaco-editor .monaco-scrollable-element > .scrollbar > .slider {
  background: rgba(121, 121, 121, 0.4);
  transition: all 0.2s ease;
  border-radius: 4px;
}

.monaco-editor .monaco-scrollable-element > .scrollbar > .slider:hover {
  background: rgba(121, 121, 121, 0.7);
  transform: scaleX(1.1);
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
