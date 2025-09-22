export interface CodeNode {
  id: string;
  name: string;
  type: 'file' | 'function' | 'class' | 'interface' | 'variable' | 'import' | 'export';
  path: string;
  line?: number;
  column?: number;
  size: number; // Lines of code or complexity score
  importance: 'critical' | 'important' | 'moderate' | 'low';
  dependencies: string[]; // IDs of nodes this depends on
  dependents: string[]; // IDs of nodes that depend on this
  metadata: {
    language: string;
    framework?: string;
    lastModified: Date;
    complexity?: number;
    testCoverage?: number;
    documentation?: string;
  };
}

export interface CodeEdge {
  id: string;
  source: string;
  target: string;
  type: 'import' | 'call' | 'inheritance' | 'composition' | 'reference';
  strength: number; // 0-1, how strong the relationship is
  bidirectional: boolean;
  metadata: {
    frequency?: number; // How often this relationship is used
    critical?: boolean; // Is this a critical dependency
    cyclic?: boolean; // Part of a circular dependency
  };
}

export interface DependencyGraph {
  nodes: CodeNode[];
  edges: CodeEdge[];
  clusters: CodeCluster[];
  metrics: {
    totalNodes: number;
    totalEdges: number;
    cyclicDependencies: number;
    orphanNodes: number;
    complexity: number;
    maintainabilityIndex: number;
  };
}

export interface CodeCluster {
  id: string;
  name: string;
  type: 'module' | 'feature' | 'layer' | 'framework';
  nodes: string[]; // Node IDs in this cluster
  color: string;
  description?: string;
}

export interface FocusMode {
  id: string;
  name: string;
  description: string;
  filters: {
    nodeTypes: string[];
    importance: string[];
    complexity?: { min?: number; max?: number };
    recentlyModified?: boolean;
    testCoverage?: { min?: number; max?: number };
  };
  visualization: {
    hideUnrelated: boolean;
    emphasizeConnections: boolean;
    groupByClusters: boolean;
    showMetrics: boolean;
  };
}

export interface CodePattern {
  id: string;
  name: string;
  type: 'design_pattern' | 'anti_pattern' | 'architecture_pattern' | 'code_smell';
  description: string;
  nodes: string[]; // Nodes involved in this pattern
  confidence: number; // 0-1
  impact: 'positive' | 'negative' | 'neutral';
  recommendations: string[];
}

export interface VisualizationLayout {
  id: string;
  name: string;
  type: 'force' | 'hierarchical' | 'circular' | 'grid' | 'tree';
  settings: {
    spacing: number;
    grouping: 'none' | 'type' | 'cluster' | 'importance';
    direction?: 'horizontal' | 'vertical';
    centerNode?: string;
  };
}

export class VisualCodeIntelligence {
  private dependencyGraph: DependencyGraph | null = null;
  private focusModes: FocusMode[] = [];
  private detectedPatterns: CodePattern[] = [];
  private currentLayout: VisualizationLayout;
  private currentFocusMode: FocusMode | null = null;

  constructor() {
    this.initializeDefaultFocusModes();
    this.currentLayout = this.getDefaultLayout();
  }

  /**
   * Analyze project files and build dependency graph
   */
  async analyzeProject(files: Array<{ name: string; content: string; type: string }>): Promise<DependencyGraph> {
    const nodes = await this.extractNodes(files);
    const edges = await this.extractEdges(files, nodes);
    const clusters = this.identifyClusters(nodes, edges);
    const metrics = this.calculateMetrics(nodes, edges);

    this.dependencyGraph = {
      nodes,
      edges,
      clusters,
      metrics
    };

    // Detect patterns after building the graph
    this.detectedPatterns = await this.detectCodePatterns();

    return this.dependencyGraph;
  }

  /**
   * Get dependency graph with optional focus mode applied
   */
  getDependencyGraph(focusModeId?: string): DependencyGraph | null {
    if (!this.dependencyGraph) return null;

    if (focusModeId) {
      const focusMode = this.focusModes.find(fm => fm.id === focusModeId);
      if (focusMode) {
        return this.applyFocusMode(this.dependencyGraph, focusMode);
      }
    }

    return this.dependencyGraph;
  }

  /**
   * Get nodes that should have method bodies folded by default
   */
  getMethodBodyFoldingNodes(): Array<{ file: string; line: number; type: 'method' | 'function' | 'class' }> {
    if (!this.dependencyGraph) return [];

    return this.dependencyGraph.nodes
      .filter(node => 
        (node.type === 'function' || node.type === 'class') &&
        node.importance !== 'critical' &&
        (node.metadata.complexity || 0) > 10
      )
      .map(node => ({
        file: node.path,
        line: node.line || 1,
        type: node.type as 'method' | 'function' | 'class'
      }));
  }

  /**
   * Get AI-powered focus recommendations
   */
  getAIFocusRecommendations(context: {
    currentFile?: string;
    recentFiles?: string[];
    taskType?: 'debugging' | 'feature' | 'refactoring' | 'review';
  }): FocusMode[] {
    const recommendations: FocusMode[] = [];

    if (context.taskType === 'debugging') {
      recommendations.push({
        id: 'debug-focus',
        name: 'Debug Focus',
        description: 'Focus on error-prone areas and their dependencies',
        filters: {
          nodeTypes: ['function', 'class'],
          importance: ['critical', 'important'],
          complexity: { min: 15 }
        },
        visualization: {
          hideUnrelated: true,
          emphasizeConnections: true,
          groupByClusters: false,
          showMetrics: true
        }
      });
    }

    if (context.taskType === 'feature') {
      recommendations.push({
        id: 'feature-focus',
        name: 'Feature Development',
        description: 'Focus on recently modified files and their connections',
        filters: {
          nodeTypes: ['file', 'function', 'class'],
          importance: ['critical', 'important', 'moderate'],
          recentlyModified: true
        },
        visualization: {
          hideUnrelated: false,
          emphasizeConnections: true,
          groupByClusters: true,
          showMetrics: false
        }
      });
    }

    if (context.currentFile) {
      const currentNode = this.dependencyGraph?.nodes.find(n => n.path === context.currentFile);
      if (currentNode) {
        recommendations.push({
          id: 'current-file-focus',
          name: 'Current File Context',
          description: 'Focus on current file and its immediate dependencies',
          filters: {
            nodeTypes: ['file', 'function', 'class', 'interface'],
            importance: ['critical', 'important', 'moderate']
          },
          visualization: {
            hideUnrelated: true,
            emphasizeConnections: true,
            groupByClusters: false,
            showMetrics: true
          }
        });
      }
    }

    return recommendations;
  }

  /**
   * Detect code patterns and relationships
   */
  async detectCodePatterns(): Promise<CodePattern[]> {
    if (!this.dependencyGraph) return [];

    const patterns: CodePattern[] = [];

    // Detect circular dependencies
    const cyclicNodes = this.findCyclicDependencies();
    if (cyclicNodes.length > 0) {
      patterns.push({
        id: 'circular-dependencies',
        name: 'Circular Dependencies',
        type: 'anti_pattern',
        description: 'Circular dependencies detected that may cause issues',
        nodes: cyclicNodes,
        confidence: 0.9,
        impact: 'negative',
        recommendations: [
          'Consider dependency inversion',
          'Extract common interfaces',
          'Refactor to remove circular references'
        ]
      });
    }

    // Detect singleton pattern
    const singletons = this.detectSingletonPattern();
    if (singletons.length > 0) {
      patterns.push({
        id: 'singleton-pattern',
        name: 'Singleton Pattern',
        type: 'design_pattern',
        description: 'Singleton pattern implementation detected',
        nodes: singletons,
        confidence: 0.8,
        impact: 'neutral',
        recommendations: [
          'Consider if singleton is necessary',
          'Ensure thread safety if needed',
          'Consider dependency injection alternatives'
        ]
      });
    }

    // Detect god classes (high complexity, many dependencies)
    const godClasses = this.detectGodClasses();
    if (godClasses.length > 0) {
      patterns.push({
        id: 'god-classes',
        name: 'God Classes',
        type: 'anti_pattern',
        description: 'Classes with too many responsibilities detected',
        nodes: godClasses,
        confidence: 0.85,
        impact: 'negative',
        recommendations: [
          'Split into smaller, focused classes',
          'Apply Single Responsibility Principle',
          'Extract related functionality into separate modules'
        ]
      });
    }

    return patterns;
  }

  /**
   * Get visualization data for rendering
   */
  getVisualizationData(layout?: VisualizationLayout): {
    nodes: any[];
    edges: any[];
    layout: VisualizationLayout;
  } {
    if (!this.dependencyGraph) {
      return { nodes: [], edges: [], layout: this.currentLayout };
    }

    const activeLayout = layout || this.currentLayout;
    const graph = this.currentFocusMode 
      ? this.applyFocusMode(this.dependencyGraph, this.currentFocusMode)
      : this.dependencyGraph;

    const nodes = graph.nodes.map(node => ({
      id: node.id,
      label: node.name,
      type: node.type,
      size: this.calculateNodeSize(node),
      color: this.getNodeColor(node),
      importance: node.importance,
      metadata: node.metadata,
      x: 0, // Will be calculated by layout algorithm
      y: 0
    }));

    const edges = graph.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      strength: edge.strength,
      color: this.getEdgeColor(edge),
      width: Math.max(1, edge.strength * 3),
      metadata: edge.metadata
    }));

    return { nodes, edges, layout: activeLayout };
  }

  /**
   * Apply focus mode to filter and emphasize relevant parts
   */
  private applyFocusMode(graph: DependencyGraph, focusMode: FocusMode): DependencyGraph {
    let filteredNodes = graph.nodes.filter(node => {
      // Filter by node type
      if (!focusMode.filters.nodeTypes.includes(node.type)) return false;
      
      // Filter by importance
      if (!focusMode.filters.importance.includes(node.importance)) return false;
      
      // Filter by complexity
      if (focusMode.filters.complexity) {
        const complexity = node.metadata.complexity || 0;
        if (focusMode.filters.complexity.min && complexity < focusMode.filters.complexity.min) return false;
        if (focusMode.filters.complexity.max && complexity > focusMode.filters.complexity.max) return false;
      }
      
      // Filter by recent modifications
      if (focusMode.filters.recentlyModified) {
        const daysSinceModified = (new Date().getTime() - node.metadata.lastModified.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceModified > 7) return false; // Modified within last week
      }
      
      return true;
    });

    // If hiding unrelated nodes, also include nodes connected to filtered nodes
    if (focusMode.visualization.hideUnrelated) {
      const connectedNodeIds = new Set(filteredNodes.map(n => n.id));
      
      // Add directly connected nodes
      graph.edges.forEach(edge => {
        if (connectedNodeIds.has(edge.source)) connectedNodeIds.add(edge.target);
        if (connectedNodeIds.has(edge.target)) connectedNodeIds.add(edge.source);
      });
      
      filteredNodes = graph.nodes.filter(node => connectedNodeIds.has(node.id));
    }

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = graph.edges.filter(edge => 
      filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );

    return {
      ...graph,
      nodes: filteredNodes,
      edges: filteredEdges
    };
  }

  private async extractNodes(files: Array<{ name: string; content: string; type: string }>): Promise<CodeNode[]> {
    const nodes: CodeNode[] = [];

    for (const file of files) {
      // Add file node
      nodes.push({
        id: `file:${file.name}`,
        name: file.name,
        type: 'file',
        path: file.name,
        size: file.content.split('\n').length,
        importance: this.calculateImportance(file),
        dependencies: [],
        dependents: [],
        metadata: {
          language: this.detectLanguage(file.name),
          lastModified: new Date(),
          complexity: this.calculateComplexity(file.content)
        }
      });

      // Extract functions, classes, etc. (simplified)
      const functions = this.extractFunctions(file.content, file.name);
      const classes = this.extractClasses(file.content, file.name);
      
      nodes.push(...functions, ...classes);
    }

    return nodes;
  }

  private async extractEdges(files: Array<{ name: string; content: string; type: string }>, nodes: CodeNode[]): Promise<CodeEdge[]> {
    const edges: CodeEdge[] = [];

    for (const file of files) {
      // Extract imports
      const imports = this.extractImports(file.content);
      imports.forEach(importPath => {
        const sourceId = `file:${file.name}`;
        const targetId = `file:${importPath}`;
        
        if (nodes.some(n => n.id === targetId)) {
          edges.push({
            id: `${sourceId}->${targetId}`,
            source: sourceId,
            target: targetId,
            type: 'import',
            strength: 0.8,
            bidirectional: false,
            metadata: { critical: true }
          });
        }
      });

      // Extract function calls (simplified)
      const calls = this.extractFunctionCalls(file.content);
      calls.forEach(call => {
        const sourceId = `file:${file.name}`;
        const targetNode = nodes.find(n => n.name === call && n.type === 'function');
        
        if (targetNode) {
          edges.push({
            id: `${sourceId}->${targetNode.id}`,
            source: sourceId,
            target: targetNode.id,
            type: 'call',
            strength: 0.6,
            bidirectional: false,
            metadata: { frequency: 1 }
          });
        }
      });
    }

    return edges;
  }

  private identifyClusters(nodes: CodeNode[], edges: CodeEdge[]): CodeCluster[] {
    const clusters: CodeCluster[] = [];
    
    // Group by directory structure
    const directoryGroups = new Map<string, string[]>();
    
    nodes.filter(n => n.type === 'file').forEach(node => {
      const dir = node.path.split('/').slice(0, -1).join('/') || 'root';
      if (!directoryGroups.has(dir)) {
        directoryGroups.set(dir, []);
      }
      directoryGroups.get(dir)!.push(node.id);
    });

    directoryGroups.forEach((nodeIds, dir) => {
      clusters.push({
        id: `cluster:${dir}`,
        name: dir === 'root' ? 'Root' : dir,
        type: 'module',
        nodes: nodeIds,
        color: this.generateClusterColor(dir)
      });
    });

    return clusters;
  }

  private calculateMetrics(nodes: CodeNode[], edges: CodeEdge[]): DependencyGraph['metrics'] {
    const cyclicDependencies = this.findCyclicDependencies().length;
    const orphanNodes = nodes.filter(n => 
      !edges.some(e => e.source === n.id || e.target === n.id)
    ).length;

    const complexity = nodes.reduce((sum, node) => sum + (node.metadata.complexity || 0), 0);
    const maintainabilityIndex = Math.max(0, 100 - (complexity / nodes.length));

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      cyclicDependencies,
      orphanNodes,
      complexity,
      maintainabilityIndex
    };
  }

  private findCyclicDependencies(): string[] {
    // Simplified cycle detection
    if (!this.dependencyGraph) return [];
    
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cyclicNodes = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const edges = this.dependencyGraph!.edges.filter(e => e.source === nodeId);
      for (const edge of edges) {
        if (!visited.has(edge.target)) {
          if (dfs(edge.target)) {
            cyclicNodes.add(nodeId);
            return true;
          }
        } else if (recursionStack.has(edge.target)) {
          cyclicNodes.add(nodeId);
          cyclicNodes.add(edge.target);
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    this.dependencyGraph.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    });

    return Array.from(cyclicNodes);
  }

  private detectSingletonPattern(): string[] {
    if (!this.dependencyGraph) return [];
    
    return this.dependencyGraph.nodes
      .filter(node => 
        node.type === 'class' && 
        node.name.toLowerCase().includes('singleton')
      )
      .map(node => node.id);
  }

  private detectGodClasses(): string[] {
    if (!this.dependencyGraph) return [];
    
    return this.dependencyGraph.nodes
      .filter(node => 
        node.type === 'class' && 
        (node.metadata.complexity || 0) > 50 &&
        node.dependencies.length > 10
      )
      .map(node => node.id);
  }

  private calculateNodeSize(node: CodeNode): number {
    const baseSize = 10;
    const complexityMultiplier = (node.metadata.complexity || 1) / 10;
    const importanceMultiplier = {
      'critical': 2,
      'important': 1.5,
      'moderate': 1,
      'low': 0.7
    }[node.importance];

    return baseSize * complexityMultiplier * importanceMultiplier;
  }

  private getNodeColor(node: CodeNode): string {
    const colors = {
      'file': '#3B82F6',
      'function': '#10B981',
      'class': '#F59E0B',
      'interface': '#8B5CF6',
      'variable': '#6B7280',
      'import': '#EF4444',
      'export': '#06B6D4'
    };
    return colors[node.type] || '#6B7280';
  }

  private getEdgeColor(edge: CodeEdge): string {
    const colors = {
      'import': '#EF4444',
      'call': '#10B981',
      'inheritance': '#8B5CF6',
      'composition': '#F59E0B',
      'reference': '#6B7280'
    };
    return colors[edge.type] || '#6B7280';
  }

  private calculateImportance(file: { name: string; content: string; type: string }): 'critical' | 'important' | 'moderate' | 'low' {
    const name = file.name.toLowerCase();
    
    if (name.includes('index') || name.includes('main') || name.includes('app')) return 'critical';
    if (name.includes('config') || name.includes('util') || name.includes('service')) return 'important';
    if (name.includes('component') || name.includes('hook')) return 'moderate';
    return 'low';
  }

  private detectLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'css': 'css',
      'html': 'html'
    };
    return langMap[ext || ''] || 'text';
  }

  private calculateComplexity(content: string): number {
    // Simplified complexity calculation
    const lines = content.split('\n').length;
    const functions = (content.match(/function|=>/g) || []).length;
    const conditionals = (content.match(/if|else|switch|case|\?/g) || []).length;
    const loops = (content.match(/for|while|forEach|map|filter/g) || []).length;
    
    return Math.round((lines * 0.1) + (functions * 2) + (conditionals * 1.5) + (loops * 1.5));
  }

  private extractFunctions(content: string, fileName: string): CodeNode[] {
    // Simplified function extraction
    const functions: CodeNode[] = [];
    const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*=>\s*{|async\s*\([^)]*\)\s*=>))/g;
    
    let match;
    let lineNumber = 1;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1] || match[2];
      if (functionName) {
        functions.push({
          id: `function:${fileName}:${functionName}`,
          name: functionName,
          type: 'function',
          path: fileName,
          line: lineNumber,
          size: 10, // Simplified
          importance: 'moderate',
          dependencies: [],
          dependents: [],
          metadata: {
            language: this.detectLanguage(fileName),
            lastModified: new Date(),
            complexity: 5 // Simplified
          }
        });
      }
      
      // Count lines up to this match
      lineNumber += (content.substring(0, match.index).match(/\n/g) || []).length;
    }
    
    return functions;
  }

  private extractClasses(content: string, fileName: string): CodeNode[] {
    // Simplified class extraction
    const classes: CodeNode[] = [];
    const classRegex = /class\s+(\w+)/g;
    
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      classes.push({
        id: `class:${fileName}:${className}`,
        name: className,
        type: 'class',
        path: fileName,
        size: 20, // Simplified
        importance: 'important',
        dependencies: [],
        dependents: [],
        metadata: {
          language: this.detectLanguage(fileName),
          lastModified: new Date(),
          complexity: 15 // Simplified
        }
      });
    }
    
    return classes;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  private extractFunctionCalls(content: string): string[] {
    // Simplified function call extraction
    const calls: string[] = [];
    const callRegex = /(\w+)\s*\(/g;
    
    let match;
    while ((match = callRegex.exec(content)) !== null) {
      calls.push(match[1]);
    }
    
    return calls;
  }

  private generateClusterColor(name: string): string {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  private getDefaultLayout(): VisualizationLayout {
    return {
      id: 'force-default',
      name: 'Force-Directed',
      type: 'force',
      settings: {
        spacing: 100,
        grouping: 'type'
      }
    };
  }

  private initializeDefaultFocusModes(): void {
    this.focusModes = [
      {
        id: 'overview',
        name: 'Overview',
        description: 'High-level view of the entire codebase',
        filters: {
          nodeTypes: ['file', 'class'],
          importance: ['critical', 'important']
        },
        visualization: {
          hideUnrelated: false,
          emphasizeConnections: false,
          groupByClusters: true,
          showMetrics: true
        }
      },
      {
        id: 'detailed',
        name: 'Detailed',
        description: 'Detailed view including functions and variables',
        filters: {
          nodeTypes: ['file', 'function', 'class', 'interface'],
          importance: ['critical', 'important', 'moderate']
        },
        visualization: {
          hideUnrelated: false,
          emphasizeConnections: true,
          groupByClusters: false,
          showMetrics: false
        }
      },
      {
        id: 'critical-only',
        name: 'Critical Only',
        description: 'Focus on critical components only',
        filters: {
          nodeTypes: ['file', 'function', 'class'],
          importance: ['critical']
        },
        visualization: {
          hideUnrelated: true,
          emphasizeConnections: true,
          groupByClusters: false,
          showMetrics: true
        }
      }
    ];
  }

  // Public methods for external use
  getFocusModes(): FocusMode[] {
    return [...this.focusModes];
  }

  setCurrentFocusMode(focusModeId: string | null): void {
    this.currentFocusMode = focusModeId 
      ? this.focusModes.find(fm => fm.id === focusModeId) || null
      : null;
  }

  getCurrentFocusMode(): FocusMode | null {
    return this.currentFocusMode;
  }

  getDetectedPatterns(): CodePattern[] {
    return [...this.detectedPatterns];
  }

  setLayout(layout: VisualizationLayout): void {
    this.currentLayout = layout;
  }

  getAvailableLayouts(): VisualizationLayout[] {
    return [
      this.getDefaultLayout(),
      {
        id: 'hierarchical',
        name: 'Hierarchical',
        type: 'hierarchical',
        settings: {
          spacing: 80,
          grouping: 'cluster',
          direction: 'vertical'
        }
      },
      {
        id: 'circular',
        name: 'Circular',
        type: 'circular',
        settings: {
          spacing: 120,
          grouping: 'importance'
        }
      }
    ];
  }

  // Method to get nodes for method body folding
  getMethodFoldingConfiguration(): {
    foldByDefault: boolean;
    foldingRules: Array<{
      pattern: string;
      minLines?: number;
      maxComplexity?: number;
      importance?: string[];
    }>;
  } {
    return {
      foldByDefault: true,
      foldingRules: [
        {
          pattern: 'function|method',
          minLines: 5,
          maxComplexity: 20,
          importance: ['low', 'moderate']
        },
        {
          pattern: 'class',
          minLines: 10,
          importance: ['low']
        },
        {
          pattern: 'interface',
          minLines: 3,
          importance: ['low', 'moderate']
        }
      ]
    };
  }

  // Get focus recommendations based on current context
  getContextualFocusMode(context: {
    currentFile?: string;
    selectedNodes?: string[];
    taskType?: string;
  }): FocusMode | null {
    const recommendations = this.getAIFocusRecommendations({
      currentFile: context.currentFile,
      recentFiles: context.selectedNodes ? context.selectedNodes : undefined,
      taskType: context.taskType as "feature" | "debugging" | "refactoring" | "review" | undefined
    });
    return recommendations.length > 0 ? recommendations[0] : null;
  }
}
