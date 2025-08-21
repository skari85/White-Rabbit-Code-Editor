export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  authorEmail: string;
  date: Date;
  message: string;
  timestamp: number;
}

export interface GitFileHistory {
  commits: GitCommit[];
  filePath: string;
  totalCommits: number;
}

export interface GitFileDiff {
  added: number[];
  removed: number[];
  modified: number[];
  content: string;
}

export interface ChronoscopeState {
  currentCommitIndex: number;
  fileHistory: GitFileHistory;
  currentContent: string;
  diff: GitFileDiff | null;
  heatMap: Map<number, number>; // line number -> heat intensity (0-100)
  ghostLines: Map<number, { content: string; type: 'added' | 'removed' }>;
}

export interface CodeHeatData {
  lineNumber: number;
  lastModified: Date;
  commitCount: number;
  authorCount: number;
  heatIntensity: number; // 0-100, where 100 is most recently changed
}

export class CodeChronoscopeService {
  private static instance: CodeChronoscopeService;
  private fileHistoryCache: Map<string, GitFileHistory> = new Map();
  private contentCache: Map<string, string> = new Map(); // commit-hash:file -> content

  private constructor() {}

  static getInstance(): CodeChronoscopeService {
    if (!CodeChronoscopeService.instance) {
      CodeChronoscopeService.instance = new CodeChronoscopeService();
    }
    return CodeChronoscopeService.instance;
  }

  /**
   * Gets the Git history for a specific file
   */
  async getFileHistory(filePath: string): Promise<GitFileHistory> {
    // Check cache first
    if (this.fileHistoryCache.has(filePath)) {
      return this.fileHistoryCache.get(filePath)!;
    }

    try {
      // In a real implementation, this would call git log
      // For demo purposes, we'll simulate git history
      const commits = await this.simulateGitHistory(filePath);
      
      const history: GitFileHistory = {
        commits,
        filePath,
        totalCommits: commits.length
      };

      this.fileHistoryCache.set(filePath, history);
      return history;
    } catch (error) {
      console.error('Failed to get file history:', error);
      throw new Error(`Failed to get history for ${filePath}`);
    }
  }

  /**
   * Gets the content of a file at a specific commit
   */
  async getFileContentAtCommit(filePath: string, commitHash: string): Promise<string> {
    const cacheKey = `${commitHash}:${filePath}`;
    
    if (this.contentCache.has(cacheKey)) {
      return this.contentCache.get(cacheKey)!;
    }

    try {
      // In a real implementation, this would call git show
      const content = await this.simulateFileContentAtCommit(filePath, commitHash);
      this.contentCache.set(cacheKey, content);
      return content;
    } catch (error) {
      console.error('Failed to get file content at commit:', error);
      throw new Error(`Failed to get content for ${filePath} at ${commitHash}`);
    }
  }

  /**
   * Generates a heat map showing how recently each line was modified
   */
  generateHeatMap(fileHistory: GitFileHistory, currentContent: string): Map<number, number> {
    const heatMap = new Map<number, number>();
    const lines = currentContent.split('\n');
    const now = Date.now();
    
    // Calculate heat for each line based on last modification time
    lines.forEach((_, lineIndex) => {
      const lineNumber = lineIndex + 1;
      
      // Find the most recent commit that modified this line
      // In a real implementation, this would use git blame
      const lastModified = this.getLastModificationDate(lineNumber, fileHistory);
      const daysSinceModification = (now - lastModified.getTime()) / (1000 * 60 * 60 * 24);
      
      // Heat intensity: 100 for today, decreasing over time
      let heat = Math.max(0, 100 - (daysSinceModification * 2));
      heat = Math.min(100, heat); // Cap at 100
      
      heatMap.set(lineNumber, heat);
    });
    
    return heatMap;
  }

  /**
   * Generates ghost lines showing added/removed code
   */
  generateGhostLines(
    previousContent: string,
    currentContent: string
  ): Map<number, { content: string; type: 'added' | 'removed' }> {
    const ghostLines = new Map<number, { content: string; type: 'added' | 'removed' }>();
    
    const previousLines = previousContent.split('\n');
    const currentLines = currentContent.split('\n');
    
    // Simple diff algorithm
    const diff = this.simpleDiff(previousLines, currentLines);
    
    diff.removed.forEach((lineNumber, index) => {
      const content = previousLines[lineNumber - 1] || '';
      ghostLines.set(lineNumber, { content, type: 'removed' });
    });
    
    diff.added.forEach((lineNumber, index) => {
      const content = currentLines[lineNumber - 1] || '';
      ghostLines.set(lineNumber, { content, type: 'added' });
    });
    
    return ghostLines;
  }

  /**
   * Creates a chronoscope state for a specific commit
   */
  async createChronoscopeState(
    filePath: string, 
    commitIndex: number
  ): Promise<ChronoscopeState> {
    const fileHistory = await this.getFileHistory(filePath);
    
    if (commitIndex < 0 || commitIndex >= fileHistory.commits.length) {
      throw new Error('Invalid commit index');
    }
    
    const currentCommit = fileHistory.commits[commitIndex];
    const currentContent = await this.getFileContentAtCommit(filePath, currentCommit.hash);
    
    // Get previous content for ghost lines
    let previousContent = '';
    let diff: GitFileDiff | null = null;
    
    if (commitIndex > 0) {
      const previousCommit = fileHistory.commits[commitIndex - 1];
      previousContent = await this.getFileContentAtCommit(filePath, previousCommit.hash);
      diff = this.calculateDiff(previousContent, currentContent);
    }
    
    const heatMap = this.generateHeatMap(fileHistory, currentContent);
    const ghostLines = this.generateGhostLines(previousContent, currentContent);
    
    return {
      currentCommitIndex: commitIndex,
      fileHistory,
      currentContent,
      diff,
      heatMap,
      ghostLines
    };
  }

  /**
   * Gets heat data for all lines in the file
   */
  getHeatData(state: ChronoscopeState): CodeHeatData[] {
    const lines = state.currentContent.split('\n');
    const heatData: CodeHeatData[] = [];
    
    lines.forEach((_, lineIndex) => {
      const lineNumber = lineIndex + 1;
      const heat = state.heatMap.get(lineNumber) || 0;
      const lastModified = this.getLastModificationDate(lineNumber, state.fileHistory);
      
      heatData.push({
        lineNumber,
        lastModified,
        commitCount: this.getLineCommitCount(lineNumber, state.fileHistory),
        authorCount: this.getLineAuthorCount(lineNumber, state.fileHistory),
        heatIntensity: heat
      });
    });
    
    return heatData;
  }

  /**
   * Navigates to a specific commit in the timeline
   */
  async navigateToCommit(filePath: string, commitIndex: number): Promise<ChronoscopeState> {
    return this.createChronoscopeState(filePath, commitIndex);
  }

  /**
   * Gets commits within a date range
   */
  getCommitsInRange(
    fileHistory: GitFileHistory, 
    startDate: Date, 
    endDate: Date
  ): GitCommit[] {
    return fileHistory.commits.filter(commit => 
      commit.date >= startDate && commit.date <= endDate
    );
  }

  /**
   * Searches commits by author, message, or content
   */
  searchCommits(
    fileHistory: GitFileHistory, 
    query: string
  ): GitCommit[] {
    const lowerQuery = query.toLowerCase();
    
    return fileHistory.commits.filter(commit =>
      commit.author.toLowerCase().includes(lowerQuery) ||
      commit.message.toLowerCase().includes(lowerQuery) ||
      commit.authorEmail.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Exports chronoscope data for analysis
   */
  exportChronoscopeData(state: ChronoscopeState): string {
    const exportData = {
      filePath: state.fileHistory.filePath,
      totalCommits: state.fileHistory.totalCommits,
      currentCommit: state.fileHistory.commits[state.currentCommitIndex],
      heatMap: Array.from(state.heatMap.entries()),
      ghostLines: Array.from(state.ghostLines.entries()),
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  // Private helper methods

  /**
   * Simulates Git history for demo purposes
   */
  private async simulateGitHistory(filePath: string): Promise<GitCommit[]> {
    const baseDate = new Date('2024-01-01');
    const commits: GitCommit[] = [];
    
    // Generate realistic commit history
    const authors = [
      { name: 'Alice Johnson', email: 'alice@example.com' },
      { name: 'Bob Smith', email: 'bob@example.com' },
      { name: 'Carol Davis', email: 'carol@example.com' },
      { name: 'David Wilson', email: 'david@example.com' }
    ];
    
    const commitMessages = [
      'Initial implementation',
      'Add error handling',
      'Refactor for better performance',
      'Fix null pointer exception',
      'Add unit tests',
      'Update documentation',
      'Implement new feature',
      'Bug fix: handle edge case',
      'Code cleanup and optimization',
      'Add logging and monitoring'
    ];
    
    for (let i = 0; i < 20; i++) {
      const author = authors[Math.floor(Math.random() * authors.length)];
      const message = commitMessages[Math.floor(Math.random() * commitMessages.length)];
      const date = new Date(baseDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000)); // Weekly commits
      
      commits.push({
        hash: this.generateCommitHash(),
        shortHash: this.generateCommitHash().substring(0, 8),
        author: author.name,
        authorEmail: author.email,
        date,
        message,
        timestamp: date.getTime()
      });
    }
    
    return commits.reverse(); // Most recent first
  }

  /**
   * Simulates file content at a specific commit
   */
  private async simulateFileContentAtCommit(filePath: string, commitHash: string): Promise<string> {
    // Generate realistic code content that evolves over time
    const baseContent = `// ${filePath}
import React, { useState, useEffect } from 'react';

interface Props {
  data: any[];
  onSelect: (item: any) => void;
}

export default function Component({ data, onSelect }: Props) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (data.length > 0) {
      setSelectedItem(data[0]);
    }
  }, [data]);

  const handleSelect = (item: any) => {
    setSelectedItem(item);
    onSelect(item);
  };

  return (
    <div className="component">
      {isLoading && <div>Loading...</div>}
      {data.map((item, index) => (
        <div 
          key={item.id} 
          onClick={() => handleSelect(item)}
          className={selectedItem?.id === item.id ? 'selected' : ''}
        >
          {item.name}
        </div>
      ))}
    </div>
  );
}`;

    // Add variations based on commit hash to simulate evolution
    const variations = [
      '\n\n// Added error handling',
      '\n\n// Performance improvements',
      '\n\n// Bug fixes and optimizations'
    ];
    
    const hashNum = parseInt(commitHash.substring(0, 4), 16);
    const variationIndex = hashNum % variations.length;
    
    return baseContent + variations[variationIndex];
  }

  private generateCommitHash(): string {
    return Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private getLastModificationDate(lineNumber: number, fileHistory: GitFileHistory): Date {
    // Simulate last modification date
    const randomDays = Math.floor(Math.random() * 30);
    return new Date(Date.now() - (randomDays * 24 * 60 * 60 * 1000));
  }

  private getLineCommitCount(lineNumber: number, fileHistory: GitFileHistory): number {
    // Simulate commit count for line
    return Math.floor(Math.random() * 5) + 1;
  }

  private getLineAuthorCount(lineNumber: number, fileHistory: GitFileHistory): number {
    // Simulate author count for line
    return Math.floor(Math.random() * 3) + 1;
  }

  private simpleDiff(oldLines: string[], newLines: string[]): { added: number[]; removed: number[]; modified: number[] } {
    const added: number[] = [];
    const removed: number[] = [];
    const modified: number[] = [];
    
    const maxLength = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLength; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];
      
      if (oldLine === undefined) {
        added.push(i + 1);
      } else if (newLine === undefined) {
        removed.push(i + 1);
      } else if (oldLine !== newLine) {
        modified.push(i + 1);
      }
    }
    
    return { added, removed, modified };
  }

  private calculateDiff(oldContent: string, newContent: string): GitFileDiff {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    const diff = this.simpleDiff(oldLines, newLines);
    
    return {
      ...diff,
      content: newContent
    };
  }
}
