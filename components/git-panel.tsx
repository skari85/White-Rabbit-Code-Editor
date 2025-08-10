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
  const session = useMemo(() => terminal.getActiveSession() || terminal.createSession('Git'), [terminal]);

  const run = async (cmd: string) => {
    await terminal.executeCommand(cmd, (session as any)?.id);
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="border-b p-2 flex items-center gap-2">
        <GitBranch className="w-4 h-4" />
        <span className="text-sm">Git Basics</span>
      </div>

      <div className="p-3 space-y-3">
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
          <Button size="sm" onClick={() => run(`git commit -m \"${commitMsg || 'update'}\"`)}>
            <GitCommit className="w-4 h-4 mr-1" /> Commit
          </Button>
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

