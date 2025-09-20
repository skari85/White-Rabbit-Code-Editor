'use client'

import { AIService } from './ai-service';
import { AISettings, AIMessage } from './ai-config';
import { ProjectContext } from './ai-terminal-bridge';

export interface CodeGenerationRequest {
  type: 'component' | 'function' | 'class' | 'test' | 'api' | 'config' | 'documentation';
  description: string;
  framework?: string;
  language: string;
  style?: 'functional' | 'class-based' | 'hooks' | 'composition';
  features?: string[];
  dependencies?: string[];
  targetFile?: string;
  context?: {
    existingCode?: string;
    relatedFiles?: Array<{ name: string; content: string }>;
    projectStructure?: string[];
  };
}

export interface GeneratedCode {
  id: string;
  filename: string;
  content: string;
  language: string;
  explanation: string;
  dependencies: string[];
  relatedFiles: Array<{
    filename: string;
    content: string;
    action: 'create' | 'update' | 'reference';
  }>;
  tests?: {
    filename: string;
    content: string;
  };
  documentation?: string;
  bestPractices: string[];
  warnings: string[];
}

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  framework: string;
  language: string;
  template: string;
  variables: Array<{
    name: string;
    description: string;
    type: 'string' | 'boolean' | 'array' | 'object';
    required: boolean;
    default?: any;
  }>;
}

export class AdvancedCodeGeneration {
  private aiService: AIService;
  private templates: Map<string, CodeTemplate> = new Map();
  private generationHistory: GeneratedCode[] = [];
  private maxHistorySize = 50;

  constructor(aiSettings: AISettings) {
    this.aiService = new AIService(aiSettings);
    this.initializeTemplates();
  }

  // Generate code based on natural language description
  async generateCode(
    request: CodeGenerationRequest,
    projectContext?: ProjectContext
  ): Promise<GeneratedCode> {
    const systemPrompt = this.buildGenerationPrompt(request, projectContext);
    const userPrompt = this.buildRequestPrompt(request);

    const messages: AIMessage[] = [
      {
        id: Date.now().toString(),
        role: 'user',
        content: userPrompt,
        timestamp: new Date()
      }
    ];

    try {
      const response = await this.aiService.sendMessage(messages);
      const generatedCode = this.parseGenerationResponse(response.content, request);
      
      this.addToHistory(generatedCode);
      return generatedCode;
    } catch (error) {
      console.error('Error generating code:', error);
      throw new Error('Failed to generate code. Please try again with a more specific description.');
    }
  }

  // Generate code from template
  generateFromTemplate(
    templateId: string,
    variables: Record<string, any>
  ): GeneratedCode {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let content = template.template;
    
    // Replace template variables
    template.variables.forEach(variable => {
      const value = variables[variable.name] ?? variable.default ?? '';
      const placeholder = new RegExp(`{{${variable.name}}}`, 'g');
      content = content.replace(placeholder, String(value));
    });

    const generatedCode: GeneratedCode = {
      id: `gen-${Date.now()}`,
      filename: variables.filename || `generated-${template.name.toLowerCase()}.${this.getFileExtension(template.language)}`,
      content,
      language: template.language,
      explanation: `Generated ${template.name} from template`,
      dependencies: [],
      relatedFiles: [],
      bestPractices: [],
      warnings: []
    };

    this.addToHistory(generatedCode);
    return generatedCode;
  }

  // Get available templates
  getTemplates(category?: string, framework?: string): CodeTemplate[] {
    let templates = Array.from(this.templates.values());
    
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    
    if (framework) {
      templates = templates.filter(t => t.framework === framework || t.framework === 'universal');
    }
    
    return templates;
  }

  // Get generation history
  getHistory(): GeneratedCode[] {
    return [...this.generationHistory].reverse();
  }

  // Improve existing code
  async improveCode(
    code: string,
    improvements: string[],
    language: string
  ): Promise<GeneratedCode> {
    const request: CodeGenerationRequest = {
      type: 'function',
      description: `Improve this code with the following requirements: ${improvements.join(', ')}`,
      language,
      context: {
        existingCode: code
      }
    };

    const systemPrompt = `You are an expert code improvement assistant. 
    Analyze the provided code and apply the requested improvements while maintaining functionality.
    
    Focus on:
    1. Code quality and readability
    2. Performance optimizations
    3. Best practices
    4. Security considerations
    5. Maintainability
    
    Return the improved code with explanations of changes made.`;

    const userPrompt = `Please improve this ${language} code:

    \`\`\`${language}
    ${code}
    \`\`\`

    Requested improvements:
    ${improvements.map(imp => `- ${imp}`).join('\n')}

    Please provide the improved code with explanations.`;

    const messages: AIMessage[] = [
      {
        id: Date.now().toString(),
        role: 'user',
        content: userPrompt,
        timestamp: new Date()
      }
    ];

    const response = await this.aiService.sendMessage(messages);
    return this.parseGenerationResponse(response.content, request);
  }

  // Generate tests for code
  async generateTests(
    code: string,
    language: string,
    testFramework?: string
  ): Promise<GeneratedCode> {
    const request: CodeGenerationRequest = {
      type: 'test',
      description: `Generate comprehensive tests for the provided code`,
      language,
      context: {
        existingCode: code
      }
    };

    const framework = testFramework || this.getDefaultTestFramework(language);
    
    const systemPrompt = `You are an expert test generation assistant.
    Generate comprehensive, well-structured tests using ${framework}.
    
    Include:
    1. Unit tests for all functions/methods
    2. Edge cases and error conditions
    3. Mock data and fixtures
    4. Clear test descriptions
    5. Setup and teardown if needed`;

    const userPrompt = `Generate ${framework} tests for this ${language} code:

    \`\`\`${language}
    ${code}
    \`\`\`

    Please provide comprehensive test coverage.`;

    const messages: AIMessage[] = [
      {
        id: Date.now().toString(),
        role: 'user',
        content: userPrompt,
        timestamp: new Date()
      }
    ];

    const response = await this.aiService.sendMessage(messages);
    return this.parseGenerationResponse(response.content, request);
  }

  private buildGenerationPrompt(
    request: CodeGenerationRequest,
    projectContext?: ProjectContext
  ): string {
    const contextInfo = projectContext ? `
    Project Context:
    - Type: ${projectContext.projectType}
    - Dependencies: ${projectContext.dependencies.slice(0, 10).join(', ')}
    - Current Directory: ${projectContext.currentDirectory}
    ` : '';

    return `You are an expert code generation assistant specializing in ${request.language} development.

    Generate high-quality, production-ready code that follows best practices.

    ${contextInfo}

    Requirements:
    1. Write clean, readable, and maintainable code
    2. Follow language-specific conventions and best practices
    3. Include proper error handling
    4. Add meaningful comments and documentation
    5. Consider performance and security
    6. Suggest related files if needed
    7. Include dependency requirements

    Return a JSON object with this structure:
    {
      "filename": "suggested filename",
      "content": "the generated code",
      "explanation": "explanation of the code and design decisions",
      "dependencies": ["required dependencies"],
      "relatedFiles": [
        {
          "filename": "related file name",
          "content": "file content",
          "action": "create|update|reference"
        }
      ],
      "tests": {
        "filename": "test file name",
        "content": "test code"
      },
      "documentation": "markdown documentation",
      "bestPractices": ["best practice notes"],
      "warnings": ["important warnings or considerations"]
    }`;
  }

  private buildRequestPrompt(request: CodeGenerationRequest): string {
    let prompt = `Generate a ${request.type} in ${request.language}`;
    
    if (request.framework) {
      prompt += ` using ${request.framework}`;
    }
    
    prompt += `:\n\n${request.description}`;

    if (request.features && request.features.length > 0) {
      prompt += `\n\nRequired features:\n${request.features.map(f => `- ${f}`).join('\n')}`;
    }

    if (request.style) {
      prompt += `\n\nStyle: ${request.style}`;
    }

    if (request.context?.existingCode) {
      prompt += `\n\nExisting code context:\n\`\`\`${request.language}\n${request.context.existingCode}\n\`\`\``;
    }

    if (request.context?.relatedFiles) {
      prompt += `\n\nRelated files:\n${request.context.relatedFiles.map(f => 
        `${f.name}:\n\`\`\`\n${f.content.slice(0, 500)}...\n\`\`\``
      ).join('\n\n')}`;
    }

    return prompt;
  }

  private parseGenerationResponse(content: string, request: CodeGenerationRequest): GeneratedCode {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          id: `gen-${Date.now()}`,
          filename: parsed.filename || `generated.${this.getFileExtension(request.language)}`,
          content: parsed.content || '',
          language: request.language,
          explanation: parsed.explanation || 'Generated code',
          dependencies: parsed.dependencies || [],
          relatedFiles: parsed.relatedFiles || [],
          tests: parsed.tests,
          documentation: parsed.documentation,
          bestPractices: parsed.bestPractices || [],
          warnings: parsed.warnings || []
        };
      }
    } catch (error) {
      console.error('Error parsing generation response:', error);
    }

    // Fallback parsing
    const codeMatch = content.match(/```[\w]*\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1] : content;

    return {
      id: `gen-${Date.now()}`,
      filename: `generated.${this.getFileExtension(request.language)}`,
      content: code,
      language: request.language,
      explanation: 'Generated code (fallback parsing)',
      dependencies: [],
      relatedFiles: [],
      bestPractices: [],
      warnings: []
    };
  }

  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      'javascript': 'js',
      'typescript': 'ts',
      'python': 'py',
      'java': 'java',
      'csharp': 'cs',
      'cpp': 'cpp',
      'rust': 'rs',
      'go': 'go',
      'php': 'php',
      'ruby': 'rb',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'yaml': 'yml',
      'markdown': 'md'
    };
    
    return extensions[language.toLowerCase()] || 'txt';
  }

  private getDefaultTestFramework(language: string): string {
    const frameworks: Record<string, string> = {
      'javascript': 'Jest',
      'typescript': 'Jest',
      'python': 'pytest',
      'java': 'JUnit',
      'csharp': 'NUnit',
      'go': 'testing',
      'rust': 'cargo test',
      'php': 'PHPUnit',
      'ruby': 'RSpec'
    };
    
    return frameworks[language.toLowerCase()] || 'Unit Tests';
  }

  private addToHistory(generatedCode: GeneratedCode): void {
    this.generationHistory.unshift(generatedCode);
    
    if (this.generationHistory.length > this.maxHistorySize) {
      this.generationHistory = this.generationHistory.slice(0, this.maxHistorySize);
    }
  }

  private initializeTemplates(): void {
    const templates: CodeTemplate[] = [
      {
        id: 'react-component',
        name: 'React Component',
        description: 'Functional React component with TypeScript',
        category: 'component',
        framework: 'react',
        language: 'typescript',
        template: `import React from 'react';

interface {{componentName}}Props {
  {{#each props}}
  {{name}}: {{type}};
  {{/each}}
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  {{#each props}}{{name}}{{#unless @last}}, {{/unless}}{{/each}}
}) => {
  return (
    <div className="{{className}}">
      {{content}}
    </div>
  );
};

export default {{componentName}};`,
        variables: [
          { name: 'componentName', description: 'Component name', type: 'string', required: true },
          { name: 'className', description: 'CSS class name', type: 'string', required: false, default: '' },
          { name: 'content', description: 'Component content', type: 'string', required: false, default: 'Hello World' }
        ]
      },
      {
        id: 'express-route',
        name: 'Express Route',
        description: 'Express.js route handler with TypeScript',
        category: 'api',
        framework: 'express',
        language: 'typescript',
        template: `import { Request, Response } from 'express';

export const {{routeName}} = async (req: Request, res: Response) => {
  try {
    {{#if hasValidation}}
    // Validate request
    const { {{#each params}}{{name}}{{#unless @last}}, {{/unless}}{{/each}} } = req.{{paramSource}};
    {{/if}}

    // {{description}}
    {{implementation}}

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in {{routeName}}:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};`,
        variables: [
          { name: 'routeName', description: 'Route handler name', type: 'string', required: true },
          { name: 'description', description: 'Route description', type: 'string', required: true },
          { name: 'implementation', description: 'Route implementation', type: 'string', required: false, default: 'const result = {};' }
        ]
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }
}
