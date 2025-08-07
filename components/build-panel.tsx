/**
 * White Rabbit Code Editor - Build Panel Component
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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Hammer,
  Play,
  Square,
  Settings,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Server,
  FileText,
  Image,
  Code,
  Palette,
  ChevronDown,
  Plus,
  Trash2
} from 'lucide-react'
import { 
  BuildSystemService, 
  BuildConfiguration, 
  BuildResult,
  BuildAsset,
  BuildTool
} from '@/lib/build-system-service'
import { useAnalytics } from '@/hooks/use-analytics'

interface BuildPanelProps {
  buildSystem: BuildSystemService
  onOpenUrl?: (url: string) => void
  className?: string
}

export function BuildPanel({ buildSystem, onOpenUrl, className }: BuildPanelProps) {
  const [configurations, setConfigurations] = useState<BuildConfiguration[]>([])
  const [activeConfig, setActiveConfig] = useState<string | null>(null)
  const [buildResults, setBuildResults] = useState<Map<string, BuildResult>>(new Map())
  const [buildStatus, setBuildStatus] = useState<Map<string, string>>(new Map())
  const [devServers, setDevServers] = useState<Array<{ configId: string; url: string; startTime: number }>>([])
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)

  const { trackFeatureUsed } = useAnalytics()

  // Load configurations and status
  useEffect(() => {
    const loadData = () => {
      setConfigurations(buildSystem.getConfigurations())
      setDevServers(buildSystem.getRunningDevServers())
      
      // Update build status for all configs
      const statusMap = new Map()
      buildSystem.getConfigurations().forEach(config => {
        statusMap.set(config.id, buildSystem.getBuildStatus(config.id))
      })
      setBuildStatus(statusMap)
    }

    loadData()
    
    // Set up build system callbacks
    buildSystem['onBuildUpdate'] = (configId: string, result: BuildResult) => {
      setBuildResults(prev => new Map(prev.set(configId, result)))
      setBuildStatus(prev => new Map(prev.set(configId, result.success ? 'success' : 'error')))
      setIsBuilding(false)
    }

    buildSystem['onDevServerUpdate'] = (configId: string, status: string, url?: string) => {
      if (status === 'running' && url) {
        setDevServers(prev => [...prev.filter(s => s.configId !== configId), {
          configId,
          url,
          startTime: Date.now()
        }])
      } else if (status === 'stopped') {
        setDevServers(prev => prev.filter(s => s.configId !== configId))
      }
    }

    return () => {
      buildSystem['onBuildUpdate'] = undefined
      buildSystem['onDevServerUpdate'] = undefined
    }
  }, [buildSystem])

  // Handle build
  const handleBuild = async (configId: string) => {
    setIsBuilding(true)
    setBuildStatus(prev => new Map(prev.set(configId, 'building')))
    
    try {
      await buildSystem.build(configId)
      trackFeatureUsed('build_execute')
    } catch (error) {
      console.error('Build failed:', error)
      setIsBuilding(false)
    }
  }

  // Handle dev server start
  const handleStartDevServer = async (configId: string) => {
    try {
      const url = await buildSystem.startDevServer(configId)
      trackFeatureUsed('dev_server_start')
    } catch (error) {
      console.error('Failed to start dev server:', error)
    }
  }

  // Handle dev server stop
  const handleStopDevServer = async (configId: string) => {
    try {
      await buildSystem.stopDevServer(configId)
      trackFeatureUsed('dev_server_stop')
    } catch (error) {
      console.error('Failed to stop dev server:', error)
    }
  }

  // Cancel build
  const handleCancelBuild = (configId: string) => {
    buildSystem.cancelBuild(configId)
    setBuildStatus(prev => new Map(prev.set(configId, 'idle')))
    setIsBuilding(false)
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'building': return 'text-blue-500'
      case 'success': return 'text-green-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'building': return <RefreshCw className="w-3 h-3 animate-spin" />
      case 'success': return <CheckCircle className="w-3 h-3" />
      case 'error': return <AlertTriangle className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  // Get tool icon
  const getToolIcon = (tool: BuildTool) => {
    switch (tool) {
      case 'vite': return <Zap className="w-4 h-4" />
      case 'webpack': return <Hammer className="w-4 h-4" />
      case 'next': return <Code className="w-4 h-4" />
      default: return <Settings className="w-4 h-4" />
    }
  }

  // Get asset icon
  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'js': return <Code className="w-3 h-3" />
      case 'css': return <Palette className="w-3 h-3" />
      case 'html': return <FileText className="w-3 h-3" />
      case 'image': return <Image className="w-3 h-3" />
      default: return <FileText className="w-3 h-3" />
    }
  }

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const activeConfiguration = activeConfig ? configurations.find(c => c.id === activeConfig) : configurations[0]
  const activeBuildResult = activeConfiguration ? buildResults.get(activeConfiguration.id) : null
  const activeStatus = activeConfiguration ? buildStatus.get(activeConfiguration.id) || 'idle' : 'idle'

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Hammer className="w-4 h-4" />
            Build System
            {activeConfiguration && (
              <Badge variant="outline" className={`text-xs ${getStatusColor(activeStatus)}`}>
                {getStatusIcon(activeStatus)}
                {activeStatus}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm">
              <Plus className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Configuration Selector */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 justify-between">
                <div className="flex items-center gap-2">
                  {activeConfiguration && getToolIcon(activeConfiguration.tool)}
                  {activeConfiguration?.name || 'Select Configuration'}
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              {configurations.map((config) => (
                <DropdownMenuItem
                  key={config.id}
                  onClick={() => setActiveConfig(config.id)}
                  className="flex items-center gap-2"
                >
                  {getToolIcon(config.tool)}
                  {config.name}
                  <Badge variant="outline" className="ml-auto text-xs">
                    {config.tool}
                  </Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {activeConfiguration && (
          <>
            {/* Build Controls */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleBuild(activeConfiguration.id)}
                disabled={activeStatus === 'building'}
                className="flex-1"
              >
                {activeStatus === 'building' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Hammer className="w-4 h-4 mr-2" />
                )}
                {activeStatus === 'building' ? 'Building...' : 'Build'}
              </Button>
              
              {activeStatus === 'building' && (
                <Button
                  variant="outline"
                  onClick={() => handleCancelBuild(activeConfiguration.id)}
                >
                  <Square className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Dev Server Controls */}
            <div className="flex gap-2">
              {devServers.find(s => s.configId === activeConfiguration.id) ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const server = devServers.find(s => s.configId === activeConfiguration.id)
                      if (server) onOpenUrl?.(server.url)
                    }}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Server
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStopDevServer(activeConfiguration.id)}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleStartDevServer(activeConfiguration.id)}
                  className="flex-1"
                >
                  <Server className="w-4 h-4 mr-2" />
                  Start Dev Server
                </Button>
              )}
            </div>

            <Separator />

            {/* Build Results */}
            <Tabs defaultValue="output" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="output">Output</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="config">Config</TabsTrigger>
              </TabsList>

              {/* Output Tab */}
              <TabsContent value="output" className="space-y-3">
                {activeBuildResult && (
                  <div className="space-y-3">
                    {/* Build Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Duration: {formatDuration(activeBuildResult.duration)}</span>
                      </div>
                      {activeBuildResult.stats && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>Size: {formatSize(activeBuildResult.stats.totalSize)}</span>
                        </div>
                      )}
                    </div>

                    {/* Errors and Warnings */}
                    {activeBuildResult.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-red-500 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Errors ({activeBuildResult.errors.length})
                        </h4>
                        <ScrollArea className="h-32">
                          <div className="space-y-2">
                            {activeBuildResult.errors.map((error, index) => (
                              <div key={index} className="p-2 rounded border border-red-200 bg-red-50 text-sm">
                                <div className="font-medium text-red-700">{error.message}</div>
                                {error.file && (
                                  <div className="text-xs text-red-600 mt-1">
                                    {error.file}:{error.line}:{error.column}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {activeBuildResult.warnings.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-yellow-500 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Warnings ({activeBuildResult.warnings.length})
                        </h4>
                        <ScrollArea className="h-24">
                          <div className="space-y-2">
                            {activeBuildResult.warnings.map((warning, index) => (
                              <div key={index} className="p-2 rounded border border-yellow-200 bg-yellow-50 text-sm">
                                <div className="font-medium text-yellow-700">{warning.message}</div>
                                {warning.file && (
                                  <div className="text-xs text-yellow-600 mt-1">
                                    {warning.file}:{warning.line}:{warning.column}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {activeBuildResult.success && activeBuildResult.errors.length === 0 && (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Build completed successfully
                      </div>
                    )}
                  </div>
                )}

                {!activeBuildResult && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Hammer className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No build results yet</p>
                    <p className="text-xs">Run a build to see output</p>
                  </div>
                )}
              </TabsContent>

              {/* Assets Tab */}
              <TabsContent value="assets" className="space-y-3">
                {activeBuildResult?.assets && activeBuildResult.assets.length > 0 ? (
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {activeBuildResult.assets.map((asset, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex items-center gap-2">
                            {getAssetIcon(asset.type)}
                            <span className="text-sm font-medium">{asset.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {asset.type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatSize(asset.size)}
                            {asset.gzipSize && (
                              <span className="ml-2">({formatSize(asset.gzipSize)} gzipped)</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No assets generated</p>
                    <p className="text-xs">Build your project to see assets</p>
                  </div>
                )}
              </TabsContent>

              {/* Config Tab */}
              <TabsContent value="config" className="space-y-3">
                <ScrollArea className="h-48">
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Tool:</span>
                        <div className="flex items-center gap-2 mt-1">
                          {getToolIcon(activeConfiguration.tool)}
                          {activeConfiguration.tool}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Mode:</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {activeConfiguration.mode}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Entry:</span>
                      <div className="text-muted-foreground mt-1">{activeConfiguration.entry}</div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Output:</span>
                      <div className="text-muted-foreground mt-1">{activeConfiguration.output}</div>
                    </div>

                    {activeConfiguration.port && (
                      <div>
                        <span className="font-medium">Dev Server:</span>
                        <div className="text-muted-foreground mt-1">
                          {activeConfiguration.host}:{activeConfiguration.port}
                        </div>
                      </div>
                    )}

                    {activeConfiguration.plugins && activeConfiguration.plugins.length > 0 && (
                      <div>
                        <span className="font-medium">Plugins:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activeConfiguration.plugins.map((plugin, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {plugin}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        )}

        {configurations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No build configurations</p>
            <p className="text-xs">Add a configuration to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
