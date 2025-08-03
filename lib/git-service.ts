// Git integration service for version control
// Note: This is a simplified implementation that simulates Git operations

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  email: string;
  date: Date;
  files: string[];
  parent?: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  lastCommit: string;
  ahead: number;
  behind: number;
}

export interface GitStatus {
  branch: string;
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
  untracked: string[];
  ahead: number;
  behind: number;
}

export interface GitFileStatus {
  file: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'copied';
  staged: boolean;
}

export interface GitDiff {
  file: string;
  oldContent: string;
  newContent: string;
  hunks: GitDiffHunk[];
}

export interface GitDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: GitDiffLine[];
}

export interface GitDiffLine {
  type: 'context' | 'addition' | 'deletion';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface GitRemote {
  name: string;
  url: string;
  type: 'fetch' | 'push';
}

export class GitService {
  private commits: GitCommit[] = [];
  private branches: GitBranch[] = [
    { name: 'main', current: true, lastCommit: '', ahead: 0, behind: 0 }
  ];
  private currentBranch = 'main';
  private stagedFiles: Map<string, string> = new Map();
  private fileHistory: Map<string, { content: string; timestamp: Date }[]> = new Map();
  private remotes: GitRemote[] = [];

  // Initialize repository
  init(): void {
    this.commits = [];
    this.branches = [
      { name: 'main', current: true, lastCommit: '', ahead: 0, behind: 0 }
    ];
    this.currentBranch = 'main';
    this.stagedFiles.clear();
    this.fileHistory.clear();
  }

  // Get repository status
  getStatus(files: { name: string; content: string }[]): GitStatus {
    const staged: GitFileStatus[] = [];
    const unstaged: GitFileStatus[] = [];
    const untracked: string[] = [];

    files.forEach(file => {
      const history = this.fileHistory.get(file.name) || [];
      const lastVersion = history[history.length - 1];
      
      if (!lastVersion) {
        // New file
        if (this.stagedFiles.has(file.name)) {
          staged.push({ file: file.name, status: 'added', staged: true });
        } else {
          untracked.push(file.name);
        }
      } else if (lastVersion.content !== file.content) {
        // Modified file
        if (this.stagedFiles.has(file.name)) {
          staged.push({ file: file.name, status: 'modified', staged: true });
        } else {
          unstaged.push({ file: file.name, status: 'modified', staged: false });
        }
      }
    });

    return {
      branch: this.currentBranch,
      staged,
      unstaged,
      untracked,
      ahead: 0,
      behind: 0
    };
  }

  // Stage files
  add(files: string[]): void {
    files.forEach(file => {
      this.stagedFiles.set(file, 'staged');
    });
  }

  // Unstage files
  reset(files: string[]): void {
    files.forEach(file => {
      this.stagedFiles.delete(file);
    });
  }

  // Commit changes
  commit(message: string, author: string, email: string, files: { name: string; content: string }[]): GitCommit {
    const commitHash = this.generateHash();
    const stagedFileNames = Array.from(this.stagedFiles.keys());
    
    // Update file history for committed files
    files.forEach(file => {
      if (stagedFileNames.includes(file.name)) {
        const history = this.fileHistory.get(file.name) || [];
        history.push({ content: file.content, timestamp: new Date() });
        this.fileHistory.set(file.name, history);
      }
    });

    const commit: GitCommit = {
      hash: commitHash,
      message,
      author,
      email,
      date: new Date(),
      files: stagedFileNames,
      parent: this.commits.length > 0 ? this.commits[this.commits.length - 1].hash : undefined
    };

    this.commits.push(commit);
    this.stagedFiles.clear();

    // Update current branch
    const branch = this.branches.find(b => b.name === this.currentBranch);
    if (branch) {
      branch.lastCommit = commitHash;
    }

    return commit;
  }

  // Get commit history
  getCommits(limit?: number): GitCommit[] {
    const commits = [...this.commits].reverse();
    return limit ? commits.slice(0, limit) : commits;
  }

  // Get specific commit
  getCommit(hash: string): GitCommit | null {
    return this.commits.find(c => c.hash === hash) || null;
  }

  // Create branch
  createBranch(name: string, fromCommit?: string): GitBranch {
    const baseCommit = fromCommit || (this.commits.length > 0 ? this.commits[this.commits.length - 1].hash : '');
    
    const branch: GitBranch = {
      name,
      current: false,
      lastCommit: baseCommit,
      ahead: 0,
      behind: 0
    };

    this.branches.push(branch);
    return branch;
  }

  // Switch branch
  checkout(branchName: string): boolean {
    const branch = this.branches.find(b => b.name === branchName);
    if (!branch) return false;

    // Update current branch status
    this.branches.forEach(b => b.current = b.name === branchName);
    this.currentBranch = branchName;
    
    return true;
  }

  // Get branches
  getBranches(): GitBranch[] {
    return [...this.branches];
  }

  // Delete branch
  deleteBranch(name: string): boolean {
    if (name === this.currentBranch) return false; // Can't delete current branch
    
    const index = this.branches.findIndex(b => b.name === name);
    if (index >= 0) {
      this.branches.splice(index, 1);
      return true;
    }
    return false;
  }

  // Generate diff between versions
  getDiff(file: string, oldVersion?: string, newVersion?: string): GitDiff | null {
    const history = this.fileHistory.get(file);
    if (!history || history.length === 0) return null;

    let oldContent = '';
    let newContent = history[history.length - 1].content;

    if (oldVersion) {
      const commit = this.getCommit(oldVersion);
      if (commit) {
        const versionIndex = history.findIndex(h => 
          Math.abs(h.timestamp.getTime() - commit.date.getTime()) < 1000
        );
        if (versionIndex >= 0) {
          oldContent = history[versionIndex].content;
        }
      }
    } else if (history.length > 1) {
      oldContent = history[history.length - 2].content;
    }

    return this.generateDiff(file, oldContent, newContent);
  }

  // Generate diff between two content strings
  private generateDiff(file: string, oldContent: string, newContent: string): GitDiff {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const hunks: GitDiffHunk[] = [];

    // Simple diff algorithm (Myers algorithm would be more accurate)
    let oldIndex = 0;
    let newIndex = 0;
    let currentHunk: GitDiffHunk | null = null;

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      const oldLine = oldLines[oldIndex];
      const newLine = newLines[newIndex];

      if (oldLine === newLine) {
        // Lines match
        if (currentHunk) {
          currentHunk.lines.push({
            type: 'context',
            content: oldLine || '',
            oldLineNumber: oldIndex + 1,
            newLineNumber: newIndex + 1
          });
        }
        oldIndex++;
        newIndex++;
      } else {
        // Lines differ - start new hunk if needed
        if (!currentHunk) {
          currentHunk = {
            oldStart: oldIndex + 1,
            oldLines: 0,
            newStart: newIndex + 1,
            newLines: 0,
            lines: []
          };
        }

        // Check if line was deleted
        if (oldIndex < oldLines.length && (newIndex >= newLines.length || oldLine !== newLines[newIndex])) {
          currentHunk.lines.push({
            type: 'deletion',
            content: oldLine,
            oldLineNumber: oldIndex + 1
          });
          currentHunk.oldLines++;
          oldIndex++;
        }

        // Check if line was added
        if (newIndex < newLines.length && (oldIndex >= oldLines.length || newLine !== oldLines[oldIndex])) {
          currentHunk.lines.push({
            type: 'addition',
            content: newLine,
            newLineNumber: newIndex + 1
          });
          currentHunk.newLines++;
          newIndex++;
        }
      }

      // Finish hunk if we've moved past the changes
      if (currentHunk && currentHunk.lines.length > 0) {
        const lastLine = currentHunk.lines[currentHunk.lines.length - 1];
        if (lastLine.type === 'context') {
          hunks.push(currentHunk);
          currentHunk = null;
        }
      }
    }

    // Add final hunk if exists
    if (currentHunk && currentHunk.lines.length > 0) {
      hunks.push(currentHunk);
    }

    return {
      file,
      oldContent,
      newContent,
      hunks
    };
  }

  // Add remote
  addRemote(name: string, url: string): void {
    this.remotes.push({ name, url, type: 'fetch' });
    this.remotes.push({ name, url, type: 'push' });
  }

  // Get remotes
  getRemotes(): GitRemote[] {
    return [...this.remotes];
  }

  // Remove remote
  removeRemote(name: string): boolean {
    const initialLength = this.remotes.length;
    this.remotes = this.remotes.filter(r => r.name !== name);
    return this.remotes.length < initialLength;
  }

  // Simulate push (would integrate with GitHub API in production)
  async push(remote: string, branch: string): Promise<boolean> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would push to the remote repository
    console.log(`Pushing ${branch} to ${remote}`);
    return true;
  }

  // Simulate pull (would integrate with GitHub API in production)
  async pull(remote: string, branch: string): Promise<boolean> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would pull from the remote repository
    console.log(`Pulling ${branch} from ${remote}`);
    return true;
  }

  // Get file at specific commit
  getFileAtCommit(file: string, commitHash: string): string | null {
    const commit = this.getCommit(commitHash);
    if (!commit) return null;

    const history = this.fileHistory.get(file);
    if (!history) return null;

    // Find the version closest to the commit date
    const commitDate = commit.date;
    let closestVersion = history[0];
    let minDiff = Math.abs(closestVersion.timestamp.getTime() - commitDate.getTime());

    for (const version of history) {
      const diff = Math.abs(version.timestamp.getTime() - commitDate.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestVersion = version;
      }
    }

    return closestVersion.content;
  }

  // Utility methods
  private generateHash(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Export repository state
  exportState(): any {
    return {
      commits: this.commits,
      branches: this.branches,
      currentBranch: this.currentBranch,
      fileHistory: Array.from(this.fileHistory.entries()),
      remotes: this.remotes
    };
  }

  // Import repository state
  importState(state: any): void {
    this.commits = state.commits || [];
    this.branches = state.branches || [];
    this.currentBranch = state.currentBranch || 'main';
    this.fileHistory = new Map(state.fileHistory || []);
    this.remotes = state.remotes || [];
  }
}

// Global git service instance
export const gitService = new GitService();
