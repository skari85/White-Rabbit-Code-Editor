'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, GitCommit, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { GitHubClient } from '@/lib/github-client';
import { GitHubOAuth } from '@/lib/github-oauth';
import { GitHubRepoStorage } from '@/lib/github-repo-storage';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileChange {
  path: string;
  content: string;
  sha?: string;
}

interface GitHubCommitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileChange[];
  onSuccess?: () => void;
}

export function GitHubCommitDialog({
  open,
  onOpenChange,
  files,
  onSuccess,
}: GitHubCommitDialogProps) {
  const [commitMessage, setCommitMessage] = useState('');
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [committingFile, setCommittingFile] = useState<string | null>(null);

  const currentRepo = GitHubRepoStorage.getCurrentRepo();

  useEffect(() => {
    if (open && currentRepo) {
      setBranch(currentRepo.branch);
      setCommitMessage('');
      setError(null);
      setSuccess(false);
    }
  }, [open, currentRepo]);

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      setError('Commit message is required');
      return;
    }

    if (!currentRepo) {
      setError('No repository selected');
      return;
    }

    const token = GitHubOAuth.getToken();
    if (!token) {
      setError('Not authenticated. Please reconnect to GitHub.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const client = new GitHubClient(token);

      // Commit each file
      for (const file of files) {
        setCommittingFile(file.path);

        // Get SHA if file exists (for updates)
        const sha = await client.getFileSha(
          currentRepo.fullName,
          file.path,
          branch
        );

        // Create or update file
        await client.createOrUpdateFile(
          currentRepo.fullName,
          file.path,
          file.content,
          commitMessage,
          branch,
          sha || undefined
        );
      }

      setSuccess(true);
      setCommittingFile(null);

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      console.error('Commit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to commit changes');
      setCommittingFile(null);
    } finally {
      setLoading(false);
    }
  };

  if (!currentRepo) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCommit className="w-5 h-5" />
            Commit Changes to GitHub
          </DialogTitle>
          <DialogDescription>
            Commit {files.length} file{files.length !== 1 ? 's' : ''} to{' '}
            <span className="font-mono">{currentRepo.fullName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Branch Selection */}
          <div>
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="font-mono mt-1"
              disabled={loading}
            />
          </div>

          {/* Commit Message */}
          <div>
            <Label htmlFor="message">Commit Message *</Label>
            <Textarea
              id="message"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Describe your changes..."
              className="mt-1 min-h-[100px]"
              disabled={loading}
            />
          </div>

          {/* Files to Commit */}
          <div>
            <Label>Files to Commit ({files.length})</Label>
            <ScrollArea className="h-[200px] mt-2 border rounded-lg p-2">
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center gap-2 text-sm p-2 bg-gray-900/50 rounded"
                  >
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="font-mono flex-1 truncate">{file.path}</span>
                    {committingFile === file.path && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    )}
                    {success && committingFile === file.path && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="bg-green-900/20 border-green-800">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">
                Changes committed successfully!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCommit}
            disabled={loading || !commitMessage.trim() || success}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Committing...
              </>
            ) : (
              <>
                <GitCommit className="w-4 h-4 mr-2" />
                Commit Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
