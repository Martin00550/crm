"use client";

import Link from "next/link";
import { ArrowLeft } from 'lucide-react';
import { TeamManagement } from '@/components/dashboard/TeamManagement';

export default function DemoTeamPage() {
  return (
    <div className="space-y-10 font-body text-on-surface">
      <div className="flex items-center gap-5">
        <Link 
          href="/demo/settings" 
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-black/5 text-on-surface/40 hover:text-secondary hover:shadow-md transition-all shadow-sm group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight leading-none">Team Members</h1>
          <p className="text-on-surface/60 mt-2 font-medium italic">Manage authorized producer and service personnel accounts (Demo)</p>
        </div>
      </div>

      <TeamManagement agencyId="demo-agency" tier="growth" isDemo={true} />

      {/* Pricing Info */}
      <div className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-secondary/10 transition-colors"></div>
        <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-6">Personnel Deployment Protocols</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-background rounded-2xl p-6 border border-black/5 group/card hover:bg-white hover:shadow-md transition-all">
            <p className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest mb-2">Solo Authority</p>
            <p className="font-headline italic font-black text-xl text-on-surface tracking-tight">Single Agent</p>
            <p className="text-xs text-on-surface/40 font-medium mt-2">1 authorized user only</p>
          </div>
          <div className="bg-secondary/5 rounded-2xl p-6 border border-secondary/10 group/card hover:bg-white hover:shadow-md transition-all shadow-sm">
            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2">Expansion Command</p>
            <p className="font-headline italic font-black text-xl text-secondary tracking-tight">Growth Agency</p>
            <p className="text-xs text-secondary/60 font-medium mt-2">Up to 3 personnel included</p>
          </div>
          <div className="bg-black text-white rounded-2xl p-6 border border-black/5 group/card hover:shadow-xl transition-all">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Enterprise Grid</p>
            <p className="font-headline italic font-black text-xl text-white tracking-tight">$99 / Personnel</p>
            <p className="text-xs text-white/40 font-medium mt-2">Unlimited scaling authority</p>
            <p className="text-[8px] font-black text-secondary uppercase tracking-widest mt-1">Admin/CSR Free Credits</p>
          </div>
        </div>
      </div>
    </div>
  );
}
