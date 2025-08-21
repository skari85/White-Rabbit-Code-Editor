'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ScreenSize {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLargeDesktop: boolean
}

export interface ResponsiveLayoutConfig {
  screenSize: ScreenSize
  shouldCollapseSidebar: boolean
  shouldDisableSplits: boolean
  maxSplitPanes: number
  sidebarDefaultSize: number
  sidebarMinSize: number
  sidebarMaxSize: number
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  largeDesktop: 1920
}

export function useResponsiveLayout(): ResponsiveLayoutConfig {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLargeDesktop: false
  })

  const updateScreenSize = useCallback(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    
    const isMobile = width < BREAKPOINTS.mobile
    const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet
    const isDesktop = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.largeDesktop
    const isLargeDesktop = width >= BREAKPOINTS.largeDesktop

    setScreenSize({
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      isLargeDesktop
    })
  }, [])

  useEffect(() => {
    // Initial size calculation
    updateScreenSize()

    // Add resize listener
    window.addEventListener('resize', updateScreenSize)
    
    // Cleanup
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [updateScreenSize])

  // Calculate responsive layout configuration
  const shouldCollapseSidebar = screenSize.isMobile
  const shouldDisableSplits = screenSize.isMobile || screenSize.isTablet
  
  const maxSplitPanes = screenSize.isMobile ? 1 : 
                       screenSize.isTablet ? 2 : 
                       screenSize.isDesktop ? 3 : 4

  const sidebarDefaultSize = screenSize.isMobile ? 100 : // Full width on mobile
                            screenSize.isTablet ? 30 :
                            screenSize.isDesktop ? 25 : 20

  const sidebarMinSize = screenSize.isMobile ? 100 :
                        screenSize.isTablet ? 20 :
                        screenSize.isDesktop ? 20 : 15

  const sidebarMaxSize = screenSize.isMobile ? 100 :
                        screenSize.isTablet ? 45 :
                        screenSize.isDesktop ? 40 : 35

  return {
    screenSize,
    shouldCollapseSidebar,
    shouldDisableSplits,
    maxSplitPanes,
    sidebarDefaultSize,
    sidebarMinSize,
    sidebarMaxSize
  }
}

// Hook for managing mobile-specific layout behavior
export function useMobileLayout() {
  const { screenSize, shouldCollapseSidebar } = useResponsiveLayout()
  const [showSidebar, setShowSidebar] = useState(!shouldCollapseSidebar)
  const [activeView, setActiveView] = useState<'sidebar' | 'editor'>('editor')

  useEffect(() => {
    if (shouldCollapseSidebar) {
      setShowSidebar(false)
      setActiveView('editor')
    } else {
      setShowSidebar(true)
    }
  }, [shouldCollapseSidebar])

  const toggleSidebar = useCallback(() => {
    if (shouldCollapseSidebar) {
      setActiveView(prev => prev === 'sidebar' ? 'editor' : 'sidebar')
    } else {
      setShowSidebar(prev => !prev)
    }
  }, [shouldCollapseSidebar])

  return {
    screenSize,
    shouldCollapseSidebar,
    showSidebar,
    activeView,
    toggleSidebar,
    setActiveView
  }
}

// Utility function to get responsive panel sizes
export function getResponsivePanelSizes(screenSize: ScreenSize) {
  if (screenSize.isMobile) {
    return {
      sidebar: { default: 100, min: 100, max: 100 },
      editor: { default: 100, min: 100, max: 100 }
    }
  }
  
  if (screenSize.isTablet) {
    return {
      sidebar: { default: 30, min: 20, max: 45 },
      editor: { default: 70, min: 55, max: 80 }
    }
  }
  
  if (screenSize.isDesktop) {
    return {
      sidebar: { default: 25, min: 20, max: 40 },
      editor: { default: 75, min: 60, max: 80 }
    }
  }
  
  // Large desktop
  return {
    sidebar: { default: 20, min: 15, max: 35 },
    editor: { default: 80, min: 65, max: 85 }
  }
}
