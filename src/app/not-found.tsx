import { FileSearch, Home, Globe } from 'lucide-react';
import Link from 'next/link';
import { headers } from 'next/headers';

export default async function NotFound() {
  const host = (await headers()).get('host') || '';
  const isLocalhost = host.includes('localhost');
  const parts = host.split('.');
  
  let subdomain = '';
  if (isLocalhost) {
    if (parts.length > 1 && !parts[0].includes('localhost')) {
      subdomain = parts[0];
    }
  } else {
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  }

  const isPortal = subdomain && !['www', 'app', 'api', 'dashboard'].includes(subdomain.toLowerCase());

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[32px] border border-black/5 shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileSearch className="w-10 h-10 text-slate-400" />
          </div>
          
          <h1 className="text-2xl font-black text-on-surface font-headline italic tracking-tight mb-3">
            {isPortal ? 'Gateway Error' : 'Page Not Found'}
          </h1>
          
          <p className="text-sm text-on-surface/60 font-medium mb-6">
            {isPortal 
              ? "This portal section doesn't exist or you don't have authorization to view it."
              : "The page you're looking for doesn't exist or has been moved."}
          </p>

          <Link
            href={isPortal ? '/' : '/dashboard'}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-xl transition-all w-full"
          >
            {isPortal ? (
              <>
                <Globe className="w-4 h-4" />
                Return to Portal
              </>
            ) : (
              <>
                <Home className="w-4 h-4" />
                Return to Dashboard
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
