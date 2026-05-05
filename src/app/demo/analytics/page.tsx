"use client";

import { useMockData } from "@/context/MockDataContext";
import { AdvancedAnalytics } from "@/components/dashboard/AdvancedAnalytics";
import { TrendingUp, Download, Check } from "lucide-react";
import { useState, useEffect } from "react";

export default function DemoAnalyticsPage() {
  const { policies } = useMockData();
  const [mounted, setMounted] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="p-12 animate-pulse bg-white rounded-[32px] h-96 border border-black/5 shadow-sm"></div>;

  const totalPremium = policies.reduce((sum, p) => sum + p.premium, 0);

  // Dynamically calculate carrier performance
  const carrierMap = new Map<string, { count: number; premium: number }>();
  policies.forEach(p => {
    const current = carrierMap.get(p.carrier) || { count: 0, premium: 0 };
    carrierMap.set(p.carrier, {
      count: current.count + 1,
      premium: current.premium + p.premium
    });
  });

  const carrierPerformance = Array.from(carrierMap.entries()).map(([carrier, stats]) => ({
    carrier,
    policyCount: stats.count,
    totalPremium: stats.premium,
    averagePremium: stats.premium / stats.count,
    renewalRate: 90 + Math.random() * 8, // Mocked renewal rate
    lostPolicies: Math.floor(Math.random() * 2),
    revenueChange: 5 + Math.random() * 10,
    marketShare: (stats.premium / totalPremium) * 100
  }));

  // Dynamically calculate policy type analysis
  const typeMap = new Map<string, { count: number; premium: number }>();
  policies.forEach(p => {
    const current = typeMap.get(p.policyType) || { count: 0, premium: 0 };
    typeMap.set(p.policyType, {
      count: current.count + 1,
      premium: current.premium + p.premium
    });
  });

  const policyTypeAnalysis = Array.from(typeMap.entries()).map(([policyType, stats]) => ({
    policyType,
    count: stats.count,
    totalPremium: stats.premium,
    averagePremium: stats.premium / stats.count,
    growthRate: 4 + Math.random() * 15,
    marketTrend: "growing" as const
  }));

  const mockAnalyticsData = {
    carrierPerformance,
    producerPerformance: [
      { producerId: "P001", producerName: "John Smith", policyCount: Math.ceil(policies.length * 0.4), totalPremium: totalPremium * 0.4, commissionEarned: totalPremium * 0.06, renewalRate: 94, newPolicies: 3 },
      { producerId: "P002", producerName: "Sarah Johnson", policyCount: Math.ceil(policies.length * 0.35), totalPremium: totalPremium * 0.35, commissionEarned: totalPremium * 0.05, renewalRate: 96, newPolicies: 2 },
      { producerId: "P003", producerName: "Mike Davis", policyCount: Math.ceil(policies.length * 0.25), totalPremium: totalPremium * 0.25, commissionEarned: totalPremium * 0.04, renewalRate: 90, newPolicies: 1 },
    ],
    policyTypeAnalysis,
    premiumTrends: [
      { period: "2024-01", totalPremium: 85000, newBusiness: 25000, renewals: 55000, averagePolicySize: 11200, growthRate: 8.5 },
      { period: "2024-02", totalPremium: 92000, newBusiness: 32000, renewals: 55000, averagePolicySize: 11800, growthRate: 10.2 },
      { period: "2024-03", totalPremium: 88000, newBusiness: 28000, renewals: 56000, averagePolicySize: 11500, growthRate: 6.8 },
      { period: "2024-04", totalPremium: 95000, newBusiness: 35000, renewals: 56000, averagePolicySize: 12100, growthRate: 12.1 },
      { period: "2024-05", totalPremium: 102000, newBusiness: 42000, renewals: 56000, averagePolicySize: 12600, growthRate: 14.5 },
      { period: "2024-06", totalPremium: 108000, newBusiness: 48000, renewals: 56000, averagePolicySize: 13200, growthRate: 15.8 },
    ],
    renewalTrends: [
      { period: "2024-01", totalPolicies: 42, renewedPolicies: 39, renewalRate: 92.9, lostPolicies: 3, retentionRate: 92.9 },
      { period: "2024-02", totalPolicies: 44, renewedPolicies: 41, renewalRate: 93.2, lostPolicies: 3, retentionRate: 93.2 },
      { period: "2024-03", totalPolicies: 45, renewedPolicies: 42, renewalRate: 93.3, lostPolicies: 3, retentionRate: 93.3 },
      { period: "2024-04", totalPolicies: 46, renewedPolicies: 43, renewalRate: 93.5, lostPolicies: 3, retentionRate: 93.5 },
      { period: "2024-05", totalPolicies: 47, renewedPolicies: 44, renewalRate: 93.6, lostPolicies: 3, retentionRate: 93.6 },
      { period: "2024-06", totalPolicies: 48, renewedPolicies: 45, renewalRate: 93.8, lostPolicies: 3, retentionRate: 93.8 },
    ],
    growthMetrics: {
      newPoliciesThisMonth: 8,
      newPoliciesLastMonth: 6,
      growthRate: 12.5,
      yearOverYearGrowth: 18.3,
      projectedAnnualGrowth: 22.1,
    },
    clientSegments: [
      { segment: "Enterprise", count: 12, totalPremium: totalPremium * 0.45, averagePremium: 22500, retentionRate: 96.5, growthPotential: "high" as const },
      { segment: "Mid-Market", count: 18, totalPremium: totalPremium * 0.35, averagePremium: 12800, retentionRate: 93.2, growthPotential: "medium" as const },
      { segment: "Small Business", count: 25, totalPremium: totalPremium * 0.2, averagePremium: 5200, retentionRate: 88.7, growthPotential: "low" as const },
    ],
    clientLifecycleMetrics: {
      newClients: 14,
      activeClients: 55,
      atRiskClients: 6,
      leakageRate: 6.2,
      averageClientValue: 18500,
      clientAcquisitionCost: 2800,
    },
    revenueBreakdown: {
      newBusiness: 48000,
      renewals: 56000,
      percentageBreakdown: {
        newBusiness: 41.4,
        renewals: 48.3,
      },
    },
    commissionAnalysis: {
      totalCommission: totalPremium * 0.15,
      averageCommissionRate: 15,
      commissionByCarrier: [
        { carrier: "AIG", commission: totalPremium * 0.25 * 0.15, rate: 15 },
        { carrier: "Chubb", commission: totalPremium * 0.35 * 0.15, rate: 15 },
        { carrier: "Travelers", commission: totalPremium * 0.2 * 0.15, rate: 15 },
        { carrier: "Liberty Mutual", commission: totalPremium * 0.2 * 0.15, rate: 15 },
      ],
      commissionTrend: [
        { period: "2024-01", commission: totalPremium * 0.012 },
        { period: "2024-02", commission: totalPremium * 0.015 },
        { period: "2024-03", commission: totalPremium * 0.013 },
        { period: "2024-04", commission: totalPremium * 0.014 },
        { period: "2024-05", commission: totalPremium * 0.016 },
        { period: "2024-06", commission: totalPremium * 0.018 },
      ],
    },
    profitabilityMetrics: {
      grossRevenue: totalPremium * 0.15,
      commissionExpense: totalPremium * 0.03,
      operatingExpense: totalPremium * 0.04,
      netProfit: totalPremium * 0.08,
      profitMargin: 53.3,
      returnOnInvestment: 28.4,
    }
  };

  return (
    <div className="space-y-12 font-body pb-20 animate-in fade-in duration-700">
      {/* Header - Identical to Live */}
      <div>
        <h1 className="text-4xl font-black text-on-surface tracking-tight">Portfolio Analytics</h1>
        <p className="text-on-surface/50 font-medium mt-1">Book of Business trends and performance metrics (Simulated).</p>
      </div>

      {/* Feature Info - Identical to Live */}
      <div className="bg-white border border-black/5 rounded-3xl p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="flex flex-col lg:flex-row lg:items-center gap-10 relative z-10">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-on-surface mb-3">Carrier & Producer Insights</h3>
            <p className="text-on-surface/60 font-medium leading-relaxed max-w-2xl">
              Track performance across your entire portfolio. Analyze carrier data, producer productivity, 
              and client segmentation to drive agency growth.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 lg:justify-end">
             <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-bold text-on-surface/40 uppercase tracking-widest border border-black/5">Trend Analysis</div>
             <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-bold text-on-surface/40 uppercase tracking-widest border border-black/5">Carrier Benchmarking</div>
             <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-bold text-on-surface/40 uppercase tracking-widest border border-black/5">Retention Forecasting</div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Dashboard - Unlocked for Demo */}
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => setSuccess('Analytics report export initiated.')}
            className="flex items-center gap-2 px-4 py-2 text-on-surface/40 hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
        <AdvancedAnalytics 
          agencyId="demo-agency" 
          isDemo={true} 
          initialData={mockAnalyticsData} 
        />
      </div>

      {/* Demo Badge */}
      <div className="fixed bottom-8 left-8 z-50">
        <div className="px-4 py-2 bg-white/80 backdrop-blur-md border border-black/5 rounded-full shadow-xl">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Live Demo Environment</span>
        </div>
      </div>

      {/* Success Toast Mock */}
      {success && (
        <div className="fixed bottom-24 right-8 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <Check className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">{success}</span>
        </div>
      )}
    </div>
  );
}
