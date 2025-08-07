/**
 * White Rabbit Code Editor - Build System Service
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

export type BuildTool = 'vite' | 'webpack' | 'rollup' | 'parcel' | 'esbuild' | 'turbo' | 'next' | 'custom'

export interface BuildConfiguration {
  id: string
  name: string
  tool: BuildTool
  entry: string
  output: string
  mode: 'development' | 'production'
  target: 'web' | 'node' | 'electron'
  sourceMaps: boolean
  minify: boolean
  watch: boolean
  hot: boolean
  port?: number
  host?: string
  publicPath?: string
  env?: Record<string, string>
  plugins?: string[]
  alias?: Record<string, string>
  externals?: string[]
  optimization?: {
    splitChunks?: boolean
    treeshaking?: boolean
    minification?: boolean
  }
}

export interface BuildResult {
  success: boolean
  duration: number
  errors: BuildError[]
  warnings: BuildWarning[]
  assets: BuildAsset[]
  stats?: BuildStats
}

export interface BuildError {
  id: string
  message: string
  file?: string
  line?: number
  column?: number
  stack?: string
  severity: 'error' | 'warning'
}

export interface BuildWarning {
  id: string
  message: string
  file?: string
  line?: number
  column?: number
}

export interface BuildAsset {
  name: string
  size: number
  type: 'js' | 'css' | 'html' | 'image' | 'font' | 'other'
  path: string
  gzipSize?: number
}

export interface BuildStats {
  totalSize: number
  totalGzipSize: number
  chunkCount: number
  moduleCount: number
  buildTime: number
  hotReloadTime?: number
}

export interface DevServerOptions {
  port: number
  host: string
  hot: boolean
  open: boolean
  proxy?: Record<string, string>
  headers?: Record<string, string>
  historyApiFallback?: boolean
}

export class BuildSystemService {
  private configurations: Map<string, BuildConfiguration> = new Map()
  private activeBuilds: Map<string, AbortController> = new Map()
  private devServers: Map<string, any> = new Map()
  private onBuildUpdate?: (configId: string, result: BuildResult) => void
  private onDevServerUpdate?: (configId: string, status: 'starting' | 'running' | 'stopped', url?: string) => void

  constructor(
    onBuildUpdate?: (configId: string, result: BuildResult) => void,
    onDevServerUpdate?: (configId: string, status: 'starting' | 'running' | 'stopped', url?: string) => void
  ) {
    this.onBuildUpdate = onBuildUpdate
    this.onDevServerUpdate = onDevServerUpdate
    this.initializeDefaultConfigurations()
  }

  private initializeDefaultConfigurations(): void {
    // Vite configuration
    const viteConfig: BuildConfiguration = {
      id: 'vite-default',
      name: 'Vite Development',
      tool: 'vite',
      entry: 'src/main.ts',
      output: 'dist',
      mode: 'development',
      target: 'web',
      sourceMaps: true,
      minify: false,
      watch: true,
      hot: true,
      port: 5173,
      host: 'localhost',
      publicPath: '/',
      env: {
        NODE_ENV: 'development'
      },
      plugins: ['@vitejs/plugin-react', '@vitejs/plugin-typescript'],
      optimization: {
        splitChunks: true,
        treeshaking: true,
        minification: false
      }
    }

    // Webpack configuration
    const webpackConfig: BuildConfiguration = {
      id: 'webpack-default',
      name: 'Webpack Development',
      tool: 'webpack',
      entry: 'src/index.js',
      output: 'dist',
      mode: 'development',
      target: 'web',
      sourceMaps: true,
      minify: false,
      watch: true,
      hot: true,
      port: 8080,
      host: 'localhost',
      publicPath: '/',
      env: {
        NODE_ENV: 'development'
      },
      plugins: ['html-webpack-plugin', 'webpack-dev-server'],
      optimization: {
        splitChunks: true,
        treeshaking: false,
        minification: false
      }
    }

    // Next.js configuration
    const nextConfig: BuildConfiguration = {
      id: 'next-default',
      name: 'Next.js Development',
      tool: 'next',
      entry: 'pages/index.js',
      output: '.next',
      mode: 'development',
      target: 'web',
      sourceMaps: true,
      minify: false,
      watch: true,
      hot: true,
      port: 3000,
      host: 'localhost',
      env: {
        NODE_ENV: 'development'
      }
    }

    this.configurations.set(viteConfig.id, viteConfig)
    this.configurations.set(webpackConfig.id, webpackConfig)
    this.configurations.set(nextConfig.id, nextConfig)
  }

  // Get all build configurations
  getConfigurations(): BuildConfiguration[] {
    return Array.from(this.configurations.values())
  }

  // Get configuration by ID
  getConfiguration(id: string): BuildConfiguration | null {
    return this.configurations.get(id) || null
  }

  // Add or update configuration
  setConfiguration(config: BuildConfiguration): void {
    this.configurations.set(config.id, config)
  }

  // Remove configuration
  removeConfiguration(id: string): void {
    this.configurations.delete(id)
  }

  // Detect build tool from project files
  async detectBuildTool(files: Record<string, any>): Promise<BuildTool> {
    // Check for configuration files
    if (files['vite.config.js'] || files['vite.config.ts']) return 'vite'
    if (files['webpack.config.js'] || files['webpack.config.ts']) return 'webpack'
    if (files['rollup.config.js'] || files['rollup.config.ts']) return 'rollup'
    if (files['next.config.js'] || files['next.config.ts']) return 'next'
    if (files['turbo.json']) return 'turbo'
    
    // Check package.json for dependencies
    if (files['package.json']) {
      try {
        const packageJson = JSON.parse(files['package.json'].content)
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
        
        if (deps['vite']) return 'vite'
        if (deps['webpack']) return 'webpack'
        if (deps['rollup']) return 'rollup'
        if (deps['parcel']) return 'parcel'
        if (deps['esbuild']) return 'esbuild'
        if (deps['next']) return 'next'
        if (deps['turbo']) return 'turbo'
      } catch (error) {
        console.warn('Failed to parse package.json:', error)
      }
    }

    return 'custom'
  }

  // Generate configuration based on project structure
  async generateConfiguration(
    files: Record<string, any>, 
    tool: BuildTool,
    mode: 'development' | 'production' = 'development'
  ): Promise<BuildConfiguration> {
    const detectedTool = await this.detectBuildTool(files)
    const buildTool = tool || detectedTool

    // Detect entry point
    let entry = 'src/index.js'
    if (files['src/main.ts']) entry = 'src/main.ts'
    else if (files['src/main.js']) entry = 'src/main.js'
    else if (files['src/index.ts']) entry = 'src/index.ts'
    else if (files['src/index.jsx']) entry = 'src/index.jsx'
    else if (files['src/index.tsx']) entry = 'src/index.tsx'
    else if (files['pages/index.js'] && buildTool === 'next') entry = 'pages/index.js'
    else if (files['app/page.tsx'] && buildTool === 'next') entry = 'app/page.tsx'

    const config: BuildConfiguration = {
      id: `${buildTool}-generated-${Date.now()}`,
      name: `${buildTool.charAt(0).toUpperCase() + buildTool.slice(1)} ${mode}`,
      tool: buildTool,
      entry,
      output: buildTool === 'next' ? '.next' : 'dist',
      mode,
      target: 'web',
      sourceMaps: mode === 'development',
      minify: mode === 'production',
      watch: mode === 'development',
      hot: mode === 'development',
      port: this.getDefaultPort(buildTool),
      host: 'localhost',
      publicPath: '/',
      env: {
        NODE_ENV: mode
      },
      plugins: this.getDefaultPlugins(buildTool),
      optimization: {
        splitChunks: true,
        treeshaking: mode === 'production',
        minification: mode === 'production'
      }
    }

    return config
  }

  private getDefaultPort(tool: BuildTool): number {
    const ports = {
      vite: 5173,
      webpack: 8080,
      rollup: 8080,
      parcel: 1234,
      esbuild: 8080,
      next: 3000,
      turbo: 3000,
      custom: 8080
    }
    return ports[tool]
  }

  private getDefaultPlugins(tool: BuildTool): string[] {
    const plugins = {
      vite: ['@vitejs/plugin-react', '@vitejs/plugin-typescript'],
      webpack: ['html-webpack-plugin', 'webpack-dev-server'],
      rollup: ['@rollup/plugin-node-resolve', '@rollup/plugin-commonjs'],
      parcel: [],
      esbuild: [],
      next: [],
      turbo: [],
      custom: []
    }
    return plugins[tool]
  }

  // Start build process
  async build(configId: string): Promise<BuildResult> {
    const config = this.configurations.get(configId)
    if (!config) {
      throw new Error(`Configuration not found: ${configId}`)
    }

    // Cancel any existing build
    if (this.activeBuilds.has(configId)) {
      this.activeBuilds.get(configId)?.abort()
    }

    const abortController = new AbortController()
    this.activeBuilds.set(configId, abortController)

    const startTime = Date.now()

    try {
      console.log(`🔨 Starting ${config.tool} build: ${config.name}`)
      
      // Simulate build process based on tool
      const result = await this.executeBuild(config, abortController.signal)
      
      const duration = Date.now() - startTime
      const buildResult: BuildResult = {
        ...result,
        duration
      }

      this.onBuildUpdate?.(configId, buildResult)
      console.log(`✅ Build completed in ${duration}ms`)
      
      return buildResult

    } catch (error) {
      const duration = Date.now() - startTime
      const buildResult: BuildResult = {
        success: false,
        duration,
        errors: [{
          id: 'build-error',
          message: error instanceof Error ? error.message : 'Build failed',
          severity: 'error'
        }],
        warnings: [],
        assets: []
      }

      this.onBuildUpdate?.(configId, buildResult)
      console.error(`❌ Build failed after ${duration}ms:`, error)
      
      return buildResult

    } finally {
      this.activeBuilds.delete(configId)
    }
  }

  // Execute build based on tool
  private async executeBuild(config: BuildConfiguration, signal: AbortSignal): Promise<Omit<BuildResult, 'duration'>> {
    // In a real implementation, this would execute the actual build tools
    // For now, we'll simulate the build process
    
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate build time
    
    if (signal.aborted) {
      throw new Error('Build was cancelled')
    }

    // Simulate build results
    const assets: BuildAsset[] = [
      {
        name: 'main.js',
        size: 245760,
        type: 'js',
        path: `${config.output}/main.js`,
        gzipSize: 67890
      },
      {
        name: 'main.css',
        size: 12340,
        type: 'css',
        path: `${config.output}/main.css`,
        gzipSize: 3456
      },
      {
        name: 'index.html',
        size: 2048,
        type: 'html',
        path: `${config.output}/index.html`
      }
    ]

    const stats: BuildStats = {
      totalSize: assets.reduce((sum, asset) => sum + asset.size, 0),
      totalGzipSize: assets.reduce((sum, asset) => sum + (asset.gzipSize || 0), 0),
      chunkCount: assets.filter(a => a.type === 'js').length,
      moduleCount: 42,
      buildTime: 2000
    }

    return {
      success: true,
      errors: [],
      warnings: [],
      assets,
      stats
    }
  }

  // Start development server
  async startDevServer(configId: string, options?: Partial<DevServerOptions>): Promise<string> {
    const config = this.configurations.get(configId)
    if (!config) {
      throw new Error(`Configuration not found: ${configId}`)
    }

    if (this.devServers.has(configId)) {
      throw new Error(`Dev server already running for ${configId}`)
    }

    const serverOptions: DevServerOptions = {
      port: config.port || 8080,
      host: config.host || 'localhost',
      hot: config.hot || false,
      open: false,
      ...options
    }

    this.onDevServerUpdate?.(configId, 'starting')

    try {
      // In a real implementation, this would start the actual dev server
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000))

      const url = `http://${serverOptions.host}:${serverOptions.port}`
      
      // Store server reference (in real implementation, this would be the actual server)
      this.devServers.set(configId, {
        url,
        options: serverOptions,
        startTime: Date.now()
      })

      this.onDevServerUpdate?.(configId, 'running', url)
      console.log(`🚀 Dev server started: ${url}`)

      return url

    } catch (error) {
      this.onDevServerUpdate?.(configId, 'stopped')
      console.error('Failed to start dev server:', error)
      throw error
    }
  }

  // Stop development server
  async stopDevServer(configId: string): Promise<void> {
    const server = this.devServers.get(configId)
    if (!server) {
      throw new Error(`No dev server running for ${configId}`)
    }

    try {
      // In a real implementation, this would stop the actual server
      await new Promise(resolve => setTimeout(resolve, 500))

      this.devServers.delete(configId)
      this.onDevServerUpdate?.(configId, 'stopped')
      console.log(`🛑 Dev server stopped for ${configId}`)

    } catch (error) {
      console.error('Failed to stop dev server:', error)
      throw error
    }
  }

  // Get running dev servers
  getRunningDevServers(): Array<{ configId: string; url: string; startTime: number }> {
    const servers = []
    for (const [configId, server] of this.devServers.entries()) {
      servers.push({
        configId,
        url: server.url,
        startTime: server.startTime
      })
    }
    return servers
  }

  // Cancel build
  cancelBuild(configId: string): void {
    const abortController = this.activeBuilds.get(configId)
    if (abortController) {
      abortController.abort()
      this.activeBuilds.delete(configId)
      console.log(`🚫 Build cancelled: ${configId}`)
    }
  }

  // Get build status
  getBuildStatus(configId: string): 'idle' | 'building' | 'error' | 'success' {
    if (this.activeBuilds.has(configId)) {
      return 'building'
    }
    return 'idle'
  }

  // Watch for file changes (in real implementation, this would use file watchers)
  startWatching(configId: string, onFileChange: (files: string[]) => void): void {
    const config = this.configurations.get(configId)
    if (!config || !config.watch) return

    // In a real implementation, this would set up file watchers
    console.log(`👀 Started watching files for ${configId}`)
  }

  // Stop watching
  stopWatching(configId: string): void {
    console.log(`👁️ Stopped watching files for ${configId}`)
  }
}
