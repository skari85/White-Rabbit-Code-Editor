'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extensionManager } from '@/lib/extension-manager';
import { extensionSystem } from '@/lib/extension-system';
import {
    AlertCircle,
    CheckCircle,
    Download,
    Info,
    Package,
    Pause,
    Play,
    RefreshCw,
    Search,
    Terminal,
    Trash2,
    XCircle
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ExtensionConsoleProps {
  className?: string;
}

interface ConsoleLogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  extension?: string;
  details?: any;
}

export default function ExtensionConsole({ className = '' }: ExtensionConsoleProps) {
  const [installedExtensions, setInstalledExtensions] = useState<any[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('extensions');
  const [isLoading, setIsLoading] = useState(false);

  // Add console log entry
  const addLogEntry = useCallback((level: ConsoleLogEntry['level'], message: string, extension?: string, details?: any) => {
    const entry: ConsoleLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level,
      message,
      extension,
      details
    };
    setConsoleLogs(prev => [entry, ...prev.slice(0, 99)]); // Keep last 100 entries
  }, []);

  // Load installed extensions
  const loadExtensions = useCallback(() => {
    try {
      const extensions = extensionManager.getInstalledExtensions();
      setInstalledExtensions(extensions);
      addLogEntry('info', `Loaded ${extensions.length} installed extensions`);
    } catch (error) {
      addLogEntry('error', 'Failed to load extensions', undefined, error);
    }
  }, [addLogEntry]);

  // Install extension
  const installExtension = useCallback(async (extensionId: string) => {
    setIsLoading(true);
    try {
      addLogEntry('info', `Installing extension: ${extensionId}`);
      
      // Create a sample extension for installation
      const sampleExtension = {
        id: extensionId,
        name: extensionId.split('.').pop() || extensionId,
        displayName: extensionId.split('.').pop() || extensionId,
        description: `Sample extension: ${extensionId}`,
        version: '1.0.0',
        publisher: {
          displayName: 'Sample Publisher',
          publisherId: extensionId.split('.')[0] || 'sample'
        },
        categories: ['Other'],
        tags: ['sample'],
        downloadCount: 0,
        rating: 0,
        ratingCount: 0,
        lastUpdated: new Date().toISOString(),
        publishedDate: new Date().toISOString()
      };

      const installed = await extensionManager.installExtension(sampleExtension as any);
      
      // Also install in extension system
      try {
        await extensionSystem.installExtension({
          id: installed.id,
          name: installed.name,
          version: installed.version,
          description: installed.description,
          author: installed.publisher.displayName,
          displayName: installed.displayName,
          category: 'Other',
          keywords: installed.tags,
          engines: { whiterabbit: '^1.0.0' },
          contributes: {},
          activationEvents: ['*'],
          main: './extension.js'
        }, installed.localPath || '/extensions');
        
        await extensionSystem.activateExtension(installed.id);
        addLogEntry('success', `Extension ${installed.displayName} installed and activated successfully`, installed.id);
      } catch (e) {
        addLogEntry('warn', `Extension installed but activation failed: ${e}`, installed.id);
      }

      loadExtensions();
    } catch (error) {
      addLogEntry('error', `Failed to install extension: ${error}`, extensionId);
    } finally {
      setIsLoading(false);
    }
  }, [addLogEntry, loadExtensions]);

  // Uninstall extension
  const uninstallExtension = useCallback(async (extensionId: string) => {
    try {
      addLogEntry('info', `Uninstalling extension: ${extensionId}`);
      
      await extensionSystem.deactivateExtension(extensionId);
      await extensionSystem.uninstallExtension(extensionId);
      await extensionManager.uninstallExtension(extensionId);
      
      addLogEntry('success', `Extension ${extensionId} uninstalled successfully`, extensionId);
      loadExtensions();
    } catch (error) {
      addLogEntry('error', `Failed to uninstall extension: ${error}`, extensionId);
    }
  }, [addLogEntry, loadExtensions]);

  // Toggle extension
  const toggleExtension = useCallback((extensionId: string) => {
    try {
      const isEnabled = extensionManager.toggleExtension(extensionId);
      addLogEntry('info', `Extension ${extensionId} ${isEnabled ? 'enabled' : 'disabled'}`, extensionId);
      loadExtensions();
    } catch (error) {
      addLogEntry('error', `Failed to toggle extension: ${error}`, extensionId);
    }
  }, [addLogEntry, loadExtensions]);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    try {
      addLogEntry('info', 'Checking for extension updates...');
      const updates = await extensionManager.checkForUpdates();
      if (updates.length > 0) {
        addLogEntry('info', `Found ${updates.length} extension updates available`);
      } else {
        addLogEntry('info', 'All extensions are up to date');
      }
      loadExtensions();
    } catch (error) {
      addLogEntry('error', `Failed to check for updates: ${error}`);
    }
  }, [addLogEntry, loadExtensions]);

  // Clear console logs
  const clearLogs = useCallback(() => {
    setConsoleLogs([]);
    addLogEntry('info', 'Console logs cleared');
  }, [addLogEntry]);

  // Load extensions on mount
  useEffect(() => {
    loadExtensions();
    addLogEntry('info', 'Extension Console initialized');
  }, [loadExtensions, addLogEntry]);

  // Filter console logs
  const filteredLogs = consoleLogs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = !searchQuery || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.extension && log.extension.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  // Get log level icon
  const getLogIcon = (level: ConsoleLogEntry['level']) => {
    switch (level) {
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'warn': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  // Get log level color
  const getLogColor = (level: ConsoleLogEntry['level']) => {
    switch (level) {
      case 'info': return 'text-blue-600';
      case 'warn': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'success': return 'text-green-600';
    }
  };

  return (
    <div className={`h-full flex flex-col bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-6 h-6" />
              Extension Console
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Manage extensions and view system logs</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkForUpdates}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Check Updates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => installExtension('sample.extension-' + Date.now())}
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Install Sample
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {installedExtensions.length}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Installed</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {installedExtensions.filter(ext => ext.isEnabled).length}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Enabled</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {installedExtensions.filter(ext => ext.isUpdateAvailable).length}
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Updates</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {consoleLogs.length}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Log Entries</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-gray-800 border-b">
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
          <TabsTrigger value="console">Console</TabsTrigger>
        </TabsList>

        {/* Extensions Tab */}
        <TabsContent value="extensions" className="flex-1 p-4">
          <div className="space-y-4">
            {installedExtensions.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No extensions installed</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Install extensions to enhance your development experience.
                </p>
                <Button onClick={() => installExtension('sample.extension-' + Date.now())}>
                  <Download className="w-4 h-4 mr-2" />
                  Install Sample Extension
                </Button>
              </div>
            ) : (
              installedExtensions.map(extension => (
                <Card key={extension.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="font-medium">{extension.displayName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {extension.publisher.displayName} • v{extension.localVersion}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={extension.isEnabled ? 'default' : 'secondary'} className="text-xs">
                              {extension.isEnabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                            {extension.isUpdateAvailable && (
                              <Badge variant="outline" className="text-xs text-yellow-600">
                                Update Available
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExtension(extension.id)}
                        >
                          {extension.isEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {extension.isEnabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => uninstallExtension(extension.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Console Tab */}
        <TabsContent value="console" className="flex-1 flex flex-col">
          {/* Console Controls */}
          <div className="p-4 border-b bg-white dark:bg-gray-800">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search console logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="success">Success</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
              >
                Clear Logs
              </Button>
            </div>
          </div>

          {/* Console Output */}
          <div className="flex-1 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Terminal className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No console logs to display</p>
                  </div>
                ) : (
                  filteredLogs.map(log => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border"
                    >
                      {getLogIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${getLogColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          {log.extension && (
                            <Badge variant="outline" className="text-xs">
                              {log.extension}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {log.message}
                        </p>
                        {log.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer">
                              Show Details
                            </summary>
                            <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
