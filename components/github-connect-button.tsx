'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Github, LogOut, User, Loader2 } from 'lucide-react';
import { GitHubOAuth } from '@/lib/github-oauth';

interface GitHubConnectButtonProps {
  className?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function GitHubConnectButton({ className, onConnect, onDisconnect }: GitHubConnectButtonProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ login: string; name: string; avatar_url: string; email?: string } | null>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    const authenticated = GitHubOAuth.isAuthenticated();
    setIsAuthenticated(authenticated);
    
    if (authenticated) {
      const userData = GitHubOAuth.getUser();
      setUser(userData);
      
      // Optionally fetch repos
      try {
        setLoadingRepos(true);
        const reposData = await GitHubOAuth.getRepositories();
        setRepos(reposData);
      } catch (error) {
        console.error('Failed to fetch repositories:', error);
      } finally {
        setLoadingRepos(false);
      }
    }
    
    setIsLoading(false);
  };

  const handleLogin = async () => {
    try {
      await GitHubOAuth.login();
      // The redirect will happen, so we don't need to update state here
    } catch (error) {
      console.error('GitHub login error:', error);
      alert(error instanceof Error ? error.message : 'Failed to initiate GitHub login');
    }
  };

  const handleLogout = () => {
    GitHubOAuth.logout();
    setIsAuthenticated(false);
    setUser(null);
    setRepos([]);
    onDisconnect?.();
  };

  const handleRefreshRepos = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoadingRepos(true);
      const reposData = await GitHubOAuth.getRepositories();
      setRepos(reposData);
    } catch (error) {
      console.error('Failed to refresh repositories:', error);
      alert('Failed to fetch repositories');
    } finally {
      setLoadingRepos(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <Github className="w-3 h-3 mr-1" />
          Connected
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url} alt={user.name || user.login} />
                <AvatarFallback>
                  {user.name?.charAt(0) || user.login?.charAt(0) || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.name || user.login}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  @{user.login}
                </p>
                {user.email && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Repositories ({repos.length})
            </DropdownMenuLabel>
            <div className="max-h-48 overflow-y-auto">
              {loadingRepos ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : repos.length > 0 ? (
                repos.slice(0, 5).map((repo) => (
                  <DropdownMenuItem
                    key={repo.id}
                    className="cursor-pointer"
                    onClick={() => window.open(repo.html_url, '_blank')}
                  >
                    <Github className="w-3 h-3 mr-2" />
                    <span className="text-xs truncate">{repo.name}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-2 text-xs text-muted-foreground">
                  No repositories found
                </div>
              )}
            </div>
            {repos.length > 5 && (
              <DropdownMenuItem
                className="cursor-pointer text-xs"
                onClick={handleRefreshRepos}
              >
                View all repositories...
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Disconnect GitHub</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Button
      onClick={handleLogin}
      variant="outline"
      size="sm"
      className={`flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white border-gray-600 ${className}`}
    >
      <Github className="w-4 h-4" />
      Connect GitHub
    </Button>
  );
}
