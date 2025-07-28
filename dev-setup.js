#!/usr/bin/env node

/**
 * Hex & Kex Development Environment Setup Script
 * 
 * This script helps you quickly set up and manage local development environments
 * for the Hex & Kex PWA Code project.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevEnvironmentManager {
  constructor() {
    this.projectRoot = process.cwd();
    this.availablePorts = [3000, 3001, 3002, 3003, 3004, 3005];
    this.runningServers = new Map();
  }

  // Check if Node.js is installed and get version
  async checkNodeInstallation() {
    return new Promise((resolve) => {
      exec('node --version', (error, stdout) => {
        if (error) {
          resolve({ installed: false, version: null });
        } else {
          resolve({ installed: true, version: stdout.trim() });
        }
      });
    });
  }

  // Check if npm is installed and get version
  async checkNpmInstallation() {
    return new Promise((resolve) => {
      exec('npm --version', (error, stdout) => {
        if (error) {
          resolve({ installed: false, version: null });
        } else {
          resolve({ installed: true, version: stdout.trim() });
        }
      });
    });
  }

  // Find an available port
  async findAvailablePort() {
    const net = require('net');
    
    for (const port of this.availablePorts) {
      const isAvailable = await new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, () => {
          server.close(() => resolve(true));
        });
        server.on('error', () => resolve(false));
      });
      
      if (isAvailable) {
        return port;
      }
    }
    
    return null;
  }

  // Install dependencies
  async installDependencies() {
    console.log('🔧 Installing dependencies...');
    
    return new Promise((resolve, reject) => {
      const npmInstall = spawn('npm', ['install'], {
        stdio: 'inherit',
        cwd: this.projectRoot
      });

      npmInstall.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Dependencies installed successfully!');
          resolve();
        } else {
          console.error('❌ Failed to install dependencies');
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
    });
  }

  // Start development server
  async startDevServer(port = null) {
    const targetPort = port || await this.findAvailablePort();
    
    if (!targetPort) {
      throw new Error('No available ports found');
    }

    console.log(`🚀 Starting development server on port ${targetPort}...`);

    const env = { ...process.env };
    if (port) {
      env.PORT = port.toString();
    }

    const devServer = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      cwd: this.projectRoot,
      env
    });

    this.runningServers.set(targetPort, devServer);

    devServer.on('close', (code) => {
      this.runningServers.delete(targetPort);
      if (code !== 0) {
        console.error(`❌ Development server on port ${targetPort} exited with code ${code}`);
      }
    });

    return targetPort;
  }

  // Create a new project structure
  async createProjectStructure(projectName) {
    const projectPath = path.join(this.projectRoot, projectName);
    
    if (fs.existsSync(projectPath)) {
      throw new Error(`Project ${projectName} already exists`);
    }

    console.log(`📁 Creating project structure for ${projectName}...`);

    // Create the folder structure matching the attachment
    const folders = [
      'app',
      'app/api',
      'app/auth',
      'components',
      'hooks',
      'lib',
      'public',
      'styles',
      'types'
    ];

    fs.mkdirSync(projectPath, { recursive: true });

    folders.forEach(folder => {
      fs.mkdirSync(path.join(projectPath, folder), { recursive: true });
    });

    // Create basic files
    const files = {
      'package.json': this.generatePackageJson(projectName),
      'next.config.mjs': this.generateNextConfig(),
      'tsconfig.json': this.generateTsConfig(),
      'tailwind.config.ts': this.generateTailwindConfig(),
      '.env.example': this.generateEnvExample(),
      '.gitignore': this.generateGitignore(),
      'README.md': this.generateReadme(projectName),
      'app/layout.tsx': this.generateAppLayout(),
      'app/page.tsx': this.generateAppPage(),
      'app/globals.css': this.generateGlobalsCss()
    };

    Object.entries(files).forEach(([filePath, content]) => {
      fs.writeFileSync(path.join(projectPath, filePath), content);
    });

    console.log(`✅ Project ${projectName} created successfully!`);
    console.log(`📂 Project location: ${projectPath}`);
    
    return projectPath;
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
};

export default nextConfig;
`;
  }

  generateTsConfig() {
    return JSON.stringify({
      "compilerOptions": {
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
        "baseUrl": ".",
        "paths": {
          "@/*": ["./*"]
        }
      },
      "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      "exclude": ["node_modules"]
    }, null, 2);
  }

  generateTailwindConfig() {
    return `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
`;
  }

  generateEnvExample() {
    return `# Environment Variables
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# AI Configuration
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
`;
  }

  generateGitignore() {
    return `# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
`;
  }

  generateReadme(projectName) {
    return `# ${projectName}

A Hex & Kex PWA Code project with AI-powered development features.

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Copy environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
${projectName}/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
├── public/            # Static assets
├── styles/            # Additional styles
└── types/             # TypeScript type definitions
\`\`\`

## Features

- 🎨 Hex & Kex personality system
- 🤖 AI-powered code generation
- 🧬 DNA Threads for code evolution tracking
- 🔧 Split-screen development environment
- 📱 PWA capabilities
- 🎯 Context-aware suggestions

## Development Commands

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint

## AI Configuration

Configure your AI providers in the \`.env\` file:

1. OpenAI API key for GPT models
2. Anthropic API key for Claude models
3. GitHub OAuth for authentication (optional)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Hex & Kex Documentation](https://hexkex.dev)
`;
  }

  generateAppLayout() {
    return `import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hex & Kex PWA',
  description: 'AI-powered development environment',
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
}
`;
  }

  generateAppPage() {
    return `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center">
          Welcome to Hex & Kex
        </h1>
        <p className="text-center text-lg mt-4">
          AI-powered development environment
        </p>
      </div>
    </main>
  )
}
`;
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
}
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
  const devManager = new DevEnvironmentManager();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Hex & Kex Development Environment Setup

Usage:
  node dev-setup.js [options]

Options:
  --help, -h          Show this help message
  --no-install        Skip dependency installation
  --no-server         Skip starting development server
  --port <number>     Specify port for development server
  --create <name>     Create a new project with the specified name

Examples:
  node dev-setup.js                    # Full setup with server
  node dev-setup.js --no-server        # Setup without starting server
  node dev-setup.js --port 3002        # Start server on port 3002
  node dev-setup.js --create my-app    # Create new project
`);
    process.exit(0);
  }

  const options = {
    install: !args.includes('--no-install'),
    startServer: !args.includes('--no-server'),
    port: args.includes('--port') ? parseInt(args[args.indexOf('--port') + 1]) : null
  };

  if (args.includes('--create')) {
    const projectName = args[args.indexOf('--create') + 1];
    if (!projectName) {
      console.error('❌ Please specify a project name');
      process.exit(1);
    }
    
    devManager.createProjectStructure(projectName)
      .then(projectPath => {
        console.log(`\n🎯 Next steps:`);
        console.log(`   cd ${projectName}`);
        console.log(`   node ../dev-setup.js`);
      })
      .catch(error => {
        console.error('❌ Failed to create project:', error.message);
        process.exit(1);
      });
  } else {
    devManager.setup(options);
  }
}

module.exports = DevEnvironmentManager;
