"use client";

import { 
  AddClientButton
} from "@/components/dashboard/DashboardButtons";
import { ImportCSVButton } from "@/components/dashboard/ImportCSVButton";
import { ExportDataButton } from "@/components/dashboard/ExportCSVButton";
import { KeyboardShortcuts, useKeyboardShortcuts } from "@/components/dashboard/KeyboardShortcuts";
import { Plus, RefreshCw, Bell } from "lucide-react";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { useState, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getNotificationSettings } from "@/actions/agency";
import { formatCurrency } from "@/lib/utils";

// Lazy load heavy components
const PolicyLedgerTable = lazy(() => import("@/components/dashboard/PolicyLedgerTable").then(m => ({ default: m.PolicyLedgerTable })));
const AIInsightsCard = lazy(() => import("@/components/dashboard/AIInsightsCard").then(m => ({ default: m.AIInsightsCard })));
const NotificationSettingsModal = lazy(() => import("@/components/dashboard/NotificationSettingsModal").then(m => ({ default: m.NotificationSettingsModal })));

interface DashboardStats {
  totalBookOfBusiness: string;
  renewalsAtRisk: {
    count: number;
    volume: string;
  };
  totalPolicies: number;
}

export function DashboardClient({ stats, ledger, agencyId, currency = 'USD' }: { stats: DashboardStats, ledger: any[], agencyId: string, currency?: string }) {
  const router = useRouter();
  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getNotificationSettings(agencyId);
        setNotificationSettings(settings);
      } catch (error) {
        console.error('Failed to fetch notification settings:', error);
      }
    };
    fetchSettings();
  }, [agencyId]);

  return (
    <div className="space-y-12 font-body pb-20">
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Command Center</h1>
          <p className="text-on-surface/50 font-medium mt-1">Track your policies, renewals, and client health.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <AddClientButton />
          <div className="relative group">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-black/5 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              <span className="text-[11px] font-bold text-on-surface/40 uppercase tracking-widest">Actions</span>
              <Plus className="w-4 h-4 text-on-surface/20" />
            </button>
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-black/5 rounded-2xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2">
              <button onClick={() => router.refresh()} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors text-left">
                <RefreshCw className="w-4 h-4 text-on-surface/40" />
                <span className="text-[10px] font-bold text-on-surface/60 uppercase tracking-widest">Refresh Data</span>
              </button>
              <div className="px-4 py-1">
                <ImportCSVButton agencyId={agencyId} />
              </div>
              <div className="px-4 py-1">
                <ExportDataButton agencyId={agencyId} dataType="all" />
              </div>
            </div>
          </div>
          <DateRangeFilter />
          <button
            onClick={() => setShowNotificationSettings(true)}
            className="flex items-center justify-center w-11 h-11 bg-white border border-black/5 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Bell className="w-5 h-5 text-on-surface/20" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 group hover:border-secondary/20 transition-all">
          <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] block mb-2">Book of Business</span>
          <h3 className="text-4xl font-bold tracking-tight text-on-surface">{formatCurrency(stats.totalBookOfBusiness, currency)}</h3>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 group hover:border-red-100 transition-all">
          <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] block mb-2">Leakage Risk</span>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-bold tracking-tight text-red-500">{stats.renewalsAtRisk.count}</h3>
            <span className="text-[10px] font-bold text-red-400 mb-1 uppercase tracking-wider">Policies</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 group hover:border-secondary/20 transition-all">
          <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] block mb-2">Active Policies</span>
          <h3 className="text-4xl font-bold tracking-tight text-on-surface">{stats.totalPolicies}</h3>
        </div>
      </section>

      {/* Intelligence Section */}
      <section className="w-full">
        <Suspense fallback={<div className="h-32 bg-white rounded-3xl animate-pulse border border-black/5" />}>
          <AIInsightsCard stats={stats} />
        </Suspense>
      </section>

      {/* Main Ledger Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-on-surface">Portfolio Ledger</h2>
        </div>
        <Suspense fallback={<div className="p-12 text-center text-on-surface/20 font-bold uppercase tracking-widest text-xs">Loading Ledger...</div>}>
          <PolicyLedgerTable ledger={ledger} currency={currency} />
        </Suspense>
      </section>


      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <Suspense fallback={null}>
          <NotificationSettingsModal
            isOpen={showNotificationSettings}
            onClose={() => setShowNotificationSettings(false)}
            agencyId={agencyId}
            initialSettings={notificationSettings}
          />
        </Suspense>
      )}
    </div>
  );
}
