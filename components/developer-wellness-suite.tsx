'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeveloperWellnessService, WellnessRecommendation } from '@/lib/developer-wellness-service';
import { 
  Activity, 
  AlertTriangle, 
  Brain, 
  Clock, 
  Coffee, 
  Eye, 
  Heart, 
  Lightbulb, 
  Moon, 
  Palette, 
  Sun, 
  Target, 
  TrendingUp, 
  X 
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface DeveloperWellnessSuiteProps {
  className?: string;
  onThemeChange?: (theme: any) => void;
  onBreakRecommended?: () => void;
}

export function DeveloperWellnessSuite({
  className = "",
  onThemeChange,
  onBreakRecommended
}: DeveloperWellnessSuiteProps) {
  // State
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [wellnessMetrics, setWellnessMetrics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<WellnessRecommendation[]>([]);
  const [productivityInsights, setProductivityInsights] = useState<any>(null);
  const [adaptiveThemeEnabled, setAdaptiveThemeEnabled] = useState(true);
  const [wellnessScore, setWellnessScore] = useState(100);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Wellness service
  const wellnessServiceRef = useRef<DeveloperWellnessService | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize wellness service
  useEffect(() => {
    wellnessServiceRef.current = new DeveloperWellnessService();
    startTracking();
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // Start wellness tracking
  const startTracking = useCallback(() => {
    if (!wellnessServiceRef.current) return;

    wellnessServiceRef.current.startSession();
    setIsTracking(true);
    
    // Update UI every 30 seconds
    updateIntervalRef.current = setInterval(() => {
      updateWellnessData();
    }, 30000);

    updateWellnessData();
  }, []);

  // Stop wellness tracking
  const stopTracking = useCallback(() => {
    if (!wellnessServiceRef.current) return;

    wellnessServiceRef.current.endSession();
    setIsTracking(false);
    
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    updateWellnessData();
  }, []);

  // Update wellness data
  const updateWellnessData = useCallback(() => {
    if (!wellnessServiceRef.current) return;

    setCurrentSession(wellnessServiceRef.current.getCurrentSession());
    setWellnessMetrics(wellnessServiceRef.current.getWellnessMetrics());
    setRecommendations(wellnessServiceRef.current.getRecommendations());
    setProductivityInsights(wellnessServiceRef.current.getProductivityInsights());
    setWellnessScore(wellnessServiceRef.current.getOverallWellnessScore());

    // Update adaptive theme if enabled
    if (adaptiveThemeEnabled) {
      const theme = wellnessServiceRef.current.getAdaptiveTheme();
      onThemeChange?.(theme);
    }
  }, [adaptiveThemeEnabled, onThemeChange]);

  // Take a break
  const takeBreak = useCallback((type: 'micro' | 'short' | 'long' = 'short') => {
    if (!wellnessServiceRef.current) return;

    const breakId = wellnessServiceRef.current.takeBreak(type, 'Manual break');
    onBreakRecommended?.();
    
    // Auto-end micro breaks after 2 minutes
    if (type === 'micro') {
      setTimeout(() => {
        wellnessServiceRef.current?.endBreak(breakId, 85);
        updateWellnessData();
      }, 2 * 60 * 1000);
    }
  }, [onBreakRecommended]);

  // Dismiss recommendation
  const dismissRecommendation = useCallback((id: string) => {
    if (!wellnessServiceRef.current) return;
    
    wellnessServiceRef.current.dismissRecommendation(id);
    updateWellnessData();
  }, []);

  // Track coding activity (to be called from parent component)
  const trackActivity = useCallback((activity: any) => {
    if (!wellnessServiceRef.current || !isTracking) return;
    
    wellnessServiceRef.current.trackActivity(activity);
  }, [isTracking]);

  // Get severity color for recommendations
  const getSeverityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get wellness score color
  const getWellnessScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Developer Wellness Suite
          </CardTitle>
          <CardDescription>
            Track your coding patterns, get health recommendations, and optimize your development workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Wellness
              </TabsTrigger>
              <TabsTrigger value="productivity" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="themes" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Themes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              {/* Session Status */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Current Session
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Status</span>
                        <span className={`text-sm font-medium ${isTracking ? 'text-green-600' : 'text-gray-600'}`}>
                          {isTracking ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {currentSession && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Duration</span>
                            <span className="text-sm font-medium">
                              {formatDuration(Math.round((new Date().getTime() - new Date(currentSession.startTime).getTime()) / (1000 * 60)))}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Keystrokes</span>
                            <span className="text-sm font-medium">{currentSession.keystrokes}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Files Modified</span>
                            <span className="text-sm font-medium">{currentSession.filesModified.length}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Wellness Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">
                          <span className={getWellnessScoreColor(wellnessScore)}>{wellnessScore}</span>
                          <span className="text-sm text-gray-500">/100</span>
                        </span>
                      </div>
                      <Progress value={wellnessScore} className="h-2" />
                      <div className="text-xs text-gray-600">
                        {wellnessScore >= 80 ? 'Excellent wellness!' : 
                         wellnessScore >= 60 ? 'Good, with room for improvement' :
                         wellnessScore >= 40 ? 'Needs attention' : 'Critical - take action'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={isTracking ? "destructive" : "default"}
                      size="sm"
                      onClick={isTracking ? stopTracking : startTracking}
                    >
                      {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => takeBreak('micro')}
                      disabled={!isTracking}
                    >
                      <Coffee className="w-4 h-4 mr-1" />
                      Micro Break (2m)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => takeBreak('short')}
                      disabled={!isTracking}
                    >
                      <Coffee className="w-4 h-4 mr-1" />
                      Short Break (15m)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => takeBreak('long')}
                      disabled={!isTracking}
                    >
                      <Coffee className="w-4 h-4 mr-1" />
                      Long Break (30m)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Stats */}
              {wellnessMetrics && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Today's Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Coding Time</span>
                          <span className="text-sm font-medium">
                            {formatDuration(wellnessMetrics.dailyStats.totalCodingTime)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Breaks Taken</span>
                          <span className="text-sm font-medium">{wellnessMetrics.dailyStats.totalBreaks}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Focus Score</span>
                          <span className="text-sm font-medium">
                            {Math.round(wellnessMetrics.dailyStats.averageFocusScore)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Eye Strain Risk</span>
                          <span className={`text-sm font-medium ${
                            wellnessMetrics.dailyStats.eyeStrainRisk === 'high' ? 'text-red-600' :
                            wellnessMetrics.dailyStats.eyeStrainRisk === 'medium' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {wellnessMetrics.dailyStats.eyeStrainRisk}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <Card key={rec.id} className={`border ${getSeverityColor(rec.priority)}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {rec.type === 'break' && <Coffee className="w-4 h-4" />}
                            {rec.type === 'eye_care' && <Eye className="w-4 h-4" />}
                            {rec.type === 'health' && <Heart className="w-4 h-4" />}
                            {rec.type === 'productivity' && <TrendingUp className="w-4 h-4" />}
                            {rec.type === 'focus' && <Brain className="w-4 h-4" />}
                            {rec.type === 'posture' && <Activity className="w-4 h-4" />}
                            {rec.title}
                          </CardTitle>
                          {rec.dismissible && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissRecommendation(rec.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">{rec.description}</p>
                          <div className="space-y-1">
                            <div className="text-xs font-medium">Action Items:</div>
                            <ul className="text-xs space-y-1">
                              {rec.actionItems.map((item, index) => (
                                <li key={index} className="flex items-start gap-1">
                                  <span className="text-gray-400">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="text-xs text-gray-500">
                            <strong>Benefit:</strong> {rec.estimatedBenefit}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Heart className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">All Good!</h3>
                    <p className="text-gray-600">No wellness recommendations at the moment. Keep up the great work!</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="productivity" className="space-y-4">
              {productivityInsights && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Productivity Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold">{productivityInsights.currentScore}%</div>
                          <div className="text-sm text-gray-600">Current Score</div>
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${
                            productivityInsights.trend === 'improving' ? 'text-green-600' :
                            productivityInsights.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {productivityInsights.trend === 'improving' ? '↗ Improving' :
                             productivityInsights.trend === 'declining' ? '↘ Declining' : '→ Stable'}
                          </div>
                          <div className="text-sm text-gray-600">Trend</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Optimal Working Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-wrap">
                        {productivityInsights.optimalWorkingHours.map((hour: number) => (
                          <span key={hour} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {hour}:00
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {productivityInsights.suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="themes" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Adaptive Themes</CardTitle>
                  <CardDescription>
                    Automatically adjust your editor theme based on time of day and usage patterns.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Enable Adaptive Themes</div>
                        <div className="text-sm text-gray-600">
                          Automatically adjust brightness and colors to reduce eye strain
                        </div>
                      </div>
                      <Switch
                        checked={adaptiveThemeEnabled}
                        onCheckedChange={setAdaptiveThemeEnabled}
                      />
                    </div>

                    {adaptiveThemeEnabled && wellnessServiceRef.current && (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Current Theme Adaptation:</div>
                        {(() => {
                          const currentTheme = wellnessServiceRef.current.getAdaptiveTheme();
                          return (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex justify-between">
                                <span>Time of Day</span>
                                <span className="font-medium">{currentTheme.timeOfDay}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Brightness</span>
                                <span className="font-medium">{currentTheme.brightness}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Color Temperature</span>
                                <span className="font-medium">{currentTheme.colorTemperature}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Eye Strain Reduction</span>
                                <span className="font-medium">
                                  {currentTheme.eyeStrainReduction ? 'On' : 'Off'}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (wellnessServiceRef.current) {
                            const theme = wellnessServiceRef.current.adaptThemeForConditions({ eyeStrain: true });
                            onThemeChange?.(theme);
                          }
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Eye Strain Mode
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (wellnessServiceRef.current) {
                            const theme = wellnessServiceRef.current.adaptThemeForConditions({ longSession: true });
                            onThemeChange?.(theme);
                          }
                        }}
                      >
                        <Brain className="w-4 h-4 mr-1" />
                        Focus Mode
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
