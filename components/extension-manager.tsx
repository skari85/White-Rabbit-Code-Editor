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

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAnalytics } from '@/hooks/use-analytics'
import {
    EXTENSION_CATEGORIES,
    ExtensionCategory,
    InstalledExtension,
    MarketplaceExtension,
    MarketplaceService
} from '@/lib/marketplace'
import {
    Bug,
    CheckCircle,
    ChevronDown,
    Code,
    Crown,
    Database,
    Download,
    ExternalLink,
    Globe,
    Palette,
    Plus,
    Puzzle,
    RefreshCw,
    Search,
    Settings,
    Star,
    Trash2,
    TrendingUp,
    XCircle,
    Zap
} from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface ExtensionManagerProps {
  className?: string
}

export function ExtensionManager({ className }: ExtensionManagerProps) {
  const [extensions, setExtensions] = useState<InstalledExtension[]>([])
  const [marketplaceExtensions, setMarketplaceExtensions] = useState<MarketplaceExtension[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ExtensionCategory | 'All'>('All')
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('installed')

  const { trackFeatureUsed } = useAnalytics()

  // Load extensions
  useEffect(() => {
    loadExtensions()
    loadMarketplaceExtensions()
  }, [])

  const loadExtensions = () => {
    try {
      const installed = MarketplaceService.getInstalledExtensions()
      setExtensions(installed)
    } catch (error) {
      console.error('Failed to load installed extensions:', error)
      setExtensions([])
    }
  }

  const loadMarketplaceExtensions = () => {
    try {
      const marketplace = MarketplaceService.getMarketplaceExtensions()
      setMarketplaceExtensions(marketplace)
    } catch (error) {
      console.error('Failed to load marketplace extensions:', error)
      setMarketplaceExtensions([])
    }
  }

  // Install extension
  const handleInstallExtension = async (marketplaceExt: MarketplaceExtension) => {
    setIsLoading(true)
    try {
      MarketplaceService.installExtension(marketplaceExt)
      loadExtensions()
      trackFeatureUsed('extension_install', { extensionId: marketplaceExt.id })
      
      // Show success message
      console.log(`✅ Successfully installed: ${marketplaceExt.displayName}`)
    } catch (error) {
      console.error('Failed to install extension:', error)
      // You could add a toast notification here
    } finally {
      setIsLoading(false)
    }
  }

  // Uninstall extension
  const handleUninstallExtension = async (extension: InstalledExtension) => {
    try {
      MarketplaceService.uninstallExtension(extension.id)
      loadExtensions()
      trackFeatureUsed('extension_uninstall', { extensionId: extension.id })
      console.log(`🗑️ Successfully uninstalled: ${extension.displayName}`)
    } catch (error) {
      console.error('Failed to uninstall extension:', error)
    }
  }

  // Toggle extension
  const handleToggleExtension = async (extension: InstalledExtension, enabled: boolean) => {
    try {
      MarketplaceService.toggleExtension(extension.id, enabled)
      loadExtensions()
      trackFeatureUsed('extension_toggle', { extensionId: extension.id, enabled })
      console.log(`${enabled ? '✅' : '❌'} ${enabled ? 'Enabled' : 'Disabled'}: ${extension.displayName}`)
    } catch (error) {
      console.error('Failed to toggle extension:', error)
    }
  }

  // Get category icon
  const getCategoryIcon = (category: ExtensionCategory) => {
    const categoryInfo = EXTENSION_CATEGORIES.find(cat => cat.id === category)
    if (categoryInfo) {
      return <span className="text-lg">{categoryInfo.icon}</span>
    }
    
    const icons: Record<string, React.ReactElement> = {
      'programming-languages': <Code className="w-4 h-4" />,
      'snippets': <Zap className="w-4 h-4" />,
      'themes': <Palette className="w-4 h-4" />,
      'debuggers': <Bug className="w-4 h-4" />,
      'formatters': <Zap className="w-4 h-4" />,
      'git': <Database className="w-4 h-4" />,
      'web-development': <Globe className="w-4 h-4" />
    }
    return icons[category] || <Puzzle className="w-4 h-4" />
  }

  // Filter extensions
  const filteredMarketplaceExtensions = marketplaceExtensions.filter(ext => {
    try {
      const matchesSearch = !searchQuery || 
        ext.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ext.tags && Array.isArray(ext.tags) && ext.tags.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())))
      
      const matchesCategory = selectedCategory === 'All' || ext.category === selectedCategory
      
      return matchesSearch && matchesCategory
    } catch (error) {
      console.error('Error filtering extension:', ext.id, error)
      return false
    }
  })

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (error) {
      return 'Unknown'
    }
  }

  const activeExtensions = extensions.filter(ext => ext.enabled)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Puzzle className="w-4 h-4" />
            Extensions
            <Badge variant="outline" className="text-xs">
              {activeExtensions.length}/{extensions.length}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="installed">Installed</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          {/* Installed Extensions Tab */}
          <TabsContent value="installed" className="space-y-3">
            {extensions.length > 0 ? (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {extensions.map((extension) => (
                    <div key={extension.id} className="flex items-center justify-between p-3 rounded border">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(extension.category)}
                        <div>
                          <div className="font-medium text-sm">{extension.displayName}</div>
                          <div className="text-xs text-muted-foreground">
                            {extension.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              v{extension.version}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              by {extension.publisher}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {extension.enabled ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-500" />
                        )}
                        <Switch
                          checked={extension.enabled}
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
                    {EXTENSION_CATEGORIES.map(category => (
                      <DropdownMenuItem key={category.id} onClick={() => setSelectedCategory(category.id)}>
                        <span className="mr-2">{category.icon}</span>
                        <span>{category.name}</span>
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
                  const isInstalled = extensions.some(installed => installed.id === ext.id)
                  
                  return (
                    <div key={ext.id} className="p-3 rounded border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(ext.category)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{ext.displayName}</span>
                              {ext.verified && (
                                <CheckCircle className="w-3 h-3 text-blue-500" />
                              )}
                              {ext.featured && (
                                <Star className="w-3 h-3 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              by {ext.publisher}
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
                        {ext.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>⭐ {ext.rating}</span>
                          <span>📥 {formatNumber(ext.downloads)}</span>
                          <span>Updated {formatDate(ext.lastUpdated)}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {ext.category}
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
                  const isInstalled = extensions.some(installed => installed.id === ext.id)
                  
                  return (
                    <div key={ext.id} className="p-3 rounded border bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium text-sm">{ext.displayName}</span>
                        {ext.verified && (
                          <CheckCircle className="w-3 h-3 text-blue-500" />
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {ext.description}
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

          {/* Trending Tab */}
          <TabsContent value="trending" className="space-y-3">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {MarketplaceService.getTopExtensions(10).map((ext) => {
                  const isInstalled = extensions.some(installed => installed.id === ext.id)
                  
                  return (
                    <div key={ext.id} className="p-3 rounded border bg-gradient-to-r from-green-50 to-blue-50">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-sm">{ext.displayName}</span>
                        {ext.verified && (
                          <CheckCircle className="w-3 h-3 text-blue-500" />
                        )}
                        {ext.featured && (
                          <Crown className="w-3 h-3 text-yellow-500" />
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {ext.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>⭐ {ext.rating}</span>
                          <span>📥 {formatNumber(ext.downloads)}</span>
                          <span className="text-green-600 font-medium">🔥 Trending</span>
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
                <Button onClick={() => {
                  setShowInstallDialog(false)
                  setActiveTab('marketplace')
                }}>
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
