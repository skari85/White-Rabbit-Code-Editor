import { AISettings } from './ai-config';
import { AIService } from './ai-service';

export interface ProjectArchitecture {
  id: string;
  name: string;
  description: string;
  framework: string;
  structure: FileStructure[];
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
  configuration: Record<string, any>;
  estimatedComplexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  estimatedTimeHours: number;
  recommendations: string[];
}

export interface FileStructure {
  path: string;
  type: 'file' | 'directory';
  content?: string;
  description: string;
  importance: 'critical' | 'important' | 'optional';
  dependencies: string[];
}

export interface BugPrediction {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'syntax' | 'logic' | 'performance' | 'security' | 'compatibility';
  location: {
    file: string;
    line?: number;
    column?: number;
    function?: string;
  };
  description: string;
  likelihood: number; // 0-1
  impact: string;
  suggestedFix: string;
  preventionTips: string[];
  relatedPatterns: string[];
}

export interface ArchitectureAnalysis {
  architecture: ProjectArchitecture;
  predictions: BugPrediction[];
  qualityScore: number; // 0-100
  securityScore: number; // 0-100
  performanceScore: number; // 0-100
  maintainabilityScore: number; // 0-100
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export class AIDevelopmentOracle {
  private aiService: AIService;
  private analysisCache: Map<string, ArchitectureAnalysis> = new Map();
  private predictionHistory: BugPrediction[] = [];

  constructor(settings: AISettings) {
    this.aiService = new AIService(settings);
  }

  /**
   * Generate complete application architecture from natural language description
   */
  async generateArchitecture(description: string, preferences?: {
    framework?: string;
    complexity?: 'simple' | 'moderate' | 'complex';
    features?: string[];
    constraints?: string[];
  }): Promise<ProjectArchitecture> {
    // Check if AI service is available
    if (!this.aiService) {
      console.warn('AI Development Oracle: No AI service available. Please configure API keys.');
      throw new Error('AI service not available. Please configure API keys.');
    }
    
    const prompt = this.buildArchitecturePrompt(description, preferences);
    
    try {
      const response = await this.aiService.sendMessage([
        { 
          id: 'arch-gen', 
          role: 'user', 
          content: prompt, 
          timestamp: new Date() 
        }
      ]);

      const architecture = this.parseArchitectureResponse(response.content);
      return architecture;
    } catch (error) {
      console.error('Architecture generation failed:', error);
      throw new Error(`Failed to generate architecture: ${error}`);
    }
  }

  /**
   * Predict potential bugs and issues in code/architecture
   */
  async predictBugs(
    files: Array<{ name: string; content: string; type: string }>,
    architecture?: ProjectArchitecture
  ): Promise<BugPrediction[]> {
    // Check if AI service is available
    if (!this.aiService) {
      console.warn('AI Development Oracle: No AI service available. Please configure API keys.');
      return [];
    }
    
    const analysisPrompt = this.buildBugPredictionPrompt(files, architecture);
    
    try {
      const response = await this.aiService.sendMessage([
        { 
          id: 'bug-pred', 
          role: 'user', 
          content: analysisPrompt, 
          timestamp: new Date() 
        }
      ]);

      const predictions = this.parseBugPredictions(response.content);
      this.predictionHistory.push(...predictions);
      return predictions;
    } catch (error) {
      console.error('Bug prediction failed:', error);
      return [];
    }
  }

  /**
   * Comprehensive analysis combining architecture and bug prediction
   */
  async analyzeProject(
    description: string,
    existingFiles?: Array<{ name: string; content: string; type: string }>,
    preferences?: any
  ): Promise<ArchitectureAnalysis> {
    const cacheKey = this.generateCacheKey(description, existingFiles);
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    // Generate architecture
    const architecture = await this.generateArchitecture(description, preferences);
    
    // Predict bugs for generated architecture
    const predictions = await this.predictBugs(
      existingFiles || this.generateFilesFromArchitecture(architecture),
      architecture
    );

    // Calculate quality scores
    const qualityScores = this.calculateQualityScores(architecture, predictions);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(architecture, predictions);

    const analysis: ArchitectureAnalysis = {
      architecture,
      predictions,
      ...qualityScores,
      recommendations
    };

    this.analysisCache.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Learn from user patterns and improve predictions
   */
  async learnFromFeedback(
    predictionId: string,
    actualOutcome: 'correct' | 'incorrect' | 'partially_correct',
    userNotes?: string
  ): Promise<void> {
    // Store feedback for model improvement
    const feedback = {
      predictionId,
      outcome: actualOutcome,
      notes: userNotes,
      timestamp: new Date()
    };

    // In a real implementation, this would update the model
    console.log('Learning from feedback:', feedback);
  }

  private buildArchitecturePrompt(description: string, preferences?: any): string {
    return `
You are an expert software architect. Generate a complete, production-ready application architecture based on this description:

"${description}"

Preferences: ${JSON.stringify(preferences || {})}

Provide a detailed JSON response with:
1. Project structure (files and directories)
2. Dependencies and devDependencies
3. Configuration files
4. Build scripts
5. Estimated complexity and timeline
6. Best practice recommendations

Focus on:
- Modern, scalable architecture
- Security best practices
- Performance optimization
- Maintainability
- Testing strategy
- Deployment considerations

Return ONLY valid JSON in this exact format:
{
  "name": "project-name",
  "description": "detailed description",
  "framework": "chosen framework",
  "structure": [
    {
      "path": "src/components/App.tsx",
      "type": "file",
      "content": "// Generated code here",
      "description": "Main application component",
      "importance": "critical",
      "dependencies": ["react", "typescript"]
    }
  ],
  "dependencies": ["react", "typescript"],
  "devDependencies": ["@types/react", "vite"],
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "configuration": {},
  "estimatedComplexity": "moderate",
  "estimatedTimeHours": 40,
  "recommendations": ["Use TypeScript for type safety", "Implement proper error boundaries"]
}
`;
  }

  private buildBugPredictionPrompt(
    files: Array<{ name: string; content: string; type: string }>,
    architecture?: ProjectArchitecture
  ): string {
    const fileContents = files.map(f => `
File: ${f.name}
Type: ${f.type}
Content:
${f.content}
---`).join('\n');

    return `
You are an expert code analyzer and bug predictor. Analyze the following code and predict potential bugs, issues, and vulnerabilities.

${architecture ? `Architecture Context: ${JSON.stringify(architecture, null, 2)}` : ''}

Files to analyze:
${fileContents}

Predict potential issues and return ONLY valid JSON in this format:
{
  "predictions": [
    {
      "id": "unique-id",
      "severity": "high",
      "type": "security",
      "location": {
        "file": "src/component.tsx",
        "line": 42,
        "function": "handleSubmit"
      },
      "description": "Potential XSS vulnerability in user input handling",
      "likelihood": 0.8,
      "impact": "Could allow malicious script execution",
      "suggestedFix": "Sanitize user input before rendering",
      "preventionTips": ["Use proper input validation", "Implement CSP headers"],
      "relatedPatterns": ["input-validation", "xss-prevention"]
    }
  ]
}

Focus on:
- Security vulnerabilities
- Performance bottlenecks
- Logic errors
- Type safety issues
- Memory leaks
- Race conditions
- Accessibility issues
- SEO problems
`;
  }

  private parseArchitectureResponse(response: string): ProjectArchitecture {
    try {
      const parsed = JSON.parse(response);
      return {
        id: `arch-${Date.now()}`,
        ...parsed
      };
    } catch (error) {
      throw new Error('Failed to parse architecture response');
    }
  }

  private parseBugPredictions(response: string): BugPrediction[] {
    try {
      // Clean up the response - remove any non-JSON content
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Try to find JSON object in the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('No JSON found in bug predictions response');
        return [];
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.predictions || [];
    } catch (error) {
      console.error('Failed to parse bug predictions:', error);
      console.log('Raw response:', response);
      return [];
    }
  }

  private generateFilesFromArchitecture(architecture: ProjectArchitecture): Array<{ name: string; content: string; type: string }> {
    return architecture.structure
      .filter(item => item.type === 'file' && item.content)
      .map(item => ({
        name: item.path,
        content: item.content || '',
        type: this.getFileType(item.path)
      }));
  }

  private getFileType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'css': 'css',
      'html': 'html',
      'json': 'json'
    };
    return typeMap[ext || ''] || 'text';
  }

  private calculateQualityScores(architecture: ProjectArchitecture, predictions: BugPrediction[]): {
    qualityScore: number;
    securityScore: number;
    performanceScore: number;
    maintainabilityScore: number;
  } {
    const criticalIssues = predictions.filter(p => p.severity === 'critical').length;
    const highIssues = predictions.filter(p => p.severity === 'high').length;
    const securityIssues = predictions.filter(p => p.type === 'security').length;
    const performanceIssues = predictions.filter(p => p.type === 'performance').length;

    const baseScore = 100;
    const qualityScore = Math.max(0, baseScore - (criticalIssues * 20) - (highIssues * 10));
    const securityScore = Math.max(0, baseScore - (securityIssues * 15));
    const performanceScore = Math.max(0, baseScore - (performanceIssues * 12));
    const maintainabilityScore = Math.max(0, baseScore - (predictions.length * 2));

    return {
      qualityScore,
      securityScore,
      performanceScore,
      maintainabilityScore
    };
  }

  private async generateRecommendations(
    architecture: ProjectArchitecture,
    predictions: BugPrediction[]
  ): Promise<{ immediate: string[]; shortTerm: string[]; longTerm: string[] }> {
    const immediate = predictions
      .filter(p => p.severity === 'critical' || p.severity === 'high')
      .map(p => p.suggestedFix);

    const shortTerm = [
      'Implement comprehensive testing strategy',
      'Set up continuous integration pipeline',
      'Add error monitoring and logging'
    ];

    const longTerm = [
      'Consider microservices architecture for scalability',
      'Implement advanced caching strategies',
      'Plan for internationalization and accessibility'
    ];

    return { immediate, shortTerm, longTerm };
  }

  private generateCacheKey(description: string, files?: Array<{ name: string; content: string }>): string {
    const fileHash = files ? JSON.stringify(files.map(f => ({ name: f.name, size: f.content.length }))) : '';
    return `${description}-${fileHash}`.replace(/\s+/g, '-').toLowerCase();
  }

  updateSettings(settings: AISettings): void {
    this.aiService = new AIService(settings);
  }

  clearCache(): void {
    this.analysisCache.clear();
  }

  getPredictionHistory(): BugPrediction[] {
    return [...this.predictionHistory];
  }
}
