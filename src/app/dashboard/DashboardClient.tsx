"use client";

import { 
  AddClientButton
} from "@/components/dashboard/DashboardButtons";
import { ImportCSVButton } from "@/components/dashboard/ImportCSVButton";
import { ExportDataButton } from "@/components/dashboard/ExportCSVButton";
import { KeyboardShortcuts, useKeyboardShortcuts } from "@/components/dashboard/KeyboardShortcuts";
import { Plus, RefreshCw, Bell, Sparkles, Upload, ArrowRight } from "lucide-react";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { useState, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getNotificationSettings } from "@/actions/agency";
import { formatCurrency } from "@/lib/utils";
import { ImportCSVModal } from "@/components/modals/ImportCSVModal";

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
  aiReportUsageCount: number;
}

export function DashboardClient({ 
  stats, 
  ledger, 
  agencyId, 
  currency = 'USD',
  isReadOnly = false 
}: { 
  stats: DashboardStats, 
  ledger: any[], 
  agencyId: string, 
  currency?: string,
  isReadOnly?: boolean 
}) {
  const router = useRouter();
  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const showNudge1 = stats.totalPolicies === 0;
  const showNudge2 = stats.totalPolicies > 0 && stats.renewalsAtRisk.count > 0 && stats.aiReportUsageCount === 0;

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
    <div className="space-y-12 font-body pb-20 relative">
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      
      {/* Read Only Banner */}
      {isReadOnly && (
        <div className="sticky top-4 z-[100] w-full bg-secondary text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border-2 border-white/20 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white">lock_clock</span>
            </div>
            <div>
              <p className="font-black text-xs uppercase tracking-widest italic">Trial Period Ended</p>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider mt-0.5">Your 14-day trial ended. Upgrade to reactivate AI reports and exports.</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/checkout')}
            className="px-6 py-2.5 bg-white text-secondary font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg shadow-black/10"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Command Center</h1>
          <p className="text-on-surface/50 font-medium mt-1">Track your policies, renewals, and client health.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {!isReadOnly && <AddClientButton />}
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
                <ImportCSVButton agencyId={agencyId} disabled={isReadOnly} />
              </div>
              <div className="px-4 py-1">
                <ExportDataButton agencyId={agencyId} dataType="all" disabled={isReadOnly} />
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

      {/* Stats Grid - Hidden if empty account */}
      {!showNudge1 && (
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
      )}

      {/* Nudge 1: Empty State Activation */}
      {showNudge1 && (
        <div className="bg-primary/5 border border-primary/10 rounded-[32px] p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-on-surface mb-2 tracking-tight">Welcome to your Command Center</h4>
              <p className="text-on-surface/60 max-w-xl font-medium leading-relaxed">
                Import your existing policies via CSV to activate your retention risk analysis and begin monitoring your portfolio health.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="px-8 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-3 relative z-10 shrink-0"
          >
            Import Book of Business
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Nudge 2: AI Feature Activation */}
      {showNudge2 && (
        <div className="bg-secondary/5 border border-secondary/10 rounded-[32px] p-8 flex items-start gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/5 rounded-full blur-2xl -mr-24 -mt-24 pointer-events-none group-hover:bg-secondary/10 transition-colors" />
          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-secondary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-on-surface uppercase tracking-widest mb-2 italic">Intelligence Alert</h4>
            <p className="text-sm text-on-surface/70 font-medium leading-relaxed max-w-2xl">
              You have <span className="font-bold text-red-500">{stats.renewalsAtRisk.count} policies</span> flagged for rate increases. 
              Generate an <span className="text-secondary font-bold">AI Report</span> to see the professional explanation we've drafted for your clients.
            </p>
          </div>
          <button 
            onClick={() => {
              const prompt = `Analyze my ${stats.renewalsAtRisk.count} at-risk policies and draft outreach recommendations for the highest premium volume items.`;
              window.dispatchEvent(new CustomEvent('open-chat', { detail: { prompt } }));
            }}
            className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] border-b-2 border-secondary/20 hover:border-secondary transition-all pb-0.5 shrink-0 mt-6"
          >
            Launch AI Engine
          </button>
        </div>
      )}

      {/* Intelligence Section */}
      {!showNudge1 && (
        <section className="w-full">
          <Suspense fallback={<div className="h-32 bg-white rounded-3xl animate-pulse border border-black/5" />}>
            <AIInsightsCard stats={stats} isReadOnly={isReadOnly} />
          </Suspense>
        </section>
      )}

      {/* Main Ledger Section - Hidden if empty account */}
      {!showNudge1 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-on-surface">Portfolio Ledger</h2>
          </div>
          <Suspense fallback={<div className="p-12 text-center text-on-surface/20 font-bold uppercase tracking-widest text-xs">Loading Ledger...</div>}>
            <PolicyLedgerTable ledger={ledger} currency={currency} isReadOnly={isReadOnly} />
          </Suspense>
        </section>
      )}


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

      {/* Import Modal */}
      <ImportCSVModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        agencyId={agencyId}
        onImportComplete={() => router.refresh()}
      />
    </div>
  );
}
