import { useState, useCallback, useEffect, useMemo } from 'react';
import JSZip from 'jszip';

const PROJECT_STORAGE_KEY = 'white-rabbit-project';
const PROJECTS_LIST_KEY = 'white-rabbit-projects-list';

export interface FileContent {
  name: string;
  content: string;
  type: 'html' | 'css' | 'js' | 'json' | 'md' | 'tsx' | 'ts' | 'py' | 'txt';
  lastModified: Date;
}

export interface ProjectData {
  id: string;
  name: string;
  files: FileContent[];
  lastModified: Date;
  selectedFile: string;
}

export function useCodeBuilder() {
  const [files, setFiles] = useState<FileContent[]>([]);
  const [selectedFile, setSelectedFile] = useState('index.html');
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);

  // Save project to localStorage
  const saveProject = useCallback((project: ProjectData) => {
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));
    
    // Update projects list
    const projectsList = JSON.parse(localStorage.getItem(PROJECTS_LIST_KEY) || '[]');
    const existingIndex = projectsList.findIndex((p: any) => p.id === project.id);
    
    const projectSummary = {
      id: project.id,
      name: project.name,
      lastModified: project.lastModified,
      fileCount: project.files.length
    };

    if (existingIndex >= 0) {
      projectsList[existingIndex] = projectSummary;
    } else {
      projectsList.push(projectSummary);
    }
    
    localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(projectsList));
  }, []);

  // Initialize default project
  const initializeDefaultProject = useCallback(() => {
    const defaultFiles: FileContent[] = [
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Modern Web App</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta charset="UTF-8">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app-container">
    <!-- Navigation -->
    <nav class="navbar">
      <div class="nav-brand">
        <h2>My App</h2>
      </div>
      <div class="nav-links">
        <a href="#" class="nav-link active">Dashboard</a>
        <a href="#" class="nav-link">Projects</a>
        <a href="#" class="nav-link">Settings</a>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-header">
        <h1 class="page-title">Welcome to Your Modern App</h1>
        <p class="page-subtitle">Start building something amazing with modern design</p>
      </div>

      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <h3>Getting Started</h3>
          </div>
          <div class="card-body">
            <p>This is a modern, professional template with contemporary design patterns.</p>
            <button class="btn btn-primary">Get Started</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Features</h3>
          </div>
          <div class="card-body">
            <ul class="feature-list">
              <li>Modern UI Components</li>
              <li>Responsive Design</li>
              <li>Interactive Elements</li>
            </ul>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Analytics</h3>
          </div>
          <div class="card-body">
            <div class="stat">
              <div class="stat-number">1,234</div>
              <div class="stat-label">Total Users</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
        type: 'html',
        lastModified: new Date()
      },
      {
        name: 'style.css',
        content: `/* Modern CSS Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Base Styles */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  line-height: 1.6;
  color: #1f2937;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

/* App Container */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navigation */
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.nav-brand h2 {
  color: #4f46e5;
  font-weight: 700;
  font-size: 1.5rem;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-link:hover,
.nav-link.active {
  color: #4f46e5;
  background: rgba(79, 70, 229, 0.1);
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 3rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.content-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 3rem;
  font-weight: 800;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

/* Grid Layout */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

/* Card Components */
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.card-header {
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.card-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.card-body {
  padding: 1rem 2rem 2rem;
}

.card-body p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Feature List */
.feature-list {
  list-style: none;
}

.feature-list li {
  padding: 0.5rem 0;
  color: #6b7280;
  position: relative;
  padding-left: 1.5rem;
}

.feature-list li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: bold;
}

/* Stats */
.stat {
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: #4f46e5;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Responsive Design */
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .nav-links {
    gap: 1rem;
  }

  .main-content {
    padding: 2rem 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .content-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}`,
        type: 'css',
        lastModified: new Date()
      },
      {
        name: 'app.js',
        content: `// Modern JavaScript with interactive features
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Modern app loaded successfully!');

  // Initialize app
  initializeApp();
});

function initializeApp() {
  // Add smooth scrolling
  document.documentElement.style.scrollBehavior = 'smooth';

  // Initialize navigation
  initializeNavigation();

  // Initialize interactive elements
  initializeButtons();

  // Initialize animations
  initializeAnimations();

  // Update stats with animation
  animateStats();
}

function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));

      // Add active class to clicked link
      this.classList.add('active');

      // Add ripple effect
      createRipple(e, this);
    });
  });
}

function initializeButtons() {
  const buttons = document.querySelectorAll('.btn');

  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      // Add click animation
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = '';
      }, 150);

      // Create ripple effect
      createRipple(e, this);

      // Show success message
      showNotification('Action completed successfully!', 'success');
    });
  });
}

function createRipple(event, element) {
  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.cssText = \`
    position: absolute;
    width: \${size}px;
    height: \${size}px;
    left: \${x}px;
    top: \${y}px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 0.6s ease-out;
    pointer-events: none;
  \`;

  // Add ripple animation CSS if not exists
  if (!document.querySelector('#ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = \`
      @keyframes ripple {
        to {
          transform: scale(2);
          opacity: 0;
        }
      }
    \`;
    document.head.appendChild(style);
  }

  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 600);
}

function initializeAnimations() {
  // Intersection Observer for scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  });

  // Observe cards for animation
  document.querySelectorAll('.card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
  });
}

function animateStats() {
  const statNumbers = document.querySelectorAll('.stat-number');

  statNumbers.forEach(stat => {
    const finalValue = parseInt(stat.textContent.replace(/,/g, ''));
    let currentValue = 0;
    const increment = finalValue / 50;

    const timer = setInterval(() => {
      currentValue += increment;
      if (currentValue >= finalValue) {
        currentValue = finalValue;
        clearInterval(timer);
      }
      stat.textContent = Math.floor(currentValue).toLocaleString();
    }, 30);
  });
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = \`notification notification-\${type}\`;
  notification.textContent = message;

  // Add notification styles
  notification.style.cssText = \`
    position: fixed;
    top: 20px;
    right: 20px;
    background: \${type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  \`;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Add some interactive features
document.addEventListener('mousemove', function(e) {
  // Subtle parallax effect for background
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;

  document.body.style.backgroundPosition = \`\${50 + x * 5}% \${50 + y * 5}%\`;
});`,
        type: 'js',
        lastModified: new Date()
      }
    ];

    const project: ProjectData = {
      id: `project-${Date.now()}`,
      name: 'My Project',
      files: defaultFiles,
      lastModified: new Date(),
      selectedFile: 'index.html'
    };

    setFiles(defaultFiles);
    setCurrentProject(project);
    saveProject(project);
  }, [saveProject]);

  // Load project from localStorage on mount
  useEffect(() => {
    const savedProject = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (savedProject) {
      try {
        const project: ProjectData = JSON.parse(savedProject);
        // Convert date strings back to Date objects
        project.files = project.files.map(file => ({
          ...file,
          lastModified: new Date(file.lastModified)
        }));
        project.lastModified = new Date(project.lastModified);
        
        setFiles(project.files);
        setSelectedFile(project.selectedFile);
        setCurrentProject(project);
        return;
      } catch (error) {
        console.error('Error loading project:', error);
      }
    }

    // Initialize default project if none exists
    initializeDefaultProject();
  }, [initializeDefaultProject]);

  // Auto-save project when files or settings change
  useEffect(() => {
    if (currentProject && files.length > 0) {
      const updatedProject: ProjectData = {
        ...currentProject,
        files,
        selectedFile,
        lastModified: new Date()
      };
      
      // Debounce save to avoid too frequent saves
      const timeoutId = setTimeout(() => {
        setCurrentProject(updatedProject);
        saveProject(updatedProject);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [files, selectedFile, saveProject]);

  const updateFileContent = useCallback((fileName: string, content: string) => {
    setFiles(prev => prev.map(file => 
      file.name === fileName ? { ...file, content, lastModified: new Date() } : file
    ));
  }, []);

  const addNewFile = useCallback((name: string, type: FileContent['type'] = 'html') => {
    // Check if file already exists
    const existingFile = files.find(f => f.name === name);
    if (existingFile) {
      // File already exists, just select it
      setSelectedFile(name);
      return;
    }

    const defaultContent = {
      html: `<!DOCTYPE html>
<html>
<head>
  <title>New File</title>
</head>
<body>

</body>
</html>`,
      css: '/* CSS styles */',
      js: '// JavaScript code',
      tsx: `import React from 'react';

export default function Component() {
  return (
    <div>
      <h1>New Component</h1>
    </div>
  );
}`,
      ts: '// TypeScript code',
      py: '# Python code',
      json: '{}',
      md: '# New File',
      txt: 'New text file'
    };

    const newFile: FileContent = {
      name,
      content: defaultContent[type] || '',
      type,
      lastModified: new Date()
    };
    setFiles(prev => [...prev, newFile]);
    setSelectedFile(name);
  }, [files]);

  // Remove duplicate files
  const removeDuplicateFiles = useCallback(() => {
    setFiles(prev => {
      const uniqueFiles = new Map<string, FileContent>();
      prev.forEach(file => {
        if (!uniqueFiles.has(file.name)) {
          uniqueFiles.set(file.name, file);
        }
      });
      return Array.from(uniqueFiles.values());
    });
  }, []);

  // Clean up duplicates on files change
  useEffect(() => {
    const fileNames = files.map(f => f.name);
    const uniqueNames = new Set(fileNames);
    if (fileNames.length !== uniqueNames.size) {
      console.warn('Duplicate files detected, cleaning up...');
      removeDuplicateFiles();
    }
  }, [files, removeDuplicateFiles]);

  const deleteFile = useCallback((fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
    if (selectedFile === fileName) {
      setSelectedFile(files[0]?.name || 'index.html');
    }
  }, [selectedFile, files]);

  // AI Integration: Create or update file from AI response
  const createOrUpdateFileFromAI = useCallback((fileName: string, content: string, type: FileContent['type']) => {
    const existingFile = files.find(f => f.name === fileName);
    
    if (existingFile) {
      // Update existing file
      updateFileContent(fileName, content);
    } else {
      // Create new file
      const newFile: FileContent = {
        name: fileName,
        content,
        type,
        lastModified: new Date()
      };
      setFiles(prev => [...prev, newFile]);
    }
    
    // Switch to the updated/created file
    setSelectedFile(fileName);
  }, [files, updateFileContent]);

  // AI Integration: Apply multiple file changes from AI response
  const applyAIChanges = useCallback((changes: Array<{fileName: string, content: string, type: FileContent['type']}>) => {
    changes.forEach(change => {
      createOrUpdateFileFromAI(change.fileName, change.content, change.type);
    });
  }, [createOrUpdateFileFromAI]);

  // Parse AI response for code blocks and apply them
  const parseAndApplyAIResponse = useCallback((aiResponse: string) => {
    const codeBlockRegex = /```(\w+)?\s*(?:\/\/\s*(.+\.(?:html|css|js|json|md|tsx|ts|py|txt)))?\n([\s\S]*?)```/g;
    const changes: Array<{fileName: string, content: string, type: FileContent['type']}> = [];
    let match;

    while ((match = codeBlockRegex.exec(aiResponse)) !== null) {
      const language = match[1]?.toLowerCase() || '';
      const fileName = match[2] || `generated.${language}`;
      const content = match[3].trim();
      
      // Determine file type from language or extension
      let type: FileContent['type'] = 'html';
      if (language === 'css' || fileName.endsWith('.css')) type = 'css';
      else if (language === 'javascript' || language === 'js' || fileName.endsWith('.js')) type = 'js';
      else if (language === 'json' || fileName.endsWith('.json')) type = 'json';
      else if (language === 'typescript' || language === 'ts' || fileName.endsWith('.ts')) type = 'ts';
      else if (language === 'tsx' || fileName.endsWith('.tsx')) type = 'tsx';
      else if (language === 'python' || language === 'py' || fileName.endsWith('.py')) type = 'py';
      else if (fileName.endsWith('.md')) type = 'md';
      else if (fileName.endsWith('.txt')) type = 'txt';
      
      changes.push({ fileName, content, type });
    }

    if (changes.length > 0) {
      applyAIChanges(changes);
      return changes.length;
    }
    
    return 0;
  }, [applyAIChanges]);

  const getSelectedFileContent = useCallback(() => {
    return files.find(file => file.name === selectedFile)?.content || '';
  }, [files, selectedFile]);

  const getSelectedFileType = useCallback(() => {
    return files.find(file => file.name === selectedFile)?.type || 'html';
  }, [files, selectedFile]);

  // Project context analysis for AI completions
  const getProjectContext = useCallback(() => {
    const context = {
      totalFiles: files.length,
      fileTypes: [...new Set(files.map(f => f.type))],
      fileNames: files.map(f => f.name),
      dependencies: [] as string[],
      frameworks: [] as string[],
      patterns: [] as string[]
    };

    // Analyze files for dependencies and frameworks
    files.forEach(file => {
      const content = file.content.toLowerCase();

      // Detect frameworks
      if (content.includes('react') || content.includes('jsx') || content.includes('usestate')) {
        if (!context.frameworks.includes('React')) context.frameworks.push('React');
      }
      if (content.includes('vue') || content.includes('v-')) {
        if (!context.frameworks.includes('Vue')) context.frameworks.push('Vue');
      }
      if (content.includes('angular') || content.includes('@component')) {
        if (!context.frameworks.includes('Angular')) context.frameworks.push('Angular');
      }
      if (content.includes('tailwind') || content.includes('tw-')) {
        if (!context.frameworks.includes('Tailwind')) context.frameworks.push('Tailwind');
      }
      if (content.includes('bootstrap') || content.includes('btn-')) {
        if (!context.frameworks.includes('Bootstrap')) context.frameworks.push('Bootstrap');
      }

      // Detect common patterns
      if (content.includes('async') && content.includes('await')) {
        if (!context.patterns.includes('async/await')) context.patterns.push('async/await');
      }
      if (content.includes('fetch(') || content.includes('axios')) {
        if (!context.patterns.includes('API calls')) context.patterns.push('API calls');
      }
      if (content.includes('localstorage') || content.includes('sessionstorage')) {
        if (!context.patterns.includes('Local storage')) context.patterns.push('Local storage');
      }
      if (content.includes('eventlistener') || content.includes('onclick')) {
        if (!context.patterns.includes('Event handling')) context.patterns.push('Event handling');
      }

      // Extract import statements for dependencies
      const importMatches = file.content.match(/import.*from\s+['"]([^'"]+)['"]/g);
      if (importMatches) {
        importMatches.forEach(match => {
          const dep = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
          if (dep && !dep.startsWith('.') && !context.dependencies.includes(dep)) {
            context.dependencies.push(dep);
          }
        });
      }
    });

    return context;
  }, [files]);

  // Get related files for context
  const getRelatedFiles = useCallback((currentFile: string, maxFiles: number = 5) => {
    if (!currentFile) return [];

    const currentFileExt = currentFile.split('.').pop()?.toLowerCase();
    const currentFileBase = currentFile.replace(/\.[^/.]+$/, '');

    return files
      .filter(file => file.name !== currentFile)
      .sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // Same extension gets higher score
        if (a.name.endsWith(`.${currentFileExt}`)) scoreA += 3;
        if (b.name.endsWith(`.${currentFileExt}`)) scoreB += 3;

        // Similar base name gets higher score
        if (a.name.includes(currentFileBase) || currentFileBase.includes(a.name.replace(/\.[^/.]+$/, ''))) {
          scoreA += 5;
        }
        if (b.name.includes(currentFileBase) || currentFileBase.includes(b.name.replace(/\.[^/.]+$/, ''))) {
          scoreB += 5;
        }

        // Files with imports/references get higher score
        const currentContent = files.find(f => f.name === currentFile)?.content || '';
        if (currentContent.includes(a.name) || a.content.includes(currentFile)) scoreA += 2;
        if (currentContent.includes(b.name) || b.content.includes(currentFile)) scoreB += 2;

        return scoreB - scoreA;
      })
      .slice(0, maxFiles);
  }, [files]);

  // Extract symbols from file for completion context
  const extractFileSymbols = useCallback((fileName: string) => {
    const file = files.find(f => f.name === fileName);
    if (!file) return { functions: [], variables: [], classes: [], exports: [] };

    const content = file.content;
    const symbols = {
      functions: [] as string[],
      variables: [] as string[],
      classes: [] as string[],
      exports: [] as string[]
    };

    // Extract functions
    const functionRegex = /(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*(?:async\s+)?\([^)]*\)\s*=>)/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const funcName = match[1] || match[2] || match[3];
      if (funcName && !symbols.functions.includes(funcName)) {
        symbols.functions.push(funcName);
      }
    }

    // Extract variables
    const variableRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    while ((match = variableRegex.exec(content)) !== null) {
      const varName = match[1];
      if (varName && !symbols.variables.includes(varName)) {
        symbols.variables.push(varName);
      }
    }

    // Extract classes
    const classRegex = /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      if (className && !symbols.classes.includes(className)) {
        symbols.classes.push(className);
      }
    }

    // Extract exports
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class)?\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      const exportName = match[1];
      if (exportName && !symbols.exports.includes(exportName)) {
        symbols.exports.push(exportName);
      }
    }

    return symbols;
  }, [files]);

  return {
    files,
    selectedFile,
    setSelectedFile,
    updateFileContent,
    addNewFile,
    deleteFile,
    getSelectedFileContent,
    getSelectedFileType,
    setFiles,
    // AI Integration methods
    createOrUpdateFileFromAI,
    applyAIChanges,
    parseAndApplyAIResponse,
    // Project management
    currentProject,
    saveProject,
    initializeDefaultProject,
    // Context analysis methods
    getProjectContext,
    getRelatedFiles,
    extractFileSymbols
  };
}

export function useCodeExport() {
  const exportAsZip = useCallback(async (files: FileContent[], appName: string) => {
    try {
      const zip = new JSZip();
      
      // Add all files to the zip
      files.forEach(file => {
        zip.file(file.name, file.content);
      });
      
      // Generate the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Download the zip
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${appName.toLowerCase().replace(/\s+/g, '-')}-project.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip file:', error);
    }
  }, []);

  const previewInNewTab = useCallback((files: FileContent[]) => {
    console.log('Preview called with files:', files.map(f => ({ name: f.name, type: f.type, contentLength: f.content.length })));

    // Try to find an HTML file to preview
    let htmlFile = files.find(f => f.name === 'index.html');
    if (!htmlFile) {
      htmlFile = files.find(f => f.type === 'html');
    }

    console.log('Found HTML file:', htmlFile ? { name: htmlFile.name, type: htmlFile.type, contentPreview: htmlFile.content.substring(0, 200) + '...' } : null);

    if (!htmlFile) {
      // If no HTML file, create a simple preview with the first file
      const firstFile = files[0];
      if (!firstFile) {
        alert('No files to preview');
        return;
      }

      console.log('Using first file for preview:', firstFile);

      // Create a simple HTML wrapper for non-HTML files
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview: ${firstFile.name}</title>
    <style>
        body {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          padding: 20px;
          background: #1e1e1e;
          color: #d4d4d4;
          margin: 0;
        }
        pre {
          background: #2d2d2d;
          padding: 15px;
          border-radius: 5px;
          overflow: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        h1 { color: #00d4aa; }
    </style>
</head>
<body>
    <h1>Preview: ${firstFile.name}</h1>
    <p><strong>File Type:</strong> ${firstFile.type}</p>
    <p><strong>Last Modified:</strong> ${new Date(firstFile.lastModified).toLocaleString()}</p>
    <pre><code>${firstFile.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
</body>
</html>`;

      console.log('Generated HTML content length:', htmlContent.length);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      console.log('Generated blob URL:', url);
      window.open(url, '_blank');
      return;
    }

    console.log('Using HTML file content length:', htmlFile.content.length);

    // Create a complete HTML with embedded resources
    let completeHtml = htmlFile.content;

    // Find and embed CSS files
    const cssFiles = files.filter(f => f.type === 'css');
    cssFiles.forEach(cssFile => {
      const linkRegex = new RegExp(`<link[^>]*href=["']${cssFile.name}["'][^>]*>`, 'gi');
      const styleTag = `<style>\n${cssFile.content}\n</style>`;
      completeHtml = completeHtml.replace(linkRegex, styleTag);
    });

    // Find and embed JavaScript files
    const jsFiles = files.filter(f => f.type === 'js' || f.type === 'tsx' || f.type === 'ts');
    jsFiles.forEach(jsFile => {
      const scriptRegex = new RegExp(`<script[^>]*src=["']${jsFile.name}["'][^>]*></script>`, 'gi');
      let jsContent = jsFile.content;

      // Handle TypeScript/JSX files - convert to plain JavaScript for preview
      if (jsFile.type === 'tsx' || jsFile.type === 'ts') {
        // Simple conversion - remove TypeScript syntax for preview
        jsContent = jsContent
          .replace(/import\s+.*?from\s+['"][^'"]*['"];?\s*/g, '') // Remove imports
          .replace(/export\s+(default\s+)?/g, '') // Remove exports
          .replace(/:\s*\w+(\[\])?/g, '') // Remove type annotations
          .replace(/interface\s+\w+\s*{[^}]*}/g, '') // Remove interfaces
          .replace(/type\s+\w+\s*=\s*[^;]+;/g, ''); // Remove type definitions
      }

      const scriptTag = `<script>\n${jsContent}\n</script>`;
      completeHtml = completeHtml.replace(scriptRegex, scriptTag);
    });

    // Add error handling for localStorage issues
    const errorHandlingScript = `
    <script>
      // Override localStorage for sandboxed environment
      if (typeof Storage === "undefined" || !window.localStorage) {
        window.localStorage = {
          getItem: function(key) { return null; },
          setItem: function(key, value) { console.warn('localStorage not available in preview'); },
          removeItem: function(key) { console.warn('localStorage not available in preview'); },
          clear: function() { console.warn('localStorage not available in preview'); }
        };
      }

      // Handle module errors
      window.addEventListener('error', function(e) {
        if (e.message.includes('import') || e.message.includes('export')) {
          console.warn('Module syntax detected - this is a preview limitation');
        }
      });
    </script>`;

    completeHtml = completeHtml.replace('</head>', errorHandlingScript + '</head>');

    const blob = new Blob([completeHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    console.log('Generated blob URL for complete HTML:', url);
    window.open(url, '_blank');
  }, []);

  return {
    exportAsZip,
    previewInNewTab
  };
}
