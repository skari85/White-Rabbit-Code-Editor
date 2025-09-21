import { useCallback, useEffect, useRef, useState } from 'react';

export interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  status: 'running' | 'completed' | 'error';
  timestamp: Date;
  isBackground?: boolean;
  progress?: {
    total: number;
    current: number;
    label?: string;
  };
}

export interface TerminalSession {
  id: string;
  name: string;
  commands: TerminalCommand[];
  isActive: boolean;
  workingDirectory: string;
  environment: Record<string, string>;
}

export function useTerminal() {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const commandIdRef = useRef(0);

  // Refs for browser-compatible execution state
  const workingDirsRef = useRef<Map<string, string>>(new Map());
  const processesRef = useRef<Map<string, any>>(new Map());
  const projectRootRef = useRef<string>('/workspace');

  // Load persisted sessions
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const saved = window.localStorage.getItem('wr_terminal_sessions');
      const savedActive = window.localStorage.getItem('wr_terminal_active');
      if (saved) {
        const parsed: TerminalSession[] = JSON.parse(saved);
        // Revive dates for commands
        parsed.forEach(s => s.commands.forEach(c => { (c as any).timestamp = new Date(c.timestamp); }));
        setSessions(parsed);
      }
      if (savedActive) setActiveSessionId(savedActive);
    } catch {
      // Silently handle localStorage errors
    }
  }, []);

  // Persist sessions on change
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem('wr_terminal_sessions', JSON.stringify(sessions));
      if (activeSessionId) {
        window.localStorage.setItem('wr_terminal_active', activeSessionId);
      }
    } catch {
      // Silently handle localStorage errors
    }
  }, [sessions, activeSessionId]);

  // Create a new terminal session
  const createSession = useCallback((name: string = 'Terminal') => {
    const sessionId = `session-${Date.now()}`;
    const newSession: TerminalSession = {
      id: sessionId,
      name,
      commands: [],
      isActive: true,
      workingDirectory: process.cwd?.() || '/Users/georgalbert/pwa-code',
      environment: {}
    };

    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(sessionId);
    workingDirsRef.current.set(sessionId, newSession.workingDirectory);
    return sessionId;
  }, []);

  // Helper: Check if command is allowed
  const isAllowedCommand = (exec: string) => {
    const allowed = new Set(['ls', 'pwd', 'cd', 'git', 'npm', 'pnpm', 'yarn', 'node', 'python', 'python3', 'echo', 'cat', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'find', 'which']);
    return allowed.has(exec);
  };

  // Helper: Parse and sanitize command
  const parseCommand = useCallback((command: string): { exec: string; args: string[]; isCd: boolean; newDir?: string } | null => {
    const trimmed = command.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('cd ')) {
      const newDir = trimmed.slice(3).trim().replace(/["'`]/g, ''); // Basic sanitization
      if (newDir.includes('..') || newDir.includes('/etc') || newDir.includes('~')) {
        return null; // Reject potentially dangerous paths
      }
      return { exec: 'cd', args: [], isCd: true, newDir };
    }

    // Simple split, assuming no complex quoting for security (in real app, use proper shell parser)
    const parts = trimmed.split(/\s+/);
    const exec = parts[0];
    const args = parts.slice(1).map(arg => arg.replace(/["';`|$]/g, '')); // Basic sanitization

    if (!isAllowedCommand(exec)) {
      return null; // Reject unknown commands
    }

    return { exec, args, isCd: false };
  }, []);



  // Helper: Get safe cwd
  const getSafeCwd = (sessionId: string) => {
    const sessionDir = workingDirsRef.current.get(sessionId) || projectRootRef.current;
    // Ensure it's within project root to sandbox
    if (!sessionDir.startsWith(projectRootRef.current)) {
      return projectRootRef.current;
    }
    return sessionDir;
  };

  // Rename a session
  const renameSession = useCallback((sessionId: string, newName: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, name: newName } : s));
  }, []);

  // Delete a session
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setActiveSessionId(prev => (prev === sessionId ? null : prev));
  }, []);

  // Execute command in a session
  const executeCommand = useCallback(async (
    command: string,
    sessionId?: string,
    isBackground: boolean = false
  ): Promise<TerminalCommand> => {
    let targetSessionId = sessionId || activeSessionId;
    if (!targetSessionId) {
      targetSessionId = createSession('Terminal');
    }

    const commandId = `cmd-${++commandIdRef.current}`;
    const newCommand: TerminalCommand = {
      id: commandId,
      command,
      output: '',
      status: 'running',
      timestamp: new Date(),
      isBackground
    };

    // Add command to session
    setSessions(prev => prev.map(session =>
      session.id === targetSessionId
        ? { ...session, commands: [...session.commands, newCommand] }
        : session
    ));

    const parsed = parseCommand(command);
    if (!parsed) {
      const errorOutput = 'Command rejected: Invalid or unauthorized command.';
      const errorCmd: TerminalCommand = { ...newCommand, output: errorOutput, status: 'error' };
      setSessions(prev => prev.map(session =>
        session.id === targetSessionId
          ? { ...session, commands: session.commands.map(cmd => cmd.id === commandId ? errorCmd : cmd) }
          : session
      ));
      return errorCmd;
    }

    if (parsed.isCd) {
      // Handle cd command simulation
      const newDir = parsed.newDir || '';
      const currentDir = getSafeCwd(targetSessionId);
      let targetDir = currentDir;

      if (newDir === '..') {
        const parts = currentDir.split('/');
        if (parts.length > 1) {
          parts.pop();
          targetDir = parts.join('/') || '/';
        }
      } else if (newDir && !newDir.startsWith('/')) {
        targetDir = currentDir + '/' + newDir;
      } else if (newDir.startsWith('/')) {
        targetDir = newDir;
      }

      const output = `Changed directory to: ${targetDir}`;
      workingDirsRef.current.set(targetSessionId, targetDir);
      setSessions(prev => prev.map(session =>
        session.id === targetSessionId
          ? { ...session, workingDirectory: targetDir }
          : session
      ));
      const cdCmd: TerminalCommand = { ...newCommand, output, status: 'completed' };
      setSessions(prev => prev.map(session =>
        session.id === targetSessionId
          ? { ...session, commands: session.commands.map(cmd => cmd.id === commandId ? cdCmd : cmd) }
          : session
      ));
      return cdCmd;
    }

    // Simulate command execution for browser environment
    const simulateCommand = async () => {
      let output = '';

      // Simulate different commands
      if (parsed.exec === 'ls' || parsed.exec === 'dir') {
        output = 'package.json\nnode_modules\nsrc\nREADME.md\n.gitignore';
      } else if (parsed.exec === 'pwd') {
        output = getSafeCwd(targetSessionId);
      } else if (parsed.exec === 'whoami') {
        output = 'developer';
      } else if (parsed.exec === 'date') {
        output = new Date().toString();
      } else if (parsed.exec === 'echo') {
        output = parsed.args.join(' ');
      } else if (parsed.exec === 'npm' && parsed.args[0] === 'install') {
        output = 'npm WARN deprecated package@1.0.0\nnpm WARN deprecated another-package@2.0.0\n\nadded 150 packages in 5.2s';
      } else if (parsed.exec === 'npm' && parsed.args[0] === 'run') {
        output = `> ${parsed.args[1]}\n\nStarting development server...\nServer running on http://localhost:3000`;
      } else if (parsed.exec === 'git') {
        if (parsed.args[0] === 'status') {
          output = 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean';
        } else if (parsed.args[0] === 'log') {
          output = 'commit abc123 (HEAD -> main)\nAuthor: Developer <dev@example.com>\nDate: ' + new Date().toDateString() + '\n\n    Latest changes';
        } else {
          output = 'git command executed successfully';
        }
      } else {
        output = `Command '${command}' executed successfully.\nThis is a simulated terminal environment.`;
      }

      return output;
    };

    // Execute the simulated command
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const output = await simulateCommand();
          const finalCmd: TerminalCommand = { ...newCommand, output, status: 'completed' };
          setSessions(prev => prev.map(session =>
            session.id === targetSessionId
              ? { ...session, commands: session.commands.map(cmd => cmd.id === commandId ? finalCmd : cmd) }
              : session
          ));
          resolve(finalCmd);
        } catch (err) {
          const errorOutput = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
          const errorCmd: TerminalCommand = { ...newCommand, output: errorOutput, status: 'error' };
          setSessions(prev => prev.map(session =>
            session.id === targetSessionId
              ? { ...session, commands: session.commands.map(cmd => cmd.id === commandId ? errorCmd : cmd) }
              : session
          ));
          resolve(errorCmd);
        }
      }, 500 + Math.random() * 1000); // Simulate execution time
    });
  }, [activeSessionId, createSession, parseCommand]);

  // Kill a running process (simulated)
  const killProcess = useCallback((commandId: string, sessionId?: string) => {
    const targetSessionId = sessionId || activeSessionId;
    if (!targetSessionId) return;

    // In browser environment, just remove from tracking
    processesRef.current.delete(commandId);

    setSessions(prev => prev.map(session =>
      session.id === targetSessionId
        ? {
            ...session,
            commands: session.commands.map(cmd =>
              cmd.id === commandId && cmd.status === 'running'
                ? { ...cmd, output: cmd.output + '\n^C Process terminated', status: 'completed' }
                : cmd
            )
          }
        : session
    ));
  }, [activeSessionId]);

  // Clear terminal history
  const clearSession = useCallback((sessionId?: string) => {
    const targetSessionId = sessionId || activeSessionId;
    if (!targetSessionId) return;

    setSessions(prev => prev.map(session => 
      session.id === targetSessionId
        ? { ...session, commands: [] }
        : session
    ));
  }, [activeSessionId]);

  // Get active session
  const getActiveSession = useCallback(() => {
    return sessions.find(session => session.id === activeSessionId);
  }, [sessions, activeSessionId]);

  // Open localhost URL in browser
  const openLocalhost = useCallback((port: number = 3000, path: string = '') => {
    const url = `http://localhost:${port}${path}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
    return url;
  }, []);

  // Start a development server
  const startDevServer = useCallback(async (
    projectType: 'next' | 'react' | 'vue' | 'vite' | 'express' = 'next',
    port?: number
  ) => {
    const commands = {
      next: 'npm run dev',
      react: 'npm start',
      vue: 'npm run serve',
      vite: 'npm run dev',
      express: 'npm start'
    };

    const command = commands[projectType];
    const result = await executeCommand(command, undefined, true);
    
    // Auto-open browser after a delay
    setTimeout(() => {
      openLocalhost(port || 3000);
    }, 3000);

    return result;
  }, [executeCommand, openLocalhost]);

  return {
    sessions,
    activeSessionId,
    createSession,
    setActiveSessionId,
    renameSession,
    deleteSession,
    executeCommand,
    killProcess,
    clearSession,
    getActiveSession,
    openLocalhost,
    startDevServer
  };
}
