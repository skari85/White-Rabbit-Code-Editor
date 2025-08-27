import { AISettings } from './ai-config';
import { AIService } from './ai-service';

export interface LiveTemplate {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  template: string;
  variables: TemplateVariable[];
  context: TemplateContext[];
  category: string;
  language: string[];
  framework?: string;
  author?: string;
  isBuiltIn: boolean;
  isActive: boolean;
  usageCount: number;
  lastUsed?: Date;
}

export interface TemplateVariable {
  name: string;
  expression?: string;
  defaultValue?: string;
  skipIfDefined?: boolean;
  alwaysStopAt?: boolean;
}

export interface TemplateContext {
  type: 'file-type' | 'framework' | 'scope' | 'custom';
  value: string;
  condition?: string;
}

export interface TemplateExpansion {
  template: LiveTemplate;
  expandedText: string;
  cursorPositions: Array<{ line: number; column: number; variable?: string }>;
  tabStops: Array<{ order: number; line: number; column: number; length: number; variable: string }>;
}

export interface GenerationRequest {
  type: 'component' | 'function' | 'class' | 'test' | 'api' | 'custom';
  framework?: string;
  language: string;
  name: string;
  options: Record<string, any>;
  context?: {
    existingCode?: string;
    relatedFiles?: Array<{ name: string; content: string }>;
  };
}

export class TemplateService {
  private aiService: AIService | null = null;
  private templates = new Map<string, LiveTemplate>();
  private customTemplates = new Map<string, LiveTemplate>();

  constructor(aiSettings?: AISettings) {
    if (aiSettings?.apiKey && aiSettings.provider) {
      this.aiService = new AIService(aiSettings);
    }
    this.initializeBuiltInTemplates();
    this.loadCustomTemplates();
  }

  updateAISettings(aiSettings: AISettings) {
    if (aiSettings.apiKey && aiSettings.provider) {
      this.aiService = new AIService(aiSettings);
    } else {
      this.aiService = null;
    }
  }

  // Get available templates for current context
  getAvailableTemplates(
    language: string,
    framework?: string,
    fileType?: string,
    scope?: string
  ): LiveTemplate[] {
    const allTemplates = [...this.templates.values(), ...this.customTemplates.values()];
    
    return allTemplates
      .filter(template => {
        if (!template.isActive) return false;
        if (!template.language.includes(language)) return false;
        
        // Check framework context
        if (framework && template.framework && template.framework !== framework) {
          return false;
        }
        
        // Check context conditions
        return template.context.every(ctx => {
          switch (ctx.type) {
            case 'file-type':
              return !fileType || fileType === ctx.value;
            case 'framework':
              return !framework || framework === ctx.value;
            case 'scope':
              return !scope || scope === ctx.value;
            default:
              return true;
          }
        });
      })
      .sort((a, b) => {
        // Sort by usage count and recency
        if (a.usageCount !== b.usageCount) {
          return b.usageCount - a.usageCount;
        }
        if (a.lastUsed && b.lastUsed) {
          return b.lastUsed.getTime() - a.lastUsed.getTime();
        }
        return a.name.localeCompare(b.name);
      });
  }

  // Expand template
  async expandTemplate(
    template: LiveTemplate,
    variables: Record<string, string> = {},
    context?: { line: number; column: number; indentation?: string }
  ): Promise<TemplateExpansion> {
    let expandedText = template.template;
    const tabStops: Array<{ order: number; line: number; column: number; length: number; variable: string }> = [];
    const cursorPositions: Array<{ line: number; column: number; variable?: string }> = [];

    // Apply indentation if provided
    if (context?.indentation) {
      expandedText = expandedText
        .split('\n')
        .map((line, index) => index === 0 ? line : context.indentation + line)
        .join('\n');
    }

    // Process template variables
    for (const variable of template.variables) {
      const placeholder = `$${variable.name}$`;
      const value = variables[variable.name] || variable.defaultValue || '';
      
      // Replace all occurrences and track positions
      let searchIndex = 0;
      let index = expandedText.indexOf(placeholder, searchIndex);
      while (index !== -1) {
        
        // Calculate line and column
        const beforeText = expandedText.substring(0, index);
        const lines = beforeText.split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        
        // Replace placeholder
        expandedText = expandedText.substring(0, index) + value + expandedText.substring(index + placeholder.length);
        
        // Add tab stop if variable should stop
        if (variable.alwaysStopAt || !value) {
          tabStops.push({
            order: tabStops.length + 1,
            line: (context?.line || 1) + line - 1,
            column: (context?.column || 1) + column - 1,
            length: value.length,
            variable: variable.name
          });
        }

        searchIndex = index + value.length;
        index = expandedText.indexOf(placeholder, searchIndex);
      }
    }

    // Handle cursor position marker
    const cursorMarker = '$CURSOR$';
    const cursorIndex = expandedText.indexOf(cursorMarker);
    if (cursorIndex !== -1) {
      const beforeText = expandedText.substring(0, cursorIndex);
      const lines = beforeText.split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      
      cursorPositions.push({
        line: (context?.line || 1) + line - 1,
        column: (context?.column || 1) + column - 1
      });
      
      expandedText = expandedText.replace(cursorMarker, '');
    }

    // Update usage statistics
    template.usageCount++;
    template.lastUsed = new Date();
    this.saveTemplate(template);

    return {
      template,
      expandedText,
      cursorPositions,
      tabStops: tabStops.sort((a, b) => a.order - b.order)
    };
  }

  // AI-powered code generation
  async generateCode(request: GenerationRequest): Promise<string> {
    if (!this.aiService) {
      throw new Error('AI service not available for code generation');
    }

    const prompt = this.buildGenerationPrompt(request);
    
    try {
      const response = await this.aiService.sendMessage([{
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        timestamp: new Date()
      }]);

      // Extract code from response
      const codeMatch = response.content.match(/```[\w]*\n([\s\S]*?)\n```/);
      return codeMatch ? codeMatch[1] : response.content;
    } catch (error) {
      console.error('AI code generation failed:', error);
      throw error;
    }
  }

  // Create template from AI
  async createTemplateFromAI(
    description: string,
    language: string,
    framework?: string
  ): Promise<LiveTemplate> {
    if (!this.aiService) {
      throw new Error('AI service not available for template creation');
    }

    const prompt = `Create a live template for ${language}${framework ? ` with ${framework}` : ''} based on this description: "${description}"

Generate a JSON response with this structure:
{
  "name": "Template name",
  "abbreviation": "short abbreviation (3-8 chars)",
  "description": "Detailed description",
  "template": "Template code with variables like $VARIABLE_NAME$",
  "variables": [
    {
      "name": "VARIABLE_NAME",
      "defaultValue": "default value",
      "alwaysStopAt": true
    }
  ],
  "category": "category name"
}

Template should include:
- Proper indentation and formatting
- Meaningful variable placeholders
- $CURSOR$ marker for final cursor position
- Best practices for the language/framework

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
        const templateData = JSON.parse(jsonMatch[0]);
        
        const template: LiveTemplate = {
          id: `ai-${Date.now()}`,
          name: templateData.name,
          abbreviation: templateData.abbreviation,
          description: templateData.description,
          template: templateData.template,
          variables: templateData.variables || [],
          context: [
            { type: 'file-type', value: language }
          ],
          category: templateData.category || 'AI Generated',
          language: [language],
          framework,
          author: 'AI Assistant',
          isBuiltIn: false,
          isActive: true,
          usageCount: 0
        };

        if (framework) {
          template.context.push({ type: 'framework', value: framework });
        }

        this.saveTemplate(template);
        return template;
      }
    } catch (error) {
      console.error('AI template creation failed:', error);
    }

    throw new Error('Failed to create template from AI');
  }

  // Template management
  saveTemplate(template: LiveTemplate): void {
    if (template.isBuiltIn) {
      this.templates.set(template.id, template);
    } else {
      this.customTemplates.set(template.id, template);
      this.saveCustomTemplates();
    }
  }

  deleteTemplate(templateId: string): boolean {
    if (this.templates.has(templateId)) {
      const template = this.templates.get(templateId)!;
      if (!template.isBuiltIn) {
        this.templates.delete(templateId);
        return true;
      }
    }
    
    if (this.customTemplates.has(templateId)) {
      this.customTemplates.delete(templateId);
      this.saveCustomTemplates();
      return true;
    }
    
    return false;
  }

  getTemplate(templateId: string): LiveTemplate | undefined {
    return this.templates.get(templateId) || this.customTemplates.get(templateId);
  }

  getAllTemplates(): LiveTemplate[] {
    return [...this.templates.values(), ...this.customTemplates.values()];
  }

  // Search templates
  searchTemplates(query: string, language?: string): LiveTemplate[] {
    const queryLower = query.toLowerCase();
    const allTemplates = this.getAllTemplates();
    
    return allTemplates
      .filter(template => {
        if (language && !template.language.includes(language)) return false;
        
        return (
          template.name.toLowerCase().includes(queryLower) ||
          template.abbreviation.toLowerCase().includes(queryLower) ||
          template.description.toLowerCase().includes(queryLower) ||
          template.category.toLowerCase().includes(queryLower)
        );
      })
      .sort((a, b) => {
        // Exact abbreviation match first
        if (a.abbreviation.toLowerCase() === queryLower) return -1;
        if (b.abbreviation.toLowerCase() === queryLower) return 1;
        
        // Then by usage count
        return b.usageCount - a.usageCount;
      });
  }

  private initializeBuiltInTemplates(): void {
    const builtInTemplates: Omit<LiveTemplate, 'id' | 'isBuiltIn' | 'usageCount' | 'lastUsed'>[] = [
      // JavaScript/TypeScript templates
      {
        name: 'Console Log',
        abbreviation: 'log',
        description: 'Console.log statement',
        template: 'console.log($MESSAGE$);$CURSOR$',
        variables: [
          { name: 'MESSAGE', defaultValue: 'message', alwaysStopAt: true }
        ],
        context: [{ type: 'file-type', value: 'javascript' }],
        category: 'Debug',
        language: ['javascript', 'typescript'],
        isActive: true
      },
      {
        name: 'Function Declaration',
        abbreviation: 'func',
        description: 'Function declaration',
        template: 'function $NAME$($PARAMS$) {\n  $CURSOR$\n}',
        variables: [
          { name: 'NAME', defaultValue: 'functionName', alwaysStopAt: true },
          { name: 'PARAMS', defaultValue: '', alwaysStopAt: true }
        ],
        context: [{ type: 'file-type', value: 'javascript' }],
        category: 'Functions',
        language: ['javascript', 'typescript'],
        isActive: true
      },
      {
        name: 'Arrow Function',
        abbreviation: 'arrow',
        description: 'Arrow function',
        template: 'const $NAME$ = ($PARAMS$) => {\n  $CURSOR$\n};',
        variables: [
          { name: 'NAME', defaultValue: 'functionName', alwaysStopAt: true },
          { name: 'PARAMS', defaultValue: '', alwaysStopAt: true }
        ],
        context: [{ type: 'file-type', value: 'javascript' }],
        category: 'Functions',
        language: ['javascript', 'typescript'],
        isActive: true
      },
      // React templates
      {
        name: 'React Functional Component',
        abbreviation: 'rfc',
        description: 'React functional component',
        template: 'import React from \'react\';\n\ninterface $NAME$Props {\n  $PROPS$\n}\n\nconst $NAME$: React.FC<$NAME$Props> = ({ $PROP_NAMES$ }) => {\n  return (\n    <div>\n      $CURSOR$\n    </div>\n  );\n};\n\nexport default $NAME$;',
        variables: [
          { name: 'NAME', defaultValue: 'Component', alwaysStopAt: true },
          { name: 'PROPS', defaultValue: '', alwaysStopAt: true },
          { name: 'PROP_NAMES', defaultValue: '', alwaysStopAt: true }
        ],
        context: [
          { type: 'file-type', value: 'typescript' },
          { type: 'framework', value: 'react' }
        ],
        category: 'React',
        language: ['typescript', 'javascript'],
        framework: 'react',
        isActive: true
      },
      {
        name: 'React useState Hook',
        abbreviation: 'useState',
        description: 'React useState hook',
        template: 'const [$STATE$, set$STATE_CAPITALIZED$] = useState<$TYPE$>($INITIAL_VALUE$);$CURSOR$',
        variables: [
          { name: 'STATE', defaultValue: 'state', alwaysStopAt: true },
          { name: 'STATE_CAPITALIZED', defaultValue: 'State', alwaysStopAt: true },
          { name: 'TYPE', defaultValue: 'string', alwaysStopAt: true },
          { name: 'INITIAL_VALUE', defaultValue: "''", alwaysStopAt: true }
        ],
        context: [
          { type: 'framework', value: 'react' }
        ],
        category: 'React Hooks',
        language: ['typescript', 'javascript'],
        framework: 'react',
        isActive: true
      },
      // HTML templates
      {
        name: 'HTML5 Document',
        abbreviation: 'html5',
        description: 'HTML5 document structure',
        template: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>$TITLE$</title>\n</head>\n<body>\n  $CURSOR$\n</body>\n</html>',
        variables: [
          { name: 'TITLE', defaultValue: 'Document', alwaysStopAt: true }
        ],
        context: [{ type: 'file-type', value: 'html' }],
        category: 'HTML',
        language: ['html'],
        isActive: true
      },
      // CSS templates
      {
        name: 'CSS Flexbox Container',
        abbreviation: 'flex',
        description: 'Flexbox container',
        template: 'display: flex;\njustify-content: $JUSTIFY$;\nalign-items: $ALIGN$;\n$CURSOR$',
        variables: [
          { name: 'JUSTIFY', defaultValue: 'center', alwaysStopAt: true },
          { name: 'ALIGN', defaultValue: 'center', alwaysStopAt: true }
        ],
        context: [{ type: 'file-type', value: 'css' }],
        category: 'CSS Layout',
        language: ['css', 'scss'],
        isActive: true
      }
    ];

    builtInTemplates.forEach((templateData, index) => {
      const template: LiveTemplate = {
        ...templateData,
        id: `builtin-${index}`,
        isBuiltIn: true,
        usageCount: 0
      };
      this.templates.set(template.id, template);
    });
  }

  private loadCustomTemplates(): void {
    try {
      const stored = localStorage.getItem('white-rabbit-custom-templates');
      if (stored) {
        const templates = JSON.parse(stored);
        templates.forEach((template: LiveTemplate) => {
          this.customTemplates.set(template.id, template);
        });
      }
    } catch (error) {
      console.warn('Failed to load custom templates:', error);
    }
  }

  private saveCustomTemplates(): void {
    try {
      const templates = Array.from(this.customTemplates.values());
      localStorage.setItem('white-rabbit-custom-templates', JSON.stringify(templates));
    } catch (error) {
      console.warn('Failed to save custom templates:', error);
    }
  }

  private buildGenerationPrompt(request: GenerationRequest): string {
    let prompt = `Generate ${request.language} code for a ${request.type}`;
    
    if (request.framework) {
      prompt += ` using ${request.framework}`;
    }
    
    prompt += `.\n\nRequirements:\n- Name: ${request.name}\n`;
    
    // Add specific options based on type
    Object.entries(request.options).forEach(([key, value]) => {
      prompt += `- ${key}: ${value}\n`;
    });
    
    if (request.context?.existingCode) {
      prompt += `\nExisting code context:\n\`\`\`${request.language}\n${request.context.existingCode}\n\`\`\`\n`;
    }
    
    if (request.context?.relatedFiles) {
      prompt += '\nRelated files:\n';
      request.context.relatedFiles.forEach(file => {
        prompt += `${file.name}:\n\`\`\`\n${file.content.substring(0, 500)}\n\`\`\`\n\n`;
      });
    }
    
    prompt += `\nGenerate clean, well-documented, production-ready code following best practices for ${request.language}`;
    if (request.framework) {
      prompt += ` and ${request.framework}`;
    }
    prompt += '. Include proper typing for TypeScript, error handling where appropriate, and clear comments.';
    
    return prompt;
  }
}
