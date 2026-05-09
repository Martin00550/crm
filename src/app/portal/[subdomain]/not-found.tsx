import Link from 'next/link';

export default function PortalNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center px-4">
        <span className="material-symbols-outlined text-8xl text-slate-300 mb-6">domain_disabled</span>
        <h1 className="text-4xl font-black text-slate-900 mb-4">Portal Not Found</h1>
        <p className="text-lg text-slate-600 mb-8 max-w-md">
          This agency portal doesn't exist or hasn't been set up yet. 
          Please check the URL or contact the agency directly.
        </p>
        <div className="flex justify-center">
          <Link
            href="https://retainvault.com"
            className="px-10 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-2xl transition-all text-center"
          >
            Go to RetainVault
          </Link>
        </div>
      </div>
    </div>
  );
}
