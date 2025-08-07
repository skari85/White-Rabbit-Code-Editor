/**
 * White Rabbit Code Editor - Layout Controls
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Download,
  Upload,
  Trash2,
  Plus,
  ChevronDown
} from 'lucide-react'
import { LayoutConfig, PaneConfig } from './advanced-layout-system'
import { useLayoutPersistence } from '@/hooks/use-layout-persistence'
import { useAnalytics } from '@/hooks/use-analytics'

interface LayoutControlsProps {
  currentLayout: LayoutConfig
  defaultLayouts: LayoutConfig[]
  onLayoutChange: (layout: LayoutConfig) => void
  onToggleControls?: () => void
  visible?: boolean
  className?: string
}

export function LayoutControls({
  currentLayout,
  defaultLayouts,
  onLayoutChange,
  onToggleControls,
  visible = true,
  className
}: LayoutControlsProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [customLayoutName, setCustomLayoutName] = useState('')
  const [showPreferences, setShowPreferences] = useState(false)
  
  const {
    customLayouts,
    preferences,
    saveCustomLayout,
    deleteCustomLayout,
    updatePreferences,
    exportLayouts,
    importLayouts,
    clearAllData
  } = useLayoutPersistence()
  
  const { trackFeatureUsed } = useAnalytics()

  const allLayouts = [...defaultLayouts, ...customLayouts]

  // Handle layout selection
  const handleLayoutSelect = (layoutId: string) => {
    const layout = allLayouts.find(l => l.id === layoutId)
    if (layout) {
      onLayoutChange(layout)
      trackFeatureUsed('layout_switch', { layout: layout.name })
    }
  }

  // Handle save custom layout
  const handleSaveCustomLayout = () => {
    if (!customLayoutName.trim()) return
    
    const savedLayout = saveCustomLayout(currentLayout, customLayoutName.trim())
    if (savedLayout) {
      setCustomLayoutName('')
      setShowSaveDialog(false)
      trackFeatureUsed('custom_layout_saved', { name: savedLayout.name })
    }
  }

  // Handle delete custom layout
  const handleDeleteCustomLayout = (layoutId: string) => {
    deleteCustomLayout(layoutId)
    trackFeatureUsed('custom_layout_deleted')
  }

  // Handle reset to default
  const handleResetLayout = () => {
    const defaultLayout = defaultLayouts[0]
    if (defaultLayout) {
      onLayoutChange(defaultLayout)
      trackFeatureUsed('layout_reset')
    }
  }

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      importLayouts(file).then(success => {
        if (success) {
          trackFeatureUsed('layouts_imported')
        }
      })
    }
    event.target.value = '' // Reset input
  }

  // Get layout icon
  const getLayoutIcon = (mode: string) => {
    switch (mode) {
      case 'single': return <Square className="w-4 h-4" />
      case 'horizontal': return <Rows2 className="w-4 h-4" />
      case 'vertical': return <Columns2 className="w-4 h-4" />
      case 'grid': return <LayoutGrid className="w-4 h-4" />
      default: return <Settings className="w-4 h-4" />
    }
  }

  if (!visible) {
    return (
      <div className="absolute top-2 right-2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleControls}
          title="Show layout controls"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <Card className={`border-b border-border ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Layout Controls</CardTitle>
          <div className="flex items-center gap-1">
            <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Layout Preferences</DialogTitle>
                  <DialogDescription>
                    Customize your layout system behavior
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-save">Auto-save layouts</Label>
                    <Switch
                      id="auto-save"
                      checked={preferences.autoSave}
                      onCheckedChange={(checked) => updatePreferences({ autoSave: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="snap-grid">Snap to grid</Label>
                    <Switch
                      id="snap-grid"
                      checked={preferences.snapToGrid}
                      onCheckedChange={(checked) => updatePreferences({ snapToGrid: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-size">Minimum pane size (%)</Label>
                    <Input
                      id="min-size"
                      type="number"
                      min="10"
                      max="50"
                      value={preferences.minPaneSize}
                      onChange={(e) => updatePreferences({ minPaneSize: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-size">Maximum pane size (%)</Label>
                    <Input
                      id="max-size"
                      type="number"
                      min="50"
                      max="90"
                      value={preferences.maxPaneSize}
                      onChange={(e) => updatePreferences({ maxPaneSize: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {onToggleControls && (
              <Button variant="ghost" size="sm" onClick={onToggleControls}>
                <EyeOff className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layout Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                {getLayoutIcon(currentLayout.mode)}
                {currentLayout.name}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {/* Default Layouts */}
              {defaultLayouts.map((layout) => (
                <DropdownMenuItem
                  key={layout.id}
                  onClick={() => handleLayoutSelect(layout.id)}
                  className="flex items-center gap-2"
                >
                  {getLayoutIcon(layout.mode)}
                  {layout.name}
                  {currentLayout.id === layout.id && (
                    <Badge variant="secondary" className="ml-auto text-xs">Current</Badge>
                  )}
                </DropdownMenuItem>
              ))}
              
              {/* Custom Layouts */}
              {customLayouts.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {customLayouts.map((layout) => (
                    <DropdownMenuItem
                      key={layout.id}
                      onClick={() => handleLayoutSelect(layout.id)}
                      className="flex items-center gap-2 group"
                    >
                      {getLayoutIcon(layout.mode)}
                      {layout.name}
                      {currentLayout.id === layout.id && (
                        <Badge variant="secondary" className="ml-auto text-xs">Current</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCustomLayout(layout.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick Actions */}
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" title="Save current layout">
                <Save className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Custom Layout</DialogTitle>
                <DialogDescription>
                  Give your current layout configuration a name
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="layout-name">Layout Name</Label>
                  <Input
                    id="layout-name"
                    placeholder="My Custom Layout"
                    value={customLayoutName}
                    onChange={(e) => setCustomLayoutName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveCustomLayout()
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveCustomLayout}
                    disabled={!customLayoutName.trim()}
                  >
                    Save Layout
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetLayout}
            title="Reset to default layout"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Import/Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportLayouts}
            title="Export layouts"
          >
            <Download className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            title="Import layouts"
            onClick={() => document.getElementById('layout-import')?.click()}
          >
            <Upload className="w-4 h-4" />
          </Button>
          
          <input
            id="layout-import"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileImport}
          />

          {/* Layout Info */}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">
              {currentLayout.panes.filter(p => p.visible).length} panes
            </Badge>
            <Badge variant="outline">
              {currentLayout.mode}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
