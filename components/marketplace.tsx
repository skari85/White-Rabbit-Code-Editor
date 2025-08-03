'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MarketplaceExtension,
  InstalledExtension,
  MarketplaceService,
  ExtensionCategory,
  EXTENSION_CATEGORIES
} from '@/lib/marketplace';
import APISetupGuide from './api-setup-guide';
import { 
  Search, 
  Download, 
  Star, 
  Shield, 
  Clock, 
  Package, 
  Settings,
  Trash2,
  Power,
  PowerOff,
  ExternalLink,
  Filter,
  TrendingUp,
  Award
} from 'lucide-react';

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

  useEffect(() => {
    loadExtensions();
    loadInstalledExtensions();
  }, [searchQuery, selectedCategory]);

  const loadExtensions = () => {
    setLoading(true);
    const results = MarketplaceService.searchExtensions(searchQuery, selectedCategory || undefined);
    setExtensions(results);
    setLoading(false);
  };

  const loadInstalledExtensions = () => {
    const installed = MarketplaceService.getInstalledExtensions();
    setInstalledExtensions(installed);
  };

  const handleInstall = async (extension: MarketplaceExtension) => {
    try {
      MarketplaceService.installExtension(extension);
      loadInstalledExtensions();
      // Show success message
    } catch (error) {
      console.error('Installation failed:', error);
      // Show error message
    }
  };

  const handleUninstall = (extensionId: string) => {
    MarketplaceService.uninstallExtension(extensionId);
    loadInstalledExtensions();
  };

  const handleToggleExtension = (extensionId: string, enabled: boolean) => {
    MarketplaceService.toggleExtension(extensionId, enabled);
    loadInstalledExtensions();
  };

  const isInstalled = (extensionId: string) => {
    return MarketplaceService.isExtensionInstalled(extensionId);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const ExtensionCard = ({ extension }: { extension: MarketplaceExtension }) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{extension.icon}</div>
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {extension.displayName}
                {extension.verified && (
                  <Shield className="w-3 h-3 text-blue-500" title="Verified Publisher" />
                )}
                {extension.featured && (
                  <Award className="w-3 h-3 text-yellow-500" title="Featured" />
                )}
              </CardTitle>
              <p className="text-xs text-gray-500">by {extension.publisher}</p>
            </div>
          </div>
          <Badge variant={extension.pricing === 'free' ? 'secondary' : 'default'} className="text-xs">
            {extension.pricing === 'free' ? 'Free' : 
             extension.pricing === 'paid' ? `$${extension.price}` : 'Freemium'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 line-clamp-2">{extension.description}</p>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {formatNumber(extension.downloads)}
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {extension.rating}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(extension.lastUpdated).toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {extension.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {extension.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{extension.tags.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="pt-2">
          {isInstalled(extension.id) ? (
            <Button size="sm" variant="outline" className="w-full" disabled>
              <Package className="w-3 h-3 mr-1" />
              Installed
            </Button>
          ) : (
            <Button 
              size="sm" 
              className="w-full" 
              onClick={() => handleInstall(extension)}
            >
              <Download className="w-3 h-3 mr-1" />
              Install
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const InstalledExtensionCard = ({ extension }: { extension: InstalledExtension }) => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{extension.icon}</div>
            <div>
              <CardTitle className="text-sm font-semibold">{extension.displayName}</CardTitle>
              <p className="text-xs text-gray-500">v{extension.version}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleToggleExtension(extension.id, !extension.enabled)}
              className="p-1"
            >
              {extension.enabled ? (
                <Power className="w-4 h-4 text-green-500" />
              ) : (
                <PowerOff className="w-4 h-4 text-gray-400" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleUninstall(extension.id)}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 line-clamp-2">{extension.description}</p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Installed {new Date(extension.installedAt).toLocaleDateString()}</span>
          <Badge variant={extension.enabled ? 'default' : 'secondary'} className="text-xs">
            {extension.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        
        {extension.config && Object.keys(extension.config).length > 0 && (
          <Button size="sm" variant="outline" className="w-full">
            <Settings className="w-3 h-3 mr-1" />
            Configure
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="installed">Installed ({installedExtensions.length})</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="setup">API Setup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search extensions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                size="sm"
                variant={selectedCategory === '' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('')}
              >
                All
              </Button>
              {EXTENSION_CATEGORIES.map(category => (
                <Button
                  key={category.id}
                  size="sm"
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap"
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Extensions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extensions.map(extension => (
              <ExtensionCard key={extension.id} extension={extension} />
            ))}
          </div>
          
          {extensions.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No extensions found matching your criteria.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="installed" className="space-y-4">
          {installedExtensions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MarketplaceService.getFeaturedExtensions().map(extension => (
              <ExtensionCard key={extension.id} extension={extension} />
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
