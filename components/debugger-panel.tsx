'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Play, 
  Pause, 
  StepOver, 
  StepInto, 
  StepOut,
  Square,
  Bug,
  Eye,
  List,
  Variable,
  Watch,
  Plus,
  Minus,
  Settings,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { 
  debuggerService, 
  DebuggerState, 
  DebuggerVariable, 
  DebuggerCallFrame,
  DebuggerBreakpoint 
} from '@/lib/debugger-service';
import { cn } from '@/lib/utils';

interface DebuggerPanelProps {
  className?: string;
  onBreakpointToggle?: (line: number) => void;
}

export function DebuggerPanel({ className, onBreakpointToggle }: DebuggerPanelProps) {
  const [state, setState] = useState<DebuggerState>(debuggerService.getState());
  const [watchExpression, setWatchExpression] = useState('');
  const [evaluateExpression, setEvaluateExpression] = useState('');
  const [evaluateResult, setEvaluateResult] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [expandedVariables, setExpandedVariables] = useState<Set<string>>(new Set());

  // Update state when debugger state changes
  useEffect(() => {
    const updateState = () => {
      setState(debuggerService.getState());
    };

    // In a real implementation, this would listen to debugger events
    const interval = setInterval(updateState, 1000);
    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(async () => {
    const success = await debuggerService.connect();
    if (success) {
      setState(debuggerService.getState());
    }
  }, []);

  const disconnect = useCallback(async () => {
    await debuggerService.disconnect();
    setState(debuggerService.getState());
  }, []);

  const continueExecution = useCallback(async () => {
    await debuggerService.continue();
    setState(debuggerService.getState());
  }, []);

  const pauseExecution = useCallback(async () => {
    await debuggerService.pause();
    setState(debuggerService.getState());
  }, []);

  const stepOver = useCallback(async () => {
    await debuggerService.stepOver();
    setState(debuggerService.getState());
  }, []);

  const stepInto = useCallback(async () => {
    await debuggerService.stepInto();
    setState(debuggerService.getState());
  }, []);

  const stepOut = useCallback(async () => {
    await debuggerService.stepOut();
    setState(debuggerService.getState());
  }, []);

  const addWatchExpression = useCallback(async () => {
    if (watchExpression.trim()) {
      await debuggerService.addWatchExpression(watchExpression.trim());
      setWatchExpression('');
      setState(debuggerService.getState());
    }
  }, [watchExpression]);

  const removeWatchExpression = useCallback(async (expression: string) => {
    await debuggerService.removeWatchExpression(expression);
    setState(debuggerService.getState());
  }, []);

  const evaluateExpressionHandler = useCallback(async () => {
    if (evaluateExpression.trim()) {
      const result = await debuggerService.evaluateExpression(evaluateExpression.trim());
      setEvaluateResult(`${result.result} (${result.type})`);
    }
  }, [evaluateExpression]);

  const toggleVariableExpansion = useCallback((variableName: string) => {
    setExpandedVariables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variableName)) {
        newSet.delete(variableName);
      } else {
        newSet.add(variableName);
      }
      return newSet;
    });
  }, []);

  const renderVariable = useCallback((variable: DebuggerVariable, depth = 0) => {
    const isExpanded = expandedVariables.has(variable.name);
    const hasChildren = variable.children && variable.children.length > 0;

    return (
      <div key={variable.name} style={{ paddingLeft: `${depth * 16}px` }}>
        <div className="flex items-center gap-2 py-1 hover:bg-gray-800/50 rounded">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleVariableExpansion(variable.name)}
              className="w-4 h-4 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-4" />}
          
          <span className="text-xs font-mono text-blue-400">{variable.name}</span>
          <span className="text-xs text-gray-400">:</span>
          <span className="text-xs text-green-400">{variable.value}</span>
          <Badge variant="outline" className="text-xs ml-auto">
            {variable.type}
          </Badge>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {variable.children!.map(child => renderVariable(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [expandedVariables, toggleVariableExpansion]);

  if (!state.isRunning && !state.isPaused) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Debugger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-400 mb-4">Debugger not connected</p>
            <Button onClick={connect} size="sm">
              Connect Debugger
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Debugger
            {state.isPaused && (
              <Badge variant="secondary" className="text-xs text-orange-400">
                Paused
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="w-6 h-6 p-0"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Debug Controls */}
        <div className="flex items-center gap-1 p-3 border-b border-gray-800">
          {state.isPaused ? (
            <>
              <Button size="sm" onClick={continueExecution} className="flex-1">
                <Play className="w-3 h-3 mr-1" />
                Continue
              </Button>
              <Button size="sm" variant="outline" onClick={stepOver}>
                <StepOver className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={stepInto}>
                <StepInto className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={stepOut}>
                <StepOut className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" onClick={pauseExecution} className="flex-1">
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={disconnect}>
            <Square className="w-3 h-3" />
          </Button>
        </div>

        <Tabs defaultValue="variables" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="variables" className="text-xs">Variables</TabsTrigger>
            <TabsTrigger value="callstack" className="text-xs">Call Stack</TabsTrigger>
            <TabsTrigger value="watch" className="text-xs">Watch</TabsTrigger>
            <TabsTrigger value="console" className="text-xs">Console</TabsTrigger>
          </TabsList>

          <TabsContent value="variables" className="mt-3">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {state.variables.map(variable => renderVariable(variable))}
                {state.variables.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No variables available
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="callstack" className="mt-3">
            <ScrollArea className="h-64">
              <div className="space-y-1">
                {state.callStack.map((frame, index) => (
                  <div
                    key={frame.id}
                    className={cn(
                      "p-2 rounded text-xs cursor-pointer",
                      index === 0 ? "bg-blue-600/20 border border-blue-500/50" : "hover:bg-gray-800/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <List className="w-3 h-3" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{frame.name}</div>
                        <div className="text-gray-400">
                          {frame.source}:{frame.line}:{frame.column}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {state.callStack.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No call stack available
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="watch" className="mt-3">
            <div className="space-y-3">
              {/* Add Watch Expression */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add watch expression..."
                  value={watchExpression}
                  onChange={(e) => setWatchExpression(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addWatchExpression()}
                  className="flex-1"
                />
                <Button size="sm" onClick={addWatchExpression} disabled={!watchExpression.trim()}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {/* Watch Expressions */}
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {state.watchExpressions.map((expression, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-800/50 rounded text-xs"
                    >
                      <div className="flex-1">
                        <div className="font-mono">{expression}</div>
                        <div className="text-gray-400">undefined</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWatchExpression(expression)}
                        className="w-4 h-4 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {state.watchExpressions.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      No watch expressions
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="console" className="mt-3">
            <div className="space-y-3">
              {/* Evaluate Expression */}
              <div className="space-y-2">
                <Input
                  placeholder="Evaluate expression..."
                  value={evaluateExpression}
                  onChange={(e) => setEvaluateExpression(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && evaluateExpressionHandler()}
                />
                {evaluateResult && (
                  <div className="p-2 bg-gray-800/50 rounded text-xs font-mono">
                    {evaluateResult}
                  </div>
                )}
              </div>

              {/* Debug Console Output */}
              <div className="h-32 bg-black/20 rounded p-2">
                <div className="text-xs text-gray-400 font-mono">
                  <div>[Debug Console] Ready</div>
                  <div>[Debug Console] Type expressions to evaluate</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Debugger Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Source Maps</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => debuggerService.setSourceMapsEnabled(true)}
              >
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Performance Profiling</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => debuggerService.startProfiling()}
              >
                Start
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default DebuggerPanel; 