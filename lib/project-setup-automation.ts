'use client'

import { AIService } from './ai-service';
import { AISettings, AIMessage } from './ai-config';
import { WorkflowStep } from './ai-terminal-bridge';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'desktop' | 'library';
  framework: string;
  language: string;
  features: string[];
  estimatedTime: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  workflow: WorkflowStep[];
}

export interface ProjectSetupRequest {
  projectName: string;
  description?: string;
  framework?: string;
  language?: string;
  features?: string[];
  targetDirectory?: string;
  customRequirements?: string;
}

export interface SetupProgress {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  output?: string;
  error?: string;
}

export class ProjectSetupAutomation {
  private aiService: AIService;
  private templates: Map<string, ProjectTemplate> = new Map();
  private setupProgress: SetupProgress | null = null;

  constructor(aiSettings: AISettings) {
    this.aiService = new AIService(aiSettings);
    this.initializeTemplates();
  }

  // Get available project templates
  getTemplates(category?: ProjectTemplate['category']): ProjectTemplate[] {
    const allTemplates = Array.from(this.templates.values());
    return category 
      ? allTemplates.filter(t => t.category === category)
      : allTemplates;
  }

  // Detect project type from existing files
  async detectProjectType(files: string[]): Promise<{
    framework: string;
    language: string;
    confidence: number;
    suggestions: string[];
  }> {
    const detectionRules = [
      { files: ['package.json'], check: (content: string) => content.includes('"next"'), result: { framework: 'Next.js', language: 'TypeScript' } },
      { files: ['package.json'], check: (content: string) => content.includes('"react"'), result: { framework: 'React', language: 'JavaScript' } },
      { files: ['package.json'], check: (content: string) => content.includes('"vue"'), result: { framework: 'Vue.js', language: 'JavaScript' } },
      { files: ['package.json'], check: (content: string) => content.includes('"angular"'), result: { framework: 'Angular', language: 'TypeScript' } },
      { files: ['vite.config.js', 'vite.config.ts'], check: () => true, result: { framework: 'Vite', language: 'JavaScript' } },
      { files: ['nuxt.config.js', 'nuxt.config.ts'], check: () => true, result: { framework: 'Nuxt.js', language: 'JavaScript' } },
      { files: ['svelte.config.js'], check: () => true, result: { framework: 'Svelte', language: 'JavaScript' } },
      { files: ['requirements.txt'], check: () => true, result: { framework: 'Python', language: 'Python' } },
      { files: ['Cargo.toml'], check: () => true, result: { framework: 'Rust', language: 'Rust' } },
      { files: ['go.mod'], check: () => true, result: { framework: 'Go', language: 'Go' } }
    ];

    for (const rule of detectionRules) {
      if (rule.files.some(file => files.includes(file))) {
        return {
          framework: rule.result.framework,
          language: rule.result.language,
          confidence: 0.9,
          suggestions: [`Detected ${rule.result.framework} project`]
        };
      }
    }

    return {
      framework: 'Unknown',
      language: 'Unknown',
      confidence: 0.1,
      suggestions: ['Could not detect project type', 'Consider initializing a new project']
    };
  }

  // Generate custom project setup workflow
  async generateCustomWorkflow(request: ProjectSetupRequest): Promise<WorkflowStep[]> {
    const systemPrompt = this.buildWorkflowPrompt();
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
      return this.parseWorkflowResponse(response.content);
    } catch (error) {
      console.error('Error generating custom workflow:', error);
      return this.getFallbackWorkflow(request);
    }
  }

  // Get template by ID
  getTemplate(templateId: string): ProjectTemplate | null {
    return this.templates.get(templateId) || null;
  }

  // Get setup progress
  getSetupProgress(): SetupProgress | null {
    return this.setupProgress;
  }

  // Update setup progress
  updateSetupProgress(progress: Partial<SetupProgress>): void {
    this.setupProgress = {
      ...this.setupProgress,
      ...progress
    } as SetupProgress;
  }

  // Get recommended templates based on requirements
  getRecommendedTemplates(requirements: string): ProjectTemplate[] {
    const keywords = requirements.toLowerCase();
    const scored = Array.from(this.templates.values()).map(template => {
      let score = 0;
      
      // Check framework match
      if (keywords.includes(template.framework.toLowerCase())) score += 3;
      
      // Check language match
      if (keywords.includes(template.language.toLowerCase())) score += 2;
      
      // Check features match
      template.features.forEach(feature => {
        if (keywords.includes(feature.toLowerCase())) score += 1;
      });
      
      // Check category relevance
      if (keywords.includes(template.category)) score += 1;
      
      return { template, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.template);
  }

  private buildWorkflowPrompt(): string {
    return `You are an expert project setup assistant. Create detailed step-by-step workflows for setting up development projects.

    Return a JSON array of workflow steps with this structure:
    [
      {
        "id": "step1",
        "title": "Step Title",
        "description": "Detailed description of what this step does",
        "commands": ["command1", "command2"],
        "expectedOutput": "What to expect when this step completes",
        "onError": "What to do if this step fails",
        "dependencies": ["previous_step_id"]
      }
    ]

    Guidelines:
    1. Include all necessary setup steps
    2. Consider dependencies and prerequisites
    3. Provide clear, actionable commands
    4. Include error handling guidance
    5. Optimize for developer experience
    6. Consider best practices and security`;
  }

  private buildRequestPrompt(request: ProjectSetupRequest): string {
    return `Create a project setup workflow for:

    Project Name: ${request.projectName}
    Description: ${request.description || 'No description provided'}
    Framework: ${request.framework || 'Not specified'}
    Language: ${request.language || 'Not specified'}
    Features: ${request.features?.join(', ') || 'None specified'}
    Target Directory: ${request.targetDirectory || './'}
    Custom Requirements: ${request.customRequirements || 'None'}

    Please create a comprehensive setup workflow that includes:
    1. Project initialization
    2. Dependency installation
    3. Configuration setup
    4. Development environment preparation
    5. Initial file structure creation
    6. Basic testing setup
    7. Documentation setup`;
  }

  private parseWorkflowResponse(content: string): WorkflowStep[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((step: any) => ({
          id: step.id || `step-${Date.now()}`,
          title: step.title || 'Untitled Step',
          description: step.description || '',
          commands: step.commands || [],
          expectedOutput: step.expectedOutput,
          onError: step.onError,
          dependencies: step.dependencies || []
        }));
      }
    } catch (error) {
      console.error('Error parsing workflow response:', error);
    }
    
    return [];
  }

  private getFallbackWorkflow(request: ProjectSetupRequest): WorkflowStep[] {
    const projectName = request.projectName || 'my-project';
    
    return [
      {
        id: 'init',
        title: 'Initialize Project',
        description: 'Create project directory and initialize',
        commands: [
          `mkdir ${projectName}`,
          `cd ${projectName}`,
          'npm init -y'
        ],
        expectedOutput: 'Project directory created with package.json',
        onError: 'Check if directory already exists or permissions'
      },
      {
        id: 'install',
        title: 'Install Dependencies',
        description: 'Install basic development dependencies',
        commands: ['npm install'],
        expectedOutput: 'Dependencies installed successfully',
        onError: 'Check internet connection and npm configuration',
        dependencies: ['init']
      },
      {
        id: 'setup',
        title: 'Setup Development Environment',
        description: 'Create basic project structure',
        commands: [
          'mkdir src',
          'touch src/index.js',
          'touch README.md'
        ],
        expectedOutput: 'Basic project structure created',
        onError: 'Check file permissions',
        dependencies: ['install']
      }
    ];
  }

  private initializeTemplates(): void {
    const templates: ProjectTemplate[] = [
      {
        id: 'react-typescript',
        name: 'React + TypeScript',
        description: 'Modern React application with TypeScript, Vite, and essential tools',
        category: 'frontend',
        framework: 'React',
        language: 'TypeScript',
        features: ['TypeScript', 'Vite', 'ESLint', 'Prettier', 'Testing'],
        estimatedTime: '5-10 minutes',
        complexity: 'intermediate',
        prerequisites: ['Node.js 16+', 'npm or yarn'],
        workflow: [
          {
            id: 'create-vite',
            title: 'Create Vite Project',
            description: 'Initialize React TypeScript project with Vite',
            commands: ['npm create vite@latest . -- --template react-ts'],
            expectedOutput: 'Vite project created with React TypeScript template'
          },
          {
            id: 'install-deps',
            title: 'Install Dependencies',
            description: 'Install project dependencies',
            commands: ['npm install'],
            expectedOutput: 'All dependencies installed successfully',
            dependencies: ['create-vite']
          },
          {
            id: 'setup-eslint',
            title: 'Setup ESLint',
            description: 'Configure ESLint for code quality',
            commands: ['npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser'],
            expectedOutput: 'ESLint configured for TypeScript',
            dependencies: ['install-deps']
          }
        ]
      },
      {
        id: 'nextjs-app',
        name: 'Next.js Application',
        description: 'Full-stack Next.js application with App Router',
        category: 'fullstack',
        framework: 'Next.js',
        language: 'TypeScript',
        features: ['App Router', 'TypeScript', 'Tailwind CSS', 'ESLint'],
        estimatedTime: '3-7 minutes',
        complexity: 'intermediate',
        prerequisites: ['Node.js 18+', 'npm or yarn'],
        workflow: [
          {
            id: 'create-next',
            title: 'Create Next.js App',
            description: 'Initialize Next.js project with TypeScript',
            commands: ['npx create-next-app@latest . --typescript --tailwind --eslint --app'],
            expectedOutput: 'Next.js project created with TypeScript and Tailwind'
          },
          {
            id: 'install-deps',
            title: 'Install Dependencies',
            description: 'Install additional dependencies',
            commands: ['npm install'],
            expectedOutput: 'Dependencies installed',
            dependencies: ['create-next']
          }
        ]
      },
      {
        id: 'node-express',
        name: 'Node.js + Express API',
        description: 'RESTful API with Express, TypeScript, and essential middleware',
        category: 'backend',
        framework: 'Express',
        language: 'TypeScript',
        features: ['Express', 'TypeScript', 'CORS', 'Morgan', 'Helmet'],
        estimatedTime: '5-8 minutes',
        complexity: 'intermediate',
        prerequisites: ['Node.js 16+', 'npm or yarn'],
        workflow: [
          {
            id: 'init-project',
            title: 'Initialize Project',
            description: 'Create package.json and basic structure',
            commands: ['npm init -y', 'mkdir src', 'mkdir src/routes'],
            expectedOutput: 'Project structure created'
          },
          {
            id: 'install-deps',
            title: 'Install Dependencies',
            description: 'Install Express and TypeScript dependencies',
            commands: [
              'npm install express cors helmet morgan',
              'npm install -D typescript @types/node @types/express @types/cors @types/morgan ts-node nodemon'
            ],
            expectedOutput: 'All dependencies installed',
            dependencies: ['init-project']
          },
          {
            id: 'setup-typescript',
            title: 'Setup TypeScript',
            description: 'Configure TypeScript compilation',
            commands: ['npx tsc --init'],
            expectedOutput: 'TypeScript configuration created',
            dependencies: ['install-deps']
          }
        ]
      },
      {
        id: 'vue-composition',
        name: 'Vue 3 + Composition API',
        description: 'Modern Vue 3 application with Composition API and Vite',
        category: 'frontend',
        framework: 'Vue.js',
        language: 'TypeScript',
        features: ['Vue 3', 'Composition API', 'Vite', 'TypeScript'],
        estimatedTime: '4-6 minutes',
        complexity: 'intermediate',
        prerequisites: ['Node.js 16+', 'npm or yarn'],
        workflow: [
          {
            id: 'create-vue',
            title: 'Create Vue Project',
            description: 'Initialize Vue 3 project with Vite',
            commands: ['npm create vue@latest . -- --typescript --router --pinia'],
            expectedOutput: 'Vue 3 project created with TypeScript'
          },
          {
            id: 'install-deps',
            title: 'Install Dependencies',
            description: 'Install project dependencies',
            commands: ['npm install'],
            expectedOutput: 'Dependencies installed successfully',
            dependencies: ['create-vue']
          }
        ]
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }
}
