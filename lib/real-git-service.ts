/**
 * White Rabbit Code Editor - Real Git Integration Service
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

// Import isomorphic-git for browser-based Git operations
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import { FileSystemAPI } from './filesystem-api'

export interface GitConfig {
  name: string
  email: string
}

export interface GitRemote {
  name: string
  url: string
  token?: string
}

export interface GitCommitInfo {
  oid: string
  message: string
  author: {
    name: string
    email: string
    timestamp: number
  }
  committer: {
    name: string
    email: string
    timestamp: number
  }
}

export interface GitStatusResult {
  staged: string[]
  unstaged: string[]
  untracked: string[]
  modified: string[]
  deleted: string[]
}

export interface GitBranchInfo {
  name: string
  current: boolean
  oid: string
  ahead: number
  behind: number
}

export interface GitDiffResult {
  file: string
  hunks: Array<{
    oldStart: number
    oldLines: number
    newStart: number
    newLines: number
    lines: Array<{
      type: 'add' | 'delete' | 'context'
      content: string
    }>
  }>
}

export class RealGitService {
  private fs: FileSystemAPI
  private dir: string
  private config: GitConfig
  private remotes: Map<string, GitRemote> = new Map()

  constructor(fs: FileSystemAPI, workingDirectory: string) {
    this.fs = fs
    this.dir = workingDirectory
    this.config = {
      name: 'White Rabbit User',
      email: 'user@whiterabbit.dev'
    }
  }

  // Initialize a new Git repository
  async init(): Promise<void> {
    try {
      await git.init({
        fs: this.fs,
        dir: this.dir,
        defaultBranch: 'main'
      })
      
      // Set initial configuration
      await this.setConfig('user.name', this.config.name)
      await this.setConfig('user.email', this.config.email)
      
      console.log('✅ Git repository initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Git repository:', error)
      throw new Error(`Git init failed: ${error}`)
    }
  }

  // Check if directory is a Git repository
  async isRepo(): Promise<boolean> {
    try {
      await git.findRoot({ fs: this.fs, filepath: this.dir })
      return true
    } catch {
      return false
    }
  }

  // Set Git configuration
  async setConfig(key: string, value: string): Promise<void> {
    try {
      await git.setConfig({
        fs: this.fs,
        dir: this.dir,
        path: key,
        value
      })
    } catch (error) {
      console.error(`Failed to set config ${key}:`, error)
      throw error
    }
  }

  // Get Git configuration
  async getConfig(key: string): Promise<string | undefined> {
    try {
      return await git.getConfig({
        fs: this.fs,
        dir: this.dir,
        path: key
      })
    } catch {
      return undefined
    }
  }

  // Update user configuration
  async updateConfig(config: Partial<GitConfig>): Promise<void> {
    if (config.name) {
      this.config.name = config.name
      await this.setConfig('user.name', config.name)
    }
    if (config.email) {
      this.config.email = config.email
      await this.setConfig('user.email', config.email)
    }
  }

  // Get repository status
  async status(): Promise<GitStatusResult> {
    try {
      const status = await git.statusMatrix({
        fs: this.fs,
        dir: this.dir
      })

      const result: GitStatusResult = {
        staged: [],
        unstaged: [],
        untracked: [],
        modified: [],
        deleted: []
      }

      for (const [filepath, headStatus, workdirStatus, stageStatus] of status) {
        // Skip .git directory
        if (filepath.startsWith('.git/')) continue

        // Untracked files
        if (headStatus === 0 && workdirStatus === 2 && stageStatus === 0) {
          result.untracked.push(filepath)
        }
        // Modified files
        else if (headStatus === 1 && workdirStatus === 2 && stageStatus === 1) {
          result.unstaged.push(filepath)
          result.modified.push(filepath)
        }
        // Staged files
        else if (headStatus === 1 && workdirStatus === 2 && stageStatus === 2) {
          result.staged.push(filepath)
        }
        // Deleted files
        else if (headStatus === 1 && workdirStatus === 0) {
          result.deleted.push(filepath)
          if (stageStatus === 0) {
            result.unstaged.push(filepath)
          } else {
            result.staged.push(filepath)
          }
        }
        // New staged files
        else if (headStatus === 0 && workdirStatus === 2 && stageStatus === 2) {
          result.staged.push(filepath)
        }
      }

      return result
    } catch (error) {
      console.error('Failed to get Git status:', error)
      throw error
    }
  }

  // Stage files
  async add(filepaths: string[]): Promise<void> {
    try {
      for (const filepath of filepaths) {
        await git.add({
          fs: this.fs,
          dir: this.dir,
          filepath
        })
      }
      console.log(`✅ Staged ${filepaths.length} file(s)`)
    } catch (error) {
      console.error('Failed to stage files:', error)
      throw error
    }
  }

  // Unstage files
  async reset(filepaths: string[]): Promise<void> {
    try {
      for (const filepath of filepaths) {
        await git.resetIndex({
          fs: this.fs,
          dir: this.dir,
          filepath
        })
      }
      console.log(`✅ Unstaged ${filepaths.length} file(s)`)
    } catch (error) {
      console.error('Failed to unstage files:', error)
      throw error
    }
  }

  // Commit changes
  async commit(message: string, author?: { name: string; email: string }): Promise<string> {
    try {
      const commitAuthor = author || this.config
      
      const oid = await git.commit({
        fs: this.fs,
        dir: this.dir,
        message,
        author: {
          name: commitAuthor.name,
          email: commitAuthor.email
        }
      })

      console.log(`✅ Committed changes: ${oid.substring(0, 7)}`)
      return oid
    } catch (error) {
      console.error('Failed to commit:', error)
      throw error
    }
  }

  // Get commit log
  async log(options: { depth?: number; since?: Date } = {}): Promise<GitCommitInfo[]> {
    try {
      const commits = await git.log({
        fs: this.fs,
        dir: this.dir,
        depth: options.depth || 50,
        since: options.since
      })

      return commits.map(commit => ({
        oid: commit.oid,
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          timestamp: commit.commit.author.timestamp
        },
        committer: {
          name: commit.commit.committer.name,
          email: commit.commit.committer.email,
          timestamp: commit.commit.committer.timestamp
        }
      }))
    } catch (error) {
      console.error('Failed to get commit log:', error)
      throw error
    }
  }

  // Get current branch
  async getCurrentBranch(): Promise<string> {
    try {
      return await git.currentBranch({
        fs: this.fs,
        dir: this.dir,
        fullname: false
      }) || 'main'
    } catch (error) {
      console.error('Failed to get current branch:', error)
      return 'main'
    }
  }

  // List all branches
  async listBranches(): Promise<GitBranchInfo[]> {
    try {
      const branches = await git.listBranches({
        fs: this.fs,
        dir: this.dir
      })

      const currentBranch = await this.getCurrentBranch()
      
      const branchInfos: GitBranchInfo[] = []
      
      for (const branch of branches) {
        try {
          const oid = await git.resolveRef({
            fs: this.fs,
            dir: this.dir,
            ref: branch
          })

          branchInfos.push({
            name: branch,
            current: branch === currentBranch,
            oid,
            ahead: 0, // TODO: Calculate ahead/behind
            behind: 0
          })
        } catch (error) {
          console.warn(`Failed to get info for branch ${branch}:`, error)
        }
      }

      return branchInfos
    } catch (error) {
      console.error('Failed to list branches:', error)
      throw error
    }
  }

  // Create a new branch
  async createBranch(branchName: string, startPoint?: string): Promise<void> {
    try {
      await git.branch({
        fs: this.fs,
        dir: this.dir,
        ref: branchName,
        object: startPoint
      })
      console.log(`✅ Created branch: ${branchName}`)
    } catch (error) {
      console.error(`Failed to create branch ${branchName}:`, error)
      throw error
    }
  }

  // Switch to a branch
  async checkout(branchName: string): Promise<void> {
    try {
      await git.checkout({
        fs: this.fs,
        dir: this.dir,
        ref: branchName
      })
      console.log(`✅ Switched to branch: ${branchName}`)
    } catch (error) {
      console.error(`Failed to checkout branch ${branchName}:`, error)
      throw error
    }
  }

  // Delete a branch
  async deleteBranch(branchName: string): Promise<void> {
    try {
      await git.deleteBranch({
        fs: this.fs,
        dir: this.dir,
        ref: branchName
      })
      console.log(`✅ Deleted branch: ${branchName}`)
    } catch (error) {
      console.error(`Failed to delete branch ${branchName}:`, error)
      throw error
    }
  }

  // Add remote repository
  async addRemote(name: string, url: string, token?: string): Promise<void> {
    try {
      await git.addRemote({
        fs: this.fs,
        dir: this.dir,
        remote: name,
        url
      })

      this.remotes.set(name, { name, url, token })
      console.log(`✅ Added remote: ${name} -> ${url}`)
    } catch (error) {
      console.error(`Failed to add remote ${name}:`, error)
      throw error
    }
  }

  // Remove remote repository
  async removeRemote(name: string): Promise<void> {
    try {
      await git.deleteRemote({
        fs: this.fs,
        dir: this.dir,
        remote: name
      })

      this.remotes.delete(name)
      console.log(`✅ Removed remote: ${name}`)
    } catch (error) {
      console.error(`Failed to remove remote ${name}:`, error)
      throw error
    }
  }

  // List remotes
  async listRemotes(): Promise<GitRemote[]> {
    try {
      const remotes = await git.listRemotes({
        fs: this.fs,
        dir: this.dir
      })

      return remotes.map(remote => ({
        name: remote.remote,
        url: remote.url,
        token: this.remotes.get(remote.remote)?.token
      }))
    } catch (error) {
      console.error('Failed to list remotes:', error)
      return []
    }
  }

  // Push to remote
  async push(remoteName: string = 'origin', branchName?: string): Promise<void> {
    try {
      const currentBranch = branchName || await this.getCurrentBranch()
      const remote = this.remotes.get(remoteName)

      const pushResult = await git.push({
        fs: this.fs,
        http,
        dir: this.dir,
        remote: remoteName,
        ref: currentBranch,
        onAuth: remote?.token ? () => ({
          username: remote.token,
          password: 'x-oauth-basic'
        }) : undefined,
        onAuthFailure: () => {
          throw new Error('Authentication failed. Please check your token.')
        }
      })

      console.log(`✅ Pushed ${currentBranch} to ${remoteName}`)
      return pushResult
    } catch (error) {
      console.error(`Failed to push to ${remoteName}:`, error)
      throw error
    }
  }

  // Pull from remote
  async pull(remoteName: string = 'origin', branchName?: string): Promise<void> {
    try {
      const currentBranch = branchName || await this.getCurrentBranch()
      const remote = this.remotes.get(remoteName)

      await git.pull({
        fs: this.fs,
        http,
        dir: this.dir,
        ref: currentBranch,
        singleBranch: true,
        onAuth: remote?.token ? () => ({
          username: remote.token,
          password: 'x-oauth-basic'
        }) : undefined
      })

      console.log(`✅ Pulled ${currentBranch} from ${remoteName}`)
    } catch (error) {
      console.error(`Failed to pull from ${remoteName}:`, error)
      throw error
    }
  }

  // Clone repository
  async clone(url: string, targetDir: string, token?: string): Promise<void> {
    try {
      await git.clone({
        fs: this.fs,
        http,
        dir: targetDir,
        url,
        singleBranch: true,
        depth: 1,
        onAuth: token ? () => ({
          username: token,
          password: 'x-oauth-basic'
        }) : undefined
      })

      console.log(`✅ Cloned repository to ${targetDir}`)
    } catch (error) {
      console.error(`Failed to clone repository:`, error)
      throw error
    }
  }

  // Get file diff
  async diff(filepath: string, staged: boolean = false): Promise<GitDiffResult | null> {
    try {
      // This is a simplified diff implementation
      // In a full implementation, you'd want to use a proper diff library
      const currentContent = await this.fs.readFile(`${this.dir}/${filepath}`, 'utf8')

      // Get the file content from the last commit
      let lastCommitContent = ''
      try {
        const commits = await this.log({ depth: 1 })
        if (commits.length > 0) {
          const blob = await git.readBlob({
            fs: this.fs,
            dir: this.dir,
            oid: commits[0].oid,
            filepath
          })
          lastCommitContent = new TextDecoder().decode(blob.blob)
        }
      } catch {
        // File might be new
      }

      // Simple line-by-line diff
      const oldLines = lastCommitContent.split('\n')
      const newLines = currentContent.split('\n')

      const hunks = []
      let oldStart = 1
      let newStart = 1
      const lines = []

      // Very basic diff algorithm - in production, use a proper diff library
      const maxLines = Math.max(oldLines.length, newLines.length)
      for (let i = 0; i < maxLines; i++) {
        const oldLine = oldLines[i]
        const newLine = newLines[i]

        if (oldLine === newLine) {
          lines.push({ type: 'context' as const, content: oldLine || '' })
        } else if (oldLine && !newLine) {
          lines.push({ type: 'delete' as const, content: oldLine })
        } else if (!oldLine && newLine) {
          lines.push({ type: 'add' as const, content: newLine })
        } else if (oldLine !== newLine) {
          if (oldLine) lines.push({ type: 'delete' as const, content: oldLine })
          if (newLine) lines.push({ type: 'add' as const, content: newLine })
        }
      }

      if (lines.length > 0) {
        hunks.push({
          oldStart,
          oldLines: oldLines.length,
          newStart,
          newLines: newLines.length,
          lines
        })
      }

      return {
        file: filepath,
        hunks
      }
    } catch (error) {
      console.error(`Failed to get diff for ${filepath}:`, error)
      return null
    }
  }

  // Merge branch
  async merge(branchName: string): Promise<void> {
    try {
      await git.merge({
        fs: this.fs,
        dir: this.dir,
        ours: await this.getCurrentBranch(),
        theirs: branchName
      })
      console.log(`✅ Merged ${branchName} into current branch`)
    } catch (error) {
      console.error(`Failed to merge ${branchName}:`, error)
      throw error
    }
  }

  // Get repository information
  async getRepoInfo(): Promise<{
    isRepo: boolean
    currentBranch: string
    remotes: GitRemote[]
    hasUncommittedChanges: boolean
  }> {
    try {
      const isRepo = await this.isRepo()
      if (!isRepo) {
        return {
          isRepo: false,
          currentBranch: '',
          remotes: [],
          hasUncommittedChanges: false
        }
      }

      const currentBranch = await this.getCurrentBranch()
      const remotes = await this.listRemotes()
      const status = await this.status()
      const hasUncommittedChanges =
        status.staged.length > 0 ||
        status.unstaged.length > 0 ||
        status.untracked.length > 0

      return {
        isRepo: true,
        currentBranch,
        remotes,
        hasUncommittedChanges
      }
    } catch (error) {
      console.error('Failed to get repo info:', error)
      return {
        isRepo: false,
        currentBranch: '',
        remotes: [],
        hasUncommittedChanges: false
      }
    }
  }
}
