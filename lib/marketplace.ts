export interface MarketplaceExtension {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  publisher: string;
  category: ExtensionCategory;
  tags: string[];
  icon: string;
  screenshots?: string[];
  readme?: string;
  changelog?: string;
  repository?: string;
  homepage?: string;
  license?: string;
  pricing: 'free' | 'paid' | 'freemium';
  price?: number;
  downloads: number;
  rating: number;
  reviewCount: number;
  lastUpdated: string;
  compatibility: string[];
  dependencies?: string[];
  permissions: ExtensionPermission[];
  installSize: string;
  featured: boolean;
  verified: boolean;
  config?: ExtensionConfig;
}

export type ExtensionCategory = 
  | 'deployment'
  | 'cloud-storage' 
  | 'ai-tools'
  | 'code-sharing'
  | 'design-tools'
  | 'analytics'
  | 'authentication'
  | 'database'
  | 'ui-components'
  | 'themes'
  | 'productivity'
  | 'testing'
  | 'optimization'
  | 'social'
  | 'other';

export type ExtensionPermission = 
  | 'file-access'
  | 'network-access'
  | 'storage-access'
  | 'clipboard-access'
  | 'camera-access'
  | 'microphone-access'
  | 'location-access'
  | 'notifications';

export interface ExtensionConfig {
  apiKey?: {
    required: boolean;
    description: string;
    placeholder: string;
    helpUrl?: string;
  };
  settings?: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'select';
      default: any;
      description: string;
      options?: string[];
    };
  };
}

export interface InstalledExtension extends MarketplaceExtension {
  installedAt: string;
  enabled: boolean;
  config: { [key: string]: any };
}

export class MarketplaceService {
  private static readonly STORAGE_KEY = 'hexkex_installed_extensions';
  private static readonly CONFIG_KEY = 'hexkex_extension_configs';

  // Mock marketplace data - in production, this would come from an API
  static getMarketplaceExtensions(): MarketplaceExtension[] {
    return [
      {
        id: 'vercel-deploy',
        name: 'vercel-deploy',
        displayName: 'Vercel Deployment',
        description: 'Deploy your PWA projects to Vercel with one click',
        version: '1.0.0',
        publisher: 'Hex & Kex',
        category: 'deployment',
        tags: ['deployment', 'vercel', 'hosting', 'cdn'],
        icon: '⚡',
        downloads: 15420,
        rating: 4.8,
        reviewCount: 234,
        lastUpdated: '2024-01-15',
        compatibility: ['3.0.0+'],
        permissions: ['network-access', 'file-access'],
        installSize: '45 KB',
        featured: true,
        verified: true,
        pricing: 'free',
        config: {
          apiKey: {
            required: true,
            description: 'Your Vercel API token',
            placeholder: 'vercel_xxxxxxxxxxxxxxxxxxxxxxxx',
            helpUrl: 'https://vercel.com/account/tokens'
          }
        }
      },
      {
        id: 'github-sync',
        name: 'github-sync',
        displayName: 'GitHub Integration',
        description: 'Sync your projects with GitHub repositories',
        version: '2.1.0',
        publisher: 'Hex & Kex',
        category: 'cloud-storage',
        tags: ['github', 'version-control', 'sync', 'backup'],
        icon: '🐙',
        downloads: 12890,
        rating: 4.7,
        reviewCount: 189,
        lastUpdated: '2024-01-10',
        compatibility: ['3.0.0+'],
        permissions: ['network-access', 'file-access'],
        installSize: '38 KB',
        featured: true,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'codepen-export',
        name: 'codepen-export',
        displayName: 'CodePen Export',
        description: 'Export your projects to CodePen for sharing and collaboration',
        version: '1.2.0',
        publisher: 'Hex & Kex',
        category: 'code-sharing',
        tags: ['codepen', 'sharing', 'export', 'collaboration'],
        icon: '📝',
        downloads: 8750,
        rating: 4.6,
        reviewCount: 142,
        lastUpdated: '2024-01-08',
        compatibility: ['3.0.0+'],
        permissions: ['network-access', 'file-access'],
        installSize: '22 KB',
        featured: false,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'google-drive-sync',
        name: 'google-drive-sync',
        displayName: 'Google Drive Sync',
        description: 'Save and sync your projects with Google Drive',
        version: '1.1.0',
        publisher: 'Hex & Kex',
        category: 'cloud-storage',
        tags: ['google-drive', 'cloud', 'sync', 'backup'],
        icon: '☁️',
        downloads: 6420,
        rating: 4.5,
        reviewCount: 98,
        lastUpdated: '2024-01-05',
        compatibility: ['3.0.0+'],
        permissions: ['network-access', 'file-access', 'storage-access'],
        installSize: '52 KB',
        featured: false,
        verified: true,
        pricing: 'free',
        config: {
          apiKey: {
            required: true,
            description: 'Google Drive API credentials',
            placeholder: 'Enter your Google Client ID',
            helpUrl: 'https://console.developers.google.com/'
          }
        }
      },
      {
        id: 'unsplash-images',
        name: 'unsplash-images',
        displayName: 'Unsplash Images',
        description: 'Access millions of free stock photos from Unsplash',
        version: '1.0.5',
        publisher: 'Community',
        category: 'design-tools',
        tags: ['images', 'photos', 'unsplash', 'stock'],
        icon: '📸',
        downloads: 11200,
        rating: 4.9,
        reviewCount: 267,
        lastUpdated: '2024-01-12',
        compatibility: ['3.0.0+'],
        permissions: ['network-access'],
        installSize: '28 KB',
        featured: true,
        verified: true,
        pricing: 'free',
        config: {
          apiKey: {
            required: true,
            description: 'Unsplash API Access Key',
            placeholder: 'Enter your Unsplash API key',
            helpUrl: 'https://unsplash.com/developers'
          }
        }
      },
      {
        id: 'tailwind-components',
        name: 'tailwind-components',
        displayName: 'Tailwind UI Components',
        description: 'Pre-built Tailwind CSS components library',
        version: '2.0.0',
        publisher: 'TailwindLabs',
        category: 'ui-components',
        tags: ['tailwind', 'components', 'ui', 'css'],
        icon: '🎨',
        downloads: 18750,
        rating: 4.8,
        reviewCount: 445,
        lastUpdated: '2024-01-14',
        compatibility: ['3.0.0+'],
        permissions: ['file-access'],
        installSize: '156 KB',
        featured: true,
        verified: true,
        pricing: 'freemium',
        price: 9.99
      },
      {
        id: 'google-analytics',
        name: 'google-analytics',
        displayName: 'Google Analytics',
        description: 'Add Google Analytics tracking to your PWA projects',
        version: '1.3.0',
        publisher: 'Google',
        category: 'analytics',
        tags: ['analytics', 'tracking', 'google', 'metrics'],
        icon: '📊',
        downloads: 9340,
        rating: 4.4,
        reviewCount: 156,
        lastUpdated: '2024-01-06',
        compatibility: ['3.0.0+'],
        permissions: ['network-access', 'file-access'],
        installSize: '34 KB',
        featured: false,
        verified: true,
        pricing: 'free',
        config: {
          apiKey: {
            required: true,
            description: 'Google Analytics Measurement ID',
            placeholder: 'G-XXXXXXXXXX',
            helpUrl: 'https://analytics.google.com/'
          }
        }
      },
      {
        id: 'dark-theme-pro',
        name: 'dark-theme-pro',
        displayName: 'Dark Theme Pro',
        description: 'Professional dark theme with multiple variants',
        version: '1.4.2',
        publisher: 'ThemeStudio',
        category: 'themes',
        tags: ['theme', 'dark', 'ui', 'design'],
        icon: '🌙',
        downloads: 5680,
        rating: 4.7,
        reviewCount: 89,
        lastUpdated: '2024-01-09',
        compatibility: ['3.0.0+'],
        permissions: ['storage-access'],
        installSize: '18 KB',
        featured: false,
        verified: false,
        pricing: 'paid',
        price: 4.99
      }
    ];
  }

  static getInstalledExtensions(): InstalledExtension[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getExtensionConfigs(): { [extensionId: string]: any } {
    if (typeof window === 'undefined') return {};
    
    const stored = localStorage.getItem(this.CONFIG_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  static installExtension(extension: MarketplaceExtension): void {
    const installed = this.getInstalledExtensions();
    const existing = installed.find(ext => ext.id === extension.id);
    
    if (existing) {
      throw new Error('Extension is already installed');
    }

    const newExtension: InstalledExtension = {
      ...extension,
      installedAt: new Date().toISOString(),
      enabled: true,
      config: {}
    };

    installed.push(newExtension);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(installed));
  }

  static uninstallExtension(extensionId: string): void {
    const installed = this.getInstalledExtensions();
    const filtered = installed.filter(ext => ext.id !== extensionId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

    // Remove config
    const configs = this.getExtensionConfigs();
    delete configs[extensionId];
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(configs));
  }

  static toggleExtension(extensionId: string, enabled: boolean): void {
    const installed = this.getInstalledExtensions();
    const extension = installed.find(ext => ext.id === extensionId);
    
    if (extension) {
      extension.enabled = enabled;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(installed));
    }
  }

  static updateExtensionConfig(extensionId: string, config: any): void {
    const configs = this.getExtensionConfigs();
    configs[extensionId] = config;
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(configs));
  }

  static isExtensionInstalled(extensionId: string): boolean {
    return this.getInstalledExtensions().some(ext => ext.id === extensionId);
  }

  static getExtensionConfig(extensionId: string): any {
    const configs = this.getExtensionConfigs();
    return configs[extensionId] || {};
  }

  static searchExtensions(query: string, category?: ExtensionCategory): MarketplaceExtension[] {
    const extensions = this.getMarketplaceExtensions();
    
    return extensions.filter(ext => {
      const matchesQuery = !query || 
        ext.displayName.toLowerCase().includes(query.toLowerCase()) ||
        ext.description.toLowerCase().includes(query.toLowerCase()) ||
        ext.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      
      const matchesCategory = !category || ext.category === category;
      
      return matchesQuery && matchesCategory;
    });
  }

  static getFeaturedExtensions(): MarketplaceExtension[] {
    return this.getMarketplaceExtensions().filter(ext => ext.featured);
  }

  static getExtensionsByCategory(category: ExtensionCategory): MarketplaceExtension[] {
    return this.getMarketplaceExtensions().filter(ext => ext.category === category);
  }
}

export const EXTENSION_CATEGORIES: { id: ExtensionCategory; name: string; icon: string }[] = [
  { id: 'deployment', name: 'Deployment', icon: '🚀' },
  { id: 'cloud-storage', name: 'Cloud Storage', icon: '☁️' },
  { id: 'ai-tools', name: 'AI Tools', icon: '🤖' },
  { id: 'code-sharing', name: 'Code Sharing', icon: '📤' },
  { id: 'design-tools', name: 'Design Tools', icon: '🎨' },
  { id: 'analytics', name: 'Analytics', icon: '📊' },
  { id: 'authentication', name: 'Authentication', icon: '🔐' },
  { id: 'database', name: 'Database', icon: '🗄️' },
  { id: 'ui-components', name: 'UI Components', icon: '🧩' },
  { id: 'themes', name: 'Themes', icon: '🌈' },
  { id: 'productivity', name: 'Productivity', icon: '⚡' },
  { id: 'testing', name: 'Testing', icon: '🧪' },
  { id: 'optimization', name: 'Optimization', icon: '⚡' },
  { id: 'social', name: 'Social', icon: '👥' },
  { id: 'other', name: 'Other', icon: '📦' },
];
