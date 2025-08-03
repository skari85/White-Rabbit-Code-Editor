import { FileContent } from '@/hooks/use-code-builder';
import { ProjectIntelligence } from './project-intelligence';

export interface DocumentationSuggestion {
  type: 'function' | 'class' | 'component' | 'interface' | 'type' | 'file';
  name: string;
  file: string;
  line: number;
  currentDoc?: string;
  suggestedDoc: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface GeneratedDocumentation {
  jsdoc: string;
  readme: string;
  apiDocs: string;
  typeDefinitions: string;
}

export interface DocTemplate {
  type: string;
  template: string;
  variables: string[];
}

export class AutoDocumentation {
  private files: FileContent[] = [];
  private projectIntelligence: ProjectIntelligence;
  private docTemplates: Map<string, DocTemplate> = new Map();

  constructor(files: FileContent[]) {
    this.files = files;
    this.projectIntelligence = new ProjectIntelligence(files);
    this.initializeTemplates();
  }

  updateFiles(files: FileContent[]): void {
    this.files = files;
    this.projectIntelligence.updateFiles(files);
  }

  // Generate documentation suggestions for all files
  generateDocumentationSuggestions(): DocumentationSuggestion[] {
    const suggestions: DocumentationSuggestion[] = [];

    this.files.forEach(file => {
      const fileSuggestions = this.analyzeFileForDocumentation(file);
      suggestions.push(...fileSuggestions);
    });

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Analyze a specific file for documentation needs
  private analyzeFileForDocumentation(file: FileContent): DocumentationSuggestion[] {
    const suggestions: DocumentationSuggestion[] = [];
    const lines = file.content.split('\n');

    // Check for undocumented functions
    lines.forEach((line, index) => {
      const functionMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)/);
      if (functionMatch) {
        const functionName = functionMatch[1];
        const params = functionMatch[2];
        const hasDoc = this.hasDocumentationAbove(lines, index);
        
        if (!hasDoc) {
          const suggestion = this.generateFunctionDocumentation(functionName, params, file, lines, index);
          suggestions.push({
            type: 'function',
            name: functionName,
            file: file.name,
            line: index + 1,
            suggestedDoc: suggestion,
            priority: this.assessDocumentationPriority(functionName, params, line),
            reason: 'Function lacks documentation'
          });
        }
      }

      // Check for undocumented classes
      const classMatch = line.match(/(?:export\s+)?class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (classMatch) {
        const className = classMatch[1];
        const hasDoc = this.hasDocumentationAbove(lines, index);
        
        if (!hasDoc) {
          const suggestion = this.generateClassDocumentation(className, file, lines, index);
          suggestions.push({
            type: 'class',
            name: className,
            file: file.name,
            line: index + 1,
            suggestedDoc: suggestion,
            priority: 'high',
            reason: 'Class lacks documentation'
          });
        }
      }

      // Check for undocumented React components
      const componentMatch = line.match(/(?:export\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9_$]*)/);
      if (componentMatch && (file.name.endsWith('.jsx') || file.name.endsWith('.tsx'))) {
        const componentName = componentMatch[1];
        const hasDoc = this.hasDocumentationAbove(lines, index);
        
        if (!hasDoc) {
          const suggestion = this.generateComponentDocumentation(componentName, file, lines, index);
          suggestions.push({
            type: 'component',
            name: componentName,
            file: file.name,
            line: index + 1,
            suggestedDoc: suggestion,
            priority: 'high',
            reason: 'React component lacks documentation'
          });
        }
      }

      // Check for undocumented interfaces/types
      const interfaceMatch = line.match(/(?:export\s+)?interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      const typeMatch = line.match(/(?:export\s+)?type\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      
      if (interfaceMatch || typeMatch) {
        const typeName = (interfaceMatch || typeMatch)![1];
        const hasDoc = this.hasDocumentationAbove(lines, index);
        
        if (!hasDoc) {
          const suggestion = this.generateTypeDocumentation(typeName, file, lines, index);
          suggestions.push({
            type: interfaceMatch ? 'interface' : 'type',
            name: typeName,
            file: file.name,
            line: index + 1,
            suggestedDoc: suggestion,
            priority: 'medium',
            reason: 'Type definition lacks documentation'
          });
        }
      }
    });

    // Check if file needs header documentation
    if (!this.hasFileDocumentation(file)) {
      const fileDoc = this.generateFileDocumentation(file);
      suggestions.push({
        type: 'file',
        name: file.name,
        file: file.name,
        line: 1,
        suggestedDoc: fileDoc,
        priority: 'medium',
        reason: 'File lacks header documentation'
      });
    }

    return suggestions;
  }

  // Generate function documentation
  private generateFunctionDocumentation(name: string, params: string, file: FileContent, lines: string[], lineIndex: number): string {
    const functionBody = this.extractFunctionBody(lines, lineIndex);
    const returnType = this.inferReturnType(functionBody);
    const paramList = this.parseParameters(params);
    const purpose = this.inferFunctionPurpose(name, functionBody);

    let doc = '/**\n';
    doc += ` * ${purpose}\n`;
    doc += ' *\n';

    // Add parameter documentation
    paramList.forEach(param => {
      const paramType = this.inferParameterType(param, functionBody);
      const paramDesc = this.generateParameterDescription(param, name);
      doc += ` * @param {${paramType}} ${param} ${paramDesc}\n`;
    });

    // Add return documentation
    if (returnType !== 'void') {
      const returnDesc = this.generateReturnDescription(name, returnType);
      doc += ` * @returns {${returnType}} ${returnDesc}\n`;
    }

    // Add example if it's a utility function
    if (this.isUtilityFunction(name, functionBody)) {
      const example = this.generateFunctionExample(name, paramList);
      doc += ' *\n';
      doc += ' * @example\n';
      doc += ` * ${example}\n`;
    }

    doc += ' */';
    return doc;
  }

  // Generate class documentation
  private generateClassDocumentation(name: string, file: FileContent, lines: string[], lineIndex: number): string {
    const classBody = this.extractClassBody(lines, lineIndex);
    const purpose = this.inferClassPurpose(name, classBody);
    const methods = this.extractClassMethods(classBody);
    const properties = this.extractClassProperties(classBody);

    let doc = '/**\n';
    doc += ` * ${purpose}\n`;
    doc += ' *\n';

    if (properties.length > 0) {
      doc += ' * Properties:\n';
      properties.forEach(prop => {
        doc += ` * - ${prop.name}: ${prop.description}\n`;
      });
      doc += ' *\n';
    }

    if (methods.length > 0) {
      doc += ' * Methods:\n';
      methods.forEach(method => {
        doc += ` * - ${method.name}(): ${method.description}\n`;
      });
      doc += ' *\n';
    }

    // Add usage example
    const example = this.generateClassExample(name, methods);
    doc += ' * @example\n';
    doc += ` * ${example}\n`;
    doc += ' */';
    return doc;
  }

  // Generate React component documentation
  private generateComponentDocumentation(name: string, file: FileContent, lines: string[], lineIndex: number): string {
    const componentBody = this.extractComponentBody(lines, lineIndex);
    const props = this.extractComponentProps(componentBody);
    const purpose = this.inferComponentPurpose(name, componentBody);

    let doc = '/**\n';
    doc += ` * ${purpose}\n`;
    doc += ' *\n';

    if (props.length > 0) {
      doc += ' * @component\n';
      props.forEach(prop => {
        const propType = this.inferPropType(prop, componentBody);
        const propDesc = this.generatePropDescription(prop, name);
        doc += ` * @param {${propType}} ${prop} ${propDesc}\n`;
      });
      doc += ' *\n';
    }

    // Add usage example
    const example = this.generateComponentExample(name, props);
    doc += ' * @example\n';
    doc += ` * ${example}\n`;
    doc += ' */';
    return doc;
  }

  // Generate type documentation
  private generateTypeDocumentation(name: string, file: FileContent, lines: string[], lineIndex: number): string {
    const typeBody = this.extractTypeBody(lines, lineIndex);
    const purpose = this.inferTypePurpose(name, typeBody);
    const properties = this.extractTypeProperties(typeBody);

    let doc = '/**\n';
    doc += ` * ${purpose}\n`;
    doc += ' *\n';

    if (properties.length > 0) {
      properties.forEach(prop => {
        doc += ` * @property {${prop.type}} ${prop.name} ${prop.description}\n`;
      });
    }

    doc += ' */';
    return doc;
  }

  // Generate file documentation
  private generateFileDocumentation(file: FileContent): string {
    const purpose = this.inferFilePurpose(file);
    const exports = this.extractMainExports(file);
    const dependencies = this.extractFileDependencies(file);

    let doc = '/**\n';
    doc += ` * @fileoverview ${purpose}\n`;
    doc += ` * @author Generated by Hex & Kex Auto-Documentation\n`;
    doc += ` * @created ${new Date().toISOString().split('T')[0]}\n`;
    doc += ' *\n';

    if (exports.length > 0) {
      doc += ' * Exports:\n';
      exports.forEach(exp => {
        doc += ` * - ${exp.name}: ${exp.description}\n`;
      });
      doc += ' *\n';
    }

    if (dependencies.length > 0) {
      doc += ' * Dependencies:\n';
      dependencies.forEach(dep => {
        doc += ` * - ${dep}\n`;
      });
    }

    doc += ' */\n';
    return doc;
  }

  // Generate comprehensive project documentation
  generateProjectDocumentation(): GeneratedDocumentation {
    const jsdoc = this.generateJSDocConfig();
    const readme = this.generateReadme();
    const apiDocs = this.generateAPIDocumentation();
    const typeDefinitions = this.generateTypeDefinitions();

    return {
      jsdoc,
      readme,
      apiDocs,
      typeDefinitions
    };
  }

  private generateReadme(): string {
    const projectContext = this.projectIntelligence.getArchitecturalInsights();
    const mainFiles = this.files.filter(f => 
      ['index', 'main', 'app'].some(name => f.name.includes(name))
    );

    let readme = '# Project Documentation\n\n';
    readme += 'Auto-generated documentation for this project.\n\n';
    
    readme += '## Overview\n\n';
    readme += `This project contains ${this.files.length} files with the following structure:\n\n`;
    
    // Add file structure
    readme += '## File Structure\n\n';
    readme += '```\n';
    this.files.forEach(file => {
      readme += `${file.name}\n`;
    });
    readme += '```\n\n';

    // Add main components/functions
    readme += '## Main Components\n\n';
    mainFiles.forEach(file => {
      const exports = this.extractMainExports(file);
      if (exports.length > 0) {
        readme += `### ${file.name}\n\n`;
        exports.forEach(exp => {
          readme += `- **${exp.name}**: ${exp.description}\n`;
        });
        readme += '\n';
      }
    });

    return readme;
  }

  private generateAPIDocumentation(): string {
    let apiDoc = '# API Documentation\n\n';
    
    this.files.forEach(file => {
      const exports = this.extractMainExports(file);
      if (exports.length > 0) {
        apiDoc += `## ${file.name}\n\n`;
        exports.forEach(exp => {
          apiDoc += `### ${exp.name}\n\n`;
          apiDoc += `${exp.description}\n\n`;
          
          if (exp.type === 'function') {
            apiDoc += '**Parameters:**\n\n';
            // Add parameter details
            apiDoc += '**Returns:**\n\n';
            // Add return details
          }
          
          apiDoc += '---\n\n';
        });
      }
    });

    return apiDoc;
  }

  private generateJSDocConfig(): string {
    return JSON.stringify({
      source: {
        include: ['./'],
        includePattern: '\\.(js|jsx|ts|tsx)$',
        exclude: ['node_modules/']
      },
      opts: {
        destination: './docs/'
      },
      plugins: ['plugins/markdown']
    }, null, 2);
  }

  private generateTypeDefinitions(): string {
    let typeDefs = '// Auto-generated type definitions\n\n';
    
    this.files.forEach(file => {
      if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
        const types = this.extractTypeDefinitions(file);
        if (types.length > 0) {
          typeDefs += `// From ${file.name}\n`;
          types.forEach(type => {
            typeDefs += `${type}\n\n`;
          });
        }
      }
    });

    return typeDefs;
  }

  // Initialize documentation templates
  private initializeTemplates(): void {
    this.docTemplates.set('function', {
      type: 'function',
      template: '/**\n * {description}\n * @param {type} {param} {paramDesc}\n * @returns {returnType} {returnDesc}\n */',
      variables: ['description', 'type', 'param', 'paramDesc', 'returnType', 'returnDesc']
    });

    this.docTemplates.set('class', {
      type: 'class',
      template: '/**\n * {description}\n * @class {className}\n */',
      variables: ['description', 'className']
    });

    this.docTemplates.set('component', {
      type: 'component',
      template: '/**\n * {description}\n * @component\n * @param {props} props Component props\n */',
      variables: ['description', 'props']
    });
  }

  // Helper methods (simplified implementations)
  private hasDocumentationAbove(lines: string[], index: number): boolean {
    if (index === 0) return false;
    const prevLine = lines[index - 1].trim();
    return prevLine.endsWith('*/') || prevLine.startsWith('//');
  }

  private hasFileDocumentation(file: FileContent): boolean {
    const firstLines = file.content.split('\n').slice(0, 10).join('\n');
    return firstLines.includes('@fileoverview') || firstLines.includes('/**');
  }

  private extractFunctionBody(lines: string[], startIndex: number): string {
    // Simplified extraction
    let braceCount = 0;
    let body = '';
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      body += line + '\n';
      
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      if (braceCount === 0 && line.includes('{')) break;
    }
    
    return body;
  }

  private parseParameters(params: string): string[] {
    return params.split(',').map(p => p.trim().split(/\s+/)[0]).filter(p => p);
  }

  private inferReturnType(body: string): string {
    if (body.includes('return ')) {
      if (body.includes('return true') || body.includes('return false')) return 'boolean';
      if (body.includes('return "') || body.includes("return '")) return 'string';
      if (body.includes('return [')) return 'Array';
      if (body.includes('return {')) return 'Object';
    }
    return 'void';
  }

  private inferFunctionPurpose(name: string, body: string): string {
    // Simple heuristics for function purpose
    if (name.startsWith('get')) return `Gets ${name.slice(3).toLowerCase()}`;
    if (name.startsWith('set')) return `Sets ${name.slice(3).toLowerCase()}`;
    if (name.startsWith('is') || name.startsWith('has')) return `Checks if ${name.slice(2).toLowerCase()}`;
    if (name.startsWith('create')) return `Creates ${name.slice(6).toLowerCase()}`;
    if (name.startsWith('update')) return `Updates ${name.slice(6).toLowerCase()}`;
    if (name.startsWith('delete')) return `Deletes ${name.slice(6).toLowerCase()}`;
    
    return `${name} function`;
  }

  private assessDocumentationPriority(name: string, params: string, line: string): 'high' | 'medium' | 'low' {
    if (line.includes('export')) return 'high';
    if (params.length > 20) return 'high'; // Complex function
    if (name.startsWith('_')) return 'low'; // Private function
    return 'medium';
  }

  // Additional helper methods would be implemented here...
  private extractClassBody(lines: string[], startIndex: number): string { return ''; }
  private extractComponentBody(lines: string[], startIndex: number): string { return ''; }
  private extractTypeBody(lines: string[], startIndex: number): string { return ''; }
  private inferClassPurpose(name: string, body: string): string { return `${name} class`; }
  private inferComponentPurpose(name: string, body: string): string { return `${name} React component`; }
  private inferTypePurpose(name: string, body: string): string { return `${name} type definition`; }
  private inferFilePurpose(file: FileContent): string { return `${file.name} module`; }
  private extractClassMethods(body: string): Array<{name: string, description: string}> { return []; }
  private extractClassProperties(body: string): Array<{name: string, description: string}> { return []; }
  private extractComponentProps(body: string): string[] { return []; }
  private extractTypeProperties(body: string): Array<{name: string, type: string, description: string}> { return []; }
  private extractMainExports(file: FileContent): Array<{name: string, type: string, description: string}> { return []; }
  private extractFileDependencies(file: FileContent): string[] { return []; }
  private extractTypeDefinitions(file: FileContent): string[] { return []; }
  private inferParameterType(param: string, body: string): string { return 'any'; }
  private inferPropType(prop: string, body: string): string { return 'any'; }
  private generateParameterDescription(param: string, functionName: string): string { return `${param} parameter`; }
  private generateReturnDescription(name: string, type: string): string { return `Return value`; }
  private generatePropDescription(prop: string, componentName: string): string { return `${prop} prop`; }
  private isUtilityFunction(name: string, body: string): boolean { return false; }
  private generateFunctionExample(name: string, params: string[]): string { return `${name}(${params.join(', ')})`; }
  private generateClassExample(name: string, methods: any[]): string { return `const instance = new ${name}()`; }
  private generateComponentExample(name: string, props: string[]): string { return `<${name} ${props.map(p => `${p}={value}`).join(' ')} />`; }
}
