import { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';

const PROJECT_STORAGE_KEY = 'hex-kex-project';
const PROJECTS_LIST_KEY = 'hex-kex-projects-list';

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
  <title>My Project</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app">
    <header class="header">
      <h1>My Web Project</h1>
    </header>
    <main class="main">
      <p>Welcome to your new project! Start building something amazing.</p>
    </main>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
        type: 'html',
        lastModified: new Date()
      },
      {
        name: 'style.css',
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #3B82F6;
  color: white;
  padding: 1rem;
  text-align: center;
}

.main {
  flex: 1;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}`,
        type: 'css',
        lastModified: new Date()
      },
      {
        name: 'script.js',
        content: `// JavaScript code
document.addEventListener('DOMContentLoaded', function() {
  console.log('Project loaded successfully!');
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
  }, []);

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
    saveProject
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
    const blob = new Blob([htmlFile.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    console.log('Generated blob URL for HTML:', url);
    window.open(url, '_blank');
  }, []);

  return {
    exportAsZip,
    previewInNewTab
  };
}
