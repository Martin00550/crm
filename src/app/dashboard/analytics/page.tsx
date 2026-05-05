'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { TrendingUp, AlertTriangle, Download } from 'lucide-react';
import { exportAnalyticsToPDF } from '@/lib/pdf-export';
import Link from 'next/link';

const AdvancedAnalytics = lazy(() => import('@/components/dashboard/AdvancedAnalytics').then(m => ({ default: m.AdvancedAnalytics })));

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
          const agencyResponse = await fetch(`/api/agency/profile`);
          const agencyData = await agencyResponse.json();
          if (agencyData.agency) {
            const tier = (agencyData.agency.subscriptionTier || 'solo').toLowerCase();
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
    <div className="space-y-12 font-body pb-20">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-on-surface tracking-tight">Portfolio Analytics</h1>
        <p className="text-on-surface/50 font-medium mt-1">Book of Business trends and performance metrics.</p>
      </div>

      {/* Feature Info */}
      <div className="bg-white border border-black/5 rounded-3xl p-10 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-10">
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

      {/* Advanced Analytics Dashboard */}
      {hasAdvancedAnalytics && agencyId ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => exportAnalyticsToPDF({ totalBookOfBusiness: 0, totalPolicies: 0, renewalsAtRisk: { count: 0 }, activeClients: 0 }, [], 'analytics')}
              className="flex items-center gap-2 px-4 py-2 text-on-surface/40 hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
          <Suspense fallback={<div className="p-12 text-center text-on-surface/20 font-bold uppercase tracking-widest text-xs">Loading Advanced Analytics...</div>}>
            <AdvancedAnalytics agencyId={agencyId} />
          </Suspense>
        </div>
      ) : (
        <div className="bg-slate-50/50 border border-black/5 rounded-3xl p-20 text-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-black/5 text-on-surface/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">Advanced Analytics Locked</h3>
          <p className="text-on-surface/40 font-medium mb-8 max-w-sm mx-auto leading-relaxed">Upgrade to the Growth Agency or Enterprise tier to unlock deep portfolio insights and carrier performance tracking.</p>
          <Link href="/dashboard/settings/billing" className="inline-block px-10 py-4 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-full hover:opacity-90 transition-all shadow-md">
            View Upgrade Options
          </Link>
        </div>
      )}
    </div>
  );
}
