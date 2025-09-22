import { useCallback, useEffect, useRef, useState } from 'react';
import { AIDevelopmentOracle, ArchitectureAnalysis, BugPrediction, ProjectArchitecture } from '@/lib/ai-development-oracle';
import { AISettings } from '@/lib/ai-config';

export interface UseAIDevelopmentOracleOptions {
  aiSettings?: AISettings;
  autoAnalyze?: boolean;
  cacheResults?: boolean;
}

export interface OracleState {
  isGenerating: boolean;
  isPredicting: boolean;
  isAnalyzing: boolean;
  currentAnalysis: ArchitectureAnalysis | null;
  predictionHistory: BugPrediction[];
  error: string | null;
}

export function useAIDevelopmentOracle(options: UseAIDevelopmentOracleOptions = {}) {
  const { aiSettings, autoAnalyze = false, cacheResults = true } = options;
  
  // State
  const [state, setState] = useState<OracleState>({
    isGenerating: false,
    isPredicting: false,
    isAnalyzing: false,
    currentAnalysis: null,
    predictionHistory: [],
    error: null
  });

  // Oracle instance
  const oracleRef = useRef<AIDevelopmentOracle | null>(null);
  const analysisCache = useRef<Map<string, ArchitectureAnalysis>>(new Map());

  // Initialize oracle when settings are available
  useEffect(() => {
    if (aiSettings) {
      oracleRef.current = new AIDevelopmentOracle(aiSettings);
    }
  }, [aiSettings]);

  // Update state helper
  const updateState = useCallback((updates: Partial<OracleState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Generate complete application architecture from description
   */
  const generateArchitecture = useCallback(async (
    description: string,
    preferences?: {
      framework?: string;
      complexity?: 'simple' | 'moderate' | 'complex';
      features?: string[];
      constraints?: string[];
    }
  ): Promise<ProjectArchitecture | null> => {
    if (!oracleRef.current) {
      updateState({ error: 'AI Development Oracle not initialized' });
      return null;
    }

    updateState({ isGenerating: true, error: null });

    try {
      const architecture = await oracleRef.current.generateArchitecture(description, preferences);
      
      // If auto-analyze is enabled, also predict bugs
      if (autoAnalyze) {
        const predictions = await oracleRef.current.predictBugs([], architecture);
        const analysis: ArchitectureAnalysis = {
          architecture,
          predictions,
          qualityScore: calculateQualityScore(predictions),
          securityScore: calculateSecurityScore(predictions),
          performanceScore: calculatePerformanceScore(predictions),
          maintainabilityScore: calculateMaintainabilityScore(architecture),
          recommendations: generateRecommendations(architecture, predictions)
        };

        updateState({ 
          currentAnalysis: analysis,
          predictionHistory: [...state.predictionHistory, ...predictions]
        });

        // Cache the analysis
        if (cacheResults) {
          const cacheKey = generateCacheKey(description, preferences);
          analysisCache.current.set(cacheKey, analysis);
        }
      }

      return architecture;
    } catch (error) {
      updateState({ error: `Failed to generate architecture: ${error}` });
      return null;
    } finally {
      updateState({ isGenerating: false });
    }
  }, [autoAnalyze, cacheResults, state.predictionHistory]);

  /**
   * Predict bugs in existing code
   */
  const predictBugs = useCallback(async (
    files: Array<{ name: string; content: string; type: string }>,
    architecture?: ProjectArchitecture
  ): Promise<BugPrediction[]> => {
    if (!oracleRef.current) {
      updateState({ error: 'AI Development Oracle not initialized' });
      return [];
    }

    updateState({ isPredicting: true, error: null });

    try {
      const predictions = await oracleRef.current.predictBugs(files, architecture);
      
      updateState({ 
        predictionHistory: [...state.predictionHistory, ...predictions]
      });

      return predictions;
    } catch (error) {
      updateState({ error: `Failed to predict bugs: ${error}` });
      return [];
    } finally {
      updateState({ isPredicting: false });
    }
  }, [state.predictionHistory]);

  /**
   * Comprehensive project analysis
   */
  const analyzeProject = useCallback(async (
    description: string,
    existingFiles?: Array<{ name: string; content: string; type: string }>,
    preferences?: any
  ): Promise<ArchitectureAnalysis | null> => {
    if (!oracleRef.current) {
      updateState({ error: 'AI Development Oracle not initialized' });
      return null;
    }

    // Check cache first
    if (cacheResults) {
      const cacheKey = generateCacheKey(description, preferences, existingFiles);
      const cached = analysisCache.current.get(cacheKey);
      if (cached) {
        updateState({ currentAnalysis: cached });
        return cached;
      }
    }

    updateState({ isAnalyzing: true, error: null });

    try {
      const analysis = await oracleRef.current.analyzeProject(description, existingFiles, preferences);
      
      updateState({ 
        currentAnalysis: analysis,
        predictionHistory: [...state.predictionHistory, ...analysis.predictions]
      });

      // Cache the result
      if (cacheResults) {
        const cacheKey = generateCacheKey(description, preferences, existingFiles);
        analysisCache.current.set(cacheKey, analysis);
      }

      return analysis;
    } catch (error) {
      updateState({ error: `Failed to analyze project: ${error}` });
      return null;
    } finally {
      updateState({ isAnalyzing: false });
    }
  }, [cacheResults, state.predictionHistory]);

  /**
   * Learn from user feedback on predictions
   */
  const provideFeedback = useCallback(async (
    predictionId: string,
    outcome: 'correct' | 'incorrect' | 'partially_correct',
    notes?: string
  ): Promise<void> => {
    if (!oracleRef.current) return;

    try {
      await oracleRef.current.learnFromFeedback(predictionId, outcome, notes);
    } catch (error) {
      updateState({ error: `Failed to provide feedback: ${error}` });
    }
  }, []);

  /**
   * Clear analysis cache
   */
  const clearCache = useCallback(() => {
    analysisCache.current.clear();
    if (oracleRef.current) {
      oracleRef.current.clearCache();
    }
  }, []);

  /**
   * Clear prediction history
   */
  const clearHistory = useCallback(() => {
    updateState({ predictionHistory: [] });
  }, []);

  /**
   * Clear current analysis
   */
  const clearAnalysis = useCallback(() => {
    updateState({ currentAnalysis: null });
  }, []);

  /**
   * Get predictions by severity
   */
  const getPredictionsBySeverity = useCallback((severity: string) => {
    return state.predictionHistory.filter(p => p.severity === severity);
  }, [state.predictionHistory]);

  /**
   * Get predictions by type
   */
  const getPredictionsByType = useCallback((type: string) => {
    return state.predictionHistory.filter(p => p.type === type);
  }, [state.predictionHistory]);

  /**
   * Get overall project health score
   */
  const getHealthScore = useCallback(() => {
    if (!state.currentAnalysis) return null;

    const { qualityScore, securityScore, performanceScore, maintainabilityScore } = state.currentAnalysis;
    return Math.round((qualityScore + securityScore + performanceScore + maintainabilityScore) / 4);
  }, [state.currentAnalysis]);

  return {
    // State
    ...state,
    
    // Actions
    generateArchitecture,
    predictBugs,
    analyzeProject,
    provideFeedback,
    
    // Utilities
    clearCache,
    clearHistory,
    clearAnalysis,
    getPredictionsBySeverity,
    getPredictionsByType,
    getHealthScore,
    
    // Computed values
    isReady: !!oracleRef.current,
    hasAnalysis: !!state.currentAnalysis,
    totalPredictions: state.predictionHistory.length,
    criticalIssues: state.predictionHistory.filter(p => p.severity === 'critical').length,
    highIssues: state.predictionHistory.filter(p => p.severity === 'high').length
  };
}

// Helper functions
function calculateQualityScore(predictions: BugPrediction[]): number {
  const criticalCount = predictions.filter(p => p.severity === 'critical').length;
  const highCount = predictions.filter(p => p.severity === 'high').length;
  const mediumCount = predictions.filter(p => p.severity === 'medium').length;
  
  const baseScore = 100;
  const penalty = (criticalCount * 20) + (highCount * 10) + (mediumCount * 5);
  
  return Math.max(0, baseScore - penalty);
}

function calculateSecurityScore(predictions: BugPrediction[]): number {
  const securityIssues = predictions.filter(p => p.type === 'security');
  const criticalSecurity = securityIssues.filter(p => p.severity === 'critical').length;
  const highSecurity = securityIssues.filter(p => p.severity === 'high').length;
  
  const baseScore = 100;
  const penalty = (criticalSecurity * 25) + (highSecurity * 15);
  
  return Math.max(0, baseScore - penalty);
}

function calculatePerformanceScore(predictions: BugPrediction[]): number {
  const performanceIssues = predictions.filter(p => p.type === 'performance');
  const penalty = performanceIssues.length * 8;
  
  return Math.max(0, 100 - penalty);
}

function calculateMaintainabilityScore(architecture: ProjectArchitecture): number {
  const fileCount = architecture.structure.length;
  const complexityPenalty = architecture.estimatedComplexity === 'complex' ? 10 : 
                           architecture.estimatedComplexity === 'moderate' ? 5 : 0;
  
  // More files generally mean more complexity, but also better organization
  const filePenalty = Math.max(0, (fileCount - 20) * 0.5);
  
  return Math.max(0, 100 - complexityPenalty - filePenalty);
}

function generateRecommendations(
  architecture: ProjectArchitecture, 
  predictions: BugPrediction[]
): { immediate: string[]; shortTerm: string[]; longTerm: string[] } {
  const immediate = predictions
    .filter(p => p.severity === 'critical' || p.severity === 'high')
    .map(p => p.suggestedFix)
    .slice(0, 5); // Limit to top 5

  const shortTerm = [
    'Implement comprehensive testing strategy',
    'Set up continuous integration pipeline',
    'Add error monitoring and logging',
    'Implement code quality checks',
    'Set up automated security scanning'
  ];

  const longTerm = [
    'Consider microservices architecture for scalability',
    'Implement advanced caching strategies',
    'Plan for internationalization and accessibility',
    'Design for observability and monitoring',
    'Establish code review and documentation standards'
  ];

  return { immediate, shortTerm, longTerm };
}

function generateCacheKey(
  description: string, 
  preferences?: any, 
  files?: Array<{ name: string; content: string }>
): string {
  const prefStr = preferences ? JSON.stringify(preferences) : '';
  const fileStr = files ? JSON.stringify(files.map(f => ({ name: f.name, size: f.content.length }))) : '';
  
  return `${description}-${prefStr}-${fileStr}`.replace(/\s+/g, '-').toLowerCase();
}
