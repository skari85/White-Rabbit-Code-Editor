'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Github, 
  Lock, 
  Globe, 
  Loader2, 
  Search, 
  RefreshCw,
  AlertCircle,
  GitBranch,
  FileText
} from 'lucide-react';
import { GitHubClient, GitHubRepository, GitHubBranch, GitHubFile } from '@/lib/github-client';
import { GitHubOAuth } from '@/lib/github-oauth';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GitHubRepoPickerProps {
  className?: string;
  onRepoSelect?: (repo: GitHubRepository) => void;
  onBranchSelect?: (repo: string, branch: string) => void;
  onFileSelect?: (repo: string, branch: string, file: GitHubFile) => void;
  onOpenRepo?: (repo: string, branch: string) => void;
}

export function GitHubRepoPicker({ 
  className, 
  onRepoSelect,
  onBranchSelect,
  onFileSelect,
  onOpenRepo
}: GitHubRepoPickerProps) {
  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<{ remaining: number; limit: number } | null>(null);

  useEffect(() => {
    loadRepos();
  }, []);

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
      
      // Update rate limit info
      const rateLimitInfo = client.getRateLimit();
      if (rateLimitInfo) {
        setRateLimit({
          remaining: rateLimitInfo.remaining,
          limit: rateLimitInfo.limit,
        });
      }
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

    setLoadingBranches(true);
    setError(null);

    try {
      const client = new GitHubClient(token);
      const repoBranches = await client.listBranches(repo.full_name);
      setBranches(repoBranches);
      setSelectedRepo(repo);
      setSelectedBranch(null);
      setFiles([]);
      onRepoSelect?.(repo);
    } catch (err) {
      console.error('Failed to load branches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load branches');
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadFiles = async (repo: GitHubRepository, branch: string) => {
    const token = GitHubOAuth.getToken();
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setLoadingFiles(true);
    setError(null);

    try {
      const client = new GitHubClient(token);
      const repoFiles = await client.listFiles(repo.full_name, branch);
      setFiles(repoFiles);
      setSelectedBranch(branch);
      onBranchSelect?.(repo.full_name, branch);
    } catch (err) {
      console.error('Failed to load files:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoadingFiles(false);
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

  return (
    <div className={className}>
      <Card className="bg-gray-950 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Github className="w-5 h-5" />
                GitHub Repositories
              </CardTitle>
              <CardDescription className="mt-1">
                Browse and select repositories from your GitHub account
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {rateLimit && (
                <Badge variant="outline" className="text-xs">
                  {rateLimit.remaining} / {rateLimit.limit} API calls
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={loadRepos}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

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
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      selectedRepo?.id === repo.id
                        ? 'bg-blue-900/20 border-blue-700'
                        : 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/50'
                    }`}
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
                          <span>⭐ {repo.stargazers_count}</span>
                          <span>🍴 {repo.forks_count}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadBranches(repo)}
                          className="text-xs"
                        >
                          Browse
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            onOpenRepo?.(repo.full_name, repo.default_branch);
                            loadBranches(repo);
                          }}
                          className="text-xs"
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Branches */}
          {selectedRepo && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Branches
                </h4>
                {loadingBranches && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
              </div>
              {branches.length === 0 && !loadingBranches ? (
                <p className="text-sm text-gray-400">No branches found</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {branches.map((branch) => (
                    <Button
                      key={branch.name}
                      variant={selectedBranch === branch.name ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => loadFiles(selectedRepo, branch.name)}
                      disabled={loadingFiles}
                      className="text-xs"
                    >
                      {branch.name}
                      {branch.protected && (
                        <Lock className="w-3 h-3 ml-1" />
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Files */}
          {selectedRepo && selectedBranch && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Files ({files.length})
                </h4>
                {loadingFiles && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
              </div>
              {files.length === 0 && !loadingFiles ? (
                <p className="text-sm text-gray-400">No files found</p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-1">
                    {files.map((file) => (
                      <div
                        key={file.sha}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-800/50 cursor-pointer text-sm"
                        onClick={() => onFileSelect?.(selectedRepo.full_name, selectedBranch, file)}
                      >
                        {file.type === 'dir' ? (
                          <FileText className="w-4 h-4 text-blue-400" />
                        ) : (
                          <FileText className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-gray-300">{file.name}</span>
                        {file.type === 'file' && (
                          <span className="text-xs text-gray-500 ml-auto">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
