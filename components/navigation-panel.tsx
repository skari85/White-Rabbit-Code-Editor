'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Navigation, 
  Search, 
  FileText, 
  Code, 
  Zap,
  ArrowRight,
  MapPin,
  Eye,
  X,
  RefreshCw,
  ChevronRight,
  Home
} from 'lucide-react';
import { NavigationTarget, SymbolInformation, BreadcrumbItem } from '@/lib/navigation-service';
import { toast } from 'sonner';

interface NavigationPanelProps {
  onNavigate: (file: string, line: number, column: number) => void;
  onGoToDefinition: (symbol: string, file: string, line: number, column: number) => Promise<NavigationTarget[]>;
  onFindUsages: (symbol: string) => Promise<NavigationTarget[]>;
  onSearchSymbols: (query: string) => Promise<SymbolInformation[]>;
  onGetRelatedFiles: (file: string) => Array<{ file: string; relation: string; score: number }>;
  breadcrumbs: BreadcrumbItem[];
  currentFile: string;
  currentLine: number;
  currentColumn: number;
  onClose: () => void;
  className?: string;
}

const NavigationPanel: React.FC<NavigationPanelProps> = ({
  onNavigate,
  onGoToDefinition,
  onFindUsages,
  onSearchSymbols,
  onGetRelatedFiles,
  breadcrumbs,
  currentFile,
  currentLine,
  currentColumn,
  onClose,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SymbolInformation[]>([]);
  const [definitions, setDefinitions] = useState<NavigationTarget[]>([]);
  const [usages, setUsages] = useState<NavigationTarget[]>([]);
  const [relatedFiles, setRelatedFiles] = useState<Array<{ file: string; relation: string; score: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');

  // Handle symbol search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await onSearchSymbols(query);
      setSearchResults(results);
    } catch (error) {
      toast.error('Search failed');
      console.error('Symbol search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onSearchSymbols]);

  // Handle go to definition
  const handleGoToDefinition = useCallback(async (symbol: string) => {
    setIsLoading(true);
    setSelectedSymbol(symbol);
    try {
      const targets = await onGoToDefinition(symbol, currentFile, currentLine, currentColumn);
      setDefinitions(targets);
      setActiveTab('definitions');
    } catch (error) {
      toast.error('Failed to find definition');
      console.error('Go to definition error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onGoToDefinition, currentFile, currentLine, currentColumn]);

  // Handle find usages
  const handleFindUsages = useCallback(async (symbol: string) => {
    setIsLoading(true);
    setSelectedSymbol(symbol);
    try {
      const targets = await onFindUsages(symbol);
      setUsages(targets);
      setActiveTab('usages');
    } catch (error) {
      toast.error('Failed to find usages');
      console.error('Find usages error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onFindUsages]);

  // Handle related files
  const handleGetRelatedFiles = useCallback(() => {
    if (!currentFile) return;
    
    const related = onGetRelatedFiles(currentFile);
    setRelatedFiles(related);
    setActiveTab('related');
  }, [onGetRelatedFiles, currentFile]);

  // Get icon for symbol kind
  const getSymbolIcon = (kind: string) => {
    switch (kind) {
      case 'function': return '🔧';
      case 'class': return '🏛️';
      case 'variable': return '📦';
      case 'method': return '⚙️';
      case 'property': return '🔗';
      case 'interface': return '📋';
      case 'enum': return '📊';
      default: return '📄';
    }
  };

  // Get relation badge color
  const getRelationColor = (relation: string) => {
    switch (relation) {
      case 'imported': return 'bg-blue-100 text-blue-800';
      case 'similar-name': return 'bg-green-100 text-green-800';
      case 'related': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render navigation target
  const renderNavigationTarget = (target: NavigationTarget, showContext = true) => (
    <div
      key={`${target.file}:${target.line}:${target.column}`}
      className="flex items-start gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onNavigate(target.file, target.line, target.column)}
    >
      <div className="flex-shrink-0 mt-1">
        <MapPin className="w-4 h-4 text-blue-500" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900">
            {target.file}
          </span>
          <Badge variant="outline" className="text-xs">
            {target.line}:{target.column}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {target.type}
          </Badge>
        </div>
        
        {target.preview && (
          <code className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded block mb-1">
            {target.preview}
          </code>
        )}
        
        {showContext && target.context && (
          <p className="text-xs text-gray-500">
            {target.context}
          </p>
        )}
      </div>
      
      <div className="flex-shrink-0">
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );

  // Render symbol information
  const renderSymbol = (symbol: SymbolInformation) => (
    <div
      key={`${symbol.file}:${symbol.line}:${symbol.name}`}
      className="flex items-start gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
    >
      <div className="flex-shrink-0 mt-1">
        <span className="text-sm">{getSymbolIcon(symbol.kind)}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900">
            {symbol.name}
          </span>
          <Badge variant="outline" className="text-xs">
            {symbol.kind}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-600">{symbol.file}:{symbol.line}</span>
        </div>
        
        {symbol.signature && (
          <code className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded block mb-2">
            {symbol.signature}
          </code>
        )}
        
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGoToDefinition(symbol.name)}
            className="text-xs h-6 px-2"
          >
            <Code className="w-3 h-3 mr-1" />
            Definition
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFindUsages(symbol.name)}
            className="text-xs h-6 px-2"
          >
            <Search className="w-3 h-3 mr-1" />
            Usages
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate(symbol.file, symbol.line, symbol.column)}
            className="text-xs h-6 px-2"
          >
            <Eye className="w-3 h-3 mr-1" />
            Go
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Navigation</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGetRelatedFiles}
              title="Find related files"
            >
              <FileText className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              title="Close navigation panel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600 mt-2 overflow-x-auto">
            <Home className="w-3 h-3 flex-shrink-0" />
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
                <button
                  onClick={() => onNavigate(crumb.file, crumb.line, crumb.column)}
                  className="hover:text-blue-600 whitespace-nowrap"
                  title={`${crumb.type}: ${crumb.label}`}
                >
                  <span className="mr-1">{crumb.icon}</span>
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-5 mx-3 mt-3">
            <TabsTrigger value="search" className="text-xs">Search</TabsTrigger>
            <TabsTrigger value="definitions" className="text-xs">
              Definitions
              {definitions.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {definitions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="usages" className="text-xs">
              Usages
              {usages.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {usages.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="related" className="text-xs">
              Related
              {relatedFiles.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {relatedFiles.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="symbols" className="text-xs">Symbols</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto">
            {/* Search Tab */}
            <TabsContent value="search" className="mt-0 p-3">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search symbols..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    className="pl-10"
                  />
                </div>
                
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                )}
                
                <div className="space-y-0">
                  {searchResults.map(renderSymbol)}
                </div>
                
                {searchQuery && !isLoading && searchResults.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No symbols found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Definitions Tab */}
            <TabsContent value="definitions" className="mt-0">
              <div className="p-3">
                {selectedSymbol && (
                  <div className="mb-3 p-2 bg-blue-50 rounded">
                    <p className="text-sm text-blue-800">
                      Definitions for: <code className="font-mono">{selectedSymbol}</code>
                    </p>
                  </div>
                )}
                
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                )}
                
                <div className="space-y-0">
                  {definitions.map(target => renderNavigationTarget(target))}
                </div>
                
                {!isLoading && definitions.length === 0 && selectedSymbol && (
                  <div className="text-center py-8 text-gray-500">
                    <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No definitions found for "{selectedSymbol}"</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Usages Tab */}
            <TabsContent value="usages" className="mt-0">
              <div className="p-3">
                {selectedSymbol && (
                  <div className="mb-3 p-2 bg-green-50 rounded">
                    <p className="text-sm text-green-800">
                      Usages for: <code className="font-mono">{selectedSymbol}</code>
                    </p>
                  </div>
                )}
                
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                )}
                
                <div className="space-y-0">
                  {usages.map(target => renderNavigationTarget(target))}
                </div>
                
                {!isLoading && usages.length === 0 && selectedSymbol && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No usages found for "{selectedSymbol}"</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Related Files Tab */}
            <TabsContent value="related" className="mt-0">
              <div className="p-3">
                {currentFile && (
                  <div className="mb-3 p-2 bg-purple-50 rounded">
                    <p className="text-sm text-purple-800">
                      Files related to: <code className="font-mono">{currentFile}</code>
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  {relatedFiles.map((related, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => onNavigate(related.file, 1, 1)}
                    >
                      <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {related.file}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${getRelationColor(related.relation)}`}>
                            {related.relation}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Score: {related.score}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
                
                {relatedFiles.length === 0 && currentFile && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No related files found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Symbols Tab */}
            <TabsContent value="symbols" className="mt-0">
              <div className="p-3">
                <p className="text-sm text-gray-600 mb-3">
                  Current file symbols will be displayed here
                </p>
                {/* This would show symbols from the current file */}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NavigationPanel;
