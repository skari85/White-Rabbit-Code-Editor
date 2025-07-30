#!/usr/bin/env node

/**
 * Hex & Kex Development Environment Setup Script
 * 
 * This script automates the setup process for the Hex & Kex Code Development project.
 * It handles dependency installation, environment configuration, and development server startup.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevEnvironmentManager {
  constructor() {
    this.projectRoot = process.cwd();
    this.port = 3000;
    this.isServerRunning = false;
  }

  // Check if Node.js is installed
  async checkNodeInstallation() {
    try {
      const version = execSync('node --version', { encoding: 'utf8' }).trim();
      return { installed: true, version };
    } catch (error) {
      return { installed: false, version: null };
    }
  }

  // Check if npm is installed
  async checkNpmInstallation() {
    try {
      const version = execSync('npm --version', { encoding: 'utf8' }).trim();
      return { installed: true, version };
    } catch (error) {
      return { installed: false, version: null };
    }
  }

  // Install dependencies
  async installDependencies() {
    console.log('📦 Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencies installed successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to install dependencies:', error.message);
      return false;
    }
  }

  // Find available port
  async findAvailablePort(startPort = 3000) {
    const net = require('net');
    
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(startPort, () => {
        const { port } = server.address();
        server.close(() => resolve(port));
      });
      server.on('error', () => {
        resolve(this.findAvailablePort(startPort + 1));
      });
    });
  }

  // Start development server
  async startDevServer(port) {
    console.log(`🚀 Starting development server on port ${port}...`);
    
    return new Promise((resolve, reject) => {
      const server = spawn('npm', ['run', 'dev', '--', '-p', port.toString()], {
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      let isReady = false;

      server.stdout.on('data', (data) => {
        const message = data.toString();
        output += message;
        
        if (message.includes('Ready') || message.includes('Local:')) {
          if (!isReady) {
            isReady = true;
            console.log(`✅ Development server ready at http://localhost:${port}`);
            resolve({ success: true, port });
          }
        }
      });

      server.stderr.on('data', (data) => {
        console.error(`Server error: ${data.toString()}`);
      });

      server.on('error', (error) => {
        console.error('❌ Failed to start server:', error.message);
        reject(error);
      });

      server.on('close', (code) => {
        if (code !== 0) {
          console.error(`❌ Server process exited with code ${code}`);
        }
      });

      // Store server reference for cleanup
      this.server = server;
    });
  }

  // Create project structure
  async createProjectStructure(projectName) {
    const projectPath = path.join(this.projectRoot, projectName);
    
    if (fs.existsSync(projectPath)) {
      console.log(`⚠️  Project directory '${projectName}' already exists`);
      return false;
    }

    console.log(`📁 Creating project structure for '${projectName}'...`);
    
    try {
      // Create directory structure
      const dirs = [
        '',
        'app',
        'app/api',
        'app/api/auth',
        'components',
        'components/ui',
        'hooks',
        'lib',
        'public',
        'styles',
        'types'
      ];

      dirs.forEach(dir => {
        fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
      });

      // Generate package.json
      const packageJson = this.generatePackageJson(projectName);
      fs.writeFileSync(path.join(projectPath, 'package.json'), packageJson);

      // Generate Next.js config
      const nextConfig = this.generateNextConfig();
      fs.writeFileSync(path.join(projectPath, 'next.config.mjs'), nextConfig);

      // Generate TypeScript config
      const tsConfig = this.generateTsConfig();
      fs.writeFileSync(path.join(projectPath, 'tsconfig.json'), tsConfig);

      // Generate Tailwind config
      const tailwindConfig = this.generateTailwindConfig();
      fs.writeFileSync(path.join(projectPath, 'tailwind.config.ts'), tailwindConfig);

      // Generate global CSS
      const globalCss = this.generateGlobalsCss();
      fs.writeFileSync(path.join(projectPath, 'app/globals.css'), globalCss);

      // Generate layout
      const layout = this.generateLayout();
      fs.writeFileSync(path.join(projectPath, 'app/layout.tsx'), layout);

      // Generate main page
      const page = this.generatePage();
      fs.writeFileSync(path.join(projectPath, 'app/page.tsx'), page);

      // Generate README
      const readme = this.generateReadme(projectName);
      fs.writeFileSync(path.join(projectPath, 'README.md'), readme);

      console.log(`✅ Project '${projectName}' created successfully`);
      return true;
    } catch (error) {
      console.error('❌ Failed to create project structure:', error.message);
      return false;
    }
  }

  // Generate package.json
  generatePackageJson(projectName) {
    return JSON.stringify({
      "name": projectName.toLowerCase().replace(/\s+/g, '-'),
      "version": "1.0.0",
      "private": true,
      "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint"
      },
      "dependencies": {
        "next": "15.2.4",
        "react": "^18",
        "react-dom": "^18",
        "@types/node": "^20",
        "@types/react": "^18",
        "@types/react-dom": "^18",
        "typescript": "^5",
        "tailwindcss": "^3.4.1",
        "autoprefixer": "^10.0.1",
        "postcss": "^8"
      }
    }, null, 2);
  }

  // Generate other config files
  generateNextConfig() {
    return `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig`;
  }

  generateTsConfig() {
    return `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`;
  }

  generateTailwindConfig() {
    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}`;
  }

  generateGlobalsCss() {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`;
  }

  generateLayout() {
    return `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${projectName}',
  description: 'A Hex & Kex Code Development project with AI-powered development features.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`;
  }

  generatePage() {
    return `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to ${projectName}
        </h1>
        <p className="text-center text-lg">
          A Hex & Kex Code Development project with AI-powered development features.
        </p>
      </div>
    </main>
  )
}`;
  }

  generateReadme(projectName) {
    return `# ${projectName}

A Hex & Kex Code Development project with AI-powered development features.

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- AI-powered development assistance
- Professional development tools
- Git integration
- Debugging capabilities
- IntelliSense support

## Learn More

To learn more about Hex & Kex, take a look at the following resources:

- [Hex & Kex Documentation](https://github.com/skari85/pwa-code) - learn about Hex & Kex features and API.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
`;
  }

  // Main setup function
  async setup(options = {}) {
    console.log('🔮 Hex & Kex Development Environment Setup');
    console.log('==========================================');

    try {
      // Check Node.js installation
      const nodeCheck = await this.checkNodeInstallation();
      if (!nodeCheck.installed) {
        throw new Error('Node.js is not installed. Please install Node.js first.');
      }
      console.log(`✅ Node.js ${nodeCheck.version} is installed`);

      // Check npm installation
      const npmCheck = await this.checkNpmInstallation();
      if (!npmCheck.installed) {
        throw new Error('npm is not installed. Please install npm first.');
      }
      console.log(`✅ npm ${npmCheck.version} is installed`);

      // Install dependencies if needed
      if (options.install !== false) {
        await this.installDependencies();
      }

      // Start development server if requested
      if (options.startServer !== false) {
        const port = await this.startDevServer(options.port);
        console.log(`🌐 Development server running at http://localhost:${port}`);
      }

      console.log('\n🎉 Setup complete! Your Hex & Kex environment is ready.');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    port: 3000,
    install: true,
    startServer: true
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
        options.port = parseInt(args[++i]);
        break;
      case '--no-install':
        options.install = false;
        break;
      case '--no-server':
        options.startServer = false;
        break;
      case '--create':
        options.create = args[++i];
        break;
      case '--help':
        console.log(`
Hex & Kex Development Environment Setup

Usage: node dev-setup.js [options]

Options:
  --port <number>     Specify port for development server (default: 3000)
  --no-install        Skip dependency installation
  --no-server         Skip starting development server
  --create <name>     Create a new project with the specified name
  --help              Show this help message

Examples:
  node dev-setup.js                    # Basic setup
  node dev-setup.js --port 3001       # Setup on port 3001
  node dev-setup.js --create my-app   # Create new project
  node dev-setup.js --no-server       # Setup without starting server
`);
        process.exit(0);
    }
  }

  const manager = new DevEnvironmentManager();

  if (options.create) {
    manager.createProjectStructure(options.create);
  } else {
    manager.setup(options);
  }
}

module.exports = DevEnvironmentManager;
