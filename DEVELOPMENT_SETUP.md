# 🔮 Hex & Kex Development Environment Setup Guide

Welcome to the Hex & Kex Code Development project! This guide will help you set up your local development environment and understand the project structure that matches the folder organization shown in your attachment.

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
│       ├── ai-config.ts    # AI configuration
│       ├── ai-service.ts   # AI service integration
│       ├── auth.ts         # Authentication utilities
│       ├── debugger-service.ts
│       ├── git-service.ts  # Git integration
│       ├── intellisense-service.ts
│       ├── monaco-config.ts
│       ├── personality-system.ts
│       ├── templates.ts    # Application templates
│       └── utils.ts        # General utilities
├── hooks/                   # Custom React hooks
├── lib/                     # Core libraries
├── public/                  # Static assets
│   ├── hexkexlogo.png     # Logo
│   ├── icon-192.png       # App icons
│   ├── icon-512.png
│   └── favicon.ico
├── styles/                  # Additional styles
├── types/                   # TypeScript definitions
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies
├── tailwind.config.ts      # Tailwind CSS config
├── tsconfig.json           # TypeScript config
├── README.md               # Project documentation
├── RELEASE_2.0.0.md       # Release notes
├── DEVELOPMENT_SETUP.md    # This file
├── dev-setup.js           # Automated setup script
└── plunker-clone.tsx      # Main application component
```

## 🔧 Development Features

### AI-Powered Development
- **Conversational AI**: Build applications through natural language
- **Code Generation**: AI-assisted code creation and modification
- **Debugging Help**: AI-powered debugging assistance
- **Template System**: Pre-built application templates

### Professional Development Tools
- **Git Integration**: Visual version control interface
- **Debugging**: Real debugging with breakpoints
- **IntelliSense**: Advanced code intelligence
- **Terminal**: Built-in terminal support
- **Error Detection**: Real-time error highlighting

### Code Management
- **File System**: Visual file management
- **Code Editor**: Monaco-based code editor
- **Live Preview**: Real-time code preview
- **Export**: Download projects as ZIP files

## 🚀 Getting Started

1. **Clone and Setup**
   ```bash
   git clone https://github.com/skari85/pwa-code.git
   cd pwa-code
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to http://localhost:3000

## 🛠️ Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

## 📦 Key Dependencies

### Core Framework
- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development

### UI Components
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icons

### Development Tools
- **Monaco Editor**: VS Code-like code editor
- **JSZip**: File compression for exports
- **NextAuth**: Authentication system

### AI Integration
- **Multiple AI Providers**: OpenAI, Anthropic, Groq, etc.
- **Local Ollama**: Local AI model support

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file with:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# AI Provider API Keys (Optional)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GROQ_API_KEY=your-groq-key
```

### AI Configuration
Configure AI providers in `lib/ai-config.ts`:

```typescript
export const AI_PROVIDERS = [
  {
    name: "OpenAI",
    id: "openai",
    requiresApiKey: true,
    models: ["gpt-4o", "gpt-4o-mini"],
    endpoint: "https://api.openai.com/v1/chat/completions"
  },
  // Add more providers...
];
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Use different port
npm run dev -- -p 3001
```

**Module not found errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

**TypeScript errors:**
```bash
# Check types
npx tsc --noEmit
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com)

---

**Happy coding with Hex & Kex! 🚀**
