"use client";

import { 
  ChatBubbleButton, 
  NotificationButton, 
  SettingsButton 
} from "@/components/dashboard/DashboardButtons";
import { ImportCSVButton } from "@/components/dashboard/ImportCSVButton";
import { ExportDataButton } from "@/components/dashboard/ExportCSVButton";
import { PolicyLedgerTable } from "@/components/dashboard/PolicyLedgerTable";
import { AIInsightsCard } from "@/components/dashboard/AIInsightsCard";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { KeyboardShortcuts, useKeyboardShortcuts } from "@/components/dashboard/KeyboardShortcuts";
import { NotificationDropdown } from "@/components/dashboard/NotificationDropdown";
import { NotificationSettingsModal } from "@/components/dashboard/NotificationSettingsModal";
import Link from "next/link";
import { Plus, RefreshCw, Calendar, Clock, Keyboard, Bell } from "lucide-react";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { useState, useEffect } from "react";

export function DashboardClient({ stats, ledger, agencyId }: { stats: any, ledger: any[], agencyId: string }) {
  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<any>(null);

  useEffect(() => {
    // Fetch notification settings
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/notifications/settings');
        const data = await res.json();
        if (data.success) {
          setNotificationSettings(data.settings);
        }
      } catch (error) {
        console.error('Failed to fetch notification settings:', error);
      }
    };
    fetchSettings();
  }, [agencyId]);

  return (
    <div className="space-y-8 font-body">
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface mb-2 font-headline italic tracking-tight">Agency Command Center</h1>
          <p className="text-on-surface/60 font-medium italic">Real-time portfolio intelligence and active risk monitoring</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-black/5 rounded-xl">
            <Clock className="w-3 h-3 text-on-surface/40" />
            <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Live</span>
          </div>
          <NotificationDropdown agencyId={agencyId} />
          <button
            onClick={() => setShowNotificationSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-black/5 rounded-xl hover:bg-slate-50 transition-all group"
            title="Notification Settings"
          >
            <Bell className="w-4 h-4 text-on-surface/40 group-hover:text-primary transition-colors" />
            <span className="text-xs font-black text-on-surface/60 uppercase tracking-widest group-hover:text-primary transition-colors">Alerts</span>
          </button>
          <DateRangeFilter />
          <button
            onClick={() => setShowShortcuts(true)}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-black/5 rounded-xl hover:bg-slate-50 transition-all group"
            title="Press ? for shortcuts"
          >
            <Keyboard className="w-4 h-4 text-on-surface/40 group-hover:text-primary transition-colors" />
            <span className="text-xs font-black text-on-surface/60 uppercase tracking-widest group-hover:text-primary transition-colors">Shortcuts</span>
          </button>
          <Link
            href="/dashboard/clients"
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-black/5 rounded-xl hover:bg-slate-50 transition-all group"
          >
            <Plus className="w-4 h-4 text-on-surface/40 group-hover:text-primary transition-colors" />
            <span className="text-xs font-black text-on-surface/60 uppercase tracking-widest group-hover:text-primary transition-colors">Add Client</span>
          </Link>
          <ImportCSVButton agencyId={agencyId} />
          <ExportDataButton agencyId={agencyId} dataType="all" />
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-black/5 rounded-xl hover:bg-slate-50 transition-all group">
            <RefreshCw className="w-4 h-4 text-on-surface/40 group-hover:text-primary transition-colors" />
            <span className="text-xs font-black text-on-surface/60 uppercase tracking-widest group-hover:text-primary transition-colors">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/clients" className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Total Book of Business</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-50 text-green-600 text-[9px] font-black rounded-full border border-green-100 uppercase tracking-widest">+12.5%</span>
              <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg">trending_up</span>
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">${parseFloat(stats.totalBookOfBusiness).toLocaleString()}</h3>
            <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">Bound Policies</p>
            <div className="mt-3 h-6">
              <Sparkline data={[65, 70, 68, 75, 80, 78, 85, 90, 88, 95]} color="#22c55e" />
            </div>
          </div>
        </Link>
        <Link href="/dashboard/renewals" className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-lg hover:border-red-200 transition-all cursor-pointer">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Retention Risk (30d)</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-red-50 text-red-600 text-[9px] font-black rounded-full border border-red-100 uppercase tracking-widest">-3.2%</span>
              <span className="material-symbols-outlined text-red-500 bg-red-50 p-2 rounded-lg">priority_high</span>
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">{stats.renewalsAtRisk.count}</h3>
            <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">Premium at Risk: ${parseFloat(stats.renewalsAtRisk.volume).toLocaleString()}</p>
            <div className="mt-3 h-6">
              <Sparkline data={[12, 15, 14, 18, 16, 20, 18, 22, 20, 24]} color="#ef4444" />
            </div>
          </div>
        </Link>
        <Link href="/dashboard/clients" className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] uppercase">Active Policies</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-50 text-green-600 text-[9px] font-black rounded-full border border-green-100 uppercase tracking-widest">+8.1%</span>
              <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg">description</span>
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">{stats.totalPolicies}</h3>
            <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">Policies in Force</p>
            <div className="mt-3 h-6">
              <Sparkline data={[45, 48, 50, 52, 55, 58, 60, 62, 65, 68]} color="#22c55e" />
            </div>
          </div>
        </Link>
      </section>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Table Section */}
        <section className="lg:col-span-2 space-y-6">
          <PolicyLedgerTable ledger={ledger} />
        </section>

        <aside className="space-y-6">
          <AIInsightsCard stats={stats} />
        </aside>
      </div>

      {/* Chat Bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        <ChatBubbleButton />
      </div>

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
        agencyId={agencyId}
        initialSettings={notificationSettings}
      />
    </div>
  );
}
