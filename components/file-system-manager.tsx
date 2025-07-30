'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import MonacoEditor, { MonacoEditorRef, MonacoEditorLoading } from '@/components/monaco-editor';
import { useSimpleLocalStorage } from '@/hooks/use-simple-local-storage';
import { PersonalityMode } from '@/lib/personality-system';
import { getLanguageFromFileName } from '@/lib/monaco-config';
import { 
  FileText, 
  Plus, 
  X, 
  Save, 
  Download, 
  Upload, 
  FolderOpen, 
  Search,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit3,
  FileCode,
  Folder,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileItem {
  id: string;
  name: string;
  content: string;
  language?: string;
  isModified: boolean;
  isDirectory: boolean;
  parentId?: string;
  children?: string[];
  lastModified: Date;
  size: number;
}

export interface FileSystemManagerProps {
  personality?: PersonalityMode;
  onFileChange?: (fileId: string, content: string) => void;
  onFileSelect?: (fileId: string) => void;
  className?: string;
}

const FileSystemManager: React.FC<FileSystemManagerProps> = ({
  personality = 'hex',
  onFileChange,
  onFileSelect,
  className
}) => {
  const [files, setFiles] = useSimpleLocalStorage<Record<string, FileItem>>('file-system', {});
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  const editorRef = useRef<MonacoEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get active file
  const activeFile = activeFileId ? files[activeFileId] : null;

  // Get root files and folders
  const rootItems = Object.values(files).filter(file => !file.parentId);

  // Filter files based on search query
  const filteredFiles = Object.values(files).filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create new file
  const createFile = useCallback((name: string, parentId?: string) => {
    const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newFile: FileItem = {
      id,
      name,
      content: '',
      language: getLanguageFromFileName(name),
      isModified: false,
      isDirectory: false,
      parentId,
      lastModified: new Date(),
      size: 0
    };

    setFiles((prev: Record<string, FileItem>) => {
      const updated = { ...prev, [id]: newFile };
      
      // Update parent folder if exists
      if (parentId && updated[parentId]) {
        updated[parentId] = {
          ...updated[parentId],
          children: [...(updated[parentId].children || []), id]
        };
      }
      
      return updated;
    });

    // Open the new file
    openFile(id);
    return id;
  }, [setFiles]);

  // Create new folder
  const createFolder = useCallback((name: string, parentId?: string) => {
    const id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newFolder: FileItem = {
      id,
      name,
      content: '',
      isModified: false,
      isDirectory: true,
      parentId,
      children: [],
      lastModified: new Date(),
      size: 0
    };

    setFiles((prev: Record<string, FileItem>) => {
      const updated = { ...prev, [id]: newFolder };
      
      // Update parent folder if exists
      if (parentId && updated[parentId]) {
        updated[parentId] = {
          ...updated[parentId],
          children: [...(updated[parentId].children || []), id]
        };
      }
      
      return updated;
    });

    // Expand the new folder
    setExpandedFolders(prev => new Set([...prev, id]));
    return id;
  }, [setFiles]);

  // Open file in tab
  const openFile = useCallback((fileId: string) => {
    if (files[fileId]?.isDirectory) return;
    
    setActiveFileId(fileId);
    setOpenTabs(prev => prev.includes(fileId) ? prev : [...prev, fileId]);
    onFileSelect?.(fileId);
  }, [files, onFileSelect]);

  // Close file tab
  const closeFile = useCallback((fileId: string) => {
    setOpenTabs(prev => prev.filter(id => id !== fileId));
    
    if (activeFileId === fileId) {
      const remainingTabs = openTabs.filter(id => id !== fileId);
      setActiveFileId(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1] : null);
    }
  }, [activeFileId, openTabs]);

  // Update file content
  const updateFileContent = useCallback((fileId: string, content: string) => {
    setFiles((prev: Record<string, FileItem>) => {
      const file = prev[fileId];
      if (!file) return prev;

      const updated = {
        ...prev,
        [fileId]: {
          ...file,
          content,
          isModified: content !== file.content,
          lastModified: new Date(),
          size: content.length
        }
      };

      return updated;
    });

    onFileChange?.(fileId, content);
  }, [setFiles, onFileChange]);

  // Delete file or folder
  const deleteItem = useCallback((itemId: string) => {
    setFiles((prev: Record<string, FileItem>) => {
      const updated = { ...prev };
      const item = updated[itemId];
      
      if (!item) return prev;

      // Remove from parent's children
      if (item.parentId && updated[item.parentId]) {
        updated[item.parentId] = {
          ...updated[item.parentId],
          children: updated[item.parentId].children?.filter(id => id !== itemId) || []
        };
      }

      // If it's a folder, delete all children recursively
      if (item.isDirectory && item.children) {
        const deleteRecursively = (id: string) => {
          const child = updated[id];
          if (child?.isDirectory && child.children) {
            child.children.forEach(deleteRecursively);
          }
          delete updated[id];
        };
        
        item.children.forEach(deleteRecursively);
      }

      delete updated[itemId];
      return updated;
    });

    // Close tab if file was open
    closeFile(itemId);
  }, [setFiles, closeFile]);

  // Rename file or folder
  const renameItem = useCallback((itemId: string, newName: string) => {
    setFiles((prev: Record<string, FileItem>) => {
      const item = prev[itemId];
      if (!item) return prev;

      return {
        ...prev,
        [itemId]: {
          ...item,
          name: newName,
          language: item.isDirectory ? undefined : getLanguageFromFileName(newName),
          lastModified: new Date()
        }
      };
    });
  }, [setFiles]);

  // Toggle folder expansion
  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      createFile(file.name, selectedFolderId || undefined);
      
      // Update the content after creation
      setTimeout(() => {
        const fileId = Object.values(files).find(f => f.name === file.name)?.id;
        if (fileId) {
          updateFileContent(fileId, content);
        }
      }, 100);
    };
    reader.readAsText(file);
  }, [createFile, selectedFolderId, files, updateFileContent]);

  // Download file
  const downloadFile = useCallback((fileId: string) => {
    const file = files[fileId];
    if (!file || file.isDirectory) return;

    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [files]);

  // Render file tree item
  const renderFileTreeItem = useCallback((item: FileItem, depth = 0) => {
    const isExpanded = expandedFolders.has(item.id);
    const isActive = activeFileId === item.id;

    return (
      <div key={item.id} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1 hover:bg-gray-800 cursor-pointer text-sm',
            isActive && 'bg-blue-600/20 border-l-2 border-blue-500',
            'transition-colors duration-150'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (item.isDirectory) {
              toggleFolder(item.id);
            } else {
              openFile(item.id);
            }
          }}
        >
          {item.isDirectory ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              <Folder className="w-4 h-4 text-blue-400" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <FileCode className="w-4 h-4 text-gray-400" />
            </>
          )}
          
          <span className="flex-1 truncate">{item.name}</span>
          
          {item.isModified && !item.isDirectory && (
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => renameItem(item.id, prompt('New name:', item.name) || item.name)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              {!item.isDirectory && (
                <DropdownMenuItem onClick={() => downloadFile(item.id)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => deleteItem(item.id)} className="text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {item.isDirectory && isExpanded && item.children && (
          <div>
            {item.children.map(childId => {
              const child = files[childId];
              return child ? renderFileTreeItem(child, depth + 1) : null;
            })}
          </div>
        )}
      </div>
    );
  }, [expandedFolders, activeFileId, toggleFolder, openFile, renameItem, downloadFile, deleteItem, files]);

  // Handle new file creation
  const handleCreateFile = useCallback(() => {
    if (newFileName.trim()) {
      createFile(newFileName.trim(), selectedFolderId || undefined);
      setNewFileName('');
      setIsNewFileDialogOpen(false);
    }
  }, [newFileName, selectedFolderId, createFile]);

  // Handle new folder creation
  const handleCreateFolder = useCallback(() => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim(), selectedFolderId || undefined);
      setNewFolderName('');
      setIsNewFolderDialogOpen(false);
    }
  }, [newFolderName, selectedFolderId, createFolder]);

  return (
    <div className={cn('flex h-full', className)}>
      {/* File Explorer Sidebar */}
      <div className="w-64 border-r border-gray-800 flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Files</CardTitle>
            <div className="flex gap-1">
              <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                    <Plus className="w-3 h-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New File</DialogTitle>
                    <DialogDescription>
                      Enter the name of the new file.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="filename.js"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsNewFileDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateFile}>Create</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                    <FolderOpen className="w-3 h-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                    <DialogDescription>
                      Enter the name of the new folder.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="folder-name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateFolder}>Create</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {searchQuery ? (
                filteredFiles.map(file => renderFileTreeItem(file))
              ) : (
                rootItems.map(item => renderFileTreeItem(item))
              )}
            </div>
          </ScrollArea>
        </CardContent>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept=".js,.jsx,.ts,.tsx,.html,.css,.json,.md,.txt"
        />
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        {openTabs.length > 0 && (
          <div className="border-b border-gray-800">
            <ScrollArea>
              <div className="flex">
                {openTabs.map(fileId => {
                  const file = files[fileId];
                  if (!file) return null;

                  return (
                    <div
                      key={fileId}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 border-r border-gray-800 cursor-pointer text-sm min-w-0',
                        activeFileId === fileId ? 'bg-gray-800' : 'hover:bg-gray-900'
                      )}
                      onClick={() => setActiveFileId(fileId)}
                    >
                      <FileCode className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{file.name}</span>
                      {file.isModified && (
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-4 h-4 p-0 ml-1 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeFile(fileId);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1">
          {activeFile ? (
            <MonacoEditor
              ref={editorRef}
              value={activeFile.content}
              fileName={activeFile.name}
              language={activeFile.language}
              personality={personality}
              onChange={(content) => updateFileContent(activeFile.id, content)}
              loading={<MonacoEditorLoading />}
              className="h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No file selected</p>
                <p className="text-sm mt-2">Create a new file or select an existing one to start coding</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileSystemManager;
