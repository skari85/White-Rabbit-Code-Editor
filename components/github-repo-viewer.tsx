'use client';

import { useState, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { GitHubFileTree } from './github-file-tree';
import MonacoCodeSpace from './monaco-code-space';
import { useGitHubFileLoader } from '@/hooks/use-github-file-loader';
import { useCodeBuilder } from '@/hooks/use-code-builder';
import { GitHubRepoStorage, CurrentRepoReference } from '@/lib/github-repo-storage';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GitHubRepoViewerProps {
  className?: string;
}

/**
 * Complete GitHub Repository Viewer
 * 
 * Displays file tree sidebar and Monaco editor.
 * Loads files from GitHub on selection.
 */
export function GitHubRepoViewer({ className }: GitHubRepoViewerProps) {
  const [currentRepo, setCurrentRepo] = useState<CurrentRepoReference | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const { loadFile, loading: fileLoading, error: fileError } = useGitHubFileLoader();
  const { files, addFile, updateFile, setSelectedFile } = useCodeBuilder();

  useEffect(() => {
    // Load current repo from storage on mount
    const storedRepo = GitHubRepoStorage.getCurrentRepo();
    if (storedRepo) {
      setCurrentRepo(storedRepo);
    }
  }, []);

  const handleFileSelect = async (path: string) => {
    setSelectedFilePath(path);
    
    // Check if file is already loaded
    const existingFile = files.find(f => f.name === path);
    if (existingFile) {
      setSelectedFile(path);
      return;
    }

    // Load file from GitHub
    const fileContent = await loadFile(path);
    if (fileContent) {
      // Add or update file in Monaco editor
      const existingIndex = files.findIndex(f => f.name === fileContent.name);
      if (existingIndex >= 0) {
        updateFile(fileContent.name, fileContent.content);
      } else {
        addFile(fileContent.name, fileContent.content, fileContent.type);
      }
      setSelectedFile(fileContent.name);
    }
  };

  const handleRepoChange = (repo: CurrentRepoReference | null) => {
    setCurrentRepo(repo);
    // Clear selected file when repo changes
    setSelectedFilePath(null);
  };

  return (
    <div className={className}>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* File Tree Sidebar */}
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
          <GitHubFileTree
            onFileSelect={handleFileSelect}
            onRepoChange={handleRepoChange}
            className="h-full"
          />
        </ResizablePanel>

        <ResizableHandle />

        {/* Monaco Editor */}
        <ResizablePanel defaultSize={75}>
          <div className="h-full flex flex-col">
            {/* Error Display */}
            {fileError && (
              <Alert variant="destructive" className="m-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fileError}</AlertDescription>
              </Alert>
            )}

            {/* Loading Indicator */}
            {fileLoading && (
              <div className="flex items-center gap-2 p-2 bg-gray-900/50 border-b border-gray-700">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-sm text-gray-400">Loading file...</span>
              </div>
            )}

            {/* Editor Info */}
            {currentRepo && selectedFilePath && (
              <div className="p-2 bg-gray-900/50 border-b border-gray-700 text-xs text-gray-400">
                <span className="font-mono">{currentRepo.fullName}</span>
                <span className="mx-2">/</span>
                <span className="font-mono">{selectedFilePath}</span>
                <span className="mx-2">@</span>
                <span>{currentRepo.branch}</span>
              </div>
            )}

            {/* Monaco Editor */}
            <div className="flex-1">
              {currentRepo ? (
                <MonacoCodeSpace
                  files={files}
                  selectedFile={selectedFilePath || undefined}
                  onFileSelect={setSelectedFile}
                  theme="vs-dark"
                  height="100%"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p className="text-lg mb-2">No repository open</p>
                    <p className="text-sm">Select a repository from the GitHub integration to browse files</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
