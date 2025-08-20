/**
 * White Rabbit Code Editor - Resizable Layout Renderer
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import React, { useState, useCallback } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Settings, 
  Maximize2, 
  Minimize2,
  MoreVertical,
  Code,
  MessageSquare,
  Eye,
  Terminal as TerminalIcon,
  FolderOpen,
  BookOpen,
  Store
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LayoutConfig, PaneConfig, PaneType } from './advanced-layout-system'

interface ResizableLayoutRendererProps {
  layout: LayoutConfig
  onLayoutChange: (layout: LayoutConfig) => void
  onPaneContentChange: (paneId: string, content: PaneType) => void
  paneComponents: Record<PaneType, React.ComponentType<any>>
  paneProps?: Record<string, any>
}

const PANE_TYPE_OPTIONS: { type: PaneType; label: string; icon: React.ReactNode }[] = [
  { type: 'code', label: 'Code Editor', icon: <Code className="w-4 h-4" /> },
  { type: 'ai-chat', label: 'AI Assistant', icon: <MessageSquare className="w-4 h-4" /> },
  { type: 'preview', label: 'Live Preview', icon: <Eye className="w-4 h-4" /> },
  { type: 'terminal', label: 'Terminal', icon: <TerminalIcon className="w-4 h-4" /> },
  { type: 'files', label: 'File Explorer', icon: <FolderOpen className="w-4 h-4" /> },
  { type: 'documentation', label: 'Documentation', icon: <BookOpen className="w-4 h-4" /> },
  { type: 'marketplace', label: 'Marketplace', icon: <Store className="w-4 h-4" /> }
]

export function ResizableLayoutRenderer({
  layout,
  onLayoutChange,
  onPaneContentChange,
  paneComponents,
  paneProps = {}
}: ResizableLayoutRendererProps) {
  const [paneSizes, setPaneSizes] = useState<Record<string, number>>({})

  // Handle pane resize
  const handlePaneResize = useCallback((paneId: string, size: number) => {
    setPaneSizes(prev => ({ ...prev, [paneId]: size }))
    
    // Update layout with new size
    const updatedLayout = {
      ...layout,
      panes: layout.panes.map(pane =>
        pane.id === paneId ? { ...pane, size } : pane
      )
    }
    onLayoutChange(updatedLayout)
  }, [layout, onLayoutChange])

  // Toggle pane visibility
  const togglePaneVisibility = (paneId: string) => {
    const updatedLayout = {
      ...layout,
      panes: layout.panes.map(pane =>
        pane.id === paneId ? { ...pane, visible: !pane.visible } : pane
      )
    }
    onLayoutChange(updatedLayout)
  }

  // Change pane content type
  const changePaneType = (paneId: string, newType: PaneType) => {
    const updatedLayout = {
      ...layout,
      panes: layout.panes.map(pane =>
        pane.id === paneId ? { ...pane, type: newType, title: getPaneTitle(newType) } : pane
      )
    }
    onLayoutChange(updatedLayout)
    onPaneContentChange(paneId, newType)
  }

  const getPaneTitle = (type: PaneType): string => {
    const option = PANE_TYPE_OPTIONS.find(opt => opt.type === type)
    return option?.label || 'Unknown'
  }

  const getPaneIcon = (type: PaneType) => {
    const option = PANE_TYPE_OPTIONS.find(opt => opt.type === type)
    return option?.icon || <Settings className="w-4 h-4" />
  }

  // Render pane header with controls
  const renderPaneHeader = (pane: PaneConfig) => (
    <CardHeader className="p-2 border-b border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getPaneIcon(pane.type)}
          <CardTitle className="text-sm font-medium">{pane.title}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {pane.type}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Pane Type Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {PANE_TYPE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.type}
                  onClick={() => changePaneType(pane.id, option.type)}
                  className="flex items-center gap-2"
                >
                  {option.icon}
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Hide Pane */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => togglePaneVisibility(pane.id)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </CardHeader>
  )

  // Render pane content
  const renderPaneContent = (pane: PaneConfig) => {
    const Component = paneComponents[pane.type]
    if (!Component) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            {getPaneIcon(pane.type)}
            <p className="mt-2 text-sm">No component available for {pane.type}</p>
          </div>
        </div>
      )
    }

    return <Component {...(paneProps[pane.type] || {})} />
  }

  // Render single pane layout
  if (layout.mode === 'single') {
    const visiblePane = layout.panes.find(pane => pane.visible)
    if (!visiblePane) return null

    return (
      <Card className="h-full">
        {renderPaneHeader(visiblePane)}
        <CardContent className="p-0 h-[calc(100%-60px)]">
          {renderPaneContent(visiblePane)}
        </CardContent>
      </Card>
    )
  }

  // Render split layouts (horizontal/vertical)
  if (layout.mode === 'horizontal' || layout.mode === 'vertical') {
    const visiblePanes = layout.panes.filter(pane => pane.visible)
    if (visiblePanes.length === 0) return null

    const direction = layout.direction || (layout.mode === 'horizontal' ? 'vertical' : 'horizontal')

    return (
      <ResizablePanelGroup direction={direction} className="h-full">
        {visiblePanes.map((pane, index) => (
          <React.Fragment key={pane.id}>
            <ResizablePanel
              defaultSize={Math.min(pane.size, pane.maxSize || 80)}
              minSize={pane.minSize || 20}
              maxSize={pane.maxSize || 80}
              onResize={(size) => handlePaneResize(pane.id, size)}
            >
              <Card className="h-full">
                {renderPaneHeader(pane)}
                <CardContent className="p-0 h-[calc(100%-60px)]">
                  {renderPaneContent(pane)}
                </CardContent>
              </Card>
            </ResizablePanel>
            
            {index < visiblePanes.length - 1 && (
              <ResizableHandle withHandle />
            )}
          </React.Fragment>
        ))}
      </ResizablePanelGroup>
    )
  }

  // Render grid layout
  if (layout.mode === 'grid') {
    const visiblePanes = layout.panes.filter(pane => pane.visible)
    const rows = layout.gridRows || 2
    const cols = layout.gridCols || 2

    // Group panes by row
    const panesByRow: PaneConfig[][] = []
    for (let row = 0; row < rows; row++) {
      panesByRow[row] = visiblePanes.filter(pane => pane.position.row === row)
    }

    return (
      <ResizablePanelGroup direction="vertical" className="h-full">
        {panesByRow.map((rowPanes, rowIndex) => (
          <React.Fragment key={rowIndex}>
            <ResizablePanel 
              defaultSize={Math.min(100 / rows, 80)} 
              minSize={20} 
              maxSize={80}
            >
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {rowPanes.map((pane, colIndex) => (
                  <React.Fragment key={pane.id}>
                    <ResizablePanel
                      defaultSize={Math.min(pane.size, pane.maxSize || 70)}
                      minSize={pane.minSize || 15}
                      maxSize={pane.maxSize || 70}
                      onResize={(size) => handlePaneResize(pane.id, size)}
                    >
                      <Card className="h-full">
                        {renderPaneHeader(pane)}
                        <CardContent className="p-0 h-[calc(100%-60px)]">
                          {renderPaneContent(pane)}
                        </CardContent>
                      </Card>
                    </ResizablePanel>
                    
                    {colIndex < rowPanes.length - 1 && (
                      <ResizableHandle withHandle />
                    )}
                  </React.Fragment>
                ))}
              </ResizablePanelGroup>
            </ResizablePanel>
            
            {rowIndex < panesByRow.length - 1 && (
              <ResizableHandle withHandle />
            )}
          </React.Fragment>
        ))}
      </ResizablePanelGroup>
    )
  }

  return null
}
