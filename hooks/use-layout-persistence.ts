/**
 * White Rabbit Code Editor - Layout Persistence Hook
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { LayoutConfig, PaneConfig } from '@/components/advanced-layout-system'

const STORAGE_KEYS = {
  CURRENT_LAYOUT: 'whiterabbit-current-layout',
  CUSTOM_LAYOUTS: 'whiterabbit-custom-layouts',
  LAYOUT_PREFERENCES: 'whiterabbit-layout-preferences'
}

interface LayoutPreferences {
  autoSave: boolean
  showLayoutControls: boolean
  snapToGrid: boolean
  minPaneSize: number
  maxPaneSize: number
  defaultLayout: string
}

const DEFAULT_PREFERENCES: LayoutPreferences = {
  autoSave: true,
  showLayoutControls: true,
  snapToGrid: false,
  minPaneSize: 15,
  maxPaneSize: 85,
  defaultLayout: 'single'
}

export function useLayoutPersistence() {
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig | null>(null)
  const [customLayouts, setCustomLayouts] = useState<LayoutConfig[]>([])
  const [preferences, setPreferences] = useState<LayoutPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      // Load current layout
      const savedLayout = localStorage.getItem(STORAGE_KEYS.CURRENT_LAYOUT)
      if (savedLayout) {
        setCurrentLayout(JSON.parse(savedLayout))
      }

      // Load custom layouts
      const savedCustomLayouts = localStorage.getItem(STORAGE_KEYS.CUSTOM_LAYOUTS)
      if (savedCustomLayouts) {
        setCustomLayouts(JSON.parse(savedCustomLayouts))
      }

      // Load preferences
      const savedPreferences = localStorage.getItem(STORAGE_KEYS.LAYOUT_PREFERENCES)
      if (savedPreferences) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(savedPreferences) })
      }
    } catch (error) {
      console.warn('Failed to load layout data from localStorage:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save current layout
  const saveCurrentLayout = useCallback((layout: LayoutConfig) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_LAYOUT, JSON.stringify(layout))
      setCurrentLayout(layout)
    } catch (error) {
      console.error('Failed to save current layout:', error)
    }
  }, [])

  // Save custom layout
  const saveCustomLayout = useCallback((layout: LayoutConfig, name?: string) => {
    try {
      const customLayout: LayoutConfig = {
        ...layout,
        id: layout.id || `custom-${Date.now()}`,
        name: name || layout.name || `Custom Layout ${customLayouts.length + 1}`
      }

      const updatedCustomLayouts = [...customLayouts, customLayout]
      localStorage.setItem(STORAGE_KEYS.CUSTOM_LAYOUTS, JSON.stringify(updatedCustomLayouts))
      setCustomLayouts(updatedCustomLayouts)
      
      return customLayout
    } catch (error) {
      console.error('Failed to save custom layout:', error)
      return null
    }
  }, [customLayouts])

  // Delete custom layout
  const deleteCustomLayout = useCallback((layoutId: string) => {
    try {
      const updatedCustomLayouts = customLayouts.filter(layout => layout.id !== layoutId)
      localStorage.setItem(STORAGE_KEYS.CUSTOM_LAYOUTS, JSON.stringify(updatedCustomLayouts))
      setCustomLayouts(updatedCustomLayouts)
    } catch (error) {
      console.error('Failed to delete custom layout:', error)
    }
  }, [customLayouts])

  // Update layout preferences
  const updatePreferences = useCallback((newPreferences: Partial<LayoutPreferences>) => {
    try {
      const updatedPreferences = { ...preferences, ...newPreferences }
      localStorage.setItem(STORAGE_KEYS.LAYOUT_PREFERENCES, JSON.stringify(updatedPreferences))
      setPreferences(updatedPreferences)
    } catch (error) {
      console.error('Failed to update preferences:', error)
    }
  }, [preferences])

  // Export layouts (for backup/sharing)
  const exportLayouts = useCallback(() => {
    try {
      const exportData = {
        currentLayout,
        customLayouts,
        preferences,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
      
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `whiterabbit-layouts-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export layouts:', error)
    }
  }, [currentLayout, customLayouts, preferences])

  // Import layouts (from backup/sharing)
  const importLayouts = useCallback((file: File) => {
    return new Promise<boolean>((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string)
          
          if (importData.currentLayout) {
            saveCurrentLayout(importData.currentLayout)
          }
          
          if (importData.customLayouts && Array.isArray(importData.customLayouts)) {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_LAYOUTS, JSON.stringify(importData.customLayouts))
            setCustomLayouts(importData.customLayouts)
          }
          
          if (importData.preferences) {
            updatePreferences(importData.preferences)
          }
          
          resolve(true)
        } catch (error) {
          console.error('Failed to import layouts:', error)
          resolve(false)
        }
      }
      
      reader.onerror = () => resolve(false)
      reader.readAsText(file)
    })
  }, [saveCurrentLayout, updatePreferences])

  // Clear all data
  const clearAllData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_LAYOUT)
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_LAYOUTS)
      localStorage.removeItem(STORAGE_KEYS.LAYOUT_PREFERENCES)
      
      setCurrentLayout(null)
      setCustomLayouts([])
      setPreferences(DEFAULT_PREFERENCES)
    } catch (error) {
      console.error('Failed to clear layout data:', error)
    }
  }, [])

  // Auto-save layout changes
  const autoSaveLayout = useCallback((layout: LayoutConfig) => {
    if (preferences.autoSave) {
      saveCurrentLayout(layout)
    }
  }, [preferences.autoSave, saveCurrentLayout])

  // Get layout by ID (from default or custom layouts)
  const getLayoutById = useCallback((layoutId: string, defaultLayouts: LayoutConfig[] = []) => {
    return [...defaultLayouts, ...customLayouts].find(layout => layout.id === layoutId)
  }, [customLayouts])

  // Validate layout structure
  const validateLayout = useCallback((layout: LayoutConfig): boolean => {
    try {
      // Check required fields
      if (!layout.id || !layout.name || !layout.mode || !Array.isArray(layout.panes)) {
        return false
      }

      // Check panes
      for (const pane of layout.panes) {
        if (!pane.id || !pane.type || !pane.title || typeof pane.visible !== 'boolean') {
          return false
        }
        
        if (typeof pane.size !== 'number' || pane.size < 0 || pane.size > 100) {
          return false
        }
      }

      return true
    } catch (error) {
      return false
    }
  }, [])

  return {
    // State
    currentLayout,
    customLayouts,
    preferences,
    isLoading,

    // Layout management
    saveCurrentLayout,
    saveCustomLayout,
    deleteCustomLayout,
    autoSaveLayout,
    getLayoutById,
    validateLayout,

    // Preferences
    updatePreferences,

    // Import/Export
    exportLayouts,
    importLayouts,
    clearAllData,

    // Utilities
    hasCustomLayouts: customLayouts.length > 0,
    totalLayouts: customLayouts.length
  }
}
