/**
 * White Rabbit Code Editor - Test Panel Component
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  TestTube,
  Play,
  Square,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Target,
  Zap,
  Camera
} from 'lucide-react'
import { 
  TestingFrameworkService, 
  TestConfiguration, 
  TestResult,
  TestSuite,
  TestCase,
  CoverageReport,
  TestFramework
} from '@/lib/testing-framework-service'
import { useAnalytics } from '@/hooks/use-analytics'

interface TestPanelProps {
  testingService: TestingFrameworkService
  onFileSelect?: (file: string, line?: number) => void
  className?: string
}

export function TestPanel({ testingService, onFileSelect, className }: TestPanelProps) {
  const [configurations, setConfigurations] = useState<TestConfiguration[]>([])
  const [activeConfig, setActiveConfig] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map())
  const [testStatus, setTestStatus] = useState<Map<string, string>>(new Map())
  const [testProgress, setTestProgress] = useState<{ current: number; total: number; currentTest?: string } | null>(null)
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set())
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null)

  const { trackFeatureUsed } = useAnalytics()

  // Load configurations and results
  useEffect(() => {
    const loadData = () => {
      setConfigurations(testingService.getConfigurations())
      setTestResults(testingService.getAllTestResults())
      
      // Update test status for all configs
      const statusMap = new Map()
      testingService.getConfigurations().forEach(config => {
        statusMap.set(config.id, testingService.getTestStatus(config.id))
      })
      setTestStatus(statusMap)
    }

    loadData()
    
    // Set up testing service callbacks
    testingService['onTestUpdate'] = (configId: string, result: TestResult) => {
      setTestResults(prev => new Map(prev.set(configId, result)))
      setTestStatus(prev => new Map(prev.set(configId, 'idle')))
      setTestProgress(null)
    }

    testingService['onTestProgress'] = (configId: string, progress: any) => {
      setTestProgress(progress)
      setTestStatus(prev => new Map(prev.set(configId, 'running')))
    }

    return () => {
      testingService['onTestUpdate'] = undefined
      testingService['onTestProgress'] = undefined
    }
  }, [testingService])

  // Handle run tests
  const handleRunTests = async (configId: string, options?: any) => {
    setTestStatus(prev => new Map(prev.set(configId, 'running')))
    setTestProgress({ current: 0, total: 100 })
    
    try {
      await testingService.runTests(configId, options)
      trackFeatureUsed('test_run')
    } catch (error) {
      console.error('Tests failed:', error)
      setTestStatus(prev => new Map(prev.set(configId, 'idle')))
      setTestProgress(null)
    }
  }

  // Handle run specific test
  const handleRunTestFile = async (configId: string, filePath: string) => {
    try {
      await testingService.runTestFile(configId, filePath)
      trackFeatureUsed('test_run_file')
    } catch (error) {
      console.error('Test file run failed:', error)
    }
  }

  // Handle cancel tests
  const handleCancelTests = (configId: string) => {
    testingService.cancelTests(configId)
    setTestStatus(prev => new Map(prev.set(configId, 'idle')))
    setTestProgress(null)
  }

  // Handle start/stop watcher
  const handleToggleWatcher = (configId: string) => {
    const status = testStatus.get(configId)
    if (status === 'watching') {
      testingService.stopWatcher(configId)
      setTestStatus(prev => new Map(prev.set(configId, 'idle')))
    } else {
      testingService.startWatcher(configId)
      setTestStatus(prev => new Map(prev.set(configId, 'watching')))
    }
    trackFeatureUsed('test_watch_toggle')
  }

  // Toggle suite expansion
  const toggleSuiteExpansion = (suiteId: string) => {
    const newExpanded = new Set(expandedSuites)
    if (newExpanded.has(suiteId)) {
      newExpanded.delete(suiteId)
    } else {
      newExpanded.add(suiteId)
    }
    setExpandedSuites(newExpanded)
  }

  // Navigate to test file
  const handleNavigateToTest = (test: TestCase) => {
    onFileSelect?.(test.file, test.line)
    setSelectedTest(test)
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-500'
      case 'watching': return 'text-yellow-500'
      case 'idle': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <RefreshCw className="w-3 h-3 animate-spin" />
      case 'watching': return <Eye className="w-3 h-3" />
      case 'idle': return <Clock className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  // Get test status icon
  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-3 h-3 text-green-500" />
      case 'failed': return <XCircle className="w-3 h-3 text-red-500" />
      case 'skipped': return <Clock className="w-3 h-3 text-gray-500" />
      case 'todo': return <AlertTriangle className="w-3 h-3 text-yellow-500" />
      default: return <Clock className="w-3 h-3 text-gray-500" />
    }
  }

  // Get framework icon
  const getFrameworkIcon = (framework: TestFramework) => {
    switch (framework) {
      case 'jest': return <TestTube className="w-4 h-4" />
      case 'vitest': return <Zap className="w-4 h-4" />
      case 'cypress': return <Target className="w-4 h-4" />
      default: return <TestTube className="w-4 h-4" />
    }
  }

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  // Calculate coverage color
  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500'
    if (percentage >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const activeConfiguration = activeConfig ? configurations.find(c => c.id === activeConfig) : configurations[0]
  const activeTestResult = activeConfiguration ? testResults.get(activeConfiguration.id) : null
  const activeStatus = activeConfiguration ? testStatus.get(activeConfiguration.id) || 'idle' : 'idle'

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Tests
            {activeConfiguration && (
              <Badge variant="outline" className={`text-xs ${getStatusColor(activeStatus)}`}>
                {getStatusIcon(activeStatus)}
                {activeStatus}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm">
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Configuration Selector */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 justify-between">
                <div className="flex items-center gap-2">
                  {activeConfiguration && getFrameworkIcon(activeConfiguration.framework)}
                  {activeConfiguration?.name || 'Select Configuration'}
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              {configurations.map((config) => (
                <DropdownMenuItem
                  key={config.id}
                  onClick={() => setActiveConfig(config.id)}
                  className="flex items-center gap-2"
                >
                  {getFrameworkIcon(config.framework)}
                  {config.name}
                  <Badge variant="outline" className="ml-auto text-xs">
                    {config.framework}
                  </Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {activeConfiguration && (
          <>
            {/* Test Controls */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleRunTests(activeConfiguration.id)}
                disabled={activeStatus === 'running'}
                className="flex-1"
              >
                {activeStatus === 'running' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {activeStatus === 'running' ? 'Running...' : 'Run Tests'}
              </Button>
              
              {activeStatus === 'running' && (
                <Button
                  variant="outline"
                  onClick={() => handleCancelTests(activeConfiguration.id)}
                >
                  <Square className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Watch Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleToggleWatcher(activeConfiguration.id)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                {activeStatus === 'watching' ? 'Stop Watching' : 'Watch Mode'}
              </Button>
              
              {activeConfiguration.framework === 'jest' && (
                <Button
                  variant="outline"
                  onClick={() => testingService.updateSnapshots(activeConfiguration.id)}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            {testProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Running tests...</span>
                  <span>{testProgress.current}/{testProgress.total}</span>
                </div>
                <Progress value={(testProgress.current / testProgress.total) * 100} />
                {testProgress.currentTest && (
                  <div className="text-xs text-muted-foreground">
                    {testProgress.currentTest}
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Test Results */}
            <Tabs defaultValue="results" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="coverage">Coverage</TabsTrigger>
                <TabsTrigger value="config">Config</TabsTrigger>
              </TabsList>

              {/* Results Tab */}
              <TabsContent value="results" className="space-y-3">
                {activeTestResult && (
                  <div className="space-y-3">
                    {/* Test Summary */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{activeTestResult.passedTests} passed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>{activeTestResult.failedTests} failed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Duration: {formatDuration(activeTestResult.duration)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TestTube className="w-4 h-4" />
                        <span>{activeTestResult.totalTests} total</span>
                      </div>
                    </div>

                    {/* Test Suites */}
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {activeTestResult.suites.map((suite) => (
                          <div key={suite.id} className="border rounded">
                            <div
                              className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted"
                              onClick={() => toggleSuiteExpansion(suite.id)}
                            >
                              <div className="flex items-center gap-2">
                                {expandedSuites.has(suite.id) ? 
                                  <ChevronDown className="w-3 h-3" /> : 
                                  <ChevronRight className="w-3 h-3" />
                                }
                                {getTestStatusIcon(suite.status)}
                                <span className="text-sm font-medium">{suite.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {suite.tests.length} tests
                                </Badge>
                              </div>
                              {suite.duration && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDuration(suite.duration)}
                                </span>
                              )}
                            </div>
                            
                            {expandedSuites.has(suite.id) && (
                              <div className="border-t">
                                {suite.tests.map((test) => (
                                  <div
                                    key={test.id}
                                    className="flex items-center justify-between p-2 pl-8 hover:bg-muted cursor-pointer text-sm"
                                    onClick={() => handleNavigateToTest(test)}
                                  >
                                    <div className="flex items-center gap-2">
                                      {getTestStatusIcon(test.status)}
                                      <span>{test.name}</span>
                                      {test.todo && (
                                        <Badge variant="outline" className="text-xs">
                                          TODO
                                        </Badge>
                                      )}
                                    </div>
                                    {test.duration && (
                                      <span className="text-xs text-muted-foreground">
                                        {formatDuration(test.duration)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Test Errors */}
                    {selectedTest?.error && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-red-500">Test Error</h4>
                        <div className="p-3 rounded border border-red-200 bg-red-50 text-sm">
                          <div className="font-medium text-red-700 mb-2">
                            {selectedTest.error.message}
                          </div>
                          {selectedTest.error.diff && (
                            <div className="space-y-1">
                              <div className="text-red-600">
                                Expected: {JSON.stringify(selectedTest.error.diff.expected)}
                              </div>
                              <div className="text-red-600">
                                Actual: {JSON.stringify(selectedTest.error.diff.actual)}
                              </div>
                            </div>
                          )}
                          {selectedTest.error.stack && (
                            <pre className="text-xs text-red-600 mt-2 overflow-x-auto">
                              {selectedTest.error.stack}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!activeTestResult && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <TestTube className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No test results yet</p>
                    <p className="text-xs">Run tests to see results</p>
                  </div>
                )}
              </TabsContent>

              {/* Coverage Tab */}
              <TabsContent value="coverage" className="space-y-3">
                {activeTestResult?.coverage ? (
                  <div className="space-y-4">
                    {/* Coverage Summary */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Lines:</span>
                        <span className={getCoverageColor(activeTestResult.coverage.lines.percentage)}>
                          {activeTestResult.coverage.lines.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Functions:</span>
                        <span className={getCoverageColor(activeTestResult.coverage.functions.percentage)}>
                          {activeTestResult.coverage.functions.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Branches:</span>
                        <span className={getCoverageColor(activeTestResult.coverage.branches.percentage)}>
                          {activeTestResult.coverage.branches.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Statements:</span>
                        <span className={getCoverageColor(activeTestResult.coverage.statements.percentage)}>
                          {activeTestResult.coverage.statements.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* File Coverage */}
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {Object.entries(activeTestResult.coverage.files).map(([path, fileCoverage]) => (
                          <div
                            key={path}
                            className="p-2 rounded border hover:bg-muted cursor-pointer"
                            onClick={() => onFileSelect?.(path)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{path}</span>
                              <span className={`text-xs ${getCoverageColor(fileCoverage.lines.percentage)}`}>
                                {fileCoverage.lines.percentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {fileCoverage.lines.covered}/{fileCoverage.lines.total} lines covered
                            </div>
                            {fileCoverage.uncoveredLines.length > 0 && (
                              <div className="text-xs text-red-600 mt-1">
                                Uncovered lines: {fileCoverage.uncoveredLines.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No coverage data</p>
                    <p className="text-xs">Enable coverage in configuration</p>
                  </div>
                )}
              </TabsContent>

              {/* Config Tab */}
              <TabsContent value="config" className="space-y-3">
                <ScrollArea className="h-48">
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Framework:</span>
                        <div className="flex items-center gap-2 mt-1">
                          {getFrameworkIcon(activeConfiguration.framework)}
                          {activeConfiguration.framework}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Type:</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {activeConfiguration.type}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Test Environment:</span>
                      <div className="text-muted-foreground mt-1">{activeConfiguration.testEnvironment}</div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Test Match:</span>
                      <div className="text-muted-foreground mt-1 space-y-1">
                        {activeConfiguration.testMatch.map((pattern, index) => (
                          <div key={index} className="font-mono text-xs">{pattern}</div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Coverage:</span>
                      <Badge variant={activeConfiguration.coverage ? "default" : "secondary"} className="text-xs">
                        {activeConfiguration.coverage ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Timeout:</span>
                      <span className="text-muted-foreground">{activeConfiguration.timeout}ms</span>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        )}

        {configurations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TestTube className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No test configurations</p>
            <p className="text-xs">Add a configuration to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
