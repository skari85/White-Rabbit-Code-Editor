'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, Folder, ChevronRight, ChevronDown } from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  isExpanded?: boolean;
  level: number;
  parentId?: string;
  children?: FileItem[];
}

interface VirtualFileListProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  onFileToggle?: (file: FileItem) => void;
  selectedFileId?: string;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
}

const ITEM_HEIGHT = 32; // Default height per item in pixels
const BUFFER_SIZE = 5; // Number of items to render outside visible area

export default function VirtualFileList({
  files,
  onFileSelect,
  onFileToggle,
  selectedFileId,
  itemHeight = ITEM_HEIGHT,
  containerHeight = 400,
  className = ''
}: VirtualFileListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten the file tree for virtual scrolling
  const flattenedFiles = useMemo(() => {
    const flatten = (items: FileItem[], level = 0): FileItem[] => {
      const result: FileItem[] = [];
      
      for (const item of items) {
        result.push({ ...item, level });
        
        if (item.type === 'folder' && item.isExpanded && item.children) {
          result.push(...flatten(item.children, level + 1));
        }
      }
      
      return result;
    };
    
    return flatten(files);
  }, [files]);

  // Calculate visible items
  const visibleItems = useMemo(() => {
    const totalItems = flattenedFiles.length;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + BUFFER_SIZE * 2, totalItems);
    const actualStartIndex = Math.max(0, startIndex - BUFFER_SIZE);

    return {
      items: flattenedFiles.slice(actualStartIndex, endIndex),
      startIndex: actualStartIndex,
      totalHeight: totalItems * itemHeight,
      offsetY: actualStartIndex * itemHeight
    };
  }, [flattenedFiles, scrollTop, containerHeight, itemHeight]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder' && onFileToggle) {
      onFileToggle(file);
    } else {
      onFileSelect(file);
    }
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return file.isExpanded ? (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-500" />
      );
    }
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  const getFileTypeIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'js': '🟨',
      'ts': '🔷',
      'jsx': '⚛️',
      'tsx': '⚛️',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'md': '📝',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'php': '🐘',
      'rb': '💎',
      'go': '🐹',
      'rs': '🦀',
      'swift': '🍎',
      'kt': '🟣'
    };
    return iconMap[ext || ''] || '📄';
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: visibleItems.totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleItems.offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.items.map((file, index) => (
            <div
              key={`${file.id}-${visibleItems.startIndex + index}`}
              className={`flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 transition-colors ${
                selectedFileId === file.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              }`}
              style={{
                height: itemHeight,
                paddingLeft: `${8 + file.level * 16}px`
              }}
              onClick={() => handleFileClick(file)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getFileIcon(file)}
                {file.type === 'file' && (
                  <span className="text-sm">{getFileTypeIcon(file.name)}</span>
                )}
                <span
                  className={`text-sm truncate ${
                    file.type === 'folder' ? 'font-medium text-gray-700' : 'text-gray-600'
                  } ${selectedFileId === file.id ? 'text-blue-700 font-medium' : ''}`}
                  title={file.name}
                >
                  {file.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
