'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCodeBuilder } from '@/hooks/use-code-builder';
import { CodePattern, DependencyGraph, FocusMode, VisualizationLayout, VisualCodeIntelligence } from '@/lib/visual-code-intelligence';
import { 
  AlertTriangle, 
  Brain, 
  Eye, 
  GitBranch, 
  Layers, 
  Network, 
  RefreshCw, 
  Search, 
  Settings, 
  Target, 
  Zap 
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface VisualCodeIntelligenceProps {
  className?: string;
  onFocusModeChange?: (focusMode: FocusMode | null) => void;
  onPatternDetected?: (patterns: CodePattern[]) => void;
}

export function VisualCodeIntelligenceComponent({
  className = "",
  onFocusModeChange,
  onPatternDetected
}: VisualCodeIntelligenceProps) {
  // State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dependencyGraph, setDependencyGraph] = useState<DependencyGraph | null>(null);
  const [currentFocusMode, setCurrentFocusMode] = useState<FocusMode | null>(null);
  const [currentLayout, setCurrentLayout] = useState<VisualizationLayout | null>(null);
  const [detectedPatterns, setDetectedPatterns] = useState<CodePattern[]>([]);
  const [visualizationData, setVisualizationData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('graph');

  // Hooks
  const { files } = useCodeBuilder();
  
  // Intelligence service
  const intelligenceRef = useRef<VisualCodeIntelligence | null>(null);

  // Initialize service
  useEffect(() => {
    intelligenceRef.current = new VisualCodeIntelligence();
    setCurrentLayout(intelligenceRef.current.getAvailableLayouts()[0]);
  }, []);

  // Analyze project when files change
  useEffect(() => {
    if (files.length > 0 && intelligenceRef.current) {
      analyzeProject();
    }
  }, [files]);

  // Analyze project
  const analyzeProject = useCallback(async () => {
    if (!intelligenceRef.current || files.length === 0) return;

    setIsAnalyzing(true);
    try {
      const graph = await intelligenceRef.current.analyzeProject(files);
      setDependencyGraph(graph);
      
      const patterns = intelligenceRef.current.getDetectedPatterns();
      setDetectedPatterns(patterns);
      onPatternDetected?.(patterns);

      // Update visualization data
      const vizData = intelligenceRef.current.getVisualizationData(currentLayout || undefined);
      setVisualizationData(vizData);
    } catch (error) {
      console.error('Failed to analyze project:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [files, currentLayout, onPatternDetected]);

  // Change focus mode
  const handleFocusModeChange = useCallback((focusModeId: string) => {
    if (!intelligenceRef.current) return;

    const focusMode = focusModeId === 'none' 
      ? null 
      : intelligenceRef.current.getFocusModes().find(fm => fm.id === focusModeId) || null;

    intelligenceRef.current.setCurrentFocusMode(focusMode?.id || null);
    setCurrentFocusMode(focusMode);
    onFocusModeChange?.(focusMode);

    // Update visualization
    const vizData = intelligenceRef.current.getVisualizationData(currentLayout || undefined);
    setVisualizationData(vizData);
  }, [currentLayout, onFocusModeChange]);

  // Change layout
  const handleLayoutChange = useCallback((layoutId: string) => {
    if (!intelligenceRef.current) return;

    const layout = intelligenceRef.current.getAvailableLayouts().find(l => l.id === layoutId);
    if (layout) {
      intelligenceRef.current.setLayout(layout);
      setCurrentLayout(layout);

      // Update visualization
      const vizData = intelligenceRef.current.getVisualizationData(layout);
      setVisualizationData(vizData);
    }
  }, []);

  // Get AI focus recommendations
  const getAIRecommendations = useCallback(() => {
    if (!intelligenceRef.current) return [];

    return intelligenceRef.current.getAIFocusRecommendations({
      taskType: 'feature' // Could be dynamic based on user context
    });
  }, []);

  // Get pattern severity color
  const getPatternColor = (pattern: CodePattern) => {
    switch (pattern.impact) {
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'neutral': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get pattern icon
  const getPatternIcon = (pattern: CodePattern) => {
    switch (pattern.type) {
      case 'design_pattern': return <Target className="w-4 h-4" />;
      case 'anti_pattern': return <AlertTriangle className="w-4 h-4" />;
      case 'architecture_pattern': return <Layers className="w-4 h-4" />;
      case 'code_smell': return <Search className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600" />
            Visual Code Intelligence
          </CardTitle>
          <CardDescription>
            Visualize code dependencies, detect patterns, and get AI-powered insights about your codebase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="graph" className="flex items-center gap-2">
                <Network className="w-4 h-4" />
                Graph
              </TabsTrigger>
              <TabsTrigger value="patterns" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Patterns
              </TabsTrigger>
              <TabsTrigger value="focus" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Focus
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="graph" className="space-y-4">
              {/* Controls */}
              <div className="flex gap-4 items-center">
                <Button
                  onClick={analyzeProject}
                  disabled={isAnalyzing || files.length === 0}
                  size="sm"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze Project
                    </>
                  )}
                </Button>

                {intelligenceRef.current && (
                  <>
                    <Select value={currentFocusMode?.id || 'none'} onValueChange={handleFocusModeChange}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select focus mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Focus</SelectItem>
                        {intelligenceRef.current.getFocusModes().map(mode => (
                          <SelectItem key={mode.id} value={mode.id}>
                            {mode.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={currentLayout?.id || ''} onValueChange={handleLayoutChange}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select layout" />
                      </SelectTrigger>
                      <SelectContent>
                        {intelligenceRef.current.getAvailableLayouts().map(layout => (
                          <SelectItem key={layout.id} value={layout.id}>
                            {layout.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>

              {/* Graph Metrics */}
              {dependencyGraph && (
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{dependencyGraph.metrics.totalNodes}</div>
                      <div className="text-sm text-gray-600">Nodes</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{dependencyGraph.metrics.totalEdges}</div>
                      <div className="text-sm text-gray-600">Connections</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{dependencyGraph.metrics.cyclicDependencies}</div>
                      <div className="text-sm text-gray-600">Cycles</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{Math.round(dependencyGraph.metrics.maintainabilityIndex)}</div>
                      <div className="text-sm text-gray-600">Maintainability</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Visualization Area */}
              <Card>
                <CardContent className="p-4">
                  <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
                    {visualizationData ? (
                      <div className="text-center">
                        <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Dependency Graph</h3>
                        <p className="text-gray-600 mb-4">
                          {visualizationData.nodes.length} nodes, {visualizationData.edges.length} edges
                        </p>
                        <div className="text-sm text-gray-500">
                          Interactive graph visualization would be rendered here using a library like D3.js or vis.js
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
                        <p className="text-gray-600">Click "Analyze Project" to visualize your code dependencies</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patterns" className="space-y-4">
              {detectedPatterns.length > 0 ? (
                <div className="space-y-3">
                  {detectedPatterns.map((pattern) => (
                    <Card key={pattern.id} className={`border ${getPatternColor(pattern)}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getPatternIcon(pattern)}
                          {pattern.name}
                          <span className="text-xs bg-white px-2 py-1 rounded">
                            {Math.round(pattern.confidence * 100)}% confidence
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">{pattern.description}</p>
                          <div className="text-xs">
                            <strong>Affected nodes:</strong> {pattern.nodes.length}
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-medium">Recommendations:</div>
                            <ul className="text-xs space-y-1">
                              {pattern.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-1">
                                  <span className="text-gray-400">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Target className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Patterns Detected</h3>
                    <p className="text-gray-600">
                      {dependencyGraph ? 'Your code looks clean!' : 'Analyze your project to detect patterns'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="focus" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">AI Focus Recommendations</CardTitle>
                  <CardDescription>
                    Get AI-powered suggestions for focusing on relevant parts of your codebase.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getAIRecommendations().map((recommendation) => (
                      <div key={recommendation.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{recommendation.name}</div>
                            <div className="text-sm text-gray-600">{recommendation.description}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFocusModeChange(recommendation.id)}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Method Body Folding</CardTitle>
                  <CardDescription>
                    Configure automatic folding of method bodies to improve code readability.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {intelligenceRef.current && (
                    <div className="space-y-3">
                      {(() => {
                        const foldingConfig = intelligenceRef.current.getMethodFoldingConfiguration();
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Fold by default</span>
                              <span className="text-sm font-medium">
                                {foldingConfig.foldByDefault ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              Automatically fold method bodies longer than 5 lines with moderate complexity
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-medium">Folding Rules:</div>
                              {foldingConfig.foldingRules.map((rule, index) => (
                                <div key={index} className="text-xs text-gray-600">
                                  • {rule.pattern}: min {rule.minLines || 0} lines
                                  {rule.maxComplexity && `, max complexity ${rule.maxComplexity}`}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Visualization Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Node Size Based On</label>
                      <Select defaultValue="complexity">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="complexity">Complexity</SelectItem>
                          <SelectItem value="importance">Importance</SelectItem>
                          <SelectItem value="lines">Lines of Code</SelectItem>
                          <SelectItem value="dependencies">Dependencies</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Edge Thickness Based On</label>
                      <Select defaultValue="strength">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="strength">Relationship Strength</SelectItem>
                          <SelectItem value="frequency">Usage Frequency</SelectItem>
                          <SelectItem value="critical">Criticality</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Color Scheme</label>
                      <Select defaultValue="type">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="type">By Node Type</SelectItem>
                          <SelectItem value="importance">By Importance</SelectItem>
                          <SelectItem value="cluster">By Cluster</SelectItem>
                          <SelectItem value="complexity">By Complexity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Analysis Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Auto-analyze on file changes</div>
                        <div className="text-sm text-gray-600">
                          Automatically re-analyze when files are modified
                        </div>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Include test files</div>
                        <div className="text-sm text-gray-600">
                          Include test files in dependency analysis
                        </div>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Detect circular dependencies</div>
                        <div className="text-sm text-gray-600">
                          Highlight circular dependency patterns
                        </div>
                      </div>
                      <input type="checkbox" defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
