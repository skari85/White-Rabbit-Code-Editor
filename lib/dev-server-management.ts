'use client'

import { ProjectContext } from './ai-terminal-bridge';

export interface DevServer {
  id: string;
  name: string;
  port: number;
  url: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  framework: string;
  command: string;
  pid?: number;
  startTime?: Date;
  logs: ServerLog[];
  autoRestart: boolean;
  environment: 'development' | 'staging' | 'production';
}

export interface ServerLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: 'server' | 'build' | 'hot-reload' | 'proxy';
}

export interface PortConflict {
  port: number;
  currentProcess: {
    pid: number;
    name: string;
    command: string;
  };
  suggestedPorts: number[];
  resolutionOptions: Array<{
    action: 'kill' | 'change-port' | 'proxy';
    description: string;
    command: string;
    risk: 'low' | 'medium' | 'high';
  }>;
}

export interface ServerConfiguration {
  framework: string;
  defaultPort: number;
  startCommand: string;
  buildCommand?: string;
  testCommand?: string;
  envFile?: string;
  configFiles: string[];
  healthCheckPath: string;
  supportedFeatures: Array<'hot-reload' | 'proxy' | 'https' | 'compression'>;
}

export class DevServerManagement {
  private servers: Map<string, DevServer> = new Map();
  private portRange = { min: 3000, max: 9999 };
  private configurations: Map<string, ServerConfiguration> = new Map();
  private maxLogEntries = 1000;

  constructor() {
    this.initializeConfigurations();
  }

  // Start development server with intelligent port management
  async startServer(
    projectContext: ProjectContext,
    options: {
      preferredPort?: number;
      autoResolveConflicts?: boolean;
      environment?: DevServer['environment'];
    } = {}
  ): Promise<DevServer> {
    const config = this.getServerConfiguration(projectContext.projectType);
    const port = options.preferredPort || config.defaultPort;
    
    // Check for port conflicts
    const conflict = await this.checkPortConflict(port);
    if (conflict && !options.autoResolveConflicts) {
      throw new Error(`Port ${port} is already in use. Use autoResolveConflicts option or choose a different port.`);
    }

    let finalPort = port;
    if (conflict && options.autoResolveConflicts) {
      finalPort = await this.resolvePortConflict(conflict);
    }

    const serverId = `server-${Date.now()}`;
    const server: DevServer = {
      id: serverId,
      name: `${projectContext.projectType} Server`,
      port: finalPort,
      url: `http://localhost:${finalPort}`,
      status: 'starting',
      framework: projectContext.projectType,
      command: this.buildStartCommand(config, finalPort),
      logs: [],
      autoRestart: true,
      environment: options.environment || 'development'
    };

    this.servers.set(serverId, server);
    
    try {
      await this.executeServerStart(server);
      this.addLog(serverId, 'info', `Server started successfully on port ${finalPort}`, 'server');
      return server;
    } catch (error) {
      server.status = 'error';
      this.addLog(serverId, 'error', `Failed to start server: ${error}`, 'server');
      throw error;
    }
  }

  // Stop development server
  async stopServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    if (server.pid) {
      try {
        // In a real implementation, this would kill the actual process
        console.log(`Stopping server with PID ${server.pid}`);
        server.status = 'stopped';
        this.addLog(serverId, 'info', 'Server stopped successfully', 'server');
      } catch (error) {
        this.addLog(serverId, 'error', `Failed to stop server: ${error}`, 'server');
        throw error;
      }
    }
  }

  // Restart development server
  async restartServer(serverId: string): Promise<void> {
    await this.stopServer(serverId);
    const server = this.servers.get(serverId)!;
    server.status = 'starting';
    await this.executeServerStart(server);
  }

  // Get all running servers
  getRunningServers(): DevServer[] {
    return Array.from(this.servers.values()).filter(s => s.status === 'running');
  }

  // Get server by ID
  getServer(serverId: string): DevServer | null {
    return this.servers.get(serverId) || null;
  }

  // Check if port is available
  async checkPortConflict(port: number): Promise<PortConflict | null> {
    // In a real implementation, this would check actual port usage
    // For demo purposes, simulate some conflicts
    const conflictPorts = [3000, 8080, 5000];
    
    if (conflictPorts.includes(port)) {
      return {
        port,
        currentProcess: {
          pid: 12345,
          name: 'node',
          command: 'npm run dev'
        },
        suggestedPorts: await this.findAvailablePorts(3),
        resolutionOptions: [
          {
            action: 'change-port',
            description: `Use port ${port + 1} instead`,
            command: `npm run dev -- --port ${port + 1}`,
            risk: 'low'
          },
          {
            action: 'kill',
            description: 'Kill the existing process',
            command: `kill -9 12345`,
            risk: 'medium'
          },
          {
            action: 'proxy',
            description: 'Set up proxy to existing server',
            command: `npm run proxy -- --target http://localhost:${port}`,
            risk: 'low'
          }
        ]
      };
    }

    return null;
  }

  // Find available ports
  async findAvailablePorts(count: number): Promise<number[]> {
    const availablePorts: number[] = [];
    let currentPort = this.portRange.min;

    while (availablePorts.length < count && currentPort <= this.portRange.max) {
      const conflict = await this.checkPortConflict(currentPort);
      if (!conflict) {
        availablePorts.push(currentPort);
      }
      currentPort++;
    }

    return availablePorts;
  }

  // Resolve port conflict automatically
  async resolvePortConflict(conflict: PortConflict): Promise<number> {
    // Try suggested ports first
    for (const port of conflict.suggestedPorts) {
      const newConflict = await this.checkPortConflict(port);
      if (!newConflict) {
        return port;
      }
    }

    // Find any available port
    const availablePorts = await this.findAvailablePorts(1);
    if (availablePorts.length > 0) {
      return availablePorts[0];
    }

    throw new Error('No available ports found');
  }

  // Get server health status
  async getServerHealth(serverId: string): Promise<{
    status: 'healthy' | 'unhealthy' | 'unknown';
    responseTime?: number;
    lastCheck: Date;
    issues: string[];
  }> {
    const server = this.servers.get(serverId);
    if (!server) {
      return {
        status: 'unknown',
        lastCheck: new Date(),
        issues: ['Server not found']
      };
    }

    // In a real implementation, this would make HTTP requests to check health
    const isHealthy = server.status === 'running';
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      responseTime: isHealthy ? 150 : undefined,
      lastCheck: new Date(),
      issues: isHealthy ? [] : ['Server not responding']
    };
  }

  // Get server logs
  getServerLogs(serverId: string, options: {
    level?: ServerLog['level'];
    source?: ServerLog['source'];
    limit?: number;
    since?: Date;
  } = {}): ServerLog[] {
    const server = this.servers.get(serverId);
    if (!server) return [];

    let logs = server.logs;

    // Filter by level
    if (options.level) {
      logs = logs.filter(log => log.level === options.level);
    }

    // Filter by source
    if (options.source) {
      logs = logs.filter(log => log.source === options.source);
    }

    // Filter by date
    if (options.since) {
      logs = logs.filter(log => log.timestamp >= options.since!);
    }

    // Limit results
    if (options.limit) {
      logs = logs.slice(-options.limit);
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Add log entry
  private addLog(
    serverId: string,
    level: ServerLog['level'],
    message: string,
    source: ServerLog['source']
  ): void {
    const server = this.servers.get(serverId);
    if (!server) return;

    const log: ServerLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      source
    };

    server.logs.push(log);

    // Limit log entries
    if (server.logs.length > this.maxLogEntries) {
      server.logs = server.logs.slice(-this.maxLogEntries);
    }
  }

  // Execute server start (simulated)
  private async executeServerStart(server: DevServer): Promise<void> {
    // Simulate server startup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    server.status = 'running';
    server.pid = Math.floor(Math.random() * 10000) + 1000;
    server.startTime = new Date();
    
    // Simulate some startup logs
    this.addLog(server.id, 'info', 'Starting development server...', 'server');
    this.addLog(server.id, 'info', `Server running on ${server.url}`, 'server');
    this.addLog(server.id, 'info', 'Hot reload enabled', 'hot-reload');
  }

  // Build start command based on configuration
  private buildStartCommand(config: ServerConfiguration, port: number): string {
    let command = config.startCommand;
    
    // Add port parameter if needed
    if (port !== config.defaultPort) {
      if (config.framework === 'next') {
        command += ` -- --port ${port}`;
      } else if (config.framework === 'react' || config.framework === 'vue') {
        command += ` -- --port ${port}`;
      } else {
        command += ` --port ${port}`;
      }
    }
    
    return command;
  }

  // Get server configuration for framework
  private getServerConfiguration(framework: string): ServerConfiguration {
    return this.configurations.get(framework) || this.configurations.get('default')!;
  }

  // Initialize framework configurations
  private initializeConfigurations(): void {
    const configs: ServerConfiguration[] = [
      {
        framework: 'next',
        defaultPort: 3000,
        startCommand: 'npm run dev',
        buildCommand: 'npm run build',
        testCommand: 'npm test',
        configFiles: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
        healthCheckPath: '/',
        supportedFeatures: ['hot-reload', 'proxy', 'https']
      },
      {
        framework: 'react',
        defaultPort: 3000,
        startCommand: 'npm start',
        buildCommand: 'npm run build',
        testCommand: 'npm test',
        configFiles: ['package.json', 'vite.config.js', 'webpack.config.js'],
        healthCheckPath: '/',
        supportedFeatures: ['hot-reload', 'proxy']
      },
      {
        framework: 'vue',
        defaultPort: 8080,
        startCommand: 'npm run serve',
        buildCommand: 'npm run build',
        testCommand: 'npm run test:unit',
        configFiles: ['vue.config.js', 'vite.config.js'],
        healthCheckPath: '/',
        supportedFeatures: ['hot-reload', 'proxy']
      },
      {
        framework: 'angular',
        defaultPort: 4200,
        startCommand: 'ng serve',
        buildCommand: 'ng build',
        testCommand: 'ng test',
        configFiles: ['angular.json', 'ng.json'],
        healthCheckPath: '/',
        supportedFeatures: ['hot-reload', 'proxy']
      },
      {
        framework: 'node',
        defaultPort: 3000,
        startCommand: 'npm start',
        buildCommand: 'npm run build',
        testCommand: 'npm test',
        configFiles: ['package.json'],
        healthCheckPath: '/health',
        supportedFeatures: ['proxy']
      },
      {
        framework: 'default',
        defaultPort: 3000,
        startCommand: 'npm start',
        buildCommand: 'npm run build',
        testCommand: 'npm test',
        configFiles: ['package.json'],
        healthCheckPath: '/',
        supportedFeatures: []
      }
    ];

    configs.forEach(config => {
      this.configurations.set(config.framework, config);
    });
  }
}
