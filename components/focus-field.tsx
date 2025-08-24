'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Eye, 
  EyeOff, 
  Focus, 
  Zap, 
  Code, 
  FunctionSquare, 
  Variable, 
  GraduationCap, 
  Import, 
  FileDown,
  ArrowUpDown,
  Filter,
  Search,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings,
  Lightbulb,
  Info
} from 'lucide-react';
import { 
  FocusFieldService, 
  FocusFieldContext, 
  FocusFieldTarget, 
  FocusFieldRelation 
} from '@/lib/focus-field-service';

interface FocusFieldProps {
  code: string;
  file: string;
  onFocusChange?: (context: FocusFieldContext | null) => void;
  className?: string;
}

export default function FocusField({
  code,
  file,
  onFocusChange,
  className = ''
}: FocusFieldProps) {
  const [focusContext, setFocusContext] = useState<FocusFieldContext | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [showRelations, setShowRelations] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoFocus, setAutoFocus] = useState(false);
  const [focusIntensity, setFocusIntensity] = useState<'subtle' | 'medium' | 'strong'>('medium');

  // Create focus field from cursor position
  const createFocusField = useCallback((line: number, column: number) => {
    const context = FocusFieldService.createFocusField(code, file, line, column);
    if (context) {
      setFocusContext(context);
      setIsActive(true);
      onFocusChange?.(context);
    }
  }, [code, file, onFocusChange]);

  // Clear focus field
  const clearFocusField = useCallback(() => {
    setFocusContext(null);
    setIsActive(false);
    onFocusChange?.(null);
  }, [onFocusChange]);

  // Get filtered relations
  const filteredRelations = useMemo(() => {
    if (!focusContext) return [];
    
    let relations = focusContext.relations;
    
    // Filter by type
    if (filterType !== 'all') {
      relations = relations.filter(relation => relation.type === filterType);
    }
    
    // Filter by search query
    if (searchQuery) {
      relations = relations.filter(relation => 
        relation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        relation.line.toString().includes(searchQuery)
      );
    }
    
    return relations;
  }, [focusContext, filterType, searchQuery]);

  // Get focus field summary
  const summary = useMemo(() => {
    if (!focusContext) return null;
    return FocusFieldService.getFocusFieldSummary(focusContext);
  }, [focusContext]);

  // Get relation icon
  const getRelationIcon = (type: FocusFieldRelation['type']) => {
    switch (type) {
      case 'definition':
        return <Code className="w-4 h-4 text-blue-500" />;
      case 'usage':
        return <Variable className="w-4 h-4 text-green-500" />;
      case 'modification':
        return <Zap className="w-4 h-4 text-orange-500" />;
      case 'import':
        return <Import className="w-4 h-4 text-purple-500" />;
      case 'export':
        return <FileDown className="w-4 h-4 text-indigo-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get target icon
  const getTargetIcon = (type: FocusFieldTarget['type']) => {
    switch (type) {
      case 'variable':
        return <Variable className="w-5 h-5 text-blue-500" />;
      case 'function':
        return <FunctionSquare className="w-5 h-5 text-green-500" />;
      case 'class':
        return <GraduationCap className="w-5 h-5 text-purple-500" />;
      case 'method':
        return <Code className="w-5 h-5 text-orange-500" />;
      case 'property':
        return <Variable className="w-5 h-5 text-indigo-500" />;
      case 'import':
        return <Import className="w-5 h-5 text-teal-500" />;
      default:
        return <Target className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: FocusFieldRelation['severity']) => {
    switch (severity) {
      case 'primary':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'secondary':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'tertiary':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Handle relation click
  const handleRelationClick = useCallback((relation: FocusFieldRelation) => {
    // This would typically scroll to the line in the editor
    console.log(`Navigate to line ${relation.line}, column ${relation.column}`);
  }, []);

  if (!isActive || !focusContext) {
    return (
      <div className={`p-4 ${className}`}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-gray-500" />
              Focus Field
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500">
              <Focus className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium">No focus field active</p>
              <p className="text-xs text-gray-400 mt-1">
                Click on a variable, function, or class to create a focus field
              </p>
              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoFocus(!autoFocus)}
                  className="w-full"
                >
                  <Target className="w-4 h-4 mr-2" />
                  {autoFocus ? 'Disable' : 'Enable'} Auto-Focus
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createFocusField(1, 1)}
                  className="w-full"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Demo Focus Field
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-blue-500" />
              Focus Field: {focusContext.target.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRelations(!showRelations)}
              >
                {showRelations ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFocusField}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Target Info */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              {getTargetIcon(focusContext.target.type)}
              <Badge variant="outline" className="text-xs">
                {focusContext.target.type}
              </Badge>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="text-sm text-gray-600">
              Line {focusContext.target.line}:{focusContext.target.column}
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="text-sm text-gray-600">
              {summary?.totalRelations} relations
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="relations" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="relations">
                Relations ({filteredRelations.length})
              </TabsTrigger>
              <TabsTrigger value="focus">Focus View</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="relations" className="mt-4">
              {/* Filters */}
              <div className="flex items-center gap-2 mb-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1 text-sm border rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="definition">Definitions</option>
                  <option value="usage">Usages</option>
                  <option value="modification">Modifications</option>
                  <option value="import">Imports</option>
                  <option value="export">Exports</option>
                </select>
                
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search relations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 text-sm border rounded-md w-48"
                  />
                </div>
              </div>

              {/* Relations List */}
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {filteredRelations.map((relation) => (
                    <div
                      key={relation.id}
                      className="p-3 border rounded-lg cursor-pointer transition-colors hover:border-blue-300 hover:bg-blue-50"
                      onClick={() => handleRelationClick(relation)}
                    >
                      <div className="flex items-start gap-3">
                        {getRelationIcon(relation.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              {relation.description}
                            </p>
                            <Badge className={`text-xs ${getSeverityColor(relation.severity)}`}>
                              {relation.severity}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            Line {relation.line}:{relation.column}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="focus" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Focus Range</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Lines {focusContext.focusRange.startLine} - {focusContext.focusRange.endLine}
                    </Badge>
                    <Badge variant="outline">
                      {focusContext.focusRange.endLine - focusContext.focusRange.startLine + 1} lines
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="text-sm text-blue-800">
                    <p className="mb-2">
                      <strong>Focus Field:</strong> The editor will highlight lines {focusContext.focusRange.startLine} to {focusContext.focusRange.endLine} 
                      as the primary focus area. All other lines will be dimmed to reduce cognitive load.
                    </p>
                    <p>
                      <strong>Related Lines:</strong> {Array.from(focusContext.relatedLines).sort((a, b) => a - b).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Focus Intensity</h5>
                    <select
                      value={focusIntensity}
                      onChange={(e) => setFocusIntensity(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border rounded-md"
                    >
                      <option value="subtle">Subtle (20% dimming)</option>
                      <option value="medium">Medium (50% dimming)</option>
                      <option value="strong">Strong (80% dimming)</option>
                    </select>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Actions</h5>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => console.log('Navigate to focus range')}
                      >
                        <Maximize2 className="w-4 h-4 mr-2" />
                        Go to Focus
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => console.log('Expand focus range')}
                      >
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        Expand Range
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Focus Field Settings</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-focus on cursor</span>
                      <Button
                        variant={autoFocus ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAutoFocus(!autoFocus)}
                      >
                        {autoFocus ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show relation details</span>
                      <Button
                        variant={showRelations ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowRelations(!showRelations)}
                      >
                        {showRelations ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Keyboard Shortcuts</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl/Cmd + F</kbd> - Create focus field</p>
                    <p><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> - Clear focus field</p>
                    <p><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl/Cmd + Shift + F</kbd> - Toggle focus view</p>
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
