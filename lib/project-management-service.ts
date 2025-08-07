/**
 * White Rabbit Code Editor - Project Management Service
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

export type ProjectType = 'web' | 'node' | 'react' | 'vue' | 'angular' | 'python' | 'rust' | 'go' | 'java' | 'csharp' | 'mobile' | 'desktop' | 'library' | 'custom'

export interface ProjectConfig {
  // Basic project information
  name: string
  description?: string
  version: string
  type: ProjectType
  language: string
  framework?: string
  
  // Project structure
  rootPath: string
  srcPath: string
  buildPath: string
  testPath: string
  docsPath: string
  
  // Dependencies and package management
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'cargo' | 'go' | 'maven' | 'gradle' | 'nuget'
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  
  // Build configuration
  buildConfig: {
    entry: string
    output: string
    target: string
    mode: 'development' | 'production'
    sourceMaps: boolean
    minify: boolean
  }
  
  // Development server
  devServer: {
    port: number
    host: string
    hot: boolean
    open: boolean
    proxy?: Record<string, string>
  }
  
  // Testing configuration
  testConfig: {
    framework: string
    testMatch: string[]
    coverage: boolean
    threshold?: {
      statements: number
      branches: number
      functions: number
      lines: number
    }
  }
  
  // Linting and formatting
  lintConfig: {
    enabled: boolean
    rules: Record<string, any>
    ignorePatterns: string[]
  }
  
  formatConfig: {
    enabled: boolean
    tabSize: number
    insertSpaces: boolean
    printWidth: number
    semi: boolean
    singleQuote: boolean
    trailingComma: 'none' | 'es5' | 'all'
  }
  
  // Git configuration
  gitConfig: {
    remote?: string
    branch: string
    ignorePatterns: string[]
    hooks: Record<string, string>
  }
  
  // Environment variables
  env: {
    development: Record<string, string>
    production: Record<string, string>
    test: Record<string, string>
  }
  
  // Scripts and tasks
  scripts: Record<string, string>
  
  // Extensions and plugins
  extensions: string[]
  
  // Workspace settings
  workspace: {
    folders: string[]
    settings: Record<string, any>
    extensions: {
      recommendations: string[]
      unwantedRecommendations: string[]
    }
  }
  
  // Metadata
  createdAt: string
  updatedAt: string
  author?: string
  license?: string
  repository?: string
  homepage?: string
  keywords: string[]
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  type: ProjectType
  language: string
  framework?: string
  tags: string[]
  config: Partial<ProjectConfig>
  files: Record<string, string> // file path -> content
  icon?: string
  featured: boolean
}

export interface Workspace {
  id: string
  name: string
  path: string
  projects: ProjectConfig[]
  settings: Record<string, any>
  recentFiles: string[]
  openTabs: string[]
  layout: any
  createdAt: string
  lastOpened: string
}

export class ProjectManagementService {
  private currentProject: ProjectConfig | null = null
  private currentWorkspace: Workspace | null = null
  private projectTemplates: Map<string, ProjectTemplate> = new Map()
  private recentProjects: ProjectConfig[] = []
  private onProjectChange?: (project: ProjectConfig | null) => void
  private onWorkspaceChange?: (workspace: Workspace | null) => void

  constructor(
    onProjectChange?: (project: ProjectConfig | null) => void,
    onWorkspaceChange?: (workspace: Workspace | null) => void
  ) {
    this.onProjectChange = onProjectChange
    this.onWorkspaceChange = onWorkspaceChange
    this.initializeTemplates()
    this.loadRecentProjects()
  }

  private initializeTemplates(): void {
    const templates: ProjectTemplate[] = [
      // React TypeScript Template
      {
        id: 'react-typescript',
        name: 'React TypeScript App',
        description: 'Modern React application with TypeScript, Vite, and Tailwind CSS',
        type: 'react',
        language: 'typescript',
        framework: 'react',
        tags: ['react', 'typescript', 'vite', 'tailwind'],
        featured: true,
        config: {
          type: 'react',
          language: 'typescript',
          framework: 'react',
          packageManager: 'npm',
          srcPath: 'src',
          buildPath: 'dist',
          testPath: 'src/__tests__',
          buildConfig: {
            entry: 'src/main.tsx',
            output: 'dist',
            target: 'web',
            mode: 'development',
            sourceMaps: true,
            minify: false
          },
          devServer: {
            port: 5173,
            host: 'localhost',
            hot: true,
            open: true
          },
          testConfig: {
            framework: 'vitest',
            testMatch: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
            coverage: true
          },
          scripts: {
            'dev': 'vite',
            'build': 'tsc && vite build',
            'preview': 'vite preview',
            'test': 'vitest',
            'lint': 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0'
          }
        },
        files: {
          'package.json': JSON.stringify({
            name: 'react-typescript-app',
            private: true,
            version: '0.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'tsc && vite build',
              lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
              preview: 'vite preview'
            },
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0'
            },
            devDependencies: {
              '@types/react': '^18.2.43',
              '@types/react-dom': '^18.2.17',
              '@typescript-eslint/eslint-plugin': '^6.14.0',
              '@typescript-eslint/parser': '^6.14.0',
              '@vitejs/plugin-react': '^4.2.1',
              eslint: '^8.55.0',
              'eslint-plugin-react-hooks': '^4.6.0',
              'eslint-plugin-react-refresh': '^0.4.5',
              typescript: '^5.2.2',
              vite: '^5.0.8'
            }
          }, null, 2),
          'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
          'src/App.tsx': `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>White Rabbit React App</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
    </div>
  )
}

export default App`,
          'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`
        }
      },

      // Node.js TypeScript API Template
      {
        id: 'node-typescript-api',
        name: 'Node.js TypeScript API',
        description: 'RESTful API with Express, TypeScript, and testing setup',
        type: 'node',
        language: 'typescript',
        framework: 'express',
        tags: ['node', 'typescript', 'express', 'api'],
        featured: true,
        config: {
          type: 'node',
          language: 'typescript',
          framework: 'express',
          packageManager: 'npm',
          srcPath: 'src',
          buildPath: 'dist',
          testPath: 'src/__tests__',
          buildConfig: {
            entry: 'src/index.ts',
            output: 'dist',
            target: 'node',
            mode: 'development',
            sourceMaps: true,
            minify: false
          },
          devServer: {
            port: 3000,
            host: 'localhost',
            hot: true,
            open: false
          },
          testConfig: {
            framework: 'jest',
            testMatch: ['**/*.{test,spec}.{js,ts}'],
            coverage: true
          },
          scripts: {
            'dev': 'ts-node-dev --respawn --transpile-only src/index.ts',
            'build': 'tsc',
            'start': 'node dist/index.js',
            'test': 'jest',
            'lint': 'eslint src --ext .ts'
          }
        },
        files: {
          'package.json': JSON.stringify({
            name: 'node-typescript-api',
            version: '1.0.0',
            description: 'Node.js TypeScript API',
            main: 'dist/index.js',
            scripts: {
              dev: 'ts-node-dev --respawn --transpile-only src/index.ts',
              build: 'tsc',
              start: 'node dist/index.js',
              test: 'jest',
              lint: 'eslint src --ext .ts'
            },
            dependencies: {
              express: '^4.18.2',
              cors: '^2.8.5',
              helmet: '^7.1.0'
            },
            devDependencies: {
              '@types/express': '^4.17.21',
              '@types/cors': '^2.8.17',
              '@types/node': '^20.10.5',
              '@typescript-eslint/eslint-plugin': '^6.14.0',
              '@typescript-eslint/parser': '^6.14.0',
              eslint: '^8.55.0',
              jest: '^29.7.0',
              'ts-node-dev': '^2.0.0',
              typescript: '^5.3.3'
            }
          }, null, 2),
          'src/index.ts': `import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'White Rabbit API is running!' })
})

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`)
})`,
          'tsconfig.json': JSON.stringify({
            compilerOptions: {
              target: 'ES2020',
              module: 'commonjs',
              lib: ['ES2020'],
              outDir: './dist',
              rootDir: './src',
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
              forceConsistentCasingInFileNames: true,
              resolveJsonModule: true
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist']
          }, null, 2)
        }
      },

      // Python FastAPI Template
      {
        id: 'python-fastapi',
        name: 'Python FastAPI',
        description: 'Modern Python API with FastAPI, Pydantic, and async support',
        type: 'python',
        language: 'python',
        framework: 'fastapi',
        tags: ['python', 'fastapi', 'api', 'async'],
        featured: true,
        config: {
          type: 'python',
          language: 'python',
          framework: 'fastapi',
          packageManager: 'pip',
          srcPath: 'app',
          buildPath: 'dist',
          testPath: 'tests',
          devServer: {
            port: 8000,
            host: '0.0.0.0',
            hot: true,
            open: false
          },
          testConfig: {
            framework: 'pytest',
            testMatch: ['tests/**/*.py'],
            coverage: true
          },
          scripts: {
            'dev': 'uvicorn app.main:app --reload',
            'start': 'uvicorn app.main:app --host 0.0.0.0 --port 8000',
            'test': 'pytest',
            'lint': 'flake8 app tests'
          }
        },
        files: {
          'requirements.txt': `fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6`,
          'app/main.py': `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

app = FastAPI(
    title="White Rabbit API",
    description="A FastAPI application created with White Rabbit Code Editor",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    tax: Optional[float] = None

@app.get("/")
async def root():
    return {"message": "White Rabbit FastAPI is running!"}

@app.get("/health")
async def health_check():
    return {"status": "OK", "service": "White Rabbit API"}

@app.post("/items/")
async def create_item(item: Item):
    return {"item": item, "message": "Item created successfully"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
          'app/__init__.py': '',
          'tests/__init__.py': '',
          'tests/test_main.py': `from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "White Rabbit FastAPI is running!"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()`
        }
      },

      // Rust CLI Template
      {
        id: 'rust-cli',
        name: 'Rust CLI Application',
        description: 'Command-line application with Clap and error handling',
        type: 'desktop',
        language: 'rust',
        tags: ['rust', 'cli', 'command-line'],
        featured: false,
        config: {
          type: 'desktop',
          language: 'rust',
          packageManager: 'cargo',
          srcPath: 'src',
          buildPath: 'target',
          testPath: 'tests',
          buildConfig: {
            entry: 'src/main.rs',
            output: 'target',
            target: 'native',
            mode: 'development',
            sourceMaps: false,
            minify: false
          },
          testConfig: {
            framework: 'cargo',
            testMatch: ['tests/**/*.rs', 'src/**/*.rs'],
            coverage: false
          },
          scripts: {
            'dev': 'cargo run',
            'build': 'cargo build',
            'release': 'cargo build --release',
            'test': 'cargo test',
            'lint': 'cargo clippy'
          }
        },
        files: {
          'Cargo.toml': `[package]
name = "white-rabbit-cli"
version = "0.1.0"
edition = "2021"

[dependencies]
clap = { version = "4.4", features = ["derive"] }
anyhow = "1.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"`,
          'src/main.rs': `use clap::{Arg, Command};
use anyhow::Result;

fn main() -> Result<()> {
    let matches = Command::new("white-rabbit-cli")
        .version("0.1.0")
        .author("White Rabbit Team")
        .about("A CLI application created with White Rabbit Code Editor")
        .arg(
            Arg::new("name")
                .short('n')
                .long("name")
                .value_name("NAME")
                .help("Sets a custom name")
        )
        .get_matches();

    let name = matches.get_one::<String>("name").unwrap_or(&"World".to_string());
    println!("Hello, {}! 🐰", name);

    Ok(())
}`
        }
      }
    ]

    for (const template of templates) {
      this.projectTemplates.set(template.id, template)
    }
  }

  private loadRecentProjects(): void {
    try {
      const stored = localStorage.getItem('whiterabbit_recent_projects')
      if (stored) {
        this.recentProjects = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load recent projects:', error)
    }
  }

  private saveRecentProjects(): void {
    try {
      localStorage.setItem('whiterabbit_recent_projects', JSON.stringify(this.recentProjects))
    } catch (error) {
      console.warn('Failed to save recent projects:', error)
    }
  }

  // Create new project from template
  async createProject(templateId: string, projectName: string, projectPath: string): Promise<ProjectConfig> {
    const template = this.projectTemplates.get(templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    const now = new Date().toISOString()
    const project: ProjectConfig = {
      ...template.config,
      name: projectName,
      version: '1.0.0',
      rootPath: projectPath,
      createdAt: now,
      updatedAt: now,
      keywords: template.tags || []
    } as ProjectConfig

    // Create project files
    for (const [filePath, content] of Object.entries(template.files)) {
      // In a real implementation, you would write these files to the filesystem
      console.log(`Creating file: ${filePath}`)
    }

    // Add to recent projects
    this.addToRecentProjects(project)

    console.log(`✅ Created project: ${projectName} from template ${templateId}`)
    return project
  }

  // Load existing project
  async loadProject(projectPath: string): Promise<ProjectConfig> {
    try {
      // In a real implementation, this would read the .whiterabbit/config.json file
      // For now, we'll simulate loading a project
      
      const configPath = `${projectPath}/.whiterabbit/config.json`
      console.log(`Loading project from: ${configPath}`)

      // Simulate project config
      const project: ProjectConfig = {
        name: 'Existing Project',
        version: '1.0.0',
        type: 'web',
        language: 'typescript',
        rootPath: projectPath,
        srcPath: 'src',
        buildPath: 'dist',
        testPath: 'tests',
        docsPath: 'docs',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
        buildConfig: {
          entry: 'src/index.ts',
          output: 'dist',
          target: 'web',
          mode: 'development',
          sourceMaps: true,
          minify: false
        },
        devServer: {
          port: 3000,
          host: 'localhost',
          hot: true,
          open: true
        },
        testConfig: {
          framework: 'jest',
          testMatch: ['**/*.{test,spec}.{js,ts}'],
          coverage: true
        },
        lintConfig: {
          enabled: true,
          rules: {},
          ignorePatterns: ['node_modules', 'dist']
        },
        formatConfig: {
          enabled: true,
          tabSize: 2,
          insertSpaces: true,
          printWidth: 80,
          semi: true,
          singleQuote: true,
          trailingComma: 'es5'
        },
        gitConfig: {
          branch: 'main',
          ignorePatterns: ['node_modules', 'dist', '.env'],
          hooks: {}
        },
        env: {
          development: {},
          production: {},
          test: {}
        },
        scripts: {},
        extensions: [],
        workspace: {
          folders: [],
          settings: {},
          extensions: {
            recommendations: [],
            unwantedRecommendations: []
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        keywords: []
      }

      this.setCurrentProject(project)
      this.addToRecentProjects(project)

      return project
    } catch (error) {
      console.error('Failed to load project:', error)
      throw new Error(`Failed to load project from ${projectPath}`)
    }
  }

  // Save project configuration
  async saveProject(project: ProjectConfig): Promise<void> {
    try {
      project.updatedAt = new Date().toISOString()
      
      // In a real implementation, this would write to .whiterabbit/config.json
      const configPath = `${project.rootPath}/.whiterabbit/config.json`
      const configContent = JSON.stringify(project, null, 2)
      
      console.log(`Saving project config to: ${configPath}`)
      console.log('Config content:', configContent)

      this.setCurrentProject(project)
      this.addToRecentProjects(project)

      console.log(`✅ Saved project: ${project.name}`)
    } catch (error) {
      console.error('Failed to save project:', error)
      throw new Error(`Failed to save project: ${project.name}`)
    }
  }

  // Set current project
  setCurrentProject(project: ProjectConfig | null): void {
    this.currentProject = project
    this.onProjectChange?.(project)
  }

  // Get current project
  getCurrentProject(): ProjectConfig | null {
    return this.currentProject
  }

  // Get project templates
  getProjectTemplates(): ProjectTemplate[] {
    return Array.from(this.projectTemplates.values())
  }

  // Get featured templates
  getFeaturedTemplates(): ProjectTemplate[] {
    return Array.from(this.projectTemplates.values()).filter(t => t.featured)
  }

  // Get templates by type
  getTemplatesByType(type: ProjectType): ProjectTemplate[] {
    return Array.from(this.projectTemplates.values()).filter(t => t.type === type)
  }

  // Get recent projects
  getRecentProjects(): ProjectConfig[] {
    return [...this.recentProjects]
  }

  // Add to recent projects
  private addToRecentProjects(project: ProjectConfig): void {
    // Remove if already exists
    this.recentProjects = this.recentProjects.filter(p => p.rootPath !== project.rootPath)
    
    // Add to beginning
    this.recentProjects.unshift(project)
    
    // Keep only last 10
    this.recentProjects = this.recentProjects.slice(0, 10)
    
    this.saveRecentProjects()
  }

  // Create workspace
  async createWorkspace(name: string, path: string): Promise<Workspace> {
    const workspace: Workspace = {
      id: `workspace-${Date.now()}`,
      name,
      path,
      projects: [],
      settings: {},
      recentFiles: [],
      openTabs: [],
      layout: {},
      createdAt: new Date().toISOString(),
      lastOpened: new Date().toISOString()
    }

    this.setCurrentWorkspace(workspace)
    return workspace
  }

  // Load workspace
  async loadWorkspace(workspacePath: string): Promise<Workspace> {
    // In a real implementation, this would load from .whiterabbit/workspace.json
    const workspace: Workspace = {
      id: `workspace-${Date.now()}`,
      name: 'Loaded Workspace',
      path: workspacePath,
      projects: [],
      settings: {},
      recentFiles: [],
      openTabs: [],
      layout: {},
      createdAt: new Date().toISOString(),
      lastOpened: new Date().toISOString()
    }

    this.setCurrentWorkspace(workspace)
    return workspace
  }

  // Set current workspace
  setCurrentWorkspace(workspace: Workspace | null): void {
    this.currentWorkspace = workspace
    this.onWorkspaceChange?.(workspace)
  }

  // Get current workspace
  getCurrentWorkspace(): Workspace | null {
    return this.currentWorkspace
  }

  // Generate project configuration
  generateProjectConfig(options: {
    name: string
    type: ProjectType
    language: string
    framework?: string
    packageManager?: string
  }): Partial<ProjectConfig> {
    const { name, type, language, framework, packageManager = 'npm' } = options

    return {
      name,
      type,
      language,
      framework,
      packageManager: packageManager as any,
      version: '1.0.0',
      srcPath: 'src',
      buildPath: type === 'rust' ? 'target' : 'dist',
      testPath: type === 'python' ? 'tests' : 'src/__tests__',
      docsPath: 'docs',
      dependencies: {},
      devDependencies: {},
      buildConfig: {
        entry: this.getDefaultEntry(language),
        output: type === 'rust' ? 'target' : 'dist',
        target: type === 'node' ? 'node' : 'web',
        mode: 'development',
        sourceMaps: true,
        minify: false
      },
      devServer: {
        port: this.getDefaultPort(type, framework),
        host: 'localhost',
        hot: true,
        open: type !== 'node'
      },
      testConfig: {
        framework: this.getDefaultTestFramework(language),
        testMatch: this.getDefaultTestMatch(language),
        coverage: true
      },
      scripts: this.getDefaultScripts(type, language, framework),
      keywords: [type, language, framework].filter(Boolean) as string[]
    }
  }

  private getDefaultEntry(language: string): string {
    const entries = {
      typescript: 'src/index.ts',
      javascript: 'src/index.js',
      python: 'app/main.py',
      rust: 'src/main.rs',
      go: 'main.go',
      java: 'src/main/java/Main.java',
      csharp: 'Program.cs'
    }
    return entries[language as keyof typeof entries] || 'src/index.js'
  }

  private getDefaultPort(type: ProjectType, framework?: string): number {
    if (framework === 'react' || framework === 'vue') return 5173
    if (framework === 'angular') return 4200
    if (framework === 'fastapi') return 8000
    if (type === 'node') return 3000
    return 8080
  }

  private getDefaultTestFramework(language: string): string {
    const frameworks = {
      typescript: 'jest',
      javascript: 'jest',
      python: 'pytest',
      rust: 'cargo',
      go: 'go test',
      java: 'junit',
      csharp: 'xunit'
    }
    return frameworks[language as keyof typeof frameworks] || 'jest'
  }

  private getDefaultTestMatch(language: string): string[] {
    const patterns = {
      typescript: ['**/*.{test,spec}.{js,ts}'],
      javascript: ['**/*.{test,spec}.js'],
      python: ['tests/**/*.py'],
      rust: ['tests/**/*.rs'],
      go: ['**/*_test.go'],
      java: ['src/test/**/*.java'],
      csharp: ['**/*.Tests.cs']
    }
    return patterns[language as keyof typeof patterns] || ['**/*.test.js']
  }

  private getDefaultScripts(type: ProjectType, language: string, framework?: string): Record<string, string> {
    const baseScripts = {
      dev: 'echo "Development server not configured"',
      build: 'echo "Build script not configured"',
      test: 'echo "Test script not configured"',
      lint: 'echo "Lint script not configured"'
    }

    if (framework === 'react') {
      return {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
        test: 'vitest',
        lint: 'eslint . --ext ts,tsx'
      }
    }

    if (language === 'python') {
      return {
        dev: 'uvicorn app.main:app --reload',
        start: 'uvicorn app.main:app',
        test: 'pytest',
        lint: 'flake8 app tests'
      }
    }

    if (language === 'rust') {
      return {
        dev: 'cargo run',
        build: 'cargo build',
        release: 'cargo build --release',
        test: 'cargo test',
        lint: 'cargo clippy'
      }
    }

    if (type === 'node') {
      return {
        dev: 'ts-node-dev --respawn src/index.ts',
        build: 'tsc',
        start: 'node dist/index.js',
        test: 'jest',
        lint: 'eslint src --ext .ts'
      }
    }

    return baseScripts
  }

  // Detect project type from files
  detectProjectType(files: Record<string, any>): { type: ProjectType; language: string; framework?: string } {
    // Check for specific framework files
    if (files['package.json']) {
      const packageJson = JSON.parse(files['package.json'].content || '{}')
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

      if (deps['react']) return { type: 'react', language: 'typescript', framework: 'react' }
      if (deps['vue']) return { type: 'web', language: 'typescript', framework: 'vue' }
      if (deps['@angular/core']) return { type: 'web', language: 'typescript', framework: 'angular' }
      if (deps['express']) return { type: 'node', language: 'typescript', framework: 'express' }
      if (deps['next']) return { type: 'web', language: 'typescript', framework: 'next' }

      return { type: 'web', language: 'javascript' }
    }

    if (files['Cargo.toml']) return { type: 'desktop', language: 'rust' }
    if (files['go.mod']) return { type: 'desktop', language: 'go' }
    if (files['requirements.txt'] || files['pyproject.toml']) return { type: 'python', language: 'python' }
    if (files['pom.xml'] || files['build.gradle']) return { type: 'java', language: 'java' }
    if (files['*.csproj'] || files['*.sln']) return { type: 'desktop', language: 'csharp' }

    return { type: 'custom', language: 'javascript' }
  }

  // Validate project configuration
  validateProjectConfig(config: Partial<ProjectConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Project name is required')
    }

    if (!config.type) {
      errors.push('Project type is required')
    }

    if (!config.language) {
      errors.push('Programming language is required')
    }

    if (!config.rootPath || config.rootPath.trim().length === 0) {
      errors.push('Root path is required')
    }

    if (config.devServer?.port && (config.devServer.port < 1 || config.devServer.port > 65535)) {
      errors.push('Dev server port must be between 1 and 65535')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
