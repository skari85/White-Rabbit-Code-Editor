'use client';

/**
 * White Rabbit Code Editor - Interactive Visualization Dashboard
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 */

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, LineChart, PieChart, ScatterChart, TrendingUp, Database } from 'lucide-react';
import { DataConnectorService, DataConnection } from '@/lib/data-science/data-connector';

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'scatter' | 'pie' | 'histogram' | 'box' | 'heatmap';
  title: string;
  dataSource: string;
  xColumn: string;
  yColumn?: string;
  colorColumn?: string;
  groupColumn?: string;
  aggregation?: 'sum' | 'mean' | 'count' | 'max' | 'min';
}

interface VisualizationDashboardProps {
  dataConnector: DataConnectorService;
  className?: string;
}

export function VisualizationDashboard({ dataConnector, className }: VisualizationDashboardProps) {
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [chartType, setChartType] = useState<ChartConfig['type']>('line');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [chartConfig, setChartConfig] = useState<Partial<ChartConfig>>({});

  // Load connections on mount
  useEffect(() => {
    const loadConnections = () => {
      const conns = dataConnector.listConnections();
      setConnections(conns);
      
      // Auto-select first connection if available
      if (conns.length > 0 && !selectedConnection) {
        setSelectedConnection(conns[0].id);
      }
    };

    loadConnections();
    
    // Set up periodic refresh for real-time data
    const interval = setInterval(loadConnections, 5000);
    return () => clearInterval(interval);
  }, [dataConnector, selectedConnection]);

  // Update available columns when connection changes
  useEffect(() => {
    if (selectedConnection) {
      const connection = dataConnector.getConnection(selectedConnection);
      if (connection && connection.data && connection.data.length > 0) {
        const columns = Object.keys(connection.data[0]);
        setAvailableColumns(columns);
        
        // Reset chart config
        setChartConfig({
          dataSource: selectedConnection,
          xColumn: columns[0],
          yColumn: columns[1] || columns[0]
        });
      }
    }
  }, [selectedConnection, dataConnector]);

  const createChart = useCallback(() => {
    if (!selectedConnection || !chartConfig.xColumn) return;

    const newChart: ChartConfig = {
      id: `chart_${Date.now()}`,
      type: chartType,
      title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
      dataSource: selectedConnection,
      xColumn: chartConfig.xColumn,
      yColumn: chartConfig.yColumn,
      colorColumn: chartConfig.colorColumn,
      groupColumn: chartConfig.groupColumn,
      aggregation: chartConfig.aggregation || 'sum'
    };

    setCharts(prev => [...prev, newChart]);
  }, [selectedConnection, chartType, chartConfig]);

  const removeChart = useCallback((chartId: string) => {
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
  }, []);

  const renderChart = useCallback((chart: ChartConfig) => {
    const connection = dataConnector.getConnection(chart.dataSource);
    if (!connection || !connection.data) return null;

    const data = connection.data;
    let plotData: any[] = [];
    let layout: any = {
      title: chart.title,
      autosize: true,
      margin: { l: 50, r: 50, t: 50, b: 50 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
    };

    try {
      switch (chart.type) {
        case 'line':
          plotData = [{
            x: data.map(d => d[chart.xColumn]),
            y: data.map(d => d[chart.yColumn!]),
            type: 'scatter',
            mode: 'lines+markers',
            name: chart.yColumn,
            line: { color: '#3b82f6' }
          }];
          break;

        case 'bar':
          plotData = [{
            x: data.map(d => d[chart.xColumn]),
            y: data.map(d => d[chart.yColumn!]),
            type: 'bar',
            name: chart.yColumn,
            marker: { color: '#10b981' }
          }];
          break;

        case 'scatter':
          plotData = [{
            x: data.map(d => d[chart.xColumn]),
            y: data.map(d => d[chart.yColumn!]),
            mode: 'markers',
            type: 'scatter',
            name: `${chart.yColumn} vs ${chart.xColumn}`,
            marker: { 
              color: chart.colorColumn ? data.map(d => d[chart.colorColumn!]) : '#8b5cf6',
              size: 8
            }
          }];
          break;

        case 'pie':
          const pieData = data.reduce((acc: any, item) => {
            const key = item[chart.xColumn];
            acc[key] = (acc[key] || 0) + (chart.yColumn ? item[chart.yColumn] : 1);
            return acc;
          }, {});
          
          plotData = [{
            labels: Object.keys(pieData),
            values: Object.values(pieData),
            type: 'pie',
            hole: 0.3
          }];
          break;

        case 'histogram':
          plotData = [{
            x: data.map(d => d[chart.xColumn]),
            type: 'histogram',
            name: chart.xColumn,
            marker: { color: '#f59e0b' }
          }];
          break;

        case 'box':
          plotData = [{
            y: data.map(d => d[chart.yColumn!]),
            type: 'box',
            name: chart.yColumn,
            marker: { color: '#ef4444' }
          }];
          break;
      }

      return (
        <div className="w-full h-96">
          <Plot
            data={plotData}
            layout={layout}
            config={{ responsive: true, displayModeBar: false }}
            className="w-full h-full"
          />
        </div>
      );
    } catch (error) {
      return (
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          <p>Error rendering chart: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      );
    }
  }, [dataConnector]);

  const chartTypeIcons = {
    line: LineChart,
    bar: BarChart3,
    scatter: ScatterChart,
    pie: PieChart,
    histogram: BarChart3,
    box: BarChart3,
    heatmap: TrendingUp
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Interactive Visualization Dashboard
          </CardTitle>
          <CardDescription>
            Create interactive charts and visualizations from your connected data sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="builder" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="builder">Chart Builder</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            </TabsList>
            
            <TabsContent value="builder" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data-source">Data Source</Label>
                  <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                    <SelectTrigger id="data-source">
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
                  <Label htmlFor="chart-type">Chart Type</Label>
                  <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                    <SelectTrigger id="chart-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(chartTypeIcons).map(([type, Icon]) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="x-column">X Column</Label>
                  <Select 
                    value={chartConfig.xColumn || ''} 
                    onValueChange={(value) => setChartConfig(prev => ({ ...prev, xColumn: value }))}
                  >
                    <SelectTrigger id="x-column">
                      <SelectValue placeholder="Select X column" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="y-column">Y Column</Label>
                  <Select 
                    value={chartConfig.yColumn || ''} 
                    onValueChange={(value) => setChartConfig(prev => ({ ...prev, yColumn: value }))}
                  >
                    <SelectTrigger id="y-column">
                      <SelectValue placeholder="Select Y column" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={createChart} className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                Create Chart
              </Button>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-4">
              {charts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No charts created yet. Use the Chart Builder to create your first visualization.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {charts.map(chart => (
                    <Card key={chart.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{chart.title}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChart(chart.id)}
                        >
                          ×
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {renderChart(chart)}
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
