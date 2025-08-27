const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppName: () => ipcRenderer.invoke('get-app-name'),
  
  // Menu actions
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action, ...args) => {
      callback(action, ...args);
    });
  },
  
  // File system operations (if needed)
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),
  
  // App lifecycle
  quit: () => ipcRenderer.invoke('quit-app'),
  minimize: () => ipcRenderer.invoke('minimize-app'),
  maximize: () => ipcRenderer.invoke('maximize-app'),
  
  // Platform detection
  platform: process.platform,
  isMac: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux',
  
  // Development mode
  isDev: process.env.NODE_ENV === 'development'
});

// Remove menu action listener when context is lost
window.addEventListener('beforeunload', () => {
  ipcRenderer.removeAllListeners('menu-action');
});
