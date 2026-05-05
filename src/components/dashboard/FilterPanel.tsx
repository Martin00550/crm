'use client';

import { useState } from 'react';

interface FilterState {
  dateRange: string;
  policyType: string;
  carrier: string;
  premiumRange: string;
  renewalStatus: string;
  healthStatus: string;
}

export function FilterPanel({ isOpen, onClose, onApplyFilters }: { 
  isOpen: boolean; 
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
}) {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    policyType: 'all',
    carrier: 'all',
    premiumRange: 'all',
    renewalStatus: 'all',
    healthStatus: 'all',
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      dateRange: 'all',
      policyType: 'all',
      carrier: 'all',
      premiumRange: 'all',
      renewalStatus: 'all',
      healthStatus: 'all',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface rounded-xl shadow-xl border border-black/5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-black/5 bg-slate-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-on-surface tracking-tight">Policy Ledger Filter</h3>
            <button
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center rounded-lg text-on-surface/40 hover:text-on-surface hover:bg-black/5 transition-all"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>

        {/* Filter Options */}
        <div className="p-6 space-y-6">
          {/* Renewal Window */}
          <div>
            <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Renewal Window</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all cursor-pointer"
            >
              <option value="all">All Portfolio Timeline</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Policy Type */}
          <div>
            <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Placement Type</label>
            <select
              value={filters.policyType}
              onChange={(e) => handleFilterChange('policyType', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all cursor-pointer"
            >
              <option value="all">All Placement Types</option>
              <option value="commercial">Commercial</option>
              <option value="personal">Personal</option>
              <option value="life">Life</option>
              <option value="health">Health</option>
              <option value="auto">Auto</option>
              <option value="property">Property</option>
            </select>
          </div>

          {/* Carrier */}
          <div>
            <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Carrier Filter</label>
            <select
              value={filters.carrier}
              onChange={(e) => handleFilterChange('carrier', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all cursor-pointer"
            >
              <option value="all">All Active Carriers</option>
              <option value="chubb">Chubb</option>
              <option value="travelers">Travelers</option>
              <option value="aig">AIG</option>
              <option value="liberty">Liberty Mutual</option>
              <option value="progressive">Progressive</option>
              <option value="statefarm">State Farm</option>
            </select>
          </div>

          {/* Premium Range */}
          <div>
            <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Premium Volume Range</label>
            <select
              value={filters.premiumRange}
              onChange={(e) => handleFilterChange('premiumRange', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all cursor-pointer"
            >
              <option value="all">All Premium Volumes</option>
              <option value="0-1000">$0 - $1,000</option>
              <option value="1000-5000">$1,000 - $5,000</option>
              <option value="5000-10000">$5,000 - $10,000</option>
              <option value="10000-25000">$10,000 - $25,000</option>
              <option value="25000+">$25,000+</option>
            </select>
          </div>

          {/* Health Status */}
          <div>
            <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Portfolio Health State</label>
            <select
              value={filters.healthStatus}
              onChange={(e) => handleFilterChange('healthStatus', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all cursor-pointer"
            >
              <option value="all">All Health States</option>
              <option value="healthy">Preferred/Healthy</option>
              <option value="warning">Requires Review</option>
              <option value="at-risk">Policy Leakage Risk</option>
            </select>
          </div>

          {/* Active Filters */}
          <div className="pt-4 border-t border-black/5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Applied Parameters</h4>
              <button
                onClick={handleReset}
                className="text-[10px] font-bold text-secondary hover:text-secondary/80 uppercase tracking-widest transition-colors"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (value === 'all') return null;
                return (
                  <span
                    key={key}
                    className="px-2.5 py-0.5 bg-secondary/10 border border-secondary/10 text-secondary rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2"
                  >
                    {key.replace(/([A-Z])/g, ' $1')}: {value}
                    <button
                      onClick={() => handleFilterChange(key as keyof FilterState, 'all')}
                      className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-secondary/20 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
              {Object.values(filters).every(v => v === 'all') && (
                <p className="text-xs text-on-surface/40 font-medium">No active filter parameters</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-black/5 bg-slate-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3.5 border border-black/10 text-on-surface/60 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-black/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-6 py-3.5 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all shadow-sm"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
