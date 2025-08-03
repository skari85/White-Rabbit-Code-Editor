'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileContent } from '@/hooks/use-code-builder';
import { GoogleDriveIntegration, GoogleDriveFile, GoogleDriveProject } from '@/lib/google-drive-integration';
import { 
  Cloud, 
  Upload, 
  Download, 
  Check, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Trash2,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

interface GoogleDriveSyncProps {
  files: FileContent[];
  projectName: string;
  onLoadProject: (files: FileContent[]) => void;
  className?: string;
}

export default function GoogleDriveSync({ files, projectName, onLoadProject, className }: GoogleDriveSyncProps) {
  const [accessToken, setAccessToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('google_drive_token');
    if (savedToken) {
      setAccessToken(savedToken);
      verifyToken(savedToken);
    }

    // Check for OAuth redirect
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const token = urlParams.get('access_token');
    if (token) {
      setAccessToken(token);
      localStorage.setItem('google_drive_token', token);
      verifyToken(token);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const drive = new GoogleDriveIntegration(token);
      const userData = await drive.getUserInfo();
      setUser(userData);
      setIsConnected(true);
      setError('');
      loadProjects(token);
    } catch (err) {
      setIsConnected(false);
      setUser(null);
      setError('Failed to connect to Google Drive');
      localStorage.removeItem('google_drive_token');
    }
  };

  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google Drive integration not configured');
      return;
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const authUrl = GoogleDriveIntegration.getOAuthUrl(clientId, redirectUri);
    window.location.href = authUrl;
  };

  const handleDisconnect = () => {
    setAccessToken('');
    setIsConnected(false);
    setUser(null);
    setProjects([]);
    localStorage.removeItem('google_drive_token');
  };

  const loadProjects = async (token?: string) => {
    const tokenToUse = token || accessToken;
    if (!tokenToUse) return;

    setLoading(true);
    try {
      const drive = new GoogleDriveIntegration(tokenToUse);
      const projectList = await drive.listProjects();
      setProjects(projectList);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (!accessToken || files.length === 0) return;

    setSyncing(true);
    setError('');

    try {
      const drive = new GoogleDriveIntegration(accessToken);
      await drive.saveProject(projectName, files);
      await loadProjects();
      // Success feedback could be added here
    } catch (err) {
      setError('Failed to save project to Google Drive');
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadProject = async (driveFileId: string) => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const drive = new GoogleDriveIntegration(accessToken);
      const project = await drive.loadProject(driveFileId);
      onLoadProject(project.files);
    } catch (err) {
      setError('Failed to load project from Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (driveFileId: string) => {
    if (!accessToken) return;

    try {
      const drive = new GoogleDriveIntegration(accessToken);
      await drive.deleteProject(driveFileId);
      await loadProjects();
    } catch (err) {
      setError('Failed to delete project');
    }
  };

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-500" />
            Google Drive Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-500">
            <Cloud className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>Connect to Google Drive to sync your projects</p>
          </div>
          
          <Button onClick={handleConnect} className="w-full" size="sm">
            <Cloud className="w-3 h-3 mr-1" />
            Connect Google Drive
          </Button>
          
          {error && (
            <div className="text-xs p-2 bg-red-50 text-red-700 border border-red-200 rounded flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Cloud className="w-4 h-4 text-blue-500" />
          Google Drive Sync
          <Badge variant="outline" className="text-xs">
            <Check className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div className="flex items-center gap-2">
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="w-6 h-6 rounded-full"
              />
            )}
            <div>
              <p className="text-xs font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <Button
            onClick={handleDisconnect}
            variant="ghost"
            size="sm"
            className="text-xs text-red-600 hover:text-red-700"
          >
            Disconnect
          </Button>
        </div>

        {/* Current Project */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Current Project</span>
            <Button
              onClick={() => loadProjects()}
              variant="ghost"
              size="sm"
              disabled={loading}
              className="p-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="text-xs text-gray-600">
            <p>{projectName} ({files.length} files)</p>
          </div>
          
          <Button
            onClick={handleSaveProject}
            disabled={syncing || files.length === 0}
            size="sm"
            className="w-full"
          >
            {syncing ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 mr-1" />
                Save to Drive
              </>
            )}
          </Button>
        </div>

        {/* Saved Projects */}
        <div className="space-y-2">
          <span className="text-xs font-medium">Saved Projects ({projects.length})</span>
          
          <div className="max-h-32 overflow-y-auto space-y-1">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FolderOpen className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{project.name.replace('.hexkex', '')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => handleLoadProject(project.id)}
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    title="Load Project"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteProject(project.id)}
                    variant="ghost"
                    size="sm"
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {projects.length === 0 && !loading && (
            <div className="text-center py-4 text-xs text-gray-500">
              No saved projects found
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs p-2 bg-red-50 text-red-700 border border-red-200 rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
