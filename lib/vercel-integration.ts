import { FileContent } from '@/hooks/use-code-builder';

export interface VercelDeployment {
  id: string;
  url: string;
  name: string;
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  createdAt: number;
  readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR';
}

export interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  createdAt: number;
  updatedAt: number;
  link?: {
    type: 'github';
    repo: string;
    repoId: number;
  };
}

export interface VercelDeploymentFile {
  file: string;
  data: string;
  encoding?: 'utf8' | 'base64';
}

export class VercelIntegration {
  private apiToken: string;
  private baseUrl = 'https://api.vercel.com';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getUser() {
    return this.makeRequest('/v2/user');
  }

  async getProjects() {
    return this.makeRequest('/v9/projects');
  }

  async createProject(name: string, gitRepository?: { type: 'github'; repo: string }) {
    const body: any = { name };
    
    if (gitRepository) {
      body.gitRepository = gitRepository;
    }

    return this.makeRequest('/v9/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async deployProject(
    projectName: string, 
    files: FileContent[], 
    target: 'production' | 'preview' = 'production'
  ): Promise<VercelDeployment> {
    // Convert files to Vercel format
    const vercelFiles: VercelDeploymentFile[] = files.map(file => ({
      file: file.name,
      data: file.content,
      encoding: 'utf8'
    }));

    // Add package.json if not present
    const hasPackageJson = files.some(f => f.name === 'package.json');
    if (!hasPackageJson) {
      vercelFiles.push({
        file: 'package.json',
        data: JSON.stringify({
          name: projectName.toLowerCase().replace(/\s+/g, '-'),
          version: '1.0.0',
          description: 'PWA created with Hex & Kex',
          main: 'index.html',
          scripts: {
            start: 'serve -s .',
            build: 'echo "No build step required"'
          },
          devDependencies: {
            serve: '^14.0.0'
          }
        }, null, 2),
        encoding: 'utf8'
      });
    }

    // Add vercel.json for PWA configuration
    const hasVercelJson = files.some(f => f.name === 'vercel.json');
    if (!hasVercelJson) {
      vercelFiles.push({
        file: 'vercel.json',
        data: JSON.stringify({
          version: 2,
          public: true,
          headers: [
            {
              source: '/service-worker.js',
              headers: [
                {
                  key: 'Cache-Control',
                  value: 'public, max-age=0, must-revalidate'
                }
              ]
            },
            {
              source: '/manifest.json',
              headers: [
                {
                  key: 'Content-Type',
                  value: 'application/manifest+json'
                }
              ]
            }
          ],
          rewrites: [
            {
              source: '/(.*)',
              destination: '/index.html'
            }
          ]
        }, null, 2),
        encoding: 'utf8'
      });
    }

    const deploymentData = {
      name: projectName.toLowerCase().replace(/\s+/g, '-'),
      files: vercelFiles,
      projectSettings: {
        framework: null,
        buildCommand: null,
        outputDirectory: null,
        installCommand: null,
        devCommand: null
      },
      target,
      meta: {
        'hex-kex-deployment': 'true',
        'created-with': 'Hex & Kex PWA Builder'
      }
    };

    return this.makeRequest('/v13/deployments', {
      method: 'POST',
      body: JSON.stringify(deploymentData),
    });
  }

  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    return this.makeRequest(`/v13/deployments/${deploymentId}`);
  }

  async getDeployments(projectId?: string) {
    const endpoint = projectId 
      ? `/v6/deployments?projectId=${projectId}` 
      : '/v6/deployments';
    return this.makeRequest(endpoint);
  }

  async deleteDeployment(deploymentId: string) {
    return this.makeRequest(`/v13/deployments/${deploymentId}`, {
      method: 'DELETE',
    });
  }

  async getDomains() {
    return this.makeRequest('/v5/domains');
  }

  async addDomain(name: string, projectId: string) {
    return this.makeRequest('/v10/projects/' + projectId + '/domains', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  // Helper method to generate deployment URL
  static getDeploymentUrl(deployment: VercelDeployment): string {
    return `https://${deployment.url}`;
  }

  // Helper method to check if deployment is ready
  static isDeploymentReady(deployment: VercelDeployment): boolean {
    return deployment.state === 'READY' && deployment.readyState === 'READY';
  }

  // Helper method to check if deployment failed
  static isDeploymentFailed(deployment: VercelDeployment): boolean {
    return deployment.state === 'ERROR';
  }

  // Helper method to validate API token format
  static isValidToken(token: string): boolean {
    // Vercel tokens typically start with 'vercel_' or are 24-character strings
    return /^(vercel_[a-zA-Z0-9]+|[a-zA-Z0-9]{24})$/.test(token);
  }

  // Helper method to generate project name from title
  static sanitizeProjectName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit length
  }
}

// Default configuration for PWA deployments
export const DEFAULT_PWA_CONFIG = {
  framework: null,
  buildCommand: null,
  outputDirectory: null,
  installCommand: 'npm install',
  devCommand: 'npm start'
};

// Common Vercel regions
export const VERCEL_REGIONS = [
  { id: 'iad1', name: 'Washington, D.C., USA' },
  { id: 'sfo1', name: 'San Francisco, CA, USA' },
  { id: 'lhr1', name: 'London, United Kingdom' },
  { id: 'fra1', name: 'Frankfurt, Germany' },
  { id: 'sin1', name: 'Singapore' },
  { id: 'syd1', name: 'Sydney, Australia' },
  { id: 'hnd1', name: 'Tokyo, Japan' },
  { id: 'gru1', name: 'São Paulo, Brazil' }
];
