export interface CodingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  linesWritten: number;
  filesModified: string[];
  keystrokes: number;
  breaks: BreakEvent[];
  focusScore: number; // 0-100
  productivityScore: number; // 0-100
  stressLevel: 'low' | 'medium' | 'high';
}

export interface BreakEvent {
  id: string;
  startTime: Date;
  endTime: Date;
  type: 'micro' | 'short' | 'long' | 'forced';
  reason: string;
  effectiveness: number; // 0-100
}

export interface WellnessMetrics {
  dailyStats: {
    totalCodingTime: number;
    totalBreaks: number;
    averageFocusScore: number;
    productivityTrend: 'improving' | 'stable' | 'declining';
    eyeStrainRisk: 'low' | 'medium' | 'high';
    burnoutRisk: 'low' | 'medium' | 'high';
  };
  weeklyStats: {
    totalHours: number;
    averageSessionLength: number;
    bestProductivityDay: string;
    recommendedRestDays: number;
  };
  patterns: {
    mostProductiveHours: number[];
    preferredBreakDuration: number;
    optimalSessionLength: number;
    codeComplexityPreference: 'simple' | 'moderate' | 'complex';
  };
}

export interface WellnessRecommendation {
  id: string;
  type: 'break' | 'posture' | 'eye_care' | 'productivity' | 'focus' | 'health';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  actionItems: string[];
  estimatedBenefit: string;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  dismissible: boolean;
}

export interface AdaptiveTheme {
  id: string;
  name: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  brightness: number; // 0-100
  contrast: number; // 0-100
  colorTemperature: 'warm' | 'neutral' | 'cool';
  eyeStrainReduction: boolean;
  focusMode: boolean;
  customColors?: {
    background: string;
    foreground: string;
    accent: string;
    syntax: Record<string, string>;
  };
}

export class DeveloperWellnessService {
  private currentSession: CodingSession | null = null;
  private sessionHistory: CodingSession[] = [];
  private wellnessMetrics: WellnessMetrics | null = null;
  private recommendations: WellnessRecommendation[] = [];
  private adaptiveThemes: AdaptiveTheme[] = [];
  private lastActivityTime: Date = new Date();
  private keystrokeCount: number = 0;
  private currentStressLevel: 'low' | 'medium' | 'high' = 'low';

  constructor() {
    this.initializeDefaultThemes();
    this.loadStoredData();
    this.startWellnessTracking();
  }

  /**
   * Start a new coding session
   */
  startSession(): string {
    if (this.currentSession) {
      this.endSession();
    }

    const sessionId = `session-${Date.now()}`;
    this.currentSession = {
      id: sessionId,
      startTime: new Date(),
      duration: 0,
      linesWritten: 0,
      filesModified: [],
      keystrokes: 0,
      breaks: [],
      focusScore: 100,
      productivityScore: 100,
      stressLevel: 'low'
    };

    this.updateActivity();
    return sessionId;
  }

  /**
   * End the current coding session
   */
  endSession(): CodingSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = new Date();
    this.currentSession.duration = Math.round(
      (this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / (1000 * 60)
    );

    this.sessionHistory.push(this.currentSession);
    const completedSession = this.currentSession;
    this.currentSession = null;

    this.updateWellnessMetrics();
    this.generateRecommendations();
    this.saveData();

    return completedSession;
  }

  /**
   * Track coding activity (keystrokes, file changes, etc.)
   */
  trackActivity(activity: {
    keystrokes?: number;
    linesAdded?: number;
    linesRemoved?: number;
    fileModified?: string;
    focusLevel?: number;
  }): void {
    if (!this.currentSession) {
      this.startSession();
    }

    this.updateActivity();

    if (activity.keystrokes) {
      this.currentSession!.keystrokes += activity.keystrokes;
      this.keystrokeCount += activity.keystrokes;
    }

    if (activity.linesAdded || activity.linesRemoved) {
      this.currentSession!.linesWritten += (activity.linesAdded || 0) + (activity.linesRemoved || 0);
    }

    if (activity.fileModified && !this.currentSession!.filesModified.includes(activity.fileModified)) {
      this.currentSession!.filesModified.push(activity.fileModified);
    }

    if (activity.focusLevel !== undefined) {
      this.currentSession!.focusScore = Math.round(
        (this.currentSession!.focusScore + activity.focusLevel) / 2
      );
    }

    this.updateStressLevel();
    this.checkForBreakRecommendation();
  }

  /**
   * Take a break
   */
  takeBreak(type: 'micro' | 'short' | 'long' = 'short', reason: string = 'Manual break'): string {
    const breakId = `break-${Date.now()}`;
    const breakEvent: BreakEvent = {
      id: breakId,
      startTime: new Date(),
      endTime: new Date(), // Will be updated when break ends
      type,
      reason,
      effectiveness: 0
    };

    if (this.currentSession) {
      this.currentSession.breaks.push(breakEvent);
    }

    return breakId;
  }

  /**
   * End a break
   */
  endBreak(breakId: string, effectiveness: number = 80): void {
    if (!this.currentSession) return;

    const breakEvent = this.currentSession.breaks.find(b => b.id === breakId);
    if (breakEvent) {
      breakEvent.endTime = new Date();
      breakEvent.effectiveness = effectiveness;
    }

    this.updateActivity();
  }

  /**
   * Get current wellness metrics
   */
  getWellnessMetrics(): WellnessMetrics {
    if (!this.wellnessMetrics) {
      this.updateWellnessMetrics();
    }
    return this.wellnessMetrics!;
  }

  /**
   * Get current recommendations
   */
  getRecommendations(): WellnessRecommendation[] {
    return this.recommendations;
  }

  /**
   * Get adaptive theme for current time and usage
   */
  getAdaptiveTheme(): AdaptiveTheme {
    const hour = new Date().getHours();
    const sessionDuration = this.getCurrentSessionDuration();
    const eyeStrainRisk = this.calculateEyeStrainRisk();

    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const baseTheme = this.adaptiveThemes.find(t => t.timeOfDay === timeOfDay) || this.adaptiveThemes[0];
    
    // Adjust theme based on current conditions
    const adaptedTheme: AdaptiveTheme = {
      ...baseTheme,
      brightness: eyeStrainRisk === 'high' ? Math.max(20, baseTheme.brightness - 20) : baseTheme.brightness,
      eyeStrainReduction: eyeStrainRisk !== 'low',
      focusMode: sessionDuration > 60 // Enable focus mode for long sessions
    };

    return adaptedTheme;
  }

  /**
   * Get productivity insights
   */
  getProductivityInsights(): {
    currentScore: number;
    trend: 'improving' | 'stable' | 'declining';
    suggestions: string[];
    optimalWorkingHours: number[];
  } {
    const recentSessions = this.sessionHistory.slice(-10);
    const currentScore = this.currentSession?.productivityScore || 0;
    
    const averageScore = recentSessions.length > 0 
      ? recentSessions.reduce((sum, s) => sum + s.productivityScore, 0) / recentSessions.length
      : currentScore;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (currentScore > averageScore + 10) trend = 'improving';
    else if (currentScore < averageScore - 10) trend = 'declining';

    const suggestions = this.generateProductivitySuggestions(currentScore, trend);
    const optimalWorkingHours = this.calculateOptimalWorkingHours();

    return {
      currentScore,
      trend,
      suggestions,
      optimalWorkingHours
    };
  }

  private updateActivity(): void {
    this.lastActivityTime = new Date();
  }

  private updateStressLevel(): void {
    const sessionDuration = this.getCurrentSessionDuration();
    const keystrokesPerMinute = this.currentSession ? this.currentSession.keystrokes / Math.max(1, sessionDuration) : 0;
    const timeSinceLastBreak = this.getTimeSinceLastBreak();

    let stressScore = 0;
    if (sessionDuration > 120) stressScore += 30; // Long session
    if (keystrokesPerMinute > 100) stressScore += 20; // High typing rate
    if (timeSinceLastBreak > 60) stressScore += 25; // No recent breaks
    if (this.currentSession && this.currentSession.focusScore < 50) stressScore += 25; // Low focus

    if (stressScore > 60) this.currentStressLevel = 'high';
    else if (stressScore > 30) this.currentStressLevel = 'medium';
    else this.currentStressLevel = 'low';

    if (this.currentSession) {
      this.currentSession.stressLevel = this.currentStressLevel;
    }
  }

  private checkForBreakRecommendation(): void {
    const sessionDuration = this.getCurrentSessionDuration();
    const timeSinceLastBreak = this.getTimeSinceLastBreak();

    if (timeSinceLastBreak > 60 || sessionDuration > 90) {
      this.addRecommendation({
        id: `break-rec-${Date.now()}`,
        type: 'break',
        priority: timeSinceLastBreak > 90 ? 'urgent' : 'high',
        title: 'Time for a break!',
        description: `You've been coding for ${sessionDuration} minutes. Taking a break will help maintain focus and prevent eye strain.`,
        actionItems: [
          'Stand up and stretch for 2-3 minutes',
          'Look away from the screen (20-20-20 rule)',
          'Take a few deep breaths',
          'Hydrate with water'
        ],
        estimatedBenefit: 'Improved focus and reduced eye strain',
        frequency: 'immediate',
        dismissible: true
      });
    }
  }

  private getCurrentSessionDuration(): number {
    if (!this.currentSession) return 0;
    return Math.round((new Date().getTime() - this.currentSession.startTime.getTime()) / (1000 * 60));
  }

  private getTimeSinceLastBreak(): number {
    if (!this.currentSession || this.currentSession.breaks.length === 0) {
      return this.getCurrentSessionDuration();
    }

    const lastBreak = this.currentSession.breaks[this.currentSession.breaks.length - 1];
    return Math.round((new Date().getTime() - lastBreak.endTime.getTime()) / (1000 * 60));
  }

  private calculateEyeStrainRisk(): 'low' | 'medium' | 'high' {
    const sessionDuration = this.getCurrentSessionDuration();
    const timeSinceLastBreak = this.getTimeSinceLastBreak();
    const hour = new Date().getHours();

    let riskScore = 0;
    if (sessionDuration > 60) riskScore += 20;
    if (timeSinceLastBreak > 30) riskScore += 15;
    if (hour < 6 || hour > 22) riskScore += 25; // Late night/early morning
    if (this.keystrokeCount > 1000) riskScore += 10;

    if (riskScore > 50) return 'high';
    if (riskScore > 25) return 'medium';
    return 'low';
  }

  private updateWellnessMetrics(): void {
    const today = new Date();
    const todaySessions = this.sessionHistory.filter(s => 
      s.startTime.toDateString() === today.toDateString()
    );

    const totalCodingTime = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const totalBreaks = todaySessions.reduce((sum, s) => sum + s.breaks.length, 0);
    const averageFocusScore = todaySessions.length > 0 
      ? todaySessions.reduce((sum, s) => sum + s.focusScore, 0) / todaySessions.length 
      : 100;

    this.wellnessMetrics = {
      dailyStats: {
        totalCodingTime,
        totalBreaks,
        averageFocusScore,
        productivityTrend: this.calculateProductivityTrend(),
        eyeStrainRisk: this.calculateEyeStrainRisk(),
        burnoutRisk: this.calculateBurnoutRisk()
      },
      weeklyStats: {
        totalHours: this.calculateWeeklyHours(),
        averageSessionLength: this.calculateAverageSessionLength(),
        bestProductivityDay: this.findBestProductivityDay(),
        recommendedRestDays: this.calculateRecommendedRestDays()
      },
      patterns: {
        mostProductiveHours: this.calculateOptimalWorkingHours(),
        preferredBreakDuration: this.calculatePreferredBreakDuration(),
        optimalSessionLength: this.calculateOptimalSessionLength(),
        codeComplexityPreference: this.determineComplexityPreference()
      }
    };
  }

  private generateRecommendations(): void {
    this.recommendations = [];

    // Add wellness-based recommendations
    const metrics = this.getWellnessMetrics();
    
    if (metrics.dailyStats.eyeStrainRisk === 'high') {
      this.addRecommendation({
        id: 'eye-strain-high',
        type: 'eye_care',
        priority: 'high',
        title: 'High Eye Strain Risk Detected',
        description: 'Your current coding session indicates high risk for eye strain.',
        actionItems: [
          'Reduce screen brightness',
          'Take more frequent breaks',
          'Use the 20-20-20 rule',
          'Consider blue light filtering'
        ],
        estimatedBenefit: 'Reduced eye fatigue and improved long-term eye health',
        frequency: 'immediate',
        dismissible: false
      });
    }

    if (metrics.dailyStats.burnoutRisk === 'high') {
      this.addRecommendation({
        id: 'burnout-risk-high',
        type: 'health',
        priority: 'urgent',
        title: 'Burnout Risk Warning',
        description: 'Your coding patterns suggest high burnout risk.',
        actionItems: [
          'Consider taking a longer break',
          'Plan some time away from coding',
          'Focus on work-life balance',
          'Consider speaking with a colleague or mentor'
        ],
        estimatedBenefit: 'Improved mental health and sustained productivity',
        frequency: 'immediate',
        dismissible: false
      });
    }
  }

  private addRecommendation(recommendation: WellnessRecommendation): void {
    // Avoid duplicate recommendations
    const exists = this.recommendations.some(r => r.id === recommendation.id);
    if (!exists) {
      this.recommendations.push(recommendation);
    }
  }

  private initializeDefaultThemes(): void {
    this.adaptiveThemes = [
      {
        id: 'morning-fresh',
        name: 'Morning Fresh',
        timeOfDay: 'morning',
        brightness: 85,
        contrast: 75,
        colorTemperature: 'cool',
        eyeStrainReduction: false,
        focusMode: false
      },
      {
        id: 'afternoon-balanced',
        name: 'Afternoon Balanced',
        timeOfDay: 'afternoon',
        brightness: 70,
        contrast: 80,
        colorTemperature: 'neutral',
        eyeStrainReduction: false,
        focusMode: false
      },
      {
        id: 'evening-warm',
        name: 'Evening Warm',
        timeOfDay: 'evening',
        brightness: 60,
        contrast: 85,
        colorTemperature: 'warm',
        eyeStrainReduction: true,
        focusMode: false
      },
      {
        id: 'night-gentle',
        name: 'Night Gentle',
        timeOfDay: 'night',
        brightness: 40,
        contrast: 90,
        colorTemperature: 'warm',
        eyeStrainReduction: true,
        focusMode: true
      }
    ];
  }

  private calculateProductivityTrend(): 'improving' | 'stable' | 'declining' {
    const recentSessions = this.sessionHistory.slice(-5);
    if (recentSessions.length < 3) return 'stable';

    const scores = recentSessions.map(s => s.productivityScore);
    const trend = scores[scores.length - 1] - scores[0];

    if (trend > 10) return 'improving';
    if (trend < -10) return 'declining';
    return 'stable';
  }

  private calculateBurnoutRisk(): 'low' | 'medium' | 'high' {
    const weeklyHours = this.calculateWeeklyHours();
    const averageStress = this.sessionHistory.slice(-7).reduce((sum, s) => {
      const stressValue = s.stressLevel === 'high' ? 3 : s.stressLevel === 'medium' ? 2 : 1;
      return sum + stressValue;
    }, 0) / Math.max(1, this.sessionHistory.slice(-7).length);

    let riskScore = 0;
    if (weeklyHours > 50) riskScore += 30;
    if (averageStress > 2.5) riskScore += 25;
    if (this.sessionHistory.slice(-3).every(s => s.breaks.length < 2)) riskScore += 20;

    if (riskScore > 50) return 'high';
    if (riskScore > 25) return 'medium';
    return 'low';
  }

  private calculateWeeklyHours(): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return this.sessionHistory
      .filter(s => s.startTime >= oneWeekAgo)
      .reduce((sum, s) => sum + s.duration, 0) / 60; // Convert to hours
  }

  private calculateAverageSessionLength(): number {
    const recentSessions = this.sessionHistory.slice(-10);
    if (recentSessions.length === 0) return 0;
    return recentSessions.reduce((sum, s) => sum + s.duration, 0) / recentSessions.length;
  }

  private findBestProductivityDay(): string {
    const dayScores: Record<string, number[]> = {};
    
    this.sessionHistory.forEach(session => {
      const day = session.startTime.toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayScores[day]) dayScores[day] = [];
      dayScores[day].push(session.productivityScore);
    });

    let bestDay = 'Monday';
    let bestScore = 0;

    Object.entries(dayScores).forEach(([day, scores]) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestDay = day;
      }
    });

    return bestDay;
  }

  private calculateRecommendedRestDays(): number {
    const weeklyHours = this.calculateWeeklyHours();
    if (weeklyHours > 45) return 2;
    if (weeklyHours > 35) return 1;
    return 0;
  }

  private calculateOptimalWorkingHours(): number[] {
    const hourlyScores: Record<number, number[]> = {};
    
    this.sessionHistory.forEach(session => {
      const hour = session.startTime.getHours();
      if (!hourlyScores[hour]) hourlyScores[hour] = [];
      hourlyScores[hour].push(session.productivityScore);
    });

    const avgScores = Object.entries(hourlyScores).map(([hour, scores]) => ({
      hour: parseInt(hour),
      avgScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
    }));

    return avgScores
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 4)
      .map(item => item.hour)
      .sort((a, b) => a - b);
  }

  private calculatePreferredBreakDuration(): number {
    const breaks = this.sessionHistory.flatMap(s => s.breaks);
    if (breaks.length === 0) return 15;

    const durations = breaks.map(b => 
      Math.round((b.endTime.getTime() - b.startTime.getTime()) / (1000 * 60))
    );

    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  private calculateOptimalSessionLength(): number {
    const sessions = this.sessionHistory.filter(s => s.productivityScore > 70);
    if (sessions.length === 0) return 90;

    return sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
  }

  private determineComplexityPreference(): 'simple' | 'moderate' | 'complex' {
    // This would analyze file types, function lengths, etc.
    // For now, return a default
    return 'moderate';
  }

  private generateProductivitySuggestions(currentScore: number, trend: string): string[] {
    const suggestions: string[] = [];

    if (currentScore < 50) {
      suggestions.push('Consider taking a longer break to refresh your mind');
      suggestions.push('Try breaking down complex tasks into smaller chunks');
    }

    if (trend === 'declining') {
      suggestions.push('Review your recent work patterns for potential improvements');
      suggestions.push('Consider adjusting your work environment or schedule');
    }

    if (this.currentStressLevel === 'high') {
      suggestions.push('Focus on stress reduction techniques');
      suggestions.push('Consider shorter, more frequent coding sessions');
    }

    return suggestions;
  }

  private startWellnessTracking(): void {
    // Set up periodic wellness checks
    setInterval(() => {
      if (this.currentSession) {
        this.updateStressLevel();
        this.checkForBreakRecommendation();
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private loadStoredData(): void {
    try {
      const stored = localStorage.getItem('developer-wellness-data');
      if (stored) {
        const data = JSON.parse(stored);
        this.sessionHistory = data.sessionHistory || [];
        this.recommendations = data.recommendations || [];
      }
    } catch (error) {
      console.error('Failed to load wellness data:', error);
    }
  }

  private saveData(): void {
    try {
      const data = {
        sessionHistory: this.sessionHistory.slice(-50), // Keep last 50 sessions
        recommendations: this.recommendations
      };
      localStorage.setItem('developer-wellness-data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save wellness data:', error);
    }
  }

  // Public methods for external integration
  dismissRecommendation(id: string): void {
    this.recommendations = this.recommendations.filter(r => r.id !== id);
    this.saveData();
  }

  getCurrentSession(): CodingSession | null {
    return this.currentSession;
  }

  getSessionHistory(): CodingSession[] {
    return [...this.sessionHistory];
  }

  exportWellnessData(): any {
    return {
      sessions: this.sessionHistory,
      metrics: this.wellnessMetrics,
      recommendations: this.recommendations
    };
  }

  // Method to manually trigger theme adaptation
  adaptThemeForConditions(conditions: {
    eyeStrain?: boolean;
    longSession?: boolean;
    timeOverride?: 'morning' | 'afternoon' | 'evening' | 'night';
  }): AdaptiveTheme {
    const baseTheme = this.getAdaptiveTheme();

    if (conditions.eyeStrain) {
      baseTheme.brightness = Math.max(20, baseTheme.brightness - 30);
      baseTheme.eyeStrainReduction = true;
    }

    if (conditions.longSession) {
      baseTheme.focusMode = true;
      baseTheme.colorTemperature = 'warm';
    }

    return baseTheme;
  }

  // Get wellness score (0-100)
  getOverallWellnessScore(): number {
    const metrics = this.getWellnessMetrics();
    const productivity = this.getProductivityInsights();

    let score = 100;

    // Deduct points for risks
    if (metrics.dailyStats.eyeStrainRisk === 'high') score -= 20;
    else if (metrics.dailyStats.eyeStrainRisk === 'medium') score -= 10;

    if (metrics.dailyStats.burnoutRisk === 'high') score -= 30;
    else if (metrics.dailyStats.burnoutRisk === 'medium') score -= 15;

    // Deduct for low productivity
    if (productivity.currentScore < 50) score -= 15;
    else if (productivity.currentScore < 70) score -= 5;

    // Deduct for insufficient breaks
    if (metrics.dailyStats.totalBreaks === 0 && metrics.dailyStats.totalCodingTime > 60) score -= 10;

    return Math.max(0, score);
  }
}
