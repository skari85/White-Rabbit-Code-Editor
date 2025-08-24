import { useState, useCallback, useRef } from 'react';

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
    return sessionId;
  }, []);

  // Execute command in a session
  const executeCommand = useCallback(async (
    command: string,
    sessionId?: string,
    isBackground: boolean = false
  ): Promise<TerminalCommand> => {
    let targetSessionId = sessionId || activeSessionId;
    if (!targetSessionId) {
      // Auto-create a default terminal session to avoid race conditions
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

    try {
      // In a real implementation, this would execute the actual command
      // For now, we'll simulate different types of commands
      let output = '';
      let status: 'completed' | 'error' = 'completed';

      if (command.includes('npm start') || command.includes('pnpm start') || command.includes('yarn start')) {
        output = `Starting development server...\nLocal: http://localhost:3000\nNetwork: http://192.168.1.100:3000`;
        if (isBackground) {
          // For background processes, we'll keep them running
          setTimeout(() => {
            setSessions(prev => prev.map(session => 
              session.id === targetSessionId
                ? {
                    ...session, 
                    commands: session.commands.map(cmd => 
                      cmd.id === commandId 
                        ? { ...cmd, output: output + '\n✓ Ready in development mode', status: 'completed' }
                        : cmd
                    )
                  }
                : session
            ));
          }, 2000);
        }
      } else if (command.includes('npm install') || command.includes('pnpm install') || command.includes('yarn')) {
        output = `Installing dependencies...\n✓ Dependencies installed successfully`;
      } else if (command.includes('npm run build') || command.includes('pnpm run build') || command.includes('yarn build')) {
        // Simulate a multi-step build with progress updates
        const steps = [
          { label: 'Fetching dependencies...', delay: 700 },
          { label: 'Compiling assets...', delay: 1200 },
          { label: 'Running tests...', delay: 1500 },
          { label: 'Optimizing bundles...', delay: 900 },
          { label: 'Finalizing build...', delay: 800 }
        ];

        // Initialize as running with progress
        setSessions(prev => prev.map(session =>
          session.id === targetSessionId
            ? {
                ...session,
                commands: session.commands.map(cmd =>
                  cmd.id === commandId
                    ? { ...cmd, output: 'Starting build...\n', status: 'running', progress: { total: steps.length, current: 0, label: 'Starting build...' } }
                    : cmd
                )
              }
            : session
        ));

        // Orchestrate steps sequentially
        await new Promise<void>(resolve => {
          let idx = 0;
          const runStep = () => {
            if (idx >= steps.length) {
              // Complete
              setSessions(prev => prev.map(session =>
                session.id === targetSessionId
                  ? {
                      ...session,
                      commands: session.commands.map(cmd =>
                        cmd.id === commandId
                          ? { ...cmd, output: (cmd.output + '✓ Build completed successfully\n'), status: 'completed', progress: { total: steps.length, current: steps.length, label: 'Completed' } }
                          : cmd
                      )
                    }
                  : session
              ));
              resolve();
              return;
            }
            const step = steps[idx];
            setSessions(prev => prev.map(session =>
              session.id === targetSessionId
                ? {
                    ...session,
                    commands: session.commands.map(cmd =>
                      cmd.id === commandId
                        ? { ...cmd, output: (cmd.output + step.label + '\n'), progress: { total: steps.length, current: idx + 1, label: step.label }, status: 'running' }
                        : cmd
                    )
                  }
                : session
            ));
            setTimeout(() => {
              idx += 1;
              runStep();
            }, step.delay);
          };
          runStep();
        });
        // Return early since we already updated sessions and completed
        const finalCommand: TerminalCommand = {
          ...newCommand,
          output: 'Build finished',
          status: 'completed'
        };
        return finalCommand;
      } else if (command.startsWith('git ')) {
        // Lightweight simulated git commands
        if (command.startsWith('git init')) {
          output = `Initialized empty Git repository in ${process.cwd?.() || '/repo'}\.git/`;
        } else if (command.startsWith('git status')) {
          output = `On branch main\n\nNo commits yet\n\nnothing to commit (create/copy files and use "git add" to track)`;
        } else if (command.startsWith('git add')) {
          output = `Files staged for commit.`;
        } else if (command.startsWith('git commit')) {
          const msgMatch = command.match(/-m\s+"([^"]*)"/);
          const msg = msgMatch ? msgMatch[1] : 'update';
          output = `[main (root-commit) abc1234] ${msg}\n 1 file changed, 1 insertion(+)`;
        } else if (command.startsWith('git push')) {
          output = `Pushing to origin main...\n✓ Push simulated (configure a remote to push for real)`;
        } else if (command.startsWith('git branch')) {
          output = `* main`;
        } else if (command.startsWith('git log')) {
          output = `abc1234 Initial commit\nabc1235 Update files`;
        } else if (command.startsWith('git remote')) {
          output = `Remote updated.`;
        } else {
          output = `git: command not recognized in demo environment.`;
        }
      } else if (command.includes('ls') || command.includes('dir')) {
        output = `app/  components/  hooks/  lib/  public/  styles/  package.json  README.md`;
      } else if (command.includes('pwd')) {
        output = `/Users/georgalbert/pwa-code`;
      } else if (command.includes('cd ')) {
        const newDir = command.replace('cd ', '').trim();
        output = `Changed directory to: ${newDir}`;
        // Update working directory in session
        setSessions(prev => prev.map(session =>
          session.id === targetSessionId
            ? { ...session, workingDirectory: newDir }
            : session
        ));
      } else if (command.includes('git')) {
        if (command.includes('git status')) {
          output = `On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean`;
        } else if (command.includes('git log')) {
          output = `commit abc123 (HEAD -> main, origin/main)\nAuthor: Developer\nDate: ${new Date().toDateString()}\n\n    Latest changes`;
        } else {
          output = `git command executed: ${command}`;
        }
      } else if (command.includes('python') || command.includes('node')) {
        output = `Executing: ${command}\n✓ Script completed successfully`;
      } else if (command.includes('test-error')) {
        // Simulate various error types for testing
        output = `npm ERR! code ENOENT\nnpm ERR! syscall open\nnpm ERR! path /Users/georgalbert/pwa-code-3/package.json\nnpm ERR! errno -2\nnpm ERR! enoent ENOENT: no such file or directory, open '/Users/georgalbert/pwa-code-3/package.json'\nnpm ERR! enoent This is related to npm not being able to find a file.\nnpm ERR! enoent \n\nSyntaxError: Unexpected token '}' in components/terminal.tsx:45:12\n    at Module._compile (internal/modules/cjs/loader.js:723:23)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:593:12)\n    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:60:12)\n    at internal/main/run_main_module.js:17:47`;
        status = 'error';
      } else if (command.includes('test-warning')) {
        // Simulate warnings for testing
        output = `npm WARN deprecated request@2.88.2: request has been deprecated, see https://github.com/request/request/issues/3142\nnpm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@2.3.2 (node_modules/fsevents):\nnpm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@2.3.2: wanted {"os":"darwin","arch":"any"} (current: {"os":"linux","arch":"x64"})\n\nwarning: LF will be replaced by CRLF in package.json.\nwarning: The file will have its original line endings in your working directory`;
      } else if (command.includes('test-success')) {
        // Simulate success messages for testing
        output = `✓ Dependencies installed successfully\n✓ Build completed in 2.3s\n✓ Tests passed: 15/15\n✨ Ready on http://localhost:3000\n🎉 Deployment successful!`;
      } else if (command.includes('test-long')) {
        // Simulate long output for testing collapsible feature
        const lines = [];
        for (let i = 1; i <= 25; i++) {
          lines.push(`Line ${i}: This is a long output line to test the collapsible feature`);
        }
        output = lines.join('\n');
      } else {
        output = `Command executed: ${command}\n✓ Completed`;
      }

      // Update command with result
      const updatedCommand: TerminalCommand = {
        ...newCommand,
        output,
        status
      };

      setSessions(prev => prev.map(session => 
        session.id === targetSessionId
          ? {
              ...session, 
              commands: session.commands.map(cmd => 
                cmd.id === commandId ? updatedCommand : cmd
              )
            }
          : session
      ));

      return updatedCommand;

    } catch (error) {
      const errorCommand: TerminalCommand = {
        ...newCommand,
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error'
      };

      setSessions(prev => prev.map(session => 
        session.id === targetSessionId
          ? {
              ...session, 
              commands: session.commands.map(cmd => 
                cmd.id === commandId ? errorCommand : cmd
              )
            }
          : session
      ));

      return errorCommand;
    }
  }, [activeSessionId]);

  // Kill a running process
  const killProcess = useCallback((commandId: string, sessionId?: string) => {
    const targetSessionId = sessionId || activeSessionId;
    if (!targetSessionId) return;

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
    executeCommand,
    killProcess,
    clearSession,
    getActiveSession,
    openLocalhost,
    startDevServer
  };
}
