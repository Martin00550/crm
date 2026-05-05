"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import Link from "next/link";
import { useMockData } from "@/context/MockDataContext";
import { Plus, RefreshCw, Bell, ArrowRight } from "lucide-react";
import { ChatBubbleButton } from "@/components/dashboard/DashboardButtons";

// Lazy load shared components to match Dashboard structure
const PolicyLedgerTable = lazy(() => import("@/components/dashboard/PolicyLedgerTable").then(m => ({ default: m.PolicyLedgerTable })));
const AIInsightsCard = lazy(() => import("@/components/dashboard/AIInsightsCard").then(m => ({ default: m.AIInsightsCard })));

export default function DemoPage() {
  const [mounted, setMounted] = useState(false);
  const data = useMockData();
  
  // Safe extraction
  const clients = data?.clients || [];
  const policies = data?.policies || [];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-12 font-body pb-20 animate-pulse">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div className="h-20 w-1/3 bg-slate-100 rounded-2xl" />
          <div className="h-12 w-1/4 bg-slate-100 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="h-40 bg-slate-50 rounded-3xl" />
          <div className="h-40 bg-slate-50 rounded-3xl" />
          <div className="h-40 bg-slate-50 rounded-3xl" />
        </div>
        <div className="h-32 bg-slate-50 rounded-3xl" />
        <div className="h-96 bg-slate-50 rounded-3xl" />
      </div>
    );
  }

  // Calculate stats from mock data
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

  // Transform mock data for PolicyLedgerTable
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
      expirationDate: p.expirationDate instanceof Date ? p.expirationDate.toLocaleDateString() : String(p.expirationDate),
      daysUntilRenewal: Math.ceil((new Date(p.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      healthStatus: renewalsAtRisk.some(r => r.id === p.id) ? 'at-risk' : 'healthy',
    };
  });

  const stats = {
    totalPolicies: policies.length,
    totalBookOfBusiness: String(totalBook),
    renewalsAtRisk: {
      count: renewalsAtRisk.length,
      volume: String(riskVolume),
    },
  };

  return (
    <div className="space-y-12 font-body pb-20 animate-in fade-in duration-700">
      {/* Header - Identical to Live Dashboard */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Command Center</h1>
          <p className="text-on-surface/50 font-medium mt-1">Simulated environment for portfolio intelligence demonstration.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Main CTA for Demo Users */}
          <Link 
            href="/pricing" 
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl hover:scale-[1.02] transition-all shadow-lg shadow-black/10 group"
          >
            <span className="text-xs font-bold uppercase tracking-widest">Start Free Trial</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <div className="relative group">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-black/5 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              <span className="text-[11px] font-bold text-on-surface/40 uppercase tracking-widest">Actions</span>
              <Plus className="w-4 h-4 text-on-surface/20" />
            </button>
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-black/5 rounded-2xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2">
              <div className="px-4 py-2 flex items-center gap-3 text-on-surface/40 cursor-not-allowed">
                <RefreshCw className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Sync Book</span>
              </div>
              <div className="px-4 py-2 flex items-center gap-3 text-on-surface/40 cursor-not-allowed">
                <Plus className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Import CSV</span>
              </div>
            </div>
          </div>
          
          <button className="flex items-center justify-center w-11 h-11 bg-white border border-black/5 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <Bell className="w-5 h-5 text-on-surface/20" />
          </button>
        </div>
      </div>

      {/* Stats Grid - Identical to Live Dashboard */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 group hover:border-secondary/20 transition-all">
          <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] block mb-2">Total Premium</span>
          <h3 className="text-4xl font-bold tracking-tight text-on-surface">${totalBook.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 group hover:border-red-100 transition-all">
          <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] block mb-2">Leakage Risk</span>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-bold tracking-tight text-red-500">{renewalsAtRisk.length}</h3>
            <span className="text-[10px] font-bold text-red-400 mb-1 uppercase tracking-wider">Policies</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 group hover:border-secondary/20 transition-all">
          <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] block mb-2">Bound Policies</span>
          <h3 className="text-4xl font-bold tracking-tight text-on-surface">{policies.length}</h3>
        </div>
      </section>

      {/* Intelligence Section - Identical to Live Dashboard */}
      <section className="w-full">
        <Suspense fallback={<div className="h-32 bg-white rounded-3xl animate-pulse border border-black/5" />}>
          <AIInsightsCard stats={stats} />
        </Suspense>
      </section>

      {/* Main Ledger Section - Identical to Live Dashboard */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-on-surface">Portfolio Ledger</h2>
        </div>
        <Suspense fallback={<div className="p-12 text-center text-on-surface/20 font-bold uppercase tracking-widest text-xs">Loading Ledger...</div>}>
          <PolicyLedgerTable ledger={ledger as any} isDemo={true} />
        </Suspense>
      </section>

      {/* Chat Bubble */}
      <div className="fixed bottom-8 right-8 z-50">
        <ChatBubbleButton />
      </div>

      {/* Demo Badge */}
      <div className="fixed bottom-8 left-8 z-50">
        <div className="px-4 py-2 bg-white/80 backdrop-blur-md border border-black/5 rounded-full shadow-xl">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Live Demo Environment</span>
        </div>
      </div>
    </div>
  );
}
