'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Github, 
  Loader2, 
  Search, 
  GitBranch,
  Lock,
  Globe,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { GitHubClient, GitHubRepository, GitHubBranch } from '@/lib/github-client';
import { GitHubOAuth } from '@/lib/github-oauth';
import { GitHubRepoStorage } from '@/lib/github-repo-storage';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OpenProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectOpen?: (repo: string, branch: string) => void;
}

type Step = 'repos' | 'branches' | 'loading';

export function OpenProjectDialog({
  open,
  onOpenChange,
  onProjectOpen,
}: OpenProjectDialogProps) {
  const [step, setStep] = useState<Step>('repos');
  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setStep('repos');
      setSelectedRepo(null);
      setSelectedBranch('');
      setSearchQuery('');
      setError(null);
      loadRepos();
    }
  }, [open]);

  const loadRepos = async () => {
    const token = GitHubOAuth.getToken();
    if (!token) {
      setError('Not authenticated. Please connect to GitHub first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new GitHubClient(token);
      const allRepos = await client.listAllRepos();
      setRepos(allRepos);
    } catch (err) {
      console.error('Failed to load repositories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async (repo: GitHubRepository) => {
    const token = GitHubOAuth.getToken();
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new GitHubClient(token);
      const repoBranches = await client.listBranches(repo.full_name);
      setBranches(repoBranches);
      setSelectedRepo(repo);
      setSelectedBranch(repo.default_branch);
      setStep('branches');
    } catch (err) {
      console.error('Failed to load branches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = async () => {
    if (!selectedRepo || !selectedBranch) {
      setError('Please select a repository and branch');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('loading');

    try {
      // Store lightweight reference
      GitHubRepoStorage.setLastProject(selectedRepo.full_name, selectedBranch);
      
      // Also set as current repo (for compatibility with existing components)
      const [owner, repo] = selectedRepo.full_name.split('/');
      GitHubRepoStorage.setCurrentRepo(owner, repo, selectedBranch);

      // Trigger storage event to notify other components
      window.dispatchEvent(new Event('storage'));

      // Call callback
      onProjectOpen?.(selectedRepo.full_name, selectedBranch);

      // Close dialog after a short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    } catch (err) {
      console.error('Failed to open project:', err);
      setError(err instanceof Error ? err.message : 'Failed to open project');
      setStep('branches');
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = repos.filter(repo => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.full_name.toLowerCase().includes(query) ||
      (repo.description && repo.description.toLowerCase().includes(query))
    );
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Open Project from GitHub
          </DialogTitle>
          <DialogDescription>
            Select a repository and branch to open
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Step Indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`flex items-center gap-1 ${step === 'repos' ? 'text-blue-400' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                step === 'repos' ? 'bg-blue-500 text-white' : 'bg-gray-700'
              }`}>
                1
              </div>
              <span>Repository</span>
            </div>
            <div className="w-8 h-px bg-gray-700" />
            <div className={`flex items-center gap-1 ${step === 'branches' ? 'text-blue-400' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                step === 'branches' ? 'bg-blue-500 text-white' : 'bg-gray-700'
              }`}>
                2
              </div>
              <span>Branch</span>
            </div>
            <div className="w-8 h-px bg-gray-700" />
            <div className={`flex items-center gap-1 ${step === 'loading' ? 'text-blue-400' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                step === 'loading' ? 'bg-blue-500 text-white' : 'bg-gray-700'
              }`}>
                {step === 'loading' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  '3'
                )}
              </div>
              <span>Open</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Repository Selection */}
          {step === 'repos' && (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Repositories List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Github className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No repositories found</p>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-2">
                    {filteredRepos.map((repo) => (
                      <div
                        key={repo.id}
                        className="p-4 rounded-lg border cursor-pointer transition-colors bg-gray-900/50 border-gray-700 hover:bg-gray-800/50"
                        onClick={() => loadBranches(repo)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-white truncate">
                                {repo.name}
                              </h3>
                              {repo.private ? (
                                <Badge variant="secondary" className="bg-gray-800">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Private
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-800">
                                  <Globe className="w-3 h-3 mr-1" />
                                  Public
                                </Badge>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                                {repo.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{repo.full_name}</span>
                              {repo.language && (
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                  {repo.language}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadBranches(repo);
                            }}
                          >
                            Next →
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </>
          )}

          {/* Step 2: Branch Selection */}
          {step === 'branches' && selectedRepo && (
            <>
              <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Github className="w-4 h-4 text-gray-400" />
                  <span className="font-mono text-sm">{selectedRepo.full_name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep('repos');
                    setSelectedRepo(null);
                    setSelectedBranch('');
                  }}
                  className="text-xs"
                >
                  ← Change repository
                </Button>
              </div>

              <div>
                <Label htmlFor="branch">Select Branch</Label>
                <Select
                  value={selectedBranch}
                  onValueChange={setSelectedBranch}
                  disabled={loading}
                >
                  <SelectTrigger id="branch" className="mt-1">
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.name} value={branch.name}>
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4" />
                          {branch.name}
                          {branch.protected && (
                            <Badge variant="outline" className="text-xs">
                              protected
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('repos');
                    setSelectedRepo(null);
                    setSelectedBranch('');
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleOpenProject}
                  disabled={!selectedBranch || loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Open Project
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
              <p className="text-gray-400">Opening project...</p>
              <p className="text-xs text-gray-500 mt-2">
                Loading repository tree
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
