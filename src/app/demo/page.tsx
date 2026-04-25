"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useMockData } from "@/context/MockDataContext";
import { PolicyLedgerTable } from "@/components/dashboard/PolicyLedgerTable";
import { AIInsightsCard } from "@/components/dashboard/AIInsightsCard";
import { ChatBubbleButton } from "@/components/dashboard/DashboardButtons";

export default function DemoPage() {
  const [mounted, setMounted] = useState(false);
  const data = useMockData();
  
  // Safe extraction
  const clients = data?.clients || [];
  const policies = data?.policies || [];

  useEffect(() => {
    setMounted(true);
    console.log("Demo Page Mounted", { clientCount: clients.length, policyCount: policies.length });
  }, [clients.length, policies.length]);

  if (!mounted) {
    return (
      <div className="space-y-8 font-body animate-in fade-in duration-500">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-10 w-64 bg-slate-200 animate-pulse rounded-lg" />
            <div className="h-4 w-96 bg-slate-100 animate-pulse rounded-lg" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-slate-200 animate-pulse rounded-full" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
          <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
          <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
        </section>

        {/* Main Layout Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <section className="lg:col-span-2">
            <div className="h-[400px] bg-slate-50 animate-pulse rounded-xl border border-black/5" />
          </section>

          <aside>
            <div className="h-[300px] bg-primary/20 animate-pulse rounded-[32px]" />
          </aside>
        </div>
      </div>
    );
  }

  // Safety first: calculate stats with complete null-checks
  const totalBook = policies.reduce((s, p) => s + (Number(p?.premium) || 0), 0);
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(now.getDate() + 30);
  
  const renewalsAtRisk = policies.filter(p => {
    if (!p?.expirationDate) return false;
    const d = new Date(p.expirationDate);
    return d >= now && d <= thirtyDays;
  });
  
  const riskVolume = renewalsAtRisk.reduce((s, p) => s + (Number(p?.premium) || 0), 0);

  // Transform mock data to match dashboard structure
  const ledger = policies.map(p => {
    const client = clients.find(c => c.id === p.clientId);
    return {
      id: p.id,
      clientId: p.clientId,
      clientName: client?.name || "Unknown Client",
      clientIndustry: client?.industry || "General Sector",
      carrier: p.carrier,
      policyType: p.policyType,
      premium: p.premium,
      expirationDate: p.expirationDate instanceof Date ? p.expirationDate.toLocaleDateString() : p.expirationDate,
      daysUntilRenewal: Math.ceil((new Date(p.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      healthStatus: renewalsAtRisk.some(r => r.id === p.id) ? 'at-risk' : 'healthy',
    };
  });

  const stats = {
    totalPolicies: policies.length,
    totalBookOfBusiness: totalBook,
    renewalsAtRisk: {
      count: renewalsAtRisk.length,
      volume: String(riskVolume),
    },
  };

  return (
    <div className="space-y-8 font-body animate-in fade-in slide-in-from-bottom-2 duration-1000">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface mb-2 font-headline italic tracking-tight">Agency Command Center</h1>
          <p className="text-on-surface/60 font-medium italic">High-fidelity simulated environment for policy portfolio management</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 bg-black text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">upload</span>
            Import CSV
          </button>
          <button className="px-5 py-2.5 bg-surface text-on-surface border border-black/5 rounded-full font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Total Book of Business</span>
            <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg">trending_up</span>
          </div>
          <div>
            <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">${totalBook.toLocaleString()}</h3>
            <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">Net Premium Volume</p>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Retention Risk (30d)</span>
            <span className="material-symbols-outlined text-red-500 bg-red-50 p-2 rounded-lg">priority_high</span>
          </div>
          <div>
            <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">{renewalsAtRisk.length}</h3>
            <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">Exposure: ${riskVolume.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Active Policies</span>
            <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg">description</span>
          </div>
          <div>
            <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">{policies.length}</h3>
            <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">Policies in Force</p>
          </div>
        </div>
      </section>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Table Section */}
        <section className="lg:col-span-2 space-y-6">
          <PolicyLedgerTable ledger={ledger} isDemo={true} />
        </section>

        <aside className="space-y-6">
          <AIInsightsCard stats={stats} />
          
          <div className="p-8 bg-surface rounded-[40px] border border-black/5 shadow-sm space-y-4">
            <h5 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Demo Operational Status</h5>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black text-on-surface/70 uppercase tracking-widest">Mock Intelligence: Active</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black text-on-surface/70 uppercase tracking-widest">Sandbox Persistence: Session-Only</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Chat Bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        <ChatBubbleButton />
      </div>
    </div>
  );
}

