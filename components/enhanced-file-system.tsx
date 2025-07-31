'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
  ChevronDown,
  GitBranch,
  History,
  FileX,
  FilePlus,
  FolderPlus,
  Archive,
  RefreshCw,
  Eye,
  Code,
  Terminal,
  Settings,
  Bookmark,
  Tag,
  Clock,
  Users,
  Lock,
  Unlock,
  Share2,
  ExternalLink,
  Zap,
  Database,
  Cloud,
  HardDrive
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
  isBookmarked?: boolean;
  tags?: string[];
  isReadOnly?: boolean;
  permissions?: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  metadata?: {
    encoding?: string;
    lineEndings?: 'LF' | 'CRLF' | 'CR';
    author?: string;
    description?: string;
  };
  gitStatus?: 'untracked' | 'modified' | 'added' | 'deleted' | 'renamed' | 'clean';
  version?: number;
  history?: Array<{
    version: number;
    content: string;
    timestamp: Date;
    message?: string;
  }>;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  files: Record<string, Omit<FileItem, 'id' | 'lastModified' | 'size'>>;
  dependencies?: string[];
  scripts?: Record<string, string>;
}

export interface FileSystemManagerProps {
  personality?: PersonalityMode;
  onFileChange?: (fileId: string, content: string) => void;
  onFileSelect?: (fileId: string) => void;
  className?: string;
  enableVersionControl?: boolean;
  enableProjectTemplates?: boolean;
  enableFileSync?: boolean;
}

// Project templates
const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'react-app',
    name: 'React App',
    description: 'Basic React application with TypeScript',
    files: {
      'package.json': {
        name: 'package.json',
        content: JSON.stringify({
          name: 'react-app',
          version: '1.0.0',
          dependencies: {
            'react': '^18.0.0',
            'react-dom': '^18.0.0',
            '@types/react': '^18.0.0'
          }
        }, null, 2),
        language: 'json',
        isModified: false,
        isDirectory: false
      },
      'src/App.tsx': {
        name: 'App.tsx',
        content: `import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Hello React!</h1>
    </div>
  );
}

export default App;`,
        language: 'typescript',
        isModified: false,
        isDirectory: false,
        parentId: 'src'
      },
      'src': {
        name: 'src',
        content: '',
        isModified: false,
        isDirectory: true,
        children: ['src/App.tsx']
      }
    }
  },
  {
    id: 'node-api',
    name: 'Node.js API',
    description: 'Express.js REST API with TypeScript',
    files: {
      'package.json': {
        name: 'package.json',
        content: JSON.stringify({
          name: 'node-api',
          version: '1.0.0',
          dependencies: {
            'express': '^4.18.0',
            '@types/express': '^4.17.0'
          },
          scripts: {
            'start': 'node dist/index.js',
            'dev': 'ts-node src/index.ts'
          }
        }, null, 2),
        language: 'json',
        isModified: false,
        isDirectory: false
      },
      'src/index.ts': {
        name: 'index.ts',
        content: `import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
        language: 'typescript',
        isModified: false,
        isDirectory: false,
        parentId: 'src'
      },
      'src': {
        name: 'src',
        content: '',
        isModified: false,
        isDirectory: true,
        children: ['src/index.ts']
      }
    }
  }
];

const EnhancedFileSystemManager: React.FC<FileSystemManagerProps> = ({
  personality = 'hex',
  onFileChange,
  onFileSelect,
  className,
  enableVersionControl = true,
  enableProjectTemplates = true,
  enableFileSync = false
}) => {
  const [files, setFiles] = useSimpleLocalStorage<Record<string, FileItem>>('enhanced-file-system', {});
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileItem[]>([]);
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bookmarkedFiles, setBookmarkedFiles] = useState<Set<string>>(new Set());
  const [recentFiles, setRecentFiles] = useSimpleLocalStorage<string[]>('recent-files', []);
  const [fileHistory, setFileHistory] = useSimpleLocalStorage<Record<string, FileItem['history']>>('file-history', {});
  
  const editorRef = useRef<MonacoEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Get active file
  const activeFile = activeFileId ? files[activeFileId] : null;

  // Get root files and folders
  const rootItems = Object.values(files).filter(file => !file.parentId);

  // Enhanced search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = Object.values(files).filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, files]);

  // File operations with version control
  const createFile = useCallback((name: string, parentId?: string, template?: string) => {
    const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const content = template || getTemplateForFile(name);
    
    const newFile: FileItem = {
      id,
      name,
      content,
      language: getLanguageFromFileName(name),
      isModified: false,
      isDirectory: false,
      parentId,
      lastModified: new Date(),
      size: content.length,
      isBookmarked: false,
      tags: [],
      isReadOnly: false,
      permissions: { read: true, write: true, execute: false },
      metadata: {
        encoding: 'UTF-8',
        lineEndings: 'LF',
        author: 'User'
      },
      gitStatus: 'untracked',
      version: 1,
      history: [{
        version: 1,
        content,
        timestamp: new Date(),
        message: 'Initial version'
      }]
    };

    setFiles(prev => ({ ...prev, [id]: newFile }));
    
    // Update parent folder
    if (parentId && files[parentId]) {
      setFiles(prev => ({
        ...prev,
        [parentId]: {
          ...prev[parentId],
          children: [...(prev[parentId].children || []), id]
        }
      }));
    }

    setActiveFileId(id);
    addToOpenTabs(id);
    addToRecentFiles(id);
    
    return id;
  }, [files, setFiles]);

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
      size: 0,
      isBookmarked: false,
      tags: [],
      permissions: { read: true, write: true, execute: true },
      gitStatus: 'clean'
    };

    setFiles(prev => ({ ...prev, [id]: newFolder }));
    
    if (parentId && files[parentId]) {
      setFiles(prev => ({
        ...prev,
        [parentId]: {
          ...prev[parentId],
          children: [...(prev[parentId].children || []), id]
        }
      }));
    }

    setExpandedFolders(prev => new Set([...prev, id]));
    return id;
  }, [files, setFiles]);

  // Enhanced file content update with version control
  const updateFileContent = useCallback((fileId: string, content: string, message?: string) => {
    if (!files[fileId]) return;

    const file = files[fileId];
    const newVersion = (file.version || 1) + 1;
    
    setFiles(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        content,
        isModified: content !== file.content,
        lastModified: new Date(),
        size: content.length,
        version: newVersion,
        gitStatus: file.gitStatus === 'clean' ? 'modified' : file.gitStatus
      }
    }));

    // Add to history if version control is enabled
    if (enableVersionControl) {
      setFileHistory(prev => ({
        ...prev,
        [fileId]: [
          ...(prev[fileId] || []),
          {
            version: newVersion,
            content,
            timestamp: new Date(),
            message: message || `Update version ${newVersion}`
          }
        ].slice(-10) // Keep last 10 versions
      }));
    }

    onFileChange?.(fileId, content);
  }, [files, setFiles, setFileHistory, enableVersionControl, onFileChange]);

  // Project template functions
  const createProjectFromTemplate = useCallback((templateId: string) => {
    const template = PROJECT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    // Clear existing files
    setFiles({});
    setOpenTabs([]);
    setActiveFileId(null);

    // Create files from template
    const createdFiles: Record<string, FileItem> = {};
    
    Object.entries(template.files).forEach(([path, fileData]) => {
      const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      createdFiles[id] = {
        ...fileData,
        id,
        lastModified: new Date(),
        size: fileData.content.length,
        version: 1,
        history: [{
          version: 1,
          content: fileData.content,
          timestamp: new Date(),
          message: 'Created from template'
        }]
      };
    });

    setFiles(createdFiles);
    
    // Open main file
    const mainFile = Object.values(createdFiles).find(f => 
      f.name.includes('App.') || f.name.includes('index.') || f.name.includes('main.')
    );
    if (mainFile) {
      setActiveFileId(mainFile.id);
      addToOpenTabs(mainFile.id);
    }
  }, [setFiles]);

  // Helper functions
  const getTemplateForFile = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
        return '// JavaScript file\nconsole.log("Hello World!");';
      case 'ts':
        return '// TypeScript file\ninterface HelloWorld {\n  message: string;\n}\n\nconst hello: HelloWorld = {\n  message: "Hello World!"\n};\n\nconsole.log(hello.message);';
      case 'tsx':
        return 'import React from "react";\n\ninterface Props {\n  title: string;\n}\n\nconst Component: React.FC<Props> = ({ title }) => {\n  return <h1>{title}</h1>;\n};\n\nexport default Component;';
      case 'jsx':
        return 'import React from "react";\n\nconst Component = ({ title }) => {\n  return <h1>{title}</h1>;\n};\n\nexport default Component;';
      case 'html':
        return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>';
      case 'css':
        return '/* CSS Styles */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}\n\nh1 {\n  color: #333;\n}';
      case 'json':
        return '{\n  "name": "example",\n  "version": "1.0.0",\n  "description": "Example JSON file"\n}';
      case 'md':
        return '# Title\n\nThis is a markdown file.\n\n## Section\n\n- Item 1\n- Item 2\n- Item 3';
      case 'py':
        return '#!/usr/bin/env python3\n# Python file\n\ndef hello_world():\n    print("Hello World!")\n\nif __name__ == "__main__":\n    hello_world()';
      default:
        return '';
    }
  };

  const addToOpenTabs = (fileId: string) => {
    setOpenTabs(prev => prev.includes(fileId) ? prev : [...prev, fileId]);
  };

  const addToRecentFiles = (fileId: string) => {
    setRecentFiles(prev => [fileId, ...prev.filter(id => id !== fileId)].slice(0, 10));
  };

  const toggleBookmark = (fileId: string) => {
    setBookmarkedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });

    setFiles(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        isBookmarked: !prev[fileId].isBookmarked
      }
    }));
  };

  // File upload with progress
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const content = await file.text();
        createFile(file.name, selectedFolderId, content);
        setUploadProgress(((i + 1) / files.length) * 100);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    event.target.value = '';
  }, [createFile, selectedFolderId]);

  // Folder upload
  const handleFolderUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    setUploadProgress(0);

    const folderStructure: Record<string, string> = {};

    // Create folder structure
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = file.webkitRelativePath || file.name;
      
      try {
        const content = await file.text();
        folderStructure[path] = content;
        setUploadProgress(((i + 1) / files.length) * 100);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }

    // Build the folder structure
    const createdFolders: Record<string, string> = {};
    
    Object.keys(folderStructure).forEach(path => {
      const parts = path.split('/');
      let currentPath = '';
      
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!isFile && !createdFolders[currentPath]) {
          const parentPath = parts.slice(0, index).join('/');
          const parentId = parentPath ? createdFolders[parentPath] : selectedFolderId;
          const folderId = createFolder(part, parentId);
          createdFolders[currentPath] = folderId;
        }
      });
    });

    // Create files
    Object.entries(folderStructure).forEach(([path, content]) => {
      const parts = path.split('/');
      const fileName = parts[parts.length - 1];
      const folderPath = parts.slice(0, -1).join('/');
      const parentId = folderPath ? createdFolders[folderPath] : selectedFolderId;
      
      createFile(fileName, parentId, content);
    });

    setIsUploading(false);
    setUploadProgress(0);
    event.target.value = '';
  }, [createFile, createFolder, selectedFolderId]);

  // Export functions
  const exportProject = useCallback(async () => {
    const zip = await import('jszip');
    const JSZip = zip.default;
    const archive = new JSZip();

    const addToZip = (item: FileItem, path: string = '') => {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      
      if (item.isDirectory) {
        const folder = archive.folder(fullPath);
        item.children?.forEach(childId => {
          const child = files[childId];
          if (child) addToZip(child, fullPath);
        });
      } else {
        archive.file(fullPath, item.content);
      }
    };

    rootItems.forEach(item => addToZip(item));

    const blob = await archive.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project.zip';
    link.click();
    URL.revokeObjectURL(url);
  }, [files, rootItems]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Enhanced Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b bg-muted/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setIsNewFileDialogOpen(true)}>
              <FilePlus className="w-4 h-4 mr-2" />
              New File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsNewFolderDialogOpen(true)}>
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {enableProjectTemplates && (
              <DropdownMenuItem onClick={() => setIsTemplateDialogOpen(true)}>
                <Code className="w-4 h-4 mr-2" />
                From Template
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <FileText className="w-4 h-4 mr-2" />
              Upload Files
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => folderInputRef.current?.click()}>
              <Folder className="w-4 h-4 mr-2" />
              Upload Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={exportProject}>
          <Download className="w-4 h-4 mr-1" />
          Export
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>

        {enableVersionControl && (
          <Button variant="outline" size="sm">
            <GitBranch className="w-4 h-4 mr-1" />
            Git
          </Button>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="p-2 bg-muted/30">
          <div className="flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Uploading files...
          </div>
          <Progress value={uploadProgress} className="mt-1" />
        </div>
      )}

      <div className="flex-1 flex">
        {/* Enhanced File Explorer */}
        <div className="w-80 border-r bg-muted/20">
          <Tabs defaultValue="explorer" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="explorer" className="text-xs">
                <Folder className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="search" className="text-xs">
                <Search className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="text-xs">
                <Bookmark className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="recent" className="text-xs">
                <Clock className="w-3 h-3" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="explorer" className="h-full mt-0">
              <ScrollArea className="h-full">
                {/* File Tree */}
                {/* Implementation continues with enhanced file tree */}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="search" className="h-full mt-0">
              <ScrollArea className="h-full p-2">
                {searchResults.map(file => (
                  <div key={file.id} className="p-2 hover:bg-muted rounded cursor-pointer">
                    <div className="flex items-center gap-2">
                      {file.isDirectory ? (
                        <Folder className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      <span className="text-sm">{file.name}</span>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="bookmarks" className="h-full mt-0">
              <ScrollArea className="h-full p-2">
                {Array.from(bookmarkedFiles).map(fileId => {
                  const file = files[fileId];
                  if (!file) return null;
                  return (
                    <div key={fileId} className="p-2 hover:bg-muted rounded cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                    </div>
                  );
                })}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="recent" className="h-full mt-0">
              <ScrollArea className="h-full p-2">
                {recentFiles.map(fileId => {
                  const file = files[fileId];
                  if (!file) return null;
                  return (
                    <div key={fileId} className="p-2 hover:bg-muted rounded cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                    </div>
                  );
                })}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Enhanced Tab Bar */}
          {openTabs.length > 0 && (
            <div className="flex items-center bg-muted/30 border-b">
              <ScrollArea className="flex-1">
                <div className="flex">
                  {openTabs.map(tabId => {
                    const file = files[tabId];
                    if (!file) return null;
                    
                    return (
                      <div
                        key={tabId}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 border-r cursor-pointer min-w-0",
                          activeFileId === tabId ? "bg-background" : "hover:bg-muted/50"
                        )}
                        onClick={() => {
                          setActiveFileId(tabId);
                          onFileSelect?.(tabId);
                        }}
                      >
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        <span className="text-sm truncate max-w-32">{file.name}</span>
                        {file.isModified && (
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-4 h-4 p-0 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenTabs(prev => prev.filter(id => id !== tabId));
                            if (activeFileId === tabId) {
                              const newActiveTab = openTabs.find(id => id !== tabId);
                              setActiveFileId(newActiveTab || null);
                            }
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
              <div className="h-full flex flex-col">
                {/* File Info Bar */}
                <div className="flex items-center justify-between px-4 py-1 bg-muted/20 border-b text-xs">
                  <div className="flex items-center gap-4">
                    <span>{activeFile.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {activeFile.language || 'text'}
                    </Badge>
                    {activeFile.gitStatus && activeFile.gitStatus !== 'clean' && (
                      <Badge variant="outline" className="text-xs">
                        {activeFile.gitStatus}
                      </Badge>
                    )}
                    <span className="text-muted-foreground">
                      {activeFile.size} bytes
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBookmark(activeFile.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Bookmark 
                        className={cn(
                          "w-3 h-3",
                          activeFile.isBookmarked ? "fill-yellow-500 text-yellow-500" : ""
                        )} 
                      />
                    </Button>
                    {activeFile.isReadOnly && (
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
                
                <MonacoEditor
                  ref={editorRef}
                  language={activeFile.language || 'plaintext'}
                  value={activeFile.content}
                  onChange={(value) => updateFileContent(activeFile.id, value || '')}
                  className="flex-1"
                  options={{
                    readOnly: activeFile.isReadOnly,
                    minimap: { enabled: true },
                    lineNumbers: 'on',
                    rulers: [80, 120],
                    wordWrap: 'on',
                    bracketPairColorization: { enabled: true },
                    inlineSuggest: { enabled: true },
                    suggest: { preview: true },
                    quickSuggestions: true,
                    folding: true,
                    foldingStrategy: 'indentation',
                    showFoldingControls: 'always'
                  }}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a file to start editing</p>
                  <p className="text-sm mt-1">Or create a new file to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
        className="hidden"
        onChange={handleFolderUpload}
      />

      {/* Dialogs */}
      <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter file name (e.g., app.tsx)"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFileName.trim()) {
                  createFile(newFileName.trim(), selectedFolderId);
                  setNewFileName('');
                  setIsNewFileDialogOpen(false);
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (newFileName.trim()) {
                    createFile(newFileName.trim(), selectedFolderId);
                    setNewFileName('');
                    setIsNewFileDialogOpen(false);
                  }
                }}
                disabled={!newFileName.trim()}
              >
                Create
              </Button>
              <Button variant="outline" onClick={() => setIsNewFileDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Project from Template</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROJECT_TEMPLATES.map(template => (
              <Card 
                key={template.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  createProjectFromTemplate(template.id);
                  setIsTemplateDialogOpen(false);
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.keys(template.files).slice(0, 3).map(fileName => (
                      <Badge key={fileName} variant="outline" className="text-xs">
                        {fileName}
                      </Badge>
                    ))}
                    {Object.keys(template.files).length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{Object.keys(template.files).length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedFileSystemManager;
