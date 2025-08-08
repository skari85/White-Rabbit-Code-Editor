'use client';

/**
 * White Rabbit Code Editor - Visual ML Pipeline Builder
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Play, Settings, Target, Zap, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { DataConnectorService, DataConnection } from '@/lib/data-science/data-connector';

export interface MLModel {
  id: string;
  name: string;
  type: 'classification' | 'regression';
  algorithm: 'random_forest' | 'linear_regression' | 'logistic_regression' | 'svm' | 'gradient_boosting';
  dataSource: string;
  features: string[];
  target: string;
  testSize: number;
  cvFolds: number;
  status: 'idle' | 'training' | 'completed' | 'error';
  metrics?: {
    accuracy?: number;
    r2Score?: number;
    mse?: number;
    crossValScore?: number;
    featureImportance?: Array<{ feature: string; importance: number }>;
  };
  createdAt: Date;
}

interface MLPipelineBuilderProps {
  dataConnector: DataConnectorService;
  className?: string;
}

export function MLPipelineBuilder({ dataConnector, className }: MLPipelineBuilderProps) {
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const [models, setModels] = useState<MLModel[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [numericColumns, setNumericColumns] = useState<string[]>([]);
  const [categoricalColumns, setCategoricalColumns] = useState<string[]>([]);
  
  // Model configuration
  const [modelConfig, setModelConfig] = useState({
    type: 'classification' as 'classification' | 'regression',
    algorithm: 'random_forest' as MLModel['algorithm'],
    features: [] as string[],
    target: '',
    testSize: 0.2,
    cvFolds: 5
  });

  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  // Load connections on mount
  useEffect(() => {
    const loadConnections = () => {
      const conns = dataConnector.listConnections();
      setConnections(conns);
      
      if (conns.length > 0 && !selectedConnection) {
        setSelectedConnection(conns[0].id);
      }
    };

    loadConnections();
  }, [dataConnector, selectedConnection]);

  // Update available columns when connection changes
  useEffect(() => {
    if (selectedConnection) {
      const connection = dataConnector.getConnection(selectedConnection);
      if (connection && connection.data && connection.data.length > 0) {
        const sample = connection.data[0];
        const allColumns = Object.keys(sample);
        const numeric = allColumns.filter(col => 
          typeof sample[col] === 'number' || 
          (!isNaN(Number(sample[col])) && sample[col] !== '')
        );
        const categorical = allColumns.filter(col => !numeric.includes(col));

        setAvailableColumns(allColumns);
        setNumericColumns(numeric);
        setCategoricalColumns(categorical);

        // Auto-select features and target
        if (numeric.length > 0) {
          setModelConfig(prev => ({
            ...prev,
            features: numeric.slice(0, -1),
            target: numeric[numeric.length - 1]
          }));
        }
      }
    }
  }, [selectedConnection, dataConnector]);

  const trainModel = useCallback(async () => {
    if (!selectedConnection || !modelConfig.target || modelConfig.features.length === 0) {
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      const connection = dataConnector.getConnection(selectedConnection);
      if (!connection || !connection.data) throw new Error('No data available');

      const data = connection.data;
      
      // Simulate training progress
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Simulate model training (in a real implementation, this would call a backend service)
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(progressInterval);
      setTrainingProgress(100);

      // Generate mock results
      const mockMetrics = generateMockMetrics(modelConfig.type, modelConfig.algorithm);

      const newModel: MLModel = {
        id: `model_${Date.now()}`,
        name: `${modelConfig.algorithm.replace('_', ' ').toUpperCase()} Model`,
        type: modelConfig.type,
        algorithm: modelConfig.algorithm,
        dataSource: selectedConnection,
        features: [...modelConfig.features],
        target: modelConfig.target,
        testSize: modelConfig.testSize,
        cvFolds: modelConfig.cvFolds,
        status: 'completed',
        metrics: mockMetrics,
        createdAt: new Date()
      };

      setModels(prev => [...prev, newModel]);
      
    } catch (error) {
      console.error('Training failed:', error);
    } finally {
      setIsTraining(false);
      setTrainingProgress(0);
    }
  }, [selectedConnection, modelConfig, dataConnector]);

  const generateMockMetrics = (type: string, algorithm: string) => {
    if (type === 'classification') {
      return {
        accuracy: 0.85 + Math.random() * 0.1,
        crossValScore: 0.82 + Math.random() * 0.08,
        featureImportance: modelConfig.features.map(feature => ({
          feature,
          importance: Math.random()
        })).sort((a, b) => b.importance - a.importance)
      };
    } else {
      return {
        r2Score: 0.75 + Math.random() * 0.2,
        mse: Math.random() * 1000 + 100,
        crossValScore: 0.72 + Math.random() * 0.15,
        featureImportance: modelConfig.features.map(feature => ({
          feature,
          importance: Math.random()
        })).sort((a, b) => b.importance - a.importance)
      };
    }
  };

  const algorithmOptions = {
    classification: [
      { value: 'random_forest', label: 'Random Forest' },
      { value: 'logistic_regression', label: 'Logistic Regression' },
      { value: 'svm', label: 'Support Vector Machine' },
      { value: 'gradient_boosting', label: 'Gradient Boosting' }
    ],
    regression: [
      { value: 'random_forest', label: 'Random Forest' },
      { value: 'linear_regression', label: 'Linear Regression' },
      { value: 'svm', label: 'Support Vector Machine' },
      { value: 'gradient_boosting', label: 'Gradient Boosting' }
    ]
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Visual ML Pipeline Builder
          </CardTitle>
          <CardDescription>
            Build and train machine learning models with a visual, no-code interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="builder" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="builder">Model Builder</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
              <TabsTrigger value="models">Trained Models</TabsTrigger>
            </TabsList>
            
            <TabsContent value="builder" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ml-data-source">Data Source</Label>
                    <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                      <SelectTrigger id="ml-data-source">
                        <SelectValue placeholder="Select data source" />
                      </SelectTrigger>
                      <SelectContent>
                        {connections.map(conn => (
                          <SelectItem key={conn.id} value={conn.id}>
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              {conn.name}
                              <Badge variant="secondary">{conn.type}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="problem-type">Problem Type</Label>
                    <Select 
                      value={modelConfig.type} 
                      onValueChange={(value: any) => setModelConfig(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger id="problem-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classification">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Classification
                          </div>
                        </SelectItem>
                        <SelectItem value="regression">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Regression
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="algorithm">Algorithm</Label>
                    <Select 
                      value={modelConfig.algorithm} 
                      onValueChange={(value: any) => setModelConfig(prev => ({ ...prev, algorithm: value }))}
                    >
                      <SelectTrigger id="algorithm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {algorithmOptions[modelConfig.type].map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-variable">Target Variable</Label>
                    <Select 
                      value={modelConfig.target} 
                      onValueChange={(value) => setModelConfig(prev => ({ ...prev, target: value }))}
                    >
                      <SelectTrigger id="target-variable">
                        <SelectValue placeholder="Select target variable" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Feature Variables</Label>
                    <ScrollArea className="h-32 border rounded-md p-2">
                      <div className="space-y-2">
                        {availableColumns
                          .filter(col => col !== modelConfig.target)
                          .map(col => (
                          <div key={col} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`feature-${col}`}
                              checked={modelConfig.features.includes(col)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setModelConfig(prev => ({
                                    ...prev,
                                    features: [...prev.features, col]
                                  }));
                                } else {
                                  setModelConfig(prev => ({
                                    ...prev,
                                    features: prev.features.filter(f => f !== col)
                                  }));
                                }
                              }}
                              className="rounded"
                            />
                            <Label htmlFor={`feature-${col}`} className="text-sm">
                              {col}
                              <Badge variant="outline" className="ml-2 text-xs">
                                {numericColumns.includes(col) ? 'numeric' : 'categorical'}
                              </Badge>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="space-y-2">
                    <Label>Test Size: {modelConfig.testSize}</Label>
                    <Slider
                      value={[modelConfig.testSize]}
                      onValueChange={([value]) => setModelConfig(prev => ({ ...prev, testSize: value }))}
                      min={0.1}
                      max={0.5}
                      step={0.05}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cross-Validation Folds: {modelConfig.cvFolds}</Label>
                    <Slider
                      value={[modelConfig.cvFolds]}
                      onValueChange={([value]) => setModelConfig(prev => ({ ...prev, cvFolds: value }))}
                      min={3}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="training" className="space-y-4">
              <div className="text-center space-y-4">
                {isTraining ? (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Training Model...</h3>
                      <Progress value={trainingProgress} className="w-full" />
                      <p className="text-sm text-muted-foreground">
                        {trainingProgress < 30 ? 'Preprocessing data...' :
                         trainingProgress < 60 ? 'Training model...' :
                         trainingProgress < 90 ? 'Validating results...' :
                         'Finalizing model...'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="p-6 border rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Ready to Train</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Data Source:</strong> {connections.find(c => c.id === selectedConnection)?.name || 'None'}
                        </div>
                        <div>
                          <strong>Problem Type:</strong> {modelConfig.type}
                        </div>
                        <div>
                          <strong>Algorithm:</strong> {modelConfig.algorithm.replace('_', ' ')}
                        </div>
                        <div>
                          <strong>Target:</strong> {modelConfig.target || 'None'}
                        </div>
                        <div>
                          <strong>Features:</strong> {modelConfig.features.length}
                        </div>
                        <div>
                          <strong>Test Size:</strong> {(modelConfig.testSize * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={trainModel} 
                      disabled={!selectedConnection || !modelConfig.target || modelConfig.features.length === 0}
                      className="w-full"
                      size="lg"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Train Model
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="models" className="space-y-4">
              {models.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No models trained yet. Use the Model Builder to create your first ML model.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {models.map(model => (
                    <Card key={model.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{model.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            {model.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : model.status === 'error' ? (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            ) : null}
                            <Badge variant={model.type === 'classification' ? 'default' : 'secondary'}>
                              {model.type}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription>
                          {model.algorithm.replace('_', ' ')} • {model.features.length} features • Target: {model.target}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {model.metrics && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {model.metrics.accuracy && (
                              <div>
                                <strong>Accuracy:</strong> {(model.metrics.accuracy * 100).toFixed(1)}%
                              </div>
                            )}
                            {model.metrics.r2Score && (
                              <div>
                                <strong>R² Score:</strong> {model.metrics.r2Score.toFixed(3)}
                              </div>
                            )}
                            {model.metrics.crossValScore && (
                              <div>
                                <strong>CV Score:</strong> {(model.metrics.crossValScore * 100).toFixed(1)}%
                              </div>
                            )}
                            {model.metrics.mse && (
                              <div>
                                <strong>MSE:</strong> {model.metrics.mse.toFixed(2)}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
