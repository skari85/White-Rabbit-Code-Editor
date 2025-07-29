export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  conflicts: string[];
  isClean: boolean;
}

export interface GitCommit {
  hash: string;
  author: string;
  date: Date;
  message: string;
  files: string[];
}

export interface GitDiff {
  file: string;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'addition' | 'deletion' | 'context';
  content: string;
  lineNumber: number;
}

export interface GitBlame {
  line: number;
  hash: string;
  author: string;
  date: Date;
  message: string;
}

class GitService {
  private isGitAvailable: boolean = false;
  private currentRepo: string | null = null;

  constructor() {
    this.checkGitAvailability();
  }

  private async checkGitAvailability(): Promise<void> {
    try {
      // Check if git is available in the environment
      const result = await this.executeCommand('git --version');
      this.isGitAvailable = result.success;
    } catch {
      this.isGitAvailable = false;
    }
  }

  private async executeCommand(command: string, cwd?: string): Promise<{ success: boolean; output: string; error?: string }> {
    return new Promise((resolve) => {
      // Simulate git command execution
      // In a real implementation, this would use Node.js child_process or Web Workers
      setTimeout(() => {
        const mockResponses: Record<string, { success: boolean; output: string }> = {
          'git --version': { success: true, output: 'git version 2.39.0' },
          'git status --porcelain': { 
            success: true, 
            output: 'M  app/page.tsx\nA  components/new-component.tsx\n?? untracked-file.js' 
          },
          'git branch --show-current': { success: true, output: 'main' },
          'git log --oneline -10': { 
            success: true, 
            output: 'abc1234 Latest changes\n def5678 Previous commit\n ghi9012 Initial commit' 
          },
          'git diff --cached': { success: true, output: 'diff --git a/app/page.tsx b/app/page.tsx\nindex 123..456 100644\n--- a/app/page.tsx\n+++ b/app/page.tsx\n@@ -1,3 +1,4 @@\n+// New line added\n console.log("Hello");\n' }
        };

        const response = mockResponses[command] || { success: true, output: `Mock response for: ${command}` };
        resolve(response);
      }, 100);
    });
  }

  async initRepository(path: string): Promise<boolean> {
    try {
      const result = await this.executeCommand('git init', path);
      if (result.success) {
        this.currentRepo = path;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async cloneRepository(url: string, path: string): Promise<boolean> {
    try {
      const result = await this.executeCommand(`git clone ${url} ${path}`);
      if (result.success) {
        this.currentRepo = path;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async getStatus(): Promise<GitStatus> {
    try {
      const statusResult = await this.executeCommand('git status --porcelain');
      const branchResult = await this.executeCommand('git branch --show-current');
      
      if (!statusResult.success || !branchResult.success) {
        throw new Error('Failed to get git status');
      }

      const lines = statusResult.output.split('\n').filter(line => line.trim());
      const staged: string[] = [];
      const unstaged: string[] = [];
      const untracked: string[] = [];

      lines.forEach(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3);
        
        if (status[0] === 'A' || status[0] === 'M') {
          staged.push(file);
        }
        if (status[1] === 'M' || status[1] === 'D') {
          unstaged.push(file);
        }
        if (status === '??') {
          untracked.push(file);
        }
      });

      return {
        branch: branchResult.output.trim(),
        ahead: 0, // Would need to parse git status for this
        behind: 0, // Would need to parse git status for this
        staged,
        unstaged,
        untracked,
        conflicts: [], // Would parse for conflict markers
        isClean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0
      };
    } catch {
      return {
        branch: 'unknown',
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        untracked: [],
        conflicts: [],
        isClean: true
      };
    }
  }

  async getCommits(limit: number = 20): Promise<GitCommit[]> {
    try {
      const result = await this.executeCommand(`git log --oneline -${limit}`);
      if (!result.success) return [];

      return result.output.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, ...messageParts] = line.split(' ');
          return {
            hash: hash || '',
            author: 'Unknown Author', // Would parse from git log --pretty=format
            date: new Date(), // Would parse from git log
            message: messageParts.join(' '),
            files: [] // Would parse from git log --name-only
          };
        });
    } catch {
      return [];
    }
  }

  async getDiff(file?: string): Promise<GitDiff[]> {
    try {
      const command = file ? `git diff ${file}` : 'git diff';
      const result = await this.executeCommand(command);
      
      if (!result.success) return [];

      // Parse diff output
      const diffs: GitDiff[] = [];
      const lines = result.output.split('\n');
      let currentDiff: GitDiff | null = null;
      let currentHunk: DiffHunk | null = null;

      lines.forEach(line => {
        if (line.startsWith('diff --git')) {
          if (currentDiff) diffs.push(currentDiff);
          const fileMatch = line.match(/diff --git a\/(.+) b\/(.+)/);
          currentDiff = {
            file: fileMatch ? fileMatch[1] : 'unknown',
            hunks: [],
            additions: 0,
            deletions: 0
          };
        } else if (line.startsWith('@@') && currentDiff) {
          if (currentHunk) currentDiff.hunks.push(currentHunk);
          const hunkMatch = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
          if (hunkMatch) {
            currentHunk = {
              oldStart: parseInt(hunkMatch[1]),
              oldLines: parseInt(hunkMatch[2] || '1'),
              newStart: parseInt(hunkMatch[3]),
              newLines: parseInt(hunkMatch[4] || '1'),
              lines: []
            };
          }
        } else if (currentHunk) {
          const type = line.startsWith('+') ? 'addition' : 
                      line.startsWith('-') ? 'deletion' : 'context';
          currentHunk.lines.push({
            type,
            content: line,
            lineNumber: 0 // Would calculate actual line number
          });
          if (type === 'addition') currentDiff!.additions++;
          if (type === 'deletion') currentDiff!.deletions++;
        }
      });

      if (currentHunk && currentDiff) currentDiff.hunks.push(currentHunk);
      if (currentDiff) diffs.push(currentDiff);

      return diffs;
    } catch {
      return [];
    }
  }

  async getBlame(file: string): Promise<GitBlame[]> {
    try {
      const result = await this.executeCommand(`git blame --porcelain ${file}`);
      if (!result.success) return [];

      const lines = result.output.split('\n');
      const blame: GitBlame[] = [];
      let currentLine = 0;

      lines.forEach(line => {
        if (line.startsWith('\t')) {
          // This is the actual line content
          currentLine++;
        } else if (line.startsWith('author ')) {
          // This is blame information
          const author = line.substring(7);
          blame.push({
            line: currentLine,
            hash: 'unknown', // Would parse from blame output
            author,
            date: new Date(), // Would parse from blame output
            message: 'Unknown' // Would parse from blame output
          });
        }
      });

      return blame;
    } catch {
      return [];
    }
  }

  async stageFile(file: string): Promise<boolean> {
    try {
      const result = await this.executeCommand(`git add ${file}`);
      return result.success;
    } catch {
      return false;
    }
  }

  async unstageFile(file: string): Promise<boolean> {
    try {
      const result = await this.executeCommand(`git reset HEAD ${file}`);
      return result.success;
    } catch {
      return false;
    }
  }

  async commit(message: string): Promise<boolean> {
    try {
      const result = await this.executeCommand(`git commit -m "${message}"`);
      return result.success;
    } catch {
      return false;
    }
  }

  async push(): Promise<boolean> {
    try {
      const result = await this.executeCommand('git push');
      return result.success;
    } catch {
      return false;
    }
  }

  async pull(): Promise<boolean> {
    try {
      const result = await this.executeCommand('git pull');
      return result.success;
    } catch {
      return false;
    }
  }

  async createBranch(name: string): Promise<boolean> {
    try {
      const result = await this.executeCommand(`git checkout -b ${name}`);
      return result.success;
    } catch {
      return false;
    }
  }

  async switchBranch(name: string): Promise<boolean> {
    try {
      const result = await this.executeCommand(`git checkout ${name}`);
      return result.success;
    } catch {
      return false;
    }
  }

  async deleteBranch(name: string): Promise<boolean> {
    try {
      const result = await this.executeCommand(`git branch -d ${name}`);
      return result.success;
    } catch {
      return false;
    }
  }

  isAvailable(): boolean {
    return this.isGitAvailable;
  }

  getCurrentRepo(): string | null {
    return this.currentRepo;
  }
}

export const gitService = new GitService(); 