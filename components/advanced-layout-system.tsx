/**
 * White Rabbit Code Editor - Advanced Layout System
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
import { Badge } from '@/components/ui/badge'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
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
  Maximize2,
  Minimize2
} from 'lucide-react'
import { useAnalytics } from '@/hooks/use-analytics'

export type LayoutMode = 'single' | 'horizontal' | 'vertical' | 'grid' | 'custom'
export type PaneType = 'code' | 'ai-chat' | 'preview' | 'terminal' | 'files' | 'documentation' | 'marketplace'

export interface PaneConfig {
  id: string
  type: PaneType
  title: string
  visible: boolean
  size: number // percentage
  minSize?: number
  maxSize?: number
  position: { row: number; col: number }
}

export interface LayoutConfig {
  id: string
  name: string
  mode: LayoutMode
  panes: PaneConfig[]
  direction?: 'horizontal' | 'vertical'
  gridRows?: number
  gridCols?: number
}

interface AdvancedLayoutSystemProps {
  children: React.ReactNode
  onLayoutChange?: (layout: LayoutConfig) => void
  onPaneContentChange?: (paneId: string, content: PaneType) => void
  className?: string
}

// Predefined layouts
const DEFAULT_LAYOUTS: LayoutConfig[] = [
  {
    id: 'single',
    name: 'Single Pane',
    mode: 'single',
    panes: [
      { id: 'main', type: 'code', title: 'Code Editor', visible: true, size: 100, position: { row: 0, col: 0 } }
    ]
  },
  {
    id: 'horizontal',
    name: 'Horizontal Split',
    mode: 'horizontal',
    direction: 'vertical',
    panes: [
      { id: 'top', type: 'code', title: 'Code Editor', visible: true, size: 70, minSize: 30, position: { row: 0, col: 0 } },
      { id: 'bottom', type: 'terminal', title: 'Terminal', visible: true, size: 30, minSize: 20, position: { row: 1, col: 0 } }
    ]
  },
  {
    id: 'vertical',
    name: 'Vertical Split',
    mode: 'vertical',
    direction: 'horizontal',
    panes: [
      { id: 'left', type: 'code', title: 'Code Editor', visible: true, size: 60, minSize: 30, position: { row: 0, col: 0 } },
      { id: 'right', type: 'ai-chat', title: 'AI Assistant', visible: true, size: 40, minSize: 25, position: { row: 0, col: 1 } }
    ]
  },
  {
    id: 'grid',
    name: 'Grid Layout',
    mode: 'grid',
    gridRows: 2,
    gridCols: 2,
    panes: [
      { id: 'tl', type: 'files', title: 'File Explorer', visible: true, size: 25, position: { row: 0, col: 0 } },
      { id: 'tr', type: 'code', title: 'Code Editor', visible: true, size: 50, position: { row: 0, col: 1 } },
      { id: 'bl', type: 'terminal', title: 'Terminal', visible: true, size: 25, position: { row: 1, col: 0 } },
      { id: 'br', type: 'preview', title: 'Live Preview', visible: true, size: 25, position: { row: 1, col: 1 } }
    ]
  }
]

export function AdvancedLayoutSystem({ 
  children, 
  onLayoutChange, 
  onPaneContentChange,
  className 
}: AdvancedLayoutSystemProps) {
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig>(DEFAULT_LAYOUTS[0])
  const [customLayouts, setCustomLayouts] = useState<LayoutConfig[]>([])
  const [showLayoutControls, setShowLayoutControls] = useState(true)
  const { trackFeatureUsed } = useAnalytics()

  // Load saved layouts from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('whiterabbit-layout')
    const savedCustomLayouts = localStorage.getItem('whiterabbit-custom-layouts')
    
    if (savedLayout) {
      try {
        setCurrentLayout(JSON.parse(savedLayout))
      } catch (error) {
        console.warn('Failed to load saved layout:', error)
      }
    }
    
    if (savedCustomLayouts) {
      try {
        setCustomLayouts(JSON.parse(savedCustomLayouts))
      } catch (error) {
        console.warn('Failed to load custom layouts:', error)
      }
    }
  }, [])

  // Save layout changes
  const saveLayout = useCallback((layout: LayoutConfig) => {
    localStorage.setItem('whiterabbit-layout', JSON.stringify(layout))
    setCurrentLayout(layout)
    onLayoutChange?.(layout)
    trackFeatureUsed('layout_change', { layout: layout.name })
  }, [onLayoutChange, trackFeatureUsed])

  // Handle layout mode change
  const handleLayoutModeChange = (layoutId: string) => {
    const layout = [...DEFAULT_LAYOUTS, ...customLayouts].find(l => l.id === layoutId)
    if (layout) {
      saveLayout(layout)
    }
  }

  // Toggle pane visibility
  const togglePaneVisibility = (paneId: string) => {
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
    onPaneContentChange?.(paneId, newType)
  }

  // Reset to default layout
  const resetLayout = () => {
    saveLayout(DEFAULT_LAYOUTS[0])
    trackFeatureUsed('layout_reset')
  }

  // Save current layout as custom
  const saveCustomLayout = () => {
    const customLayout: LayoutConfig = {
      ...currentLayout,
      id: `custom-${Date.now()}`,
      name: `Custom Layout ${customLayouts.length + 1}`
    }
    
    const updatedCustomLayouts = [...customLayouts, customLayout]
    setCustomLayouts(updatedCustomLayouts)
    localStorage.setItem('whiterabbit-custom-layouts', JSON.stringify(updatedCustomLayouts))
    trackFeatureUsed('custom_layout_saved')
  }

  const getPaneTitle = (type: PaneType): string => {
    const titles = {
      'code': 'Code Editor',
      'ai-chat': 'AI Assistant',
      'preview': 'Live Preview',
      'terminal': 'Terminal',
      'files': 'File Explorer',
      'documentation': 'Documentation',
      'marketplace': 'Marketplace'
    }
    return titles[type] || 'Unknown'
  }

  const getPaneIcon = (type: PaneType) => {
    const icons = {
      'code': '📝',
      'ai-chat': '🤖',
      'preview': '👁️',
      'terminal': '💻',
      'files': '📁',
      'documentation': '📚',
      'marketplace': '🏪'
    }
    return icons[type] || '❓'
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Layout Controls */}
      {showLayoutControls && (
        <div className="flex items-center justify-between p-2 bg-background border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Layout:</span>
            
            {/* Predefined Layouts */}
            {DEFAULT_LAYOUTS.map((layout) => (
              <Button
                key={layout.id}
                variant={currentLayout.id === layout.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLayoutModeChange(layout.id)}
                className="text-xs"
              >
                {layout.id === 'single' && <Square className="w-3 h-3 mr-1" />}
                {layout.id === 'horizontal' && <Rows2 className="w-3 h-3 mr-1" />}
                {layout.id === 'vertical' && <Columns2 className="w-3 h-3 mr-1" />}
                {layout.id === 'grid' && <LayoutGrid className="w-3 h-3 mr-1" />}
                {layout.name}
              </Button>
            ))}

            {/* Custom Layouts */}
            {customLayouts.map((layout) => (
              <Button
                key={layout.id}
                variant={currentLayout.id === layout.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLayoutModeChange(layout.id)}
                className="text-xs"
              >
                <Settings className="w-3 h-3 mr-1" />
                {layout.name}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={saveCustomLayout}
              title="Save current layout"
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetLayout}
              title="Reset to default"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLayoutControls(false)}
              title="Hide controls"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Show Controls Button (when hidden) */}
      {!showLayoutControls && (
        <div className="absolute top-2 right-2 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLayoutControls(true)}
            title="Show layout controls"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Layout Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

// Hook for using the layout system
export function useAdvancedLayout() {
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig>(DEFAULT_LAYOUTS[0])
  
  const updateLayout = useCallback((layout: LayoutConfig) => {
    setCurrentLayout(layout)
    localStorage.setItem('whiterabbit-layout', JSON.stringify(layout))
  }, [])

  return {
    currentLayout,
    updateLayout,
    defaultLayouts: DEFAULT_LAYOUTS,
    isGridLayout: currentLayout.mode === 'grid',
    isSplitLayout: currentLayout.mode === 'horizontal' || currentLayout.mode === 'vertical',
    visiblePanes: currentLayout.panes.filter(pane => pane.visible)
  }
}
