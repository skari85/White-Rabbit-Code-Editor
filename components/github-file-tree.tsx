'use client';

import { useState, useEffect, useMemo, useCallback, ReactElement } from 'react';
import { 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { GitHubClient, GitHubTreeItem } from '@/lib/github-client';
import { GitHubOAuth } from '@/lib/github-oauth';
import { GitHubRepoStorage, CurrentRepoReference } from '@/lib/github-repo-storage';
import { cn } from '@/lib/utils';

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: Map<string, FileTreeNode>;
  size?: number;
}

interface GitHubFileTreeProps {
  className?: string;
  onFileSelect?: (path: string) => void;
  onRepoChange?: (repo: CurrentRepoReference | null) => void;
}

export function GitHubFileTree({ className, onFileSelect, onRepoChange }: GitHubFileTreeProps) {
  const [tree, setTree] = useState<FileTreeNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [currentRepo, setCurrentRepo] = useState<CurrentRepoReference | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  useEffect(() => {
    // Load current repo from storage
    const storedRepo = GitHubRepoStorage.getCurrentRepo();
    if (storedRepo) {
      setCurrentRepo(storedRepo);
      loadTree(storedRepo.fullName, storedRepo.branch);
    }
  }, []);

  // Listen for storage changes (when repo is opened from another component)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedRepo = GitHubRepoStorage.getCurrentRepo();
      if (storedRepo && (!currentRepo || storedRepo.fullName !== currentRepo.fullName)) {
        setCurrentRepo(storedRepo);
        loadTree(storedRepo.fullName, storedRepo.branch);
      } else if (!storedRepo && currentRepo) {
        // Repo was closed
        setCurrentRepo(null);
        setTree(null);
        setSelectedPath(null);
        onRepoChange?.(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check on focus (for same-tab updates)
    window.addEventListener('focus', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, [currentRepo, onRepoChange]);

  const buildTree = (items: GitHubTreeItem[]): FileTreeNode => {
    const root: FileTreeNode = {
      name: '',
      path: '',
      type: 'folder',
      children: new Map(),
    };

    for (const item of items) {
      const parts = item.path.split('/');
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join('/');

        if (!current.children.has(part)) {
          current.children.set(part, {
            name: part,
            path: currentPath,
            type: isLast ? (item.type === 'blob' ? 'file' : 'folder') : 'folder',
            children: new Map(),
            size: item.size,
          });
        }

        current = current.children.get(part)!;
      }
    }

    return root;
  };

  const loadTree = async (repo: string, branch: string) => {
    const token = GitHubOAuth.getToken();
    if (!token) {
      setError('Not authenticated. Please connect to GitHub first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new GitHubClient(token);
      const treeData = await client.getTree(repo, branch, true);

      if (treeData.truncated) {
        console.warn('Tree was truncated. Some files may not be displayed.');
      }

      const fileTree = buildTree(treeData.tree);
      setTree(fileTree);
      
      // Expand root by default
      setExpandedPaths(new Set(['']));
    } catch (err) {
      console.error('Failed to load file tree:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load file tree';
      setError(errorMessage);
      
      // Handle specific errors
      if (errorMessage.includes('rate limit')) {
        setError('GitHub API rate limit exceeded. Please try again later.');
      } else if (errorMessage.includes('Authentication failed')) {
        setError('Authentication failed. Please reconnect to GitHub.');
      } else if (errorMessage.includes('not found')) {
        setError('Repository or branch not found.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRepo = useCallback((repo: string, branch: string) => {
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      setError('Invalid repository format. Expected: owner/repo');
      return;
    }

    GitHubRepoStorage.setCurrentRepo(owner, repoName, branch);
    const repoRef: CurrentRepoReference = { owner, repo: repoName, branch, fullName: repo };
    setCurrentRepo(repoRef);
    setSelectedPath(null);
    setError(null);
    onRepoChange?.(repoRef);
    loadTree(repo, branch);
  }, [onRepoChange]);

  const handleCloseRepo = () => {
    GitHubRepoStorage.clearCurrentRepo();
    setCurrentRepo(null);
    setTree(null);
    setSelectedPath(null);
    onRepoChange?.(null);
  };

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = (path: string) => {
    setSelectedPath(path);
    onFileSelect?.(path);
  };

  const renderNode = (node: FileTreeNode, level: number = 0): ReactElement[] => {
    const elements: ReactElement[] = [];
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedPath === node.path;

    if (node.path !== '') {
      // Don't render root node
      const isFolder = node.type === 'folder';
      const hasChildren = node.children.size > 0;

      elements.push(
        <div
          key={node.path}
          className={cn(
            'flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-800/50 rounded text-sm',
            isSelected && 'bg-blue-900/30',
            level > 0 && 'ml-4'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (isFolder) {
              toggleExpand(node.path);
            } else {
              handleFileClick(node.path);
            }
          }}
        >
          {isFolder ? (
            <>
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )
              ) : (
                <div className="w-4 h-4" />
              )}
              <Folder className="w-4 h-4 text-blue-400" />
            </>
          ) : (
            <>
              <div className="w-4 h-4" />
              <File className="w-4 h-4 text-gray-400" />
            </>
          )}
          <span className="flex-1 truncate text-gray-300">{node.name}</span>
          {node.size !== undefined && (
            <span className="text-xs text-gray-500">
              {(node.size / 1024).toFixed(1)} KB
            </span>
          )}
        </div>
      );
    }

    if (isExpanded && hasChildren) {
      const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
        // Folders first, then files, both alphabetically
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      for (const child of sortedChildren) {
        elements.push(...renderNode(child, level + 1));
      }
    }

    return elements;
  };

  if (!currentRepo) {
    return (
      <div className={cn('p-4 text-center text-gray-400', className)}>
        <p className="text-sm">No repository open</p>
        <p className="text-xs mt-1">Select a repository to browse files</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-3 border-b border-gray-700 bg-gray-900/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {currentRepo.fullName}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {currentRepo.branch}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadTree(currentRepo.fullName, currentRepo.branch)}
              disabled={loading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseRepo}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {error && (
          <div className="p-3 m-2 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : tree ? (
          <ScrollArea className="h-full">
            <div className="p-2">
              {renderNode(tree)}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-4 text-center text-gray-400 text-sm">
            No files found
          </div>
        )}
      </div>
    </div>
  );
}
