import React from 'react';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceEvent {
  type: 'navigation' | 'resource' | 'paint' | 'largest-contentful-paint' | 'first-input-delay' | 'cumulative-layout-shift' | 'custom';
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Type definitions for Web Performance API
interface LargestContentfulPaint extends PerformanceEntry {
  size: number;
  id: string;
  url: string;
}

interface FirstInputDelay extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  target?: EventTarget;
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  sources: Array<{
    node?: Node;
    currentRect?: DOMRectReadOnly;
    previousRect?: DOMRectReadOnly;
  }>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private events: PerformanceEvent[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    this.isInitialized = true;
    this.setupObservers();
    this.trackNavigationTiming();
    this.trackResourceTiming();
    this.trackPaintTiming();
    this.trackLargestContentfulPaint();
    this.trackFirstInputDelay();
    this.trackCumulativeLayoutShift();
  }

  private setupObservers() {
    // Navigation Timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handleNavigationTiming(entry as PerformanceNavigationTiming);
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch (error) {
        console.warn('Navigation timing observer not supported:', error);
      }

      // Resource Timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handleResourceTiming(entry as PerformanceResourceTiming);
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        console.warn('Resource timing observer not supported:', error);
      }

      // Paint Timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handlePaintTiming(entry as PerformancePaintTiming);
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);
      } catch (error) {
        console.warn('Paint timing observer not supported:', error);
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handleLargestContentfulPaint(entry as LargestContentfulPaint);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handleFirstInputDelay(entry as FirstInputDelay);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handleCumulativeLayoutShift(entry as LayoutShift);
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }
    }
  }

  private handleNavigationTiming(entry: PerformanceNavigationTiming) {
    const navigationStart = entry.fetchStart || 0;
    const dnsLookup = entry.domainLookupEnd - entry.domainLookupStart;
    const tcpConnection = entry.connectEnd - entry.connectStart;
    const serverResponse = entry.responseEnd - entry.responseStart;
    const domContentLoaded = entry.domContentLoadedEventEnd - navigationStart;
    const loadComplete = entry.loadEventEnd - navigationStart;

    this.addMetric('DNS Lookup', dnsLookup, 'ms', {
      url: entry.name,
      type: 'navigation',
    });

    this.addMetric('TCP Connection', tcpConnection, 'ms', {
      url: entry.name,
      type: 'navigation',
    });

    this.addMetric('Server Response', serverResponse, 'ms', {
      url: entry.name,
      type: 'navigation',
    });

    this.addMetric('DOM Content Loaded', domContentLoaded, 'ms', {
      url: entry.name,
      type: 'navigation',
    });

    this.addMetric('Load Complete', loadComplete, 'ms', {
      url: entry.name,
      type: 'navigation',
    });
  }

  private handleResourceTiming(entry: PerformanceResourceTiming) {
    // Filter out development-only files to reduce noise
    if (entry.name.includes('webpack') || 
        entry.name.includes('hot-update') || 
        entry.name.includes('__webpack')) {
      return;
    }

    const duration = entry.duration;
    const size = entry.transferSize || 0;

    this.addMetric('Resource Load Time', duration, 'ms', {
      url: entry.name,
      size: size,
      type: entry.initiatorType,
    });

    this.addMetric('Resource Size', size, 'bytes', {
      url: entry.name,
      type: entry.initiatorType,
    });
  }

  private handlePaintTiming(entry: PerformancePaintTiming) {
    this.addMetric(entry.name === 'first-paint' ? 'First Paint' : 'First Contentful Paint', 
      entry.startTime, 'ms', {
        type: 'paint',
      });
  }

  private handleLargestContentfulPaint(entry: LargestContentfulPaint) {
    this.addMetric('Largest Contentful Paint', entry.startTime, 'ms', {
      size: entry.size,
      id: entry.id,
      url: entry.url,
    });
  }

  private handleFirstInputDelay(entry: FirstInputDelay) {
    this.addMetric('First Input Delay', entry.processingStart - entry.startTime, 'ms', {
      type: entry.name,
    });
  }

  private handleCumulativeLayoutShift(entry: LayoutShift) {
    this.addMetric('Cumulative Layout Shift', entry.value, 'score', {
      sources: entry.sources,
    });
  }

  private trackNavigationTiming() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.handleNavigationTiming(navigation);
      }
    }
  }

  private trackResourceTiming() {
    if ('performance' in window) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      resources.forEach(resource => {
        this.handleResourceTiming(resource);
      });
    }
  }

  private trackPaintTiming() {
    if ('performance' in window) {
      const paints = performance.getEntriesByType('paint') as PerformancePaintTiming[];
      paints.forEach(paint => {
        this.handlePaintTiming(paint);
      });
    }
  }

  private trackLargestContentfulPaint() {
    if ('performance' in window) {
      const lcp = performance.getEntriesByType('largest-contentful-paint')[0] as LargestContentfulPaint;
      if (lcp) {
        this.handleLargestContentfulPaint(lcp);
      }
    }
  }

  private trackFirstInputDelay() {
    if ('performance' in window) {
      const fid = performance.getEntriesByType('first-input')[0] as FirstInputDelay;
      if (fid) {
        this.handleFirstInputDelay(fid);
      }
    }
  }

  private trackCumulativeLayoutShift() {
    if ('performance' in window) {
      const cls = performance.getEntriesByType('layout-shift') as LayoutShift[];
      cls.forEach(shift => {
        this.handleCumulativeLayoutShift(shift);
      });
    }
  }

  addMetric(name: string, value: number, unit: string, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
    };
    this.metrics.push(metric);
    
    // Log in development, but filter out noisy development files
    if (process.env.NODE_ENV === 'development') {
      const shouldLog = !metadata?.url || 
        (!metadata.url.includes('webpack') && 
         !metadata.url.includes('hot-update') &&
         !metadata.url.includes('__webpack'));
      
      if (shouldLog) {
        console.log(`📊 Performance Metric: ${name} = ${value}${unit}`, metadata);
      }
    }
  }

  addEvent(type: PerformanceEvent['type'], name: string, value: number, metadata?: Record<string, any>) {
    const event: PerformanceEvent = {
      type,
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };
    this.events.push(event);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📈 Performance Event: ${type} - ${name} = ${value}`, metadata);
    }
  }

  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.addMetric(`${name} Duration`, duration, 'ms');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.addMetric(`${name} Duration (Error)`, duration, 'ms', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.addMetric(`${name} Duration`, duration, 'ms');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.addMetric(`${name} Duration (Error)`, duration, 'ms', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getEvents(): PerformanceEvent[] {
    return [...this.events];
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  getLatestMetric(name: string): PerformanceMetric | null {
    const metrics = this.getMetricsByName(name);
    return metrics.length > 0 ? metrics[metrics.length - 1] : null;
  }

  clearMetrics() {
    this.metrics = [];
    this.events = [];
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  // Web Vitals helpers
  getWebVitals() {
    const fp = this.getLatestMetric('First Paint');
    const fcp = this.getLatestMetric('First Contentful Paint');
    const lcp = this.getLatestMetric('Largest Contentful Paint');
    const fid = this.getLatestMetric('First Input Delay');
    const cls = this.getLatestMetric('Cumulative Layout Shift');

    return {
      FP: fp?.value || 0,
      FCP: fcp?.value || 0,
      LCP: lcp?.value || 0,
      FID: fid?.value || 0,
      CLS: cls?.value || 0,
    };
  }

  // Performance score calculation
  calculatePerformanceScore(): number {
    const vitals = this.getWebVitals();
    
    // Simple scoring algorithm (0-100)
    let score = 100;
    
    // LCP scoring (0-2.5s is good)
    if (vitals.LCP > 2500) score -= 20;
    else if (vitals.LCP > 4000) score -= 40;
    
    // FID scoring (0-100ms is good)
    if (vitals.FID > 100) score -= 15;
    else if (vitals.FID > 300) score -= 30;
    
    // CLS scoring (0-0.1 is good)
    if (vitals.CLS > 0.1) score -= 15;
    else if (vitals.CLS > 0.25) score -= 30;
    
    return Math.max(0, score);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Hook for React components
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<PerformanceMetric[]>([]);
  const [events, setEvents] = React.useState<PerformanceEvent[]>([]);

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
      setEvents(performanceMonitor.getEvents());
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    events,
    addMetric: performanceMonitor.addMetric.bind(performanceMonitor),
    addEvent: performanceMonitor.addEvent.bind(performanceMonitor),
    measureFunction: performanceMonitor.measureFunction.bind(performanceMonitor),
    measureAsyncFunction: performanceMonitor.measureAsyncFunction.bind(performanceMonitor),
    getWebVitals: performanceMonitor.getWebVitals.bind(performanceMonitor),
    calculatePerformanceScore: performanceMonitor.calculatePerformanceScore.bind(performanceMonitor),
  };
} 