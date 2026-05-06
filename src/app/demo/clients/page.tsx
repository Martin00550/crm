"use client";

import { useMockData } from "@/context/MockDataContext";
import { 
  ChatBubbleButton, 
} from "@/components/dashboard/DashboardButtons";
import { ClientsTable } from "@/components/dashboard/ClientsTable";
import { ImportCSVButton } from "@/components/dashboard/ImportCSVButton";
import { ExportDataButton } from "@/components/dashboard/ExportCSVButton";
import { formatCurrency } from "@/lib/utils";

export default function DemoClientsPage() {
  const { clients } = useMockData();

  const totalClients = clients.length;
  const totalPremium = clients.reduce((sum, c) => sum + c.totalPremium, 0);
  const totalPolicies = clients.reduce((sum, c) => sum + (c.totalPolicies || 0), 0);

  // Map clients to the format expected by ClientsTable
  const mappedClients = clients.map(c => ({
    ...c,
    totalPremium: formatCurrency(c.totalPremium),
    industry: c.industry || 'Unknown'
  }));

  return (
    <div className="space-y-8 font-body">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Book of Business</h1>
          <p className="text-on-surface/50 font-medium mt-1">Complete view of all current placements and client health.</p>
        </div>
        <div className="flex items-center gap-3">
          <ImportCSVButton agencyId="demo-agency" />
          <ExportDataButton agencyId="demo-agency" dataType="clients" />
        </div>
      </div>

      {/* Page Content */}
      <div className="space-y-8">
        {/* Metric Ribbon */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Total Insureds</span>
              <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg">people</span>
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter text-on-surface">{totalClients}</h3>
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest mt-1">Active Accounts</p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Total Premium Volume</span>
              <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg">account_balance_wallet</span>
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter text-on-surface">{formatCurrency(totalPremium)}</h3>
              <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">Book of Business Volume</p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Active Policies</span>
              <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg">description</span>
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter text-on-surface">{totalPolicies}</h3>
              <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">Policies in Force</p>
            </div>
          </div>
        </section>

        {/* Table Section */}
        <section className="lg:col-span-8 space-y-6">
          <ClientsTable clients={mappedClients} agencyId="demo-agency" isDemo={true} />
        </section>
      </div>
      <div className="fixed bottom-6 right-6 z-50">
        <ChatBubbleButton />
      </div>
    </div>
  );
}
