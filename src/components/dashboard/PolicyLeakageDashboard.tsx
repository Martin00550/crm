'use client';

import { useState } from 'react';
import Link from 'next/link';

import { 
  AlertOctagon, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Shield 
} from 'lucide-react';

interface RiskPolicy {
  id: string;
  policyNumber: string;
  carrier: string;
  policyType: string;
  premium: string;
  clientName: string;
  clientEmail: string | null;
  clientIndustry: string | null;
  daysUntilRenewal: number;
  premiumChange: string;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  riskFactors: string[];
  potentialLoss: number;
}

interface RiskSummary {
  totalPolicies: number;
  criticalRisk: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  totalPotentialLoss: number;
  avgRiskScore: number;
}

interface Props {
  policies: RiskPolicy[];
  summary: RiskSummary;
}

export function PolicyLeakageDashboard({ policies, summary }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const filteredPolicies = selectedLevel === 'all' 
    ? policies 
    : policies.filter(p => p.riskLevel === selectedLevel);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      case 'low': return 'bg-secondary text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-red-50 border-red-100';
      case 'medium': return 'bg-amber-50 border-amber-200';
      case 'low': return 'bg-secondary/5 border-secondary/10';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 50) return 'text-red-500';
    if (score >= 30) return 'text-amber-600';
    return 'text-secondary';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
          <div className="text-sm font-bold text-on-surface/50 mb-2">Total Policies</div>
          <div className="text-3xl font-black text-on-surface">{summary.totalPolicies}</div>
        </div>
        
        <div className="bg-red-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="text-sm font-bold opacity-80 mb-2">Critical Risk</div>
          <div className="text-3xl font-black">{summary.criticalRisk}</div>
        </div>
        
        <div className="bg-red-500 p-6 rounded-2xl text-white shadow-lg">
          <div className="text-sm font-bold opacity-80 mb-2">High Risk</div>
          <div className="text-3xl font-black">{summary.highRisk}</div>
        </div>
        
        <div className="bg-amber-500 p-6 rounded-2xl text-white shadow-lg">
          <div className="text-sm font-bold opacity-80 mb-2">Medium Risk</div>
          <div className="text-3xl font-black">{summary.mediumRisk}</div>
        </div>
        
        <div className="bg-secondary p-6 rounded-2xl text-white shadow-lg">
          <div className="text-sm font-bold opacity-80 mb-2">Stable</div>
          <div className="text-3xl font-black">{summary.lowRisk}</div>
        </div>
      </div>

      {/* Potential Loss Alert */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold opacity-80 mb-1">Total Potential Revenue Loss</div>
            <div className="text-4xl font-black">{formatCurrency(summary.totalPotentialLoss)}</div>
            <div className="text-sm opacity-80 mt-2">
              From {summary.criticalRisk + summary.highRisk} policies at critical or high risk
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold opacity-80 mb-1">Average Risk Score</div>
            <div className="text-4xl font-black">{summary.avgRiskScore}</div>
            <div className="text-sm opacity-80 mt-2">out of 100</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-slate-50/50 p-1.5 rounded-[24px] flex flex-wrap md:flex-nowrap gap-1.5 border border-black/5 w-fit editorial-shadow">
        {[
          { id: 'all', label: `All Portfolio (${summary.totalPolicies})`, icon: Shield, activeClass: 'bg-white text-on-surface shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-black/5', iconColor: 'text-primary' },
          { id: 'critical', label: `Critical Risk (${summary.criticalRisk})`, icon: AlertOctagon, activeClass: 'bg-red-600 text-white shadow-[0_4px_12px_rgba(220,38,38,0.2)]', iconColor: 'text-red-600' },
          { id: 'high', label: `High Risk (${summary.highRisk})`, icon: AlertTriangle, activeClass: 'bg-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.2)]', iconColor: 'text-red-500' },
          { id: 'medium', label: `Moderate Risk (${summary.mediumRisk})`, icon: AlertCircle, activeClass: 'bg-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.2)]', iconColor: 'text-amber-500' },
          { id: 'low', label: `Stable (${summary.lowRisk})`, icon: CheckCircle2, activeClass: 'bg-secondary text-white shadow-[0_4px_12px_rgba(34,197,94,0.2)]', iconColor: 'text-secondary' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedLevel === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedLevel(tab.id)}
              className={`group flex items-center gap-3 px-6 py-3 rounded-[18px] font-bold text-xs uppercase tracking-widest transition-all duration-300 ${
                isActive
                  ? tab.activeClass
                  : "text-on-surface/40 hover:text-on-surface/70 hover:bg-white/50"
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${
                isActive 
                  ? (tab.id === 'all' ? "bg-primary/5" : "bg-white/20") 
                  : "bg-transparent text-on-surface/20 group-hover:text-on-surface/40"
              }`}>
                <Icon className={`w-4 h-4 ${isActive && tab.id !== 'all' ? 'text-white' : tab.iconColor}`} />
              </div>
              <span className="font-headline italic tracking-normal normal-case text-sm">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Risk Table */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-black/5">
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-on-surface/50">Risk Level</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-on-surface/50">Policy</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-on-surface/50">Client</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-on-surface/50">Premium</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-on-surface/50">Days to Renewal</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-on-surface/50">Risk Score</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-on-surface/50">Risk Factors</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-on-surface/50">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredPolicies.map((policy) => (
                <tr key={policy.id} className={`hover:bg-slate-50 transition-colors ${getRiskBgColor(policy.riskLevel)}`}>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${getRiskColor(policy.riskLevel)}`}>
                      {policy.riskLevel}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-on-surface">{policy.policyNumber}</div>
                    <div className="text-xs text-on-surface/50">{policy.carrier} • {policy.policyType}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-on-surface">{policy.clientName}</div>
                    <div className="text-xs text-on-surface/50">{policy.clientIndustry || 'N/A'}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-on-surface">{policy.premium}</div>
                    {parseFloat(policy.premiumChange) > 0 && (
                      <div className="text-xs text-red-600 font-bold">+{policy.premiumChange}%</div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className={`font-black text-lg ${
                      policy.daysUntilRenewal <= 30 ? 'text-red-600' :
                      policy.daysUntilRenewal <= 60 ? 'text-amber-600' :
                      'text-secondary'
                    }`}>
                      {policy.daysUntilRenewal}d
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`text-2xl font-black ${getRiskScoreColor(policy.riskScore)}`}>
                      {policy.riskScore}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {policy.riskFactors.map((factor, i) => (
                        <div key={i} className="text-xs text-on-surface/70 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">warning</span>
                          {factor}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/dashboard/policy/${policy.id}`}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all inline-block"
                    >
                      Take Action
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredPolicies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-black/5">
          <span className="material-symbols-outlined text-6xl text-secondary mb-4">check_circle</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">No {selectedLevel !== 'all' ? selectedLevel + ' risk' : ''} policies found</h3>
          <p className="text-on-surface/50 font-medium italic">Your Book of Business is healthy!</p>
        </div>
      )}
    </div>
  );
}
