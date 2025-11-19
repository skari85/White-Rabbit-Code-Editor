/**
 * GitHub Client - Client-Side Only
 * 
 * Lightweight client for interacting with GitHub API.
 * All requests go directly from browser → GitHub API.
 * No backend, no server-side storage, no caching except in-memory.
 */

const GITHUB_API_URL = 'https://api.github.com';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  default_branch: string;
  updated_at: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  sha: string;
  url: string;
  html_url: string;
  download_url: string | null;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTree {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: string;
  content: string; // base64 encoded
  encoding: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export class GitHubClient {
  private token: string;
  private rateLimitInfo: GitHubRateLimit | null = null;

  constructor(token: string) {
    if (!token) {
      throw new Error('GitHub token is required');
    }
    this.token = token;
  }

  /**
   * Make authenticated request to GitHub API
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers,
      },
    });

    // Update rate limit info from headers
    this.updateRateLimitInfo(response);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please reconnect to GitHub.');
      }
      
      if (response.status === 403) {
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
        if (rateLimitRemaining === '0') {
          const resetTime = response.headers.get('x-ratelimit-reset');
          const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null;
          throw new Error(
            `GitHub API rate limit exceeded. Reset at: ${resetDate?.toLocaleTimeString() || 'unknown'}`
          );
        }
        throw new Error('Access forbidden. Check your token permissions.');
      }

      if (response.status === 404) {
        throw new Error('Resource not found.');
      }

      throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitInfo(response: Response): void {
    const limit = response.headers.get('x-ratelimit-limit');
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    const used = response.headers.get('x-ratelimit-used');

    if (limit && remaining && reset && used) {
      this.rateLimitInfo = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
        used: parseInt(used, 10),
      };
    }
  }

  /**
   * Get current rate limit information
   */
  getRateLimit(): GitHubRateLimit | null {
    return this.rateLimitInfo;
  }

  /**
   * List all repositories (private + public) for the authenticated user
   */
  async listRepos(options: {
    type?: 'all' | 'owner' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubRepository[]> {
    const params = new URLSearchParams({
      type: options.type || 'all',
      sort: options.sort || 'updated',
      direction: options.direction || 'desc',
      per_page: String(options.per_page || 100),
      page: String(options.page || 1),
    });

    return this.request<GitHubRepository[]>(`/user/repos?${params.toString()}`);
  }

  /**
   * List all repositories (with pagination support)
   */
  async listAllRepos(): Promise<GitHubRepository[]> {
    const allRepos: GitHubRepository[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const repos = await this.listRepos({ per_page: 100, page });
      allRepos.push(...repos);
      
      // If we got less than 100 repos, we've reached the end
      hasMore = repos.length === 100;
      page++;
    }

    return allRepos;
  }

  /**
   * List branches for a repository
   */
  async listBranches(repo: string): Promise<GitHubBranch[]> {
    // repo can be either "owner/repo" or just "repo" (assumes current user)
    const repoPath = repo.includes('/') ? repo : `user/${repo}`;
    return this.request<GitHubBranch[]>(`/repos/${repoPath}/branches`);
  }

  /**
   * List files in a repository branch
   */
  async listFiles(
    repo: string,
    branch: string = 'main',
    path: string = ''
  ): Promise<GitHubFile[]> {
    // repo can be either "owner/repo" or just "repo" (assumes current user)
    const repoPath = repo.includes('/') ? repo : `user/${repo}`;
    const apiPath = path ? `/repos/${repoPath}/contents/${path}` : `/repos/${repoPath}/contents`;
    
    const params = new URLSearchParams({ ref: branch });
    const files = await this.request<GitHubFile[]>(`${apiPath}?${params.toString()}`);
    
    return files;
  }

  /**
   * Get repository tree recursively
   */
  async getTree(
    repo: string,
    branch: string = 'main',
    recursive: boolean = true
  ): Promise<GitHubTree> {
    const repoPath = repo.includes('/') ? repo : `user/${repo}`;
    
    // First get the branch SHA
    const branchData = await this.request<{ commit: { sha: string } }>(
      `/repos/${repoPath}/branches/${branch}`
    );
    
    const treeSha = branchData.commit.sha;
    const params = new URLSearchParams({
      recursive: recursive ? '1' : '0',
    });
    
    return this.request<GitHubTree>(
      `/repos/${repoPath}/git/trees/${treeSha}?${params.toString()}`
    );
  }

  /**
   * Get file contents with full metadata
   */
  async getFileContents(
    repo: string,
    path: string,
    branch: string = 'main'
  ): Promise<GitHubFileContent> {
    const repoPath = repo.includes('/') ? repo : `user/${repo}`;
    const params = new URLSearchParams({ ref: branch });
    
    const file = await this.request<GitHubFileContent>(
      `/repos/${repoPath}/contents/${path}?${params.toString()}`
    );

    return file;
  }

  /**
   * Decode base64 file content
   */
  static decodeContent(base64Content: string): string {
    try {
      // GitHub API returns base64 with newlines, remove them
      const cleanBase64 = base64Content.replace(/\n/g, '');
      const binaryString = atob(cleanBase64);
      return decodeURIComponent(
        escape(binaryString)
      );
    } catch (error) {
      throw new Error('Failed to decode file content');
    }
  }

  /**
   * Get repository details
   */
  async getRepo(repo: string): Promise<GitHubRepository> {
    const repoPath = repo.includes('/') ? repo : `user/${repo}`;
    return this.request<GitHubRepository>(`/repos/${repoPath}`);
  }

  /**
   * Get authenticated user information
   */
  async getUser(): Promise<{
    login: string;
    name: string;
    avatar_url: string;
    email: string | null;
  }> {
    return this.request('/user');
  }

  /**
   * Get file SHA (needed for updates)
   */
  async getFileSha(repo: string, path: string, branch: string = 'main'): Promise<string | null> {
    try {
      const file = await this.getFileContents(repo, path, branch);
      return file.sha;
    } catch {
      return null;
    }
  }

  /**
   * Create or update a file
   */
  async createOrUpdateFile(
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string = 'main',
    sha?: string
  ): Promise<{
    content: GitHubFileContent;
    commit: {
      sha: string;
      html_url: string;
    };
  }> {
    const repoPath = repo.includes('/') ? repo : `user/${repo}`;
    
    // Encode content to base64
    const base64Content = btoa(unescape(encodeURIComponent(content)));

    const body: any = {
      message,
      content: base64Content,
      branch,
    };

    // Include SHA for updates
    if (sha) {
      body.sha = sha;
    }

    return this.request<{
      content: GitHubFileContent;
      commit: {
        sha: string;
        html_url: string;
      };
    }>(`/repos/${repoPath}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * Get branch SHA
   */
  async getBranchSha(repo: string, branch: string): Promise<string> {
    const repoPath = repo.includes('/') ? repo : `user/${repo}`;
    const branchData = await this.request<{ commit: { sha: string } }>(
      `/repos/${repoPath}/branches/${branch}`
    );
    return branchData.commit.sha;
  }

  /**
   * Create a new branch
   */
  async createBranch(
    repo: string,
    newBranchName: string,
    fromBranch: string = 'main'
  ): Promise<{ ref: string; sha: string }> {
    const repoPath = repo.includes('/') ? repo : `user/${repo}`;
    const sha = await this.getBranchSha(repo, fromBranch);

    return this.request<{ ref: string; object: { sha: string } }>(
      `/repos/${repoPath}/git/refs`,
      {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${newBranchName}`,
          sha,
        }),
      }
    ).then(response => ({
      ref: response.ref,
      sha: response.object.sha,
    }));
  }

  /**
   * Get commit diff (client-side)
   */
  async getCommitDiff(
    repo: string,
    baseSha: string,
    headSha: string
  ): Promise<string> {
    const repoPath = repo.includes('/') ? repo : `user/${repo}`;
    
    // Get base commit tree
    const baseCommit = await this.request<{ tree: { sha: string } }>(
      `/repos/${repoPath}/git/commits/${baseSha}`
    );
    
    // Get head commit tree
    const headCommit = await this.request<{ tree: { sha: string } }>(
      `/repos/${repoPath}/git/commits/${headSha}`
    );

    // Compare trees
    const diff = await this.request<{ ahead_by: number; behind_by: number; files: any[] }>(
      `/repos/${repoPath}/compare/${baseSha}...${headSha}`
    );

    return JSON.stringify(diff, null, 2);
  }
}
