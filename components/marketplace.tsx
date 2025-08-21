/**
 * White Rabbit Code Editor - Marketplace Component
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Download,
  Trash2,
  Settings,
  Star,
  CheckCircle,
  Package,
  TrendingUp,
  Crown,
  Filter,
  Grid3X3,
  List
} from 'lucide-react'
import { 
  MarketplaceService, 
  MarketplaceExtension, 
  InstalledExtension,
  ExtensionCategory,
  EXTENSION_CATEGORIES
} from '@/lib/marketplace'
import APISetupGuide from './api-setup-guide'

interface MarketplaceProps {
  className?: string;
}

export default function Marketplace({ className }: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExtensionCategory | ''>('');
  const [extensions, setExtensions] = useState<MarketplaceExtension[]>([]);
  const [installedExtensions, setInstalledExtensions] = useState<InstalledExtension[]>([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadExtensions();
    loadInstalledExtensions();
  }, [searchQuery, selectedCategory]);

  const loadExtensions = () => {
    try {
      setLoading(true);
      const results = MarketplaceService.searchExtensions(searchQuery, selectedCategory || undefined);
      setExtensions(results);
    } catch (error) {
      console.error('Failed to load extensions:', error);
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadInstalledExtensions = () => {
    try {
      const installed = MarketplaceService.getInstalledExtensions();
      setInstalledExtensions(installed);
    } catch (error) {
      console.error('Failed to load installed extensions:', error);
      setInstalledExtensions([]);
    }
  };

  const handleInstall = async (extension: MarketplaceExtension) => {
    try {
      MarketplaceService.installExtension(extension);
      loadInstalledExtensions();
      console.log(`✅ Successfully installed: ${extension.displayName}`);
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleUninstall = (extensionId: string) => {
    try {
      MarketplaceService.uninstallExtension(extensionId);
      loadInstalledExtensions();
      console.log(`🗑️ Successfully uninstalled extension: ${extensionId}`);
    } catch (error) {
      console.error('Uninstall failed:', error);
    }
  };

  const handleToggleExtension = (extensionId: string, enabled: boolean) => {
    try {
      MarketplaceService.toggleExtension(extensionId, enabled);
      loadInstalledExtensions();
      console.log(`${enabled ? '✅' : '❌'} ${enabled ? 'Enabled' : 'Disabled'}: ${extensionId}`);
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  };

  const isInstalled = (extensionId: string) => {
    try {
      return MarketplaceService.isExtensionInstalled(extensionId);
    } catch (error) {
      console.error('Error checking if extension is installed:', error);
      return false;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getCategoryIcon = (category: ExtensionCategory) => {
    const categoryInfo = EXTENSION_CATEGORIES.find(cat => cat.id === category);
    return categoryInfo ? categoryInfo.icon : '📦';
  };

  const ExtensionCard = ({ extension }: { extension: MarketplaceExtension }) => {
    const installed = isInstalled(extension.id);
    
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{extension.icon}</span>
              <div>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {extension.displayName}
                  {extension.verified && (
                    <CheckCircle className="w-3 h-3 text-blue-500" />
                  )}
                  {extension.featured && (
                    <Star className="w-3 h-3 text-yellow-500" />
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  by {extension.publisher}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {extension.category}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {extension.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>⭐ {extension.rating}</span>
              <span>📥 {formatNumber(extension.downloads)}</span>
            </div>
            <span>v{extension.version}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {extension.tags && extension.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            {installed ? (
              <Button variant="outline" size="sm" onClick={() => handleUninstall(extension.id)}>
                <Trash2 className="w-3 h-3 mr-1" />
                Uninstall
              </Button>
            ) : (
              <Button size="sm" onClick={() => handleInstall(extension)}>
                <Download className="w-3 h-3 mr-1" />
                Install
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const InstalledExtensionCard = ({ extension }: { extension: InstalledExtension }) => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{extension.icon}</span>
            <div>
              <CardTitle className="text-sm font-medium">{extension.displayName}</CardTitle>
              <p className="text-xs text-muted-foreground">
                by {extension.publisher}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={extension.enabled}
              onCheckedChange={(enabled) => handleToggleExtension(extension.id, enabled)}
            />
            <Badge variant="outline" className="text-xs">
              {extension.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {extension.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <span>Installed: {new Date(extension.installedAt).toLocaleDateString()}</span>
          </div>
          
          <Button variant="outline" size="sm" onClick={() => handleUninstall(extension.id)}>
            <Trash2 className="w-3 h-3 mr-1" />
            Uninstall
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Extension Marketplace</h1>
          <p className="text-muted-foreground">
            Discover and install powerful extensions to enhance your coding experience
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="installed">Installed</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search extensions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  {selectedCategory || 'All Categories'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedCategory('')}>
                  All Categories
                </DropdownMenuItem>
                {EXTENSION_CATEGORIES.map(category => (
                  <DropdownMenuItem key={category.id} onClick={() => setSelectedCategory(category.id)}>
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Extensions Grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading extensions...</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
              : "space-y-4"
            }>
              {extensions.map(extension => (
                <ExtensionCard key={extension.id} extension={extension} />
              ))}
            </div>
          )}
          
          {extensions.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No extensions found matching your criteria.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="installed" className="space-y-4">
          {installedExtensions.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
              : "space-y-4"
            }>
              {installedExtensions.map(extension => (
                <InstalledExtensionCard key={extension.id} extension={extension} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No extensions installed yet.</p>
              <Button 
                className="mt-4" 
                onClick={() => setActiveTab('browse')}
              >
                Browse Extensions
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="featured" className="space-y-4">
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "space-y-4"
          }>
            {MarketplaceService.getFeaturedExtensions().map(extension => (
              <ExtensionCard key={extension.id} extension={extension} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "space-y-4"
          }>
            {MarketplaceService.getTopExtensions(12).map(extension => (
              <div key={extension.id} className="relative">
                <ExtensionCard extension={extension} />
                <div className="absolute top-2 right-2">
                  <Badge variant="default" className="bg-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <APISetupGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
}
