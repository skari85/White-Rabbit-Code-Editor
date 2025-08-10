"use client";

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitBranch, GitCommit, GitPullRequest, Upload, FileText } from 'lucide-react';
import { useTerminal } from '@/hooks/use-terminal';

interface GitPanelProps {
  className?: string;
}

export default function GitPanel({ className = '' }: GitPanelProps) {
  const terminal = useTerminal();
  const [commitMsg, setCommitMsg] = useState("");
  const session = useMemo(() => terminal.getActiveSession() || terminal.createSession('Git'), [terminal]);

  const run = async (cmd: string) => {
    await terminal.executeCommand(cmd, session as any);
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="border-b p-2 flex items-center gap-2">
        <GitBranch className="w-4 h-4" />
        <span className="text-sm">Git Basics</span>
      </div>

      <div className="p-3 space-y-3">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => run('git init')}>Init</Button>
          <Button size="sm" variant="outline" onClick={() => run('git status')}>Status</Button>
          <Button size="sm" variant="outline" onClick={() => run('git add .')}>Add All</Button>
          <Button size="sm" variant="outline" onClick={() => run('git branch')}>Branch</Button>
          <Button size="sm" variant="outline" onClick={() => run('git log -n 5')}>Log</Button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Commit message</label>
          <Input value={commitMsg} onChange={(e) => setCommitMsg(e.target.value)} placeholder="feat: add feature" />
          <Button size="sm" onClick={() => run(`git commit -m "${commitMsg || 'update'}"`)}>
            <GitCommit className="w-4 h-4 mr-1" /> Commit
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Push</label>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => run('git push origin main')}>
              <Upload className="w-4 h-4 mr-1" /> Push origin main
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Note: Git commands are simulated in this demo environment.</p>
        </div>
      </div>

      <div className="border-t mt-auto p-2 text-xs text-muted-foreground flex items-center gap-2">
        <FileText className="w-3 h-3" />
        <span>Use the Terminal tab to see command outputs.</span>
      </div>
    </div>
  );
}

/**
 * White Rabbit Code Editor - Git Panel Component
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 *
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 *
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  GitBranch,
  GitCommit,
  GitMerge,
  Plus,
  Minus,
  Upload,
  Download,
  RefreshCw,
  Settings,
  ChevronDown,
  Check,
  X,
  Clock,
  User,
  Calendar
} from 'lucide-react'
import { RealGitService, GitStatusResult, GitBranchInfo, GitCommitInfo } from '@/lib/real-git-service'
import { useAnalytics } from '@/hooks/use-analytics'

interface GitPanelProps {
  gitService: RealGitService
  onFileSelect?: (filepath: string) => void
  className?: string
}

export function GitPanel({ gitService, onFileSelect, className }: GitPanelProps) {
  const [status, setStatus] = useState<GitStatusResult | null>(null)
  const [branches, setBranches] = useState<GitBranchInfo[]>([])
  const [commits, setCommits] = useState<GitCommitInfo[]>([])
  const [currentBranch, setCurrentBranch] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [showCommitDialog, setShowCommitDialog] = useState(false)
  const [showBranchDialog, setShowBranchDialog] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [authorName, setAuthorName] = useState('White Rabbit User')
  const [authorEmail, setAuthorEmail] = useState('user@whiterabbit.dev')

  const { trackFeatureUsed } = useAnalytics()

  // Load Git status and information
  const refreshGitInfo = useCallback(async () => {
    setIsLoading(true)
    try {
      const [statusResult, branchesResult, commitsResult, currentBranchResult] = await Promise.all([
        gitService.status(),
        gitService.listBranches(),
        gitService.log({ depth: 10 }),
        gitService.getCurrentBranch()
      ])

      setStatus(statusResult)
      setBranches(branchesResult)
      setCommits(commitsResult)
      setCurrentBranch(currentBranchResult)
    } catch (error) {
      console.error('Failed to refresh Git info:', error)
    } finally {
      setIsLoading(false)
    }
  }, [gitService])

  // Initialize Git info on mount
  useEffect(() => {
    refreshGitInfo()
  }, [refreshGitInfo])

  // Stage file
  const handleStageFile = async (filepath: string) => {
    try {
      await gitService.add([filepath])
      await refreshGitInfo()
      trackFeatureUsed('git_stage_file')
    } catch (error) {
      console.error('Failed to stage file:', error)
    }
  }

  // Unstage file
  const handleUnstageFile = async (filepath: string) => {
    try {
      await gitService.reset([filepath])
      await refreshGitInfo()
      trackFeatureUsed('git_unstage_file')
    } catch (error) {
      console.error('Failed to unstage file:', error)
    }
  }

  // Stage all files
  const handleStageAll = async () => {
    if (!status) return
    try {
      const allFiles = [...status.unstaged, ...status.untracked]
      await gitService.add(allFiles)
      await refreshGitInfo()
      trackFeatureUsed('git_stage_all')
    } catch (error) {
      console.error('Failed to stage all files:', error)
    }
  }

  // Commit changes
  const handleCommit = async () => {
    if (!commitMessage.trim()) return

    try {
      await gitService.commit(commitMessage, {
        name: authorName,
        email: authorEmail
      })
      setCommitMessage('')
      setShowCommitDialog(false)
      await refreshGitInfo()
      trackFeatureUsed('git_commit')
    } catch (error) {
      console.error('Failed to commit:', error)
    }
  }

  // Create new branch
  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return

    try {
      await gitService.createBranch(newBranchName)
      await gitService.checkout(newBranchName)
      setNewBranchName('')
      setShowBranchDialog(false)
      await refreshGitInfo()
      trackFeatureUsed('git_create_branch')
    } catch (error) {
      console.error('Failed to create branch:', error)
    }
  }

  // Switch branch
  const handleSwitchBranch = async (branchName: string) => {
    try {
      await gitService.checkout(branchName)
      await refreshGitInfo()
      trackFeatureUsed('git_switch_branch')
    } catch (error) {
      console.error('Failed to switch branch:', error)
    }
  }

  // Push changes
  const handlePush = async () => {
    try {
      await gitService.push()
      trackFeatureUsed('git_push')
    } catch (error) {
      console.error('Failed to push:', error)
    }
  }

  // Pull changes
  const handlePull = async () => {
    try {
      await gitService.pull()
      await refreshGitInfo()
      trackFeatureUsed('git_pull')
    } catch (error) {
      console.error('Failed to pull:', error)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const getFileStatusIcon = (filepath: string) => {
    if (status?.staged.includes(filepath)) return <Check className="w-3 h-3 text-green-500" />
    if (status?.modified.includes(filepath)) return <Clock className="w-3 h-3 text-yellow-500" />
    if (status?.untracked.includes(filepath)) return <Plus className="w-3 h-3 text-blue-500" />
    if (status?.deleted.includes(filepath)) return <Minus className="w-3 h-3 text-red-500" />
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Git
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshGitInfo}
              disabled={isLoading}
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Branch */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            <span className="text-sm font-medium">{currentBranch}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {branches.map((branch) => (
                <DropdownMenuItem
                  key={branch.name}
                  onClick={() => handleSwitchBranch(branch.name)}
                  className="flex items-center gap-2"
                >
                  {branch.current && <Check className="w-3 h-3" />}
                  {branch.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Plus className="w-3 h-3 mr-2" />
                    New Branch
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Branch</DialogTitle>
                    <DialogDescription>
                      Create a new branch from the current branch
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Branch name"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateBranch()
                        }
                      }}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowBranchDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateBranch} disabled={!newBranchName.trim()}>
                        Create Branch
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Remote Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePull} className="flex-1">
            <Download className="w-3 h-3 mr-1" />
            Pull
          </Button>
          <Button variant="outline" size="sm" onClick={handlePush} className="flex-1">
            <Upload className="w-3 h-3 mr-1" />
            Push
          </Button>
        </div>

        <Separator />

        {/* Changes Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Changes</h4>
            {status && (status.unstaged.length > 0 || status.untracked.length > 0) && (
              <Button variant="ghost" size="sm" onClick={handleStageAll}>
                <Plus className="w-3 h-3 mr-1" />
                Stage All
              </Button>
            )}
          </div>

          <ScrollArea className="h-48">
            <div className="space-y-1">
              {/* Staged Files */}
              {status?.staged.map((filepath) => (
                <div
                  key={`staged-${filepath}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                  onClick={() => onFileSelect?.(filepath)}
                >
                  <div className="flex items-center gap-2">
                    {getFileStatusIcon(filepath)}
                    <span className="text-sm">{filepath}</span>
                    <Badge variant="secondary" className="text-xs">Staged</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnstageFile(filepath)
                    }}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              {/* Unstaged Files */}
              {status?.unstaged.map((filepath) => (
                <div
                  key={`unstaged-${filepath}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                  onClick={() => onFileSelect?.(filepath)}
                >
                  <div className="flex items-center gap-2">
                    {getFileStatusIcon(filepath)}
                    <span className="text-sm">{filepath}</span>
                    <Badge variant="outline" className="text-xs">Modified</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStageFile(filepath)
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              {/* Untracked Files */}
              {status?.untracked.map((filepath) => (
                <div
                  key={`untracked-${filepath}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                  onClick={() => onFileSelect?.(filepath)}
                >
                  <div className="flex items-center gap-2">
                    {getFileStatusIcon(filepath)}
                    <span className="text-sm">{filepath}</span>
                    <Badge variant="outline" className="text-xs">Untracked</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStageFile(filepath)
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              {status &&
               status.staged.length === 0 &&
               status.unstaged.length === 0 &&
               status.untracked.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No changes to commit
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Commit Section */}
        {status && status.staged.length > 0 && (
          <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <GitCommit className="w-4 h-4 mr-2" />
                Commit ({status.staged.length} files)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Commit Changes</DialogTitle>
                <DialogDescription>
                  Commit {status.staged.length} staged file(s)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Commit message"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Author name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                  />
                  <Input
                    placeholder="Author email"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCommitDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCommit} disabled={!commitMessage.trim()}>
                    Commit
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Separator />

        {/* Recent Commits */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Recent Commits</h4>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {commits.map((commit) => (
                <div key={commit.oid} className="p-2 rounded border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {commit.oid.substring(0, 7)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(commit.author.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{commit.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-3 h-3" />
                    <span className="text-xs text-muted-foreground">
                      {commit.author.name}
                    </span>
                  </div>
                </div>
              ))}
              {commits.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No commits yet
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
