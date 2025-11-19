import { useState, useCallback } from 'react';
import { GitHubClient, GitHubClient as GitHubClientType } from '@/lib/github-client';
import { GitHubOAuth } from '@/lib/github-oauth';
import { GitHubRepoStorage } from '@/lib/github-repo-storage';
import { FileContent } from './use-code-builder';

interface UseGitHubFileLoaderReturn {
  loadFile: (path: string) => Promise<FileContent | null>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to load GitHub files into Monaco editor
 * 
 * Fetches file content from GitHub API, decodes base64,
 * and returns FileContent compatible with Monaco editor.
 */
export function useGitHubFileLoader(): UseGitHubFileLoaderReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (path: string): Promise<FileContent | null> => {
    const token = GitHubOAuth.getToken();
    if (!token) {
      setError('Not authenticated. Please connect to GitHub first.');
      return null;
    }

    const currentRepo = GitHubRepoStorage.getCurrentRepo();
    if (!currentRepo) {
      setError('No repository open. Please select a repository first.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new GitHubClient(token);
      
      // Fetch file content
      const fileContent = await client.getFileContents(
        currentRepo.fullName,
        path,
        currentRepo.branch
      );

      // Decode base64 content
      const decodedContent = GitHubClient.decodeContent(fileContent.content);

      // Create FileContent compatible with Monaco
      const file: FileContent = {
        name: path,
        content: decodedContent,
        type: getFileType(path),
      };

      return file;
    } catch (err) {
      console.error('Failed to load file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load file';
      setError(errorMessage);

      // Handle specific errors
      if (errorMessage.includes('rate limit')) {
        setError('GitHub API rate limit exceeded. Please try again later.');
      } else if (errorMessage.includes('Authentication failed')) {
        setError('Authentication failed. Please reconnect to GitHub.');
      } else if (errorMessage.includes('not found')) {
        setError(`File not found: ${path}`);
      } else if (errorMessage.includes('too large')) {
        setError('File is too large to display. GitHub API limit is 1MB.');
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loadFile, loading, error };
}

/**
 * Determine file type from extension
 */
function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const typeMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'sql': 'sql',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
  };

  return typeMap[ext || ''] || 'text';
}
