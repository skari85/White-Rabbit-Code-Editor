'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Gauge, 
  Timer, 
  TrendingUp, 
  RefreshCw, 
  Trash2,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { usePerformanceMonitor } from '@/lib/performance-monitor';

export function PerformanceMonitorPanel() {
  const {
    metrics,
    events,
    getWebVitals,
    calculatePerformanceScore,
    clearMetrics,
  } = usePerformanceMonitor();

  const vitals = getWebVitals();
  const performanceScore = calculatePerformanceScore();

  const getVitalStatus = (value: number, thresholds: { good: number; needsImprovement: number }) => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'needs-improvement': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'needs-improvement': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'poor': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const lcpStatus = getVitalStatus(vitals.LCP, { good: 2500, needsImprovement: 4000 });
  const fidStatus = getVitalStatus(vitals.FID, { good: 100, needsImprovement: 300 });
  const clsStatus = getVitalStatus(vitals.CLS, { good: 0.1, needsImprovement: 0.25 });

  const recentMetrics = metrics.slice(-10).reverse();
  const recentEvents = events.slice(-10).reverse();

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="w-5 h-5" />
            Performance Monitor
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearMetrics}
              className="text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-700">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs">Metrics</TabsTrigger>
            <TabsTrigger value="events" className="text-xs">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Performance Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Performance Score</span>
                <Badge variant={performanceScore >= 90 ? 'default' : performanceScore >= 70 ? 'secondary' : 'destructive'}>
                  {performanceScore}/100
                </Badge>
              </div>
              <Progress value={performanceScore} className="h-2" />
            </div>

            {/* Web Vitals */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Web Vitals</h4>
              
              <div className="grid grid-cols-1 gap-3">
                {/* LCP */}
                <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(lcpStatus)}
                    <span className="text-xs text-gray-300">LCP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-300">
                      {vitals.LCP.toFixed(0)}ms
                    </span>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(lcpStatus)}`} />
                  </div>
                </div>

                {/* FID */}
                <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(fidStatus)}
                    <span className="text-xs text-gray-300">FID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-300">
                      {vitals.FID.toFixed(0)}ms
                    </span>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(fidStatus)}`} />
                  </div>
                </div>

                {/* CLS */}
                <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(clsStatus)}
                    <span className="text-xs text-gray-300">CLS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-300">
                      {vitals.CLS.toFixed(3)}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(clsStatus)}`} />
                  </div>
                </div>

                {/* FP & FCP */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-700/50 rounded text-center">
                    <div className="text-xs text-gray-400">FP</div>
                    <div className="text-xs font-mono text-gray-300">
                      {vitals.FP.toFixed(0)}ms
                    </div>
                  </div>
                  <div className="p-2 bg-gray-700/50 rounded text-center">
                    <div className="text-xs text-gray-400">FCP</div>
                    <div className="text-xs font-mono text-gray-300">
                      {vitals.FCP.toFixed(0)}ms
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="mt-4">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {recentMetrics.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No metrics recorded yet
                  </div>
                ) : (
                  recentMetrics.map((metric, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-700/50 rounded text-xs"
                    >
                      <div className="flex-1">
                        <div className="text-gray-300 font-medium">{metric.name}</div>
                        <div className="text-gray-400">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-300 font-mono">
                          {metric.value.toFixed(2)}{metric.unit}
                        </div>
                        {metric.metadata && (
                          <div className="text-gray-400 text-xs">
                            {Object.keys(metric.metadata).length} props
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {recentEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No events recorded yet
                  </div>
                ) : (
                  recentEvents.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-700/50 rounded text-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                          <span className="text-gray-300 font-medium">{event.name}</span>
                        </div>
                        <div className="text-gray-400">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-300 font-mono">
                          {event.value.toFixed(2)}
                        </div>
                        {event.metadata && (
                          <div className="text-gray-400 text-xs">
                            {Object.keys(event.metadata).length} props
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 