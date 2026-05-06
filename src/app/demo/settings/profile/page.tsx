"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2 } from 'lucide-react';
import { AgencyProfileForm } from '@/components/dashboard/AgencyProfileForm';
import { PasswordChangeForm } from '@/components/dashboard/PasswordChangeForm';

export default function DemoAgencyProfilePage() {
  const mockAgency = {
    id: 'demo-agency',
    name: "Demo Agency Group",
    subdomain: "demo-agency",
    subscriptionTier: "growth",
    currency: "USD",
    branding: {
      phone: "(555) 123-4567",
      email: "demo@retainvault.tech",
      address: "77 High St, London, UK",
      businessHours: "Mon-Fri 9am-5pm",
      description: "Premier independent agency serving high-ticket clients with AI-driven renewal intelligence.",
    },
  };

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
          <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight leading-none">Agency Profile</h1>
          <p className="text-on-surface/60 mt-2 font-medium italic">Configure your official agency deployment and regional settings (Demo)</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AgencyProfileForm agency={mockAgency as any} isDemo={true} />
          <PasswordChangeForm />
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-secondary/10 transition-colors"></div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/10">
                <Building2 className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Agency Status</h3>
            </div>
            <div className="space-y-5 relative z-10">
              <div className="flex flex-col gap-1 border-b border-black/5 pb-3">
                <span className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">Official Entity</span>
                <span className="text-sm font-bold text-on-surface italic font-headline">{mockAgency.name}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">Subscription Tier</span>
                <div>
                  <span className="inline-block px-3 py-1 text-[10px] font-black bg-secondary/10 text-secondary border border-secondary/10 rounded-full uppercase tracking-widest">
                    Growth plan
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
