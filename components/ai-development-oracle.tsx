'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAIAssistantEnhanced } from '@/hooks/use-ai-assistant-enhanced';
import { useCodeBuilder } from '@/hooks/use-code-builder';
import { AIDevelopmentOracle, ArchitectureAnalysis, BugPrediction, ProjectArchitecture } from '@/lib/ai-development-oracle';
import { AlertTriangle, Brain, Bug, CheckCircle, Clock, Code, FileText, Lightbulb, Shield, Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface AIDevelopmentOracleProps {
  className?: string;
  onArchitectureGenerated?: (architecture: ProjectArchitecture) => void;
  onBugsDetected?: (bugs: BugPrediction[]) => void;
}

export function AIDevelopmentOracleComponent({
  className = "",
  onArchitectureGenerated,
  onBugsDetected
}: AIDevelopmentOracleProps) {
  // State
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState('react');
  const [complexity, setComplexity] = useState<'simple' | 'moderate' | 'complex'>('moderate');
  const [features, setFeatures] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [analysis, setAnalysis] = useState<ArchitectureAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('generate');

  // Hooks
  const { settings: aiSettings, isConfigured } = useAIAssistantEnhanced();
  const { files } = useCodeBuilder();
  
  // Oracle service
  const oracleRef = useRef<AIDevelopmentOracle | null>(null);

  // Initialize oracle when AI settings are available
  useEffect(() => {
    if (isConfigured && aiSettings) {
      oracleRef.current = new AIDevelopmentOracle(aiSettings);
    }
  }, [aiSettings, isConfigured]);

  const handleGenerateArchitecture = useCallback(async () => {
    if (!oracleRef.current || !description.trim()) return;

    setIsGenerating(true);
    try {
      const preferences = {
        framework,
        complexity,
        features: features.split(',').map(f => f.trim()).filter(Boolean),
        constraints: []
      };

      const architecture = await oracleRef.current.generateArchitecture(description, preferences);
      
      // Update analysis with new architecture
      const predictions = await oracleRef.current.predictBugs(files, architecture);
      const qualityScores = {
        qualityScore: 85,
        securityScore: 90,
        performanceScore: 80,
        maintainabilityScore: 88
      };

      const newAnalysis: ArchitectureAnalysis = {
        architecture,
        predictions,
        ...qualityScores,
        recommendations: {
          immediate: predictions.filter(p => p.severity === 'critical').map(p => p.suggestedFix),
          shortTerm: ['Implement testing strategy', 'Set up CI/CD'],
          longTerm: ['Consider scalability patterns', 'Plan for monitoring']
        }
      };

      setAnalysis(newAnalysis);
      onArchitectureGenerated?.(architecture);
      setActiveTab('analysis');
    } catch (error) {
      console.error('Failed to generate architecture:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [description, framework, complexity, features, files, onArchitectureGenerated]);

  const handlePredictBugs = useCallback(async () => {
    if (!oracleRef.current || files.length === 0) return;

    setIsPredicting(true);
    try {
      const predictions = await oracleRef.current.predictBugs(files);
      onBugsDetected?.(predictions);
      
      if (analysis) {
        setAnalysis({
          ...analysis,
          predictions
        });
      }
    } catch (error) {
      console.error('Failed to predict bugs:', error);
    } finally {
      setIsPredicting(false);
    }
  }, [files, analysis, onBugsDetected]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Bug className="w-4 h-4 text-yellow-600" />;
      case 'low': return <Bug className="w-4 h-4 text-blue-600" />;
      default: return <Bug className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!isConfigured) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Development Oracle
          </CardTitle>
          <CardDescription>
            Please configure your AI settings to use the Development Oracle.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Development Oracle
          </CardTitle>
          <CardDescription>
            Generate complete application architectures and predict potential bugs using advanced AI analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="predict" className="flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Predict
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Project Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your application idea in detail. For example: 'A social media platform for developers with code sharing, real-time collaboration, and AI-powered code reviews...'"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="framework">Framework</Label>
                    <Select value={framework} onValueChange={setFramework}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="react">React</SelectItem>
                        <SelectItem value="vue">Vue.js</SelectItem>
                        <SelectItem value="angular">Angular</SelectItem>
                        <SelectItem value="svelte">Svelte</SelectItem>
                        <SelectItem value="nextjs">Next.js</SelectItem>
                        <SelectItem value="nuxt">Nuxt.js</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="complexity">Complexity</Label>
                    <Select value={complexity} onValueChange={(value: any) => setComplexity(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="complex">Complex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="features">Additional Features (comma-separated)</Label>
                  <Input
                    id="features"
                    placeholder="authentication, real-time chat, file upload, payment processing"
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleGenerateArchitecture}
                  disabled={isGenerating || !description.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Generating Architecture...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate Architecture
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="predict" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="text-sm text-gray-600">
                  Analyze your current project files for potential bugs and issues.
                </div>
                
                <div className="text-lg font-medium">
                  {files.length} files ready for analysis
                </div>

                <Button 
                  onClick={handlePredictBugs}
                  disabled={isPredicting || files.length === 0}
                  className="w-full"
                >
                  {isPredicting ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Code...
                    </>
                  ) : (
                    <>
                      <Bug className="w-4 h-4 mr-2" />
                      Predict Bugs
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              {analysis ? (
                <div className="space-y-6">
                  {/* Quality Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Quality Scores
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Overall Quality</span>
                          <span className="text-sm font-medium">{analysis.qualityScore}%</span>
                        </div>
                        <Progress value={analysis.qualityScore} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Security</span>
                          <span className="text-sm font-medium">{analysis.securityScore}%</span>
                        </div>
                        <Progress value={analysis.securityScore} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Performance</span>
                          <span className="text-sm font-medium">{analysis.performanceScore}%</span>
                        </div>
                        <Progress value={analysis.performanceScore} className="h-2" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Architecture Info
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm">
                          <strong>Framework:</strong> {analysis.architecture.framework}
                        </div>
                        <div className="text-sm">
                          <strong>Complexity:</strong> {analysis.architecture.estimatedComplexity}
                        </div>
                        <div className="text-sm">
                          <strong>Est. Time:</strong> {analysis.architecture.estimatedTimeHours}h
                        </div>
                        <div className="text-sm">
                          <strong>Files:</strong> {analysis.architecture.structure.length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Bug Predictions */}
                  {analysis.predictions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Bug className="w-4 h-4" />
                          Predicted Issues ({analysis.predictions.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {analysis.predictions.map((prediction, index) => (
                            <div key={prediction.id || index} className="border rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  {getSeverityIcon(prediction.severity)}
                                  <span className={`text-sm font-medium ${getSeverityColor(prediction.severity)}`}>
                                    {prediction.severity.toUpperCase()}
                                  </span>
                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {prediction.type}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {Math.round(prediction.likelihood * 100)}% likely
                                </span>
                              </div>
                              <div className="mt-2">
                                <div className="text-sm font-medium">{prediction.description}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                  <strong>Location:</strong> {prediction.location.file}
                                  {prediction.location.line && `:${prediction.location.line}`}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  <strong>Fix:</strong> {prediction.suggestedFix}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="immediate">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="immediate">Immediate</TabsTrigger>
                          <TabsTrigger value="short">Short Term</TabsTrigger>
                          <TabsTrigger value="long">Long Term</TabsTrigger>
                        </TabsList>
                        <TabsContent value="immediate" className="mt-4">
                          <ul className="space-y-2">
                            {analysis.recommendations.immediate.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </TabsContent>
                        <TabsContent value="short" className="mt-4">
                          <ul className="space-y-2">
                            {analysis.recommendations.shortTerm.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </TabsContent>
                        <TabsContent value="long" className="mt-4">
                          <ul className="space-y-2">
                            {analysis.recommendations.longTerm.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Generate an architecture or predict bugs to see analysis results.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
