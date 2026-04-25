"use client";

import { useState } from "react";
import Link from "next/link";
import { ExportCSVButton, FilterViewButton } from "./DashboardButtons";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Check, Trash2, Download, Edit, FileText } from "lucide-react";
import { exportPolicyLedgerToPDF } from "@/lib/pdf-export";

function getDaysColor(days: number) {
  if (days <= 30) return 'text-red-600';
  if (days <= 60) return 'text-amber-600';
  return 'text-emerald-600';
}

function getDaysBgColor(days: number) {
  if (days <= 30) return 'bg-red-100';
  if (days <= 60) return 'bg-amber-100';
  return 'bg-emerald-100';
}

function getHealthColor(status: string) {
  switch (status) {
    case 'healthy': return 'bg-emerald-500';
    case 'warning': return 'bg-amber-500';
    case 'at-risk': return 'bg-red-500';
    default: return 'bg-slate-400';
  }
}

export function PolicyLedgerTable({ ledger, isDemo = false }: { ledger: any[], isDemo?: boolean }) {
  const [filteredLedger, setFilteredLedger] = useState(ledger);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredLedger].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Handle premium string conversion
      if (key === 'premium') {
        aValue = typeof a.premium === 'string' ? parseFloat(a.premium.replace(/[^0-9.-]+/g, "")) : a.premium;
        bValue = typeof b.premium === 'string' ? parseFloat(b.premium.replace(/[^0-9.-]+/g, "")) : b.premium;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredLedger(sorted);
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="w-3 h-3 text-on-surface/20" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-primary" />
      : <ArrowDown className="w-3 h-3 text-primary" />;
  };

  const handleFilter = (filters: any) => {
    let result = [...ledger];

    if (filters.carrier !== 'all') {
      result = result.filter(p => p.carrier.toLowerCase().includes(filters.carrier.toLowerCase()));
    }
    
    if (filters.policyType !== 'all') {
      result = result.filter(p => {
        // Map common filter types to policyType values in mock data
        const typeNormalized = p.policyType.toLowerCase();
        if (filters.policyType === 'commercial') return typeNormalized.includes('commercial') || typeNormalized.includes('business') || typeNormalized.includes('liability');
        if (filters.policyType === 'auto') return typeNormalized.includes('auto') || typeNormalized.includes('fleet');
        if (filters.policyType === 'property') return typeNormalized.includes('property') || typeNormalized.includes('real estate');
        if (filters.policyType === 'personal') return typeNormalized.includes('home') || typeNormalized.includes('personal');
        return typeNormalized.includes(filters.policyType.toLowerCase());
      });
    }

    if (filters.healthStatus !== 'all') {
      result = result.filter(p => p.healthStatus === filters.healthStatus);
    }

    if (filters.premiumRange !== 'all') {
      result = result.filter(p => {
        const premiumValue = typeof p.premium === 'string' ? parseFloat(p.premium.replace(/[^0-9.-]+/g,"")) : p.premium;
        switch(filters.premiumRange) {
          case '0-1000': return premiumValue >= 0 && premiumValue <= 1000;
          case '1000-5000': return premiumValue > 1000 && premiumValue <= 5000;
          case '5000-10000': return premiumValue > 5000 && premiumValue <= 10000;
          case '10000-25000': return premiumValue > 10000 && premiumValue <= 25000;
          case '25000+': return premiumValue > 25000;
          default: return true;
        }
      });
    }

    if (filters.dateRange !== 'all') {
      result = result.filter(p => {
        switch(filters.dateRange) {
          case 'today': return p.daysUntilRenewal === 0;
          case 'week': return p.daysUntilRenewal <= 7;
          case 'month': return p.daysUntilRenewal <= 30;
          case 'quarter': return p.daysUntilRenewal <= 90;
          case 'year': return p.daysUntilRenewal <= 365;
          default: return true;
        }
      });
    }

    setFilteredLedger(result);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredLedger(ledger);
      return;
    }

    const searchLower = query.toLowerCase();
    const result = ledger.filter((policy: any) => {
      return (
        (policy.clientName && policy.clientName.toLowerCase().includes(searchLower)) ||
        (policy.carrier && policy.carrier.toLowerCase().includes(searchLower)) ||
        (policy.policyType && policy.policyType.toLowerCase().includes(searchLower)) ||
        (policy.policyNumber && policy.policyNumber.toLowerCase().includes(searchLower)) ||
        (policy.expirationDate && policy.expirationDate.toLowerCase().includes(searchLower))
      );
    });

    setFilteredLedger(result);
  };

  const handleSelectPolicy = (policyId: string) => {
    const newSelected = new Set(selectedPolicies);
    if (newSelected.has(policyId)) {
      newSelected.delete(policyId);
    } else {
      newSelected.add(policyId);
    }
    setSelectedPolicies(newSelected);
    setSelectAll(newSelected.size === filteredLedger.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPolicies(new Set());
    } else {
      setSelectedPolicies(new Set(filteredLedger.map((p: any) => p.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkExport = () => {
    const selectedData = filteredLedger.filter((p: any) => selectedPolicies.has(p.id));
    ExportCSVButton({ data: selectedData, filename: 'selected-policies.csv' });
  };

  const handlePDFExport = () => {
    exportPolicyLedgerToPDF(filteredLedger, 'policy-ledger');
  };

  const handleBulkDelete = () => {
    if (selectedPolicies.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedPolicies.size} policies?`)) {
      // Implement bulk delete logic
      console.log('Deleting policies:', Array.from(selectedPolicies));
      setSelectedPolicies(new Set());
      setSelectAll(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl overflow-hidden border border-black/5 shadow-sm font-body">
      <div className="px-6 py-4 border-b border-black/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
        <div className="flex-1 w-full">
          <h4 className="font-bold text-on-surface tracking-tight mb-2">Command Center Policy Ledger</h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/40" />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-black/10 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {selectedPolicies.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleBulkExport}
                className="px-4 py-2 bg-secondary text-white text-xs font-black uppercase tracking-widest rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export ({selectedPolicies.size})
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedPolicies.size})
              </button>
            </div>
          )}
          <button
            onClick={handlePDFExport}
            className="px-4 py-2 bg-surface border border-black/5 text-xs font-black uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <ExportCSVButton data={filteredLedger} filename="policy-ledger.csv" />
          <FilterViewButton onFilter={handleFilter} />
        </div>
      </div>
      <div className="overflow-x-auto">
        {filteredLedger.length === 0 ? (
          <div className="p-12 text-center text-on-surface/40 font-medium">No policies match the selected filters.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5 bg-slate-50">
                <th className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-black/20 text-primary focus:ring-primary"
                  />
                </th>
                <th 
                  className="px-6 py-4 text-[9px] font-bold text-on-surface/40 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                  onClick={() => handleSort('clientName')}
                >
                  Insured Entity
                  {getSortIcon('clientName')}
                </th>
                <th 
                  className="px-6 py-4 text-[9px] font-bold text-on-surface/40 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                  onClick={() => handleSort('carrier')}
                >
                  Carrier
                  {getSortIcon('carrier')}
                </th>
                <th 
                  className="px-6 py-4 text-[9px] font-bold text-on-surface/40 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                  onClick={() => handleSort('policyType')}
                >
                  Placement Type
                  {getSortIcon('policyType')}
                </th>
                <th 
                  className="px-6 py-4 text-[9px] font-bold text-on-surface/40 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                  onClick={() => handleSort('premium')}
                >
                  Premium Volume
                  {getSortIcon('premium')}
                </th>
                <th 
                  className="px-6 py-4 text-[9px] font-bold text-on-surface/40 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                  onClick={() => handleSort('daysUntilRenewal')}
                >
                  Maturity Date
                  {getSortIcon('daysUntilRenewal')}
                </th>
                <th className="px-6 py-4 text-[9px] font-bold text-on-surface/40 uppercase tracking-widest text-center">Protocol Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredLedger.map((policy: any) => {
                const clientId = policy.clientId || policy.insuredId;
                const clientPath = isDemo ? `/demo/clients/${clientId}` : `/dashboard/clients/${clientId}`;
                const policyPath = isDemo ? `/demo/policy/${policy.id}` : `/dashboard/policy/${policy.id}`;
                const isSelected = selectedPolicies.has(policy.id);
                
                return (
                  <tr key={policy.id} className={`hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-primary/5' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectPolicy(policy.id)}
                        className="w-4 h-4 rounded border-black/20 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <span className="material-symbols-outlined text-sm">apartment</span>
                        </div>
                        <div>
                          <Link href={clientPath} className="font-bold text-on-surface tracking-tight hover:text-primary transition-colors block">
                            {policy.clientName}
                          </Link>
                          <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mt-0.5">{policy.clientIndustry || "General Sector"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-on-surface/60 font-medium text-sm">
                        <span className="material-symbols-outlined text-xs">shield</span>
                        {policy.carrier}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-on-surface/60">{policy.policyType}</td>
                    <td className="px-6 py-4">
                      <Link href={policyPath} className="text-base font-bold text-on-surface tracking-tight hover:text-primary transition-colors">
                        {typeof policy.premium === 'number' ? `$${policy.premium.toLocaleString()}` : policy.premium}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-on-surface/60">{policy.expirationDate}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDaysBgColor(policy.daysUntilRenewal)} ${getDaysColor(policy.daysUntilRenewal)}`}>
                          {policy.daysUntilRenewal}d
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className={`w-2 h-2 rounded-full border border-white ${getHealthColor(policy.healthStatus)}`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
