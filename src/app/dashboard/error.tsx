'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-red-50 rounded-[24px] flex items-center justify-center mb-6 shadow-inner border border-red-100">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-3xl font-black text-on-surface tracking-tight mb-4">Dashboard Error</h2>
      <p className="text-sm font-medium text-on-surface/60 max-w-md mb-8 italic">
        An unexpected error occurred while loading this dashboard component. Our systems have logged the issue.
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-black text-xs uppercase tracking-[0.2em] hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
      >
        <RefreshCw className="w-4 h-4" />
        Retry Loading
      </button>
    </div>
  );
}
