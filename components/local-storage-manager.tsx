'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Folder, 
  FolderPlus, 
  HardDrive, 
  Plus, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';
import { useLocalStorage, LocalFolder, LocalProject } from '@/hooks/use-local-storage';

interface LocalStorageManagerProps {
  onProjectLoad?: (project: LocalProject) => void;
  onProjectCreate?: (project: LocalProject) => void;
}

export function LocalStorageManager({ onProjectLoad, onProjectCreate }: LocalStorageManagerProps) {
  const {
    isSupported,
    folders,
    currentProject,
    isLoading,
    error,
    selectFolder,
    createProjectFolder,
    loadProject,
    listProjects,
    removeFolder,
    setError
  } = useLocalStorage();

  const [selectedFolder, setSelectedFolder] = useState<LocalFolder | null>(null);
  const [projects, setProjects] = useState<string[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showProjectsDialog, setShowProjectsDialog] = useState(false);

  // Handle folder selection
  const handleSelectFolder = async () => {
    const folder = await selectFolder();
    if (folder) {
      setSelectedFolder(folder);
      // Load projects in this folder
      const folderProjects = await listProjects(folder);
      setProjects(folderProjects);
    }
  };

  // Handle project creation
  const handleCreateProject = async () => {
    if (!selectedFolder || !newProjectName.trim()) return;

    const project = await createProjectFolder(selectedFolder, newProjectName.trim());
    if (project) {
      setNewProjectName('');
      setShowCreateDialog(false);
      onProjectCreate?.(project);
      
      // Refresh projects list
      const folderProjects = await listProjects(selectedFolder);
      setProjects(folderProjects);
    }
  };

  // Handle project loading
  const handleLoadProject = async (projectName: string) => {
    if (!selectedFolder) return;

    const project = await loadProject(selectedFolder, projectName);
    if (project) {
      setShowProjectsDialog(false);
      onProjectLoad?.(project);
    }
  };

  // Handle folder projects view
  const handleViewProjects = async (folder: LocalFolder) => {
    setSelectedFolder(folder);
    const folderProjects = await listProjects(folder);
    setProjects(folderProjects);
    setShowProjectsDialog(true);
  };

  if (!isSupported) {
    return (
      <Card className="bg-gray-950 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-400">
            <AlertCircle className="w-5 h-5" />
            Local Storage Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn't support the File System Access API. This feature requires a modern browser like Chrome, Edge, or Opera.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To use local folder access, please use a supported browser or enable the feature in your browser settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gray-950 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-400" />
            Local Storage Manager
          </CardTitle>
          <CardDescription>
            Access and manage folders on your local drive for project storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSelectFolder}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FolderPlus className="w-4 h-4" />
              )}
              Select Folder
            </Button>
            
            {currentProject && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                {currentProject.name} loaded
              </Badge>
            )}
          </div>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
                className="mt-2"
              >
                Dismiss
              </Button>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Folders List */}
      {folders.length > 0 && (
        <Card className="bg-gray-950 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg">Connected Folders</CardTitle>
            <CardDescription>
              Folders you've previously connected to this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-800 hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="font-medium">{folder.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {folder.projectCount} projects
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {folder.lastAccessed.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProjects(folder)}
                        disabled={!folder.handle}
                        className="flex items-center gap-1"
                      >
                        <Folder className="w-3 h-3" />
                        View Projects
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!folder.handle}
                            className="flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            New Project
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-950 border-gray-800">
                          <DialogHeader>
                            <DialogTitle>Create New Project</DialogTitle>
                            <DialogDescription>
                              Create a new project in {folder.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="project-name">Project Name</Label>
                              <Input
                                id="project-name"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Enter project name"
                                className="bg-gray-900 border-gray-700"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => {
                                setSelectedFolder(folder);
                                handleCreateProject();
                              }}
                              disabled={!newProjectName.trim() || isLoading}
                            >
                              {isLoading ? (
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Plus className="w-4 h-4 mr-2" />
                              )}
                              Create Project
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFolder(folder.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Projects Dialog */}
      <Dialog open={showProjectsDialog} onOpenChange={setShowProjectsDialog}>
        <DialogContent className="bg-gray-950 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Projects in {selectedFolder?.name}</DialogTitle>
            <DialogDescription>
              Select a project to load or create a new one
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No projects found in this folder</p>
                <p className="text-sm mt-1">Create your first project below</p>
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {projects.map((projectName) => (
                    <div
                      key={projectName}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-800 hover:bg-gray-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="w-4 h-4 text-blue-400" />
                        <span className="font-medium">{projectName}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadProject(projectName)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <FileText className="w-3 h-3 mr-1" />
                        )}
                        Load
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            <Separator />
            
            <div className="space-y-3">
              <Label htmlFor="new-project">Create New Project</Label>
              <div className="flex gap-2">
                <Input
                  id="new-project"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="bg-gray-900 border-gray-700"
                />
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
