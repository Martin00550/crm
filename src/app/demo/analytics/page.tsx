"use client";

import { useMockData } from "@/context/MockDataContext";
import { AdvancedAnalytics } from "@/components/dashboard/AdvancedAnalytics";
import { BarChart3, TrendingUp, AlertTriangle, Shield } from "lucide-react";

export default function DemoAnalyticsPage() {
  const { policies } = useMockData();
  const totalPremium = policies.reduce((sum, p) => sum + p.premium, 0);

  // Generate mock analytics data based on our mock policies
  const mockAnalyticsData = {
    carrierPerformance: [
      { carrier: "AIG", policyCount: 5, totalPremium: totalPremium * 0.25, averagePremium: 12500, renewalRate: 95, lostPolicies: 1, revenueChange: 8.5, marketShare: 25 },
      { carrier: "Chubb", policyCount: 8, totalPremium: totalPremium * 0.35, averagePremium: 15200, renewalRate: 98, lostPolicies: 0, revenueChange: 12.3, marketShare: 35 },
      { carrier: "Travelers", policyCount: 6, totalPremium: totalPremium * 0.2, averagePremium: 10800, renewalRate: 92, lostPolicies: 2, revenueChange: 5.1, marketShare: 20 },
      { carrier: "Liberty Mutual", policyCount: 4, totalPremium: totalPremium * 0.2, averagePremium: 9500, renewalRate: 88, lostPolicies: 3, revenueChange: -2.4, marketShare: 20 },
    ],
    producerPerformance: [
      { producerId: "P001", producerName: "John Smith", policyCount: 12, totalPremium: totalPremium * 0.4, commissionEarned: totalPremium * 0.06, renewalRate: 94, newPolicies: 3 },
      { producerId: "P002", producerName: "Sarah Johnson", policyCount: 8, totalPremium: totalPremium * 0.35, commissionEarned: totalPremium * 0.05, renewalRate: 96, newPolicies: 2 },
      { producerId: "P003", producerName: "Mike Davis", policyCount: 5, totalPremium: totalPremium * 0.25, commissionEarned: totalPremium * 0.04, renewalRate: 90, newPolicies: 1 },
    ],
    policyTypeAnalysis: [
      { policyType: "Commercial Property", count: 8, totalPremium: totalPremium * 0.3, averagePremium: 14500, growthRate: 12.5, marketTrend: "growing" as const },
      { policyType: "General Liability", count: 10, totalPremium: totalPremium * 0.25, averagePremium: 9800, growthRate: 5.2, marketTrend: "stable" as const },
      { policyType: "Professional E&O", count: 6, totalPremium: totalPremium * 0.25, averagePremium: 16200, growthRate: 18.3, marketTrend: "growing" as const },
      { policyType: "Cyber Liability", count: 4, totalPremium: totalPremium * 0.2, averagePremium: 19500, growthRate: -3.1, marketTrend: "declining" as const },
    ],
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
      churnRate: 6.2,
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
    <div className="space-y-8 font-body">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-4 mb-2">
          <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 shadow-sm">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-on-surface italic font-headline tracking-tight">Portfolio Analytics</h1>
        </div>
        <p className="text-on-surface/60 font-medium italic">Book of Business trends, carrier performance metrics, and renewal volume forecasting</p>
      </div>

      {/* Feature Info */}
      <div className="bg-surface border border-black/5 rounded-[32px] p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="flex items-start space-x-6 relative z-10">
          <div className="w-14 h-14 bg-secondary text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-on-surface italic font-headline mb-2">Carrier & Producer Metrics</h3>
            <p className="text-on-surface/70 mb-6 font-medium leading-relaxed max-w-2xl">
              Analyze carrier performance, producer productivity, 
              insured segmentation, and commission analytics. Drive data-driven growth for your agency.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-4 h-4 text-secondary" />
                <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Performance Metrics</span>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-4 h-4 text-secondary" />
                <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Trend Analysis</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-4 h-4 text-secondary" />
                <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Insured Insights</span>
              </div>
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-4 h-4 text-secondary" />
                <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Financial Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Dashboard */}
      <AdvancedAnalytics 
        agencyId="demo-agency" 
        isDemo={true} 
        initialData={mockAnalyticsData} 
      />
    </div>
  );
}
