"use client";

import { useMockData } from "@/context/MockDataContext";
import { 
  ExportCSVButton, 
  AddRenewalButton, 
} from "@/components/dashboard/DashboardButtons";
import { RenewalPipelineDashboard } from "@/components/dashboard/RenewalPipelineDashboard";
import { RenewalPipelineItem, RenewalStats } from "@/lib/renewals";
import { useState, useEffect } from "react";

export default function DemoRenewalsPage() {
  const { policies, clients } = useMockData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="p-12 animate-pulse bg-white rounded-[32px] h-96 border border-black/5 shadow-sm"></div>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Map policies to RenewalPipelineItem
  const pipeline: RenewalPipelineItem[] = policies.map(p => {
    const client = clients.find(c => c.id === p.clientId);
    const expDate = new Date(p.expirationDate);
    const daysUntilRenewal = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      id: `renewal-${p.id}`,
      policyId: p.id,
      policyNumber: p.policyNumber,
      carrier: p.carrier,
      policyType: p.policyType,
      premium: p.premium.toLocaleString(),
      expirationDate: expDate,
      clientName: client?.name || "Unknown Insured",
      clientEmail: client?.email || null,
      clientPhone: client?.phone || null,
      status: daysUntilRenewal <= 30 ? 'urgent' : 'pending',
      daysUntilRenewal,
      notification90Sent: daysUntilRenewal < 90,
      notification60Sent: daysUntilRenewal < 60,
      notification30Sent: daysUntilRenewal < 30,
      aiReportGenerated: false,
    };
  });

  // Calculate Stats
  const stats: RenewalStats = {
    total: pipeline.length,
    days30: pipeline.filter(i => i.daysUntilRenewal <= 30 && i.daysUntilRenewal >= 0).length,
    days60: pipeline.filter(i => i.daysUntilRenewal <= 60 && i.daysUntilRenewal > 30).length,
    days90: pipeline.filter(i => i.daysUntilRenewal <= 90 && i.daysUntilRenewal > 60).length,
    overdue: pipeline.filter(i => i.daysUntilRenewal < 0).length,
    completed: 0,
    pending: pipeline.length,
  };

  const totalPremiumValue = policies.reduce((sum, p) => sum + p.premium, 0);

  // Mock handlers
  const handleSendNotification = async (renewalId: string) => {
    console.log("Mock: Sending notification for", renewalId);
    return { success: true };
  };

  const handleUpdateStatus = async (renewalId: string, status: string) => {
    console.log("Mock: Updating status for", renewalId, "to", status);
    return { success: true };
  };

  return (
    <div className="space-y-12 font-body pb-20 animate-in fade-in duration-700">
      {/* Header - Identical to Live */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Renewal Pipeline</h1>
          <p className="text-on-surface/50 font-medium mt-1">Simulated environment for retention lifecycle management.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportCSVButton data={pipeline} filename="renewals-demo.csv" />
          <AddRenewalButton />
        </div>
      </div>

      {/* Stats Summary - Identical to Live */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Total Pipeline</span>
          <h3 className="text-4xl font-bold tracking-tight text-on-surface">{stats.total}</h3>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Policies at Risk</span>
          <h3 className="text-4xl font-bold tracking-tight text-red-500">{stats.days30 + stats.overdue}</h3>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Pipeline Value</span>
          <h3 className="text-4xl font-bold tracking-tight text-on-surface">${totalPremiumValue.toLocaleString()}</h3>
        </div>
      </section>

      {/* Main Content Area - Identical to Live */}
      <section className="space-y-12">
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-8">
          <h2 className="text-xl font-bold text-on-surface mb-8">Automated Notifications</h2>
          <RenewalPipelineDashboard
            initialPipeline={pipeline}
            initialStats={stats}
            onSendNotification={handleSendNotification}
            onUpdateStatus={handleUpdateStatus}
          />
        </div>
      </section>

      {/* Demo Badge */}
      <div className="fixed bottom-8 left-8 z-50">
        <div className="px-4 py-2 bg-white/80 backdrop-blur-md border border-black/5 rounded-full shadow-xl">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Live Demo Environment</span>
        </div>
      </div>
    </div>
  );
}
