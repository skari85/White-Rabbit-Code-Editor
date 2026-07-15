import JSZip from 'jszip';
import { FileContent } from '@/hooks/use-code-builder';

export interface NetlifyDeployment {
  id: string;
  url: string;
  deploy_ssl_url: string;
  state: 'new' | 'pending' | 'building' | 'ready' | 'error';
}

export interface NetlifySite {
  id: string;
  name: string;
  url: string;
  ssl_url: string;
}

export class NetlifyIntegration {
  private apiToken: string;
  private baseUrl = 'https://api.netlify.com/api/v1';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Netlify API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getUser() {
    return this.makeRequest('/user');
  }

  async getSites(): Promise<NetlifySite[]> {
    return this.makeRequest('/sites');
  }

  async getDeployment(deployId: string): Promise<NetlifyDeployment> {
    return this.makeRequest(`/deploys/${deployId}`);
  }

  private async createSite(name: string): Promise<NetlifySite> {
    return this.makeRequest('/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  }

  private async buildZip(files: FileContent[]): Promise<Blob> {
    const zip = new JSZip();
    for (const file of files) {
      zip.file(file.name, file.content);
    }
    return zip.generateAsync({ type: 'blob' });
  }

  async deployProject(
    projectName: string,
    files: FileContent[],
    siteId?: string
  ): Promise<NetlifyDeployment> {
    const site = siteId
      ? { id: siteId }
      : await this.createSite(NetlifyIntegration.sanitizeSiteName(projectName));

    const zipBlob = await this.buildZip(files);

    return this.makeRequest(`/sites/${site.id}/deploys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/zip' },
      body: zipBlob,
    });
  }

  // Helper method to generate deployment URL
  static getDeploymentUrl(deployment: NetlifyDeployment): string {
    return deployment.deploy_ssl_url || deployment.url;
  }

  // Helper method to check if deployment is ready
  static isDeploymentReady(deployment: NetlifyDeployment): boolean {
    return deployment.state === 'ready';
  }

  // Helper method to check if deployment failed
  static isDeploymentFailed(deployment: NetlifyDeployment): boolean {
    return deployment.state === 'error';
  }

  // Helper method to generate a valid Netlify site name from a project title
  static sanitizeSiteName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }
}
