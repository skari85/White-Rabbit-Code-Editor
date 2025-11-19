'use client';

import { useState, useEffect, useRef } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { GitHubFileTree } from './github-file-tree';
import MonacoCodeSpace from './monaco-code-space';
import { GitHubCommitDialog } from './github-commit-dialog';
import { GitHubBranchSwitcher } from './github-branch-switcher';
import { useGitHubFileLoader } from '@/hooks/use-github-file-loader';
import { useCodeBuilder } from '@/hooks/use-code-builder';
import { GitHubRepoStorage, CurrentRepoReference } from '@/lib/github-repo-storage';
import { GitHubClient } from '@/lib/github-client';
import { GitHubOAuth } from '@/lib/github-oauth';
import { AlertCircle, Loader2, GitCommit, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [committing, setCommitting] = useState(false);
  const { loadFile, loading: fileLoading, error: fileError } = useGitHubFileLoader();
  const { files, addFile, updateFile, setSelectedFile } = useCodeBuilder();
  
  // Track original file contents to detect changes
  const originalFilesRef = useRef<Map<string, string>>(new Map());

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
      // Store original content for change detection
      originalFilesRef.current.set(fileContent.name, fileContent.content);
      
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

  // Track file changes from Monaco editor
  const handleFileUpdate = (filename: string, content: string) => {
    updateFile(filename, content);
    // Note: We don't update originalFilesRef here - it stays as the loaded version
  };

  // Get modified files
  const getModifiedFiles = () => {
    const modified: Array<{ path: string; content: string; sha?: string }> = [];
    
    for (const file of files) {
      const original = originalFilesRef.current.get(file.name);
      if (original !== undefined && original !== file.content) {
        modified.push({
          path: file.name,
          content: file.content,
        });
      }
    }
    
    return modified;
  };

  // Quick save single file
  const handleQuickSave = async () => {
    if (!selectedFilePath || !currentRepo) {
      toast.error('No file selected');
      return;
    }

    const file = files.find(f => f.name === selectedFilePath);
    if (!file) {
      toast.error('File not found');
      return;
    }

    const original = originalFilesRef.current.get(selectedFilePath);
    if (original === file.content) {
      toast.info('No changes to save');
      return;
    }

    setCommitting(true);

    try {
      const token = GitHubOAuth.getToken();
      if (!token) {
        toast.error('Not authenticated. Please reconnect to GitHub.');
        return;
      }

      const client = new GitHubClient(token);
      
      // Get SHA for update
      const sha = await client.getFileSha(
        currentRepo.fullName,
        selectedFilePath,
        currentRepo.branch
      );

      // Commit with default message
      const commitMessage = `Update ${selectedFilePath}`;
      
      await client.createOrUpdateFile(
        currentRepo.fullName,
        selectedFilePath,
        file.content,
        commitMessage,
        currentRepo.branch,
        sha || undefined
      );

      // Update original content
      originalFilesRef.current.set(selectedFilePath, file.content);
      
      toast.success('Committed to GitHub', {
        description: `${selectedFilePath} has been saved`,
      });
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save file';
      
      if (errorMessage.includes('rate limit')) {
        toast.error('GitHub API rate limit exceeded', {
          description: 'Please try again later',
        });
      } else if (errorMessage.includes('Authentication failed')) {
        toast.error('Authentication failed', {
          description: 'Please reconnect to GitHub',
        });
      } else if (errorMessage.includes('merge conflict') || errorMessage.includes('conflict')) {
        toast.error('Merge conflict detected', {
          description: 'Please pull latest changes first',
        });
      } else {
        toast.error('Failed to save file', {
          description: errorMessage,
        });
      }
    } finally {
      setCommitting(false);
    }
  };

  // Commit with dialog (for multiple files or custom message)
  const handleCommit = () => {
    const modified = getModifiedFiles();
    if (modified.length === 0) {
      toast.info('No changes to commit');
      return;
    }
    setShowCommitDialog(true);
  };

  const handleCommitSuccess = () => {
    // Update original files after successful commit
    const modified = getModifiedFiles();
    for (const file of modified) {
      originalFilesRef.current.set(file.path, file.content);
    }
    
    // Clear the modified files list by updating refs
    // (The files array will still have new content, but originalFilesRef will match)
    toast.success('Committed to GitHub', {
      description: `${modified.length} file${modified.length !== 1 ? 's' : ''} committed`,
    });
  };

  const handleBranchChange = () => {
    // Clear original files when branch changes
    originalFilesRef.current.clear();
    // Reload current file if selected
    if (selectedFilePath && currentRepo) {
      handleFileSelect(selectedFilePath);
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

            {/* Toolbar */}
            {currentRepo && (
              <div className="p-2 bg-gray-900/50 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>
                    <span className="font-mono">{currentRepo.fullName}</span>
                    {selectedFilePath && (
                      <>
                        <span className="mx-2">/</span>
                        <span className="font-mono">{selectedFilePath}</span>
                      </>
                    )}
                    <span className="mx-2">@</span>
                    <span>{currentRepo.branch}</span>
                  </div>
                  <GitHubBranchSwitcher onBranchChange={handleBranchChange} />
                </div>
                <div className="flex items-center gap-2">
                  {getModifiedFiles().length > 0 && (
                    <span className="text-xs text-yellow-400">
                      {getModifiedFiles().length} unsaved change{getModifiedFiles().length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {selectedFilePath && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleQuickSave}
                      disabled={committing || !files.find(f => f.name === selectedFilePath)}
                    >
                      {committing ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  )}
                  {getModifiedFiles().length > 0 && (
                    <Button
                      size="sm"
                      onClick={handleCommit}
                      disabled={committing}
                    >
                      <GitCommit className="w-3 h-3 mr-1" />
                      Commit
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Monaco Editor */}
            <div className="flex-1">
              {currentRepo ? (
                <MonacoCodeSpace
                  files={files}
                  selectedFile={selectedFilePath || undefined}
                  onFileSelect={setSelectedFile}
                  onFileUpdate={handleFileUpdate}
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

      {/* Commit Dialog */}
      <GitHubCommitDialog
        open={showCommitDialog}
        onOpenChange={setShowCommitDialog}
        files={getModifiedFiles()}
        onSuccess={handleCommitSuccess}
      />
    </div>
  );
}
