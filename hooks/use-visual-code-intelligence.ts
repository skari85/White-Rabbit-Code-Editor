import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  VisualCodeIntelligence, 
  DependencyGraph, 
  FocusMode, 
  CodePattern, 
  VisualizationLayout 
} from '@/lib/visual-code-intelligence';

export interface UseVisualCodeIntelligenceOptions {
  autoAnalyze?: boolean;
  includeTestFiles?: boolean;
  detectPatterns?: boolean;
  enableMethodFolding?: boolean;
}

export interface VisualIntelligenceState {
  isAnalyzing: boolean;
  dependencyGraph: DependencyGraph | null;
  currentFocusMode: FocusMode | null;
  currentLayout: VisualizationLayout | null;
  detectedPatterns: CodePattern[];
  visualizationData: any;
  error: string | null;
}

export function useVisualCodeIntelligence(
  files: Array<{ name: string; content: string; type: string }>,
  options: UseVisualCodeIntelligenceOptions = {}
) {
  const {
    autoAnalyze = true,
    includeTestFiles = true,
    detectPatterns = true,
    enableMethodFolding = true
  } = options;

  // State
  const [state, setState] = useState<VisualIntelligenceState>({
    isAnalyzing: false,
    dependencyGraph: null,
    currentFocusMode: null,
    currentLayout: null,
    detectedPatterns: [],
    visualizationData: null,
    error: null
  });

  // Intelligence service
  const intelligenceRef = useRef<VisualCodeIntelligence | null>(null);

  // Initialize service
  useEffect(() => {
    intelligenceRef.current = new VisualCodeIntelligence();
    const layouts = intelligenceRef.current.getAvailableLayouts();
    setState(prev => ({ ...prev, currentLayout: layouts[0] }));
  }, []);

  // Auto-analyze when files change
  useEffect(() => {
    if (autoAnalyze && files.length > 0 && intelligenceRef.current) {
      analyzeProject();
    }
  }, [files, autoAnalyze]);

  // Update state helper
  const updateState = useCallback((updates: Partial<VisualIntelligenceState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Analyze project
  const analyzeProject = useCallback(async () => {
    if (!intelligenceRef.current || files.length === 0) return;

    updateState({ isAnalyzing: true, error: null });

    try {
      // Filter files if needed
      const filesToAnalyze = includeTestFiles 
        ? files 
        : files.filter(f => !f.name.includes('.test.') && !f.name.includes('.spec.'));

      // Analyze project
      const graph = await intelligenceRef.current.analyzeProject(filesToAnalyze);
      
      // Get patterns if enabled
      const patterns = detectPatterns 
        ? intelligenceRef.current.getDetectedPatterns() 
        : [];

      // Get visualization data
      const vizData = intelligenceRef.current.getVisualizationData(state.currentLayout || undefined);

      updateState({
        dependencyGraph: graph,
        detectedPatterns: patterns,
        visualizationData: vizData,
        isAnalyzing: false
      });

    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Analysis failed',
        isAnalyzing: false
      });
    }
  }, [files, includeTestFiles, detectPatterns, state.currentLayout, updateState]);

  // Set focus mode
  const setFocusMode = useCallback((focusModeId: string | null) => {
    if (!intelligenceRef.current) return;

    const focusMode = focusModeId 
      ? intelligenceRef.current.getFocusModes().find(fm => fm.id === focusModeId) || null
      : null;

    intelligenceRef.current.setCurrentFocusMode(focusMode?.id || null);
    
    // Update visualization with new focus
    const vizData = intelligenceRef.current.getVisualizationData(state.currentLayout || undefined);
    
    updateState({
      currentFocusMode: focusMode,
      visualizationData: vizData
    });
  }, [state.currentLayout, updateState]);

  // Set layout
  const setLayout = useCallback((layoutId: string) => {
    if (!intelligenceRef.current) return;

    const layout = intelligenceRef.current.getAvailableLayouts().find(l => l.id === layoutId);
    if (!layout) return;

    intelligenceRef.current.setLayout(layout);
    
    // Update visualization with new layout
    const vizData = intelligenceRef.current.getVisualizationData(layout);
    
    updateState({
      currentLayout: layout,
      visualizationData: vizData
    });
  }, [updateState]);

  // Get AI focus recommendations
  const getAIFocusRecommendations = useCallback((context: {
    currentFile?: string;
    recentFiles?: string[];
    taskType?: 'debugging' | 'feature' | 'refactoring' | 'review';
  }) => {
    if (!intelligenceRef.current) return [];
    return intelligenceRef.current.getAIFocusRecommendations(context);
  }, []);

  // Get method folding configuration
  const getMethodFoldingConfig = useCallback(() => {
    if (!intelligenceRef.current || !enableMethodFolding) return null;
    return intelligenceRef.current.getMethodFoldingConfiguration();
  }, [enableMethodFolding]);

  // Get nodes for method folding
  const getMethodFoldingNodes = useCallback(() => {
    if (!intelligenceRef.current || !enableMethodFolding) return [];
    return intelligenceRef.current.getMethodBodyFoldingNodes();
  }, [enableMethodFolding]);

  // Get available focus modes
  const getAvailableFocusModes = useCallback(() => {
    if (!intelligenceRef.current) return [];
    return intelligenceRef.current.getFocusModes();
  }, []);

  // Get available layouts
  const getAvailableLayouts = useCallback(() => {
    if (!intelligenceRef.current) return [];
    return intelligenceRef.current.getAvailableLayouts();
  }, []);

  // Get contextual focus mode
  const getContextualFocusMode = useCallback((context: {
    currentFile?: string;
    selectedNodes?: string[];
    taskType?: string;
  }) => {
    if (!intelligenceRef.current) return null;
    return intelligenceRef.current.getContextualFocusMode(context);
  }, []);

  // Filter patterns by type
  const getPatternsByType = useCallback((type: CodePattern['type']) => {
    return state.detectedPatterns.filter(p => p.type === type);
  }, [state.detectedPatterns]);

  // Get critical patterns
  const getCriticalPatterns = useCallback(() => {
    return state.detectedPatterns.filter(p => 
      p.impact === 'negative' && p.confidence > 0.8
    );
  }, [state.detectedPatterns]);

  // Get graph metrics
  const getGraphMetrics = useCallback(() => {
    return state.dependencyGraph?.metrics || null;
  }, [state.dependencyGraph]);

  // Get nodes by importance
  const getNodesByImportance = useCallback((importance: 'critical' | 'important' | 'moderate' | 'low') => {
    if (!state.dependencyGraph) return [];
    return state.dependencyGraph.nodes.filter(n => n.importance === importance);
  }, [state.dependencyGraph]);

  // Get circular dependencies
  const getCircularDependencies = useCallback(() => {
    if (!state.dependencyGraph) return [];
    
    // Find nodes involved in circular dependencies
    const cyclicPatterns = state.detectedPatterns.filter(p => p.id === 'circular-dependencies');
    return cyclicPatterns.length > 0 ? cyclicPatterns[0].nodes : [];
  }, [state.dependencyGraph, state.detectedPatterns]);

  // Get orphan nodes (no connections)
  const getOrphanNodes = useCallback(() => {
    if (!state.dependencyGraph) return [];
    
    const connectedNodeIds = new Set<string>();
    state.dependencyGraph.edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    
    return state.dependencyGraph.nodes.filter(node => !connectedNodeIds.has(node.id));
  }, [state.dependencyGraph]);

  // Get highly connected nodes (hubs)
  const getHubNodes = useCallback((threshold: number = 5) => {
    if (!state.dependencyGraph) return [];
    
    const connectionCounts = new Map<string, number>();
    
    state.dependencyGraph.edges.forEach(edge => {
      connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
      connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
    });
    
    return state.dependencyGraph.nodes.filter(node => 
      (connectionCounts.get(node.id) || 0) >= threshold
    );
  }, [state.dependencyGraph]);

  // Export graph data
  const exportGraphData = useCallback((format: 'json' | 'csv' | 'graphml' = 'json') => {
    if (!state.dependencyGraph) return null;
    
    switch (format) {
      case 'json':
        return JSON.stringify(state.dependencyGraph, null, 2);
      case 'csv':
        // Simple CSV export of nodes
        const csvHeader = 'id,name,type,importance,complexity\n';
        const csvRows = state.dependencyGraph.nodes.map(node => 
          `${node.id},${node.name},${node.type},${node.importance},${node.metadata.complexity || 0}`
        ).join('\n');
        return csvHeader + csvRows;
      case 'graphml':
        // Basic GraphML format
        return `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <graph id="dependency-graph" edgedefault="directed">
    ${state.dependencyGraph.nodes.map(node => 
      `<node id="${node.id}"><data key="name">${node.name}</data></node>`
    ).join('\n    ')}
    ${state.dependencyGraph.edges.map(edge => 
      `<edge source="${edge.source}" target="${edge.target}"/>`
    ).join('\n    ')}
  </graph>
</graphml>`;
      default:
        return null;
    }
  }, [state.dependencyGraph]);

  // Search nodes
  const searchNodes = useCallback((query: string) => {
    if (!state.dependencyGraph || !query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return state.dependencyGraph.nodes.filter(node =>
      node.name.toLowerCase().includes(lowerQuery) ||
      node.path.toLowerCase().includes(lowerQuery) ||
      node.type.toLowerCase().includes(lowerQuery)
    );
  }, [state.dependencyGraph]);

  // Get node details
  const getNodeDetails = useCallback((nodeId: string) => {
    if (!state.dependencyGraph) return null;
    
    const node = state.dependencyGraph.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    const incomingEdges = state.dependencyGraph.edges.filter(e => e.target === nodeId);
    const outgoingEdges = state.dependencyGraph.edges.filter(e => e.source === nodeId);
    
    return {
      node,
      incomingConnections: incomingEdges.length,
      outgoingConnections: outgoingEdges.length,
      dependencies: incomingEdges.map(e => e.source),
      dependents: outgoingEdges.map(e => e.target)
    };
  }, [state.dependencyGraph]);

  return {
    // State
    ...state,
    
    // Actions
    analyzeProject,
    setFocusMode,
    setLayout,
    
    // Getters
    getAIFocusRecommendations,
    getMethodFoldingConfig,
    getMethodFoldingNodes,
    getAvailableFocusModes,
    getAvailableLayouts,
    getContextualFocusMode,
    getPatternsByType,
    getCriticalPatterns,
    getGraphMetrics,
    getNodesByImportance,
    getCircularDependencies,
    getOrphanNodes,
    getHubNodes,
    exportGraphData,
    searchNodes,
    getNodeDetails,
    
    // Computed values
    hasGraph: !!state.dependencyGraph,
    hasPatterns: state.detectedPatterns.length > 0,
    hasCriticalIssues: state.detectedPatterns.some(p => p.impact === 'negative' && p.confidence > 0.8),
    totalNodes: state.dependencyGraph?.metrics.totalNodes || 0,
    totalEdges: state.dependencyGraph?.metrics.totalEdges || 0,
    cyclicDependencyCount: state.dependencyGraph?.metrics.cyclicDependencies || 0,
    maintainabilityScore: state.dependencyGraph?.metrics.maintainabilityIndex || 0
  };
}
