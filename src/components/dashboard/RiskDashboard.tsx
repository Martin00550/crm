'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Users, DollarSign, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PolicyRisk {
  policyId: string;
  policyNumber: string;
  clientName: string;
  carrier: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: Array<{
    type: string;
    severity: number;
    description: string;
    impact: string;
  }>;
  premiumAmount: number;
  renewalDate: string;
  daysUntilRenewal: number;
  lastContact: string;
}

interface AgencyRiskSummary {
  totalPolicies: number;
  atRiskPolicies: number;
  totalPremiumAtRisk: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  topRiskFactors: Array<{
    factor: string;
    count: number;
    impact: string;
  }>;
}

interface RiskDashboardProps {
  agencyId: string;
}

export function RiskDashboard({ agencyId }: RiskDashboardProps) {
  const [data, setData] = useState<{
    policyRisks: PolicyRisk[];
    agencySummary: AgencyRiskSummary;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);

  useEffect(() => {
    loadRiskData();
  }, [agencyId]);

  const loadRiskData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/risk/dashboard');
      const result = await res.json();
      
      if (!res.ok) {
        if (res.status === 403) {
          setError(result.upgradeMessage || 'Feature not available');
        } else {
          throw new Error(result.error || 'Failed to load risk data');
        }
        return;
      }

      setData(result.data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return AlertTriangle;
      case 'high': return AlertCircle;
      case 'medium': return TrendingUp;
      case 'low': return CheckCircle;
      default: return Shield;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-8 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-yellow-800 font-medium">Feature Not Available</p>
            <p className="text-yellow-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { policyRisks, agencySummary } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface p-6 rounded-2xl border border-black/5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Total Portfolio Placements</p>
              <p className="text-2xl font-bold text-on-surface">{agencySummary.totalPolicies}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-black/5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Leakage Risk Assets</p>
              <p className="text-2xl font-bold text-orange-600">{agencySummary.atRiskPolicies}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-black/5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Premium Volume at Risk</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(agencySummary.totalPremiumAtRisk)}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-black/5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Portfolio Risk Exposure</p>
              <p className="text-2xl font-bold text-on-surface">
                {agencySummary.totalPolicies > 0 
                  ? Math.round((agencySummary.atRiskPolicies / agencySummary.totalPolicies) * 100)
                  : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-surface p-6 rounded-2xl border border-black/5 shadow-sm">
          <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-6">Exposure Distribution</h3>
          <div className="space-y-4">
            {Object.entries(agencySummary.riskDistribution).map(([level, count]) => {
              const Icon = getRiskLevelIcon(level);
              const percentage = agencySummary.totalPolicies > 0 
                ? (count / agencySummary.totalPolicies) * 100 
                : 0;
              
              return (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className={`w-4 h-4 ${getRiskLevelColor(level).split(' ')[0]}`} />
                      <span className="text-sm font-bold text-on-surface capitalize">{level} Protocol</span>
                    </div>
                    <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">{count} Assets</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getRiskLevelColor(level).split(' ')[1].replace('bg-', 'bg-')}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Risk Factors */}
        <div className="bg-surface p-6 rounded-2xl border border-black/5 shadow-sm">
          <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-6">Primary Threat Factors</h3>
          <div className="space-y-4">
            {agencySummary.topRiskFactors.map((factor, index) => (
              <div key={factor.factor} className="flex items-start space-x-3 group">
                <span className="text-[10px] font-black text-on-surface/20 w-4 pt-1">{String(index + 1).padStart(2, '0')}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface capitalize group-hover:text-primary transition-colors">
                    {factor.factor.replace('_', ' ')}
                  </p>
                  <p className="text-[10px] font-medium text-on-surface/40 uppercase tracking-widest mt-0.5">{factor.impact}</p>
                </div>
                <span className="text-[10px] font-black text-secondary bg-secondary/5 px-2 py-0.5 rounded-full border border-secondary/10">{factor.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* High Risk Policies */}
        <div className="bg-surface p-6 rounded-2xl border border-black/5 shadow-sm">
          <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-6">Urgent Review Required</h3>
          <div className="space-y-3">
            {policyRisks
              .filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high')
              .slice(0, 5)
              .map((policy) => {
                const Icon = getRiskLevelIcon(policy.riskLevel);
                return (
                  <div 
                    key={policy.policyId} 
                    className="group bg-slate-50/50 border border-black/5 rounded-xl p-3 cursor-pointer hover:bg-white hover:shadow-md transition-all"
                    onClick={() => setSelectedRisk(policy.policyId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${getRiskLevelColor(policy.riskLevel).split(' ')[0]}`} />
                        <div>
                          <p className="text-sm font-bold text-on-surface">{policy.policyNumber}</p>
                          <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-0.5 truncate max-w-[120px]">{policy.clientName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-on-surface italic font-headline">{policy.riskScore}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${policy.daysUntilRenewal <= 30 ? 'text-red-600' : 'text-on-surface/40'}`}>{policy.daysUntilRenewal}d</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Detailed Risk List */}
      <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-black/5 bg-slate-50/50">
          <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Comprehensive Risk Registry</h3>
        </div>
        <div className="divide-y divide-black/5">
          {policyRisks.map((policy) => {
            const Icon = getRiskLevelIcon(policy.riskLevel);
            return (
              <div key={policy.policyId} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", getRiskLevelColor(policy.riskLevel).split(' ').slice(1).join(' '))}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-on-surface italic font-headline tracking-tight">{policy.policyNumber}</h4>
                        <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">{policy.clientName} • {policy.carrier}</p>
                      </div>
                      <span className={cn("px-3 py-1 text-[10px] font-black rounded-full border uppercase tracking-widest", getRiskLevelColor(policy.riskLevel))}>
                        {policy.riskLevel} Alert
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-8 text-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block">Premium Volume</span>
                        <span className="font-bold text-on-surface">{formatCurrency(policy.premiumAmount)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block">Renewal Timeline</span>
                        <span className={cn("font-bold", policy.daysUntilRenewal <= 30 ? "text-red-600" : "text-on-surface")}>{policy.daysUntilRenewal} Days</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block">Risk Factors</span>
                        <span className="font-headline italic font-black text-lg tracking-tighter text-on-surface">{policy.riskScore}/100</span>
                      </div>
                    </div>

                    {selectedRisk === policy.policyId && (
                      <div className="mt-6 pt-6 border-t border-black/5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-4">Threat Analysis Vectors</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {policy.riskFactors.map((factor, index) => (
                            <div key={index} className="bg-slate-50/50 rounded-2xl p-4 border border-black/5 hover:shadow-md transition-all">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-on-surface capitalize">
                                  {factor.type.replace('_', ' ')}
                                </span>
                                <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded-full border border-red-100">
                                  -{factor.severity} Impact
                                </span>
                              </div>
                              <p className="text-xs text-on-surface/60 font-medium leading-relaxed">{factor.description}</p>
                              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-2 italic">{factor.impact}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
