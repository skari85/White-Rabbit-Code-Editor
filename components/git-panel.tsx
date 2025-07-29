'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  GitMerge, 
  Plus, 
  Minus, 
  CheckCircle, 
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
  History,
  FileText,
  Users,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { 
  gitService, 
  GitStatus, 
  GitCommit as GitCommitType, 
  GitDiff, 
  GitBlame 
} from '@/lib/git-service';
import { cn } from '@/lib/utils';

interface GitPanelProps {
  className?: string;
  onFileSelect?: (file: string) => void;
}

export function GitPanel({ className, onFileSelect }: GitPanelProps) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommitType[]>([]);
  const [diffs, setDiffs] = useState<GitDiff[]>([]);
  const [blame, setBlame] = useState<GitBlame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showCommitDialog, setShowCommitDialog] = useState(false);

  // Load git status
  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const gitStatus = await gitService.getStatus();
      setStatus(gitStatus);
    } catch (error) {
      console.error('Failed to load git status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load commits
  const loadCommits = useCallback(async () => {
    try {
      const gitCommits = await gitService.getCommits(20);
      setCommits(gitCommits);
    } catch (error) {
      console.error('Failed to load commits:', error);
    }
  }, []);

  // Load diffs
  const loadDiffs = useCallback(async () => {
    try {
      const gitDiffs = await gitService.getDiff();
      setDiffs(gitDiffs);
    } catch (error) {
      console.error('Failed to load diffs:', error);
    }
  }, []);

  // Load blame for selected file
  const loadBlame = useCallback(async (file: string) => {
    try {
      const gitBlame = await gitService.getBlame(file);
      setBlame(gitBlame);
    } catch (error) {
      console.error('Failed to load blame:', error);
    }
  }, []);

  // Stage file
  const stageFile = useCallback(async (file: string) => {
    try {
      await gitService.stageFile(file);
      await loadStatus();
      await loadDiffs();
    } catch (error) {
      console.error('Failed to stage file:', error);
    }
  }, [loadStatus, loadDiffs]);

  // Unstage file
  const unstageFile = useCallback(async (file: string) => {
    try {
      await gitService.unstageFile(file);
      await loadStatus();
      await loadDiffs();
    } catch (error) {
      console.error('Failed to unstage file:', error);
    }
  }, [loadStatus, loadDiffs]);

  // Commit changes
  const commitChanges = useCallback(async () => {
    if (!commitMessage.trim()) return;
    
    try {
      await gitService.commit(commitMessage);
      setCommitMessage('');
      setShowCommitDialog(false);
      await loadStatus();
      await loadCommits();
    } catch (error) {
      console.error('Failed to commit changes:', error);
    }
  }, [commitMessage, loadStatus, loadCommits]);

  // Push changes
  const pushChanges = useCallback(async () => {
    try {
      await gitService.push();
      await loadStatus();
    } catch (error) {
      console.error('Failed to push changes:', error);
    }
  }, [loadStatus]);

  // Pull changes
  const pullChanges = useCallback(async () => {
    try {
      await gitService.pull();
      await loadStatus();
      await loadCommits();
    } catch (error) {
      console.error('Failed to pull changes:', error);
    }
  }, [loadStatus, loadCommits]);

  // Initialize data
  useEffect(() => {
    if (gitService.isAvailable()) {
      loadStatus();
      loadCommits();
      loadDiffs();
    }
  }, [loadStatus, loadCommits, loadDiffs]);

  if (!gitService.isAvailable()) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Git
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-400">Git not available</p>
            <p className="text-xs text-gray-500 mt-1">
              Install Git to enable version control features
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Git
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadStatus}
              disabled={isLoading}
              className="w-6 h-6 p-0"
            >
              <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
        
        {status && (
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-xs">
              {status.branch}
            </Badge>
            {status.ahead > 0 && (
              <Badge variant="secondary" className="text-xs">
                ↑{status.ahead}
              </Badge>
            )}
            {status.behind > 0 && (
              <Badge variant="secondary" className="text-xs">
                ↓{status.behind}
              </Badge>
            )}
            {status.isClean && (
              <Badge variant="outline" className="text-xs text-green-400">
                Clean
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="changes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="changes" className="text-xs">Changes</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
            <TabsTrigger value="blame" className="text-xs">Blame</TabsTrigger>
          </TabsList>

          <TabsContent value="changes" className="mt-3">
            <div className="space-y-3">
              {/* Staged Changes */}
              {status?.staged.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-medium">Staged</span>
                    <Badge variant="secondary" className="text-xs">
                      {status.staged.length}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {status.staged.map((file) => (
                      <div
                        key={file}
                        className="flex items-center justify-between p-2 bg-green-500/10 rounded text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3" />
                          <span className="truncate">{file}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unstageFile(file)}
                          className="w-4 h-4 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unstaged Changes */}
              {status?.unstaged.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-3 h-3 text-orange-400" />
                    <span className="text-xs font-medium">Modified</span>
                    <Badge variant="secondary" className="text-xs">
                      {status.unstaged.length}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {status.unstaged.map((file) => (
                      <div
                        key={file}
                        className="flex items-center justify-between p-2 bg-orange-500/10 rounded text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3" />
                          <span className="truncate">{file}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => stageFile(file)}
                          className="w-4 h-4 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Untracked Files */}
              {status?.untracked.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-3 h-3 text-blue-400" />
                    <span className="text-xs font-medium">Untracked</span>
                    <Badge variant="secondary" className="text-xs">
                      {status.untracked.length}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {status.untracked.map((file) => (
                      <div
                        key={file}
                        className="flex items-center justify-between p-2 bg-blue-500/10 rounded text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3" />
                          <span className="truncate">{file}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => stageFile(file)}
                          className="w-4 h-4 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex-1" disabled={!status?.staged.length}>
                      <GitCommit className="w-3 h-3 mr-1" />
                      Commit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Commit Changes</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Commit message..."
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && commitChanges()}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCommitDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={commitChanges} disabled={!commitMessage.trim()}>
                          Commit
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button size="sm" variant="outline" onClick={pushChanges}>
                  <Upload className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={pullChanges}>
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-3">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {commits.map((commit) => (
                  <div
                    key={commit.hash}
                    className="p-2 border rounded text-xs hover:bg-gray-800/50 cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <GitCommit className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-400">
                            {commit.hash.substring(0, 7)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {commit.author}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed">{commit.message}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{commit.date.toLocaleDateString()}</span>
                          {commit.files.length > 0 && (
                            <>
                              <FileText className="w-3 h-3" />
                              <span>{commit.files.length} files</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="blame" className="mt-3">
            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-2">
                Select a file to view blame information
              </div>
              {selectedFile && blame.length > 0 && (
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {blame.map((line, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-1 text-xs hover:bg-gray-800/50"
                      >
                        <span className="w-12 text-right text-gray-500">
                          {line.line}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-400">
                              {line.hash.substring(0, 7)}
                            </span>
                            <span className="text-xs">{line.author}</span>
                            <span className="text-xs text-gray-500">
                              {line.date.toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300">{line.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default GitPanel; 