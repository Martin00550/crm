'use client';

import { useState, useEffect } from 'react';
import { AdvancedAnalytics } from '@/components/dashboard/AdvancedAnalytics';
import { BarChart3, TrendingUp, AlertTriangle, Shield, Download } from 'lucide-react';
import { exportAnalyticsToPDF } from '@/lib/pdf-export';

export default function AnalyticsPage() {
  const [agencyId, setAgencyId] = useState<string>('');
  const [hasAdvancedAnalytics, setHasAdvancedAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgencyData = async () => {
      try {
        const response = await fetch(`/api/agency/user-agency`);
        const data = await response.json();
        if (data.success) {
          setAgencyId(data.agencyId);

          // Check if agency has advanced analytics enabled based on tier
          const agencyResponse = await fetch(`/api/agency/profile`);
          const agencyData = await agencyResponse.json();
          if (agencyData.success) {
            const tier = agencyData.agency?.subscriptionTier || 'solo';
            setHasAdvancedAnalytics(tier === 'growth' || tier === 'enterprise');
          }
        }
      } catch (error) {
        console.error('Failed to get agency data:', error);
      }
      setLoading(false);
    };
    loadAgencyData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
      {hasAdvancedAnalytics && agencyId ? (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => exportAnalyticsToPDF({ totalBookOfBusiness: 0, totalPolicies: 0, renewalsAtRisk: { count: 0 }, activeClients: 0 }, [], 'analytics')}
              className="px-4 py-2 bg-surface border border-black/5 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2 text-sm font-black text-on-surface/60 uppercase tracking-widest"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
          <AdvancedAnalytics agencyId={agencyId} />
        </>
      ) : (
        <div className="bg-slate-50/50 border border-black/5 rounded-[32px] p-12 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-black/5">
            <AlertTriangle className="w-8 h-8 text-on-surface/20" />
          </div>
          <h3 className="text-xl font-black text-on-surface italic font-headline mb-2">Analytics Locked</h3>
          <p className="text-sm text-on-surface/40 font-medium italic mb-8 max-w-md mx-auto">Upgrade to Growth tier to access comprehensive analytics and performance metrics.</p>
          <button className="px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-xl transition-all active:scale-[0.98]">
            Upgrade Plan
          </button>
        </div>
      )}
    </div>
  );
}
