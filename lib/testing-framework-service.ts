/**
 * White Rabbit Code Editor - Testing Framework Service
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

export type TestFramework = 'jest' | 'vitest' | 'mocha' | 'jasmine' | 'cypress' | 'playwright' | 'custom'
export type TestType = 'unit' | 'integration' | 'e2e' | 'component' | 'snapshot'
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'todo'

export interface TestConfiguration {
  id: string
  name: string
  framework: TestFramework
  type: TestType
  testMatch: string[]
  setupFiles?: string[]
  testEnvironment: 'node' | 'jsdom' | 'browser'
  coverage: boolean
  watch: boolean
  verbose: boolean
  bail: boolean
  maxWorkers?: number
  timeout?: number
  retries?: number
  collectCoverageFrom?: string[]
  coverageThreshold?: {
    global: {
      branches: number
      functions: number
      lines: number
      statements: number
    }
  }
}

export interface TestSuite {
  id: string
  name: string
  file: string
  tests: TestCase[]
  status: TestStatus
  duration?: number
  setupErrors?: string[]
  teardownErrors?: string[]
}

export interface TestCase {
  id: string
  name: string
  suite: string
  file: string
  line?: number
  status: TestStatus
  duration?: number
  error?: TestError
  retries?: number
  timeout?: number
  skip?: boolean
  todo?: boolean
}

export interface TestError {
  message: string
  stack?: string
  diff?: {
    expected: any
    actual: any
  }
  matcherResult?: {
    pass: boolean
    message: string
  }
}

export interface TestResult {
  success: boolean
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  todoTests: number
  duration: number
  suites: TestSuite[]
  coverage?: CoverageReport
  errors: string[]
  warnings: string[]
}

export interface CoverageReport {
  lines: CoverageData
  functions: CoverageData
  branches: CoverageData
  statements: CoverageData
  files: Record<string, FileCoverage>
}

export interface CoverageData {
  total: number
  covered: number
  percentage: number
}

export interface FileCoverage {
  path: string
  lines: CoverageData
  functions: CoverageData
  branches: CoverageData
  statements: CoverageData
  uncoveredLines: number[]
}

export interface TestWatcher {
  id: string
  configId: string
  isRunning: boolean
  lastRun?: Date
  changedFiles: string[]
}

export class TestingFrameworkService {
  private configurations: Map<string, TestConfiguration> = new Map()
  private testResults: Map<string, TestResult> = new Map()
  private watchers: Map<string, TestWatcher> = new Map()
  private runningTests: Map<string, AbortController> = new Map()
  private onTestUpdate?: (configId: string, result: TestResult) => void
  private onTestProgress?: (configId: string, progress: { current: number; total: number; currentTest?: string }) => void

  constructor(
    onTestUpdate?: (configId: string, result: TestResult) => void,
    onTestProgress?: (configId: string, progress: { current: number; total: number; currentTest?: string }) => void
  ) {
    this.onTestUpdate = onTestUpdate
    this.onTestProgress = onTestProgress
    this.initializeDefaultConfigurations()
  }

  private initializeDefaultConfigurations(): void {
    // Jest configuration
    const jestConfig: TestConfiguration = {
      id: 'jest-default',
      name: 'Jest Unit Tests',
      framework: 'jest',
      type: 'unit',
      testMatch: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.{test,spec}.{js,jsx,ts,tsx}'],
      setupFiles: ['<rootDir>/src/setupTests.js'],
      testEnvironment: 'jsdom',
      coverage: true,
      watch: false,
      verbose: true,
      bail: false,
      timeout: 5000,
      collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/index.js'
      ],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }

    // Vitest configuration
    const vitestConfig: TestConfiguration = {
      id: 'vitest-default',
      name: 'Vitest Unit Tests',
      framework: 'vitest',
      type: 'unit',
      testMatch: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      testEnvironment: 'jsdom',
      coverage: true,
      watch: false,
      verbose: true,
      bail: false,
      timeout: 5000
    }

    // Cypress E2E configuration
    const cypressConfig: TestConfiguration = {
      id: 'cypress-default',
      name: 'Cypress E2E Tests',
      framework: 'cypress',
      type: 'e2e',
      testMatch: ['cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'],
      testEnvironment: 'browser',
      coverage: false,
      watch: false,
      verbose: true,
      bail: false,
      timeout: 10000,
      retries: 2
    }

    this.configurations.set(jestConfig.id, jestConfig)
    this.configurations.set(vitestConfig.id, vitestConfig)
    this.configurations.set(cypressConfig.id, cypressConfig)
  }

  // Get all test configurations
  getConfigurations(): TestConfiguration[] {
    return Array.from(this.configurations.values())
  }

  // Get configuration by ID
  getConfiguration(id: string): TestConfiguration | null {
    return this.configurations.get(id) || null
  }

  // Add or update configuration
  setConfiguration(config: TestConfiguration): void {
    this.configurations.set(config.id, config)
  }

  // Remove configuration
  removeConfiguration(id: string): void {
    this.configurations.delete(id)
    this.testResults.delete(id)
    this.stopWatcher(id)
  }

  // Detect test framework from project files
  async detectTestFramework(files: Record<string, any>): Promise<TestFramework> {
    // Check for configuration files
    if (files['jest.config.js'] || files['jest.config.ts']) return 'jest'
    if (files['vitest.config.js'] || files['vitest.config.ts']) return 'vitest'
    if (files['cypress.config.js'] || files['cypress.config.ts']) return 'cypress'
    if (files['playwright.config.js'] || files['playwright.config.ts']) return 'playwright'
    
    // Check package.json for dependencies
    if (files['package.json']) {
      try {
        const packageJson = JSON.parse(files['package.json'].content)
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
        
        if (deps['jest'] || deps['@jest/core']) return 'jest'
        if (deps['vitest']) return 'vitest'
        if (deps['cypress']) return 'cypress'
        if (deps['@playwright/test']) return 'playwright'
        if (deps['mocha']) return 'mocha'
        if (deps['jasmine']) return 'jasmine'
      } catch (error) {
        console.warn('Failed to parse package.json:', error)
      }
    }

    return 'custom'
  }

  // Generate test configuration based on project structure
  async generateConfiguration(
    files: Record<string, any>,
    framework?: TestFramework,
    type: TestType = 'unit'
  ): Promise<TestConfiguration> {
    const detectedFramework = framework || await this.detectTestFramework(files)
    
    // Detect test files
    const testFiles = Object.keys(files).filter(file => 
      file.includes('.test.') || 
      file.includes('.spec.') || 
      file.includes('__tests__') ||
      file.includes('/tests/') ||
      (file.includes('/cypress/') && file.includes('.cy.'))
    )

    const config: TestConfiguration = {
      id: `${detectedFramework}-generated-${Date.now()}`,
      name: `${detectedFramework.charAt(0).toUpperCase() + detectedFramework.slice(1)} ${type} Tests`,
      framework: detectedFramework,
      type,
      testMatch: this.getDefaultTestMatch(detectedFramework, type),
      testEnvironment: type === 'e2e' ? 'browser' : 'jsdom',
      coverage: type !== 'e2e',
      watch: false,
      verbose: true,
      bail: false,
      timeout: type === 'e2e' ? 30000 : 5000
    }

    return config
  }

  private getDefaultTestMatch(framework: TestFramework, type: TestType): string[] {
    if (type === 'e2e') {
      if (framework === 'cypress') return ['cypress/e2e/**/*.cy.{js,jsx,ts,tsx}']
      if (framework === 'playwright') return ['tests/**/*.spec.{js,ts}']
    }
    
    return ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.{test,spec}.{js,jsx,ts,tsx}']
  }

  // Run tests
  async runTests(configId: string, options?: { 
    files?: string[]
    watch?: boolean
    coverage?: boolean
    updateSnapshots?: boolean
  }): Promise<TestResult> {
    const config = this.configurations.get(configId)
    if (!config) {
      throw new Error(`Configuration not found: ${configId}`)
    }

    // Cancel any existing test run
    if (this.runningTests.has(configId)) {
      this.runningTests.get(configId)?.abort()
    }

    const abortController = new AbortController()
    this.runningTests.set(configId, abortController)

    const startTime = Date.now()

    try {
      console.log(`🧪 Starting ${config.framework} tests: ${config.name}`)
      
      // Simulate test execution
      const result = await this.executeTests(config, options, abortController.signal)
      
      const duration = Date.now() - startTime
      const testResult: TestResult = {
        ...result,
        duration
      }

      this.testResults.set(configId, testResult)
      this.onTestUpdate?.(configId, testResult)
      
      console.log(`✅ Tests completed in ${duration}ms`)
      console.log(`📊 Results: ${result.passedTests}/${result.totalTests} passed`)
      
      return testResult

    } catch (error) {
      const duration = Date.now() - startTime
      const testResult: TestResult = {
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        todoTests: 0,
        duration,
        suites: [],
        errors: [error instanceof Error ? error.message : 'Test execution failed'],
        warnings: []
      }

      this.testResults.set(configId, testResult)
      this.onTestUpdate?.(configId, testResult)
      
      console.error(`❌ Tests failed after ${duration}ms:`, error)
      return testResult

    } finally {
      this.runningTests.delete(configId)
    }
  }

  // Execute tests based on framework
  private async executeTests(
    config: TestConfiguration,
    options: any = {},
    signal: AbortSignal
  ): Promise<Omit<TestResult, 'duration'>> {
    // In a real implementation, this would execute the actual test frameworks
    // For now, we'll simulate the test execution
    
    const testFiles = ['math.test.js', 'utils.test.js', 'component.test.jsx']
    const totalTests = testFiles.length * 3 // Simulate 3 tests per file
    
    // Simulate test progress
    for (let i = 0; i < totalTests; i++) {
      if (signal.aborted) {
        throw new Error('Tests were cancelled')
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      this.onTestProgress?.(config.id, {
        current: i + 1,
        total: totalTests,
        currentTest: `Test ${i + 1}`
      })
    }

    // Simulate test results
    const suites: TestSuite[] = testFiles.map((file, index) => ({
      id: `suite-${index}`,
      name: file.replace('.test.', '').replace('.spec.', ''),
      file,
      status: 'passed' as TestStatus,
      duration: 150 + Math.random() * 300,
      tests: [
        {
          id: `test-${index}-1`,
          name: 'should work correctly',
          suite: `suite-${index}`,
          file,
          line: 10,
          status: 'passed' as TestStatus,
          duration: 50 + Math.random() * 100
        },
        {
          id: `test-${index}-2`,
          name: 'should handle edge cases',
          suite: `suite-${index}`,
          file,
          line: 20,
          status: index === 1 ? 'failed' as TestStatus : 'passed' as TestStatus,
          duration: 30 + Math.random() * 70,
          error: index === 1 ? {
            message: 'Expected true but received false',
            stack: 'Error: Expected true but received false\n    at test.js:25:10',
            diff: {
              expected: true,
              actual: false
            }
          } : undefined
        },
        {
          id: `test-${index}-3`,
          name: 'should be implemented later',
          suite: `suite-${index}`,
          file,
          line: 30,
          status: 'todo' as TestStatus,
          todo: true
        }
      ]
    }))

    const passedTests = suites.reduce((sum, suite) => 
      sum + suite.tests.filter(test => test.status === 'passed').length, 0
    )
    const failedTests = suites.reduce((sum, suite) => 
      sum + suite.tests.filter(test => test.status === 'failed').length, 0
    )
    const todoTests = suites.reduce((sum, suite) => 
      sum + suite.tests.filter(test => test.status === 'todo').length, 0
    )

    // Simulate coverage report
    const coverage: CoverageReport = {
      lines: { total: 100, covered: 85, percentage: 85 },
      functions: { total: 20, covered: 18, percentage: 90 },
      branches: { total: 15, covered: 12, percentage: 80 },
      statements: { total: 95, covered: 80, percentage: 84.2 },
      files: {
        'src/math.js': {
          path: 'src/math.js',
          lines: { total: 25, covered: 23, percentage: 92 },
          functions: { total: 5, covered: 5, percentage: 100 },
          branches: { total: 3, covered: 3, percentage: 100 },
          statements: { total: 24, covered: 22, percentage: 91.7 },
          uncoveredLines: [15, 28]
        },
        'src/utils.js': {
          path: 'src/utils.js',
          lines: { total: 40, covered: 32, percentage: 80 },
          functions: { total: 8, covered: 7, percentage: 87.5 },
          branches: { total: 6, covered: 4, percentage: 66.7 },
          statements: { total: 38, covered: 30, percentage: 78.9 },
          uncoveredLines: [12, 18, 25, 33, 41, 45, 52, 58]
        }
      }
    }

    return {
      success: failedTests === 0,
      totalTests,
      passedTests,
      failedTests,
      skippedTests: 0,
      todoTests,
      suites,
      coverage: config.coverage ? coverage : undefined,
      errors: [],
      warnings: failedTests > 0 ? [`${failedTests} test(s) failed`] : []
    }
  }

  // Get test results
  getTestResults(configId: string): TestResult | null {
    return this.testResults.get(configId) || null
  }

  // Get all test results
  getAllTestResults(): Map<string, TestResult> {
    return new Map(this.testResults)
  }

  // Cancel test run
  cancelTests(configId: string): void {
    const abortController = this.runningTests.get(configId)
    if (abortController) {
      abortController.abort()
      this.runningTests.delete(configId)
      console.log(`🚫 Tests cancelled: ${configId}`)
    }
  }

  // Start test watcher
  startWatcher(configId: string): void {
    const config = this.configurations.get(configId)
    if (!config) return

    if (this.watchers.has(configId)) {
      console.warn(`Watcher already running for ${configId}`)
      return
    }

    const watcher: TestWatcher = {
      id: `watcher-${configId}`,
      configId,
      isRunning: true,
      changedFiles: []
    }

    this.watchers.set(configId, watcher)
    console.log(`👀 Started test watcher for ${configId}`)

    // In a real implementation, this would set up file system watchers
    // and automatically run tests when files change
  }

  // Stop test watcher
  stopWatcher(configId: string): void {
    const watcher = this.watchers.get(configId)
    if (watcher) {
      watcher.isRunning = false
      this.watchers.delete(configId)
      console.log(`👁️ Stopped test watcher for ${configId}`)
    }
  }

  // Get running watchers
  getRunningWatchers(): TestWatcher[] {
    return Array.from(this.watchers.values()).filter(w => w.isRunning)
  }

  // Get test status
  getTestStatus(configId: string): 'idle' | 'running' | 'watching' {
    if (this.runningTests.has(configId)) return 'running'
    if (this.watchers.has(configId)) return 'watching'
    return 'idle'
  }

  // Run specific test file
  async runTestFile(configId: string, filePath: string): Promise<TestResult> {
    return this.runTests(configId, { files: [filePath] })
  }

  // Run specific test case
  async runTestCase(configId: string, testId: string): Promise<TestResult> {
    // In a real implementation, this would run only the specific test
    return this.runTests(configId)
  }

  // Update snapshots
  async updateSnapshots(configId: string): Promise<void> {
    const config = this.configurations.get(configId)
    if (!config) return

    console.log(`📸 Updating snapshots for ${configId}`)
    // In a real implementation, this would update test snapshots
  }
}
