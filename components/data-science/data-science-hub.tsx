'use client';

/**
 * White Rabbit Code Editor - Data Science Hub
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Database, 
  BarChart3, 
  Brain, 
  Workflow, 
  Calculator, 
  Upload, 
  Plus,
  FileText,
  Zap,
  TrendingUp
} from 'lucide-react';
import { DataConnectorService, dataConnector } from '@/lib/data-science/data-connector';
import { VisualizationDashboard } from './visualization-dashboard';
import { MLPipelineBuilder } from './ml-pipeline-builder';

interface DataScienceHubProps {
  className?: string;
}

export function DataScienceHub({ className }: DataScienceHubProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [connections, setConnections] = useState(dataConnector.listConnections());
  const [isUploading, setIsUploading] = useState(false);

  // Refresh connections periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setConnections(dataConnector.listConnections());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        await dataConnector.connectCSV(file);
        setConnections(dataConnector.listConnections());
      } else {
        alert('Please upload a CSV file');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const createSampleData = (type: 'sales' | 'users' | 'analytics') => {
    dataConnector.createSampleDataset(type);
    setConnections(dataConnector.listConnections());
  };

  const getConnectionStats = () => {
    const total = connections.length;
    const byType = connections.reduce((acc, conn) => {
      acc[conn.type] = (acc[conn.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, byType };
  };

  const stats = getConnectionStats();

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Science Hub</h1>
          <p className="text-muted-foreground">
            Comprehensive data analysis, visualization, and machine learning platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {stats.total} data source{stats.total !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="text-sm">
            AI-Powered
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Sources
          </TabsTrigger>
          <TabsTrigger value="visualize" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visualize
          </TabsTrigger>
          <TabsTrigger value="ml" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            ML Models
          </TabsTrigger>
          <TabsTrigger value="etl" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            ETL Pipelines
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {Object.entries(stats.byType).map(([type, count]) => 
                    `${count} ${type}`
                  ).join(', ') || 'No connections'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visualizations</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Charts and dashboards
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ML Models</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Trained models
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ETL Pipelines</CardTitle>
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Data pipelines
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>
                  Get started with data science in White Rabbit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Upload CSV Data</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <Button disabled={isUploading} size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Or create sample datasets:</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => createSampleData('sales')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Sales Data
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => createSampleData('users')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      User Data
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => createSampleData('analytics')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Analytics Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>
                  Comprehensive data science capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Universal Data Connectors</p>
                      <p className="text-sm text-muted-foreground">CSV, JSON, APIs, databases</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Interactive Visualizations</p>
                      <p className="text-sm text-muted-foreground">Drag-and-drop chart builder</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Visual ML Pipeline</p>
                      <p className="text-sm text-muted-foreground">No-code machine learning</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Workflow className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">ETL Designer</p>
                      <p className="text-sm text-muted-foreground">Visual data transformation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calculator className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">Statistical Analysis</p>
                      <p className="text-sm text-muted-foreground">Built-in statistical functions</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Source Management</CardTitle>
              <CardDescription>
                Connect and manage your data sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connections.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data sources connected yet.</p>
                  <p className="text-sm">Upload a CSV file or create sample data to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.map(conn => (
                    <div key={conn.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{conn.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {conn.type} • {conn.data?.length || 0} rows • Updated {conn.lastUpdated.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={conn.isActive ? 'default' : 'secondary'}>
                          {conn.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{conn.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualize">
          <VisualizationDashboard dataConnector={dataConnector} />
        </TabsContent>

        <TabsContent value="ml">
          <MLPipelineBuilder dataConnector={dataConnector} />
        </TabsContent>

        <TabsContent value="etl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                ETL Pipeline Designer
              </CardTitle>
              <CardDescription>
                Visual data transformation and pipeline builder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ETL Pipeline Designer coming soon!</p>
                <p className="text-sm">Visual drag-and-drop data transformation workflows.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Statistical Analysis Tools
              </CardTitle>
              <CardDescription>
                Advanced statistical analysis and hypothesis testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Statistical Analysis Tools coming soon!</p>
                <p className="text-sm">Descriptive statistics, hypothesis testing, and more.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
