"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Ghost, 
  Check, 
  X, 
  Clock, 
  FileText,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { PersonalityMode } from '@/lib/personality-system';

export interface GhostFile {
  id: string;
  name: string;
  content: string;
  type: string;
  isGhost: boolean;
  createdAt: Date;
  lastModified: Date;
  autoSaveTimer?: NodeJS.Timeout;
}

interface GhostFilesProps {
  files: GhostFile[];
  selectedFileId?: string;
  onFileSelect: (fileId: string) => void;
  onAcceptFile: (fileId: string) => void;
  onRejectFile: (fileId: string) => void;
  onFileUpdate: (fileId: string, content: string) => void;
  personality: PersonalityMode;
  showGhostFiles: boolean;
  onToggleGhostFiles: (show: boolean) => void;
}

export function GhostFiles({
  files,
  selectedFileId,
  onFileSelect,
  onAcceptFile,
  onRejectFile,
  onFileUpdate,
  personality,
  showGhostFiles,
  onToggleGhostFiles
}: GhostFilesProps) {
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);

  const ghostFiles = files.filter(f => f.isGhost);
  const solidFiles = files.filter(f => !f.isGhost);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'html': return '🌐';
      case 'css': return '🎨';
      case 'js': case 'ts': case 'tsx': return '⚡';
      case 'json': return '📋';
      case 'md': return '📝';
      case 'py': return '🐍';
      default: return '📄';
    }
  };

  const getTimeSinceCreated = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  return (
    <div className="w-64 border-r border-gray-800 bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm text-gray-300">Files</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleGhostFiles(!showGhostFiles)}
            className="h-6 w-6 p-0"
          >
            {showGhostFiles ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{solidFiles.length} solid</span>
          {showGhostFiles && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Ghost className="w-3 h-3" />
                <span>{ghostFiles.length} ghost</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {/* Solid Files */}
        <div className="p-2">
          {solidFiles.map((file) => (
            <div
              key={file.id}
              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all ${
                selectedFileId === file.id 
                  ? 'bg-blue-600/20 border border-blue-500/50' 
                  : 'hover:bg-gray-800/50'
              }`}
              onClick={() => onFileSelect(file.id)}
              onMouseEnter={() => setHoveredFile(file.id)}
              onMouseLeave={() => setHoveredFile(null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">{getFileIcon(file.type)}</span>
                <span className="text-sm truncate text-white">{file.name}</span>
              </div>
              <Badge variant="outline" className="text-xs px-1 py-0">
                {file.type}
              </Badge>
            </div>
          ))}
        </div>

        {/* Ghost Files */}
        {showGhostFiles && ghostFiles.length > 0 && (
          <div className="border-t border-gray-800/50">
            <div className="p-2 pt-3">
              <div className="flex items-center gap-2 mb-2 px-2">
                <Ghost className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">
                  {personality === 'hex' ? 'Pending Files' : 'Ghost Files'}
                </span>
              </div>
              
              {ghostFiles.map((file) => (
                <div
                  key={file.id}
                  className={`relative group transition-all duration-300 ${
                    selectedFileId === file.id ? 'opacity-100' : 'opacity-60'
                  }`}
                  onMouseEnter={() => setHoveredFile(file.id)}
                  onMouseLeave={() => setHoveredFile(null)}
                >
                  <div
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all border border-dashed ${
                      selectedFileId === file.id 
                        ? 'bg-gray-800/30 border-gray-600' 
                        : 'border-gray-700/50 hover:bg-gray-800/20 hover:border-gray-600'
                    }`}
                    onClick={() => onFileSelect(file.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm opacity-70">{getFileIcon(file.type)}</span>
                      <span className="text-sm truncate text-gray-400">{file.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs px-1 py-0 border-gray-600 text-gray-500">
                        {file.type}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeSinceCreated(file.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ghost File Actions */}
                  {(hoveredFile === file.id || selectedFileId === file.id) && (
                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-lg p-1 shadow-lg z-10">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcceptFile(file.id);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-green-600/20 hover:text-green-400"
                        title="Accept file"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRejectFile(file.id);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-red-600/20 hover:text-red-400"
                        title="Reject file"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  {/* Ghost Animation */}
                  {personality === 'kex' && (
                    <div className="absolute inset-0 pointer-events-none">
                      <Sparkles className="absolute top-1 right-1 w-3 h-3 text-purple-400 opacity-30 animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {files.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files generated yet</p>
            <p className="text-xs mt-1">
              {personality === 'hex' 
                ? 'Chat with AI to create files' 
                : 'Let\'s conjure some code! ✨'
              }
            </p>
          </div>
        )}
      </div>

      {/* Ghost Files Summary */}
      {ghostFiles.length > 0 && (
        <div className="border-t border-gray-800 p-3 bg-gray-900/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-gray-400">
              <Ghost className="w-3 h-3" />
              <span>
                {ghostFiles.length} file{ghostFiles.length !== 1 ? 's' : ''} pending
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => {
                  ghostFiles.forEach(file => onAcceptFile(file.id));
                }}
                variant="ghost"
                size="sm"
                className="h-5 px-2 text-xs hover:bg-green-600/20 hover:text-green-400"
              >
                Accept All
              </Button>
              <Button
                onClick={() => {
                  ghostFiles.forEach(file => onRejectFile(file.id));
                }}
                variant="ghost"
                size="sm"
                className="h-5 px-2 text-xs hover:bg-red-600/20 hover:text-red-400"
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for managing ghost files
export function useGhostFiles() {
  const [files, setFiles] = useState<GhostFile[]>([]);
  const [showGhostFiles, setShowGhostFiles] = useState(true);

  const createGhostFile = (name: string, content: string, type: string): string => {
    const id = `ghost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newFile: GhostFile = {
      id,
      name,
      content,
      type,
      isGhost: true,
      createdAt: new Date(),
      lastModified: new Date()
    };

    setFiles(prev => [...prev, newFile]);
    return id;
  };

  const updateFile = (fileId: string, content: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, content, lastModified: new Date() }
        : file
    ));
  };

  const acceptFile = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, isGhost: false, lastModified: new Date() }
        : file
    ));
  };

  const rejectFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const createSolidFile = (name: string, content: string, type: string): string => {
    const id = `solid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newFile: GhostFile = {
      id,
      name,
      content,
      type,
      isGhost: false,
      createdAt: new Date(),
      lastModified: new Date()
    };

    setFiles(prev => [...prev, newFile]);
    return id;
  };

  const getFile = (fileId: string) => {
    return files.find(file => file.id === fileId);
  };

  const getAllFiles = () => files;
  const getGhostFiles = () => files.filter(f => f.isGhost);
  const getSolidFiles = () => files.filter(f => !f.isGhost);

  return {
    files,
    showGhostFiles,
    setShowGhostFiles,
    createGhostFile,
    createSolidFile,
    updateFile,
    acceptFile,
    rejectFile,
    getFile,
    getAllFiles,
    getGhostFiles,
    getSolidFiles
  };
}

// Auto-save utility
export class GhostFileAutoSave {
  private static timers: Map<string, NodeJS.Timeout> = new Map();
  
  static scheduleAutoSave(
    fileId: string, 
    content: string, 
    onSave: (fileId: string, content: string) => void,
    delay: number = 2000
  ) {
    // Clear existing timer
    const existingTimer = this.timers.get(fileId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      onSave(fileId, content);
      this.timers.delete(fileId);
    }, delay);

    this.timers.set(fileId, timer);
  }

  static cancelAutoSave(fileId: string) {
    const timer = this.timers.get(fileId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(fileId);
    }
  }

  static clearAllTimers() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}
