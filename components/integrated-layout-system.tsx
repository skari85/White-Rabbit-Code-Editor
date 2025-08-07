/**
 * White Rabbit Code Editor - Integrated Layout System
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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutGrid, 
  Columns2, 
  Rows2, 
  Square, 
  Settings, 
  Save, 
  RotateCcw,
  Eye,
  EyeOff,
  X,
  MoreVertical
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAnalytics } from '@/hooks/use-analytics'

export type LayoutMode = 'single' | 'horizontal' | 'vertical' | 'grid'
export type PaneType = 'code' | 'ai-chat' | 'preview' | 'terminal' | 'files'

export interface PaneConfig {
  id: string
  type: PaneType
  title: string
  visible: boolean
  size: number
  minSize?: number
  maxSize?: number
}

export interface LayoutConfig {
  id: string
  name: string
  mode: LayoutMode
  panes: PaneConfig[]
}

interface IntegratedLayoutSystemProps {
  children: {
    codeEditor: React.ReactNode
    aiChat: React.ReactNode
    livePreview: React.ReactNode
    terminal: React.ReactNode
    fileExplorer: React.ReactNode
  }
  className?: string
}

const DEFAULT_LAYOUTS: LayoutConfig[] = [
  {
    id: 'single',
    name: 'Single',
    mode: 'single',
    panes: [
      { id: 'main', type: 'code', title: 'Code Editor', visible: true, size: 100 }
    ]
  },
  {
    id: 'horizontal',
    name: 'Horizontal',
    mode: 'horizontal',
    panes: [
      { id: 'top', type: 'code', title: 'Code Editor', visible: true, size: 70, minSize: 30 },
      { id: 'bottom', type: 'terminal', title: 'Terminal', visible: true, size: 30, minSize: 20 }
    ]
  },
  {
    id: 'vertical',
    name: 'Vertical',
    mode: 'vertical',
    panes: [
      { id: 'left', type: 'code', title: 'Code Editor', visible: true, size: 60, minSize: 30 },
      { id: 'right', type: 'ai-chat', title: 'AI Assistant', visible: true, size: 40, minSize: 25 }
    ]
  },
  {
    id: 'grid',
    name: 'Grid',
    mode: 'grid',
    panes: [
      { id: 'tl', type: 'files', title: 'Files', visible: true, size: 25 },
      { id: 'tr', type: 'code', title: 'Code', visible: true, size: 50 },
      { id: 'bl', type: 'terminal', title: 'Terminal', visible: true, size: 25 },
      { id: 'br', type: 'preview', title: 'Preview', visible: true, size: 25 }
    ]
  }
]

export function IntegratedLayoutSystem({ children, className }: IntegratedLayoutSystemProps) {
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig>(DEFAULT_LAYOUTS[0])
  const [showControls, setShowControls] = useState(true)
  const { trackFeatureUsed } = useAnalytics()

  // Load saved layout
  useEffect(() => {
    const saved = localStorage.getItem('whiterabbit-layout')
    if (saved) {
      try {
        setCurrentLayout(JSON.parse(saved))
      } catch (error) {
        console.warn('Failed to load saved layout:', error)
      }
    }
  }, [])

  // Save layout changes
  const saveLayout = useCallback((layout: LayoutConfig) => {
    localStorage.setItem('whiterabbit-layout', JSON.stringify(layout))
    setCurrentLayout(layout)
    trackFeatureUsed('layout_change', { layout: layout.name })
  }, [trackFeatureUsed])

  // Handle layout change
  const handleLayoutChange = (layoutId: string) => {
    const layout = DEFAULT_LAYOUTS.find(l => l.id === layoutId)
    if (layout) {
      saveLayout(layout)
    }
  }

  // Toggle pane visibility
  const togglePane = (paneId: string) => {
    const updatedLayout = {
      ...currentLayout,
      panes: currentLayout.panes.map(pane =>
        pane.id === paneId ? { ...pane, visible: !pane.visible } : pane
      )
    }
    saveLayout(updatedLayout)
  }

  // Change pane content
  const changePaneContent = (paneId: string, newType: PaneType) => {
    const updatedLayout = {
      ...currentLayout,
      panes: currentLayout.panes.map(pane =>
        pane.id === paneId ? { ...pane, type: newType, title: getPaneTitle(newType) } : pane
      )
    }
    saveLayout(updatedLayout)
  }

  const getPaneTitle = (type: PaneType): string => {
    const titles = {
      'code': 'Code Editor',
      'ai-chat': 'AI Assistant',
      'preview': 'Live Preview',
      'terminal': 'Terminal',
      'files': 'File Explorer'
    }
    return titles[type]
  }

  const getPaneContent = (type: PaneType) => {
    const components = {
      'code': children.codeEditor,
      'ai-chat': children.aiChat,
      'preview': children.livePreview,
      'terminal': children.terminal,
      'files': children.fileExplorer
    }
    return components[type] || <div>Component not found</div>
  }

  const renderPaneHeader = (pane: PaneConfig) => (
    <div className="flex items-center justify-between p-2 border-b border-border bg-muted/50">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{pane.title}</span>
        <Badge variant="secondary" className="text-xs">{pane.type}</Badge>
      </div>
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changePaneContent(pane.id, 'code')}>
              Code Editor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changePaneContent(pane.id, 'ai-chat')}>
              AI Assistant
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changePaneContent(pane.id, 'preview')}>
              Live Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changePaneContent(pane.id, 'terminal')}>
              Terminal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changePaneContent(pane.id, 'files')}>
              File Explorer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => togglePane(pane.id)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )

  const renderPane = (pane: PaneConfig) => (
    <div className="h-full flex flex-col bg-background border border-border rounded-lg overflow-hidden">
      {renderPaneHeader(pane)}
      <div className="flex-1 overflow-hidden">
        {getPaneContent(pane.type)}
      </div>
    </div>
  )

  const renderLayout = () => {
    const visiblePanes = currentLayout.panes.filter(pane => pane.visible)
    
    if (visiblePanes.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground">No panes visible</div>
    }

    if (currentLayout.mode === 'single') {
      return renderPane(visiblePanes[0])
    }

    if (currentLayout.mode === 'horizontal') {
      return (
        <ResizablePanelGroup direction="vertical" className="h-full">
          {visiblePanes.map((pane, index) => (
            <React.Fragment key={pane.id}>
              <ResizablePanel defaultSize={pane.size} minSize={pane.minSize || 20}>
                {renderPane(pane)}
              </ResizablePanel>
              {index < visiblePanes.length - 1 && <ResizableHandle withHandle />}
            </React.Fragment>
          ))}
        </ResizablePanelGroup>
      )
    }

    if (currentLayout.mode === 'vertical') {
      return (
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {visiblePanes.map((pane, index) => (
            <React.Fragment key={pane.id}>
              <ResizablePanel defaultSize={pane.size} minSize={pane.minSize || 25}>
                {renderPane(pane)}
              </ResizablePanel>
              {index < visiblePanes.length - 1 && <ResizableHandle withHandle />}
            </React.Fragment>
          ))}
        </ResizablePanelGroup>
      )
    }

    if (currentLayout.mode === 'grid') {
      const topPanes = visiblePanes.filter(p => ['tl', 'tr'].includes(p.id))
      const bottomPanes = visiblePanes.filter(p => ['bl', 'br'].includes(p.id))

      return (
        <ResizablePanelGroup direction="vertical" className="h-full">
          {topPanes.length > 0 && (
            <ResizablePanel defaultSize={50}>
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {topPanes.map((pane, index) => (
                  <React.Fragment key={pane.id}>
                    <ResizablePanel defaultSize={50}>
                      {renderPane(pane)}
                    </ResizablePanel>
                    {index < topPanes.length - 1 && <ResizableHandle withHandle />}
                  </React.Fragment>
                ))}
              </ResizablePanelGroup>
            </ResizablePanel>
          )}
          
          {topPanes.length > 0 && bottomPanes.length > 0 && <ResizableHandle withHandle />}
          
          {bottomPanes.length > 0 && (
            <ResizablePanel defaultSize={50}>
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {bottomPanes.map((pane, index) => (
                  <React.Fragment key={pane.id}>
                    <ResizablePanel defaultSize={50}>
                      {renderPane(pane)}
                    </ResizablePanel>
                    {index < bottomPanes.length - 1 && <ResizableHandle withHandle />}
                  </React.Fragment>
                ))}
              </ResizablePanelGroup>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      )
    }

    return null
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Layout Controls */}
      {showControls && (
        <div className="flex items-center justify-between p-2 bg-background border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Layout:</span>
            {DEFAULT_LAYOUTS.map((layout) => (
              <Button
                key={layout.id}
                variant={currentLayout.id === layout.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLayoutChange(layout.id)}
                className="text-xs"
              >
                {layout.id === 'single' && <Square className="w-3 h-3 mr-1" />}
                {layout.id === 'horizontal' && <Rows2 className="w-3 h-3 mr-1" />}
                {layout.id === 'vertical' && <Columns2 className="w-3 h-3 mr-1" />}
                {layout.id === 'grid' && <LayoutGrid className="w-3 h-3 mr-1" />}
                {layout.name}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowControls(false)}
          >
            <EyeOff className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Show Controls Button */}
      {!showControls && (
        <div className="absolute top-2 right-2 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowControls(true)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Layout Content */}
      <div className="flex-1 overflow-hidden p-2">
        {renderLayout()}
      </div>
    </div>
  )
}
