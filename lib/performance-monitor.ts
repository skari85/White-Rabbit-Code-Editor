// Performance monitoring system for production
export interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  bundleSize: number;
  memoryUsage: number;
  errorRate: number;
  userInteractions: number;
}

export interface PerformanceEvent {
  type: 'navigation' | 'resource' | 'paint' | 'measure' | 'error';
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private events: PerformanceEvent[] = [];
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.initialize();
  }

  private initialize() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Monitor page load performance
    this.observePageLoad();
    
    // Monitor resource loading
    this.observeResourceLoading();
    
    // Monitor paint timing
    this.observePaintTiming();
    
    // Monitor memory usage
    this.observeMemoryUsage();
    
    // Monitor user interactions
    this.observeUserInteractions();
    
    // Monitor errors
    this.observeErrors();
  }

  private observePageLoad() {
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordEvent('navigation', 'pageLoad', navEntry.loadEventEnd - navEntry.loadEventStart);
              this.recordEvent('navigation', 'domContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
              this.recordEvent('navigation', 'firstPaint', navEntry.loadEventEnd - navEntry.loadEventStart);
            }
          });
        });
        
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('Failed to observe navigation performance:', error);
      }
    }
  }

  private observeResourceLoading() {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              this.recordEvent('resource', resourceEntry.name, resourceEntry.duration, {
                size: resourceEntry.transferSize,
                type: resourceEntry.initiatorType
              });
            }
          });
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Failed to observe resource performance:', error);
      }
    }
  }

  private observePaintTiming() {
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'paint') {
              this.recordEvent('paint', entry.name, entry.startTime);
            }
          });
        });
        
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (error) {
        console.warn('Failed to observe paint performance:', error);
      }
    }
  }

  private observeMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          this.recordEvent('measure', 'memoryUsage', memory.usedJSHeapSize, {
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          });
        }
      }, 10000); // Check every 10 seconds
    }
  }

  private observeUserInteractions() {
    let interactionCount = 0;
    const interactionEvents = ['click', 'keydown', 'scroll', 'input', 'change'];
    
    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, () => {
        interactionCount++;
        this.recordEvent('measure', 'userInteractions', interactionCount);
      }, { passive: true });
    });
  }

  private observeErrors() {
    window.addEventListener('error', (event) => {
      this.recordEvent('error', 'jsError', 0, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordEvent('error', 'unhandledRejection', 0, {
        reason: event.reason
      });
    });
  }

  private recordEvent(
    type: PerformanceEvent['type'],
    name: string,
    value: number,
    metadata?: Record<string, any>
  ) {
    const event: PerformanceEvent = {
      type,
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.events.push(event);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Update metrics
    this.updateMetrics(event);
  }

  private updateMetrics(event: PerformanceEvent) {
    switch (event.type) {
      case 'navigation':
        if (event.name === 'pageLoad') {
          this.metrics.pageLoadTime = event.value;
        }
        break;
      case 'paint':
        if (event.name === 'first-contentful-paint') {
          this.metrics.timeToInteractive = event.value;
        }
        break;
      case 'measure':
        if (event.name === 'memoryUsage') {
          this.metrics.memoryUsage = event.value;
        } else if (event.name === 'userInteractions') {
          this.metrics.userInteractions = event.value;
        }
        break;
      case 'error':
        this.metrics.errorRate = (this.metrics.errorRate || 0) + 1;
        break;
    }
  }

  // Public API
  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public getEvents(): PerformanceEvent[] {
    return [...this.events];
  }

  public measure(name: string, fn: () => void | Promise<void>) {
    const start = performance.now();
    
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start;
          this.recordEvent('measure', name, duration);
        });
      } else {
        const duration = performance.now() - start;
        this.recordEvent('measure', name, duration);
        return result;
      }
    } catch (error) {
      const duration = performance.now() - start;
      this.recordEvent('measure', name, duration);
      throw error;
    }
  }

  public async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordEvent('measure', name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordEvent('measure', name, duration);
      throw error;
    }
  }

  public reportToAnalytics() {
    if (!this.isEnabled) return;

    const metrics = this.getMetrics();
    const events = this.getEvents();

    // Send to analytics service
    try {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, events })
      }).catch(() => {
        // Fallback to localStorage
        this.storeLocally({ metrics, events });
      });
    } catch (error) {
      console.warn('Failed to report performance data:', error);
      this.storeLocally({ metrics, events });
    }
  }

  private storeLocally(data: any) {
    try {
      const key = `performance-data-${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(data));
      
      // Keep only last 10 performance reports
      const existingKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('performance-data-'))
        .sort()
        .slice(-9);
      
      existingKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to store performance data locally:', error);
    }
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.events = [];
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// Export convenience functions
export const measure = (name: string, fn: () => void | Promise<void>) => 
  performanceMonitor.measure(name, fn);

export const measureAsync = <T>(name: string, fn: () => Promise<T>): Promise<T> => 
  performanceMonitor.measureAsync(name, fn);

export const getPerformanceMetrics = () => performanceMonitor.getMetrics();
export const reportPerformance = () => performanceMonitor.reportToAnalytics();
