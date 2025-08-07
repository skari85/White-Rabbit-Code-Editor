'use client';

/**
 * White Rabbit Code Editor - Error Tracking Provider
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 */

import React, { useEffect } from 'react';
import { errorTracker } from '@/lib/error-tracking';

interface ErrorTrackingProviderProps {
  children: React.ReactNode;
}

export function ErrorTrackingProvider({ children }: ErrorTrackingProviderProps) {
  useEffect(() => {
    // Initialize error tracking
    errorTracker.addContext('app', 'white-rabbit-code-editor');
    errorTracker.addContext('version', '4.1.3');
    
    // Set up user context if available
    const userId = localStorage.getItem('user-id');
    if (userId) {
      errorTracker.setUserId(userId);
    }

    // Add performance monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        errorTracker.addContext('performance', {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          networkLatency: navigation.responseStart - navigation.requestStart
        });
      }
    }

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      errorTracker.addContext('memory', {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      });
    }

    // Monitor page visibility changes
    const handleVisibilityChange = () => {
      errorTracker.addContext('pageVisible', !document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
}
