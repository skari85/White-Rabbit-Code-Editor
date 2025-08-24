import { FileContent } from '@/hooks/use-code-builder';

export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  author: string;
  authorAvatar?: string;
  version: string;
  downloads: number;
  rating: number;
  reviewCount: number;
  price: number; // 0 for free
  featured: boolean;
  preview: {
    images: string[];
    demoUrl?: string;
    videoUrl?: string;
  };
  files: FileContent[];
  dependencies: string[];
  framework: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: Date;
  createdAt: Date;
  license: string;
  documentation?: string;
  changelog?: ChangelogEntry[];
}

export interface ChangelogEntry {
  version: string;
  date: Date;
  changes: string[];
}

export interface MarketplaceComponent {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
  tags: string[];
  author: string;
  code: string;
  props: ComponentProp[];
  examples: ComponentExample[];
  framework: string;
  dependencies: string[];
  rating: number;
  downloads: number;
  price: number;
  preview: {
    image?: string;
    codePreview: string;
  };
  lastUpdated: Date;
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description: string;
}

export interface ComponentExample {
  title: string;
  code: string;
  description: string;
}

export interface MarketplacePlugin {
  id: string;
  name: string;
  description: string;
  category: PluginCategory;
  author: string;
  version: string;
  code: string;
  configuration: PluginConfig[];
  permissions: string[];
  rating: number;
  downloads: number;
  price: number;
  lastUpdated: Date;
}

export interface PluginConfig {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  label: string;
  description: string;
  default?: any;
  options?: string[];
  required: boolean;
}

export type TemplateCategory = 
  | 'landing-page'
  | 'portfolio'
  | 'blog'
  | 'e-commerce'
  | 'dashboard'
  | 'documentation'
  | 'app'
  | 'game'
  | 'utility'
  | 'other';

export type ComponentCategory =
  | 'ui'
  | 'form'
  | 'navigation'
  | 'layout'
  | 'data-display'
  | 'feedback'
  | 'animation'
  | 'chart'
  | 'media'
  | 'other';

export type PluginCategory =
  | 'editor'
  | 'deployment'
  | 'analytics'
  | 'seo'
  | 'performance'
  | 'security'
  | 'testing'
  | 'utility'
  | 'integration'
  | 'other';

export interface SearchFilters {
  category?: string;
  framework?: string;
  difficulty?: string;
  price?: 'free' | 'paid' | 'all';
  rating?: number;
  tags?: string[];
  author?: string;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export class TemplateMarketplace {
  private templates: MarketplaceTemplate[] = [];
  private components: MarketplaceComponent[] = [];
  private plugins: MarketplacePlugin[] = [];
  private userFavorites: Set<string> = new Set();
  private userPurchases: Set<string> = new Set();

  constructor() {
    this.initializeMarketplace();
  }

  private initializeMarketplace(): void {
    // Initialize with empty templates - will be loaded from API in production
    this.templates = [];
    this.components = [];

    // Load templates from API or local storage
    this.loadTemplatesFromAPI();
  }

  private async loadTemplatesFromAPI(): Promise<void> {
    try {
      // In production, this would load from your API
      // For now, we'll use a minimal set of starter templates
      this.templates = [];
      this.components = [];
      this.plugins = [];

      // Load from localStorage if available
      const savedTemplates = localStorage.getItem('wr-custom-templates');
      if (savedTemplates) {
        try {
          this.templates = JSON.parse(savedTemplates);
        } catch (error) {
          // Handle parsing error
        }
      }
    } catch (error) {
      // Handle API error - fallback to empty state
      this.templates = [];
      this.components = [];
      this.plugins = [];
    }
  }

  // Search templates
  searchTemplates(query: string, filters: SearchFilters = {}, page = 1, pageSize = 12): SearchResult<MarketplaceTemplate> {
    let filtered = this.templates;

    // Apply text search
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    if (filters.framework) {
      filtered = filtered.filter(t => t.framework.toLowerCase() === filters.framework.toLowerCase());
    }
    if (filters.difficulty) {
      filtered = filtered.filter(t => t.difficulty === filters.difficulty);
    }
    if (filters.price) {
      if (filters.price === 'free') {
        filtered = filtered.filter(t => t.price === 0);
      } else if (filters.price === 'paid') {
        filtered = filtered.filter(t => t.price > 0);
      }
    }
    if (filters.rating) {
      filtered = filtered.filter(t => t.rating >= filters.rating!);
    }
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(t =>
        filters.tags!.some(tag => t.tags.includes(tag))
      );
    }
    if (filters.author) {
      filtered = filtered.filter(t => t.author.toLowerCase().includes(filters.author!.toLowerCase()));
    }

    // Sort by featured, then by rating, then by downloads
    filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.downloads - a.downloads;
    });

    // Paginate
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = filtered.slice(startIndex, endIndex);

    return {
      items,
      total: filtered.length,
      page,
      pageSize,
      hasMore: endIndex < filtered.length
    };
  }

  // Search components
  searchComponents(query: string, filters: SearchFilters = {}, page = 1, pageSize = 12): SearchResult<MarketplaceComponent> {
    let filtered = this.components;

    // Apply search and filters (similar to templates)
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(component =>
        component.name.toLowerCase().includes(searchTerm) ||
        component.description.toLowerCase().includes(searchTerm) ||
        component.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(c => c.category === filters.category);
    }
    if (filters.framework) {
      filtered = filtered.filter(c => c.framework.toLowerCase() === filters.framework.toLowerCase());
    }
    if (filters.price) {
      if (filters.price === 'free') {
        filtered = filtered.filter(c => c.price === 0);
      } else if (filters.price === 'paid') {
        filtered = filtered.filter(c => c.price > 0);
      }
    }

    // Sort by rating and downloads
    filtered.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.downloads - a.downloads;
    });

    // Paginate
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = filtered.slice(startIndex, endIndex);

    return {
      items,
      total: filtered.length,
      page,
      pageSize,
      hasMore: endIndex < filtered.length
    };
  }

  // Get template by ID
  getTemplate(id: string): MarketplaceTemplate | null {
    return this.templates.find(t => t.id === id) || null;
  }

  // Get component by ID
  getComponent(id: string): MarketplaceComponent | null {
    return this.components.find(c => c.id === id) || null;
  }

  // Get plugin by ID
  getPlugin(id: string): MarketplacePlugin | null {
    return this.plugins.find(p => p.id === id) || null;
  }

  // Get featured templates
  getFeaturedTemplates(limit = 6): MarketplaceTemplate[] {
    return this.templates
      .filter(t => t.featured)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  // Get popular templates
  getPopularTemplates(limit = 6): MarketplaceTemplate[] {
    return this.templates
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  // Get categories
  getTemplateCategories(): Array<{ id: TemplateCategory; name: string; count: number }> {
    const categories: Record<TemplateCategory, number> = {} as any;
    
    this.templates.forEach(template => {
      categories[template.category] = (categories[template.category] || 0) + 1;
    });

    return Object.entries(categories).map(([id, count]) => ({
      id: id as TemplateCategory,
      name: this.formatCategoryName(id),
      count
    }));
  }

  // Add to favorites
  addToFavorites(itemId: string): void {
    this.userFavorites.add(itemId);
  }

  // Remove from favorites
  removeFromFavorites(itemId: string): void {
    this.userFavorites.delete(itemId);
  }

  // Check if item is favorited
  isFavorited(itemId: string): boolean {
    return this.userFavorites.has(itemId);
  }

  // Purchase item
  purchaseItem(itemId: string): boolean {
    // Simulate purchase process
    this.userPurchases.add(itemId);
    return true;
  }

  // Check if item is purchased
  isPurchased(itemId: string): boolean {
    return this.userPurchases.has(itemId);
  }

  // Helper methods
  private generateSampleFiles(type: string): FileContent[] {
    const baseFiles: FileContent[] = [
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${type.charAt(0).toUpperCase() + type.slice(1)} Template</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>`
      },
      {
        name: 'package.json',
        content: JSON.stringify({
          name: `${type}-template`,
          version: '1.0.0',
          dependencies: {
            react: '^18.0.0',
            'react-dom': '^18.0.0'
          }
        }, null, 2)
      }
    ];

    return baseFiles;
  }

  private generateSampleComponentCode(type: string): string {
    return `import React from 'react';

const ${type.charAt(0).toUpperCase() + type.slice(1)}Component = (props) => {
  return (
    <div className="${type}-component">
      {/* Component implementation */}
    </div>
  );
};

export default ${type.charAt(0).toUpperCase() + type.slice(1)}Component;`;
  }

  private generateSamplePluginCode(type: string): string {
    return `// ${type.charAt(0).toUpperCase() + type.slice(1)} Plugin
export default class ${type.charAt(0).toUpperCase() + type.slice(1)}Plugin {
  constructor(config) {
    this.config = config;
  }

  activate() {
    // Plugin activation logic
  }

  deactivate() {
    // Plugin deactivation logic
  }
}`;
  }

  private formatCategoryName(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
