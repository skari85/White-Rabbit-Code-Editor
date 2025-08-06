# 🐰 White Rabbit Code Editor

> **AI-Powered Application Builder** - Create apps through conversation

[![License](https://img.shields.io/badge/License-Custom-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.2-blue)](https://www.typescriptlang.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://white-rabbit-code-editor-eat1i3kii-georgoskar-7854s-projects.vercel.app)

## Features

### ✨ Core Features
- **Visual PWA Builder**: Create PWAs with a visual interface
- **Code Editor**: Full-featured code editor with syntax highlighting
- **Live Preview**: See your changes in real-time with mobile preview
- **Template Library**: Pre-built templates (Employee Directory, Todo App, etc.)
- **PWA Generation**: Automatic manifest.json and service worker generation
- **Export Functionality**: Download your PWA as a ZIP file
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### 🚀 PWA Features
- **Offline Support**: Works without internet connection
- **Installable**: Can be installed on devices like native apps
- **Push Notifications**: Support for web push notifications
- **Background Sync**: Sync data when connection is restored
- **App Shell**: Fast loading app shell architecture

### 🛠️ Technical Features
- Built with **Next.js 15** and **React 19**
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** components for accessibility
- **JSZip** for file compression and export
- Modern PWA standards compliance

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

### 1. Choose Your Mode
- **Code Editor**: Write code manually with full control
- **PWA Builder**: Use the visual interface to build PWAs

### 2. Start with a Template
- Select from pre-built templates:
  - **Employee Directory**: Browse and search employees
  - **Todo App**: Task management application
  - More templates coming soon!

### 3. Customize Your App
- **Settings Panel**: Configure app name, description, colors, and icons
- **File Editor**: Modify HTML, CSS, JavaScript, and JSON files
- **Live Preview**: See changes instantly in the mobile preview

### 4. Generate PWA Files
- Click **"Generate PWA"** to create:
  - `manifest.json` with your app configuration
  - `sw.js` service worker for offline functionality
  - Optimized HTML with PWA meta tags

### 5. Export and Deploy
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
│   └── use-pwa-builder.ts # PWA builder logic
├── lib/                   # Utility libraries
│   ├── pwa-generator.ts   # PWA file generation
│   ├── templates.ts       # Template definitions
│   └── utils.ts          # General utilities
├── public/               # Static assets
│   ├── manifest.json     # PWA manifest
│   ├── sw.js            # Service worker
│   └── *.svg            # Icons
└── plunker-clone.tsx     # Main application component
```

## Available Templates

### 1. Employee Directory
A professional employee directory application featuring:
- Employee search and filtering
- Responsive card layout
- Contact information display
- PWA installation prompt

### 2. Todo App
A task management application with:
- Add, edit, and delete tasks
- Mark tasks as complete
- Local storage persistence
- Clean, modern interface

## PWA Standards Compliance

This tool generates PWAs that meet modern web standards:

- ✅ **Web App Manifest**: Complete manifest.json configuration
- ✅ **Service Worker**: Offline functionality and caching
- ✅ **HTTPS Ready**: Works with secure connections
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Installable**: Add to home screen functionality
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
- **PWA**: Web App Manifest + Service Workers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

### Upcoming Features
- [ ] More PWA templates (Weather App, News Reader, etc.)
- [ ] Drag-and-drop visual builder
- [ ] Component library integration
- [ ] Database integration templates
- [ ] Push notification setup wizard
- [ ] Advanced theming options
- [ ] Collaborative editing
- [ ] Version control integration

### Technical Improvements
- [ ] Enhanced code editor with IntelliSense
- [ ] Real-time collaboration
- [ ] Template marketplace
- [ ] Custom component creation
- [ ] Advanced PWA features (background sync, etc.)

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

See the [LICENSE](LICENSE) file for complete terms and conditions.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/skari85/pwa-code/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**Built with ❤️ by the White Rabbit Team**
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
