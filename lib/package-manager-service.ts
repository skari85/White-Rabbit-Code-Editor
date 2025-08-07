/**
 * White Rabbit Code Editor - Package Manager Service
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

export interface PackageInfo {
  name: string
  version: string
  description: string
  author?: string
  license?: string
  homepage?: string
  repository?: string
  keywords?: string[]
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  scripts?: Record<string, string>
  main?: string
  types?: string
  files?: string[]
  publishedAt?: string
  downloads?: {
    weekly: number
    monthly: number
    yearly: number
  }
}

export interface PackageSearchResult {
  name: string
  version: string
  description: string
  author?: string
  keywords?: string[]
  downloads?: number
  quality?: number
  popularity?: number
  maintenance?: number
}

export interface PackageInstallOptions {
  dev?: boolean
  peer?: boolean
  exact?: boolean
  save?: boolean
}

export interface PackageJson {
  name: string
  version: string
  description?: string
  main?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  author?: string
  license?: string
  keywords?: string[]
  repository?: string | { type: string; url: string }
  homepage?: string
  bugs?: string | { url: string }
  engines?: Record<string, string>
  files?: string[]
  private?: boolean
}

export class PackageManagerService {
  private packageJson: PackageJson
  private onPackageJsonChange?: (packageJson: PackageJson) => void

  constructor(initialPackageJson?: PackageJson, onPackageJsonChange?: (packageJson: PackageJson) => void) {
    this.packageJson = initialPackageJson || this.createDefaultPackageJson()
    this.onPackageJsonChange = onPackageJsonChange
  }

  private createDefaultPackageJson(): PackageJson {
    return {
      name: 'white-rabbit-project',
      version: '1.0.0',
      description: 'A project created with White Rabbit Code Editor',
      main: 'index.js',
      scripts: {
        start: 'node index.js',
        dev: 'node index.js',
        build: 'echo "Build script not configured"',
        test: 'echo "No tests specified"'
      },
      dependencies: {},
      devDependencies: {},
      author: 'White Rabbit User',
      license: 'MIT',
      keywords: ['white-rabbit', 'project']
    }
  }

  // Get current package.json
  getPackageJson(): PackageJson {
    return { ...this.packageJson }
  }

  // Update package.json
  updatePackageJson(updates: Partial<PackageJson>): void {
    this.packageJson = { ...this.packageJson, ...updates }
    this.onPackageJsonChange?.(this.packageJson)
  }

  // Search for packages on npm registry
  async searchPackages(query: string, limit: number = 20): Promise<PackageSearchResult[]> {
    try {
      const response = await fetch(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${limit}`
      )
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      return data.objects.map((obj: any) => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description || '',
        author: obj.package.author?.name || obj.package.publisher?.username,
        keywords: obj.package.keywords || [],
        downloads: obj.searchScore,
        quality: obj.score?.detail?.quality || 0,
        popularity: obj.score?.detail?.popularity || 0,
        maintenance: obj.score?.detail?.maintenance || 0
      }))
    } catch (error) {
      console.error('Package search failed:', error)
      throw new Error(`Failed to search packages: ${error}`)
    }
  }

  // Get package information
  async getPackageInfo(packageName: string, version?: string): Promise<PackageInfo> {
    try {
      const url = version 
        ? `https://registry.npmjs.org/${packageName}/${version}`
        : `https://registry.npmjs.org/${packageName}/latest`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Package not found: ${packageName}`)
      }

      const data = await response.json()
      
      // Get download stats
      let downloads
      try {
        const downloadsResponse = await fetch(
          `https://api.npmjs.org/downloads/point/last-week/${packageName}`
        )
        if (downloadsResponse.ok) {
          const downloadsData = await downloadsResponse.json()
          downloads = {
            weekly: downloadsData.downloads || 0,
            monthly: 0,
            yearly: 0
          }
        }
      } catch {
        // Downloads API might fail, continue without it
      }

      return {
        name: data.name,
        version: data.version,
        description: data.description || '',
        author: data.author?.name || data.maintainers?.[0]?.name,
        license: data.license,
        homepage: data.homepage,
        repository: typeof data.repository === 'string' 
          ? data.repository 
          : data.repository?.url,
        keywords: data.keywords || [],
        dependencies: data.dependencies || {},
        devDependencies: data.devDependencies || {},
        peerDependencies: data.peerDependencies || {},
        scripts: data.scripts || {},
        main: data.main,
        types: data.types || data.typings,
        files: data.files || [],
        publishedAt: data.time?.[data.version],
        downloads
      }
    } catch (error) {
      console.error(`Failed to get package info for ${packageName}:`, error)
      throw error
    }
  }

  // Install a package
  async installPackage(
    packageName: string, 
    version?: string, 
    options: PackageInstallOptions = {}
  ): Promise<void> {
    try {
      // Get package info to validate it exists
      const packageInfo = await this.getPackageInfo(packageName, version)
      const versionToInstall = version || packageInfo.version
      
      // Determine which dependency section to update
      const dependencyKey = options.dev 
        ? 'devDependencies' 
        : options.peer 
        ? 'peerDependencies' 
        : 'dependencies'

      // Update package.json
      const currentDeps = this.packageJson[dependencyKey] || {}
      const versionSpec = options.exact ? versionToInstall : `^${versionToInstall}`
      
      this.updatePackageJson({
        [dependencyKey]: {
          ...currentDeps,
          [packageName]: versionSpec
        }
      })

      console.log(`✅ Installed ${packageName}@${versionToInstall} ${options.dev ? '(dev)' : ''}`)
    } catch (error) {
      console.error(`Failed to install ${packageName}:`, error)
      throw error
    }
  }

  // Uninstall a package
  async uninstallPackage(packageName: string): Promise<void> {
    try {
      const updatedPackageJson = { ...this.packageJson }
      
      // Remove from all dependency sections
      if (updatedPackageJson.dependencies?.[packageName]) {
        delete updatedPackageJson.dependencies[packageName]
      }
      if (updatedPackageJson.devDependencies?.[packageName]) {
        delete updatedPackageJson.devDependencies[packageName]
      }
      if (updatedPackageJson.peerDependencies?.[packageName]) {
        delete updatedPackageJson.peerDependencies[packageName]
      }

      this.updatePackageJson(updatedPackageJson)
      console.log(`✅ Uninstalled ${packageName}`)
    } catch (error) {
      console.error(`Failed to uninstall ${packageName}:`, error)
      throw error
    }
  }

  // Update a package
  async updatePackage(packageName: string, version?: string): Promise<void> {
    try {
      // Check which dependency section contains the package
      const isInDependencies = this.packageJson.dependencies?.[packageName]
      const isInDevDependencies = this.packageJson.devDependencies?.[packageName]
      const isInPeerDependencies = this.packageJson.peerDependencies?.[packageName]

      if (!isInDependencies && !isInDevDependencies && !isInPeerDependencies) {
        throw new Error(`Package ${packageName} is not installed`)
      }

      // Install with appropriate options
      const options: PackageInstallOptions = {
        dev: !!isInDevDependencies,
        peer: !!isInPeerDependencies
      }

      await this.installPackage(packageName, version, options)
      console.log(`✅ Updated ${packageName}`)
    } catch (error) {
      console.error(`Failed to update ${packageName}:`, error)
      throw error
    }
  }

  // Get all installed packages
  getInstalledPackages(): {
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
    peerDependencies: Record<string, string>
  } {
    return {
      dependencies: this.packageJson.dependencies || {},
      devDependencies: this.packageJson.devDependencies || {},
      peerDependencies: this.packageJson.peerDependencies || {}
    }
  }

  // Check for outdated packages
  async checkOutdatedPackages(): Promise<{
    package: string
    current: string
    latest: string
    type: 'dependencies' | 'devDependencies' | 'peerDependencies'
  }[]> {
    const outdated = []
    const installed = this.getInstalledPackages()

    for (const [type, packages] of Object.entries(installed)) {
      for (const [packageName, currentVersion] of Object.entries(packages)) {
        try {
          const packageInfo = await this.getPackageInfo(packageName)
          const cleanCurrentVersion = currentVersion.replace(/^[\^~]/, '')
          
          if (packageInfo.version !== cleanCurrentVersion) {
            outdated.push({
              package: packageName,
              current: cleanCurrentVersion,
              latest: packageInfo.version,
              type: type as 'dependencies' | 'devDependencies' | 'peerDependencies'
            })
          }
        } catch (error) {
          console.warn(`Failed to check ${packageName} for updates:`, error)
        }
      }
    }

    return outdated
  }

  // Add or update a script
  addScript(name: string, command: string): void {
    const scripts = { ...this.packageJson.scripts, [name]: command }
    this.updatePackageJson({ scripts })
  }

  // Remove a script
  removeScript(name: string): void {
    const scripts = { ...this.packageJson.scripts }
    delete scripts[name]
    this.updatePackageJson({ scripts })
  }

  // Get popular packages by category
  async getPopularPackages(category?: string): Promise<PackageSearchResult[]> {
    const queries = {
      'frontend': 'react vue angular',
      'backend': 'express fastify koa',
      'testing': 'jest mocha cypress',
      'build': 'webpack vite rollup',
      'utility': 'lodash axios moment',
      'ui': 'material-ui antd chakra-ui'
    }

    const query = category && queries[category as keyof typeof queries] 
      ? queries[category as keyof typeof queries]
      : 'popular javascript'

    return this.searchPackages(query, 10)
  }

  // Generate package.json string
  generatePackageJsonString(): string {
    return JSON.stringify(this.packageJson, null, 2)
  }

  // Load package.json from string
  loadPackageJsonFromString(jsonString: string): void {
    try {
      const parsed = JSON.parse(jsonString)
      this.packageJson = { ...this.createDefaultPackageJson(), ...parsed }
      this.onPackageJsonChange?.(this.packageJson)
    } catch (error) {
      throw new Error(`Invalid package.json: ${error}`)
    }
  }
}
