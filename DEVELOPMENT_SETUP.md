# 🐰 White Rabbit Development Environment Setup Guide

Welcome to the White Rabbit Code Editor project! This guide will help you set up your local development environment and understand the project structure.

## 📋 Prerequisites

✅ **Node.js v18.20.8** - Installed and verified  
✅ **npm v10.8.2** - Installed and verified  
✅ **Development Server** - Running on http://localhost:3002

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Run the automated setup script
node dev-setup.js

# Or with specific options
node dev-setup.js --port 3003        # Start on specific port
node dev-setup.js --no-server        # Setup without starting server
node dev-setup.js --help             # Show all options
```

### Option 2: Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Start development server
npm run dev
```

## 📁 Project Structure (Matching Your Attachment)

The project is organized exactly like the folder structure shown in your attachment:

```
pwa-code/
├── .next/                    # Next.js build output
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   │   └── auth/           # Authentication endpoints
│   ├── auth/               # Auth pages
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/              # React components
│   ├── hooks/              # Custom React hooks
│   │   ├── use-ai-assistant-enhanced.ts
│   │   ├── use-ai-assistant.ts
│   │   ├── use-code-builder.ts
│   │   ├── use-local-storage.ts
│   │   ├── use-mobile.tsx
│   │   ├── use-terminal.ts
│   │   └── use-toast.ts
│   └── lib/                # Utility libraries
│       ├── ai-config.ts
│       ├── ai-service.ts
│       ├── auth.ts
│       ├── personality-system.ts
│       ├── templates.ts
│       └── utils.ts
├── node_modules/           # Dependencies
├── public/                 # Static assets
├── styles/                 # Additional styles
├── types/                  # TypeScript definitions
├── .env                    # Environment variables
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
├── components.json        # Component configuration
├── next-env.d.ts         # Next.js types
├── next.config.mjs       # Next.js configuration
└── package.json          # Project dependencies
```

## 🎯 Key Features Implemented

### 🧬 DNA Threads System
- **Code Evolution Tracking**: Track every iteration of your code
- **Branch Management**: Fork and merge code branches
- **Generation History**: Rewind to any previous version

### 🎨 White Rabbit AI Personality System
- **Intelligent Assistance**: AI adapts to your coding style and preferences
- **Context-Aware Suggestions**: Smart recommendations based on your project
- **Personality-Driven UI**: Interface optimized for productivity

### 🔧 WhiteRabbitLayoutSwitcher (Split Screen System)
- **Single View**: Focus on one component
- **Horizontal Split**: Code + Terminal
- **Vertical Split**: Code + File Navigator
- **Grid Layout**: All components visible (Code, Navigator, Terminal, DNA)

### 🤖 AI Integration
- **Multiple AI Providers**: OpenAI, Anthropic support
- **Context-Aware Chat**: AI understands your project structure
- **Code Generation**: Generate files directly from chat
- **Smart Suggestions**: Real-time code improvement hints

### 🖥️ Terminal Integration
- **Built-in Terminal**: Run commands without leaving the app
- **Session Management**: Multiple terminal sessions
- **Command History**: Track and reuse commands

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Create new project structure
node dev-setup.js --create my-new-project
```

## 🌐 Starting New Local Hosts

### Quick Server Start
```bash
# Start on next available port (3000, 3001, 3002, etc.)
node dev-setup.js

# Start on specific port
node dev-setup.js --port 3005

# Start multiple instances
node dev-setup.js --port 3001 &
node dev-setup.js --port 3002 &
node dev-setup.js --port 3003 &
```

### Create New Project
```bash
# Create a new project with proper structure
node dev-setup.js --create "my-awesome-app"

# Navigate to new project
cd my-awesome-app

# Start development
node ../dev-setup.js
```

## ⚙️ Environment Configuration

### Required Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit with your values
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# AI Configuration
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## 🎮 Using the Interface

### 1. AI Chat (Left Sidebar)
- Configure AI settings in the Settings panel
- Chat with AI to generate code
- Files are automatically extracted and displayed

### 2. Code Space (Main Area)
- **File Tabs**: Switch between generated files
- **Layout Switcher**: Change between single/split/grid views
- **Code Mode Dial**: Transform code style (functional, OOP, etc.)
- **DNA Threads**: Track code evolution

### 3. Split Screen Layouts
- **🧿 Single**: Focus mode for coding
- **⬌ Code + Terminal**: Development with command line
- **⬍ Code + Navigator**: File browsing and editing
- **⊞ Full Grid**: All tools visible simultaneously

### 4. Terminal Integration
- Built-in terminal in split layouts
- Run npm commands, git operations, etc.
- Multiple session support

## 🔧 Troubleshooting

### Port Already in Use
The system automatically finds available ports (3000→3001→3002, etc.)

### Missing Dependencies
```bash
npm install
```

### Environment Issues
```bash
# Reload environment
npm run dev
```

### Authentication Errors
Make sure `NEXTAUTH_SECRET` is set in your `.env` file

## 🚀 Advanced Usage

### Creating Custom Components
```bash
# Components follow the structure:
components/
├── ui/                    # Base UI components
├── [feature-name].tsx     # Feature components
└── [feature-name]/        # Complex features
    ├── index.tsx
    ├── components/
    └── hooks/
```

### Adding New Hooks
```bash
# Custom hooks go in:
hooks/
├── use-[feature-name].ts
└── use-[feature-name].tsx  # If JSX needed
```

### Library Extensions
```bash
# Utilities and services:
lib/
├── [service-name].ts
├── [utility-name].ts
└── types.ts
```

## 📚 Learning Resources

- **Next.js 15**: [Documentation](https://nextjs.org/docs)
- **React 18**: [Documentation](https://react.dev)
- **TypeScript**: [Handbook](https://www.typescriptlang.org/docs)
- **Tailwind CSS**: [Documentation](https://tailwindcss.com/docs)

## 🎯 Next Steps

1. **Configure AI**: Add your API keys to `.env`
2. **Explore Layouts**: Try different split-screen modes
3. **Generate Code**: Chat with AI to create files
4. **Track Evolution**: Use DNA Threads to manage versions
5. **Customize**: Modify personality settings and themes

## 🆘 Getting Help

- Check the terminal output for detailed error messages
- Use `node dev-setup.js --help` for command options
- Review the `.env.example` for required variables
- Ensure Node.js and npm are properly installed

---

**🎉 You're all set!** Your Hex & Kex development environment is ready for AI-powered coding adventures!

Current Status:
- ✅ Node.js v18.20.8 installed
- ✅ npm v10.8.2 installed  
- ✅ Dependencies installed
- ✅ Development server running on http://localhost:3002
- ✅ Project structure matches your attachment
- ✅ AI integration ready
- ✅ Split-screen layouts functional
