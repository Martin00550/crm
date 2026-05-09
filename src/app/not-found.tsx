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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-primary/30">
      <div className="max-w-md w-full">
        <div className="bg-slate-900 rounded-[32px] border border-white/5 shadow-2xl p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/10">
            <FileSearch className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-3xl font-black text-white font-headline italic tracking-tighter mb-4">
            {isPortal ? 'Gateway Error' : 'Navigation Failure'}
          </h1>
          
          <p className="text-sm text-white/40 font-medium italic leading-relaxed mb-8 px-4">
            {isPortal 
              ? "This protected resource is currently inaccessible or your authorization context has expired."
              : "The requested path could not be resolved within our current infrastructure mapping."}
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
