/**
 * White Rabbit Code Editor - Extension Manager Component
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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
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
  Puzzle,
  Download,
  Trash2,
  Settings,
  Search,
  Star,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Plus,
  Code,
  Palette,
  Bug,
  Zap,
  Package
} from 'lucide-react'
import { 
  ExtensionSystem, 
  Extension, 
  ExtensionManifest,
  ExtensionCategory
} from '@/lib/extension-system'
import { useAnalytics } from '@/hooks/use-analytics'

interface ExtensionManagerProps {
  extensionSystem: ExtensionSystem
  className?: string
}

interface MarketplaceExtension {
  id: string
  manifest: ExtensionManifest
  downloads: number
  rating: number
  reviews: number
  featured: boolean
  verified: boolean
  lastUpdated: string
}

export function ExtensionManager({ extensionSystem, className }: ExtensionManagerProps) {
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [marketplaceExtensions, setMarketplaceExtensions] = useState<MarketplaceExtension[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ExtensionCategory | 'All'>('All')
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { trackFeatureUsed } = useAnalytics()

  // Load extensions
  useEffect(() => {
    loadExtensions()
    loadMarketplaceExtensions()
  }, [extensionSystem])

  const loadExtensions = () => {
    setExtensions(extensionSystem.getExtensions())
  }

  const loadMarketplaceExtensions = () => {
    // Simulate marketplace extensions
    const mockExtensions: MarketplaceExtension[] = [
      {
        id: 'ms-python.python',
        manifest: {
          id: 'ms-python.python',
          name: 'python',
          version: '2024.0.1',
          description: 'IntelliSense, linting, debugging, code navigation, code formatting, refactoring, variable explorer, test explorer, and more!',
          author: 'Microsoft',
          displayName: 'Python',
          category: 'Programming Languages',
          keywords: ['python', 'intellisense', 'debugging'],
          engines: { whiterabbit: '^1.0.0' },
          contributes: {
            languages: [{ id: 'python', extensions: ['.py'], aliases: ['Python'] }]
          },
          activationEvents: ['onLanguage:python']
        },
        downloads: 50000000,
        rating: 4.5,
        reviews: 12000,
        featured: true,
        verified: true,
        lastUpdated: '2024-01-15'
      },
      {
        id: 'bradlc.vscode-tailwindcss',
        manifest: {
          id: 'bradlc.vscode-tailwindcss',
          name: 'vscode-tailwindcss',
          version: '0.10.5',
          description: 'Intelligent Tailwind CSS tooling for VS Code',
          author: 'Brad Cornes',
          displayName: 'Tailwind CSS IntelliSense',
          category: 'Other',
          keywords: ['tailwind', 'css', 'intellisense'],
          engines: { whiterabbit: '^1.0.0' },
          contributes: {},
          activationEvents: ['*']
        },
        downloads: 15000000,
        rating: 4.8,
        reviews: 3500,
        featured: true,
        verified: false,
        lastUpdated: '2024-01-10'
      },
      {
        id: 'esbenp.prettier-vscode',
        manifest: {
          id: 'esbenp.prettier-vscode',
          name: 'prettier-vscode',
          version: '10.1.0',
          description: 'Code formatter using prettier',
          author: 'Prettier',
          displayName: 'Prettier - Code formatter',
          category: 'Formatters',
          keywords: ['prettier', 'formatter', 'javascript'],
          engines: { whiterabbit: '^1.0.0' },
          contributes: {},
          activationEvents: ['*']
        },
        downloads: 30000000,
        rating: 4.6,
        reviews: 8000,
        featured: false,
        verified: true,
        lastUpdated: '2024-01-12'
      },
      {
        id: 'github.copilot',
        manifest: {
          id: 'github.copilot',
          name: 'copilot',
          version: '1.156.0',
          description: 'Your AI pair programmer',
          author: 'GitHub',
          displayName: 'GitHub Copilot',
          category: 'Other',
          keywords: ['ai', 'copilot', 'assistant'],
          engines: { whiterabbit: '^1.0.0' },
          contributes: {},
          activationEvents: ['*']
        },
        downloads: 25000000,
        rating: 4.3,
        reviews: 15000,
        featured: true,
        verified: true,
        lastUpdated: '2024-01-14'
      }
    ]

    setMarketplaceExtensions(mockExtensions)
  }

  // Install extension
  const handleInstallExtension = async (marketplaceExt: MarketplaceExtension) => {
    setIsLoading(true)
    try {
      await extensionSystem.installExtension(marketplaceExt.manifest, `/extensions/${marketplaceExt.id}`)
      await extensionSystem.activateExtension(marketplaceExt.id)
      loadExtensions()
      trackFeatureUsed('extension_install', { extensionId: marketplaceExt.id })
    } catch (error) {
      console.error('Failed to install extension:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Uninstall extension
  const handleUninstallExtension = async (extension: Extension) => {
    try {
      await extensionSystem.uninstallExtension(extension.manifest.id)
      loadExtensions()
      trackFeatureUsed('extension_uninstall', { extensionId: extension.manifest.id })
    } catch (error) {
      console.error('Failed to uninstall extension:', error)
    }
  }

  // Toggle extension
  const handleToggleExtension = async (extension: Extension, enabled: boolean) => {
    try {
      if (enabled) {
        await extensionSystem.activateExtension(extension.manifest.id)
      } else {
        await extensionSystem.deactivateExtension(extension.manifest.id)
      }
      loadExtensions()
      trackFeatureUsed('extension_toggle', { extensionId: extension.manifest.id, enabled })
    } catch (error) {
      console.error('Failed to toggle extension:', error)
    }
  }

  // Get category icon
  const getCategoryIcon = (category: ExtensionCategory) => {
    const icons = {
      'Programming Languages': <Code className="w-4 h-4" />,
      'Snippets': <Zap className="w-4 h-4" />,
      'Linters': <CheckCircle className="w-4 h-4" />,
      'Themes': <Palette className="w-4 h-4" />,
      'Debuggers': <Bug className="w-4 h-4" />,
      'Formatters': <Settings className="w-4 h-4" />,
      'Keymaps': <Settings className="w-4 h-4" />,
      'SCM Providers': <Package className="w-4 h-4" />,
      'Other': <Puzzle className="w-4 h-4" />
    }
    return icons[category] || <Puzzle className="w-4 h-4" />
  }

  // Filter extensions
  const filteredMarketplaceExtensions = marketplaceExtensions.filter(ext => {
    const matchesSearch = !searchQuery || 
      ext.manifest.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.manifest.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.manifest.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All' || ext.manifest.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const installedExtensions = extensions
  const activeExtensions = extensions.filter(ext => ext.isActive)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Puzzle className="w-4 h-4" />
            Extensions
            <Badge variant="outline" className="text-xs">
              {activeExtensions.length}/{installedExtensions.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowInstallDialog(true)}>
              <Plus className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="installed" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="installed">Installed</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
          </TabsList>

          {/* Installed Extensions Tab */}
          <TabsContent value="installed" className="space-y-3">
            {installedExtensions.length > 0 ? (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {installedExtensions.map((extension) => (
                    <div key={extension.manifest.id} className="flex items-center justify-between p-3 rounded border">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(extension.manifest.category)}
                        <div>
                          <div className="font-medium text-sm">{extension.manifest.displayName}</div>
                          <div className="text-xs text-muted-foreground">
                            {extension.manifest.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              v{extension.manifest.version}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              by {extension.manifest.author}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {extension.isActive ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-500" />
                        )}
                        <Switch
                          checked={extension.isActive}
                          onCheckedChange={(enabled) => handleToggleExtension(extension, enabled)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Settings className="w-3 h-3 mr-2" />
                              Configure
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ExternalLink className="w-3 h-3 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleUninstallExtension(extension)}
                            >
                              <Trash2 className="w-3 h-3 mr-2" />
                              Uninstall
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
                <Puzzle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No extensions installed</p>
                <p className="text-xs">Browse the marketplace to find extensions</p>
              </div>
            )}
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-3">
            {/* Search and Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search extensions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Category:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {selectedCategory}
                      <ChevronDown className="w-3 h-3 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSelectedCategory('All')}>
                      All
                    </DropdownMenuItem>
                    {(['Programming Languages', 'Themes', 'Formatters', 'Debuggers', 'Other'] as ExtensionCategory[]).map(category => (
                      <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)}>
                        {getCategoryIcon(category)}
                        <span className="ml-2">{category}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Extensions List */}
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {filteredMarketplaceExtensions.map((ext) => {
                  const isInstalled = installedExtensions.some(installed => installed.manifest.id === ext.id)
                  
                  return (
                    <div key={ext.id} className="p-3 rounded border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(ext.manifest.category)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{ext.manifest.displayName}</span>
                              {ext.verified && (
                                <CheckCircle className="w-3 h-3 text-blue-500" />
                              )}
                              {ext.featured && (
                                <Star className="w-3 h-3 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              by {ext.manifest.author}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isInstalled ? (
                            <Badge variant="secondary" className="text-xs">
                              Installed
                            </Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => handleInstallExtension(ext)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {ext.manifest.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>⭐ {ext.rating}</span>
                          <span>📥 {formatNumber(ext.downloads)}</span>
                          <span>Updated {formatDate(ext.lastUpdated)}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {ext.manifest.category}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Featured Tab */}
          <TabsContent value="featured" className="space-y-3">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {marketplaceExtensions.filter(ext => ext.featured).map((ext) => {
                  const isInstalled = installedExtensions.some(installed => installed.manifest.id === ext.id)
                  
                  return (
                    <div key={ext.id} className="p-3 rounded border bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium text-sm">{ext.manifest.displayName}</span>
                        {ext.verified && (
                          <CheckCircle className="w-3 h-3 text-blue-500" />
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {ext.manifest.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>⭐ {ext.rating}</span>
                          <span>📥 {formatNumber(ext.downloads)}</span>
                        </div>
                        
                        {isInstalled ? (
                          <Badge variant="secondary" className="text-xs">
                            Installed
                          </Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => handleInstallExtension(ext)}
                            disabled={isLoading}
                          >
                            Install
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Install from File Dialog */}
        <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Install Extension</DialogTitle>
              <DialogDescription>
                Install an extension from a VSIX file or marketplace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm">
                <p className="mb-2">You can install extensions by:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Browsing the marketplace tab</li>
                  <li>• Installing from a .vsix file</li>
                  <li>• Installing from the command line</li>
                </ul>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInstallDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowInstallDialog(false)}>
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Browse Marketplace
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
