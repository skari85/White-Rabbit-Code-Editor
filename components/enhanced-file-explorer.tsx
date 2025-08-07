/**
 * White Rabbit Code Editor - Enhanced File Explorer Component
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FolderTree,
  File,
  Folder,
  FolderOpen,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Copy,
  Scissors,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  FileText,
  Image,
  Code,
  Archive,
  Settings
} from 'lucide-react'
import { 
  AdvancedFileManager, 
  FileSystemEntry, 
  FileOperation,
  FileWatchEvent,
  FileTemplate
} from '@/lib/advanced-file-manager'
import { useAnalytics } from '@/hooks/use-analytics'

interface EnhancedFileExplorerProps {
  fileManager: AdvancedFileManager
  onFileSelect?: (file: FileSystemEntry) => void
  onFileOpen?: (file: FileSystemEntry) => void
  className?: string
}

export function EnhancedFileExplorer({ 
  fileManager, 
  onFileSelect,
  onFileOpen,
  className 
}: EnhancedFileExplorerProps) {
  const [rootPath, setRootPath] = useState('/')
  const [currentPath, setCurrentPath] = useState('/')
  const [entries, setEntries] = useState<FileSystemEntry[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']))
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [showHidden, setShowHidden] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [operations, setOperations] = useState<FileOperation[]>([])
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [templates, setTemplates] = useState<FileTemplate[]>([])
  const [clipboard, setClipboard] = useState<{ operation: 'copy' | 'cut'; entries: FileSystemEntry[] } | null>(null)
  const [draggedEntry, setDraggedEntry] = useState<FileSystemEntry | null>(null)

  const { trackFeatureUsed } = useAnalytics()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load initial data
  useEffect(() => {
    loadDirectory(currentPath)
    setTemplates(fileManager.getFileTemplates())
    setOperations(fileManager.getRecentOperations())

    // Set up file system watcher
    const watcherId = fileManager.watchPath('/', true, handleFileSystemChange)

    // Set up operation updates
    fileManager['onOperationUpdate'] = handleOperationUpdate

    return () => {
      fileManager.unwatchPath(watcherId)
      fileManager['onOperationUpdate'] = undefined
    }
  }, [fileManager, currentPath])

  // Load directory contents
  const loadDirectory = async (path: string) => {
    try {
      const contents = await fileManager.getDirectoryContents(path)
      const filteredContents = showHidden ? contents : contents.filter(entry => !entry.isHidden)
      setEntries(filteredContents)
    } catch (error) {
      console.error('Failed to load directory:', error)
      setEntries([])
    }
  }

  // Handle file system changes
  const handleFileSystemChange = (event: FileWatchEvent) => {
    console.log('File system change:', event)
    loadDirectory(currentPath)
    setOperations(fileManager.getRecentOperations())
  }

  // Handle operation updates
  const handleOperationUpdate = (operation: FileOperation) => {
    setOperations(prev => {
      const updated = prev.filter(op => op.id !== operation.id)
      return [operation, ...updated].slice(0, 10)
    })
  }

  // Toggle directory expansion
  const toggleDirectory = async (path: string) => {
    const newExpanded = new Set(expandedDirs)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedDirs(newExpanded)
  }

  // Handle entry selection
  const handleEntrySelect = (entry: FileSystemEntry, multiSelect: boolean = false) => {
    if (multiSelect) {
      const newSelected = new Set(selectedEntries)
      if (newSelected.has(entry.path)) {
        newSelected.delete(entry.path)
      } else {
        newSelected.add(entry.path)
      }
      setSelectedEntries(newSelected)
    } else {
      setSelectedEntries(new Set([entry.path]))
    }
    
    onFileSelect?.(entry)
  }

  // Handle entry double-click
  const handleEntryDoubleClick = (entry: FileSystemEntry) => {
    if (entry.type === 'directory') {
      setCurrentPath(entry.path)
      loadDirectory(entry.path)
    } else {
      onFileOpen?.(entry)
    }
  }

  // Create new file
  const handleCreateFile = async () => {
    if (!newItemName.trim()) return

    try {
      const filePath = `${currentPath}/${newItemName}`
      await fileManager.createFile(filePath, '', selectedTemplate || undefined)
      setShowNewFileDialog(false)
      setNewItemName('')
      setSelectedTemplate('')
      trackFeatureUsed('file_create')
    } catch (error) {
      console.error('Failed to create file:', error)
    }
  }

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newItemName.trim()) return

    try {
      const folderPath = `${currentPath}/${newItemName}`
      await fileManager.createDirectory(folderPath)
      setShowNewFolderDialog(false)
      setNewItemName('')
      trackFeatureUsed('folder_create')
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  // Rename entry
  const handleRename = async (entry: FileSystemEntry, newName: string) => {
    try {
      const newPath = `${entry.path.substring(0, entry.path.lastIndexOf('/'))}/${newName}`
      await fileManager.rename(entry.path, newPath)
      trackFeatureUsed('file_rename')
    } catch (error) {
      console.error('Failed to rename:', error)
    }
  }

  // Delete entries
  const handleDelete = async (entries: FileSystemEntry[]) => {
    try {
      for (const entry of entries) {
        await fileManager.delete(entry.path)
      }
      setSelectedEntries(new Set())
      trackFeatureUsed('file_delete', { count: entries.length })
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  // Copy entries
  const handleCopy = (entries: FileSystemEntry[]) => {
    fileManager.copyToClipboard(entries)
    setClipboard(fileManager.getClipboardContents())
    trackFeatureUsed('file_copy', { count: entries.length })
  }

  // Cut entries
  const handleCut = (entries: FileSystemEntry[]) => {
    fileManager.cutToClipboard(entries)
    setClipboard(fileManager.getClipboardContents())
    trackFeatureUsed('file_cut', { count: entries.length })
  }

  // Paste entries
  const handlePaste = async () => {
    if (!clipboard) return

    try {
      await fileManager.pasteFromClipboard(currentPath)
      setClipboard(fileManager.getClipboardContents())
      trackFeatureUsed('file_paste', { count: clipboard.entries.length })
    } catch (error) {
      console.error('Failed to paste:', error)
    }
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, entry: FileSystemEntry) => {
    setDraggedEntry(entry)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Handle drop
  const handleDrop = async (e: React.DragEvent, targetEntry: FileSystemEntry) => {
    e.preventDefault()
    
    if (!draggedEntry || targetEntry.type !== 'directory') return

    try {
      const newPath = `${targetEntry.path}/${draggedEntry.name}`
      await fileManager.move(draggedEntry.path, newPath)
      setDraggedEntry(null)
      trackFeatureUsed('file_drag_drop')
    } catch (error) {
      console.error('Failed to move file:', error)
    }
  }

  // Get file icon
  const getFileIcon = (entry: FileSystemEntry) => {
    if (entry.type === 'directory') {
      return expandedDirs.has(entry.path) ? 
        <FolderOpen className="w-4 h-4 text-blue-500" /> : 
        <Folder className="w-4 h-4 text-blue-500" />
    }

    const extension = entry.extension?.toLowerCase()
    const iconMap: Record<string, React.ReactNode> = {
      'js': <Code className="w-4 h-4 text-yellow-500" />,
      'ts': <Code className="w-4 h-4 text-blue-500" />,
      'jsx': <Code className="w-4 h-4 text-cyan-500" />,
      'tsx': <Code className="w-4 h-4 text-cyan-600" />,
      'json': <FileText className="w-4 h-4 text-green-500" />,
      'md': <FileText className="w-4 h-4 text-gray-500" />,
      'png': <Image className="w-4 h-4 text-purple-500" />,
      'jpg': <Image className="w-4 h-4 text-purple-500" />,
      'jpeg': <Image className="w-4 h-4 text-purple-500" />,
      'gif': <Image className="w-4 h-4 text-purple-500" />,
      'zip': <Archive className="w-4 h-4 text-orange-500" />,
      'tar': <Archive className="w-4 h-4 text-orange-500" />,
      'gz': <Archive className="w-4 h-4 text-orange-500" />
    }

    return iconMap[extension || ''] || <File className="w-4 h-4 text-gray-500" />
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Filter entries based on search
  const filteredEntries = entries.filter(entry => 
    !searchQuery || entry.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedEntriesArray = Array.from(selectedEntries).map(path => 
    entries.find(entry => entry.path === path)
  ).filter(Boolean) as FileSystemEntry[]

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FolderTree className="w-4 h-4" />
            Explorer
            {selectedEntries.size > 0 && (
              <Badge variant="outline" className="text-xs">
                {selectedEntries.size} selected
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowNewFileDialog(true)}>
              <Plus className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowHidden(!showHidden)}>
              {showHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => loadDirectory(currentPath)}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Current Path */}
        <div className="text-xs text-muted-foreground font-mono">
          {currentPath}
        </div>

        {/* File List */}
        <ScrollArea className="h-64">
          <div className="space-y-1">
            {filteredEntries.map((entry) => (
              <ContextMenu key={entry.path}>
                <ContextMenuTrigger>
                  <div
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted ${
                      selectedEntries.has(entry.path) ? 'bg-accent' : ''
                    }`}
                    onClick={(e) => handleEntrySelect(entry, e.ctrlKey || e.metaKey)}
                    onDoubleClick={() => handleEntryDoubleClick(entry)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, entry)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, entry)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {entry.type === 'directory' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-4 w-4"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleDirectory(entry.path)
                          }}
                        >
                          {expandedDirs.has(entry.path) ? 
                            <ChevronDown className="w-3 h-3" /> : 
                            <ChevronRight className="w-3 h-3" />
                          }
                        </Button>
                      )}
                      {getFileIcon(entry)}
                      <span className="text-sm truncate">{entry.name}</span>
                      {entry.isHidden && (
                        <Badge variant="secondary" className="text-xs">
                          Hidden
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {entry.type === 'file' && entry.size && (
                        <span>{formatFileSize(entry.size)}</span>
                      )}
                      <span>{formatDate(entry.lastModified)}</span>
                    </div>
                  </div>
                </ContextMenuTrigger>
                
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleEntryDoubleClick(entry)}>
                    {entry.type === 'directory' ? 'Open Folder' : 'Open File'}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => handleCopy([entry])}>
                    <Copy className="w-3 h-3 mr-2" />
                    Copy
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleCut([entry])}>
                    <Scissors className="w-3 h-3 mr-2" />
                    Cut
                  </ContextMenuItem>
                  {clipboard && (
                    <ContextMenuItem onClick={handlePaste}>
                      <Copy className="w-3 h-3 mr-2" />
                      Paste
                    </ContextMenuItem>
                  )}
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => {
                    const newName = prompt('Enter new name:', entry.name)
                    if (newName && newName !== entry.name) {
                      handleRename(entry, newName)
                    }
                  }}>
                    <Edit className="w-3 h-3 mr-2" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem 
                    className="text-red-600"
                    onClick={() => handleDelete([entry])}
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </ScrollArea>

        {/* Operations Status */}
        {operations.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="text-xs font-medium">Recent Operations</div>
            <div className="space-y-1">
              {operations.slice(0, 3).map((op) => (
                <div key={op.id} className="flex items-center justify-between text-xs">
                  <span className="truncate">
                    {op.type} {op.source.split('/').pop()}
                  </span>
                  <Badge 
                    variant={op.status === 'completed' ? 'default' : 
                            op.status === 'failed' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {op.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New File Dialog */}
        <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New File</DialogTitle>
              <DialogDescription>
                Create a new file in the current directory
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">File Name</label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="filename.ext"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Template (Optional)</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No template</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFile} disabled={!newItemName.trim()}>
                  Create File
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Folder Dialog */}
        <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Create a new folder in the current directory
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Folder Name</label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="folder-name"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder} disabled={!newItemName.trim()}>
                  Create Folder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNewFileDialog(true)}>
            <Plus className="w-3 h-3 mr-2" />
            New File
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowNewFolderDialog(true)}>
            <Folder className="w-3 h-3 mr-2" />
            New Folder
          </Button>
          {selectedEntriesArray.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDelete(selectedEntriesArray)}
              className="text-red-600"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
