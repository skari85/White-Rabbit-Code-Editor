import { useState, useCallback, useEffect } from 'react';

export interface LocalFolder {
  id: string;
  name: string;
  handle: FileSystemDirectoryHandle;
  path: string;
  lastAccessed: Date;
  projectCount: number;
}

export interface LocalFile {
  name: string;
  content: string;
  handle: FileSystemFileHandle;
  lastModified: Date;
}

export interface LocalProject {
  id: string;
  name: string;
  folderHandle: FileSystemDirectoryHandle;
  files: LocalFile[];
  lastModified: Date;
}

const FOLDERS_STORAGE_KEY = 'hex-kex-local-folders';

export function useLocalStorage() {
  const [isSupported, setIsSupported] = useState(false);
  const [folders, setFolders] = useState<LocalFolder[]>([]);
  const [currentProject, setCurrentProject] = useState<LocalProject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if File System Access API is supported
  useEffect(() => {
    const supported = 'showDirectoryPicker' in window && 'showSaveFilePicker' in window;
    setIsSupported(supported);
    
    if (supported) {
      loadSavedFolders();
    }
  }, []);

  // Load saved folder references from localStorage
  const loadSavedFolders = useCallback(async () => {
    try {
      const savedFolders = localStorage.getItem(FOLDERS_STORAGE_KEY);
      if (savedFolders) {
        const folderData = JSON.parse(savedFolders);
        // Note: We can't restore FileSystemDirectoryHandle from localStorage
        // Users will need to re-select folders after browser restart
        setFolders(folderData.map((folder: any) => ({
          ...folder,
          lastAccessed: new Date(folder.lastAccessed),
          handle: null // Will need to be re-selected
        })));
      }
    } catch (error) {
      console.error('Error loading saved folders:', error);
    }
  }, []);

  // Save folder references to localStorage (without handles)
  const saveFolders = useCallback((foldersToSave: LocalFolder[]) => {
    try {
      const folderData = foldersToSave.map(folder => ({
        id: folder.id,
        name: folder.name,
        path: folder.path,
        lastAccessed: folder.lastAccessed,
        projectCount: folder.projectCount
      }));
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folderData));
    } catch (error) {
      console.error('Error saving folders:', error);
    }
  }, []);

  // Request access to a local folder
  const selectFolder = useCallback(async (): Promise<LocalFolder | null> => {
    if (!isSupported) {
      setError('File System Access API is not supported in this browser');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });

      // Count existing projects in the folder
      let projectCount = 0;
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'directory') {
          projectCount++;
        }
      }

      const folder: LocalFolder = {
        id: `folder-${Date.now()}`,
        name: dirHandle.name,
        handle: dirHandle,
        path: dirHandle.name, // Browser doesn't expose full path for security
        lastAccessed: new Date(),
        projectCount
      };

      const updatedFolders = [...folders.filter(f => f.name !== folder.name), folder];
      setFolders(updatedFolders);
      saveFolders(updatedFolders);

      return folder;
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setError(`Failed to select folder: ${error.message}`);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, folders, saveFolders]);

  // Create a new project folder
  const createProjectFolder = useCallback(async (
    parentFolder: LocalFolder,
    projectName: string
  ): Promise<LocalProject | null> => {
    if (!parentFolder.handle) {
      setError('Folder handle is not available. Please re-select the folder.');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create project directory
      const projectHandle = await parentFolder.handle.getDirectoryHandle(projectName, {
        create: true
      });

      // Create initial project files
      const indexFile = await projectHandle.getFileHandle('index.html', { create: true });
      const cssFile = await projectHandle.getFileHandle('style.css', { create: true });
      const jsFile = await projectHandle.getFileHandle('script.js', { create: true });

      // Write initial content
      const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app">
    <header>
      <h1>${projectName}</h1>
    </header>
    <main>
      <p>Welcome to your new project!</p>
    </main>
  </div>
  <script src="script.js"></script>
</body>
</html>`;

      const cssContent = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: #3B82F6;
  color: white;
  padding: 1rem;
  text-align: center;
}

main {
  flex: 1;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}`;

      const jsContent = `// ${projectName} JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('${projectName} loaded successfully!');
});`;

      // Write files
      await writeToFile(indexFile, indexContent);
      await writeToFile(cssFile, cssContent);
      await writeToFile(jsFile, jsContent);

      const project: LocalProject = {
        id: `project-${Date.now()}`,
        name: projectName,
        folderHandle: projectHandle,
        files: [
          {
            name: 'index.html',
            content: indexContent,
            handle: indexFile,
            lastModified: new Date()
          },
          {
            name: 'style.css',
            content: cssContent,
            handle: cssFile,
            lastModified: new Date()
          },
          {
            name: 'script.js',
            content: jsContent,
            handle: jsFile,
            lastModified: new Date()
          }
        ],
        lastModified: new Date()
      };

      // Update folder project count
      const updatedFolders = folders.map(f => 
        f.id === parentFolder.id 
          ? { ...f, projectCount: f.projectCount + 1, lastAccessed: new Date() }
          : f
      );
      setFolders(updatedFolders);
      saveFolders(updatedFolders);

      setCurrentProject(project);
      return project;
    } catch (error: any) {
      setError(`Failed to create project: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [folders, saveFolders]);

  // Load an existing project from a folder
  const loadProject = useCallback(async (
    folder: LocalFolder,
    projectName: string
  ): Promise<LocalProject | null> => {
    if (!folder.handle) {
      setError('Folder handle is not available. Please re-select the folder.');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const projectHandle = await folder.handle.getDirectoryHandle(projectName);
      const files: LocalFile[] = [];

      // Read all files in the project directory
      for await (const [name, handle] of projectHandle.entries()) {
        if (handle.kind === 'file') {
          const fileHandle = handle as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          const content = await file.text();
          
          files.push({
            name,
            content,
            handle: fileHandle,
            lastModified: new Date(file.lastModified)
          });
        }
      }

      const project: LocalProject = {
        id: `project-${Date.now()}`,
        name: projectName,
        folderHandle: projectHandle,
        files,
        lastModified: new Date()
      };

      // Update folder last accessed
      const updatedFolders = folders.map(f => 
        f.id === folder.id 
          ? { ...f, lastAccessed: new Date() }
          : f
      );
      setFolders(updatedFolders);
      saveFolders(updatedFolders);

      setCurrentProject(project);
      return project;
    } catch (error: any) {
      setError(`Failed to load project: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [folders, saveFolders]);

  // Save a file to the local project
  const saveFile = useCallback(async (
    fileName: string,
    content: string
  ): Promise<boolean> => {
    if (!currentProject) {
      setError('No project is currently loaded');
      return false;
    }

    try {
      setError(null);
      
      // Find existing file or create new one
      let fileHandle = currentProject.files.find(f => f.name === fileName)?.handle;
      
      if (!fileHandle) {
        fileHandle = await currentProject.folderHandle.getFileHandle(fileName, { create: true });
      }

      await writeToFile(fileHandle, content);

      // Update project files
      const updatedFiles = currentProject.files.map(f => 
        f.name === fileName 
          ? { ...f, content, lastModified: new Date() }
          : f
      );

      // Add new file if it doesn't exist
      if (!currentProject.files.find(f => f.name === fileName)) {
        updatedFiles.push({
          name: fileName,
          content,
          handle: fileHandle,
          lastModified: new Date()
        });
      }

      setCurrentProject({
        ...currentProject,
        files: updatedFiles,
        lastModified: new Date()
      });

      return true;
    } catch (error: any) {
      setError(`Failed to save file: ${error.message}`);
      return false;
    }
  }, [currentProject]);

  // List projects in a folder
  const listProjects = useCallback(async (folder: LocalFolder): Promise<string[]> => {
    if (!folder.handle) {
      return [];
    }

    try {
      const projects: string[] = [];
      
      for await (const [name, handle] of folder.handle.entries()) {
        if (handle.kind === 'directory') {
          projects.push(name);
        }
      }

      return projects;
    } catch (error) {
      console.error('Error listing projects:', error);
      return [];
    }
  }, []);

  // Remove folder from list
  const removeFolder = useCallback((folderId: string) => {
    const updatedFolders = folders.filter(f => f.id !== folderId);
    setFolders(updatedFolders);
    saveFolders(updatedFolders);
  }, [folders, saveFolders]);

  return {
    isSupported,
    folders,
    currentProject,
    isLoading,
    error,
    selectFolder,
    createProjectFolder,
    loadProject,
    saveFile,
    listProjects,
    removeFolder,
    setError
  };
}

// Helper function to write content to a file handle
async function writeToFile(fileHandle: FileSystemFileHandle, content: string) {
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}
