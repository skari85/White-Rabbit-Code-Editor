export interface Extension {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  publisher: {
    displayName: string;
    publisherId: string;
  };
  categories: string[];
  tags: string[];
  downloadCount: number;
  rating: number;
  ratingCount: number;
  lastUpdated: string;
  publishedDate: string;
  iconUrl?: string;
  repository?: string;
  homepage?: string;
  license?: string;
  readme?: string;
  changelog?: string;
  dependencies?: string[];
  engines?: {
    vscode?: string;
    [key: string]: string | undefined;
  };
  isInstalled?: boolean;
  isEnabled?: boolean;
  isUpdateAvailable?: boolean;
  localVersion?: string;
  size?: number;
}

export interface ExtensionManifest {
  name: string;
  displayName: string;
  description: string;
  version: string;
  publisher: string;
  categories: string[];
  tags: string[];
  main: string;
  activationEvents: string[];
  contributes: any;
  engines: {
    vscode: string;
  };
}

export interface InstalledExtension extends Extension {
  localPath: string;
  manifest: ExtensionManifest;
  isEnabled: boolean;
  isInstalled: boolean;
  localVersion: string;
  installDate: string;
  lastUsed?: string;
}

export class ExtensionManager {
  private extensions: Map<string, InstalledExtension> = new Map();
  private extensionRegistry: Map<string, Extension> = new Map();
  private storageKey = 'wr-installed-extensions';

  constructor() {
    this.loadInstalledExtensions();
  }

  // Load installed extensions from storage
  private loadInstalledExtensions(): void {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          const extensions = JSON.parse(saved);
          extensions.forEach((ext: InstalledExtension) => {
            this.extensions.set(ext.id, ext);
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load installed extensions:', error);
    }
  }

  // Save installed extensions to storage
  private saveInstalledExtensions(): void {
    try {
      if (typeof window !== 'undefined') {
        const extensions = Array.from(this.extensions.values());
        localStorage.setItem(this.storageKey, JSON.stringify(extensions));
      }
    } catch (error) {
      console.warn('Failed to save installed extensions:', error);
    }
  }

  // Get all installed extensions
  getInstalledExtensions(): InstalledExtension[] {
    return Array.from(this.extensions.values());
  }

  // Get extension by ID
  getExtension(id: string): InstalledExtension | undefined {
    return this.extensions.get(id);
  }

  // Check if extension is installed
  isExtensionInstalled(id: string): boolean {
    return this.extensions.has(id);
  }

  // Check if extension is enabled
  isExtensionEnabled(id: string): boolean {
    const ext = this.extensions.get(id);
    return ext?.isEnabled ?? false;
  }

  // Install extension
  async installExtension(extension: Extension): Promise<InstalledExtension> {
    try {
      // Simulate download and installation process
      console.log(`Installing extension: ${extension.displayName}`);
      
      // Create local extension path
      const localPath = `/extensions/${extension.publisher.publisherId}.${extension.name}`;
      
      // Create installed extension object
      const installedExtension: InstalledExtension = {
        ...extension,
        localPath,
        manifest: this.generateManifest(extension),
        isEnabled: true,
        isInstalled: true,
        localVersion: extension.version,
        installDate: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };

      // Add to extensions map
      this.extensions.set(extension.id, installedExtension);
      
      // Save to storage
      this.saveInstalledExtensions();

      // Emit installation event
      this.emitExtensionEvent('installed', installedExtension);

      console.log(`Extension ${extension.displayName} installed successfully`);
      return installedExtension;
    } catch (error) {
      console.error('Failed to install extension:', error);
      throw error;
    }
  }

  // Uninstall extension
  async uninstallExtension(id: string): Promise<void> {
    try {
      const extension = this.extensions.get(id);
      if (!extension) {
        throw new Error(`Extension ${id} not found`);
      }

      console.log(`Uninstalling extension: ${extension.displayName}`);

      // Remove from extensions map
      this.extensions.delete(id);
      
      // Save to storage
      this.saveInstalledExtensions();

      // Emit uninstallation event
      this.emitExtensionEvent('uninstalled', extension);

      console.log(`Extension ${extension.displayName} uninstalled successfully`);
    } catch (error) {
      console.error('Failed to uninstall extension:', error);
      throw error;
    }
  }

  // Enable/disable extension
  toggleExtension(id: string): boolean {
    const extension = this.extensions.get(id);
    if (!extension) {
      throw new Error(`Extension ${id} not found`);
    }

    extension.isEnabled = !extension.isEnabled;
    extension.lastUsed = new Date().toISOString();
    
    // Save to storage
    this.saveInstalledExtensions();

    // Emit toggle event
    this.emitExtensionEvent(extension.isEnabled ? 'enabled' : 'disabled', extension);

    return extension.isEnabled;
  }

  // Update extension
  async updateExtension(id: string): Promise<void> {
    try {
      const extension = this.extensions.get(id);
      if (!extension) {
        throw new Error(`Extension ${id} not found`);
      }

      console.log(`Updating extension: ${extension.displayName}`);

      // Simulate update process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update version and dates
      extension.localVersion = extension.version;
      extension.installDate = new Date().toISOString();
      extension.isUpdateAvailable = false;

      // Save to storage
      this.saveInstalledExtensions();

      // Emit update event
      this.emitExtensionEvent('updated', extension);

      console.log(`Extension ${extension.displayName} updated successfully`);
    } catch (error) {
      console.error('Failed to update extension:', error);
      throw error;
    }
  }

  // Get extension updates
  async checkForUpdates(): Promise<InstalledExtension[]> {
    try {
      const updates: InstalledExtension[] = [];
      
      // Simulate checking for updates
      for (const extension of this.extensions.values()) {
        // In a real implementation, you would check against the registry
        if (Math.random() > 0.8) { // 20% chance of update for demo
          extension.isUpdateAvailable = true;
          updates.push(extension);
        }
      }

      // Save to storage
      this.saveInstalledExtensions();

      return updates;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return [];
    }
  }

  // Search extensions in registry
  async searchExtensions(query: string, category?: string): Promise<Extension[]> {
    try {
      // In a real implementation, this would call the OpenVSX API
      const extensions = await this.getExtensionsFromRegistry();
      return extensions.filter(ext => {
        const matchesQuery = ext.displayName.toLowerCase().includes(query.toLowerCase()) ||
                            ext.description.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = !category || category === 'all' || ext.categories.includes(category);
        return matchesQuery && matchesCategory;
      });
    } catch (error) {
      console.error('Failed to search extensions:', error);
      return [];
    }
  }

  // Get extension categories
  getExtensionCategories(): { id: string; name: string; count: number }[] {
    const categories = new Map<string, number>();
    
    this.extensions.forEach(ext => {
      ext.categories.forEach(cat => {
        categories.set(cat, (categories.get(cat) || 0) + 1);
      });
    });

    return Array.from(categories.entries()).map(([id, count]) => ({
      id,
      name: this.formatCategoryName(id),
      count
    }));
  }

  // Get extension statistics
  getExtensionStats(): {
    total: number;
    enabled: number;
    disabled: number;
    updatesAvailable: number;
  } {
    const total = this.extensions.size;
    const enabled = Array.from(this.extensions.values()).filter(ext => ext.isEnabled).length;
    const disabled = total - enabled;
    const updatesAvailable = Array.from(this.extensions.values()).filter(ext => ext.isUpdateAvailable).length;

    return { total, enabled, disabled, updatesAvailable };
  }

  // Generate manifest for installed extension
  private generateManifest(extension: Extension): ExtensionManifest {
    return {
      name: extension.name,
      displayName: extension.displayName,
      description: extension.description,
      version: extension.version,
      publisher: extension.publisher.publisherId,
      categories: extension.categories,
      tags: extension.tags,
      main: './extension.js',
      activationEvents: ['*'],
      contributes: {},
      engines: {
        vscode: extension.engines?.vscode || '^1.60.0'
      }
    };
  }

  // Format category name
  private formatCategoryName(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Get extensions from registry
  private async getExtensionsFromRegistry(): Promise<Extension[]> {
    try {
      // In production, this would fetch from Open VSX Registry or similar
      // For now, return empty array and load from localStorage if available
      const savedExtensions = localStorage.getItem('wr-installed-extensions');
      if (savedExtensions) {
        return JSON.parse(savedExtensions);
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  // Event system for extension lifecycle
  private eventListeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitExtensionEvent(event: string, extension: InstalledExtension): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(extension);
        } catch (error) {
          console.error(`Error in extension event listener for ${event}:`, error);
        }
      });
    }
  }

  // Cleanup
  dispose(): void {
    this.extensions.clear();
    this.extensionRegistry.clear();
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const extensionManager = new ExtensionManager();
