import { useState, useCallback } from 'react';
import { PWASettings } from '@/lib/pwa-generator';
import JSZip from 'jszip';

export interface FileContent {
  name: string;
  content: string;
  type: 'html' | 'css' | 'js' | 'json' | 'md';
}

export function usePWABuilder() {
  const [files, setFiles] = useState<FileContent[]>([
    {
      name: 'index.html',
      content: `<!DOCTYPE html>
<html>
<head>
  <title>My PWA</title>
  <link rel="manifest" href="manifest.json">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <h1>Hello PWA!</h1>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  </script>
</body>
</html>`,
      type: 'html'
    },
    {
      name: 'manifest.json',
      content: '{}',
      type: 'json'
    },
    {
      name: 'sw.js',
      content: '// Service Worker',
      type: 'js'
    },
    {
      name: 'style.css',
      content: `body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background: #f5f5f5;
}

h1 {
  color: #333;
  text-align: center;
}`,
      type: 'css'
    }
  ]);

  const [selectedFile, setSelectedFile] = useState('index.html');

  const updateFileContent = useCallback((fileName: string, content: string) => {
    setFiles(prev => prev.map(file => 
      file.name === fileName ? { ...file, content } : file
    ));
  }, []);

  const addNewFile = useCallback((name: string, type: FileContent['type'] = 'html') => {
    const newFile: FileContent = {
      name,
      content: type === 'html' ? '<!DOCTYPE html>\n<html>\n<head>\n  <title>New File</title>\n</head>\n<body>\n  \n</body>\n</html>' :
               type === 'css' ? '/* CSS styles */' :
               type === 'js' ? '// JavaScript code' :
               type === 'json' ? '{}' : '# New File',
      type
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
    setFiles
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
      a.download = `${appName.toLowerCase().replace(/\s+/g, '-')}-pwa.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip file:', error);
      // Fallback to JSON export
      const blob = new Blob([JSON.stringify(files, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${appName.toLowerCase().replace(/\s+/g, '-')}-pwa.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, []);

  const previewInNewTab = useCallback((files: FileContent[]) => {
    const indexFile = files.find(f => f.name === 'index.html');
    if (!indexFile) return;

    const blob = new Blob([indexFile.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, []);

  return {
    exportAsZip,
    previewInNewTab
  };
}
