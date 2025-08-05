'use client';

import React from 'react';
import { X, FileText, Code, Palette, Settings, BookOpen, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileContent } from '@/hooks/use-code-builder';

interface FileTabsProps {
  files: FileContent[];
  selectedFile: string;
  onSelectFile: (filename: string) => void;
  onCloseFile?: (filename: string) => void;
  hasUnsavedChanges?: boolean;
  className?: string;
  showDocumentation?: boolean;
  onToggleDocumentation?: () => void;
  hasDocumentation?: boolean;
  useAIEnhancedEditor?: boolean;
  onToggleAIEditor?: () => void;
  aiConfigured?: boolean;
  showInspections?: boolean;
  onToggleInspections?: () => void;
  onRunInspections?: () => void;
  inspectionCount?: number;
}

// Get file type icon based on extension
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return <FileText className="w-3 h-3 text-orange-500" />;
    case 'css':
      return <Palette className="w-3 h-3 text-blue-500" />;
    case 'js':
    case 'jsx':
      return <Code className="w-3 h-3 text-yellow-500" />;
    case 'ts':
    case 'tsx':
      return <Code className="w-3 h-3 text-blue-600" />;
    case 'json':
      return <Settings className="w-3 h-3 text-green-500" />;
    case 'md':
      return <FileText className="w-3 h-3 text-gray-600" />;
    default:
      return <FileText className="w-3 h-3 text-gray-500" />;
  }
};

// Get file type color for tab styling
const getFileTypeColor = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return 'border-orange-500';
    case 'css':
      return 'border-blue-500';
    case 'js':
    case 'jsx':
      return 'border-yellow-500';
    case 'ts':
    case 'tsx':
      return 'border-blue-600';
    case 'json':
      return 'border-green-500';
    case 'md':
      return 'border-gray-600';
    default:
      return 'border-gray-400';
  }
};

export default function FileTabs({
  files,
  selectedFile,
  onSelectFile,
  onCloseFile,
  hasUnsavedChanges = false,
  className = '',
  showDocumentation = false,
  onToggleDocumentation,
  hasDocumentation = false,
  useAIEnhancedEditor = false,
  onToggleAIEditor,
  aiConfigured = false,
  showInspections = false,
  onToggleInspections,
  onRunInspections,
  inspectionCount = 0
}: FileTabsProps) {
  if (files.length === 0) {
    return (
      <div className={`bg-gray-50 border-b border-gray-200 px-4 py-2 ${className}`}>
        <div className="flex items-center justify-center text-gray-500 text-sm">
          <FileText className="w-4 h-4 mr-2" />
          No files open
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{ scrollbarWidth: 'thin' }}>
        {files.map((file, index) => {
          const isSelected = file.name === selectedFile;
          const fileTypeColor = getFileTypeColor(file.name);

          return (
            <div
              key={`${file.name}-${file.type}-${file.lastModified?.getTime() || index}-${index}`}
              className={`
                flex items-center min-w-0 border-r border-gray-400 last:border-r-0
                ${isSelected
                  ? `bg-gray-800 border-b-2 ${fileTypeColor} shadow-sm`
                  : 'bg-gray-600 hover:bg-gray-700 border-b-2 border-transparent'
                }
                transition-all duration-200 ease-in-out
              `}
            >
              <button
                onClick={() => onSelectFile(file.name)}
                className={`
                  flex items-center gap-2 px-3 py-2 text-sm font-medium min-w-0 flex-1
                  ${isSelected
                    ? 'text-white'
                    : 'text-gray-200 hover:text-white'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset
                `}
                title={file.name}
              >
                {getFileIcon(file.name)}
                <span className="truncate max-w-[120px]">
                  {file.name}
                </span>
                {isSelected && hasUnsavedChanges && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" title="Unsaved changes" />
                )}
              </button>
              
              {onCloseFile && files.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseFile(file.name);
                  }}
                  className={`h-6 w-6 p-0 mr-1 rounded-sm ${
                    isSelected
                      ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                      : 'hover:bg-gray-500 text-gray-400 hover:text-white'
                  }`}
                  title={`Close ${file.name}`}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
      
      {/* File info bar */}
      {selectedFile && (
        <div className="px-4 py-1 bg-gray-700 border-t border-gray-600">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span>
                File: <span className="font-medium text-gray-200">{selectedFile}</span>
              </span>
              <span>
                Total files: <span className="font-medium text-gray-700">{files.length}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onToggleAIEditor && aiConfigured && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleAIEditor}
                  className={`h-6 px-2 text-xs ${
                    useAIEnhancedEditor
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      : 'hover:bg-gray-200'
                  }`}
                  title={useAIEnhancedEditor ? "Disable AI completions" : "Enable AI completions"}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  AI
                </Button>
              )}
              {onToggleInspections && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleInspections}
                  className={`h-6 px-2 text-xs ${
                    showInspections
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'hover:bg-gray-200'
                  }`}
                  title={showInspections ? "Hide code inspections" : "Show code inspections"}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Issues
                  {inspectionCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                      {inspectionCount}
                    </Badge>
                  )}
                </Button>
              )}
              {onRunInspections && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRunInspections}
                  className="h-6 px-2 text-xs hover:bg-gray-200"
                  title="Run code inspections"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Scan
                </Button>
              )}
              {onToggleDocumentation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleDocumentation}
                  className={`h-6 px-2 text-xs ${
                    showDocumentation
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'hover:bg-gray-200'
                  }`}
                  title={showDocumentation ? "Hide documentation" : "Show documentation"}
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Docs
                  {hasDocumentation && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-1" />
                  )}
                </Button>
              )}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs">
                  Unsaved changes
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
