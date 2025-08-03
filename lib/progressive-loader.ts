interface LoadableFeature {
  id: string;
  name: string;
  loader: () => Promise<any>;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];
  loaded: boolean;
  loading: boolean;
  error: Error | null;
}

interface LoaderOptions {
  maxConcurrent?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class ProgressiveLoader {
  private features: Map<string, LoadableFeature> = new Map();
  private loadQueue: string[] = [];
  private loading: Set<string> = new Set();
  private options: Required<LoaderOptions>;
  private listeners: Map<string, Set<(feature: LoadableFeature) => void>> = new Map();

  constructor(options: LoaderOptions = {}) {
    this.options = {
      maxConcurrent: 3,
      retryAttempts: 2,
      retryDelay: 1000,
      ...options
    };
  }

  // Register a feature for progressive loading
  registerFeature(feature: Omit<LoadableFeature, 'loaded' | 'loading' | 'error'>): void {
    this.features.set(feature.id, {
      ...feature,
      loaded: false,
      loading: false,
      error: null
    });
  }

  // Load a specific feature
  async loadFeature(featureId: string): Promise<any> {
    const feature = this.features.get(featureId);
    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }

    if (feature.loaded) {
      return feature;
    }

    if (feature.loading) {
      return this.waitForFeature(featureId);
    }

    return this.performLoad(featureId);
  }

  // Load features by priority
  async loadByPriority(priority: LoadableFeature['priority']): Promise<void> {
    const features = Array.from(this.features.values())
      .filter(f => f.priority === priority && !f.loaded && !f.loading);

    const loadPromises = features.map(f => this.loadFeature(f.id));
    await Promise.allSettled(loadPromises);
  }

  // Load all features
  async loadAll(): Promise<void> {
    // Load high priority first
    await this.loadByPriority('high');
    
    // Then medium priority
    await this.loadByPriority('medium');
    
    // Finally low priority
    await this.loadByPriority('low');
  }

  // Check if feature is loaded
  isLoaded(featureId: string): boolean {
    const feature = this.features.get(featureId);
    return feature?.loaded || false;
  }

  // Check if feature is loading
  isLoading(featureId: string): boolean {
    const feature = this.features.get(featureId);
    return feature?.loading || false;
  }

  // Get feature status
  getFeatureStatus(featureId: string): LoadableFeature | null {
    return this.features.get(featureId) || null;
  }

  // Get all features status
  getAllFeatures(): LoadableFeature[] {
    return Array.from(this.features.values());
  }

  // Listen for feature load events
  onFeatureLoad(featureId: string, callback: (feature: LoadableFeature) => void): () => void {
    if (!this.listeners.has(featureId)) {
      this.listeners.set(featureId, new Set());
    }
    
    this.listeners.get(featureId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(featureId)?.delete(callback);
    };
  }

  // Preload features based on usage patterns
  async preloadByUsage(usageData: Record<string, number>): Promise<void> {
    const sortedFeatures = Array.from(this.features.values())
      .filter(f => !f.loaded)
      .sort((a, b) => (usageData[b.id] || 0) - (usageData[a.id] || 0))
      .slice(0, 5); // Preload top 5 most used features

    const loadPromises = sortedFeatures.map(f => this.loadFeature(f.id));
    await Promise.allSettled(loadPromises);
  }

  private async performLoad(featureId: string): Promise<any> {
    const feature = this.features.get(featureId)!;
    
    // Check dependencies first
    if (feature.dependencies) {
      for (const depId of feature.dependencies) {
        if (!this.isLoaded(depId)) {
          await this.loadFeature(depId);
        }
      }
    }

    feature.loading = true;
    this.loading.add(featureId);

    try {
      const result = await this.loadWithRetry(feature);
      feature.loaded = true;
      feature.error = null;
      
      this.notifyListeners(featureId, feature);
      return result;
    } catch (error) {
      feature.error = error as Error;
      throw error;
    } finally {
      feature.loading = false;
      this.loading.delete(featureId);
    }
  }

  private async loadWithRetry(feature: LoadableFeature): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.options.retryAttempts; attempt++) {
      try {
        return await feature.loader();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.options.retryAttempts) {
          await this.delay(this.options.retryDelay * (attempt + 1));
        }
      }
    }
    
    throw lastError;
  }

  private async waitForFeature(featureId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const feature = this.features.get(featureId)!;
        
        if (feature.loaded) {
          resolve(feature);
        } else if (feature.error) {
          reject(feature.error);
        } else if (feature.loading) {
          setTimeout(checkStatus, 100);
        }
      };
      
      checkStatus();
    });
  }

  private notifyListeners(featureId: string, feature: LoadableFeature): void {
    const listeners = this.listeners.get(featureId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(feature);
        } catch (error) {
          console.error('Error in feature load listener:', error);
        }
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default progressive loader instance
export const progressiveLoader = new ProgressiveLoader();

// Register common editor features
progressiveLoader.registerFeature({
  id: 'monaco-editor',
  name: 'Monaco Editor',
  loader: () => import('@monaco-editor/react'),
  priority: 'high'
});

progressiveLoader.registerFeature({
  id: 'syntax-highlighter',
  name: 'Syntax Highlighter',
  loader: () => import('react-syntax-highlighter'),
  priority: 'medium'
});

progressiveLoader.registerFeature({
  id: 'file-system-access',
  name: 'File System Access API',
  loader: async () => {
    if ('showOpenFilePicker' in window) {
      return window;
    }
    throw new Error('File System Access API not supported');
  },
  priority: 'low'
});

progressiveLoader.registerFeature({
  id: 'web-workers',
  name: 'Web Workers',
  loader: async () => {
    if (typeof Worker !== 'undefined') {
      return Worker;
    }
    throw new Error('Web Workers not supported');
  },
  priority: 'medium'
});

progressiveLoader.registerFeature({
  id: 'ai-features',
  name: 'AI Features',
  loader: () => import('@/lib/ai-service'),
  priority: 'medium',
  dependencies: ['monaco-editor']
});

// Auto-load high priority features
if (typeof window !== 'undefined') {
  // Load high priority features after a short delay
  setTimeout(() => {
    progressiveLoader.loadByPriority('high').catch(console.error);
  }, 1000);
}
