"use client";

import Link from "next/link";
import { ArrowLeft } from 'lucide-react';
import { WhiteLabelPortal } from '@/components/dashboard/WhiteLabelPortal';

export default function DemoBrandingPage() {
  return (
    <div className="space-y-10 font-body text-on-surface">
      <div className="flex items-center gap-5">
        <Link 
          href="/demo/settings" 
          className="w-12 h-12 flex items-center justify-center rounded-full bg-surface border border-black/5 text-on-surface/40 hover:text-primary hover:bg-slate-50 transition-all shadow-sm group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight leading-none">White-Label Portal</h1>
          <p className="text-on-surface/60 mt-2 font-medium italic">Customize your branded client portal with logo and colors (Demo)</p>
        </div>
      </div>

      <WhiteLabelPortal agencyId="demo-agency" isDemo={true} />
    </div>
  );
}
