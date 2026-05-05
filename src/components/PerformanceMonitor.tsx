'use client';

import { useEffect, useState } from 'react';

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const loadMetrics = async () => {
      try {
        const webVitals = await import('web-vitals');
        
        const metricsData: any = {};
        
        webVitals.onFCP((metric) => {
          metricsData.fcp = metric.value;
          setMetrics({ ...metricsData });
        });
        
        webVitals.onLCP((metric) => {
          metricsData.lcp = metric.value;
          setMetrics({ ...metricsData });
        });
        
        webVitals.onFID((metric) => {
          metricsData.fid = metric.value;
          setMetrics({ ...metricsData });
        });
        
        webVitals.onCLS((metric) => {
          metricsData.cls = metric.value;
          setMetrics({ ...metricsData });
        });
        
        webVitals.onTTFB((metric) => {
          metricsData.ttfb = metric.value;
          setMetrics({ ...metricsData });
        });
      } catch (error) {
        console.error('Failed to load web vitals:', error);
      }
    };

    loadMetrics();

    // Track page load time
    const pageLoadTime = performance.now();
    setMetrics((prev: any) => ({ ...prev, pageLoadTime }));

    // Keyboard shortcut to toggle visibility (Ctrl+Shift+P)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !isVisible || !metrics) {
    return null;
  }

  const getScoreColor = (value: number, good: number, poor: number) => {
    if (value <= good) return 'text-green-500';
    if (value <= poor) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="fixed bottom-4 left-4 bg-slate-900 text-white p-4 rounded-lg shadow-xl z-[10000] font-mono text-xs max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">Performance Metrics</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>FCP:</span>
          <span className={getScoreColor(metrics.fcp || 0, 1800, 3000)}>
            {metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>LCP:</span>
          <span className={getScoreColor(metrics.lcp || 0, 2500, 4000)}>
            {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>FID:</span>
          <span className={getScoreColor(metrics.fid || 0, 100, 300)}>
            {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>CLS:</span>
          <span className={getScoreColor(metrics.cls || 0, 0.1, 0.25)}>
            {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>TTFB:</span>
          <span className={getScoreColor(metrics.ttfb || 0, 800, 1800)}>
            {metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
          <span>Page Load:</span>
          <span>{metrics.pageLoadTime ? `${metrics.pageLoadTime.toFixed(0)}ms` : 'N/A'}</span>
        </div>
      </div>
      <div className="mt-3 text-[10px] text-slate-400">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}
