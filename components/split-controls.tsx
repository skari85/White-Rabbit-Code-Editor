'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  SplitSquareHorizontal, 
  SplitSquareVertical, 
  Square,
  RotateCcw,
  Save
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface SplitControlsProps {
  onSplitHorizontal?: () => void
  onSplitVertical?: () => void
  onResetLayout?: () => void
  onSaveLayout?: () => void
  className?: string
  showInToolbar?: boolean
}

export default function SplitControls({
  onSplitHorizontal,
  onSplitVertical,
  onResetLayout,
  onSaveLayout,
  className = '',
  showInToolbar = false
}: SplitControlsProps) {
  if (showInToolbar) {
    // Compact toolbar version
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSplitVertical}
                className="h-8 w-8 p-0"
              >
                <SplitSquareVertical className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Split Right</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSplitHorizontal}
                className="h-8 w-8 p-0"
              >
                <SplitSquareHorizontal className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Split Down</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Square className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onResetLayout}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Layout
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSaveLayout}>
              <Save className="w-4 h-4 mr-2" />
              Save Layout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // Full controls version
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onSplitVertical}
          className="flex items-center gap-2"
        >
          <SplitSquareVertical className="w-4 h-4" />
          Split Right
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onSplitHorizontal}
          className="flex items-center gap-2"
        >
          <SplitSquareHorizontal className="w-4 h-4" />
          Split Down
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetLayout}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onSaveLayout}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Layout
        </Button>
      </div>
    </div>
  )
}

// Keyboard shortcut handler hook
export function useSplitKeyboardShortcuts(
  onSplitHorizontal?: () => void,
  onSplitVertical?: () => void,
  onResetLayout?: () => void
) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd/Ctrl key combinations
      const isModifierPressed = event.metaKey || event.ctrlKey

      if (!isModifierPressed) return

      switch (event.key) {
        case '\\':
          // Cmd/Ctrl + \ for vertical split (VS Code style)
          event.preventDefault()
          onSplitVertical?.()
          break
        case '-':
          // Cmd/Ctrl + - for horizontal split
          if (event.shiftKey) {
            event.preventDefault()
            onSplitHorizontal?.()
          }
          break
        case '0':
          // Cmd/Ctrl + 0 for reset layout
          if (event.shiftKey) {
            event.preventDefault()
            onResetLayout?.()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSplitHorizontal, onSplitVertical, onResetLayout])
}
