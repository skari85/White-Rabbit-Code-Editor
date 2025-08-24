'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FolderTree, 
  File, 
  Folder, 
  FolderOpen, 
  Search, 
  Filter,
  Activity,
  Clock,
  BarChart3,
  GitBranch,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Zap,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileSystemEntry {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified: Date;
  isHidden?: boolean;
  language?: string;
  dependencies?: string[];
  complexity?: number;
  status?: 'modified' | 'staged' | 'untracked' | 'clean';
  gitBranch?: string;
  lastActivity?: Date;
}

interface SmartFileTreeProps {
  files: FileSystemEntry[];
  onFileSelect?: (file: FileSystemEntry) => void;
  onFolderToggle?: (folder: FileSystemEntry) => void;
  className?: string;
}

// File type icons and colors
const getFileIcon = (fileName: string, language?: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (language) {
    switch (language.toLowerCase()) {
      case 'typescript':
      case 'ts':
        return { icon: <File className="w-4 h-4" />, color: 'text-blue-600' };
      case 'javascript':
      case 'js':
        return { icon: <File className="w-4 h-4" />, color: 'text-yellow-500' };
      case 'react':
      case 'jsx':
      case 'tsx':
        return { icon: <File className="w-4 h-4" />, color: 'text-cyan-500' };
      case 'css':
        return { icon: <File className="w-4 h-4" />, color: 'text-pink-500' };
      case 'html':
        return { icon: <File className="w-4 h-4" />, color: 'text-orange-500' };
      case 'json':
        return { icon: <File className="w-4 h-4" />, color: 'text-green-500' };
      case 'markdown':
      case 'md':
        return { icon: <File className="w-4 h-4" />, color: 'text-gray-500' };
      default:
        return { icon: <File className="w-4 h-4" />, color: 'text-gray-400' };
    }
  }
  
  // Fallback to extension-based detection
  switch (ext) {
    case 'ts':
      return { icon: <File className="w-4 h-4" />, color: 'text-blue-600' };
    case 'js':
      return { icon: <File className="w-4 h-4" />, color: 'text-yellow-500' };
    case 'jsx':
    case 'tsx':
      return { icon: <File className="w-4 h-4" />, color: 'text-cyan-500' };
    case 'css':
      return { icon: <File className="w-4 h-4" />, color: 'text-pink-500' };
    case 'html':
      return { icon: <File className="w-4 h-4" />, color: 'text-orange-500' };
    case 'json':
      return { icon: <File className="w-4 h-4" />, color: 'text-green-500' };
    case 'md':
      return { icon: <File className="w-4 h-4" />, color: 'text-gray-500' };
    default:
      return { icon: <File className="w-4 h-4" />, color: 'text-gray-400' };
  }
};

// Generate sample data for demonstration
const generateSampleFiles = (): FileSystemEntry[] => {
  const now = new Date();
  return [
    {
      name: 'src',
      path: '/src',
      type: 'folder',
      lastModified: new Date(now.getTime() - 1000 * 60 * 30),
      dependencies: ['components', 'hooks', 'lib'],
      complexity: 8,
      status: 'clean'
    },
    {
      name: 'components',
      path: '/src/components',
      type: 'folder',
      lastModified: new Date(now.getTime() - 1000 * 60 * 15),
      dependencies: ['ui', 'forms'],
      complexity: 6,
      status: 'clean'
    },
    {
      name: 'App.tsx',
      path: '/src/App.tsx',
      type: 'file',
      size: 2048,
      lastModified: new Date(now.getTime() - 1000 * 60 * 5),
      language: 'typescript',
      dependencies: ['react', 'components'],
      complexity: 4,
      status: 'modified',
      lastActivity: new Date(now.getTime() - 1000 * 60 * 2)
    },
    {
      name: 'index.css',
      path: '/src/index.css',
      type: 'file',
      size: 1536,
      lastModified: new Date(now.getTime() - 1000 * 60 * 10),
      language: 'css',
      complexity: 2,
      status: 'clean'
    },
    {
      name: 'package.json',
      path: '/package.json',
      type: 'file',
      size: 1024,
      lastModified: new Date(now.getTime() - 1000 * 60 * 60),
      language: 'json',
      complexity: 1,
      status: 'clean'
    },
    {
      name: 'README.md',
      path: '/README.md',
      type: 'file',
      size: 2048,
      lastModified: new Date(now.getTime() - 1000 * 60 * 120),
      language: 'markdown',
      complexity: 1,
      status: 'clean'
    },
    {
      name: '.env',
      path: '/.env',
      type: 'file',
      size: 256,
      lastModified: new Date(now.getTime() - 1000 * 60 * 180),
      isHidden: true,
      complexity: 1,
      status: 'untracked'
    }
  ];
};

// Calculate file size in human readable format
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Calculate time ago
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

// Get status indicator
const getStatusIndicator = (status: string) => {
  switch (status) {
    case 'modified':
      return <AlertCircle className="w-3 h-3 text-yellow-500" />;
    case 'staged':
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    case 'untracked':
      return <XCircle className="w-3 h-3 text-red-500" />;
    case 'clean':
    default:
      return <CheckCircle className="w-3 h-3 text-gray-400" />;
  }
};

export default function SmartFileTree({ 
  files = [], 
  onFileSelect, 
  onFolderToggle,
  className = ''
}: SmartFileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/src']));
  const [searchQuery, setSearchQuery] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'modified' | 'complexity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'tree' | 'list' | 'grid'>('tree');

  // Use sample data if no files provided
  const displayFiles = useMemo(() => {
    const fileList = files.length > 0 ? files : generateSampleFiles();
    
    // Filter by search query
    let filtered = fileList.filter(file => 
      !file.isHidden || showHidden
    ).filter(file =>
      searchQuery === '' || 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.path.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort files
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'modified':
          aValue = a.lastModified.getTime();
          bValue = b.lastModified.getTime();
          break;
        case 'complexity':
          aValue = a.complexity || 0;
          bValue = b.complexity || 0;
          break;
        case 'name':
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [files, searchQuery, showHidden, sortBy, sortOrder]);

  const toggleFolder = useCallback((folder: FileSystemEntry) => {
    if (folder.type !== 'folder') return;
    
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folder.path)) {
        newSet.delete(folder.path);
      } else {
        newSet.add(folder.path);
      }
      return newSet;
    });
    
    onFolderToggle?.(folder);
  }, [onFolderToggle]);

  const handleFileSelect = useCallback((file: FileSystemEntry) => {
    onFileSelect?.(file);
  }, [onFileSelect]);

  const renderFileItem = (file: FileSystemEntry, depth: number = 0) => {
    const isExpanded = expandedFolders.has(file.path);
    const fileIcon = getFileIcon(file.name, file.language);
    const hasActivity = file.lastActivity && 
      (Date.now() - file.lastActivity.getTime()) < 1000 * 60 * 5; // 5 minutes

    return (
      <motion.div
        key={file.path}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <div
          className={`
            flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer
            hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
            ${depth > 0 ? 'ml-' + (depth * 4) : ''}
          `}
          onClick={() => file.type === 'folder' ? toggleFolder(file) : handleFileSelect(file)}
        >
          {/* Indentation */}
          <div className="flex items-center gap-1" style={{ width: depth * 16 }}>
            {depth > 0 && (
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            )}
          </div>

          {/* Expand/Collapse arrow for folders */}
          {file.type === 'folder' && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-3 h-3 text-gray-400" />
            </motion.div>
          )}

          {/* File/Folder icon */}
          <div className={`${fileIcon.color}`}>
            {file.type === 'folder' ? (
              isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />
            ) : (
              fileIcon.icon
            )}
          </div>

          {/* File name */}
          <span className="flex-1 text-sm font-medium truncate">
            {file.name}
          </span>

          {/* Status indicators */}
          <div className="flex items-center gap-1">
            {/* Git status */}
            {file.status && file.status !== 'clean' && (
              <div className="flex items-center gap-1">
                {getStatusIndicator(file.status)}
              </div>
            )}

            {/* Activity indicator */}
            {hasActivity && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
            )}

            {/* Complexity indicator */}
            {file.complexity && file.complexity > 5 && (
              <Badge variant="outline" className="text-xs text-orange-600">
                <Zap className="w-3 h-3 mr-1" />
                {file.complexity}
              </Badge>
            )}

            {/* File size */}
            {file.size && (
              <span className="text-xs text-gray-500">
                {formatFileSize(file.size)}
              </span>
            )}

            {/* Last modified */}
            <span className="text-xs text-gray-400 hidden group-hover:block">
              {formatTimeAgo(file.lastModified)}
            </span>
          </div>
        </div>

        {/* Dependencies visualization */}
        {file.dependencies && file.dependencies.length > 0 && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-6 border-l border-gray-200 dark:border-gray-700 pl-2"
          >
            <div className="text-xs text-gray-500 mb-1">Dependencies:</div>
            <div className="flex flex-wrap gap-1">
              {file.dependencies.map(dep => (
                <Badge key={dep} variant="outline" className="text-xs">
                  {dep}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recursively render children for folders */}
        {file.type === 'folder' && isExpanded && (
          <AnimatePresence>
            {displayFiles
              .filter(child => child.path.startsWith(file.path + '/') && 
                child.path.split('/').length === file.path.split('/').length + 1)
              .map(child => renderFileItem(child, depth + 1))}
          </AnimatePresence>
        )}
      </motion.div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-blue-500" />
            Smart File Tree
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHidden(!showHidden)}
            >
              {showHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedFolders(new Set(['/src']))}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex items-center gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort controls */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy as any);
              setSortOrder(newSortOrder as any);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="name-asc">Name ↑</option>
            <option value="name-desc">Name ↓</option>
            <option value="size-asc">Size ↑</option>
            <option value="size-desc">Size ↓</option>
            <option value="modified-asc">Modified ↑</option>
            <option value="modified-desc">Modified ↓</option>
            <option value="complexity-asc">Complexity ↑</option>
            <option value="complexity-desc">Complexity ↓</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4">
            {/* File tree */}
            <div className="space-y-1">
              {displayFiles
                .filter(file => file.path.split('/').length === 1)
                .map(file => renderFileItem(file))}
            </div>

            {/* Empty state */}
            {displayFiles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No files found</p>
                {searchQuery && <p className="text-sm">Try adjusting your search</p>}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
