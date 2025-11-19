'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { GitHubOAuth } from '@/lib/github-oauth';
import { GitHubRepoStorage } from '@/lib/github-repo-storage';
import { Github, CheckCircle2 } from 'lucide-react';

/**
 * Shows "Connected to GitHub as {username}" indicator
 */
export function GitHubStatusIndicator({ className }: { className?: string }) {
  const [user, setUser] = useState<{ login: string; name: string } | null>(null);
  const [currentRepo, setCurrentRepo] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = () => {
      const isAuthenticated = GitHubOAuth.isAuthenticated();
      if (isAuthenticated) {
        const userData = GitHubOAuth.getUser();
        setUser(userData);
      } else {
        setUser(null);
      }

      const repo = GitHubRepoStorage.getCurrentRepo();
      setCurrentRepo(repo?.fullName || null);
    };

    checkStatus();

    // Listen for storage changes
    const handleStorageChange = () => {
      checkStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', checkStatus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', checkStatus);
    };
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="outline" className="bg-green-900/20 border-green-700 text-green-400">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        <Github className="w-3 h-3 mr-1" />
        Connected as {user.login}
      </Badge>
      {currentRepo && (
        <Badge variant="outline" className="text-xs">
          {currentRepo}
        </Badge>
      )}
    </div>
  );
}
