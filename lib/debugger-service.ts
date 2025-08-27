// Basic JavaScript debugging service
// Note: This is a simplified implementation for educational purposes

export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  enabled: boolean;
  condition?: string;
  hitCount: number;
}

export interface DebugVariable {
  name: string;
  value: any;
  type: string;
  scope: 'local' | 'global' | 'closure';
  expandable: boolean;
  children?: DebugVariable[];
}

export interface DebugFrame {
  id: string;
  name: string;
  file: string;
  line: number;
  column: number;
  variables: DebugVariable[];
}

export interface DebugSession {
  id: string;
  state: 'running' | 'paused' | 'stopped';
  currentFrame?: DebugFrame;
  callStack: DebugFrame[];
  breakpoints: Breakpoint[];
  output: string[];
}

export class DebuggerService {
  private sessions: Map<string, DebugSession> = new Map();
  private activeSessionId: string | null = null;
  private breakpointCounter = 0;

  createSession(code: string, fileName: string): string {
    const sessionId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: DebugSession = {
      id: sessionId,
      state: 'stopped',
      callStack: [],
      breakpoints: [],
      output: []
    };

    this.sessions.set(sessionId, session);
    this.activeSessionId = sessionId;
    
    return sessionId;
  }

  getSession(sessionId: string): DebugSession | null {
    return this.sessions.get(sessionId) || null;
  }

  getActiveSession(): DebugSession | null {
    if (!this.activeSessionId) return null;
    return this.sessions.get(this.activeSessionId) || null;
  }

  addBreakpoint(file: string, line: number, condition?: string): Breakpoint {
    const session = this.getActiveSession();
    if (!session) throw new Error('No active debug session');

    const breakpoint: Breakpoint = {
      id: `bp_${++this.breakpointCounter}`,
      file,
      line,
      enabled: true,
      condition,
      hitCount: 0
    };

    session.breakpoints.push(breakpoint);
    return breakpoint;
  }

  removeBreakpoint(breakpointId: string): boolean {
    const session = this.getActiveSession();
    if (!session) return false;

    const index = session.breakpoints.findIndex(bp => bp.id === breakpointId);
    if (index >= 0) {
      session.breakpoints.splice(index, 1);
      return true;
    }
    return false;
  }

  toggleBreakpoint(breakpointId: string): boolean {
    const session = this.getActiveSession();
    if (!session) return false;

    const breakpoint = session.breakpoints.find(bp => bp.id === breakpointId);
    if (breakpoint) {
      breakpoint.enabled = !breakpoint.enabled;
      return true;
    }
    return false;
  }

  getBreakpoints(file?: string): Breakpoint[] {
    const session = this.getActiveSession();
    if (!session) return [];

    return file 
      ? session.breakpoints.filter(bp => bp.file === file)
      : session.breakpoints;
  }

  // Simulate code execution with debugging
  async executeCode(code: string, fileName: string): Promise<void> {
    const session = this.getActiveSession();
    if (!session) throw new Error('No active debug session');

    session.state = 'running';
    session.output = [];

    try {
      // Parse and instrument the code for debugging
      const instrumentedCode = this.instrumentCode(code, fileName);
      
      // Create a sandboxed execution environment
      const debugContext = this.createDebugContext(session);
      
      // Execute the instrumented code
      const result = await this.executeInSandbox(instrumentedCode, debugContext);
      
      session.output.push(`Execution completed: ${result}`);
      session.state = 'stopped';
    } catch (error) {
      session.output.push(`Error: ${error}`);
      session.state = 'stopped';
      throw error;
    }
  }

  stepOver(): void {
    const session = this.getActiveSession();
    if (!session || session.state !== 'paused') return;

    // Simulate stepping over to next line
    if (session.currentFrame) {
      session.currentFrame.line++;
      this.updateVariables(session.currentFrame);
    }
  }

  stepInto(): void {
    const session = this.getActiveSession();
    if (!session || session.state !== 'paused') return;

    // Simulate stepping into function call
    // This would require more sophisticated code analysis
    this.stepOver(); // Simplified implementation
  }

  stepOut(): void {
    const session = this.getActiveSession();
    if (!session || session.state !== 'paused') return;

    // Simulate stepping out of current function
    if (session.callStack.length > 1) {
      session.callStack.pop();
      session.currentFrame = session.callStack[session.callStack.length - 1];
    }
  }

  continue(): void {
    const session = this.getActiveSession();
    if (!session || session.state !== 'paused') return;

    session.state = 'running';
    // Continue execution until next breakpoint or completion
  }

  pause(): void {
    const session = this.getActiveSession();
    if (!session || session.state !== 'running') return;

    session.state = 'paused';
  }

  stop(): void {
    const session = this.getActiveSession();
    if (!session) return;

    session.state = 'stopped';
    session.callStack = [];
    session.currentFrame = undefined;
  }

  evaluateExpression(expression: string): any {
    const session = this.getActiveSession();
    if (!session || !session.currentFrame) {
      throw new Error('No active debug frame');
    }

    try {
      // Create evaluation context with current variables
      const context = this.createEvaluationContext(session.currentFrame);
      
      // Safely evaluate the expression
      return this.safeEval(expression, context);
    } catch (error) {
      throw new Error(`Evaluation error: ${error}`);
    }
  }

  private instrumentCode(code: string, fileName: string): string {
    // Add debugging hooks to the code
    const lines = code.split('\n');
    const instrumented = lines.map((line, index) => {
      const lineNumber = index + 1;
      
      // Check if there's a breakpoint on this line
      const hasBreakpoint = this.getBreakpoints(fileName)
        .some(bp => bp.line === lineNumber && bp.enabled);
      
      if (hasBreakpoint) {
        return `__debugger__.checkBreakpoint('${fileName}', ${lineNumber}); ${line}`;
      }
      
      return line;
    });

    return instrumented.join('\n');
  }

  private createDebugContext(session: DebugSession): any {
    return {
      __debugger__: {
        checkBreakpoint: (file: string, line: number) => {
          const breakpoint = session.breakpoints.find(
            bp => bp.file === file && bp.line === line && bp.enabled
          );
          
          if (breakpoint) {
            breakpoint.hitCount++;
            
            // Check condition if present
            if (breakpoint.condition) {
              try {
                const conditionResult = this.safeEval(breakpoint.condition, {});
                if (!conditionResult) return;
              } catch (error) {
                session.output.push(`Breakpoint condition error: ${error}`);
                return;
              }
            }
            
            // Pause execution
            session.state = 'paused';
            session.currentFrame = {
              id: `frame_${Date.now()}`,
              name: 'main',
              file,
              line,
              column: 1,
              variables: this.extractVariables({})
            };
            session.callStack = [session.currentFrame];
            
            session.output.push(`Breakpoint hit at ${file}:${line}`);
          }
        }
      },
      console: {
        log: (...args: any[]) => {
          session.output.push(`LOG: ${args.join(' ')}`);
        },
        error: (...args: any[]) => {
          session.output.push(`ERROR: ${args.join(' ')}`);
        },
        warn: (...args: any[]) => {
          session.output.push(`WARN: ${args.join(' ')}`);
        }
      }
    };
  }

  private async executeInSandbox(code: string, context: any): Promise<any> {
    // Create a function with the debug context
    const func = new Function(...Object.keys(context), code);
    
    // Execute with the context values
    return func(...Object.values(context));
  }

  private createEvaluationContext(frame: DebugFrame): any {
    const context: any = {};
    
    // Add frame variables to context
    frame.variables.forEach(variable => {
      context[variable.name] = variable.value;
    });
    
    return context;
  }

  private safeEval(expression: string, context: any): any {
    // Create a safe evaluation environment
    const func = new Function(...Object.keys(context), `return (${expression})`);
    return func(...Object.values(context));
  }

  private extractVariables(scope: any): DebugVariable[] {
    const variables: DebugVariable[] = [];
    
    for (const [name, value] of Object.entries(scope)) {
      const type = typeof value;
      const expandable = type === 'object' && value !== null;
      
      variables.push({
        name,
        value: expandable ? `{${Object.keys(value || {}).length} properties}` : value,
        type,
        scope: 'local',
        expandable,
        children: expandable ? this.extractVariables(value) : undefined
      });
    }
    
    return variables;
  }

  private updateVariables(frame: DebugFrame): void {
    // Update variables for current frame
    // This would require access to the actual execution context
    // Simplified implementation
    frame.variables = this.extractVariables({});
  }

  // Utility methods
  getDebugOutput(sessionId?: string): string[] {
    const session = sessionId ? this.getSession(sessionId) : this.getActiveSession();
    return session ? session.output : [];
  }

  clearOutput(sessionId?: string): void {
    const session = sessionId ? this.getSession(sessionId) : this.getActiveSession();
    if (session) {
      session.output = [];
    }
  }

  destroySession(sessionId: string): boolean {
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }
    return this.sessions.delete(sessionId);
  }

  getAllSessions(): DebugSession[] {
    return Array.from(this.sessions.values());
  }
}

// Global debugger instance
export const debuggerService = new DebuggerService();
