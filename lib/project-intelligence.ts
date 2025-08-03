import { FileContent } from '@/hooks/use-code-builder';
import { AIContextAnalyzer, ProjectContext, CodePattern } from './ai-context-analyzer';

export interface ProjectGraph {
  nodes: ProjectNode[];
  edges: ProjectEdge[];
  clusters: ProjectCluster[];
}

export interface ProjectNode {
  id: string;
  type: 'file' | 'function' | 'class' | 'component' | 'module';
  name: string;
  file: string;
  line?: number;
  dependencies: string[];
  exports: string[];
  imports: string[];
  complexity: number;
  importance: 'critical' | 'high' | 'medium' | 'low';
  metadata: Record<string, any>;
}

export interface ProjectEdge {
  from: string;
  to: string;
  type: 'imports' | 'calls' | 'extends' | 'implements' | 'uses';
  weight: number;
}

export interface ProjectCluster {
  id: string;
  name: string;
  type: 'feature' | 'layer' | 'domain' | 'utility';
  nodes: string[];
  description: string;
}

export interface CrossFileContext {
  relatedFiles: string[];
  sharedSymbols: string[];
  dependencies: string[];
  potentialIssues: string[];
  suggestions: string[];
}

export interface ArchitecturalInsight {
  type: 'pattern' | 'antipattern' | 'opportunity' | 'risk';
  title: string;
  description: string;
  files: string[];
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
  autoFixable: boolean;
}

export class ProjectIntelligence {
  private files: FileContent[] = [];
  private contextAnalyzer: AIContextAnalyzer;
  private projectGraph: ProjectGraph | null = null;
  private crossFileCache: Map<string, CrossFileContext> = new Map();
  private lastAnalysis: Date | null = null;

  constructor(files: FileContent[]) {
    this.files = files;
    this.contextAnalyzer = new AIContextAnalyzer(files);
    this.buildProjectGraph();
  }

  updateFiles(files: FileContent[]): void {
    this.files = files;
    this.contextAnalyzer.updateFiles(files);
    this.crossFileCache.clear();
    this.buildProjectGraph();
    this.lastAnalysis = new Date();
  }

  // Build comprehensive project graph
  private buildProjectGraph(): void {
    const nodes: ProjectNode[] = [];
    const edges: ProjectEdge[] = [];
    const clusters: ProjectCluster[] = [];

    // Analyze each file
    this.files.forEach(file => {
      const fileNode = this.createFileNode(file);
      nodes.push(fileNode);

      // Extract functions, classes, components
      const codeElements = this.extractCodeElements(file);
      nodes.push(...codeElements);

      // Create edges for dependencies
      const fileEdges = this.createFileEdges(file, codeElements);
      edges.push(...fileEdges);
    });

    // Identify clusters
    const identifiedClusters = this.identifyClusters(nodes, edges);
    clusters.push(...identifiedClusters);

    this.projectGraph = { nodes, edges, clusters };
  }

  private createFileNode(file: FileContent): ProjectNode {
    const imports = this.extractImports(file.content);
    const exports = this.extractExports(file.content);
    const complexity = this.calculateFileComplexity(file.content);
    const importance = this.assessFileImportance(file, imports, exports);

    return {
      id: `file:${file.name}`,
      type: 'file',
      name: file.name,
      file: file.name,
      dependencies: imports,
      exports,
      imports,
      complexity,
      importance,
      metadata: {
        size: file.content.length,
        lines: file.content.split('\n').length,
        language: this.getLanguageFromFileName(file.name)
      }
    };
  }

  private extractCodeElements(file: FileContent): ProjectNode[] {
    const elements: ProjectNode[] = [];
    const lines = file.content.split('\n');

    lines.forEach((line, index) => {
      // Extract functions
      const functionMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (functionMatch) {
        elements.push({
          id: `function:${file.name}:${functionMatch[1]}`,
          type: 'function',
          name: functionMatch[1],
          file: file.name,
          line: index + 1,
          dependencies: this.extractLineDependencies(line),
          exports: line.includes('export') ? [functionMatch[1]] : [],
          imports: [],
          complexity: this.calculateFunctionComplexity(this.extractFunctionBody(lines, index)),
          importance: 'medium',
          metadata: { async: line.includes('async') }
        });
      }

      // Extract classes
      const classMatch = line.match(/(?:export\s+)?class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (classMatch) {
        elements.push({
          id: `class:${file.name}:${classMatch[1]}`,
          type: 'class',
          name: classMatch[1],
          file: file.name,
          line: index + 1,
          dependencies: this.extractLineDependencies(line),
          exports: line.includes('export') ? [classMatch[1]] : [],
          imports: [],
          complexity: this.calculateClassComplexity(this.extractClassBody(lines, index)),
          importance: 'high',
          metadata: {}
        });
      }

      // Extract React components
      const componentMatch = line.match(/(?:export\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9_$]*)/);
      if (componentMatch && (file.name.endsWith('.jsx') || file.name.endsWith('.tsx'))) {
        elements.push({
          id: `component:${file.name}:${componentMatch[1]}`,
          type: 'component',
          name: componentMatch[1],
          file: file.name,
          line: index + 1,
          dependencies: this.extractLineDependencies(line),
          exports: line.includes('export') ? [componentMatch[1]] : [],
          imports: [],
          complexity: this.calculateComponentComplexity(this.extractComponentBody(lines, index)),
          importance: 'high',
          metadata: { framework: 'React' }
        });
      }
    });

    return elements;
  }

  private createFileEdges(file: FileContent, elements: ProjectNode[]): ProjectEdge[] {
    const edges: ProjectEdge[] = [];
    const imports = this.extractImports(file.content);

    // Create import edges
    imports.forEach(importPath => {
      const targetFile = this.resolveImportPath(importPath, file.name);
      if (targetFile) {
        edges.push({
          from: `file:${file.name}`,
          to: `file:${targetFile}`,
          type: 'imports',
          weight: 1
        });
      }
    });

    // Create internal edges between elements
    elements.forEach(element => {
      element.dependencies.forEach(dep => {
        const targetElement = elements.find(e => e.name === dep);
        if (targetElement) {
          edges.push({
            from: element.id,
            to: targetElement.id,
            type: 'uses',
            weight: 1
          });
        }
      });
    });

    return edges;
  }

  private identifyClusters(nodes: ProjectNode[], edges: ProjectEdge[]): ProjectCluster[] {
    const clusters: ProjectCluster[] = [];

    // Group by directory structure
    const directoryGroups = this.groupByDirectory(nodes);
    Object.entries(directoryGroups).forEach(([dir, nodeIds]) => {
      if (nodeIds.length > 1) {
        clusters.push({
          id: `dir:${dir}`,
          name: dir || 'root',
          type: 'layer',
          nodes: nodeIds,
          description: `Files in ${dir || 'root'} directory`
        });
      }
    });

    // Group by functionality
    const functionalGroups = this.groupByFunctionality(nodes, edges);
    functionalGroups.forEach(group => {
      clusters.push(group);
    });

    return clusters;
  }

  // Get cross-file context for a specific file
  getCrossFileContext(fileName: string): CrossFileContext {
    if (this.crossFileCache.has(fileName)) {
      return this.crossFileCache.get(fileName)!;
    }

    const context = this.analyzeCrossFileContext(fileName);
    this.crossFileCache.set(fileName, context);
    return context;
  }

  private analyzeCrossFileContext(fileName: string): CrossFileContext {
    const file = this.files.find(f => f.name === fileName);
    if (!file) {
      return { relatedFiles: [], sharedSymbols: [], dependencies: [], potentialIssues: [], suggestions: [] };
    }

    const relatedFiles = this.findRelatedFiles(fileName);
    const sharedSymbols = this.findSharedSymbols(fileName);
    const dependencies = this.extractImports(file.content);
    const potentialIssues = this.identifyPotentialIssues(fileName);
    const suggestions = this.generateSuggestions(fileName);

    return {
      relatedFiles,
      sharedSymbols,
      dependencies,
      potentialIssues,
      suggestions
    };
  }

  private findRelatedFiles(fileName: string): string[] {
    if (!this.projectGraph) return [];

    const fileNode = this.projectGraph.nodes.find(n => n.id === `file:${fileName}`);
    if (!fileNode) return [];

    const related = new Set<string>();

    // Find files that import this file
    this.projectGraph.edges
      .filter(e => e.to === fileNode.id && e.type === 'imports')
      .forEach(e => {
        const fromFile = e.from.replace('file:', '');
        related.add(fromFile);
      });

    // Find files that this file imports
    this.projectGraph.edges
      .filter(e => e.from === fileNode.id && e.type === 'imports')
      .forEach(e => {
        const toFile = e.to.replace('file:', '');
        related.add(toFile);
      });

    // Find files in the same cluster
    this.projectGraph.clusters.forEach(cluster => {
      if (cluster.nodes.includes(fileNode.id)) {
        cluster.nodes.forEach(nodeId => {
          if (nodeId.startsWith('file:') && nodeId !== fileNode.id) {
            related.add(nodeId.replace('file:', ''));
          }
        });
      }
    });

    return Array.from(related);
  }

  private findSharedSymbols(fileName: string): string[] {
    const file = this.files.find(f => f.name === fileName);
    if (!file) return [];

    const exports = this.extractExports(file.content);
    const sharedSymbols: string[] = [];

    // Find which exports are used by other files
    this.files.forEach(otherFile => {
      if (otherFile.name === fileName) return;

      const imports = this.extractImports(otherFile.content);
      const importedFromThis = imports.filter(imp => 
        this.resolveImportPath(imp, otherFile.name) === fileName
      );

      if (importedFromThis.length > 0) {
        // Extract specific imported symbols
        const importStatements = this.extractImportStatements(otherFile.content);
        importStatements.forEach(statement => {
          if (statement.from === fileName || this.resolveImportPath(statement.from, otherFile.name) === fileName) {
            sharedSymbols.push(...statement.imports);
          }
        });
      }
    });

    return [...new Set(sharedSymbols)];
  }

  // Generate architectural insights
  getArchitecturalInsights(): ArchitecturalInsight[] {
    const insights: ArchitecturalInsight[] = [];

    if (!this.projectGraph) return insights;

    // Detect circular dependencies
    const circularDeps = this.detectCircularDependencies();
    if (circularDeps.length > 0) {
      insights.push({
        type: 'antipattern',
        title: 'Circular Dependencies Detected',
        description: `Found ${circularDeps.length} circular dependency chains that could cause issues`,
        files: circularDeps.flat(),
        severity: 'high',
        suggestion: 'Refactor code to break circular dependencies by extracting shared logic',
        autoFixable: false
      });
    }

    // Detect large files
    const largeFiles = this.projectGraph.nodes
      .filter(n => n.type === 'file' && n.metadata.lines > 500)
      .map(n => n.name);

    if (largeFiles.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Large Files Detected',
        description: `${largeFiles.length} files exceed 500 lines and could benefit from splitting`,
        files: largeFiles,
        severity: 'medium',
        suggestion: 'Consider breaking large files into smaller, more focused modules',
        autoFixable: false
      });
    }

    // Detect unused exports
    const unusedExports = this.detectUnusedExports();
    if (unusedExports.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Unused Exports',
        description: `Found ${unusedExports.length} exported symbols that are not used`,
        files: unusedExports.map(e => e.file),
        severity: 'low',
        suggestion: 'Remove unused exports to reduce bundle size and improve maintainability',
        autoFixable: true
      });
    }

    // Detect missing error handling
    const filesWithoutErrorHandling = this.detectMissingErrorHandling();
    if (filesWithoutErrorHandling.length > 0) {
      insights.push({
        type: 'risk',
        title: 'Missing Error Handling',
        description: `${filesWithoutErrorHandling.length} files lack proper error handling`,
        files: filesWithoutErrorHandling,
        severity: 'medium',
        suggestion: 'Add try-catch blocks and error boundaries for better reliability',
        autoFixable: false
      });
    }

    return insights;
  }

  // Helper methods
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:default\s+)?(?:function\s+|const\s+|class\s+|interface\s+|type\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  private extractImportStatements(content: string): Array<{ imports: string[]; from: string }> {
    const statements: Array<{ imports: string[]; from: string }> = [];
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const imports = match[1].split(',').map(s => s.trim());
      statements.push({ imports, from: match[2] });
    }

    return statements;
  }

  private resolveImportPath(importPath: string, fromFile: string): string | null {
    // Simple resolution - in production, this would be more sophisticated
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      // Relative import
      const fromDir = fromFile.split('/').slice(0, -1).join('/');
      const resolved = this.resolvePath(fromDir, importPath);
      
      // Try different extensions
      const extensions = ['.js', '.ts', '.jsx', '.tsx'];
      for (const ext of extensions) {
        const withExt = resolved + ext;
        if (this.files.some(f => f.name === withExt)) {
          return withExt;
        }
      }
    }
    
    return null;
  }

  private resolvePath(base: string, relative: string): string {
    const parts = base.split('/').concat(relative.split('/'));
    const resolved: string[] = [];
    
    for (const part of parts) {
      if (part === '..') {
        resolved.pop();
      } else if (part !== '.' && part !== '') {
        resolved.push(part);
      }
    }
    
    return resolved.join('/');
  }

  private calculateFileComplexity(content: string): number {
    // Simple complexity calculation
    const lines = content.split('\n').length;
    const functions = (content.match(/function\s+/g) || []).length;
    const classes = (content.match(/class\s+/g) || []).length;
    const conditionals = (content.match(/if\s*\(|switch\s*\(|while\s*\(|for\s*\(/g) || []).length;
    
    return Math.round((lines * 0.1) + (functions * 2) + (classes * 3) + (conditionals * 1.5));
  }

  private assessFileImportance(file: FileContent, imports: string[], exports: string[]): 'critical' | 'high' | 'medium' | 'low' {
    const isMainFile = ['index', 'main', 'app'].some(name => file.name.includes(name));
    const hasManyExports = exports.length > 5;
    const hasManyImports = imports.length > 10;
    const isLarge = file.content.length > 5000;

    if (isMainFile) return 'critical';
    if (hasManyExports && hasManyImports) return 'high';
    if (hasManyExports || isLarge) return 'medium';
    return 'low';
  }

  private getLanguageFromFileName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json'
    };
    return langMap[ext || ''] || 'text';
  }

  // Additional helper methods would be implemented here...
  private extractLineDependencies(line: string): string[] { return []; }
  private extractFunctionBody(lines: string[], startIndex: number): string { return ''; }
  private extractClassBody(lines: string[], startIndex: number): string { return ''; }
  private extractComponentBody(lines: string[], startIndex: number): string { return ''; }
  private calculateFunctionComplexity(body: string): number { return 1; }
  private calculateClassComplexity(body: string): number { return 1; }
  private calculateComponentComplexity(body: string): number { return 1; }
  private groupByDirectory(nodes: ProjectNode[]): Record<string, string[]> { return {}; }
  private groupByFunctionality(nodes: ProjectNode[], edges: ProjectEdge[]): ProjectCluster[] { return []; }
  private identifyPotentialIssues(fileName: string): string[] { return []; }
  private generateSuggestions(fileName: string): string[] { return []; }
  private detectCircularDependencies(): string[][] { return []; }
  private detectUnusedExports(): Array<{ file: string; export: string }> { return []; }
  private detectMissingErrorHandling(): string[] { return []; }
}
