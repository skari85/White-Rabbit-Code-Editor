'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Send, 
  Play, 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Copy, 
  Code, 
  FileText,
  Database,
  History,
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  Globe,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  X,
  Info,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { 
  APIPaletteService, 
  APIPaletteRequest, 
  APIPaletteResponse, 
  APIPaletteData 
} from '@/lib/api-palette-service';
import { toast } from 'sonner';

interface APIPaletteProps {
  className?: string;
}

export default function APIPalette({ className = '' }: APIPaletteProps) {
  const [activeTab, setActiveTab] = useState('requests');
  const [requestName, setRequestName] = useState('');
  const [requestMethod, setRequestMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [requestUrl, setRequestUrl] = useState('');
  const [requestHeaders, setRequestHeaders] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaletteItem, setSelectedPaletteItem] = useState<APIPaletteData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  const apiService = APIPaletteService.getInstance();

  // State for palette data
  const [paletteData, setPaletteData] = useState<APIPaletteData[]>([]);
  const [requestHistory, setRequestHistory] = useState<APIPaletteRequest[]>([]);
  const [responseHistory, setResponseHistory] = useState<APIPaletteResponse[]>([]);

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = useCallback(() => {
    setPaletteData(apiService.getAllPaletteData());
    setRequestHistory(apiService.getRequestHistory());
    setResponseHistory(apiService.getResponseHistory());
  }, [apiService]);

  // Handle API request
  const handleMakeRequest = useCallback(async () => {
    if (!requestName.trim() || !requestUrl.trim()) {
      toast.error('Please provide a name and URL for the request');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.makeRequest({
        name: requestName.trim(),
        method: requestMethod,
        url: requestUrl.trim(),
        headers: requestHeaders,
        body: requestBody.trim() || undefined
      });

      toast.success(`API request successful! Response stored in palette as "${requestName}"`);
      
      // Clear form if auto-save is enabled
      if (autoSave) {
        setRequestName('');
        setRequestUrl('');
        setRequestHeaders({});
        setRequestBody('');
      }
      
      refreshData();
    } catch (error) {
      console.error('API request failed:', error);
      toast.error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [requestName, requestMethod, requestUrl, requestHeaders, requestBody, autoSave, apiService, refreshData]);

  // Handle header changes
  const handleHeaderChange = useCallback((key: string, value: string) => {
    setRequestHeaders(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const removeHeader = useCallback((key: string) => {
    setRequestHeaders(prev => {
      const newHeaders = { ...prev };
      delete newHeaders[key];
      return newHeaders;
    });
  }, []);

  // Handle palette item selection
  const handlePaletteItemSelect = useCallback((item: APIPaletteData) => {
    setSelectedPaletteItem(item);
    apiService.updatePaletteUsage(item.id);
  }, [apiService]);

  // Generate TypeScript interface
  const generateInterface = useCallback((item: APIPaletteData) => {
    const interfaceCode = apiService.generateTypeScriptInterfaces(item.id);
    navigator.clipboard.writeText(interfaceCode);
    toast.success('TypeScript interface copied to clipboard!');
  }, [apiService]);

  // Generate sample code
  const generateSampleCode = useCallback((item: APIPaletteData) => {
    const sampleCode = apiService.generateSampleCode(item.id);
    navigator.clipboard.writeText(sampleCode);
    toast.success('Sample code copied to clipboard!');
  }, [apiService]);

  // Export palette
  const exportPalette = useCallback(() => {
    const exportData = apiService.exportPalette();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-palette-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Palette exported successfully!');
  }, [apiService]);

  // Import palette
  const importPalette = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        apiService.importPalette(data);
        refreshData();
        toast.success('Palette imported successfully!');
      } catch (error) {
        toast.error('Failed to import palette: Invalid format');
      }
    };
    reader.readAsText(file);
  }, [apiService, refreshData]);

  // Clear palette
  const clearPalette = useCallback(() => {
    if (confirm('Are you sure you want to clear all palette data? This cannot be undone.')) {
      apiService.clearPalette();
      refreshData();
      toast.success('Palette cleared successfully!');
    }
  }, [apiService, refreshData]);

  // Remove palette item
  const removePaletteItem = useCallback((id: string) => {
    if (confirm('Are you sure you want to remove this palette item?')) {
      apiService.removePaletteItem(id);
      refreshData();
      toast.success('Palette item removed successfully!');
    }
  }, [apiService, refreshData]);

  // Get status color
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800 border-green-200';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status >= 500) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Get method color
  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-800 border-blue-200',
      POST: 'bg-green-100 text-green-800 border-green-200',
      PUT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      DELETE: 'bg-red-100 text-red-800 border-red-200',
      PATCH: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[method] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className={`${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5 text-purple-500" />
            API Palette
          </CardTitle>
          <p className="text-sm text-gray-600">
            Make API requests and work with live data using the $palette variable
          </p>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Make Request
              </TabsTrigger>
              <TabsTrigger value="palette" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Palette ({paletteData.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Make Request Tab */}
            <TabsContent value="requests" className="mt-4">
              <div className="space-y-4">
                {/* Basic Request Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Request Name</label>
                    <Input
                      placeholder="e.g., Weather API, User Data"
                      value={requestName}
                      onChange={(e) => setRequestName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">HTTP Method</label>
                    <Select value={requestMethod} onValueChange={(value: any) => setRequestMethod(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">URL</label>
                  <Input
                    placeholder="https://api.example.com/data"
                    value={requestUrl}
                    onChange={(e) => setRequestUrl(e.target.value)}
                  />
                </div>

                {/* Advanced Options */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </div>

                {showAdvanced && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    {/* Headers */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Headers</label>
                      <div className="space-y-2">
                        {Object.entries(requestHeaders).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <Input
                              placeholder="Header name"
                              value={key}
                              onChange={(e) => handleHeaderChange(key, e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              placeholder="Header value"
                              value={value}
                              onChange={(e) => handleHeaderChange(key, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeHeader(key)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHeaderChange(`header_${Object.keys(requestHeaders).length}`, '')}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Header
                        </Button>
                      </div>
                    </div>

                    {/* Request Body */}
                    {requestMethod !== 'GET' && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Request Body</label>
                        <Textarea
                          placeholder="Enter JSON or text body"
                          value={requestBody}
                          onChange={(e) => setRequestBody(e.target.value)}
                          rows={4}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleMakeRequest}
                  disabled={isLoading || !requestName.trim() || !requestUrl.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? 'Making Request...' : 'Make Request'}
                </Button>

                {/* Quick Examples */}
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Quick Examples
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-blue-800">Weather API</p>
                      <p className="text-blue-700">https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY</p>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">JSONPlaceholder</p>
                      <p className="text-blue-700">https://jsonplaceholder.typicode.com/posts/1</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Palette Tab */}
            <TabsContent value="palette" className="mt-4">
              <div className="space-y-4">
                {/* Palette Actions */}
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Live Data Palette</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportPalette}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('import-palette')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearPalette}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                    <input
                      id="import-palette"
                      type="file"
                      accept=".json"
                      onChange={importPalette}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Palette Items */}
                {paletteData.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Palette className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm font-medium">No palette data yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Make an API request to see live data in your palette
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paletteData.map((item) => (
                      <Card
                        key={item.id}
                        className={`cursor-pointer transition-colors hover:border-purple-300 ${
                          selectedPaletteItem?.id === item.id ? 'border-purple-500 bg-purple-50' : ''
                        }`}
                        onClick={() => handlePaletteItemSelect(item)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">
                              {item.name}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePaletteItem(item.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {new Date(item.timestamp).toLocaleTimeString()}
                            <span>•</span>
                            <span>Used {item.usageCount} times</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xs text-gray-600">
                            <p className="mb-2">
                              <strong>Type:</strong> {item.schema.type}
                              {item.schema.properties && ` (${Object.keys(item.schema.properties).length} properties)`}
                            </p>
                            <p>
                              <strong>Access:</strong> <code className="bg-gray-100 px-1 py-0.5 rounded">
                                $palette.{item.name}
                              </code>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Selected Item Details */}
                {selectedPaletteItem && (
                  <div className="mt-6 p-4 border rounded-lg bg-purple-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-purple-900">
                        {selectedPaletteItem.name} Details
                      </h4>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateInterface(selectedPaletteItem)}
                        >
                          <Code className="w-4 h-4 mr-2" />
                          Generate Interface
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateSampleCode(selectedPaletteItem)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Sample Code
                        </Button>
                      </div>
                    </div>
                    
                    <Tabs defaultValue="data" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="data">Data</TabsTrigger>
                        <TabsTrigger value="schema">Schema</TabsTrigger>
                        <TabsTrigger value="usage">Usage</TabsTrigger>
                      </TabsList>

                      <TabsContent value="data" className="mt-4">
                        <ScrollArea className="h-64">
                          <pre className="text-xs bg-white p-3 rounded border overflow-auto">
                            {JSON.stringify(selectedPaletteItem.data, null, 2)}
                          </pre>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="schema" className="mt-4">
                        <ScrollArea className="h-64">
                          <pre className="text-xs bg-white p-3 rounded border overflow-auto">
                            {JSON.stringify(selectedPaletteItem.schema, null, 2)}
                          </pre>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="usage" className="mt-4">
                        <div className="space-y-3">
                          <div className="p-3 bg-white rounded border">
                            <h5 className="font-medium mb-2">Basic Access</h5>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded block">
                              const data = $palette.{selectedPaletteItem.name};
                            </code>
                          </div>
                          <div className="p-3 bg-white rounded border">
                            <h5 className="font-medium mb-2">Nested Properties</h5>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded block">
                              const value = $palette.{selectedPaletteItem.name}.property;
                            </code>
                          </div>
                          <div className="p-3 bg-white rounded border">
                            <h5 className="font-medium mb-2">TypeScript Interface</h5>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateInterface(selectedPaletteItem)}
                            >
                              <Code className="w-4 h-4 mr-2" />
                              Generate Interface
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-4">
              <div className="space-y-4">
                <h4 className="font-medium">Request & Response History</h4>
                
                <Tabs defaultValue="requests" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="requests">Requests ({requestHistory.length})</TabsTrigger>
                    <TabsTrigger value="responses">Responses ({responseHistory.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="requests" className="mt-4">
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {requestHistory.map((request) => (
                          <div key={request.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={getMethodColor(request.method)}>
                                  {request.method}
                                </Badge>
                                <span className="font-medium">{request.name}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(request.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{request.url}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant={request.status === 'success' ? 'default' : 'destructive'}>
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="responses" className="mt-4">
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {responseHistory.map((response) => (
                          <div key={response.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(response.status)}>
                                  {response.status} {response.statusText}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {response.duration}ms • {response.size} bytes
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(response.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-4">
              <div className="space-y-4">
                <h4 className="font-medium">API Palette Settings</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Auto-save after requests</p>
                      <p className="text-sm text-gray-600">Clear form after successful API requests</p>
                    </div>
                    <Button
                      variant={autoSave ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAutoSave(!autoSave)}
                    >
                      {autoSave ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      How to Use
                    </h5>
                    <div className="text-sm text-blue-800 space-y-2">
                      <p>1. Make an API request using the form above</p>
                      <p>2. Response data is automatically stored in your palette</p>
                      <p>3. Use <code className="bg-blue-100 px-1 py-0.5 rounded">$palette.name</code> in your code</p>
                      <p>4. Get full autocomplete for live data structure</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
