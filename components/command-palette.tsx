/**
 * White Rabbit Code Editor - Command Palette Component
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  FileText,
  Edit,
  Search,
  Eye,
  Play,
  Bug,
  Terminal,
  GitBranch,
  Settings,
  Zap,
  Folder,
  Code,
  Target
} from 'lucide-react'
import { 
  KeyboardShortcutsService, 
  CommandPaletteItem,
  ShortcutCategory 
} from '@/lib/keyboard-shortcuts-service'
import { useAnalytics } from '@/hooks/use-analytics'

interface CommandPaletteProps {
  keyboardService: KeyboardShortcutsService
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

export function CommandPalette({ 
  keyboardService, 
  open, 
  onOpenChange, 
  className 
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentCommands, setRecentCommands] = useState<string[]>([])

  const { trackFeatureUsed } = useAnalytics()

  // Get filtered command palette items
  const filteredItems = useMemo(() => {
    const items = keyboardService.getCommandPaletteItems(query)
    
    // Sort by relevance
    return items.sort((a, b) => {
      // Prioritize recent commands
      const aRecent = recentCommands.indexOf(a.id)
      const bRecent = recentCommands.indexOf(b.id)
      
      if (aRecent !== -1 && bRecent !== -1) {
        return aRecent - bRecent
      }
      if (aRecent !== -1) return -1
      if (bRecent !== -1) return 1
      
      // Then by exact match
      const aExact = a.title.toLowerCase() === query.toLowerCase()
      const bExact = b.title.toLowerCase() === query.toLowerCase()
      
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      // Then by title match
      const aStartsWith = a.title.toLowerCase().startsWith(query.toLowerCase())
      const bStartsWith = b.title.toLowerCase().startsWith(query.toLowerCase())
      
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      
      // Finally alphabetically
      return a.title.localeCompare(b.title)
    })
  }, [query, keyboardService, recentCommands])

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = new Map<string, CommandPaletteItem[]>()
    
    for (const item of filteredItems) {
      if (!groups.has(item.category)) {
        groups.set(item.category, [])
      }
      groups.get(item.category)!.push(item)
    }
    
    return groups
  }, [filteredItems])

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredItems[selectedIndex]) {
            executeCommand(filteredItems[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onOpenChange(false)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex, filteredItems, onOpenChange])

  // Execute command
  const executeCommand = useCallback((item: CommandPaletteItem) => {
    keyboardService.executeCommand(item.command, item.args)
    
    // Add to recent commands
    setRecentCommands(prev => {
      const filtered = prev.filter(id => id !== item.id)
      return [item.id, ...filtered].slice(0, 10)
    })
    
    onOpenChange(false)
    trackFeatureUsed('command_palette_execute', { command: item.command })
  }, [keyboardService, onOpenChange, trackFeatureUsed])

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category as ShortcutCategory) {
      case 'file': return <FileText className="w-4 h-4" />
      case 'edit': return <Edit className="w-4 h-4" />
      case 'search': return <Search className="w-4 h-4" />
      case 'view': return <Eye className="w-4 h-4" />
      case 'go': return <Target className="w-4 h-4" />
      case 'run': return <Play className="w-4 h-4" />
      case 'debug': return <Bug className="w-4 h-4" />
      case 'terminal': return <Terminal className="w-4 h-4" />
      case 'git': return <GitBranch className="w-4 h-4" />
      case 'general': return <Settings className="w-4 h-4" />
      default: return <Code className="w-4 h-4" />
    }
  }

  // Format keybinding for display
  const formatKeybinding = (keybinding?: string) => {
    if (!keybinding) return null
    
    return keybinding
      .replace('Ctrl', '⌃')
      .replace('Cmd', '⌘')
      .replace('Alt', '⌥')
      .replace('Shift', '⇧')
      .replace('Enter', '↵')
      .replace('Escape', '⎋')
      .replace('Space', '␣')
  }

  // Get category display name
  const getCategoryDisplayName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <Command className="rounded-lg border-0 shadow-none">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Type a command or search..."
              value={query}
              onValueChange={setQuery}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
            />
          </div>
          
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No commands found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching for file, edit, or view commands
                </p>
              </div>
            </CommandEmpty>

            {Array.from(groupedItems.entries()).map(([category, items]) => (
              <CommandGroup 
                key={category} 
                heading={
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {getCategoryDisplayName(category)}
                  </div>
                }
              >
                {items.map((item, index) => {
                  const globalIndex = filteredItems.indexOf(item)
                  const isSelected = globalIndex === selectedIndex
                  
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => executeCommand(item)}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer ${
                        isSelected ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getCategoryIcon(item.category)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {item.title}
                          </div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {recentCommands.includes(item.id) && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            Recent
                          </Badge>
                        )}
                        {item.keybinding && (
                          <Badge variant="outline" className="text-xs font-mono px-1 py-0">
                            {formatKeybinding(item.keybinding)}
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}

            {/* Quick actions when no query */}
            {!query && (
              <CommandGroup heading="Quick Actions">
                <CommandItem
                  value="quick.newFile"
                  onSelect={() => {
                    keyboardService.executeCommand('file.new')
                    onOpenChange(false)
                  }}
                  className="flex items-center gap-3"
                >
                  <FileText className="w-4 h-4" />
                  <span>New File</span>
                  <Badge variant="outline" className="text-xs font-mono ml-auto">
                    {formatKeybinding('Ctrl+N')}
                  </Badge>
                </CommandItem>
                
                <CommandItem
                  value="quick.openFile"
                  onSelect={() => {
                    keyboardService.executeCommand('file.open')
                    onOpenChange(false)
                  }}
                  className="flex items-center gap-3"
                >
                  <Folder className="w-4 h-4" />
                  <span>Open File</span>
                  <Badge variant="outline" className="text-xs font-mono ml-auto">
                    {formatKeybinding('Ctrl+O')}
                  </Badge>
                </CommandItem>
                
                <CommandItem
                  value="quick.search"
                  onSelect={() => {
                    keyboardService.executeCommand('search.findInFiles')
                    onOpenChange(false)
                  }}
                  className="flex items-center gap-3"
                >
                  <Search className="w-4 h-4" />
                  <span>Search in Files</span>
                  <Badge variant="outline" className="text-xs font-mono ml-auto">
                    {formatKeybinding('Ctrl+Shift+F')}
                  </Badge>
                </CommandItem>
                
                <CommandItem
                  value="quick.terminal"
                  onSelect={() => {
                    keyboardService.executeCommand('view.toggleTerminal')
                    onOpenChange(false)
                  }}
                  className="flex items-center gap-3"
                >
                  <Terminal className="w-4 h-4" />
                  <span>Toggle Terminal</span>
                  <Badge variant="outline" className="text-xs font-mono ml-auto">
                    {formatKeybinding('Ctrl+`')}
                  </Badge>
                </CommandItem>
              </CommandGroup>
            )}

            {/* Recent commands when no query */}
            {!query && recentCommands.length > 0 && (
              <CommandGroup heading="Recently Used">
                {recentCommands.slice(0, 5).map(commandId => {
                  const item = filteredItems.find(i => i.id === commandId)
                  if (!item) return null
                  
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => executeCommand(item)}
                      className="flex items-center gap-3"
                    >
                      {getCategoryIcon(item.category)}
                      <span>{item.title}</span>
                      {item.keybinding && (
                        <Badge variant="outline" className="text-xs font-mono ml-auto">
                          {formatKeybinding(item.keybinding)}
                        </Badge>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs px-1 py-0">↵</Badge>
              <span>to select</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs px-1 py-0">↑↓</Badge>
              <span>to navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs px-1 py-0">⎋</Badge>
              <span>to close</span>
            </div>
          </div>
          <div className="text-xs">
            {filteredItems.length} command{filteredItems.length !== 1 ? 's' : ''}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
