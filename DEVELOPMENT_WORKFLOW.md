# 🚀 Development Workflow Guide

This document outlines the modern development workflow for the White Rabbit Code Editor project.

## 🛠️ **Prerequisites**

- Node.js 18+ 
- npm/pnpm/yarn
- Git
- VS Code (recommended)

## 🚀 **Quick Start**

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd white-rabbit-code-editor
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.template .env.local
   # Edit .env.local with your API keys
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 📋 **Available Scripts**

### **Development**
- `npm run dev` - Start development server on port 3012
- `npm run dev:3020` - Start development server on port 3020
- `npm run build` - Build for production
- `npm run start` - Start production server

### **Code Quality**
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### **Testing**
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Run tests with coverage report

### **Analysis**
- `npm run analyze` - Analyze bundle size
- `npm run analyze:dev` - Analyze bundle in development

## 🔧 **Development Tools**

### **VS Code Extensions**
Install the recommended extensions from `.vscode/extensions.json`:
- Prettier - Code formatter
- ESLint - Code linting
- Tailwind CSS IntelliSense
- TypeScript support
- GitLens - Git integration
- GitHub Copilot - AI assistance

### **VS Code Tasks**
Use `Cmd+Shift+P` → "Tasks: Run Task" to access:
- Start Next.js Dev Server
- Build Project
- Run Tests
- Lint and Fix
- Format Code
- Type Check

## 📝 **Code Standards**

### **Formatting**
- Code is automatically formatted on save
- Use Prettier configuration in `.prettierrc`
- Line length: 80 characters (soft), 100 characters (hard)

### **Linting**
- ESLint runs on save and before commits
- TypeScript strict mode enabled
- React hooks rules enforced
- Accessibility rules enabled

### **Import Organization**
- Imports are automatically organized on save
- Grouped by: builtin → external → internal → parent → sibling → index
- Alphabetized within groups

## 🧪 **Testing**

### **Test Structure**
```
src/
├── test/
│   ├── setup.ts          # Test configuration
│   └── __mocks__/        # Mock files
├── components/           # Component tests
└── lib/                  # Utility tests
```

### **Writing Tests**
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## 🔄 **Git Workflow**

### **Pre-commit Hooks**
- Automatic code formatting
- ESLint checks
- TypeScript type checking
- Only runs on staged files

### **Commit Convention**
Use conventional commits:
```bash
npm run commit
# This will guide you through creating a proper commit message
```

### **Branch Strategy**
- `main` - Production code
- `develop` - Development branch
- `feature/*` - Feature branches
- `hotfix/*` - Hotfix branches

## 🚨 **Error Handling**

### **TypeScript Errors**
- Type checking runs on save and before commits
- Use `npm run type-check` for full project check
- Fix type errors before committing

### **ESLint Errors**
- Linting runs on save and before commits
- Use `npm run lint:fix` to auto-fix issues
- Manual fixes required for complex issues

### **Build Errors**
- Build errors prevent deployment
- Use `npm run build` to check for issues
- Fix all errors before merging to main

## 📊 **Performance Monitoring**

### **Bundle Analysis**
```bash
npm run analyze        # Production build analysis
npm run analyze:dev    # Development build analysis
```

### **Testing Coverage**
```bash
npm run test:coverage  # Generate coverage report
```

## 🔍 **Debugging**

### **VS Code Debugging**
1. Set breakpoints in your code
2. Press F5 to start debugging
3. Use the debug console and variables panel

### **Browser DevTools**
- React Developer Tools extension
- Network tab for API calls
- Console for logging

## 🚀 **Deployment**

### **Development**
- Automatic deployment on push to develop branch
- Preview deployments for pull requests

### **Production**
- Automatic deployment on merge to main
- Environment variables validated before deployment

## 📚 **Additional Resources**

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev)

## 🆘 **Troubleshooting**

### **Common Issues**

1. **Port already in use**
   ```bash
   # Kill process on port 3012
   lsof -ti:3012 | xargs kill -9
   ```

2. **TypeScript errors**
   ```bash
   npm run type-check
   # Fix errors in the output
   ```

3. **ESLint errors**
   ```bash
   npm run lint:fix
   # Manual fixes for remaining issues
   ```

4. **Build failures**
   ```bash
   npm run build
   # Check error output and fix issues
   ```

### **Getting Help**
- Check the error logs
- Review this documentation
- Search existing issues
- Create a new issue with detailed information

---

**Happy coding! 🐰✨**
