/**
 * White Rabbit Code Editor - Package Manager Panel
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
  Package,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  ExternalLink,
  ChevronDown,
  Star,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { 
  PackageManagerService, 
  PackageSearchResult, 
  PackageInfo,
  PackageInstallOptions 
} from '@/lib/package-manager-service'
import { useAnalytics } from '@/hooks/use-analytics'

interface PackageManagerPanelProps {
  packageManager: PackageManagerService
  onPackageJsonUpdate?: (content: string) => void
  className?: string
}

export function PackageManagerPanel({ 
  packageManager, 
  onPackageJsonUpdate,
  className 
}: PackageManagerPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PackageSearchResult[]>([])
  const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPackageDialog, setShowPackageDialog] = useState(false)
  const [outdatedPackages, setOutdatedPackages] = useState<any[]>([])
  const [popularPackages, setPopularPackages] = useState<PackageSearchResult[]>([])

  const { trackFeatureUsed } = useAnalytics()

  // Get installed packages
  const installedPackages = packageManager.getInstalledPackages()

  // Search packages
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await packageManager.searchPackages(searchQuery)
      setSearchResults(results)
      trackFeatureUsed('package_search')
    } catch (error) {
      console.error('Package search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, packageManager, trackFeatureUsed])

  // Get package details
  const handlePackageSelect = async (packageName: string) => {
    setIsLoading(true)
    try {
      const packageInfo = await packageManager.getPackageInfo(packageName)
      setSelectedPackage(packageInfo)
      setShowPackageDialog(true)
    } catch (error) {
      console.error('Failed to get package info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Install package
  const handleInstallPackage = async (
    packageName: string, 
    version?: string, 
    options: PackageInstallOptions = {}
  ) => {
    try {
      await packageManager.installPackage(packageName, version, options)
      onPackageJsonUpdate?.(packageManager.generatePackageJsonString())
      setShowPackageDialog(false)
      trackFeatureUsed('package_install')
    } catch (error) {
      console.error('Failed to install package:', error)
    }
  }

  // Uninstall package
  const handleUninstallPackage = async (packageName: string) => {
    try {
      await packageManager.uninstallPackage(packageName)
      onPackageJsonUpdate?.(packageManager.generatePackageJsonString())
      trackFeatureUsed('package_uninstall')
    } catch (error) {
      console.error('Failed to uninstall package:', error)
    }
  }

  // Update package
  const handleUpdatePackage = async (packageName: string) => {
    try {
      await packageManager.updatePackage(packageName)
      onPackageJsonUpdate?.(packageManager.generatePackageJsonString())
      await checkOutdatedPackages()
      trackFeatureUsed('package_update')
    } catch (error) {
      console.error('Failed to update package:', error)
    }
  }

  // Check for outdated packages
  const checkOutdatedPackages = useCallback(async () => {
    try {
      const outdated = await packageManager.checkOutdatedPackages()
      setOutdatedPackages(outdated)
    } catch (error) {
      console.error('Failed to check outdated packages:', error)
    }
  }, [packageManager])

  // Load popular packages
  const loadPopularPackages = useCallback(async () => {
    try {
      const popular = await packageManager.getPopularPackages()
      setPopularPackages(popular)
    } catch (error) {
      console.error('Failed to load popular packages:', error)
    }
  }, [packageManager])

  // Initialize data
  useEffect(() => {
    checkOutdatedPackages()
    loadPopularPackages()
  }, [checkOutdatedPackages, loadPopularPackages])

  // Handle search on Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatDownloads = (downloads?: number) => {
    if (!downloads) return 'N/A'
    if (downloads > 1000000) return `${(downloads / 1000000).toFixed(1)}M`
    if (downloads > 1000) return `${(downloads / 1000).toFixed(1)}K`
    return downloads.toString()
  }

  const getQualityColor = (score: number) => {
    if (score > 0.8) return 'text-green-500'
    if (score > 0.6) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Package className="w-4 h-4" />
          Package Manager
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="installed" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="installed">Installed</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
          </TabsList>

          {/* Installed Packages Tab */}
          <TabsContent value="installed" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dependencies</span>
              <Button variant="ghost" size="sm" onClick={checkOutdatedPackages}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {/* Production Dependencies */}
                {Object.entries(installedPackages.dependencies).map(([name, version]) => {
                  const isOutdated = outdatedPackages.find(p => p.package === name)
                  return (
                    <div key={name} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{name}</span>
                        <Badge variant="outline" className="text-xs">{version}</Badge>
                        {isOutdated && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Outdated
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePackageSelect(name)}>
                            <ExternalLink className="w-3 h-3 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {isOutdated && (
                            <DropdownMenuItem onClick={() => handleUpdatePackage(name)}>
                              <RefreshCw className="w-3 h-3 mr-2" />
                              Update to {isOutdated.latest}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleUninstallPackage(name)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Uninstall
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}

                {/* Dev Dependencies */}
                {Object.keys(installedPackages.devDependencies).length > 0 && (
                  <>
                    <Separator />
                    <span className="text-sm font-medium text-muted-foreground">Dev Dependencies</span>
                    {Object.entries(installedPackages.devDependencies).map(([name, version]) => (
                      <div key={name} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{name}</span>
                          <Badge variant="secondary" className="text-xs">{version}</Badge>
                          <Badge variant="outline" className="text-xs">dev</Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePackageSelect(name)}>
                              <ExternalLink className="w-3 h-3 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUninstallPackage(name)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-3 h-3 mr-2" />
                              Uninstall
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </>
                )}

                {Object.keys(installedPackages.dependencies).length === 0 && 
                 Object.keys(installedPackages.devDependencies).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No packages installed</p>
                    <p className="text-xs">Search for packages to get started</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-8"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {searchResults.map((pkg) => (
                  <div 
                    key={pkg.name} 
                    className="p-3 rounded border hover:bg-muted cursor-pointer"
                    onClick={() => handlePackageSelect(pkg.name)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pkg.name}</span>
                        <Badge variant="outline" className="text-xs">{pkg.version}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDownloads(pkg.downloads)} downloads
                        </span>
                        {pkg.quality && (
                          <div className={`text-xs ${getQualityColor(pkg.quality)}`}>
                            <Star className="w-3 h-3 inline mr-1" />
                            {(pkg.quality * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {pkg.description}
                    </p>
                    {pkg.keywords && pkg.keywords.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {pkg.keywords.slice(0, 3).map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {searchResults.length === 0 && searchQuery && !isSearching && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No packages found</p>
                    <p className="text-xs">Try a different search term</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Popular Packages Tab */}
          <TabsContent value="popular" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Popular Packages</span>
              <Button variant="ghost" size="sm" onClick={loadPopularPackages}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {popularPackages.map((pkg) => (
                  <div 
                    key={pkg.name} 
                    className="p-3 rounded border hover:bg-muted cursor-pointer"
                    onClick={() => handlePackageSelect(pkg.name)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pkg.name}</span>
                        <Badge variant="outline" className="text-xs">{pkg.version}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleInstallPackage(pkg.name)
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {pkg.description}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Package Details Dialog */}
        <Dialog open={showPackageDialog} onOpenChange={setShowPackageDialog}>
          <DialogContent className="max-w-2xl">
            {selectedPackage && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {selectedPackage.name}
                    <Badge variant="outline">{selectedPackage.version}</Badge>
                  </DialogTitle>
                  <DialogDescription>
                    {selectedPackage.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Package Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedPackage.author && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Author: {selectedPackage.author}</span>
                      </div>
                    )}
                    {selectedPackage.license && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>License: {selectedPackage.license}</span>
                      </div>
                    )}
                    {selectedPackage.publishedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Published: {new Date(selectedPackage.publishedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedPackage.downloads && (
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        <span>Downloads: {formatDownloads(selectedPackage.downloads.weekly)}/week</span>
                      </div>
                    )}
                  </div>

                  {/* Keywords */}
                  {selectedPackage.keywords && selectedPackage.keywords.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Keywords:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPackage.keywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Install Options */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleInstallPackage(selectedPackage.name)}
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Install
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleInstallPackage(selectedPackage.name, undefined, { dev: true })}
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Install as Dev
                    </Button>
                  </div>

                  {/* Links */}
                  <div className="flex gap-2">
                    {selectedPackage.homepage && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedPackage.homepage} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Homepage
                        </a>
                      </Button>
                    )}
                    {selectedPackage.repository && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedPackage.repository} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Repository
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
