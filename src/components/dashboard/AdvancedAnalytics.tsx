'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  BarChart3, 
  PieChart,
  Target,
  Activity,
  Briefcase,
  Building,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface AdvancedAnalyticsData {
  carrierPerformance: Array<{
    carrier: string;
    policyCount: number;
    totalPremium: number;
    averagePremium: number;
    renewalRate: number;
    lostPolicies: number;
    revenueChange: number;
    marketShare: number;
  }>;
  producerPerformance: Array<{
    producerId: string;
    producerName: string;
    policyCount: number;
    totalPremium: number;
    commissionEarned: number;
    renewalRate: number;
    newPolicies: number;
  }>;
  policyTypeAnalysis: Array<{
    policyType: string;
    count: number;
    totalPremium: number;
    averagePremium: number;
    growthRate: number;
    marketTrend: 'growing' | 'stable' | 'declining';
  }>;
  premiumTrends: Array<{
    period: string;
    totalPremium: number;
    newBusiness: number;
    renewals: number;
    averagePolicySize: number;
    growthRate: number;
  }>;
  renewalTrends: Array<{
    period: string;
    totalPolicies: number;
    renewedPolicies: number;
    renewalRate: number;
    lostPolicies: number;
    retentionRate: number;
  }>;
  growthMetrics: {
    newPoliciesThisMonth: number;
    newPoliciesLastMonth: number;
    growthRate: number;
    yearOverYearGrowth: number;
    projectedAnnualGrowth: number;
  };
  clientSegments: Array<{
    segment: string;
    count: number;
    totalPremium: number;
    averagePremium: number;
    retentionRate: number;
    growthPotential: 'high' | 'medium' | 'low';
  }>;
  clientLifecycleMetrics: {
    newClients: number;
    activeClients: number;
    atRiskClients: number;
    churnRate: number;
    averageClientValue: number;
    clientAcquisitionCost: number;
  };
  revenueBreakdown: {
    newBusiness: number;
    renewals: number;
    percentageBreakdown: {
      newBusiness: number;
      renewals: number;
    };
  };
  commissionAnalysis: {
    totalCommission: number;
    averageCommissionRate: number;
    commissionByCarrier: Array<{
      carrier: string;
      commission: number;
      rate: number;
    }>;
    commissionTrend: Array<{
      period: string;
      commission: number;
    }>;
  };
  profitabilityMetrics: {
    grossRevenue: number;
    commissionExpense: number;
    operatingExpense: number;
    netProfit: number;
    profitMargin: number;
    returnOnInvestment: number;
  };
}

interface AdvancedAnalyticsProps {
  agencyId: string;
  isDemo?: boolean;
  initialData?: AdvancedAnalyticsData | null;
}

export function AdvancedAnalytics({ agencyId, isDemo = false, initialData = null }: AdvancedAnalyticsProps) {
  const [data, setData] = useState<AdvancedAnalyticsData | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isDemo || !data) {
      loadAnalyticsData();
    }
  }, [agencyId, isDemo]);

  const loadAnalyticsData = async () => {
    if (isDemo && initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/advanced');
      const result = await res.json();
      
      if (!res.ok) {
        if (res.status === 403) {
          setError(result.upgradeMessage || 'Feature not available');
        } else {
          throw new Error(result.error || 'Failed to load analytics data');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? TrendingUp : TrendingDown;
  };

  const getTrendColor = (trend: number) => {
    return trend > 0 ? 'text-secondary' : 'text-red-600';
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
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-yellow-800 font-medium">Feature Not Available</p>
            <p className="text-yellow-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const tabs = [
    { id: 'overview', label: 'Book Summary', icon: BarChart3 },
    { id: 'performance', label: 'Carrier & Producer Metrics', icon: Target },
    { id: 'clients', label: 'Insured Retention', icon: Users },
    { id: 'financial', label: 'Commission Analysis', icon: DollarSign },
  ];

  return (
    <div className="space-y-6 font-body">
      {/* Tab Navigation */}
      <div className="bg-slate-50 p-1 rounded-xl flex flex-wrap md:flex-nowrap gap-1 border border-black/5 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2.5 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                isActive
                  ? "bg-white text-on-surface shadow-sm border border-black/5"
                  : "text-on-surface/40 hover:text-on-surface"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : "text-on-surface/20 group-hover:text-on-surface/40"}`} />
              <span className="tracking-widest">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Book Growth Rate</p>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatPercent(data.growthMetrics.growthRate)}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    {React.createElement(getTrendIcon(data.growthMetrics.growthRate), {
                      className: `w-3.5 h-3.5 ${getTrendColor(data.growthMetrics.growthRate)}`,
                    })}
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${getTrendColor(data.growthMetrics.growthRate)}`}>
                      vs last month
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100/50">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Retention Rate</p>
                  <p className="text-2xl font-bold text-on-surface tracking-tight">{formatPercent(data.renewalTrends[0]?.renewalRate || 0)}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Activity className="w-3.5 h-3.5 text-secondary" />
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Retention strong</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-secondary/5 rounded-lg flex items-center justify-center border border-secondary/10">
                  <UserCheck className="w-5 h-5 text-secondary" />
                </div>
              </div>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Commission Volume</p>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatPercent(data.profitabilityMetrics.profitMargin)}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Total commissions</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100/50">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Active Insureds</p>
                  <p className="text-2xl font-bold text-on-surface tracking-tight">{data.clientLifecycleMetrics.activeClients}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Users className="w-3.5 h-3.5 text-orange-600" />
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{data.clientLifecycleMetrics.newClients} new this cycle</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-100/50">
                  <Briefcase className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Premium Trends Chart */}
          <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
            <h3 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-6 border-b border-black/5 pb-3">Premium Growth Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.premiumTrends}>
                <defs>
                  <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 10, fontWeight: 'bold' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => typeof value === 'number' ? formatCurrency(value) : ''}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalPremium" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPremium)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <h3 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-6 border-b border-black/5 pb-3">Revenue Breakdown</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-bold text-on-surface/70 uppercase tracking-widest">New Submissions</span>
                    <span className="font-bold text-on-surface">{formatPercent(data.revenueBreakdown.percentageBreakdown.newBusiness)}</span>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-1.5 border border-black/5 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-1000"
                      style={{ width: `${data.revenueBreakdown.percentageBreakdown.newBusiness}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-on-surface/40 font-bold mt-2 uppercase tracking-widest">{formatCurrency(data.revenueBreakdown.newBusiness)}</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-bold text-on-surface/70 uppercase tracking-widest">Renewals</span>
                    <span className="font-bold text-on-surface">{formatPercent(data.revenueBreakdown.percentageBreakdown.renewals)}</span>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-1.5 border border-black/5 overflow-hidden">
                    <div 
                      className="bg-secondary h-full transition-all duration-1000"
                      style={{ width: `${data.revenueBreakdown.percentageBreakdown.renewals}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-on-surface/40 font-bold mt-2 uppercase tracking-widest">{formatCurrency(data.revenueBreakdown.renewals)}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <h3 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-6 border-b border-black/5 pb-3">Revenue Composition</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'New Business', value: data.revenueBreakdown.newBusiness, color: '#6366f1' },
                      { name: 'Renewals', value: data.revenueBreakdown.renewals, color: '#22c55e' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#22c55e" />
                  </Pie>
                  <Tooltip formatter={(value: any) => typeof value === 'number' ? formatCurrency(value) : ''} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span className="text-xs font-bold uppercase tracking-widest">{value}</span>
                    )}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Carrier Performance Chart */}
          <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
            <h3 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-6 border-b border-black/5 pb-3">Carrier Market Share</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.carrierPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="carrier" 
                  tick={{ fontSize: 10, fontWeight: 'bold' }}
                  tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => typeof value === 'number' ? formatPercent(value) : ''}
                />
                <Bar dataKey="marketShare" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Carrier Performance Table */}
          <div className="bg-surface rounded-xl border border-black/5 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 bg-slate-50">
              <h3 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Carrier Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Carrier</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Policies</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Total Premium</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-on-surface/40 uppercase tracking-widest text-center">Retention Rate</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-on-surface/40 uppercase tracking-widest text-right">Market Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {data.carrierPerformance.map((carrier) => (
                    <tr key={carrier.carrier} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-on-surface">{carrier.carrier}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-on-surface/70">
                        {carrier.policyCount}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-on-surface">
                        {formatCurrency(carrier.totalPremium)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[9px] font-bold rounded-full uppercase tracking-widest border border-secondary/10">
                          {formatPercent(carrier.renewalRate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-bold text-on-surface/40 tracking-tight">
                        {formatPercent(carrier.marketShare)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Policy Type Chart */}
          <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
            <h3 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-6 border-b border-black/5 pb-3">Policy Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.policyTypeAnalysis}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="policyType" 
                  tick={{ fontSize: 10, fontWeight: 'bold' }}
                  tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => typeof value === 'number' ? value.toLocaleString() : ''}
                />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name="Policies" />
                <Bar dataKey="totalPremium" fill="#6366f1" radius={[4, 4, 0, 0]} name="Premium" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Policy Type Analysis */}
          <div className="bg-surface rounded-xl border border-black/5 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 bg-slate-50">
              <h3 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Policy Type Analysis</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
              {data.policyTypeAnalysis.map((type) => (
                <div key={type.policyType} className="bg-slate-50 border border-black/5 rounded-xl p-5 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-on-surface text-base">{type.policyType}</h4>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-widest border ${
                      type.marketTrend === 'growing' ? 'bg-secondary/5 text-secondary border-secondary/10' :
                      type.marketTrend === 'declining' ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-white text-on-surface/40 border-black/10'
                    }`}>
                      {type.marketTrend}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Active Policies</span>
                      <span className="text-xs font-bold text-on-surface">{type.count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Avg Premium</span>
                      <span className="text-xs font-bold text-on-surface">{formatCurrency(type.averagePremium)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5 border-t border-black/5">
                      <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Book Growth</span>
                      <span className={`text-xs font-bold tracking-tight ${getTrendColor(type.growthRate)}`}>
                        {formatPercent(type.growthRate)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          {/* Client Lifecycle Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">New Insureds</p>
                  <p className="text-2xl font-bold text-on-surface tracking-tight">{data.clientLifecycleMetrics.newClients}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100/50">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Active Portfolio</p>
                  <p className="text-2xl font-bold text-on-surface tracking-tight">{data.clientLifecycleMetrics.activeClients}</p>
                </div>
                <div className="w-10 h-10 bg-secondary/5 rounded-lg flex items-center justify-center border border-secondary/10">
                  <UserCheck className="w-5 h-5 text-secondary" />
                </div>
              </div>
            </div>
            
            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Leakage Risk</p>
                  <p className="text-2xl font-bold text-on-surface tracking-tight">{data.clientLifecycleMetrics.atRiskClients}</p>
                </div>
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center border border-red-100/50">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Avg Account Value</p>
                  <p className="text-2xl font-bold text-on-surface tracking-tight">{formatCurrency(data.clientLifecycleMetrics.averageClientValue)}</p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100/50">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Client Segments Detail */}
          <div className="bg-surface rounded-xl border border-black/5 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 bg-slate-50">
              <h3 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Insured Segment Analysis</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Segment</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Insureds</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Total Premium</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Avg Premium</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Retention Rate</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-on-surface/40 uppercase tracking-widest text-right">Growth Potential</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {data.clientSegments.map((segment) => (
                    <tr key={segment.segment} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-on-surface capitalize">{segment.segment}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-on-surface/70">
                        {segment.count}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-on-surface">
                        {formatCurrency(segment.totalPremium)}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-on-surface/70">
                        {formatCurrency(segment.averagePremium)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[9px] font-bold rounded-full uppercase tracking-widest border border-secondary/10">
                          {formatPercent(segment.retentionRate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-widest border ${
                          segment.growthPotential === 'high' ? 'bg-secondary/5 text-secondary border-secondary/10' :
                          segment.growthPotential === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-white text-on-surface/40 border-black/10'
                        }`}>
                          {segment.growthPotential}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          {/* Profitability Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Gross Revenue</p>
                  <p className="text-2xl font-bold text-on-surface tracking-tight">{formatCurrency(data.profitabilityMetrics.grossRevenue)}</p>
                </div>
                <div className="w-10 h-10 bg-secondary/5 rounded-lg flex items-center justify-center border border-secondary/10">
                  <DollarSign className="w-5 h-5 text-secondary" />
                </div>
              </div>
            </div>
            
            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Commission Expense</p>
                  <p className="text-2xl font-bold text-on-surface tracking-tight">{formatCurrency(data.profitabilityMetrics.commissionExpense)}</p>
                </div>
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center border border-red-100/50">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Net Profit</p>
                  <p className="text-2xl font-bold text-on-surface tracking-tight">{formatCurrency(data.profitabilityMetrics.netProfit)}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100/50">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">ROI</p>
                  <p className="text-2xl font-bold text-on-surface tracking-tight">{formatPercent(data.profitabilityMetrics.returnOnInvestment)}</p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100/50">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Commission Trend Chart */}
          <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
            <h3 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-6 border-b border-black/5 pb-3">Commission Trend (6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.commissionAnalysis.commissionTrend.slice(-6)}>
                <defs>
                  <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 10, fontWeight: 'bold' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => typeof value === 'number' ? formatCurrency(value) : ''}
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCommission)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Commission Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <h3 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-6 border-b border-black/5 pb-3">Commission by Carrier</h3>
              <div className="space-y-3">
                {data.commissionAnalysis.commissionByCarrier.map((carrier) => (
                  <div key={carrier.carrier} className="flex items-center justify-between p-3 bg-slate-50 border border-black/5 rounded-lg">
                    <div>
                      <p className="text-sm font-bold text-on-surface">{carrier.carrier}</p>
                      <p className="text-[9px] font-bold text-on-surface/40 uppercase tracking-widest">{formatPercent(carrier.rate)} override rate</p>
                    </div>
                    <p className="text-sm font-bold text-on-surface">{formatCurrency(carrier.commission)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-black/5 shadow-sm">
              <h3 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-6 border-b border-black/5 pb-3">Commission Forecast Summary</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-black/5">
                  <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Total Book Commission</span>
                  <span className="text-xl font-bold text-primary tracking-tight">{formatCurrency(data.commissionAnalysis.totalCommission)}</span>
                </div>
                <div className="flex justify-between items-center px-4">
                  <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Weighted Average Rate</span>
                  <span className="text-sm font-bold text-on-surface">{formatPercent(data.commissionAnalysis.averageCommissionRate)}</span>
                </div>
                <div className="border-t border-black/5 pt-6">
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-4">Commission Trend (Last 6 months)</p>
                  <div className="space-y-2.5">
                    {data.commissionAnalysis.commissionTrend.slice(-6).map((trend) => (
                      <div key={trend.period} className="flex justify-between items-center text-xs px-2">
                        <span className="font-bold text-on-surface/60 uppercase tracking-widest text-[10px]">{new Date(trend.period).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        <span className="font-bold text-on-surface">{formatCurrency(trend.commission)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
