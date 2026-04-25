import { FileSearch, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[32px] border border-black/5 shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileSearch className="w-10 h-10 text-slate-400" />
          </div>
          
          <h1 className="text-2xl font-black text-on-surface font-headline italic tracking-tight mb-3">
            Page Not Found
          </h1>
          
          <p className="text-sm text-on-surface/60 font-medium mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-xl transition-all"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
