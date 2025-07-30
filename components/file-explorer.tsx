
"use client";
import React, { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FolderPlus, FilePlus, RefreshCw, Search } from 'lucide-react';
import { LocalFile, LocalProject } from '@/hooks/use-local-storage';
import { FileTree } from './file-tree';

interface FileExplorerProps {
  project: LocalProject | null;
  onFileSelect: (file: LocalFile) => void;
  onFileCreate: (fileName: string) => void;
  onFolderCreate: (folderName: string) => void;
  onRefresh: () => void;
  className?: string;
}

export function FileExplorer({
  project,
  onFileSelect,
  onFileCreate,
  onFolderCreate,
  onRefresh,
  className,
}: FileExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  const filteredFiles = useMemo(() => {
    if (!project) return [];
    if (!searchTerm) return project.files;
    return project.files.filter(file =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [project, searchTerm]);

  const handleFileCreate = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim());
      setNewFileName('');
    }
  };

  const handleFolderCreate = () => {
    if (newFolderName.trim()) {
      onFolderCreate(newFolderName.trim());
      setNewFolderName('');
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gray-950 text-gray-300 border-r border-gray-800 ${className}`}>
      <div className="p-2 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white">
          {project?.name || 'No Project'}
        </h3>
      </div>
      <div className="p-2 flex items-center gap-2 border-b border-gray-800">
        <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-gray-900 border-gray-700"
          />
        </div>
      </div>
      <div className="p-2 space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="New file name"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleFileCreate()}
            className="bg-gray-900 border-gray-700"
          />
          <Button onClick={handleFileCreate} size="sm" variant="secondary">
            <FilePlus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleFolderCreate()}
            className="bg-gray-900 border-gray-700"
          />
          <Button onClick={handleFolderCreate} size="sm" variant="secondary">
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-grow">
        {project ? (
          <FileTree
            files={filteredFiles}
            onSelect={onFileSelect}
          />
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p>Open a project to see files.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
