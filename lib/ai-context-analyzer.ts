import { FileContent } from '@/hooks/use-code-builder';

export interface ProjectContext {
  projectType: 'react' | 'vanilla-js' | 'pwa' | 'node' | 'unknown';
  framework: string | null;
  dependencies: string[];
  fileStructure: FileStructureNode[];
  codePatterns: CodePattern[];
  complexity: 'simple' | 'medium' | 'complex';
  mainFiles: string[];
  testFiles: string[];
  configFiles: string[];
}

export interface FileStructureNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileStructureNode[];
  language?: string;
  size: number;
  importance: 'high' | 'medium' | 'low';
}

export interface CodePattern {
  type: 'component' | 'function' | 'class' | 'hook' | 'api' | 'config';
  name: string;
  file: string;
  line: number;
  description: string;
  dependencies: string[];
  exports: string[];
}

export interface CodeQualityIssue {
  type: 'error' | 'warning' | 'suggestion';
  severity: 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line: number;
  column?: number;
  rule: string;
  fixable: boolean;
  suggestion?: string;
}

export class AIContextAnalyzer {
  private files: FileContent[] = [];
  private context: ProjectContext | null = null;

  constructor(files: FileContent[]) {
    this.files = files;
    this.context = this.analyzeProject();
  }

  private analyzeProject(): ProjectContext {
    const fileStructure = this.buildFileStructure();
    const projectType = this.detectProjectType();
    const framework = this.detectFramework();
    const dependencies = this.extractDependencies();
    const codePatterns = this.analyzeCodePatterns();
    const complexity = this.assessComplexity();

    return {
      projectType,
      framework,
      dependencies,
      fileStructure,
      codePatterns,
      complexity,
      mainFiles: this.identifyMainFiles(),
      testFiles: this.identifyTestFiles(),
      configFiles: this.identifyConfigFiles()
    };
  }

  private buildFileStructure(): FileStructureNode[] {
    const structure: FileStructureNode[] = [];
    
    for (const file of this.files) {
      const pathParts = file.name.split('/');
      let current = structure;
      
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const isFile = i === pathParts.length - 1;
        
        let existing = current.find(node => node.name === part);
        
        if (!existing) {
          existing = {
            name: part,
            type: isFile ? 'file' : 'folder',
            path: pathParts.slice(0, i + 1).join('/'),
            children: isFile ? undefined : [],
            language: isFile ? this.getLanguageFromExtension(part) : undefined,
            size: isFile ? file.content.length : 0,
            importance: this.assessFileImportance(file.name, file.content)
          };
          current.push(existing);
        }
        
        if (!isFile && existing.children) {
          current = existing.children;
        }
      }
    }
    
    return structure;
  }

  private detectProjectType(): ProjectContext['projectType'] {
    const hasPackageJson = this.files.some(f => f.name === 'package.json');
    const hasManifest = this.files.some(f => f.name === 'manifest.json');
    const hasServiceWorker = this.files.some(f => f.name.includes('sw.js') || f.name.includes('service-worker'));
    const hasReactFiles = this.files.some(f => f.name.endsWith('.jsx') || f.name.endsWith('.tsx'));
    const hasNodeFiles = this.files.some(f => f.name === 'server.js' || f.name === 'app.js');

    if (hasManifest && hasServiceWorker) return 'pwa';
    if (hasReactFiles) return 'react';
    if (hasNodeFiles && hasPackageJson) return 'node';
    if (hasPackageJson) return 'vanilla-js';
    
    return 'unknown';
  }

  private detectFramework(): string | null {
    const packageJson = this.files.find(f => f.name === 'package.json');
    if (!packageJson) return null;

    try {
      const pkg = JSON.parse(packageJson.content);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (deps.react) return 'React';
      if (deps.vue) return 'Vue';
      if (deps.angular) return 'Angular';
      if (deps.svelte) return 'Svelte';
      if (deps.next) return 'Next.js';
      if (deps.nuxt) return 'Nuxt.js';
      if (deps.express) return 'Express';
      
    } catch (error) {
      console.error('Failed to parse package.json:', error);
    }
    
    return null;
  }

  private extractDependencies(): string[] {
    const packageJson = this.files.find(f => f.name === 'package.json');
    if (!packageJson) return [];

    try {
      const pkg = JSON.parse(packageJson.content);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      return Object.keys(deps);
    } catch (error) {
      return [];
    }
  }

  private analyzeCodePatterns(): CodePattern[] {
    const patterns: CodePattern[] = [];
    
    for (const file of this.files) {
      if (file.name.endsWith('.js') || file.name.endsWith('.ts') || 
          file.name.endsWith('.jsx') || file.name.endsWith('.tsx')) {
        patterns.push(...this.extractJavaScriptPatterns(file));
      }
    }
    
    return patterns;
  }

  private extractJavaScriptPatterns(file: FileContent): CodePattern[] {
    const patterns: CodePattern[] = [];
    const lines = file.content.split('\n');
    
    lines.forEach((line, index) => {
      // React components
      if (line.match(/^(export\s+)?(default\s+)?function\s+[A-Z]\w*|^(export\s+)?(default\s+)?const\s+[A-Z]\w*\s*=.*=>/)) {
        patterns.push({
          type: 'component',
          name: this.extractFunctionName(line) || 'Unknown',
          file: file.name,
          line: index + 1,
          description: 'React component',
          dependencies: this.extractImports(file.content),
          exports: this.extractExports(file.content)
        });
      }
      
      // Custom hooks
      if (line.match(/^(export\s+)?(default\s+)?function\s+use[A-Z]\w*|^(export\s+)?(default\s+)?const\s+use[A-Z]\w*\s*=/)) {
        patterns.push({
          type: 'hook',
          name: this.extractFunctionName(line) || 'Unknown',
          file: file.name,
          line: index + 1,
          description: 'Custom React hook',
          dependencies: this.extractImports(file.content),
          exports: this.extractExports(file.content)
        });
      }
      
      // API endpoints
      if (line.match(/\.(get|post|put|delete|patch)\s*\(/)) {
        patterns.push({
          type: 'api',
          name: this.extractApiEndpoint(line) || 'Unknown',
          file: file.name,
          line: index + 1,
          description: 'API endpoint',
          dependencies: [],
          exports: []
        });
      }
    });
    
    return patterns;
  }

  private assessComplexity(): ProjectContext['complexity'] {
    const fileCount = this.files.length;
    const totalLines = this.files.reduce((sum, file) => sum + file.content.split('\n').length, 0);
    const hasComplexPatterns = this.context?.codePatterns.length || 0 > 10;
    
    if (fileCount > 20 || totalLines > 5000 || hasComplexPatterns) return 'complex';
    if (fileCount > 5 || totalLines > 1000) return 'medium';
    return 'simple';
  }

  private identifyMainFiles(): string[] {
    const mainFiles = [];
    
    // Common main files
    const candidates = ['index.html', 'index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts'];
    for (const candidate of candidates) {
      if (this.files.some(f => f.name === candidate)) {
        mainFiles.push(candidate);
      }
    }
    
    return mainFiles;
  }

  private identifyTestFiles(): string[] {
    return this.files
      .filter(f => f.name.includes('.test.') || f.name.includes('.spec.') || f.name.includes('__tests__'))
      .map(f => f.name);
  }

  private identifyConfigFiles(): string[] {
    const configPatterns = [
      'package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.js',
      'tailwind.config.js', 'next.config.js', '.eslintrc', '.prettierrc',
      'manifest.json', 'sw.js', 'service-worker.js'
    ];
    
    return this.files
      .filter(f => configPatterns.some(pattern => f.name.includes(pattern)))
      .map(f => f.name);
  }

  // Helper methods
  private getLanguageFromExtension(filename: string): string | undefined {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown'
    };
    return langMap[ext || ''];
  }

  private assessFileImportance(filename: string, content: string): 'high' | 'medium' | 'low' {
    const mainFiles = ['index.html', 'index.js', 'main.js', 'app.js', 'manifest.json'];
    if (mainFiles.includes(filename)) return 'high';
    
    if (filename.includes('config') || filename.includes('package.json')) return 'high';
    if (content.length > 1000) return 'medium';
    
    return 'low';
  }

  private extractFunctionName(line: string): string | null {
    const match = line.match(/(?:function\s+|const\s+)(\w+)/);
    return match ? match[1] : null;
  }

  private extractImports(content: string): string[] {
    const imports = [];
    const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  private extractExports(content: string): string[] {
    const exports = [];
    const exportRegex = /export\s+(?:default\s+)?(?:function\s+|const\s+|class\s+)?(\w+)/g;
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  }

  private extractApiEndpoint(line: string): string | null {
    const match = line.match(/['"`]([^'"`]*(?:api|endpoint)[^'"`]*)['"]/);
    return match ? match[1] : null;
  }

  // Public methods
  public getContext(): ProjectContext | null {
    return this.context;
  }

  public updateFiles(files: FileContent[]): void {
    this.files = files;
    this.context = this.analyzeProject();
  }

  public generateContextPrompt(): string {
    if (!this.context) return '';

    return `
PROJECT CONTEXT:
- Type: ${this.context.projectType}
- Framework: ${this.context.framework || 'None'}
- Complexity: ${this.context.complexity}
- Files: ${this.files.length} total
- Main files: ${this.context.mainFiles.join(', ')}
- Dependencies: ${this.context.dependencies.slice(0, 10).join(', ')}${this.context.dependencies.length > 10 ? '...' : ''}

CODE PATTERNS FOUND:
${this.context.codePatterns.slice(0, 5).map(pattern => 
  `- ${pattern.type}: ${pattern.name} in ${pattern.file}`
).join('\n')}

Please provide suggestions that are contextually relevant to this ${this.context.projectType} project using ${this.context.framework || 'vanilla JavaScript'}.
    `.trim();
  }

  public analyzeCodeQuality(file: FileContent): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];
    const lines = file.content.split('\n');

    lines.forEach((line, index) => {
      // Check for common issues
      if (line.includes('console.log') && !file.name.includes('test')) {
        issues.push({
          type: 'warning',
          severity: 'low',
          message: 'Console.log statement found in production code',
          file: file.name,
          line: index + 1,
          rule: 'no-console',
          fixable: true,
          suggestion: 'Remove console.log or replace with proper logging'
        });
      }

      if (line.includes('var ')) {
        issues.push({
          type: 'suggestion',
          severity: 'medium',
          message: 'Use const or let instead of var',
          file: file.name,
          line: index + 1,
          rule: 'no-var',
          fixable: true,
          suggestion: 'Replace var with const or let'
        });
      }

      if (line.length > 120) {
        issues.push({
          type: 'warning',
          severity: 'low',
          message: 'Line too long (>120 characters)',
          file: file.name,
          line: index + 1,
          rule: 'max-len',
          fixable: false,
          suggestion: 'Break line into multiple lines'
        });
      }

      // Check for missing semicolons in JS/TS files
      if ((file.name.endsWith('.js') || file.name.endsWith('.ts')) &&
          line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') &&
          !line.trim().endsWith('}') && !line.trim().startsWith('//')) {
        issues.push({
          type: 'suggestion',
          severity: 'low',
          message: 'Missing semicolon',
          file: file.name,
          line: index + 1,
          rule: 'semi',
          fixable: true,
          suggestion: 'Add semicolon at end of statement'
        });
      }
    });

    return issues;
  }

  public suggestRefactoring(file: FileContent): Array<{
    type: 'extract-function' | 'extract-component' | 'simplify' | 'optimize';
    description: string;
    line: number;
    suggestion: string;
  }> {
    const suggestions = [];
    const lines = file.content.split('\n');

    // Look for long functions that could be extracted
    let functionStart = -1;
    let braceCount = 0;

    lines.forEach((line, index) => {
      if (line.includes('function ') || line.includes('const ') && line.includes('=>')) {
        functionStart = index;
        braceCount = 0;
      }

      if (line.includes('{')) braceCount++;
      if (line.includes('}')) braceCount--;

      if (functionStart >= 0 && braceCount === 0 && index - functionStart > 20) {
        suggestions.push({
          type: 'extract-function',
          description: 'Long function detected',
          line: functionStart + 1,
          suggestion: 'Consider breaking this function into smaller, more focused functions'
        });
        functionStart = -1;
      }
    });

    return suggestions;
  }
}
