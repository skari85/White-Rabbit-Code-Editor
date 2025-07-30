# Hex & Kex - Professional Code Development Environment

Hex & Kex is a professional code development environment with AI-powered assistance. Build, debug, and deploy applications with an intuitive interface and powerful development tools.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/georgoskar-7854s-projects/v0-recreate-ui-design)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

## Features

### ✨ Core Features
- **AI-Powered Development**: Create applications through conversation with AI
- **Code Editor**: Full-featured code editor with syntax highlighting
- **Live Preview**: See your changes in real-time
- **Template Library**: Pre-built templates (Employee Directory, Todo App, etc.)
- **Export Functionality**: Download your projects as ZIP files
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### 🚀 Development Features
- **Git Integration**: Complete version control with visual interface
- **Debugging Tools**: Real debugging capabilities with breakpoints
- **IntelliSense**: Advanced code intelligence and autocomplete
- **Terminal Integration**: Built-in terminal support
- **Error Detection**: Real-time error highlighting and fixes

### 🛠️ Technical Features
- Built with **Next.js 15** and **React 19**
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** components for accessibility
- **JSZip** for file compression and export
- Modern development standards compliance

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/skari85/pwa-code.git
   cd pwa-code
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
   
   Edit `.env.local` and add your GitHub OAuth credentials (see GitHub OAuth Setup below).

4. **Start the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## GitHub OAuth Setup

To enable GitHub authentication, you need to create a GitHub OAuth App:

### 1. Create GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:
   - **Application name**: `Hex & Kex` (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click **"Register application"**

### 2. Configure Environment Variables
1. Copy the **Client ID** and **Client Secret** from your GitHub OAuth App
2. Update your `.env.local` file:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

### 3. Generate NextAuth Secret
Generate a secure secret for NextAuth:
```bash
openssl rand -base64 32
```
Use this value for `NEXTAUTH_SECRET` in your `.env.local` file.

### 4. Production Setup
For production deployment:
1. Update your GitHub OAuth App settings:
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://yourdomain.com/api/auth/callback/github`
2. Update environment variables in your hosting platform
3. Set `NEXTAUTH_URL` to your production domain

### Features Enabled by GitHub Authentication
- **User Authentication**: Secure sign-in with GitHub accounts
- **User Profile**: Access to GitHub profile information
- **Session Management**: Persistent login sessions
- **Future Integrations**: Ready for GitHub API integrations (repositories, issues, etc.)

## How to Use

### 1. Start with AI Chat
- Use the AI chat interface to describe what you want to build
- The AI will help you create code step by step
- Ask for specific features, debugging help, or code explanations

### 2. Choose from Templates
- Select from pre-built templates:
  - **Employee Directory**: Browse and search employees
  - **Todo App**: Task management application
  - More templates coming soon!

### 3. Customize Your App
- **Code Editor**: Modify HTML, CSS, JavaScript, and other files
- **Live Preview**: See changes instantly
- **Development Tools**: Use debugging, git, and terminal features

### 4. Export and Deploy
- **Download**: Export as ZIP file containing all your files
- **Preview**: Test your app in a new browser tab
- **Deploy**: Upload to any web server or hosting platform

## Project Structure

```
pwa-code/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/ui components
│   └── theme-provider.tsx
├── hooks/                 # Custom React hooks
│   └── use-ai-assistant.ts # AI assistant logic
├── lib/                   # Utility libraries
│   ├── ai-config.ts       # AI configuration
│   ├── templates.ts       # Template definitions
│   └── utils.ts          # General utilities
├── public/               # Static assets
│   └── *.svg            # Icons
└── plunker-clone.tsx     # Main application component
```

## Available Templates

### 1. Employee Directory
A professional employee directory application featuring:
- Employee search and filtering
- Responsive card layout
- Contact information display
- Clean, modern interface

### 2. Todo App
A task management application with:
- Add, edit, and delete tasks
- Mark tasks as complete
- Local storage persistence
- Clean, modern interface

## Development Standards Compliance

This tool follows modern development standards:

- ✅ **TypeScript**: Full type safety
- ✅ **ESLint**: Code quality and consistency
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Accessibility**: Screen reader support
- ✅ **Performance**: Optimized loading and caching

## Development

### Building for Production
```bash
npm run build
npm start
```

### Code Quality
```bash
npm run lint
```

### Technologies Used
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **File Handling**: JSZip for exports
- **AI Integration**: Multiple AI providers supported

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

### Upcoming Features
- [ ] More application templates (Weather App, News Reader, etc.)
- [ ] Drag-and-drop visual builder
- [ ] Component library integration
- [ ] Database integration templates
- [ ] Advanced theming options
- [ ] Collaborative editing
- [ ] Enhanced version control integration

### Technical Improvements
- [ ] Enhanced code editor with IntelliSense
- [ ] Real-time collaboration
- [ ] Template marketplace
- [ ] Custom component creation
- [ ] Advanced debugging tools
- [ ] Performance profiling

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/skari85/pwa-code/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**Built with ❤️ by the Hex & Kex team**
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/georgoskar-7854s-projects/v0-recreate-ui-design](https://vercel.com/georgoskar-7854s-projects/v0-recreate-ui-design)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/f1mzLkvOodF](https://v0.dev/chat/projects/f1mzLkvOodF)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
