'use client'

import { useState, useCallback, useEffect } from 'react'
import { SplitConfig, EditorPaneConfig } from '@/components/split-editor-layout'

export interface SplitLayoutState {
  splitConfig: SplitConfig
  setSplitConfig: (config: SplitConfig) => void
  splitHorizontal: (paneId: string) => void
  splitVertical: (paneId: string) => void
  closePane: (paneId: string) => void
  resetLayout: () => void
  saveSplitLayout: () => void
  loadSplitLayout: () => void
}

const STORAGE_KEY = 'whiterabbit-split-layout'

// Generate unique ID for new panes
const generatePaneId = () => {
  return `pane-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Default single pane configuration
const getDefaultSplitConfig = (files: any[], selectedFile: string | null): SplitConfig => ({
  id: 'root',
  direction: 'horizontal',
  panes: [
    {
      id: 'main-pane',
      files: files,
      selectedFile: selectedFile,
      size: 100,
      minSize: 20
    }
  ]
})

export function useSplitLayout(files: any[], selectedFile: string | null): SplitLayoutState {
  const [splitConfig, setSplitConfig] = useState<SplitConfig>(() => 
    getDefaultSplitConfig(files, selectedFile)
  )

  // Load split layout from localStorage on mount
  useEffect(() => {
    loadSplitLayout()
  }, [])

  // Save split layout to localStorage
  const saveSplitLayout = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(splitConfig))
    } catch (error) {
      console.warn('Failed to save split layout:', error)
    }
  }, [splitConfig])

  // Load split layout from localStorage
  const loadSplitLayout = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsedConfig = JSON.parse(saved)
        // Validate the config structure before using it
        if (parsedConfig && parsedConfig.id && parsedConfig.panes) {
          setSplitConfig(parsedConfig)
          return
        }
      }
    } catch (error) {
      console.warn('Failed to load split layout:', error)
    }
    // Fallback to default config
    setSplitConfig(getDefaultSplitConfig(files, selectedFile))
  }, [files, selectedFile])

  // Reset to default single pane layout
  const resetLayout = useCallback(() => {
    setSplitConfig(getDefaultSplitConfig(files, selectedFile))
  }, [files, selectedFile])

  // Handle splitting a pane horizontally (creates top/bottom split)
  const splitHorizontal = useCallback((paneId: string) => {
    setSplitConfig(prevConfig => {
      const newConfig = { ...prevConfig }
      
      // Find and split the pane
      const splitPane = (config: SplitConfig | EditorPaneConfig): SplitConfig | EditorPaneConfig => {
        if ('files' in config) {
          // This is an EditorPaneConfig
          if (config.id === paneId) {
            // Convert to split config
            return {
              id: config.id,
              direction: 'vertical',
              panes: [
                { ...config, id: generatePaneId(), size: 50 },
                {
                  id: generatePaneId(),
                  files: files,
                  selectedFile: selectedFile,
                  size: 50,
                  minSize: 20
                }
              ]
            }
          }
          return config
        } else {
          // This is a SplitConfig
          return {
            ...config,
            panes: config.panes.map(pane => splitPane(pane))
          }
        }
      }

      return splitPane(newConfig) as SplitConfig
    })
  }, [files, selectedFile])

  // Handle splitting a pane vertically (creates left/right split)
  const splitVertical = useCallback((paneId: string) => {
    setSplitConfig(prevConfig => {
      const newConfig = { ...prevConfig }
      
      // Find and split the pane
      const splitPane = (config: SplitConfig | EditorPaneConfig): SplitConfig | EditorPaneConfig => {
        if ('files' in config) {
          // This is an EditorPaneConfig
          if (config.id === paneId) {
            // Convert to split config
            return {
              id: config.id,
              direction: 'horizontal',
              panes: [
                { ...config, id: generatePaneId(), size: 50 },
                {
                  id: generatePaneId(),
                  files: files,
                  selectedFile: selectedFile,
                  size: 50,
                  minSize: 20
                }
              ]
            }
          }
          return config
        } else {
          // This is a SplitConfig
          return {
            ...config,
            panes: config.panes.map(pane => splitPane(pane))
          }
        }
      }

      return splitPane(newConfig) as SplitConfig
    })
  }, [files, selectedFile])

  // Handle closing a pane
  const closePane = useCallback((paneId: string) => {
    setSplitConfig(prevConfig => {
      // If there's only one pane, don't close it
      const countPanes = (config: SplitConfig | EditorPaneConfig): number => {
        if ('files' in config) return 1
        return config.panes.reduce((count, pane) => count + countPanes(pane), 0)
      }

      if (countPanes(prevConfig) <= 1) return prevConfig

      // Remove the pane
      const removePane = (config: SplitConfig): SplitConfig | EditorPaneConfig | null => {
        const newPanes = config.panes.filter(pane => {
          if ('files' in pane) {
            return pane.id !== paneId
          } else {
            const result = removePane(pane)
            return result !== null
          }
        }).map(pane => {
          if ('files' in pane) {
            return pane
          } else {
            const result = removePane(pane)
            return result || pane
          }
        })

        if (newPanes.length === 0) return null
        if (newPanes.length === 1) return newPanes[0]
        
        return { ...config, panes: newPanes }
      }

      const result = removePane(prevConfig)
      return result as SplitConfig || prevConfig
    })
  }, [])

  // Auto-save when split config changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveSplitLayout()
    }, 500) // Debounce saves

    return () => clearTimeout(timeoutId)
  }, [splitConfig, saveSplitLayout])

  return {
    splitConfig,
    setSplitConfig,
    splitHorizontal,
    splitVertical,
    closePane,
    resetLayout,
    saveSplitLayout,
    loadSplitLayout
  }
}
