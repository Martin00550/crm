"use client";

import { useEffect } from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[32px] border border-black/5 shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-black text-on-surface font-headline italic tracking-tight mb-3">
            Application Error
          </h1>
          
          <p className="text-sm text-on-surface/60 font-medium mb-6">
            Something went wrong while loading the application. This has been logged.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left">
              <p className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-2">
                Error Details (Development Only)
              </p>
              <pre className="text-xs text-red-600 font-mono overflow-auto">
                {error.message}
              </pre>
              {error.digest && (
                <p className="text-xs text-on-surface/40 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-xl transition-all active:scale-[0.98]"
            >
              Try Again
            </button>
            
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-black/5 text-on-surface font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-md transition-all"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
