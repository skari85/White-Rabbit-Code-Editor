"use client";

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GitBranch, GitCommit, Upload, FileText } from 'lucide-react';
import { useTerminal } from '@/hooks/use-terminal';

interface GitPanelProps {
  className?: string;
}

export default function GitPanel({ className = '' }: GitPanelProps) {
  const terminal = useTerminal();
  const [commitMsg, setCommitMsg] = useState("");
  const [gitStatus, setGitStatus] = useState<string>("");
  const session = useMemo(() => terminal.getActiveSession() || terminal.createSession('Git'), [terminal]);

  const run = async (cmd: string) => {
    try {
      await terminal.executeCommand(cmd, (session as any)?.id);
    } catch (error) {
      console.error('Git command failed:', error);
      setGitStatus(`Error: ${error}`);
    }
  };

  // Test git functionality
  const testGitConnection = async () => {
    try {
      setGitStatus('Testing git connection...');
      
      // Check if we have the required environment variables
      const hasRepo = process.env.NEXT_PUBLIC_GITHUB_REPO || process.env.GITHUB_REPO;
      const hasToken = process.env.GITHUB_TOKEN;
      
      if (!hasRepo) {
        setGitStatus('Missing GITHUB_REPO environment variable');
        return;
      }
      
      if (!hasToken) {
        setGitStatus('Missing GITHUB_TOKEN environment variable');
        return;
      }
      
      setGitStatus(`Git configured: ${hasRepo}`);
      
      // Test basic git commands
      await run('git --version');
      await run('git status');
      
    } catch (error) {
      setGitStatus(`Git test failed: ${error}`);
    }
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="border-b p-2 flex items-center gap-2">
        <GitBranch className="w-4 h-4" />
        <span className="text-sm">Git Basics</span>
      </div>

      <div className="p-3 space-y-3">
        {/* Git Status Display */}
        <div className="bg-gray-50 p-2 rounded text-xs">
          <div className="font-medium mb-1">Git Status:</div>
          <div className="text-gray-600">{gitStatus || 'Ready to use git commands'}</div>
        </div>

        {/* Test Connection */}
        <div className="space-y-2">
          <Button size="sm" variant="outline" onClick={testGitConnection} className="w-full">
            Test Git Connection
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => run('git init')}>Init</Button>
          <Button size="sm" variant="outline" onClick={() => run('git status')}>Status</Button>
          <Button size="sm" variant="outline" onClick={() => run('git add .')}>Add All</Button>
          <Button size="sm" variant="outline" onClick={() => run('git branch')}>Branch</Button>
          <Button size="sm" variant="outline" onClick={() => run('git log -n 5')}>Log</Button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Commit message</label>
          <Input value={commitMsg} onChange={(e) => setCommitMsg(e.target.value)} placeholder="feat: add feature" />
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="secondary" onClick={() => run(`git commit -m "${commitMsg || 'update'}"`)}>
              <GitCommit className="w-4 h-4 mr-1" /> Commit (local)
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                try {
                  setGitStatus('Committing to GitHub...');
                  // Collect files from editor via global hook
                  const files = (window as any).wrGetProjectFiles?.() || [];
                  const payload = { files: files.map((f: any) => ({ path: f.name, content: f.content })), message: commitMsg };
                  const res = await fetch('/api/git/commit', { method: 'POST', body: JSON.stringify(payload) });
                  const data = await res.json();
                  
                  if (res.ok) {
                    setGitStatus(`Committed successfully: ${data.commit}`);
                    await run(`echo "Committed ${data.commit}"`);
                  } else {
                    setGitStatus(`Commit failed: ${data.error}`);
                    await run(`echo "Commit failed: ${data.error}"`);
                  }
                } catch (error) {
                  setGitStatus(`Commit error: ${error}`);
                  console.error('GitHub commit failed:', error);
                }
              }}
            >
              <GitCommit className="w-4 h-4 mr-1" /> Commit (GitHub)
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Push</label>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => run('git push origin main')}>
              <Upload className="w-4 h-4 mr-1" /> Push origin main
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Note: Git commands are simulated in this demo environment.</p>
        </div>
      </div>

      <div className="border-t mt-auto p-2 text-xs text-muted-foreground flex items-center gap-2">
        <FileText className="w-3 h-3" />
        <span>Use the Terminal tab to see command outputs.</span>
      </div>
    </div>
  );
}