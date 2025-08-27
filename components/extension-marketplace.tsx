'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extensionManager } from '@/lib/extension-manager';
import { extensionSystem } from '@/lib/extension-system';
import {
    Code,
    Database,
    Download as DownloadIcon,
    ExternalLink,
    Globe,
    Grid,
    List,
    Package,
    Palette,
    Play,
    RefreshCw,
    Search,
    SortAsc,
    SortDesc,
    Star,
    Trash2,
    Zap
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface Extension {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  publisher: {
    displayName: string;
    publisherId: string;
  };
  categories: string[];
  tags: string[];
  downloadCount: number;
  rating: number;
  ratingCount: number;
  lastUpdated: string;
  publishedDate: string;
  iconUrl?: string;
  repository?: string;
  homepage?: string;
  license?: string;
  readme?: string;
  changelog?: string;
  dependencies?: string[];
  engines?: {
    vscode?: string;
    [key: string]: string | undefined;
  };
  isInstalled?: boolean;
  isEnabled?: boolean;
  isUpdateAvailable?: boolean;
  isInstalling?: boolean;
  localVersion?: string;
  size?: number;
}

interface ExtensionCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  count: number;
}

interface ExtensionMarketplaceProps {
  className?: string;
}

const EXTENSION_CATEGORIES: ExtensionCategory[] = [
  {
    id: 'programming-languages',
    name: 'Programming Languages',
    icon: <Code className="w-4 h-4" />,
    description: 'Language support and syntax highlighting',
    count: 0
  },
  {
    id: 'themes',
    name: 'Themes',
    icon: <Palette className="w-4 h-4" />,
    description: 'Color themes and visual customization',
    count: 0
  },
  {
    id: 'snippets',
    name: 'Snippets',
    icon: <Package className="w-4 h-4" />,
    description: 'Code snippets and templates',
    count: 0
  },
  {
    id: 'debuggers',
    name: 'Debuggers',
    icon: <Play className="w-4 h-4" />,
    description: 'Debugging tools and extensions',
    count: 0
  },
  {
    id: 'formatters',
    name: 'Formatters',
    icon: <Zap className="w-4 h-4" />,
    description: 'Code formatting and linting',
    count: 0
  },
  {
    id: 'git',
    name: 'Git',
    icon: <Database className="w-4 h-4" />,
    description: 'Git integration and tools',
    count: 0
  },
  {
    id: 'web-development',
    name: 'Web Development',
    icon: <Globe className="w-4 h-4" />,
    description: 'Web development tools and frameworks',
    count: 0
  }
];

export default function ExtensionMarketplace({ className = '' }: ExtensionMarketplaceProps) {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [installedExtensions, setInstalledExtensions] = useState<Extension[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'downloads' | 'rating' | 'name' | 'date'>('downloads');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [filterTags, setFilterTags] = useState<string[]>([]);

  // Load installed extensions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wr-installed-extensions');
      if (saved) {
        const installed = JSON.parse(saved);
        setInstalledExtensions(installed);
      }
    } catch (error) {
      console.warn('Failed to load installed extensions:', error);
    }
  }, []);

  // Save installed extensions to localStorage
  const saveInstalledExtensions = useCallback((exts: Extension[]) => {
    try {
      localStorage.setItem('wr-installed-extensions', JSON.stringify(exts));
    } catch (error) {
      console.warn('Failed to save installed extensions:', error);
    }
  }, []);

  // Fetch extensions from OpenVSX API
  const fetchExtensions = useCallback(async (query = '', category = 'all') => {
    setIsLoading(true);
    try {
      // OpenVSX API endpoint
      const baseUrl = 'https://open-vsx.org/api/-/search';
      const params = new URLSearchParams({
        query: query || 'javascript',
        size: '50',
        offset: '0'
      });

      if (category !== 'all') {
        params.append('category', category);
      }

      const response = await fetch(`${baseUrl}?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const fetchedExtensions: Extension[] = (Array.isArray(data.extensions) ? data.extensions : []).map((ext: any) => ({
        id: ext.namespace + '.' + ext.name,
        name: ext.name,
        displayName: ext.displayName || ext.name,
        description: ext.description || 'No description available',
        version: ext.version,
        publisher: {
          displayName: ext.publisher?.displayName || ext.namespace,
          publisherId: ext.namespace
        },
        categories: ext.categories || [],
        tags: ext.tags || [],
        downloadCount: ext.downloadCount || 0,
        rating: ext.averageRating || 0,
        ratingCount: ext.reviewCount || 0,
        lastUpdated: ext.lastUpdated || '',
        publishedDate: ext.publishedDate || '',
        iconUrl: ext.iconUrl,
        repository: ext.repository,
        homepage: ext.homepage,
        license: ext.license,
        readme: ext.readme,
        changelog: ext.changelog,
        dependencies: ext.dependencies,
        engines: ext.engines,
        isInstalled: installedExtensions.some(inst => inst.id === ext.namespace + '.' + ext.name),
        isEnabled: installedExtensions.some(inst => inst.id === ext.namespace + '.' + ext.name && inst.isEnabled),
        isUpdateAvailable: false,
        localVersion: installedExtensions.find(inst => inst.id === ext.namespace + '.' + ext.name)?.version,
        // Some APIs return files as arrays, some as maps, many omit in search
        size: Array.isArray(ext.files)
          ? ext.files.find((f: any) => f?.name === 'extension.vsix')?.size
          : (ext.files && typeof ext.files === 'object' && ext.files['extension.vsix']?.size) || undefined
      })) || [];

      setExtensions(fetchedExtensions);
    } catch (error) {
      console.error('Failed to fetch extensions:', error);
      // Fallback to mock data for demo purposes
      setExtensions(generateMockExtensions());
    } finally {
      setIsLoading(false);
    }
  }, [installedExtensions]);

  // Generate mock extensions for demo/fallback
  const generateMockExtensions = (): Extension[] => {
    return [
      {
        id: 'ms-vscode.vscode-typescript-next',
        name: 'TypeScript Next',
        displayName: 'TypeScript Next',
        description: 'TypeScript language support for VS Code',
        version: '4.9.0',
        publisher: {
          displayName: 'Microsoft',
          publisherId: 'ms-vscode'
        },
        categories: ['Programming Languages'],
        tags: ['typescript', 'javascript', 'language'],
        downloadCount: 15000000,
        rating: 4.8,
        ratingCount: 1250,
        lastUpdated: '2024-01-15',
        publishedDate: '2023-12-01',
        iconUrl: 'https://open-vsx.org/api/ms-vscode/vscode-typescript-next/4.9.0/file/icon',
        repository: 'https://github.com/microsoft/vscode',
        homepage: 'https://code.visualstudio.com/',
        license: 'MIT',
        isInstalled: false,
        isEnabled: false,
        isUpdateAvailable: false
      },
      {
        id: 'esbenp.prettier-vscode',
        name: 'Prettier',
        displayName: 'Prettier - Code formatter',
        description: 'Code formatter using prettier',
        version: '9.0.0',
        publisher: {
          displayName: 'Prettier',
          publisherId: 'esbenp'
        },
        categories: ['Formatters'],
        tags: ['formatter', 'prettier', 'beautify'],
        downloadCount: 25000000,
        rating: 4.9,
        ratingCount: 2100,
        lastUpdated: '2024-01-10',
        publishedDate: '2023-11-15',
        iconUrl: 'https://open-vsx.org/api/esbenp/prettier-vscode/9.0.0/file/icon',
        repository: 'https://github.com/prettier/prettier-vscode',
        homepage: 'https://prettier.io/',
        license: 'MIT',
        isInstalled: false,
        isEnabled: false,
        isUpdateAvailable: false
      },
      {
        id: 'ms-vscode.vscode-eslint',
        name: 'ESLint',
        displayName: 'ESLint',
        description: 'Find and fix problems in your JavaScript code',
        version: '2.4.0',
        publisher: {
          displayName: 'Microsoft',
          publisherId: 'ms-vscode'
        },
        categories: ['Linters'],
        tags: ['eslint', 'javascript', 'linting'],
        downloadCount: 18000000,
        rating: 4.7,
        ratingCount: 980,
        lastUpdated: '2024-01-12',
        publishedDate: '2023-12-10',
        iconUrl: 'https://open-vsx.org/api/ms-vscode/vscode-eslint/2.4.0/file/icon',
        repository: 'https://github.com/microsoft/vscode-eslint',
        homepage: 'https://eslint.org/',
        license: 'MIT',
        isInstalled: false,
        isEnabled: false,
        isUpdateAvailable: false
      },
      // Extra mock extensions to enrich the marketplace
      {
        id: 'whiterabbit.focus-field-ux',
        name: 'Focus Field UX',
        displayName: 'Focus Field Ripple Highlight',
        description: 'Adds focus ripple and breathing caret polish for Monaco editor.',
        version: '1.0.0',
        publisher: { displayName: 'White Rabbit', publisherId: 'whiterabbit' },
        categories: ['Web Development'],
        tags: ['ux', 'monaco', 'visual'],
        downloadCount: 1200,
        rating: 4.6,
        ratingCount: 53,
        lastUpdated: '2025-08-01',
        publishedDate: '2025-08-01',
        homepage: 'https://www.whiterabbit.onl',
        license: 'MIT',
        isInstalled: false,
        isEnabled: false,
        isUpdateAvailable: false
      },
      {
        id: 'whiterabbit.visual-tools-pack',
        name: 'Visual Tools Pack',
        displayName: 'Visual Tools (Git, Flow, File Tree)',
        description: 'A curated set of visualization tools: Git History, Code Flow, Smart File Tree.',
        version: '1.0.0',
        publisher: { displayName: 'White Rabbit', publisherId: 'whiterabbit' },
        categories: ['Web Development'],
        tags: ['visual', 'git', 'flow', 'files'],
        downloadCount: 1850,
        rating: 4.7,
        ratingCount: 77,
        lastUpdated: '2025-08-01',
        publishedDate: '2025-08-01',
        homepage: 'https://www.whiterabbit.onl',
        license: 'MIT',
        isInstalled: false,
        isEnabled: false,
        isUpdateAvailable: false
      }
    ];
  };

  // Install extension
  const installExtension = useCallback(async (extension: Extension) => {
    try {
      // Simulate installation process
      const installingExtension = { ...extension, isInstalling: true };
      setExtensions(prev => prev.map(ext => 
        ext.id === extension.id ? installingExtension : ext
      ));

      // Simulate download and installation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const installedExt = await extensionManager.installExtension(extension as any);
      try {
        await extensionSystem.installExtension({
          id: installedExt.id,
          name: installedExt.name,
          version: installedExt.version,
          description: installedExt.description,
          author: installedExt.publisher.displayName,
          displayName: installedExt.displayName,
          category: 'Other',
          keywords: installedExt.tags,
          engines: { whiterabbit: '^1.0.0' },
          contributes: {},
          activationEvents: ['*'],
          main: './extension.js'
        }, installedExt.localPath || '/extensions');
        await extensionSystem.activateExtension(installedExt.id);
      } catch (e) {
        console.warn('ExtensionSystem install/activate simulation failed:', e);
      }

      const installedExtension = {
        ...extension,
        isInstalled: true,
        isEnabled: true,
        isInstalling: false,
        localVersion: extension.version
      };

      // Add to installed extensions
      const newInstalled = [...installedExtensions, installedExtension];
      setInstalledExtensions(newInstalled);
      saveInstalledExtensions(newInstalled);

      // Update extensions list
      setExtensions(prev => prev.map(ext => 
        ext.id === extension.id ? installedExtension : ext
      ));

      console.log(`Extension ${extension.displayName} installed successfully`);
    } catch (error) {
      console.error('Failed to install extension:', error);
      // Revert installation state
      setExtensions(prev => prev.map(ext => 
        ext.id === extension.id ? { ...ext, isInstalling: false } : ext
      ));
    }
  }, [installedExtensions, saveInstalledExtensions]);

  // Uninstall extension
  const uninstallExtension = useCallback(async (extension: Extension) => {
    try {
      const newInstalled = installedExtensions.filter(ext => ext.id !== extension.id);
      setInstalledExtensions(newInstalled);
      saveInstalledExtensions(newInstalled);

      // Update extensions list
      setExtensions(prev => prev.map(ext => 
        ext.id === extension.id ? { ...ext, isInstalled: false, isEnabled: false } : ext
      ));

      try {
        await extensionSystem.deactivateExtension(extension.id);
        await extensionSystem.uninstallExtension(extension.id);
      } catch (e) {
        console.warn('ExtensionSystem uninstall simulation failed:', e);
      }

      console.log(`Extension ${extension.displayName} uninstalled successfully`);
    } catch (error) {
      console.error('Failed to uninstall extension:', error);
    }
  }, [installedExtensions, saveInstalledExtensions]);

  // Toggle extension enabled state
  const toggleExtension = useCallback((extension: Extension) => {
    const newInstalled = installedExtensions.map(ext => 
      ext.id === extension.id ? { ...ext, isEnabled: !ext.isEnabled } : ext
    );
    setInstalledExtensions(newInstalled);
    saveInstalledExtensions(newInstalled);

    // Update extensions list
    setExtensions(prev => prev.map(ext => 
      ext.id === extension.id ? { ...ext, isEnabled: !ext.isEnabled } : ext
    ));
  }, [installedExtensions, saveInstalledExtensions]);

  // Filter and sort extensions
  const filteredAndSortedExtensions = extensions
    .filter(ext => {
      const matchesSearch = ext.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ext.publisher.displayName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || ext.categories.includes(selectedCategory);
      const matchesTags = filterTags.length === 0 || filterTags.some(tag => ext.tags.includes(tag));
      return matchesSearch && matchesCategory && matchesTags;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'downloads':
          comparison = a.downloadCount - b.downloadCount;
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'date':
          comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Load initial extensions
  useEffect(() => {
    fetchExtensions();
  }, [fetchExtensions]);

  // Update category counts
  useEffect(() => {
    const categoryCounts = EXTENSION_CATEGORIES.map(cat => ({
      ...cat,
      count: extensions.filter(ext => ext.categories.includes(cat.id)).length
    }));
    // Update category counts (you could store this in state if needed)
  }, [extensions]);

  const formatDownloadCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className={`h-full flex flex-col bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Extension Marketplace</h1>
            <p className="text-gray-600 dark:text-gray-400">Discover and install extensions to enhance your development experience</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchExtensions()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search extensions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="all">All Categories</option>
            {EXTENSION_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="downloads">Most Downloaded</option>
            <option value="rating">Highest Rated</option>
            <option value="name">Name</option>
            <option value="date">Recently Updated</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800 border-b">
          <TabsTrigger value="browse">Browse Extensions</TabsTrigger>
          <TabsTrigger value="installed">Installed ({installedExtensions.length})</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
        </TabsList>

        {/* Browse Extensions Tab */}
        <TabsContent value="browse" className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-600 dark:text-gray-400">Loading extensions...</p>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {filteredAndSortedExtensions.map(extension => (
                <Card key={extension.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {extension.iconUrl ? (
                          <img 
                            src={extension.iconUrl} 
                            alt={extension.displayName}
                            className="w-12 h-12 rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{extension.displayName}</CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {extension.publisher.displayName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {extension.isInstalled ? (
                          <Badge variant="secondary" className="text-xs">
                            Installed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {formatDownloadCount(extension.downloadCount)} downloads
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {extension.description}
                    </p>
                    
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

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{extension.rating.toFixed(1)} ({extension.ratingCount})</span>
                      </div>
                      <span>v{extension.version}</span>
                    </div>

                    <div className="flex gap-2">
                      {extension.isInstalled ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExtension(extension)}
                            className="flex-1"
                          >
                            {extension.isEnabled ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => uninstallExtension(extension)}
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Uninstall
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => installExtension(extension)}
                          disabled={extension.isInstalling}
                          className="flex-1"
                        >
                          {extension.isInstalling ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Installing...
                            </>
                          ) : (
                            <>
                              <DownloadIcon className="w-4 h-4 mr-2" />
                              Install
                            </>
                          )}
                        </Button>
                      )}
                      
                      {extension.repository && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(extension.repository, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Installed Extensions Tab */}
        <TabsContent value="installed" className="flex-1 p-4">
          <div className="space-y-4">
            {installedExtensions.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No extensions installed</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Browse the marketplace to find extensions that can enhance your development experience.
                </p>
                <Button onClick={() => setActiveTab('browse')}>
                  Browse Extensions
                </Button>
              </div>
            ) : (
              installedExtensions.map(extension => (
                <Card key={extension.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {extension.iconUrl ? (
                          <img 
                            src={extension.iconUrl} 
                            alt={extension.displayName}
                            className="w-10 h-10 rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">{extension.displayName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {extension.publisher.displayName} • v{extension.localVersion}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant={extension.isEnabled ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleExtension(extension)}
                        >
                          {extension.isEnabled ? 'Enabled' : 'Disabled'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => uninstallExtension(extension)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Uninstall
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Updates Tab */}
        <TabsContent value="updates" className="flex-1 p-4">
          <div className="text-center py-12">
            <RefreshCw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No updates available</h3>
            <p className="text-gray-600 dark:text-gray-400">
              All your installed extensions are up to date.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
