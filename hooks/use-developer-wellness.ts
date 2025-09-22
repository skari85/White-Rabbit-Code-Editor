import { useCallback, useEffect, useRef, useState } from 'react';
import { DeveloperWellnessService, CodingSession, WellnessMetrics, WellnessRecommendation, AdaptiveTheme } from '@/lib/developer-wellness-service';

export interface UseDeveloperWellnessOptions {
  autoStart?: boolean;
  trackKeystrokes?: boolean;
  trackFileChanges?: boolean;
  adaptiveThemes?: boolean;
  breakReminders?: boolean;
}

export interface WellnessState {
  isTracking: boolean;
  currentSession: CodingSession | null;
  wellnessMetrics: WellnessMetrics | null;
  recommendations: WellnessRecommendation[];
  wellnessScore: number;
  currentTheme: AdaptiveTheme | null;
  productivityInsights: any;
}

export function useDeveloperWellness(options: UseDeveloperWellnessOptions = {}) {
  const {
    autoStart = false,
    trackKeystrokes = true,
    trackFileChanges = true,
    adaptiveThemes = true,
    breakReminders = true
  } = options;

  // State
  const [state, setState] = useState<WellnessState>({
    isTracking: false,
    currentSession: null,
    wellnessMetrics: null,
    recommendations: [],
    wellnessScore: 100,
    currentTheme: null,
    productivityInsights: null
  });

  // Service reference
  const wellnessServiceRef = useRef<DeveloperWellnessService | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const keystrokeCountRef = useRef(0);

  // Initialize service
  useEffect(() => {
    wellnessServiceRef.current = new DeveloperWellnessService();
    
    if (autoStart) {
      startTracking();
    }

    updateWellnessData();

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [autoStart]);

  // Update state helper
  const updateState = useCallback((updates: Partial<WellnessState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Update wellness data
  const updateWellnessData = useCallback(() => {
    if (!wellnessServiceRef.current) return;

    const currentSession = wellnessServiceRef.current.getCurrentSession();
    const wellnessMetrics = wellnessServiceRef.current.getWellnessMetrics();
    const recommendations = wellnessServiceRef.current.getRecommendations();
    const wellnessScore = wellnessServiceRef.current.getOverallWellnessScore();
    const productivityInsights = wellnessServiceRef.current.getProductivityInsights();
    
    let currentTheme = null;
    if (adaptiveThemes) {
      currentTheme = wellnessServiceRef.current.getAdaptiveTheme();
    }

    updateState({
      currentSession,
      wellnessMetrics,
      recommendations,
      wellnessScore,
      currentTheme,
      productivityInsights
    });
  }, [adaptiveThemes, updateState]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!wellnessServiceRef.current) return;

    wellnessServiceRef.current.startSession();
    updateState({ isTracking: true });

    // Set up periodic updates
    updateIntervalRef.current = setInterval(() => {
      updateWellnessData();
    }, 30000); // Update every 30 seconds

    updateWellnessData();
  }, [updateWellnessData, updateState]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (!wellnessServiceRef.current) return;

    wellnessServiceRef.current.endSession();
    updateState({ isTracking: false });

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    updateWellnessData();
  }, [updateWellnessData, updateState]);

  // Track keystroke activity
  const trackKeystroke = useCallback(() => {
    if (!wellnessServiceRef.current || !state.isTracking || !trackKeystrokes) return;

    keystrokeCountRef.current += 1;

    // Batch keystroke updates every 10 keystrokes
    if (keystrokeCountRef.current % 10 === 0) {
      wellnessServiceRef.current.trackActivity({
        keystrokes: 10
      });
    }
  }, [state.isTracking, trackKeystrokes]);

  // Track file changes
  const trackFileChange = useCallback((fileName: string, linesAdded: number = 0, linesRemoved: number = 0) => {
    if (!wellnessServiceRef.current || !state.isTracking || !trackFileChanges) return;

    wellnessServiceRef.current.trackActivity({
      fileModified: fileName,
      linesAdded,
      linesRemoved
    });
  }, [state.isTracking, trackFileChanges]);

  // Track focus level
  const trackFocusLevel = useCallback((focusLevel: number) => {
    if (!wellnessServiceRef.current || !state.isTracking) return;

    wellnessServiceRef.current.trackActivity({
      focusLevel
    });
  }, [state.isTracking]);

  // Take a break
  const takeBreak = useCallback((type: 'micro' | 'short' | 'long' = 'short', reason?: string) => {
    if (!wellnessServiceRef.current) return null;

    const breakId = wellnessServiceRef.current.takeBreak(type, reason);
    updateWellnessData();
    return breakId;
  }, [updateWellnessData]);

  // End a break
  const endBreak = useCallback((breakId: string, effectiveness: number = 80) => {
    if (!wellnessServiceRef.current) return;

    wellnessServiceRef.current.endBreak(breakId, effectiveness);
    updateWellnessData();
  }, [updateWellnessData]);

  // Dismiss recommendation
  const dismissRecommendation = useCallback((recommendationId: string) => {
    if (!wellnessServiceRef.current) return;

    wellnessServiceRef.current.dismissRecommendation(recommendationId);
    updateWellnessData();
  }, [updateWellnessData]);

  // Get adaptive theme
  const getAdaptiveTheme = useCallback((conditions?: {
    eyeStrain?: boolean;
    longSession?: boolean;
    timeOverride?: 'morning' | 'afternoon' | 'evening' | 'night';
  }) => {
    if (!wellnessServiceRef.current) return null;

    if (conditions) {
      return wellnessServiceRef.current.adaptThemeForConditions(conditions);
    }

    return wellnessServiceRef.current.getAdaptiveTheme();
  }, []);

  // Get session history
  const getSessionHistory = useCallback(() => {
    if (!wellnessServiceRef.current) return [];
    return wellnessServiceRef.current.getSessionHistory();
  }, []);

  // Export wellness data
  const exportWellnessData = useCallback(() => {
    if (!wellnessServiceRef.current) return null;
    return wellnessServiceRef.current.exportWellnessData();
  }, []);

  // Get wellness insights
  const getWellnessInsights = useCallback(() => {
    const sessionHistory = getSessionHistory();
    const currentMetrics = state.wellnessMetrics;
    
    if (!currentMetrics || sessionHistory.length === 0) {
      return {
        totalSessions: 0,
        averageSessionLength: 0,
        totalCodingTime: 0,
        breakFrequency: 0,
        productivityTrend: 'stable' as const,
        healthRisks: []
      };
    }

    const totalSessions = sessionHistory.length;
    const averageSessionLength = sessionHistory.reduce((sum, s) => sum + s.duration, 0) / totalSessions;
    const totalCodingTime = sessionHistory.reduce((sum, s) => sum + s.duration, 0);
    const totalBreaks = sessionHistory.reduce((sum, s) => sum + s.breaks.length, 0);
    const breakFrequency = totalBreaks / Math.max(1, totalSessions);

    const healthRisks = [];
    if (currentMetrics.dailyStats.eyeStrainRisk === 'high') {
      healthRisks.push('High eye strain risk');
    }
    if (currentMetrics.dailyStats.burnoutRisk === 'high') {
      healthRisks.push('High burnout risk');
    }
    if (breakFrequency < 1) {
      healthRisks.push('Insufficient breaks');
    }

    return {
      totalSessions,
      averageSessionLength: Math.round(averageSessionLength),
      totalCodingTime: Math.round(totalCodingTime),
      breakFrequency: Math.round(breakFrequency * 10) / 10,
      productivityTrend: currentMetrics.dailyStats.productivityTrend,
      healthRisks
    };
  }, [state.wellnessMetrics, getSessionHistory]);

  // Check if break is recommended
  const isBreakRecommended = useCallback(() => {
    return state.recommendations.some(r => r.type === 'break' && (r.priority === 'high' || r.priority === 'urgent'));
  }, [state.recommendations]);

  // Get current stress level
  const getCurrentStressLevel = useCallback(() => {
    return state.currentSession?.stressLevel || 'low';
  }, [state.currentSession]);

  // Get time until next recommended break
  const getTimeUntilNextBreak = useCallback(() => {
    if (!state.currentSession) return null;

    const sessionDuration = Math.round(
      (new Date().getTime() - new Date(state.currentSession.startTime).getTime()) / (1000 * 60)
    );

    const lastBreak = state.currentSession.breaks[state.currentSession.breaks.length - 1];
    const timeSinceLastBreak = lastBreak 
      ? Math.round((new Date().getTime() - new Date(lastBreak.endTime).getTime()) / (1000 * 60))
      : sessionDuration;

    // Recommend break every 60 minutes or if no break in 45 minutes
    const nextBreakIn = Math.max(0, 60 - timeSinceLastBreak);
    return nextBreakIn;
  }, [state.currentSession]);

  return {
    // State
    ...state,
    
    // Actions
    startTracking,
    stopTracking,
    trackKeystroke,
    trackFileChange,
    trackFocusLevel,
    takeBreak,
    endBreak,
    dismissRecommendation,
    
    // Utilities
    getAdaptiveTheme,
    getSessionHistory,
    exportWellnessData,
    getWellnessInsights,
    
    // Computed values
    isBreakRecommended: isBreakRecommended(),
    currentStressLevel: getCurrentStressLevel(),
    timeUntilNextBreak: getTimeUntilNextBreak(),
    hasActiveSession: !!state.currentSession,
    urgentRecommendations: state.recommendations.filter(r => r.priority === 'urgent').length,
    highPriorityRecommendations: state.recommendations.filter(r => r.priority === 'high').length
  };
}
