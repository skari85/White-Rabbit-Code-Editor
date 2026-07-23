# 🐰 White Rabbit Code Editor

> **AI-Powered Code Editor** - Build web applications through conversation

[![License](https://img.shields.io/badge/License-Custom-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.21-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.2-blue)](https://www.typescriptlang.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://www.whiterabbit.onl)

## ✨ Features

### 🤖 AI-Powered Development

- **Conversational Coding**: Create applications through natural language
- **AI Code Completions**: Intelligent, context-aware code suggestions
- **Multi-AI Support**: OpenAI, Anthropic, Groq, Google AI, and more
- **BYOK**: Bring your own API key — requests go straight from your browser to your chosen provider

### 💻 Advanced Code Editor

- **Monaco Editor**: VS Code-quality editing experience
- **Syntax Highlighting**: Support for JavaScript, TypeScript, React, HTML, CSS
- **Live Preview**: Real-time preview of your web applications
- **File Management**: Create, edit, and organize project files
- **Theme Support**: Dark and light modes with custom themes

### 🚀 Modern Development Tools

- **Live Coding**: See changes instantly as you type
- **Terminal Integration**: Built-in terminal for running commands
- **Export Projects**: Download your projects as ZIP files
- **Mobile Responsive**: Code on desktop, tablet, or mobile devices
- **Offline Support**: Works without internet connection

### 🛠️ Technical Stack

- Built with **Next.js 15** and **React 19**
- **TypeScript** for type safety
- **Monaco Editor** for professional code editing
- **Tailwind CSS** for styling
- **Radix UI** components for accessibility
- **Vercel Analytics** for usage insights

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm package manager
- AI API key (OpenAI, Anthropic, Groq, etc.) - optional but recommended

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/skari85/White-Rabbit-Code-Editor.git
   cd White-Rabbit-Code-Editor
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your API keys for AI providers and GitHub OAuth.

4. **Start the development server**

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3012](http://localhost:3012)

## 🔧 Configuration

### AI Provider Setup

To enable AI features, configure at least one AI provider:

1. **OpenAI** (Recommended)

   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

2. **Anthropic (Claude)**

   ```env
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
   ```

3. **Groq** (Fast inference)
   ```env
   GROQ_API_KEY=gsk_your-groq-api-key-here
   ```

### GitHub OAuth Setup (Optional)

For user authentication and future GitHub integrations:

1. **Create GitHub OAuth App**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click **"New OAuth App"**
   - Application name: `White Rabbit Code Editor`
   - Homepage URL: `http://localhost:3012` (development)
   - Callback URL: `http://localhost:3012/api/auth/callback/github`

2. **Configure Environment Variables**

   ```env
   NEXTAUTH_URL=http://localhost:3012
   NEXTAUTH_SECRET=your-secret-key-here
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

3. **Generate NextAuth Secret**
   ```bash
   openssl rand -base64 32
   ```

## 🎯 How to Use

### 1. Start Coding

- **Create Files**: Add HTML, CSS, JavaScript, TypeScript, or React files
- **AI Chat**: Describe what you want to build in natural language
- **Live Preview**: See your changes instantly in the preview panel

### 2. AI-Powered Development

- **Ask Questions**: "Create a React component for a todo list"
- **Get Suggestions**: AI provides intelligent code completions as you type
- **Generate Code**: AI can create entire files based on your descriptions
- **Magic Wand**: Refine a rough prompt into a sharper one before sending it

### 3. Advanced Features

- **Multi-File Projects**: Organize your code across multiple files
- **Terminal**: Run commands and scripts directly in the browser
- **Themes**: Switch between dark and light modes
- **Export**: Download your project as a ZIP file

### 4. AI Configuration

- **Settings**: Configure your preferred AI provider and model
- **API Keys**: Add your own API keys for unlimited usage
- **Personality**: Choose between different AI assistant personalities

## 📁 Project Structure

```
White-Rabbit-Code-Editor/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with analytics
│   └── page.tsx           # Main code editor page
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── code-editor.tsx   # Main code editor component
│   ├── ai-chat.tsx       # AI conversation interface
│   ├── live-preview.tsx  # Real-time preview panel
│   └── monaco-editor/    # Monaco editor integration
├── hooks/                 # Custom React hooks
│   ├── use-code-builder.ts    # File management logic
│   ├── use-ai-assistant.ts    # AI integration
│   └── use-analytics.ts       # Usage tracking
├── lib/                   # Utility libraries
│   ├── ai-config.ts      # AI provider configurations
│   ├── ai-service.ts     # Multi-provider AI request handling
│   └── utils.ts          # General utilities
├── public/               # Static assets
│   ├── whiterabbitlogo.png    # Application logo
│   └── icons/            # Various icons
└── styles/               # CSS and styling
```

## 🤖 AI Features

### Supported AI Providers

- **OpenAI**: GPT-3.5, GPT-4, GPT-4 Turbo
- **Anthropic**: Claude 3 Haiku, Sonnet, Opus
- **Groq**: Llama 3, Mixtral (ultra-fast inference)
- **Google AI**: Gemini Pro, Gemini Pro Vision
- **Mistral**: Mistral 7B, Mixtral 8x7B

### AI Capabilities

- **Code Generation**: Create complete files from descriptions
- **Code Completion**: Intelligent autocomplete as you type
- **Code Explanation**: Understand complex code snippets
- **Debugging Help**: Get assistance with errors and bugs
- **Refactoring**: Improve code structure and performance

## 🛠️ Development

### Building for Production

```bash
npm run build
npm start
```

### Code Quality

```bash
npm run lint
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run deploy       # Deploy with license verification
```

### Technologies Used

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Editor**: Monaco Editor (VS Code engine)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **AI Integration**: Multiple provider support
- **Analytics**: Vercel Analytics & Speed Insights

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🗺️ Roadmap

### Upcoming Features

- [ ] GitHub repository integration
- [ ] Real-time collaboration
- [ ] Plugin system for extensions
- [ ] Advanced AI code analysis
- [ ] Custom AI model training
- [ ] Team workspaces
- [ ] Version control integration
- [ ] Deployment integrations (Vercel, Netlify)

### AI Enhancements

- [ ] Voice-to-code functionality
- [ ] Visual design to code conversion
- [ ] Automated testing generation
- [ ] Performance optimization suggestions
- [ ] Security vulnerability detection
- [ ] Code review automation

## 📄 License

**⚠️ Important: This software is protected by a custom license.**

### ✅ Personal Use Allowed

- ✅ Personal projects and learning
- ✅ Educational purposes
- ✅ Non-commercial use
- ✅ Modifications for personal use

### ❌ Commercial Use Restricted

- ❌ Business/commercial organizations
- ❌ Revenue-generating activities
- ❌ Commercial products/services
- ❌ Redistribution as a product

**Commercial licenses are available.** Contact us for pricing and terms.

### 📝 Attribution Required

All uses must include:

```
Powered by White Rabbit Code Editor
```

## 🏢 Commercial Licensing

For commercial use, enterprise licenses, or custom arrangements:

- 📧 **Email**: licensing@whiterabbit.dev
- 🌐 **Website**: https://whiterabbit.dev/licensing
- 💼 **Enterprise**: Custom solutions available

## 🛡️ Copyright & Trademarks

© 2025 White Rabbit Team. All rights reserved.

"White Rabbit" and associated logos are trademarks of White Rabbit Team.

White Rabbit is an independent open-source project and is not affiliated with or endorsed by any third-party IDE vendor. JetBrains and related marks are trademarks of JetBrains s.r.o. All other trademarks are the property of their respective owners.

See the [LICENSE](LICENSE) file for complete terms and conditions.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/skari85/White-Rabbit-Code-Editor/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

## 🌐 Live Demo

Experience White Rabbit Code Editor live at:

**[https://www.whiterabbit.onl](https://www.whiterabbit.onl)**

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** and test thoroughly
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation as needed
- Ensure accessibility compliance

**Built with ❤️ by the White Rabbit Team**
