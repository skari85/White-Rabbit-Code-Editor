'use client';

import { useState, useEffect } from 'react';
import { GitHubConnectButton } from './github-connect-button';
import { GitHubRepoPicker } from './github-repo-picker';
import { GitHubOAuth } from '@/lib/github-oauth';
import { Card, CardContent } from '@/components/ui/card';

interface GitHubIntegrationProps {
  className?: string;
  showRepoPicker?: boolean;
}

/**
 * Complete GitHub Integration Component
 * 
 * Shows Connect GitHub button when not authenticated,
 * and repo picker when authenticated.
 */
export function GitHubIntegration({ className, showRepoPicker = true }: GitHubIntegrationProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Listen for storage changes (e.g., when user logs in from another tab)
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const checkAuth = () => {
    setIsAuthenticated(GitHubOAuth.isAuthenticated());
    setIsLoading(false);
  };

  const handleConnect = () => {
    checkAuth();
  };

  const handleDisconnect = () => {
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <GitHubConnectButton 
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      </div>
      
      {isAuthenticated && showRepoPicker && (
        <GitHubRepoPicker />
      )}
    </div>
  );
}
