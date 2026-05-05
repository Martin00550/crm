import Link from 'next/link';
import { Search } from 'lucide-react';

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-slate-50 rounded-[24px] flex items-center justify-center mb-6 border border-black/5">
        <Search className="w-10 h-10 text-on-surface/20" />
      </div>
      <h2 className="text-3xl font-black text-on-surface tracking-tight mb-4">Page Not Found</h2>
      <p className="text-sm font-medium text-on-surface/60 max-w-md mb-8 italic">
        The dashboard view or record you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-full font-black text-xs uppercase tracking-[0.2em] hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
      >
        Return to Command Center
      </Link>
    </div>
  );
}
