"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExportCSVButton, AddClientButton } from "./DashboardButtons";
import { ImportCSVButton } from "./ImportCSVButton";

interface Client {
  id: string;
  name: string;
  email: string;
  industry: string;
  totalPolicies: number;
  totalPremium: string;
  healthStatus: string;
}

interface ClientsTableProps {
  clients: Client[];
  agencyId: string;
  isDemo?: boolean;
}

function getHealthStatusBadge(status: string) {
  const styles: Record<string, string> = {
    healthy: "bg-secondary/5 text-secondary border-secondary/10",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    "at-risk": "bg-red-50 text-red-700 border-red-100",
  };
  const dots: Record<string, string> = {
    healthy: "bg-green-500",
    warning: "bg-amber-500",
    "at-risk": "bg-red-500",
  };
  const labels: Record<string, string> = {
    healthy: "Healthy",
    warning: "Warning",
    "at-risk": "At Risk",
  };
  return { styles: styles[status] || styles.healthy, dots: dots[status] || dots.healthy, label: labels[status] || labels.healthy };
}

export function ClientsTable({ clients, agencyId, isDemo = false }: ClientsTableProps) {
  const [clientList, setClientList] = useState(clients);

  useEffect(() => {
    setClientList(clients);
  }, [clients]);

  const basePath = isDemo ? "/demo" : "/dashboard";

  const refreshClients = async () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  return (
    <div className="bg-surface rounded-[32px] overflow-hidden border border-black/5 shadow-sm font-body">
      <div className="px-6 py-5 border-b border-black/5 flex justify-between items-center bg-slate-50/50">
        <h4 className="font-black text-on-surface italic font-headline tracking-tight">Book of Business</h4>
        <div className="flex gap-2">
          <ImportCSVButton agencyId={agencyId} onImportComplete={refreshClients} />
          <ExportCSVButton data={clientList} filename="insured-portfolio.csv" />
          <AddClientButton />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/5 bg-slate-50/50">
              <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Insured Entity</th>
              <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Industry Sector</th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Placements</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Total Premium Volume</th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Portfolio Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {clientList.map((client) => {
              const badge = getHealthStatusBadge(client.healthStatus);
              return (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5">
                    <Link href={`${basePath}/clients/${client.id}`} className="flex flex-col group-hover:text-secondary transition-colors">
                      <span className="text-sm font-bold text-on-surface font-headline italic tracking-tight">{client.name}</span>
                      <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-0.5">{client.email}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-slate-100/50 border border-black/5 rounded-full text-[10px] font-black text-on-surface/60 uppercase tracking-widest">{client.industry || 'General Sector'}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm font-bold text-on-surface">{client.totalPolicies}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-lg font-black text-on-surface tracking-tighter font-headline italic">{client.totalPremium}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${badge.styles}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dots}`}></span>
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
