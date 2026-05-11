"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Link2, Loader2, Check } from "lucide-react";
import { ExportCSVButton, AddClientButton } from "./DashboardButtons";
import { ImportCSVButton } from "./ImportCSVButton";

import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  email: string | null;
  industry: string | null;
  totalPolicies: number;
  totalPremium: string;
  healthStatus: string;
}

interface ClientsTableProps {
  clients: Client[];
  agencyId: string;
  isDemo?: boolean;
}

function getHealthDot(status: string) {
  switch (status) {
    case 'healthy': return 'bg-secondary';
    case 'warning': return 'bg-amber-400';
    case 'at-risk': return 'bg-red-400';
    default: return 'bg-on-surface/10';
  }
}

export function ClientsTable({ clients, agencyId, isDemo = false }: ClientsTableProps) {
  const [clientList, setClientList] = useState(clients);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setClientList(clients);
  }, [clients]);

  const handleCopyLink = async (clientId: string) => {
    setCopyingId(clientId);
    try {
      const res = await fetch('/api/portal/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      const result = await res.json();
      if (res.ok) {
        navigator.clipboard.writeText(result.invite.portalUrl);
        setCopiedId(clientId);
        showToast('Portal link copied to clipboard');
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        showToast(result.error || 'Failed to generate link', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to generate link', 'error');
    } finally {
      setCopyingId(null);
    }
  };

  const basePath = isDemo ? "/demo" : "/dashboard";

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const totalPages = Math.ceil(clientList.length / itemsPerPage);
  
  const currentData = clientList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-black/5 shadow-sm font-body">
      <div className="px-6 md:px-8 py-6 border-b border-black/5 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h4 className="font-bold text-on-surface text-lg">Insured Portfolio</h4>
        <div className="flex flex-wrap items-center gap-2">
          <ImportCSVButton agencyId={agencyId} onImportComplete={() => window.location.reload()} />
          <ExportCSVButton data={clientList} filename="portfolio.csv" />
          <AddClientButton />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/5 bg-background/30">
              <th className="px-6 md:px-8 py-4 text-[10px] md:text-[11px] font-bold text-on-surface/30 uppercase tracking-widest">Insured Entity</th>
              <th className="hidden sm:table-cell px-6 py-4 text-[10px] md:text-[11px] font-bold text-on-surface/30 uppercase tracking-widest">Industry</th>
              <th className="px-4 md:px-6 py-4 text-center text-[10px] md:text-[11px] font-bold text-on-surface/30 uppercase tracking-widest">Policies</th>
              <th className="px-6 py-4 text-right text-[10px] md:text-[11px] font-bold text-on-surface/30 uppercase tracking-widest">Premium Volume</th>
              <th className="px-6 md:px-8 py-4 text-center text-[10px] md:text-[11px] font-bold text-on-surface/30 uppercase tracking-widest">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {currentData.map((client) => (
              <tr key={client.id} className="hover:bg-background/20 transition-colors">
                <td className="px-6 md:px-8 py-5">
                  <Link href={`${basePath}/clients/${client.id}`} className="group">
                    <span className="text-sm font-bold text-on-surface block hover:text-secondary transition-colors truncate max-w-[120px] md:max-w-none">{client.name}</span>
                    <span className="text-[10px] text-on-surface/30 font-medium truncate block max-w-[120px] md:max-w-none">{client.email}</span>
                  </Link>
                </td>
                <td className="hidden sm:table-cell px-6 py-5">
                  <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-wider">{client.industry || 'General'}</span>
                </td>
                <td className="px-4 md:px-6 py-5 text-center">
                  <span className="text-sm font-bold text-on-surface">{client.totalPolicies}</span>
                </td>
                <td className="px-6 py-5 text-right font-bold text-on-surface">
                  {client.totalPremium}
                </td>
                <td className="px-8 py-5 flex items-center justify-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${getHealthDot(client.healthStatus)}`} />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCopyLink(client.id);
                    }}
                    className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface/20 hover:text-secondary transition-colors rounded-md hover:bg-secondary/5"
                    title="Copy Portal Link"
                  >
                    {copyingId === client.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : copiedId === client.id ? (
                      <Check className="w-4 h-4 text-secondary" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-8 py-4 border-t border-black/5 flex items-center justify-between">
          <span className="text-sm font-medium text-on-surface/50">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, clientList.length)} of {clientList.length} clients
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-bold text-on-surface border border-black/5 rounded-xl hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-bold text-on-surface border border-black/5 rounded-xl hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
