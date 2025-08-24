/**
 * White Rabbit Code Editor - Debug Panel Component
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Play,
  Pause,
  Square,
  SkipForward,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Bug,
  Circle,
  Settings,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Terminal,
  Eye,
  Code
} from 'lucide-react'
import { 
  EnhancedDebuggerService, 
  DebugSession, 
  Breakpoint, 
  DebugVariable,
  StackFrame,
  DebugConfiguration
} from '@/lib/enhanced-debugger-service'
import { useAnalytics } from '@/hooks/use-analytics'

interface DebugPanelProps {
  debugger: EnhancedDebuggerService
  onFileSelect?: (file: string, line: number) => void
  className?: string
}

export function DebugPanel({ debugger: debugService, onFileSelect, className }: DebugPanelProps) {
  const [activeSession, setActiveSession] = useState<DebugSession | null>(null)
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([])
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [debugConfig, setDebugConfig] = useState<DebugConfiguration>({
    name: 'Launch Program',
    type: 'node',
    request: 'launch',
    program: '${workspaceFolder}/index.js'
  })
  const [watchExpression, setWatchExpression] = useState('')
  const [watchedVariables, setWatchedVariables] = useState<DebugVariable[]>([])
  const [expandedVariables, setExpandedVariables] = useState<Set<string>>(new Set())

  const { trackFeatureUsed } = useAnalytics()

  // Update session and breakpoints when debugger changes
  useEffect(() => {
    const updateSession = (session: DebugSession) => {
      setActiveSession(session)
    }

    const updateBreakpoints = (bps: Breakpoint[]) => {
      setBreakpoints(bps)
    }

    // Set up debugger callbacks
    debugService['onSessionUpdate'] = updateSession
    debugService['onBreakpointUpdate'] = updateBreakpoints

    // Initial load
    setActiveSession(debugService.getActiveSession())
    setBreakpoints(debugService.getAllBreakpoints())

    return () => {
      debugService['onSessionUpdate'] = undefined
      debugService['onBreakpointUpdate'] = undefined
    }
  }, [debugService])

  // Start debug session
  const handleStartDebugging = async () => {
    try {
      await debugService.createSession(debugConfig)
      await debugService.start()
      setShowConfigDialog(false)
      trackFeatureUsed('debug_start')
    } catch (error) {
      // Handle debugging start error
    }
  }

  // Debug control actions
  const handlePlay = async () => {
    if (!activeSession) {
      setShowConfigDialog(true)
      return
    }

    if (activeSession.status === 'paused') {
      await debugService.continue()
    } else {
      await debugService.start()
    }
    trackFeatureUsed('debug_play')
  }

  const handlePause = async () => {
    await debugService.pause()
    trackFeatureUsed('debug_pause')
  }

  const handleStop = async () => {
    await debugService.stop()
    trackFeatureUsed('debug_stop')
  }

  const handleStepOver = async () => {
    await debugService.stepOver()
    trackFeatureUsed('debug_step_over')
  }

  const handleStepInto = async () => {
    await debugService.stepInto()
    trackFeatureUsed('debug_step_into')
  }

  const handleStepOut = async () => {
    await debugService.stepOut()
    trackFeatureUsed('debug_step_out')
  }

  // Breakpoint management
  const handleToggleBreakpoint = (breakpointId: string) => {
    debugService.toggleBreakpoint(breakpointId)
  }

  const handleRemoveBreakpoint = (breakpointId: string) => {
    debugService.removeBreakpoint(breakpointId)
  }

  const handleClearAllBreakpoints = () => {
    debugService.clearAllBreakpoints()
  }

  // Variable expansion
  const toggleVariableExpansion = (variableName: string) => {
    const newExpanded = new Set(expandedVariables)
    if (newExpanded.has(variableName)) {
      newExpanded.delete(variableName)
    } else {
      newExpanded.add(variableName)
    }
    setExpandedVariables(newExpanded)
  }

  // Watch expression
  const handleAddWatchExpression = async () => {
    if (!watchExpression.trim()) return

    try {
      const result = await debugService.evaluateExpression(watchExpression)
      setWatchedVariables(prev => [...prev, result])
      setWatchExpression('')
      trackFeatureUsed('debug_watch_expression')
    } catch (error) {
      // Handle watch expression evaluation error
    }
  }

  // Navigate to file/line
  const handleNavigateToFrame = (frame: StackFrame) => {
    onFileSelect?.(frame.file, frame.line)
  }

  const handleNavigateToBreakpoint = (breakpoint: Breakpoint) => {
    onFileSelect?.(breakpoint.file, breakpoint.line)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-500'
      case 'paused': return 'text-yellow-500'
      case 'stopped': return 'text-gray-500'
      case 'terminated': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-3 h-3" />
      case 'paused': return <Pause className="w-3 h-3" />
      case 'stopped': return <Square className="w-3 h-3" />
      case 'terminated': return <Square className="w-3 h-3" />
      default: return <Circle className="w-3 h-3" />
    }
  }

  const renderVariable = (variable: DebugVariable, depth: number = 0) => {
    const isExpanded = expandedVariables.has(variable.name)
    const indent = depth * 16

    return (
      <div key={variable.name} style={{ marginLeft: indent }}>
        <div className="flex items-center justify-between p-1 hover:bg-muted rounded text-sm">
          <div className="flex items-center gap-1">
            {variable.expandable && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => toggleVariableExpansion(variable.name)}
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </Button>
            )}
            <span className="font-medium">{variable.name}:</span>
            <span className="text-muted-foreground">
              {typeof variable.value === 'object' 
                ? JSON.stringify(variable.value).substring(0, 50) + '...'
                : String(variable.value)
              }
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {variable.type}
          </Badge>
        </div>
        
        {isExpanded && variable.children && (
          <div className="ml-4">
            {variable.children.map(child => renderVariable(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Debugger
            {activeSession && (
              <Badge variant="outline" className={`text-xs ${getStatusColor(activeSession.status)}`}>
                {getStatusIcon(activeSession.status)}
                {activeSession.status}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm">
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Debug Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlay}
            title={activeSession?.status === 'paused' ? 'Continue' : 'Start Debugging'}
          >
            <Play className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePause}
            disabled={!activeSession || activeSession.status !== 'running'}
            title="Pause"
          >
            <Pause className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStop}
            disabled={!activeSession || activeSession.status === 'terminated'}
            title="Stop"
          >
            <Square className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStepOver}
            disabled={!activeSession || activeSession.status !== 'paused'}
            title="Step Over"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStepInto}
            disabled={!activeSession || activeSession.status !== 'paused'}
            title="Step Into"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStepOut}
            disabled={!activeSession || activeSession.status !== 'paused'}
            title="Step Out"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>

        <Tabs defaultValue="variables" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="watch">Watch</TabsTrigger>
            <TabsTrigger value="callstack">Call Stack</TabsTrigger>
            <TabsTrigger value="breakpoints">Breakpoints</TabsTrigger>
          </TabsList>

          {/* Variables Tab */}
          <TabsContent value="variables" className="space-y-2">
            <ScrollArea className="h-48">
              <div className="space-y-1">
                {activeSession?.variables.map(variable => renderVariable(variable))}
                {(!activeSession?.variables || activeSession.variables.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No variables available</p>
                    <p className="text-xs">Start debugging to see variables</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Watch Tab */}
          <TabsContent value="watch" className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Watch expression..."
                value={watchExpression}
                onChange={(e) => setWatchExpression(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddWatchExpression()
                  }
                }}
                className="text-sm"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddWatchExpression}
                disabled={!watchExpression.trim() || !activeSession || activeSession.status !== 'paused'}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            
            <ScrollArea className="h-40">
              <div className="space-y-1">
                {watchedVariables.map((variable, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded border text-sm">
                    <div>
                      <span className="font-medium">{variable.name}:</span>
                      <span className="ml-2 text-muted-foreground">
                        {String(variable.value)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setWatchedVariables(prev => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {watchedVariables.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No watch expressions</p>
                    <p className="text-xs">Add expressions to watch their values</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Call Stack Tab */}
          <TabsContent value="callstack" className="space-y-2">
            <ScrollArea className="h-48">
              <div className="space-y-1">
                {activeSession?.callStack.map((frame, index) => (
                  <div
                    key={frame.id}
                    className="p-2 rounded border hover:bg-muted cursor-pointer text-sm"
                    onClick={() => handleNavigateToFrame(frame)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{frame.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {frame.line}:{frame.column}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {frame.file}
                    </div>
                    {frame.source && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {frame.source}
                      </div>
                    )}
                  </div>
                ))}
                {(!activeSession?.callStack || activeSession.callStack.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No call stack available</p>
                    <p className="text-xs">Pause execution to see call stack</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Breakpoints Tab */}
          <TabsContent value="breakpoints" className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Breakpoints ({breakpoints.length})</span>
              {breakpoints.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearAllBreakpoints}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-40">
              <div className="space-y-1">
                {breakpoints.map((breakpoint) => (
                  <div
                    key={breakpoint.id}
                    className="flex items-center justify-between p-2 rounded border hover:bg-muted cursor-pointer text-sm"
                    onClick={() => handleNavigateToBreakpoint(breakpoint)}
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleBreakpoint(breakpoint.id)
                        }}
                      >
                        <Circle 
                          className={`w-3 h-3 ${
                            breakpoint.enabled ? 'fill-red-500 text-red-500' : 'text-gray-400'
                          }`} 
                        />
                      </Button>
                      <div>
                        <div className="font-medium">
                          {breakpoint.file}:{breakpoint.line}
                        </div>
                        {breakpoint.condition && (
                          <div className="text-xs text-muted-foreground">
                            Condition: {breakpoint.condition}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveBreakpoint(breakpoint.id)
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {breakpoints.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No breakpoints set</p>
                    <p className="text-xs">Click in the editor gutter to add breakpoints</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Debug Configuration Dialog */}
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Debug Configuration</DialogTitle>
              <DialogDescription>
                Configure your debug session settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Configuration Name</label>
                <Input
                  value={debugConfig.name}
                  onChange={(e) => setDebugConfig(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {debugConfig.type}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuItem onClick={() => setDebugConfig(prev => ({ ...prev, type: 'node' }))}>
                      Node.js
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDebugConfig(prev => ({ ...prev, type: 'browser' }))}>
                      Browser
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDebugConfig(prev => ({ ...prev, type: 'python' }))}>
                      Python
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {debugConfig.type === 'node' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Program</label>
                  <Input
                    value={debugConfig.program || ''}
                    onChange={(e) => setDebugConfig(prev => ({ ...prev, program: e.target.value }))}
                    placeholder="${workspaceFolder}/index.js"
                  />
                </div>
              )}
              {debugConfig.type === 'browser' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL</label>
                  <Input
                    value={debugConfig.url || ''}
                    onChange={(e) => setDebugConfig(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="http://localhost:3000"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStartDebugging}>
                  Start Debugging
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
