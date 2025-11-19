'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderGit2, Github, Loader2, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import GitHubOAuth from '@/lib/githubOAuth';

type GitHubProfile = {
  login: string;
  avatar_url: string;
  html_url: string;
  name?: string;
};

type GitHubRepo = {
  id: number;
  name: string;
  html_url: string;
  private: boolean;
  description?: string;
};

const githubHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
});

export default function GitHubConnectCard() {
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const isLoading = status === 'loading';
  const isConnected = Boolean(profile);

  const visibleRepos = useMemo(() => repos.slice(0, 5), [repos]);

  const fetchGitHubData = useCallback(async () => {
    const token = GitHubOAuth.getToken();
    if (!token) return;

    setStatus('loading');
    setError(null);

    try {
      const [profileRes, reposRes] = await Promise.all([
        fetch('https://api.github.com/user', { headers: githubHeaders(token) }),
        fetch('https://api.github.com/user/repos?per_page=50&sort=updated', {
          headers: githubHeaders(token),
        }),
      ]);

      if (!profileRes.ok) {
        throw new Error('Unable to load GitHub profile');
      }
      if (!reposRes.ok) {
        throw new Error('Unable to load repositories');
      }

      const profileData = (await profileRes.json()) as GitHubProfile;
      const repoData = (await reposRes.json()) as GitHubRepo[];

      setProfile(profileData);
      setRepos(repoData);
      setStatus('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'GitHub request failed';
      setError(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const handled = await GitHubOAuth.handleRedirectCallback();
        const hasToken = GitHubOAuth.isAuthenticated();
        if ((handled || hasToken) && !ignore) {
          await fetchGitHubData();
        }
      } catch (callbackError) {
        if (!ignore) {
          const message =
            callbackError instanceof Error ? callbackError.message : 'GitHub authentication failed';
          setError(message);
          setStatus('error');
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [fetchGitHubData]);

  const handleConnect = async () => {
    setError(null);
    await GitHubOAuth.login();
  };

  const handleDisconnect = () => {
    GitHubOAuth.logout();
    setProfile(null);
    setRepos([]);
    setStatus('idle');
  };

  return (
    <div className="border border-zinc-800 rounded-lg bg-zinc-900/60 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-zinc-800/80 text-gray-200">
          <Github className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-500 font-mono">integrations</p>
          <h3 className="text-lg font-mono text-gray-100">GitHub</h3>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-200 font-mono">
          {error}
        </div>
      ) : null}

      {!isConnected ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-400 font-mono">
            Authenticate with GitHub to list your repositories without sharing tokens with any server.
          </p>
          <Button
            className="w-full bg-green-500/90 text-white hover:bg-green-500"
            disabled={isLoading}
            onClick={handleConnect}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                redirecting...
              </>
            ) : (
              <>
                <Github className="w-4 h-4" />
                connect github
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={profile?.avatar_url}
                alt={profile?.login}
                className="w-12 h-12 rounded-full border border-zinc-800"
              />
              <div>
                <p className="text-sm text-gray-500 font-mono">signed in as</p>
                <a
                  href={profile?.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lg text-gray-100 font-mono hover:text-gray-300"
                >
                  {profile?.name || profile?.login}
                </a>
              </div>
            </div>
            <Button variant="outline" className="text-gray-200 border-zinc-700" onClick={handleDisconnect}>
              <LogOut className="w-4 h-4" />
              logout
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm font-mono">
              <FolderGit2 className="w-4 h-4" />
              repositories ({repos.length})
            </div>
            {visibleRepos.length === 0 ? (
              <p className="text-xs text-gray-500 font-mono">No repositories available.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {visibleRepos.map((repo) => (
                  <a
                    key={repo.id}
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2 hover:border-zinc-600"
                  >
                    <p className="text-sm text-gray-100 font-mono flex items-center gap-2">
                      <span className="truncate">{repo.name}</span>
                      {repo.private ? (
                        <span className="text-[10px] uppercase tracking-wide text-amber-400 border border-amber-500/40 rounded px-1">
                          private
                        </span>
                      ) : null}
                    </p>
                    {repo.description ? (
                      <p className="text-xs text-gray-500 font-mono truncate">{repo.description}</p>
                    ) : null}
                  </a>
                ))}
              </div>
            )}

            {repos.length > visibleRepos.length ? (
              <p className="text-xs text-gray-500 font-mono">
                Showing {visibleRepos.length} of {repos.length} repositories.
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
