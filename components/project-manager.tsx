/**
 * White Rabbit Code Editor - Project Manager Component
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FolderOpen,
  Plus,
  Settings,
  Star,
  Clock,
  Code,
  Globe,
  Server,
  Smartphone,
  Monitor,
  Package,
  ChevronDown,
  ExternalLink,
  Trash2,
  Edit,
  Copy,
  Play
} from 'lucide-react'
import { 
  ProjectManagementService, 
  ProjectConfig, 
  ProjectTemplate,
  ProjectType,
  Workspace
} from '@/lib/project-management-service'
import { useAnalytics } from '@/hooks/use-analytics'

interface ProjectManagerProps {
  projectService: ProjectManagementService
  onProjectSelect?: (project: ProjectConfig) => void
  onWorkspaceSelect?: (workspace: Workspace) => void
  className?: string
}

export function ProjectManager({ 
  projectService, 
  onProjectSelect,
  onWorkspaceSelect,
  className 
}: ProjectManagerProps) {
  const [currentProject, setCurrentProject] = useState<ProjectConfig | null>(null)
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [recentProjects, setRecentProjects] = useState<ProjectConfig[]>([])
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [showOpenProjectDialog, setShowOpenProjectDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectPath, setNewProjectPath] = useState('')
  const [projectPath, setProjectPath] = useState('')

  const { trackFeatureUsed } = useAnalytics()

  // Load data on mount
  useEffect(() => {
    setCurrentProject(projectService.getCurrentProject())
    setCurrentWorkspace(projectService.getCurrentWorkspace())
    setTemplates(projectService.getProjectTemplates())
    setRecentProjects(projectService.getRecentProjects())

    // Set up callbacks
    projectService['onProjectChange'] = (project: ProjectConfig | null) => {
      setCurrentProject(project)
      onProjectSelect?.(project!)
    }

    projectService['onWorkspaceChange'] = (workspace: Workspace | null) => {
      setCurrentWorkspace(workspace)
      onWorkspaceSelect?.(workspace!)
    }

    return () => {
      projectService['onProjectChange'] = undefined
      projectService['onWorkspaceChange'] = undefined
    }
  }, [projectService, onProjectSelect, onWorkspaceSelect])

  // Create new project
  const handleCreateProject = async () => {
    if (!selectedTemplate || !newProjectName.trim() || !newProjectPath.trim()) {
      return
    }

    try {
      const project = await projectService.createProject(selectedTemplate, newProjectName, newProjectPath)
      setShowNewProjectDialog(false)
      setNewProjectName('')
      setNewProjectPath('')
      setSelectedTemplate('')
      trackFeatureUsed('project_create', { template: selectedTemplate })
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  // Open existing project
  const handleOpenProject = async () => {
    if (!projectPath.trim()) return

    try {
      await projectService.loadProject(projectPath)
      setShowOpenProjectDialog(false)
      setProjectPath('')
      trackFeatureUsed('project_open')
    } catch (error) {
      console.error('Failed to open project:', error)
    }
  }

  // Open recent project
  const handleOpenRecentProject = async (project: ProjectConfig) => {
    try {
      await projectService.loadProject(project.rootPath)
      trackFeatureUsed('project_open_recent')
    } catch (error) {
      console.error('Failed to open recent project:', error)
    }
  }

  // Get project type icon
  const getProjectTypeIcon = (type: ProjectType) => {
    const icons = {
      web: <Globe className="w-4 h-4" />,
      node: <Server className="w-4 h-4" />,
      react: <Code className="w-4 h-4" />,
      vue: <Code className="w-4 h-4" />,
      angular: <Code className="w-4 h-4" />,
      python: <Code className="w-4 h-4" />,
      rust: <Code className="w-4 h-4" />,
      go: <Code className="w-4 h-4" />,
      java: <Code className="w-4 h-4" />,
      csharp: <Code className="w-4 h-4" />,
      mobile: <Smartphone className="w-4 h-4" />,
      desktop: <Monitor className="w-4 h-4" />,
      library: <Package className="w-4 h-4" />,
      custom: <Settings className="w-4 h-4" />
    }
    return icons[type] || <Code className="w-4 h-4" />
  }

  // Get language color
  const getLanguageColor = (language: string) => {
    const colors = {
      typescript: 'bg-blue-500',
      javascript: 'bg-yellow-500',
      python: 'bg-green-500',
      rust: 'bg-orange-500',
      go: 'bg-cyan-500',
      java: 'bg-red-500',
      csharp: 'bg-purple-500',
      cpp: 'bg-blue-600',
      php: 'bg-indigo-500',
      ruby: 'bg-red-600'
    }
    return colors[language as keyof typeof colors] || 'bg-gray-500'
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const featuredTemplates = templates.filter(t => t.featured)
  const allTemplates = templates

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Projects
            {currentProject && (
              <Badge variant="outline" className="text-xs">
                {currentProject.name}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowNewProjectDialog(true)}>
              <Plus className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowOpenProjectDialog(true)}>
              <FolderOpen className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
          </TabsList>

          {/* Recent Projects Tab */}
          <TabsContent value="recent" className="space-y-3">
            {recentProjects.length > 0 ? (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {recentProjects.map((project, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded border hover:bg-muted cursor-pointer"
                      onClick={() => handleOpenRecentProject(project)}
                    >
                      <div className="flex items-center gap-3">
                        {getProjectTypeIcon(project.type)}
                        <div>
                          <div className="font-medium text-sm">{project.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {project.rootPath}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${getLanguageColor(project.language)}`} />
                            <span className="text-xs text-muted-foreground capitalize">
                              {project.language}
                            </span>
                            {project.framework && (
                              <Badge variant="secondary" className="text-xs">
                                {project.framework}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                          {formatDate(project.updatedAt)}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenRecentProject(project)}>
                              <FolderOpen className="w-3 h-3 mr-2" />
                              Open Project
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ExternalLink className="w-3 h-3 mr-2" />
                              Open in File Manager
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="w-3 h-3 mr-2" />
                              Copy Path
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-3 h-3 mr-2" />
                              Remove from Recent
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent projects</p>
                <p className="text-xs">Create or open a project to get started</p>
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-3">
            {/* Featured Templates */}
            {featuredTemplates.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Star className="w-3 h-3" />
                  Featured
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {featuredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="p-3 rounded border hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setSelectedTemplate(template.id)
                        setShowNewProjectDialog(true)
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getProjectTypeIcon(template.type)}
                          <span className="font-medium text-sm">{template.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getLanguageColor(template.language)}`} />
                          <span className="text-xs text-muted-foreground capitalize">
                            {template.language}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* All Templates */}
            <div className="space-y-2">
              <div className="text-sm font-medium">All Templates</div>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {allTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer text-sm"
                      onClick={() => {
                        setSelectedTemplate(template.id)
                        setShowNewProjectDialog(true)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {getProjectTypeIcon(template.type)}
                        <span>{template.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getLanguageColor(template.language)}`} />
                        <span className="text-xs text-muted-foreground capitalize">
                          {template.language}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Workspace Tab */}
          <TabsContent value="workspace" className="space-y-3">
            {currentWorkspace ? (
              <div className="space-y-3">
                <div className="p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{currentWorkspace.name}</div>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentWorkspace.path}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Last opened: {formatDate(currentWorkspace.lastOpened)}
                  </div>
                </div>

                {currentWorkspace.projects.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Projects in Workspace</div>
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {currentWorkspace.projects.map((project, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer text-sm"
                            onClick={() => handleOpenRecentProject(project)}
                          >
                            <div className="flex items-center gap-2">
                              {getProjectTypeIcon(project.type)}
                              <span>{project.name}</span>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Play className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No workspace open</p>
                <p className="text-xs">Create or open a workspace to manage multiple projects</p>
                <Button variant="outline" size="sm" className="mt-2">
                  <Plus className="w-3 h-3 mr-2" />
                  Create Workspace
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* New Project Dialog */}
        <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Choose a template and configure your new project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          {getProjectTypeIcon(template.type)}
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="my-awesome-project"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-path">Project Path</Label>
                <Input
                  id="project-path"
                  value={newProjectPath}
                  onChange={(e) => setNewProjectPath(e.target.value)}
                  placeholder="/path/to/project"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateProject}
                  disabled={!selectedTemplate || !newProjectName.trim() || !newProjectPath.trim()}
                >
                  Create Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Open Project Dialog */}
        <Dialog open={showOpenProjectDialog} onOpenChange={setShowOpenProjectDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Open Project</DialogTitle>
              <DialogDescription>
                Select a project folder to open
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-path">Project Path</Label>
                <Input
                  id="project-path"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  placeholder="/path/to/existing/project"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowOpenProjectDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleOpenProject}
                  disabled={!projectPath.trim()}
                >
                  Open Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
