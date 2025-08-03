import { FileContent } from '@/hooks/use-code-builder';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
}

export interface GoogleDriveProject {
  id: string;
  name: string;
  files: FileContent[];
  createdAt: string;
  updatedAt: string;
  driveFileId: string;
}

export class GoogleDriveIntegration {
  private accessToken: string;
  private readonly FOLDER_NAME = 'Hex & Kex Projects';
  private readonly PROJECT_MIME_TYPE = 'application/json';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`https://www.googleapis.com/drive/v3${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Drive API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  private async uploadFile(endpoint: string, metadata: any, content?: string) {
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    let body = delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata);
    
    if (content) {
      body += delimiter + 'Content-Type: text/plain\r\n\r\n' + content;
    }
    
    body += close_delim;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Drive upload error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getUserInfo() {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  async findOrCreateFolder(): Promise<string> {
    // Search for existing folder
    const searchResponse = await this.makeRequest(
      `/files?q=name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    );

    if (searchResponse.files && searchResponse.files.length > 0) {
      return searchResponse.files[0].id;
    }

    // Create folder if it doesn't exist
    const folderMetadata = {
      name: this.FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const folder = await this.makeRequest('/files', {
      method: 'POST',
      body: JSON.stringify(folderMetadata),
    });

    return folder.id;
  }

  async saveProject(projectName: string, files: FileContent[]): Promise<GoogleDriveProject> {
    const folderId = await this.findOrCreateFolder();
    
    const projectData: GoogleDriveProject = {
      id: crypto.randomUUID(),
      name: projectName,
      files,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      driveFileId: '',
    };

    const fileMetadata = {
      name: `${projectName}.hexkex`,
      parents: [folderId],
      description: `Hex & Kex PWA project: ${projectName}`,
    };

    const result = await this.uploadFile(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      fileMetadata,
      JSON.stringify(projectData, null, 2)
    );

    projectData.driveFileId = result.id;
    return projectData;
  }

  async updateProject(driveFileId: string, projectName: string, files: FileContent[]): Promise<GoogleDriveProject> {
    const projectData: GoogleDriveProject = {
      id: crypto.randomUUID(),
      name: projectName,
      files,
      createdAt: new Date().toISOString(), // We don't have the original date
      updatedAt: new Date().toISOString(),
      driveFileId,
    };

    const fileMetadata = {
      name: `${projectName}.hexkex`,
      description: `Hex & Kex PWA project: ${projectName} (Updated)`,
    };

    await this.uploadFile(
      `https://www.googleapis.com/upload/drive/v3/files/${driveFileId}?uploadType=multipart`,
      fileMetadata,
      JSON.stringify(projectData, null, 2)
    );

    return projectData;
  }

  async loadProject(driveFileId: string): Promise<GoogleDriveProject> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to load project from Google Drive');
    }

    const content = await response.text();
    return JSON.parse(content);
  }

  async listProjects(): Promise<GoogleDriveFile[]> {
    const folderId = await this.findOrCreateFolder();
    
    const response = await this.makeRequest(
      `/files?q=parents in '${folderId}' and name contains '.hexkex' and trashed=false&orderBy=modifiedTime desc`
    );

    return response.files || [];
  }

  async deleteProject(driveFileId: string): Promise<void> {
    await this.makeRequest(`/files/${driveFileId}`, {
      method: 'DELETE',
    });
  }

  async shareProject(driveFileId: string, email?: string): Promise<string> {
    // Make file publicly viewable
    await this.makeRequest(`/files/${driveFileId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    // If email provided, share with specific user
    if (email) {
      await this.makeRequest(`/files/${driveFileId}/permissions`, {
        method: 'POST',
        body: JSON.stringify({
          role: 'reader',
          type: 'user',
          emailAddress: email,
        }),
      });
    }

    // Get shareable link
    const file = await this.makeRequest(`/files/${driveFileId}?fields=webViewLink`);
    return file.webViewLink;
  }

  // Helper method to check if token is valid
  static async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Helper method to get OAuth URL
  static getOAuthUrl(clientId: string, redirectUri: string): string {
    const scope = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      response_type: 'token',
      include_granted_scopes: 'true',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Helper method to extract token from OAuth redirect
  static extractTokenFromUrl(url: string): string | null {
    const match = url.match(/access_token=([^&]+)/);
    return match ? match[1] : null;
  }
}

// Default Google Drive configuration
export const GOOGLE_DRIVE_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/google-callback` : '',
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.profile'
  ],
};

// File type mappings for Google Drive
export const DRIVE_FILE_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
};
