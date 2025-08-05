import { AIService } from './ai-service';
import { AISettings } from './ai-config';
import { NavigationService, NavigationTarget } from './navigation-service';

export interface RefactoringOperation {
  id: string;
  type: 'rename' | 'extract-method' | 'extract-variable' | 'inline' | 'move-file' | 'change-signature' | 'convert-function';
  title: string;
  description: string;
  changes: FileChange[];
  preview?: string;
  safe: boolean;
  reversible: boolean;
}

export interface FileChange {
  file: string;
  edits: TextEdit[];
  newFile?: boolean;
  deleteFile?: boolean;
}

export interface TextEdit {
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  newText: string;
  description?: string;
}

export interface RefactoringContext {
  file: string;
  line: number;
  column: number;
  selectedText?: string;
  symbol?: string;
  projectFiles: Array<{ name: string; content: string }>;
}

export interface ExtractMethodOptions {
  methodName: string;
  parameters: Array<{ name: string; type?: string }>;
  returnType?: string;
  isAsync?: boolean;
  visibility?: 'public' | 'private' | 'protected';
}

export interface RenameOptions {
  newName: string;
  updateComments?: boolean;
  updateStrings?: boolean;
  scope?: 'file' | 'project';
}

export class RefactoringService {
  private aiService: AIService | null = null;
  private navigationService: NavigationService | null = null;

  constructor(
    aiSettings?: AISettings,
    navigationService?: NavigationService
  ) {
    if (aiSettings?.apiKey && aiSettings.provider) {
      this.aiService = new AIService(aiSettings);
    }
    this.navigationService = navigationService || null;
  }

  updateAISettings(aiSettings: AISettings) {
    if (aiSettings.apiKey && aiSettings.provider) {
      this.aiService = new AIService(aiSettings);
    } else {
      this.aiService = null;
    }
  }

  // Get available refactoring operations for current context
  async getAvailableRefactorings(context: RefactoringContext): Promise<RefactoringOperation[]> {
    const operations: RefactoringOperation[] = [];
    const fileContent = context.projectFiles.find(f => f.name === context.file)?.content || '';
    const lines = fileContent.split('\n');
    const currentLine = lines[context.line - 1] || '';

    // Safe Rename
    if (context.symbol) {
      operations.push(await this.createRenameOperation(context));
    }

    // Extract Method (if text is selected)
    if (context.selectedText && context.selectedText.trim().length > 0) {
      operations.push(await this.createExtractMethodOperation(context));
    }

    // Extract Variable (if expression is selected)
    if (context.selectedText && this.isExpression(context.selectedText)) {
      operations.push(await this.createExtractVariableOperation(context));
    }

    // Convert Function Type (arrow function <-> regular function)
    if (this.isFunctionLine(currentLine)) {
      operations.push(await this.createConvertFunctionOperation(context));
    }

    // Inline Variable/Method
    if (context.symbol && this.canInline(context)) {
      operations.push(await this.createInlineOperation(context));
    }

    // AI-suggested refactorings
    if (this.aiService) {
      try {
        const aiOperations = await this.getAISuggestedRefactorings(context);
        operations.push(...aiOperations);
      } catch (error) {
        console.warn('AI refactoring suggestions failed:', error);
      }
    }

    return operations.filter(op => op.safe || this.isAdvancedUser());
  }

  // Safe Rename
  async performRename(
    context: RefactoringContext,
    options: RenameOptions
  ): Promise<RefactoringOperation> {
    if (!context.symbol) {
      throw new Error('No symbol selected for rename');
    }

    const changes: FileChange[] = [];
    
    // Find all references using navigation service
    let references: NavigationTarget[] = [];
    if (this.navigationService) {
      references = await this.navigationService.findUsages(context.symbol, true);
    } else {
      // Fallback: basic text search
      references = this.findBasicReferences(context.symbol, context.projectFiles);
    }

    // Group references by file
    const fileGroups = new Map<string, NavigationTarget[]>();
    references.forEach(ref => {
      if (!fileGroups.has(ref.file)) {
        fileGroups.set(ref.file, []);
      }
      fileGroups.get(ref.file)!.push(ref);
    });

    // Create edits for each file
    for (const [fileName, refs] of fileGroups) {
      const edits: TextEdit[] = [];
      
      // Sort references by position (reverse order for safe editing)
      const sortedRefs = refs.sort((a, b) => {
        if (a.line !== b.line) return b.line - a.line;
        return b.column - a.column;
      });

      for (const ref of sortedRefs) {
        edits.push({
          range: {
            startLine: ref.line,
            startColumn: ref.column,
            endLine: ref.line,
            endColumn: ref.column + context.symbol.length
          },
          newText: options.newName,
          description: `Rename ${context.symbol} to ${options.newName}`
        });
      }

      if (edits.length > 0) {
        changes.push({ file: fileName, edits });
      }
    }

    return {
      id: `rename-${Date.now()}`,
      type: 'rename',
      title: `Rename ${context.symbol} to ${options.newName}`,
      description: `Safely rename all ${references.length} occurrences of '${context.symbol}' to '${options.newName}'`,
      changes,
      safe: true,
      reversible: true
    };
  }

  // Extract Method
  async performExtractMethod(
    context: RefactoringContext,
    options: ExtractMethodOptions
  ): Promise<RefactoringOperation> {
    if (!context.selectedText) {
      throw new Error('No code selected for extraction');
    }

    const fileContent = context.projectFiles.find(f => f.name === context.file)?.content || '';
    const lines = fileContent.split('\n');
    
    // Analyze selected code
    const analysis = await this.analyzeSelectedCode(context.selectedText, context);
    
    // Generate method signature
    const methodSignature = this.generateMethodSignature(options, analysis);
    
    // Generate method call
    const methodCall = this.generateMethodCall(options, analysis);

    const changes: FileChange[] = [{
      file: context.file,
      edits: [
        // Replace selected code with method call
        {
          range: {
            startLine: context.line,
            startColumn: context.column,
            endLine: context.line + context.selectedText.split('\n').length - 1,
            endColumn: context.column + context.selectedText.split('\n').pop()!.length
          },
          newText: methodCall,
          description: 'Replace with method call'
        },
        // Insert new method
        {
          range: {
            startLine: this.findInsertionPoint(lines, context.line),
            startColumn: 1,
            endLine: this.findInsertionPoint(lines, context.line),
            endColumn: 1
          },
          newText: `\n${methodSignature} {\n${this.indentCode(context.selectedText)}\n}\n`,
          description: 'Insert extracted method'
        }
      ]
    }];

    return {
      id: `extract-method-${Date.now()}`,
      type: 'extract-method',
      title: `Extract method '${options.methodName}'`,
      description: `Extract selected code into a new method '${options.methodName}'`,
      changes,
      safe: true,
      reversible: true,
      preview: methodSignature
    };
  }

  // Extract Variable
  async performExtractVariable(
    context: RefactoringContext,
    variableName: string
  ): Promise<RefactoringOperation> {
    if (!context.selectedText) {
      throw new Error('No expression selected for extraction');
    }

    const variableDeclaration = `const ${variableName} = ${context.selectedText};`;
    const insertionLine = this.findVariableInsertionPoint(context);

    const changes: FileChange[] = [{
      file: context.file,
      edits: [
        // Insert variable declaration
        {
          range: {
            startLine: insertionLine,
            startColumn: 1,
            endLine: insertionLine,
            endColumn: 1
          },
          newText: `${variableDeclaration}\n`,
          description: 'Insert variable declaration'
        },
        // Replace expression with variable
        {
          range: {
            startLine: context.line,
            startColumn: context.column,
            endLine: context.line,
            endColumn: context.column + context.selectedText.length
          },
          newText: variableName,
          description: 'Replace with variable reference'
        }
      ]
    }];

    return {
      id: `extract-variable-${Date.now()}`,
      type: 'extract-variable',
      title: `Extract variable '${variableName}'`,
      description: `Extract expression into variable '${variableName}'`,
      changes,
      safe: true,
      reversible: true,
      preview: variableDeclaration
    };
  }

  // Convert Function Type
  async performConvertFunction(context: RefactoringContext): Promise<RefactoringOperation> {
    const fileContent = context.projectFiles.find(f => f.name === context.file)?.content || '';
    const lines = fileContent.split('\n');
    const currentLine = lines[context.line - 1] || '';

    let newLine: string;
    let title: string;

    if (currentLine.includes('=>')) {
      // Convert arrow function to regular function
      const match = currentLine.match(/const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*{?/);
      if (match) {
        const [, name, params] = match;
        newLine = `function ${name}(${params}) {`;
        title = 'Convert to regular function';
      } else {
        throw new Error('Cannot parse arrow function');
      }
    } else if (currentLine.includes('function')) {
      // Convert regular function to arrow function
      const match = currentLine.match(/function\s+(\w+)\s*\(([^)]*)\)\s*{/);
      if (match) {
        const [, name, params] = match;
        newLine = `const ${name} = (${params}) => {`;
        title = 'Convert to arrow function';
      } else {
        throw new Error('Cannot parse regular function');
      }
    } else {
      throw new Error('Not a function line');
    }

    const changes: FileChange[] = [{
      file: context.file,
      edits: [{
        range: {
          startLine: context.line,
          startColumn: 1,
          endLine: context.line,
          endColumn: currentLine.length + 1
        },
        newText: newLine,
        description: title
      }]
    }];

    return {
      id: `convert-function-${Date.now()}`,
      type: 'convert-function',
      title,
      description: `Convert function declaration style`,
      changes,
      safe: true,
      reversible: true,
      preview: newLine
    };
  }

  // Apply refactoring operation
  async applyRefactoring(operation: RefactoringOperation): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for (const fileChange of operation.changes) {
      const originalContent = this.getFileContent(fileChange.file);
      let newContent = originalContent;

      // Apply edits in reverse order to maintain positions
      const sortedEdits = [...fileChange.edits].sort((a, b) => {
        if (a.range.startLine !== b.range.startLine) {
          return b.range.startLine - a.range.startLine;
        }
        return b.range.startColumn - a.range.startColumn;
      });

      for (const edit of sortedEdits) {
        newContent = this.applyTextEdit(newContent, edit);
      }

      results.set(fileChange.file, newContent);
    }

    return results;
  }

  private async createRenameOperation(context: RefactoringContext): Promise<RefactoringOperation> {
    return {
      id: `rename-${context.symbol}-${Date.now()}`,
      type: 'rename',
      title: `Rename '${context.symbol}'`,
      description: `Safely rename all occurrences of '${context.symbol}'`,
      changes: [], // Will be populated when executed
      safe: true,
      reversible: true
    };
  }

  private async createExtractMethodOperation(context: RefactoringContext): Promise<RefactoringOperation> {
    return {
      id: `extract-method-${Date.now()}`,
      type: 'extract-method',
      title: 'Extract Method',
      description: 'Extract selected code into a new method',
      changes: [], // Will be populated when executed
      safe: true,
      reversible: true
    };
  }

  private async createExtractVariableOperation(context: RefactoringContext): Promise<RefactoringOperation> {
    return {
      id: `extract-variable-${Date.now()}`,
      type: 'extract-variable',
      title: 'Extract Variable',
      description: 'Extract expression into a variable',
      changes: [], // Will be populated when executed
      safe: true,
      reversible: true
    };
  }

  private async createConvertFunctionOperation(context: RefactoringContext): Promise<RefactoringOperation> {
    const fileContent = context.projectFiles.find(f => f.name === context.file)?.content || '';
    const lines = fileContent.split('\n');
    const currentLine = lines[context.line - 1] || '';
    
    const isArrow = currentLine.includes('=>');
    
    return {
      id: `convert-function-${Date.now()}`,
      type: 'convert-function',
      title: isArrow ? 'Convert to Regular Function' : 'Convert to Arrow Function',
      description: `Convert function declaration style`,
      changes: [], // Will be populated when executed
      safe: true,
      reversible: true
    };
  }

  private async createInlineOperation(context: RefactoringContext): Promise<RefactoringOperation> {
    return {
      id: `inline-${context.symbol}-${Date.now()}`,
      type: 'inline',
      title: `Inline '${context.symbol}'`,
      description: `Inline the definition of '${context.symbol}'`,
      changes: [], // Will be populated when executed
      safe: false, // Inlining can be complex
      reversible: false
    };
  }

  private async getAISuggestedRefactorings(context: RefactoringContext): Promise<RefactoringOperation[]> {
    if (!this.aiService) return [];

    const fileContent = context.projectFiles.find(f => f.name === context.file)?.content || '';
    const contextLines = fileContent.split('\n').slice(
      Math.max(0, context.line - 10),
      context.line + 10
    ).join('\n');

    const prompt = `Analyze this code and suggest intelligent refactoring operations:

File: ${context.file}
Context around line ${context.line}:
\`\`\`
${contextLines}
\`\`\`

${context.selectedText ? `Selected text: "${context.selectedText}"` : ''}
${context.symbol ? `Current symbol: "${context.symbol}"` : ''}

Suggest refactoring operations in JSON format:
{
  "refactorings": [
    {
      "type": "extract-method|extract-variable|rename|convert-function|simplify",
      "title": "Short title",
      "description": "Detailed description",
      "safe": true,
      "preview": "Code preview of the change"
    }
  ]
}

Focus on:
- Code quality improvements
- Performance optimizations
- Readability enhancements
- Modern JavaScript/TypeScript patterns
- Design pattern applications

Return only the JSON object.`;

    try {
      const response = await this.aiService.sendMessage([{
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        timestamp: new Date()
      }]);

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.refactorings.map((ref: any, index: number) => ({
          id: `ai-refactor-${index}-${Date.now()}`,
          type: ref.type,
          title: ref.title,
          description: ref.description,
          changes: [], // Will be populated when executed
          safe: ref.safe,
          reversible: false,
          preview: ref.preview
        }));
      }
    } catch (error) {
      console.warn('AI refactoring suggestions failed:', error);
    }

    return [];
  }

  private findBasicReferences(symbol: string, projectFiles: Array<{ name: string; content: string }>): NavigationTarget[] {
    const references: NavigationTarget[] = [];
    const regex = new RegExp(`\\b${symbol}\\b`, 'g');

    for (const file of projectFiles) {
      const lines = file.content.split('\n');
      lines.forEach((line, index) => {
        let match;
        while ((match = regex.exec(line)) !== null) {
          references.push({
            file: file.name,
            line: index + 1,
            column: match.index + 1,
            symbol,
            type: 'reference',
            preview: line.trim()
          });
        }
      });
    }

    return references;
  }

  private isExpression(text: string): boolean {
    // Simple heuristic to check if text is an expression
    return !text.includes(';') && !text.includes('{') && !text.includes('function');
  }

  private isFunctionLine(line: string): boolean {
    return line.includes('function') || (line.includes('=>') && line.includes('='));
  }

  private canInline(context: RefactoringContext): boolean {
    // Simple check - in a real implementation, this would be more sophisticated
    return context.symbol !== undefined;
  }

  private isAdvancedUser(): boolean {
    // In a real implementation, this would check user preferences
    return false;
  }

  private async analyzeSelectedCode(code: string, context: RefactoringContext): Promise<any> {
    // Analyze the selected code to determine parameters, return values, etc.
    return {
      parameters: [],
      returnType: 'void',
      usesThis: code.includes('this.'),
      isAsync: code.includes('await')
    };
  }

  private generateMethodSignature(options: ExtractMethodOptions, analysis: any): string {
    const params = options.parameters.map(p => p.name).join(', ');
    const asyncKeyword = options.isAsync ? 'async ' : '';
    const visibility = options.visibility === 'private' ? 'private ' : '';
    
    return `${visibility}${asyncKeyword}${options.methodName}(${params})`;
  }

  private generateMethodCall(options: ExtractMethodOptions, analysis: any): string {
    const params = options.parameters.map(p => p.name).join(', ');
    const awaitKeyword = options.isAsync ? 'await ' : '';
    
    return `${awaitKeyword}this.${options.methodName}(${params});`;
  }

  private findInsertionPoint(lines: string[], currentLine: number): number {
    // Find a good place to insert the new method (end of class, etc.)
    for (let i = currentLine; i < lines.length; i++) {
      if (lines[i].trim() === '}' && i > currentLine + 5) {
        return i;
      }
    }
    return lines.length;
  }

  private findVariableInsertionPoint(context: RefactoringContext): number {
    // Find the best place to insert a variable declaration
    return Math.max(1, context.line - 1);
  }

  private indentCode(code: string): string {
    return code.split('\n').map(line => `  ${line}`).join('\n');
  }

  private getFileContent(fileName: string): string {
    // In a real implementation, this would get the current file content
    // For now, we'll assume it's provided in the project files
    return '';
  }

  // Preview refactoring changes
  async previewRefactoring(operation: RefactoringOperation): Promise<Map<string, { before: string; after: string }>> {
    const previews = new Map<string, { before: string; after: string }>();

    for (const fileChange of operation.changes) {
      const before = this.getFileContent(fileChange.file);
      const after = await this.applyRefactoring(operation);

      previews.set(fileChange.file, {
        before,
        after: after.get(fileChange.file) || before
      });
    }

    return previews;
  }

  private applyTextEdit(content: string, edit: TextEdit): string {
    const lines = content.split('\n');
    const startLine = edit.range.startLine - 1;
    const endLine = edit.range.endLine - 1;
    
    if (startLine === endLine) {
      // Single line edit
      const line = lines[startLine];
      const before = line.substring(0, edit.range.startColumn - 1);
      const after = line.substring(edit.range.endColumn - 1);
      lines[startLine] = before + edit.newText + after;
    } else {
      // Multi-line edit
      const firstLine = lines[startLine];
      const lastLine = lines[endLine];
      const before = firstLine.substring(0, edit.range.startColumn - 1);
      const after = lastLine.substring(edit.range.endColumn - 1);
      
      const newLines = [before + edit.newText + after];
      lines.splice(startLine, endLine - startLine + 1, ...newLines);
    }
    
    return lines.join('\n');
  }
}
