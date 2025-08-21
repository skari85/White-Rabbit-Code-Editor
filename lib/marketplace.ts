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
  | 'Programming Languages'
  | 'Snippets'
  | 'Linters'
  | 'Themes'
  | 'Debuggers'
  | 'Formatters'
  | 'Keymaps'
  | 'SCM Providers'
  | 'Other'
  | 'Productivity'
  | 'AI Tools'
  | 'Web Development'
  | 'Database'
  | 'Cloud Tools'
  | 'Testing'
  | 'Documentation'
  | 'Git Tools'
  | 'UI Components';

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
  private static readonly STORAGE_KEY = 'whiterabbit_installed_extensions';
  private static readonly CONFIG_KEY = 'whiterabbit_extension_configs';

  // Top 50 most popular VS Code extensions
  static getMarketplaceExtensions(): MarketplaceExtension[] {
    return [
      // Programming Languages
      {
        id: 'ms-python.python',
        name: 'python',
        displayName: 'Python',
        description: 'IntelliSense, linting, debugging, code navigation, code formatting, refactoring, variable explorer, test explorer, and more!',
        version: '2024.0.1',
        publisher: 'Microsoft',
        category: 'Programming Languages',
        tags: ['python', 'intellisense', 'debugging', 'linting'],
        icon: '🐍',
        downloads: 50000000,
        rating: 4.5,
        reviewCount: 12000,
        lastUpdated: '2024-01-15',
        compatibility: ['1.0.0+'],
        permissions: ['file-access', 'network-access'],
        installSize: '45 MB',
        featured: true,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.vscode-typescript-next',
        name: 'typescript-next',
        displayName: 'TypeScript and JavaScript Language Features',
        description: 'Provides TypeScript and JavaScript language support for Visual Studio Code',
        version: '5.0.0',
        publisher: 'Microsoft',
        category: 'Programming Languages',
        tags: ['typescript', 'javascript', 'intellisense'],
        icon: '🔷',
        downloads: 45000000,
        rating: 4.7,
        reviewCount: 15000,
        lastUpdated: '2024-01-14',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '38 MB',
        featured: true,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.cpptools',
        name: 'cpptools',
        displayName: 'C/C++',
        description: 'C/C++ IntelliSense, debugging, and code browsing',
        version: '1.18.0',
        publisher: 'Microsoft',
        category: 'Programming Languages',
        tags: ['cpp', 'c++', 'c', 'intellisense'],
        icon: '⚙️',
        downloads: 35000000,
        rating: 4.4,
        reviewCount: 8000,
        lastUpdated: '2024-01-12',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '52 MB',
        featured: true,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.vscode-java',
        name: 'java',
        displayName: 'Extension Pack for Java',
        description: 'Popular extensions for Java development in VS Code',
        version: '0.25.0',
        publisher: 'Microsoft',
        category: 'Programming Languages',
        tags: ['java', 'spring', 'maven', 'gradle'],
        icon: '☕',
        downloads: 30000000,
        rating: 4.6,
        reviewCount: 6000,
        lastUpdated: '2024-01-10',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '68 MB',
        featured: true,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.go',
        name: 'go',
        displayName: 'Go',
        description: 'Rich Go language support for Visual Studio Code',
        version: '0.40.0',
        publisher: 'Go Team at Google',
        category: 'Programming Languages',
        tags: ['go', 'golang', 'intellisense'],
        icon: '🐹',
        downloads: 28000000,
        rating: 4.8,
        reviewCount: 4500,
        lastUpdated: '2024-01-08',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '42 MB',
        featured: true,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.vscode-json',
        name: 'json',
        displayName: 'JSON Language Features',
        description: 'Provides rich language support for JSON files',
        version: '1.0.0',
        publisher: 'Microsoft',
        category: 'Programming Languages',
        tags: ['json', 'schema', 'validation'],
        icon: '📄',
        downloads: 25000000,
        rating: 4.5,
        reviewCount: 3000,
        lastUpdated: '2024-01-05',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '15 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.vscode-html',
        name: 'html',
        displayName: 'HTML Language Features',
        description: 'Provides rich language support for HTML and Handlebar files',
        version: '1.0.0',
        publisher: 'Microsoft',
        category: 'Programming Languages',
        tags: ['html', 'handlebars', 'intellisense'],
        icon: '🌐',
        downloads: 22000000,
        rating: 4.4,
        reviewCount: 2500,
        lastUpdated: '2024-01-03',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '18 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.vscode-css',
        name: 'css',
        displayName: 'CSS Language Features',
        description: 'Provides rich language support for CSS, LESS and SCSS files',
        version: '1.0.0',
        publisher: 'Microsoft',
        category: 'Programming Languages',
        tags: ['css', 'less', 'scss', 'sass'],
        icon: '🎨',
        downloads: 20000000,
        rating: 4.3,
        reviewCount: 2000,
        lastUpdated: '2024-01-01',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '16 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.vscode-markdown',
        name: 'markdown',
        displayName: 'Markdown All in One',
        description: 'All you need to write Markdown (keyboard shortcuts, table of contents, auto preview and more)',
        version: '3.5.0',
        publisher: 'Yu Zhang',
        category: 'Programming Languages',
        tags: ['markdown', 'preview', 'toc'],
        icon: '📝',
        downloads: 18000000,
        rating: 4.7,
        reviewCount: 3500,
        lastUpdated: '2024-01-02',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '12 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.vscode-xml',
        name: 'xml',
        displayName: 'XML Tools',
        description: 'XML formatting, validation, and XPath support',
        version: '2.5.0',
        publisher: 'Josh Johnson',
        category: 'Programming Languages',
        tags: ['xml', 'xpath', 'validation'],
        icon: '📋',
        downloads: 15000000,
        rating: 4.6,
        reviewCount: 1800,
        lastUpdated: '2023-12-28',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '25 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },

      // Formatters
      {
        id: 'esbenp.prettier-vscode',
        name: 'prettier-vscode',
        displayName: 'Prettier - Code formatter',
        description: 'Code formatter using prettier',
        version: '10.1.0',
        publisher: 'Prettier',
        category: 'Formatters',
        tags: ['prettier', 'formatter', 'javascript', 'typescript'],
        icon: '✨',
        downloads: 30000000,
        rating: 4.6,
        reviews: 8000,
        lastUpdated: '2024-01-12',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '28 MB',
        featured: true,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.vscode-eslint',
        name: 'eslint',
        displayName: 'ESLint',
        description: 'Find and fix problems in your JavaScript code',
        version: '2.4.0',
        publisher: 'Microsoft',
        category: 'Linters',
        tags: ['eslint', 'javascript', 'linting'],
        icon: '🔍',
        downloads: 25000000,
        rating: 4.5,
        reviewCount: 5000,
        lastUpdated: '2024-01-10',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '22 MB',
        featured: true,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.vscode-pylint',
        name: 'pylint',
        displayName: 'Pylint',
        description: 'A Python static code analysis tool',
        version: '0.2.3',
        publisher: 'Steve',
        category: 'Linters',
        tags: ['python', 'pylint', 'linting'],
        icon: '🐍',
        downloads: 12000000,
        rating: 4.4,
        reviewCount: 1500,
        lastUpdated: '2023-12-20',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '15 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },

      // Themes
      {
        id: 'ms-vscode.Theme-TomorrowNight',
        name: 'Tomorrow Night Theme',
        displayName: 'Tomorrow Night Theme',
        description: 'Tomorrow Night Theme for VS Code',
        version: '0.1.4',
        publisher: 'Microsoft',
        category: 'Themes',
        tags: ['theme', 'dark', 'tomorrow'],
        icon: '🌙',
        downloads: 8000000,
        rating: 4.3,
        reviewCount: 1200,
        lastUpdated: '2023-12-15',
        compatibility: ['1.0.0+'],
        permissions: ['storage-access'],
        installSize: '8 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'zhuangtongfa.Material-theme',
        name: 'One Dark Pro',
        displayName: 'One Dark Pro',
        description: 'Atom\'s iconic One Dark theme for VS Code',
        version: '3.14.0',
        publisher: 'zhuangtongfa',
        category: 'Themes',
        tags: ['theme', 'dark', 'atom', 'one-dark'],
        icon: '⚫',
        downloads: 15000000,
        rating: 4.8,
        reviewCount: 3000,
        lastUpdated: '2024-01-05',
        compatibility: ['1.0.0+'],
        permissions: ['storage-access'],
        installSize: '12 MB',
        featured: true,
        verified: true,
        pricing: 'free'
      },

      // Web Development
      {
        id: 'bradlc.vscode-tailwindcss',
        name: 'vscode-tailwindcss',
        displayName: 'Tailwind CSS IntelliSense',
        description: 'Intelligent Tailwind CSS tooling for VS Code',
        version: '0.10.5',
        publisher: 'Brad Cornes',
        category: 'Web Development',
        tags: ['tailwind', 'css', 'intellisense'],
        icon: '🎨',
        downloads: 15000000,
        rating: 4.8,
        reviews: 3500,
        lastUpdated: '2024-01-10',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '18 MB',
        featured: true,
        verified: false,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.vscode-react-native',
        name: 'react-native',
        displayName: 'React Native Tools',
        description: 'Debug your React Native apps',
        version: '1.10.0',
        publisher: 'Microsoft',
        category: 'Web Development',
        tags: ['react-native', 'mobile', 'debugging'],
        icon: '📱',
        downloads: 10000000,
        rating: 4.5,
        reviewCount: 2000,
        lastUpdated: '2023-12-18',
        compatibility: ['1.0.0+'],
        permissions: ['file-access', 'network-access'],
        installSize: '35 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.vscode-angular',
        name: 'angular',
        displayName: 'Angular Language Service',
        description: 'Editor services for Angular templates',
        version: '17.0.0',
        publisher: 'Angular',
        category: 'Web Development',
        tags: ['angular', 'typescript', 'template'],
        icon: '🅰️',
        downloads: 12000000,
        rating: 4.6,
        reviewCount: 2500,
        lastUpdated: '2024-01-08',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '28 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },

      // AI Tools
      {
        id: 'github.copilot',
        name: 'copilot',
        displayName: 'GitHub Copilot',
        description: 'Your AI pair programmer',
        author: 'GitHub',
        category: 'AI Tools',
        keywords: ['ai', 'copilot', 'assistant'],
        engines: { whiterabbit: '^1.0.0' },
        contributes: {},
        activationEvents: ['*'],
        downloads: 25000000,
        rating: 4.3,
        reviews: 15000,
        featured: true,
        verified: true,
        lastUpdated: '2024-01-14',
        compatibility: ['1.0.0+'],
        permissions: ['network-access'],
        installSize: '45 MB',
        featured: true,
        verified: true,
        pricing: 'paid',
        price: 10.00
      },
      {
        id: 'ms-vscode.vscode-github-copilot',
        name: 'github-copilot',
        displayName: 'GitHub Copilot Chat',
        description: 'Chat with GitHub Copilot',
        version: '0.4.0',
        publisher: 'GitHub',
        category: 'AI Tools',
        tags: ['ai', 'copilot', 'chat', 'assistant'],
        icon: '🤖',
        downloads: 8000000,
        rating: 4.2,
        reviewCount: 1200,
        lastUpdated: '2024-01-02',
        compatibility: ['1.0.0+'],
        permissions: ['network-access'],
        installSize: '32 MB',
        featured: false,
        verified: true,
        pricing: 'paid',
        price: 10.00
      },

      // Git Tools
      {
        id: 'eamodio.gitlens',
        name: 'gitlens',
        displayName: 'GitLens — Git supercharged',
        description: 'Supercharge the Git capabilities built into Visual Studio Code',
        version: '14.0.0',
        publisher: 'Eric Amodio',
        category: 'Git Tools',
        tags: ['git', 'blame', 'history', 'compare'],
        icon: '🔍',
        downloads: 20000000,
        rating: 4.8,
        reviewCount: 4000,
        lastUpdated: '2024-01-12',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '25 MB',
        featured: true,
        verified: true,
        pricing: 'freemium'
      },
      {
        id: 'ms-vscode.vscode-git',
        name: 'git',
        displayName: 'Git',
        description: 'Git source control integration',
        version: '1.0.0',
        publisher: 'Microsoft',
        category: 'Git Tools',
        tags: ['git', 'source-control', 'scm'],
        icon: '📚',
        downloads: 18000000,
        rating: 4.4,
        reviewCount: 2200,
        lastUpdated: '2023-12-20',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '15 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },

      // Database
      {
        id: 'ms-mssql.mssql',
        name: 'mssql',
        displayName: 'SQL Server (mssql)',
        description: 'Microsoft SQL Server, Azure SQL Database and SQL Data Warehouse',
        version: '1.20.0',
        publisher: 'Microsoft',
        category: 'Database',
        tags: ['sql', 'mssql', 'database', 'azure'],
        icon: '🗄️',
        downloads: 12000000,
        rating: 4.6,
        reviewCount: 1800,
        lastUpdated: '2024-01-05',
        compatibility: ['1.0.0+'],
        permissions: ['file-access', 'network-access'],
        installSize: '38 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'cweijan.vscode-mysql-client2',
        name: 'MySQL',
        displayName: 'MySQL',
        description: 'MySQL client for Visual Studio Code',
        version: '3.0.0',
        publisher: 'cweijan',
        category: 'Database',
        tags: ['mysql', 'database', 'sql'],
        icon: '🐬',
        downloads: 8000000,
        rating: 4.5,
        reviewCount: 1200,
        lastUpdated: '2023-12-25',
        compatibility: ['1.0.0+'],
        permissions: ['file-access', 'network-access'],
        installSize: '28 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },

      // Testing
      {
        id: 'ms-vscode.vscode-jest',
        name: 'jest',
        displayName: 'Jest',
        description: 'Jest support for VS Code',
        version: '4.0.0',
        publisher: 'Orta',
        category: 'Testing',
        tags: ['jest', 'testing', 'javascript'],
        icon: '🧪',
        downloads: 10000000,
        rating: 4.7,
        reviewCount: 1500,
        lastUpdated: '2024-01-03',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '22 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.vscode-pytest',
        name: 'pytest',
        displayName: 'Python Test Explorer for Visual Studio Code',
        description: 'Test your Python code with pytest',
        version: '0.4.0',
        publisher: 'Little Fox Team',
        category: 'Testing',
        tags: ['python', 'pytest', 'testing'],
        icon: '🐍',
        downloads: 6000000,
        rating: 4.4,
        reviewCount: 800,
        lastUpdated: '2023-12-18',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '18 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },

      // Productivity
      {
        id: 'ms-vscode.vscode-extension-samples',
        name: 'extension-samples',
        displayName: 'Extension Samples',
        description: 'Sample extensions for VS Code',
        version: '1.0.0',
        publisher: 'Microsoft',
        category: 'Productivity',
        tags: ['samples', 'examples', 'learning'],
        icon: '📚',
        downloads: 5000000,
        rating: 4.2,
        reviewCount: 600,
        lastUpdated: '2023-12-10',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '12 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.vscode-json',
        name: 'json-language-features',
        displayName: 'JSON Language Features',
        description: 'Provides rich language support for JSON files',
        version: '1.0.0',
        publisher: 'Microsoft',
        category: 'Productivity',
        tags: ['json', 'schema', 'validation'],
        icon: '📄',
        downloads: 25000000,
        rating: 4.5,
        reviewCount: 3000,
        lastUpdated: '2024-01-05',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '15 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },

      // Debuggers
      {
        id: 'ms-vscode.vscode-js-debug',
        name: 'js-debug',
        displayName: 'JavaScript Debugger',
        description: 'JavaScript debugger for VS Code',
        version: '1.80.0',
        publisher: 'Microsoft',
        category: 'Debuggers',
        tags: ['javascript', 'debugger', 'node'],
        icon: '🐛',
        downloads: 20000000,
        rating: 4.6,
        reviewCount: 2800,
        lastUpdated: '2024-01-08',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '32 MB',
        featured: true,
        verified: true,
        pricing: 'free'
      },
      {
        id: 'ms-vscode.vscode-python-debugger',
        name: 'python-debugger',
        displayName: 'Python Debugger',
        description: 'Python debugger for VS Code',
        version: '1.0.0',
        publisher: 'Microsoft',
        category: 'Debuggers',
        tags: ['python', 'debugger', 'pdb'],
        icon: '🐍',
        downloads: 15000000,
        rating: 4.5,
        reviewCount: 2000,
        lastUpdated: '2024-01-05',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '28 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },

      // Snippets
      {
        id: 'ms-vscode.vscode-snippets',
        name: 'snippets',
        displayName: 'Snippets',
        description: 'Code snippets for VS Code',
        version: '1.0.0',
        publisher: 'Microsoft',
        category: 'Snippets',
        tags: ['snippets', 'code', 'templates'],
        icon: '✂️',
        downloads: 12000000,
        rating: 4.3,
        reviewCount: 1500,
        lastUpdated: '2023-12-20',
        compatibility: ['1.0.0+'],
        permissions: ['file-access'],
        installSize: '10 MB',
        featured: false,
        verified: true,
        pricing: 'free'
      },

      // Custom Extensions (keeping some of the original ones)
      {
        id: 'vercel-deploy',
        name: 'vercel-deploy',
        displayName: 'Vercel Deployment',
        description: 'Deploy your PWA projects to Vercel with one click',
        version: '1.0.0',
        publisher: 'White Rabbit Team',
        category: 'Cloud Tools',
        tags: ['deployment', 'vercel', 'hosting', 'cdn'],
        icon: '⚡',
        downloads: 15420,
        rating: 4.8,
        reviewCount: 234,
        lastUpdated: '2024-01-15',
        compatibility: ['1.0.0+'],
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
        publisher: 'White Rabbit Team',
        category: 'Git Tools',
        tags: ['github', 'version-control', 'sync', 'backup'],
        icon: '🐙',
        downloads: 12890,
        rating: 4.7,
        reviewCount: 189,
        lastUpdated: '2024-01-10',
        compatibility: ['1.0.0+'],
        permissions: ['network-access', 'file-access'],
        installSize: '38 KB',
        featured: true,
        verified: true,
        pricing: 'free'
      }
    ];
  }

  static getInstalledExtensions(): InstalledExtension[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      // Ensure it's an array
      if (!Array.isArray(parsed)) {
        console.warn('Installed extensions data is not an array, resetting to empty array');
        localStorage.removeItem(this.STORAGE_KEY);
        return [];
      }
      
      return parsed;
    } catch (error) {
      console.error('Error loading installed extensions:', error);
      localStorage.removeItem(this.STORAGE_KEY);
      return [];
    }
  }

  static getExtensionConfigs(): { [extensionId: string]: any } {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (!stored) return {};
      
      const parsed = JSON.parse(stored);
      if (typeof parsed !== 'object' || parsed === null) {
        console.warn('Extension configs data is not an object, resetting to empty object');
        localStorage.removeItem(this.CONFIG_KEY);
        return {};
      }
      
      return parsed;
    } catch (error) {
      console.error('Error loading extension configs:', error);
      localStorage.removeItem(this.CONFIG_KEY);
      return {};
    }
  }

  static installExtension(extension: MarketplaceExtension): void {
    try {
      const installed = this.getInstalledExtensions();
      
      // Ensure we have a valid array
      if (!Array.isArray(installed)) {
        console.warn('Installed extensions is not an array, resetting');
        installed = [];
      }
      
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
      
      console.log(`✅ Installed extension: ${extension.displayName}`);
    } catch (error) {
      console.error('Failed to install extension:', error);
      throw error;
    }
  }

  static uninstallExtension(extensionId: string): void {
    try {
      const installed = this.getInstalledExtensions();
      
      if (!Array.isArray(installed)) {
        console.warn('Installed extensions is not an array, resetting');
        localStorage.removeItem(this.STORAGE_KEY);
        return;
      }
      
      const filtered = installed.filter(ext => ext.id !== extensionId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

      // Remove config
      const configs = this.getExtensionConfigs();
      delete configs[extensionId];
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(configs));
      
      console.log(`🗑️ Uninstalled extension: ${extensionId}`);
    } catch (error) {
      console.error('Failed to uninstall extension:', error);
    }
  }

  static toggleExtension(extensionId: string, enabled: boolean): void {
    try {
      const installed = this.getInstalledExtensions();
      
      if (!Array.isArray(installed)) {
        console.warn('Installed extensions is not an array, resetting');
        localStorage.removeItem(this.STORAGE_KEY);
        return;
      }
      
      const extension = installed.find(ext => ext.id === extensionId);
      
      if (extension) {
        extension.enabled = enabled;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(installed));
        console.log(`${enabled ? '✅' : '❌'} ${enabled ? 'Enabled' : 'Disabled'} extension: ${extensionId}`);
      }
    } catch (error) {
      console.error('Failed to toggle extension:', error);
    }
  }

  static updateExtensionConfig(extensionId: string, config: any): void {
    try {
      const configs = this.getExtensionConfigs();
      configs[extensionId] = config;
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('Failed to update extension config:', error);
    }
  }

  static isExtensionInstalled(extensionId: string): boolean {
    try {
      const installed = this.getInstalledExtensions();
      return Array.isArray(installed) && installed.some(ext => ext.id === extensionId);
    } catch (error) {
      console.error('Error checking if extension is installed:', error);
      return false;
    }
  }

  static getExtensionConfig(extensionId: string): any {
    try {
      const configs = this.getExtensionConfigs();
      return configs[extensionId] || {};
    } catch (error) {
      console.error('Error getting extension config:', error);
      return {};
    }
  }

  static searchExtensions(query: string, category?: ExtensionCategory): MarketplaceExtension[] {
    try {
      const extensions = this.getMarketplaceExtensions();
      
      if (!Array.isArray(extensions)) {
        console.warn('Marketplace extensions is not an array');
        return [];
      }
      
      return extensions.filter(ext => {
        const matchesQuery = !query || 
          ext.displayName.toLowerCase().includes(query.toLowerCase()) ||
          ext.description.toLowerCase().includes(query.toLowerCase()) ||
          (ext.tags && Array.isArray(ext.tags) && ext.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())));
        
        const matchesCategory = !category || ext.category === category;
        
        return matchesQuery && matchesCategory;
      });
    } catch (error) {
      console.error('Error searching extensions:', error);
      return [];
    }
  }

  static getFeaturedExtensions(): MarketplaceExtension[] {
    try {
      const extensions = this.getMarketplaceExtensions();
      if (!Array.isArray(extensions)) return [];
      return extensions.filter(ext => ext.featured);
    } catch (error) {
      console.error('Error getting featured extensions:', error);
      return [];
    }
  }

  static getExtensionsByCategory(category: ExtensionCategory): MarketplaceExtension[] {
    try {
      const extensions = this.getMarketplaceExtensions();
      if (!Array.isArray(extensions)) return [];
      return extensions.filter(ext => ext.category === category);
    } catch (error) {
      console.error('Error getting extensions by category:', error);
      return [];
    }
  }

  static getTopExtensions(limit: number = 10): MarketplaceExtension[] {
    try {
      const extensions = this.getMarketplaceExtensions();
      if (!Array.isArray(extensions)) return [];
      
      // Sort by downloads and rating
      return extensions
        .sort((a, b) => {
          const scoreA = (a.downloads / 1000000) * a.rating;
          const scoreB = (b.downloads / 1000000) * b.rating;
          return scoreB - scoreA;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top extensions:', error);
      return [];
    }
  }
}

export const EXTENSION_CATEGORIES: { id: ExtensionCategory; name: string; icon: string }[] = [
  { id: 'Programming Languages', name: 'Programming Languages', icon: '🔷' },
  { id: 'Web Development', name: 'Web Development', icon: '🌐' },
  { id: 'AI Tools', name: 'AI Tools', icon: '🤖' },
  { id: 'Git Tools', name: 'Git Tools', icon: '📚' },
  { id: 'Database', name: 'Database', icon: '🗄️' },
  { id: 'Testing', name: 'Testing', icon: '🧪' },
  { id: 'Productivity', name: 'Productivity', icon: '⚡' },
  { id: 'Themes', name: 'Themes', icon: '🌈' },
  { id: 'Formatters', name: 'Formatters', icon: '✨' },
  { id: 'Linters', name: 'Linters', icon: '🔍' },
  { id: 'Debuggers', name: 'Debuggers', icon: '🐛' },
  { id: 'Snippets', name: 'Snippets', icon: '✂️' },
  { id: 'Cloud Tools', name: 'Cloud Tools', icon: '☁️' },
  { id: 'Other', name: 'Other', icon: '📦' },
];
