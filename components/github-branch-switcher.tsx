'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { GitBranch, Plus, Loader2, AlertCircle } from 'lucide-react';
import { GitHubClient, GitHubBranch } from '@/lib/github-client';
import { GitHubOAuth } from '@/lib/github-oauth';
import { GitHubRepoStorage } from '@/lib/github-repo-storage';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GitHubBranchSwitcherProps {
  className?: string;
  onBranchChange?: (branch: string) => void;
}

export function GitHubBranchSwitcher({ className, onBranchChange }: GitHubBranchSwitcherProps) {
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [creating, setCreating] = useState(false);

  const currentRepo = GitHubRepoStorage.getCurrentRepo();

  useEffect(() => {
    if (currentRepo) {
      setCurrentBranch(currentRepo.branch);
      loadBranches();
    }
  }, [currentRepo]);

  const loadBranches = async () => {
    if (!currentRepo) return;

    const token = GitHubOAuth.getToken();
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new GitHubClient(token);
      const repoBranches = await client.listBranches(currentRepo.fullName);
      setBranches(repoBranches);
    } catch (err) {
      console.error('Failed to load branches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = async (branch: string) => {
    if (!currentRepo) return;

    setLoading(true);
    setError(null);

    try {
      // Update storage
      GitHubRepoStorage.setCurrentRepo(
        currentRepo.owner,
        currentRepo.repo,
        branch
      );

      setCurrentBranch(branch);
      onBranchChange?.(branch);

      // Reload file tree by triggering storage event
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Failed to switch branch:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch branch');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim() || !currentRepo) return;

    const token = GitHubOAuth.getToken();
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const client = new GitHubClient(token);
      await client.createBranch(
        currentRepo.fullName,
        newBranchName.trim(),
        currentBranch
      );

      // Refresh branches and switch to new branch
      await loadBranches();
      await handleBranchChange(newBranchName.trim());
      
      setShowCreateDialog(false);
      setNewBranchName('');
    } catch (err) {
      console.error('Failed to create branch:', err);
      setError(err instanceof Error ? err.message : 'Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  if (!currentRepo) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-gray-400" />
        <Select
          value={currentBranch}
          onValueChange={handleBranchChange}
          disabled={loading}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.name} value={branch.name}>
                <div className="flex items-center gap-2">
                  {branch.name}
                  {branch.protected && (
                    <span className="text-xs text-gray-500">(protected)</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          disabled={loading}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadBranches}
          disabled={loading}
        >
          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Create Branch Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
            <DialogDescription>
              Create a new branch from <span className="font-mono">{currentBranch}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="branch-name">Branch Name</Label>
              <Input
                id="branch-name"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="feature/new-feature"
                className="font-mono mt-1"
                disabled={creating}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !creating) {
                    handleCreateBranch();
                  }
                }}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewBranchName('');
                setError(null);
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBranch}
              disabled={creating || !newBranchName.trim()}
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Branch'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
