import { CompileVibeState } from '@/components/compile-vibes';

export interface CompileVibeEvent {
  id: string;
  command: string;
  state: CompileVibeState;
  timestamp: Date;
  progress?: number;
  duration?: number;
  exitCode?: number;
  output?: string;
  error?: string;
}

export interface CompileVibeConfig {
  enabled: boolean;
  showForCommands: string[];
  animationDuration: number;
  autoHideDelay: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  size: 'small' | 'medium' | 'large';
  sensitivity: 'low' | 'medium' | 'high'; // How sensitive to trigger animations
}

export type CompileVibeListener = (event: CompileVibeEvent) => void;

export class CompileVibesService {
  private listeners: Set<CompileVibeListener> = new Set();
  private activeEvents: Map<string, CompileVibeEvent> = new Map();
  private config: CompileVibeConfig;
  private eventCounter = 0;

  // Common build/compile commands that should trigger animations
  private readonly BUILD_COMMANDS = [
    'npm run build',
    'npm run dev',
    'yarn build',
    'yarn dev',
    'pnpm build',
    'pnpm dev',
    'next build',
    'next dev',
    'vite build',
    'vite dev',
    'webpack',
    'rollup',
    'tsc',
    'babel',
    'electron:dev',
    'electron:build',
    'cargo build',
    'cargo run',
    'go build',
    'go run',
    'mvn compile',
    'mvn package',
    'gradle build',
    'make',
    'cmake',
    'docker build',
    'docker-compose up'
  ];

  // Commands that indicate testing
  private readonly TEST_COMMANDS = [
    'npm test',
    'npm run test',
    'yarn test',
    'pnpm test',
    'jest',
    'vitest',
    'cypress',
    'playwright',
    'cargo test',
    'go test',
    'mvn test',
    'gradle test'
  ];

  // Commands that indicate deployment/publishing
  private readonly DEPLOY_COMMANDS = [
    'npm publish',
    'yarn publish',
    'pnpm publish',
    'vercel deploy',
    'netlify deploy',
    'docker push',
    'git push',
    'cargo publish'
  ];

  constructor(config?: Partial<CompileVibeConfig>) {
    this.config = {
      enabled: true,
      showForCommands: [...this.BUILD_COMMANDS, ...this.TEST_COMMANDS, ...this.DEPLOY_COMMANDS],
      animationDuration: 2000,
      autoHideDelay: 3000,
      position: 'top-right',
      size: 'medium',
      sensitivity: 'medium',
      ...config
    };
  }

  /**
   * Subscribe to compile vibe events
   */
  subscribe(listener: CompileVibeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CompileVibeConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   */
  getConfig(): CompileVibeConfig {
    return { ...this.config };
  }

  /**
   * Start tracking a command execution
   */
  startCommand(command: string): string {
    if (!this.config.enabled || !this.shouldShowVibeForCommand(command)) {
      return '';
    }

    const eventId = `compile-vibe-${++this.eventCounter}`;
    const event: CompileVibeEvent = {
      id: eventId,
      command,
      state: 'building',
      timestamp: new Date(),
      duration: this.config.animationDuration
    };

    this.activeEvents.set(eventId, event);
    this.notifyListeners(event);

    return eventId;
  }

  /**
   * Update command progress
   */
  updateProgress(eventId: string, progress: number): void {
    const event = this.activeEvents.get(eventId);
    if (!event) return;

    const updatedEvent: CompileVibeEvent = {
      ...event,
      state: 'progress',
      progress: Math.max(0, Math.min(100, progress))
    };

    this.activeEvents.set(eventId, updatedEvent);
    this.notifyListeners(updatedEvent);
  }

  /**
   * Complete a command with success
   */
  completeSuccess(eventId: string, output?: string): void {
    const event = this.activeEvents.get(eventId);
    if (!event) return;

    const updatedEvent: CompileVibeEvent = {
      ...event,
      state: 'success',
      exitCode: 0,
      output
    };

    this.activeEvents.set(eventId, updatedEvent);
    this.notifyListeners(updatedEvent);

    // Auto-cleanup after delay
    setTimeout(() => {
      this.activeEvents.delete(eventId);
    }, this.config.autoHideDelay);
  }

  /**
   * Complete a command with failure
   */
  completeFailure(eventId: string, exitCode: number, error?: string): void {
    const event = this.activeEvents.get(eventId);
    if (!event) return;

    const updatedEvent: CompileVibeEvent = {
      ...event,
      state: 'failure',
      exitCode,
      error
    };

    this.activeEvents.set(eventId, updatedEvent);
    this.notifyListeners(updatedEvent);

    // Auto-cleanup after delay (longer for failures so user can see)
    setTimeout(() => {
      this.activeEvents.delete(eventId);
    }, this.config.autoHideDelay * 1.5);
  }

  /**
   * Cancel/abort a command
   */
  cancelCommand(eventId: string): void {
    const event = this.activeEvents.get(eventId);
    if (!event) return;

    this.activeEvents.delete(eventId);
  }

  /**
   * Get all active events
   */
  getActiveEvents(): CompileVibeEvent[] {
    return Array.from(this.activeEvents.values());
  }

  /**
   * Clear all active events
   */
  clearAll(): void {
    this.activeEvents.clear();
  }

  /**
   * Check if a command should trigger compile vibes
   */
  private shouldShowVibeForCommand(command: string): boolean {
    const normalizedCommand = command.toLowerCase().trim();
    
    // Check exact matches first
    if (this.config.showForCommands.some(cmd => 
      normalizedCommand === cmd.toLowerCase() || 
      normalizedCommand.startsWith(cmd.toLowerCase() + ' ')
    )) {
      return true;
    }

    // Check for partial matches based on sensitivity
    switch (this.config.sensitivity) {
      case 'high':
        return this.isLikelyBuildCommand(normalizedCommand);
      case 'medium':
        return this.BUILD_COMMANDS.some(cmd => 
          normalizedCommand.includes(cmd.toLowerCase())
        );
      case 'low':
        return this.BUILD_COMMANDS.some(cmd => 
          normalizedCommand.startsWith(cmd.toLowerCase())
        );
      default:
        return false;
    }
  }

  /**
   * Heuristic to detect if a command is likely a build/compile command
   */
  private isLikelyBuildCommand(command: string): boolean {
    const buildKeywords = [
      'build', 'compile', 'bundle', 'pack', 'dist', 'deploy', 
      'start', 'dev', 'serve', 'run', 'exec', 'test', 'lint',
      'format', 'check', 'verify', 'install', 'update'
    ];

    const buildFileExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte',
      '.py', '.java', '.go', '.rs', '.cpp', '.c'
    ];

    // Check for build keywords
    if (buildKeywords.some(keyword => command.includes(keyword))) {
      return true;
    }

    // Check for file extensions that suggest compilation
    if (buildFileExtensions.some(ext => command.includes(ext))) {
      return true;
    }

    // Check for common build tools
    const buildTools = ['webpack', 'vite', 'rollup', 'parcel', 'esbuild', 'swc'];
    if (buildTools.some(tool => command.includes(tool))) {
      return true;
    }

    return false;
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(event: CompileVibeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in compile vibe listener:', error);
      }
    });
  }

  /**
   * Get animation type based on command
   */
  getAnimationTypeForCommand(command: string): CompileVibeState {
    const normalizedCommand = command.toLowerCase();

    if (this.TEST_COMMANDS.some(cmd => normalizedCommand.includes(cmd))) {
      return 'progress'; // Tests often show progress
    }

    if (this.DEPLOY_COMMANDS.some(cmd => normalizedCommand.includes(cmd))) {
      return 'building'; // Deployments are usually building-style
    }

    // Default to building for most commands
    return 'building';
  }

  /**
   * Estimate command duration based on command type
   */
  estimateCommandDuration(command: string): number {
    const normalizedCommand = command.toLowerCase();

    // Quick commands
    if (normalizedCommand.includes('lint') || normalizedCommand.includes('format')) {
      return 1000;
    }

    // Test commands
    if (this.TEST_COMMANDS.some(cmd => normalizedCommand.includes(cmd))) {
      return 3000;
    }

    // Build commands
    if (normalizedCommand.includes('build') || normalizedCommand.includes('compile')) {
      return 5000;
    }

    // Deploy commands
    if (this.DEPLOY_COMMANDS.some(cmd => normalizedCommand.includes(cmd))) {
      return 8000;
    }

    // Default
    return this.config.animationDuration;
  }

  /**
   * Parse command output to extract progress information
   */
  parseProgressFromOutput(output: string): number | null {
    // Look for percentage patterns
    const percentageMatch = output.match(/(\d+)%/);
    if (percentageMatch) {
      return parseInt(percentageMatch[1], 10);
    }

    // Look for fraction patterns like "5/10" or "5 of 10"
    const fractionMatch = output.match(/(\d+)\s*(?:\/|of)\s*(\d+)/);
    if (fractionMatch) {
      const current = parseInt(fractionMatch[1], 10);
      const total = parseInt(fractionMatch[2], 10);
      return Math.round((current / total) * 100);
    }

    // Look for webpack-style progress
    const webpackMatch = output.match(/(\d+)\/(\d+)\s+modules/);
    if (webpackMatch) {
      const current = parseInt(webpackMatch[1], 10);
      const total = parseInt(webpackMatch[2], 10);
      return Math.round((current / total) * 100);
    }

    return null;
  }

  /**
   * Determine if output indicates success or failure
   */
  analyzeCommandResult(output: string, exitCode?: number): 'success' | 'failure' | 'unknown' {
    if (exitCode !== undefined) {
      return exitCode === 0 ? 'success' : 'failure';
    }

    const lowerOutput = output.toLowerCase();

    // Success indicators
    const successKeywords = [
      'success', 'completed', 'done', 'finished', 'built successfully',
      'compiled successfully', 'tests passed', 'all tests passed',
      'deployment successful', 'published successfully'
    ];

    if (successKeywords.some(keyword => lowerOutput.includes(keyword))) {
      return 'success';
    }

    // Failure indicators
    const failureKeywords = [
      'error', 'failed', 'failure', 'exception', 'fatal',
      'compilation failed', 'build failed', 'tests failed',
      'deployment failed', 'publish failed'
    ];

    if (failureKeywords.some(keyword => lowerOutput.includes(keyword))) {
      return 'failure';
    }

    return 'unknown';
  }
}
