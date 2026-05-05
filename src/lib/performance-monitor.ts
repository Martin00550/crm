// Performance monitoring utilities
// Tracks Core Web Vitals and custom metrics

import { logger } from '@/lib/logger';

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  pageLoadTime: number;
}

export function reportWebVitals(metric: any) {
  const { name, value, id, delta, rating } = metric;

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`[Web Vitals] ${name}`, { value, delta, rating, id });
  }

  // Send to analytics endpoint
  if (typeof window !== 'undefined' && value > 0) {
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        value: Math.round(value),
        delta: Math.round(delta),
        rating,
        id,
        url: window.location.href,
        timestamp: Date.now(),
      }),
      keepalive: true,
    }).catch((err) => {
      // Silent fail for performance monitoring
      if (process.env.NODE_ENV === 'development') {
      logger.error('Failed to report web vitals', err);
      }
    });
  }
}

export function measurePageLoadTime(): number {
  if (typeof window === 'undefined') return 0;
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigation) {
    return navigation.loadEventEnd - navigation.fetchStart;
  }
  
  // Fallback for older browsers
  return performance.now();
}

export function measureRenderTime(componentName: string) {
  const startTime = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - startTime;
      if (process.env.NODE_ENV === 'development' && duration > 16) {
      logger.warn(`[Performance] ${componentName} took ${duration.toFixed(2)}ms to render`);
      }
      return duration;
    },
  };
}

export function trackResourceTiming() {
  if (typeof window === 'undefined') return;
  
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const slowResources = resources.filter(r => r.duration > 1000);
  
  if (slowResources.length > 0 && process.env.NODE_ENV === 'development') {
    logger.warn('[Performance] Slow resources detected', {
      slowResources: slowResources.map(r => ({
        name: r.name,
        duration: `${r.duration.toFixed(2)}ms`,
        size: r.transferSize,
      }))
    });
  }
  
  return {
    totalResources: resources.length,
    slowResources: slowResources.length,
    averageDuration: resources.reduce((acc, r) => acc + r.duration, 0) / resources.length,
  };
}

// Debounced function to avoid excessive reporting
let reportTimeout: NodeJS.Timeout | null = null;
export function debouncedReport(callback: () => void, delay = 1000) {
  if (reportTimeout) clearTimeout(reportTimeout);
  reportTimeout = setTimeout(callback, delay);
}
