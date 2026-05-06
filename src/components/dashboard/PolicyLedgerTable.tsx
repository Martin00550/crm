"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ExportCSVButton, FilterViewButton } from "./DashboardButtons";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download, Trash2, FileText } from "lucide-react";
import { exportPolicyLedgerToPDF } from "@/lib/pdf-export";
import { policies } from "@/db/schema/policies";
import { InferSelectModel } from "drizzle-orm";
import { useVirtualizer } from "@tanstack/react-virtual";
import { formatCurrency } from "@/lib/utils";

type Policy = InferSelectModel<typeof policies> & { id: string; clientName?: string; clientIndustry?: string; daysUntilRenewal: number; clientId?: string; insuredId?: string; carrier: string; policyType: string; premium: string | number; expirationDate: string };

function getDaysColor(days: number) {
  if (days <= 30) return 'text-red-500';
  if (days <= 60) return 'text-amber-500';
  return 'text-secondary';
}

export function PolicyLedgerTable({ ledger, isDemo = false, currency = 'USD' }: { ledger: Policy[], isDemo?: boolean, currency?: string }) {
  const [filteredLedger, setFilteredLedger] = useState(ledger);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredLedger.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Average row height
    overscan: 10,
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredLedger].sort((a, b) => {
      let aValue = a[key as keyof Policy];
      let bValue = b[key as keyof Policy];
      if (key === 'premium') {
        aValue = typeof a.premium === 'string' ? parseFloat(a.premium.replace(/[^0-9.-]+/g, "")) : a.premium;
        bValue = typeof b.premium === 'string' ? parseFloat(b.premium.replace(/[^0-9.-]+/g, "")) : b.premium;
      }
      if (aValue! < bValue!) return direction === 'asc' ? -1 : 1;
      if (aValue! > bValue!) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredLedger(sorted as Policy[]);
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-secondary" /> : <ArrowDown className="w-3 h-3 text-secondary" />;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredLedger(ledger);
      return;
    }
    const searchLower = query.toLowerCase();
    const result = ledger.filter((p: Policy) => 
      (p.clientName?.toLowerCase().includes(searchLower)) ||
      (p.carrier?.toLowerCase().includes(searchLower)) ||
      (p.policyType?.toLowerCase().includes(searchLower))
    );
    setFilteredLedger(result);
  };

  const handleSelectPolicy = (id: string) => {
    const newSelected = new Set(selectedPolicies);
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    setSelectedPolicies(newSelected);
    setSelectAll(newSelected.size === filteredLedger.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPolicies(new Set());
    } else {
      setSelectedPolicies(new Set(filteredLedger.map(p => p.id)));
    }
    setSelectAll(!selectAll);
  };

  return (
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden font-body flex flex-col h-[600px] md:h-[700px]">
      <div className="px-4 md:px-8 py-4 md:py-6 border-b border-black/5 flex flex-col lg:flex-row justify-between items-center gap-6 shrink-0">
        <div className="flex-1 max-w-md w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/20" />
          <input
            type="text"
            placeholder="Search all policies..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm border border-black/5 rounded-xl bg-background/50 focus:outline-none focus:ring-1 focus:ring-secondary/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          {selectedPolicies.size > 0 && (
            <div className="flex gap-2 mr-4 border-r border-black/5 pr-4 shrink-0">
              <button className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface/40 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              <button className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface/40 hover:text-secondary transition-colors"><Download className="w-4 h-4" /></button>
            </div>
          )}
          <button onClick={() => exportPolicyLedgerToPDF(filteredLedger, 'ledger')} className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface/40 hover:text-secondary transition-colors shrink-0"><FileText className="w-4 h-4" /></button>
          <ExportCSVButton data={filteredLedger} filename="ledger.csv" />
          <FilterViewButton onFilter={() => {}} />
        </div>
      </div>

      <div className="flex-1 overflow-auto relative" ref={parentRef}>
        <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-black/5 bg-slate-50/90 backdrop-blur-sm">
              <th className="pl-8 py-4 w-16">
                <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="w-4 h-4 rounded border-black/10 text-secondary focus:ring-secondary/20" />
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-on-surface/30 uppercase tracking-widest cursor-pointer group w-[28%]" onClick={() => handleSort('clientName')}>
                <div className="flex items-center gap-2">Insured {getSortIcon('clientName')}</div>
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-on-surface/30 uppercase tracking-widest cursor-pointer group w-[18%]" onClick={() => handleSort('carrier')}>
                <div className="flex items-center gap-2">Carrier {getSortIcon('carrier')}</div>
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-on-surface/30 uppercase tracking-widest w-[20%]">Type</th>
              <th className="px-6 py-4 text-[11px] font-bold text-on-surface/30 uppercase tracking-widest text-right w-[15%]" onClick={() => handleSort('premium')}>
                <div className="flex items-center justify-end gap-2">Premium {getSortIcon('premium')}</div>
              </th>
              <th className="px-8 py-4 text-[11px] font-bold text-on-surface/30 uppercase tracking-widest text-right w-[15%]">Expiration</th>
            </tr>
          </thead>
          <tbody className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const policy = filteredLedger[virtualItem.index];
              const clientId = policy.clientId || policy.insuredId;
              const clientPath = isDemo ? `/demo/clients/${clientId}` : `/dashboard/clients/${clientId}`;
              
              return (
                <tr 
                  key={policy.id} 
                  className="hover:bg-background/20 transition-all absolute top-0 left-0 w-full border-b border-black/5"
                  style={{ height: `${virtualItem.size}px`, transform: `translateY(${virtualItem.start}px)` }}
                >
                  <td className="pl-8 py-4 w-16">
                    <input type="checkbox" checked={selectedPolicies.has(policy.id)} onChange={() => handleSelectPolicy(policy.id)} className="w-4 h-4 rounded border-black/10 text-secondary focus:ring-secondary/20" />
                  </td>
                  <td className="px-6 py-4 overflow-hidden truncate w-[28%]">
                    <Link href={clientPath} className="font-bold text-on-surface text-sm hover:text-secondary transition-colors block truncate">{policy.clientName}</Link>
                    <p className="text-[10px] text-on-surface/30 font-medium truncate">{policy.clientIndustry || "General"}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface/60 font-medium truncate w-[18%]">{policy.carrier}</td>
                  <td className="px-6 py-4 w-[20%]">
                    <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-wider bg-background/50 px-2 py-1 rounded-md border border-black/5 truncate inline-block">{policy.policyType}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-sm text-on-surface w-[15%]">
                    {formatCurrency(policy.premium, currency)}
                  </td>
                  <td className="px-8 py-4 text-right w-[15%]">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-on-surface/60">{policy.expirationDate}</span>
                      <span className={`text-[10px] font-bold ${getDaysColor(policy.daysUntilRenewal)}`}>{policy.daysUntilRenewal} days</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="px-8 py-4 border-t border-black/5 flex items-center justify-between shrink-0 bg-slate-50/50">
        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">
          Showing {filteredLedger.length} Records • High Density Virtual Stream Active
        </span>
      </div>
    </div>
  );
}
