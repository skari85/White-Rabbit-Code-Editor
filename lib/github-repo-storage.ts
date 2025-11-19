/**
 * GitHub Repo Storage - Client-Side Only
 * 
 * Stores only references to current repo/branch in localStorage.
 * Never stores file contents.
 */

const STORAGE_KEY_CURRENT_REPO = 'github_current_repo';

export interface CurrentRepoReference {
  owner: string;
  repo: string;
  branch: string;
  fullName: string; // owner/repo
}

export class GitHubRepoStorage {
  /**
   * Store current repo reference
   */
  static setCurrentRepo(owner: string, repo: string, branch: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    const reference: CurrentRepoReference = {
      owner,
      repo,
      branch,
      fullName: `${owner}/${repo}`,
    };

    localStorage.setItem(STORAGE_KEY_CURRENT_REPO, JSON.stringify(reference));
  }

  /**
   * Get current repo reference
   */
  static getCurrentRepo(): CurrentRepoReference | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const stored = localStorage.getItem(STORAGE_KEY_CURRENT_REPO);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as CurrentRepoReference;
    } catch {
      return null;
    }
  }

  /**
   * Clear current repo reference
   */
  static clearCurrentRepo(): void {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(STORAGE_KEY_CURRENT_REPO);
  }

  /**
   * Check if a repo is currently open
   */
  static hasCurrentRepo(): boolean {
    return this.getCurrentRepo() !== null;
  }
}
