"use client";

import { useMockData } from "@/context/MockDataContext";
import { 
  ExportCSVButton, 
  AddRenewalButton, 
} from "@/components/dashboard/DashboardButtons";
import { RenewalPipelineDashboard } from "@/components/dashboard/RenewalPipelineDashboard";
import { RenewalPipelineItem, RenewalStats } from "@/lib/renewals";

export default function DemoRenewalsPage() {
  const { policies, clients } = useMockData();

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
      status: p.healthStatus === 'at-risk' ? 'urgent' : 'pending',
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
    <div className="space-y-8 font-body">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight">Renewal Pipeline</h1>
            <div className="hidden sm:flex items-center gap-2 bg-secondary/5 px-3 py-1 rounded-full border border-secondary/10">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Live Status</span>
            </div>
          </div>
          <p className="text-on-surface/60 font-medium italic">Manage your 90-day retention cycle.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportCSVButton data={pipeline} filename="renewals-registry.csv" />
          <AddRenewalButton />
        </div>
      </div>

      {/* Renewal Pipeline Dashboard */}
      <RenewalPipelineDashboard
        initialPipeline={pipeline}
        initialStats={stats}
        onSendNotification={handleSendNotification}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Page Content */}
      <div className="space-y-8">
        {/* Stats Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Total Renewal Pipeline</span>
              <span className="material-symbols-outlined text-secondary bg-blue-50 p-2 rounded-lg">autorenew</span>
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">{stats.total}</h3>
              <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">Placements in Cycle</p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Policy Leakage Risk (30d)</span>
              <span className="material-symbols-outlined text-red-500 bg-red-50 p-2 rounded-lg">warning</span>
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">{stats.days30}</h3>
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">priority_high</span>
                Requires Attention
              </p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Premium at Risk</span>
              <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg">account_balance_wallet</span>
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">${totalPremiumValue.toLocaleString()}</h3>
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                Total Renewal Value
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
