"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Shield, 
  TrendingUp, 
  Loader2,
  Check,
  FileText,
  Download
} from "lucide-react";
import { MetricComparison } from "@/components/dashboard/MetricComparison";
import { useMockData } from "@/context/MockDataContext";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DemoPolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { policies, clients } = useMockData();
  const policyId = params.id as string;

  const [policy, setPolicy] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const foundPolicy = policies.find(p => p.id === policyId);
    if (foundPolicy) {
      setPolicy(foundPolicy);
      const foundClient = clients.find(c => c.id === foundPolicy.clientId);
      setClient(foundClient);
    }
    setLoading(false);
  }, [policyId, policies, clients]);

  if (loading) return <div className="p-12 animate-pulse bg-white rounded-[32px] h-96 border border-black/5 shadow-sm"></div>;
  if (!policy || !client) return <div className="p-12 text-center text-on-surface/40 italic font-body">Policy record not found.</div>;

  const premiumChange = 12.4; // Mock variance for demo
  const expirationDate = new Date(policy.expirationDate);
  const daysUntilRenewal = Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-12 font-body pb-20 animate-in fade-in duration-700">
      {/* Header - Identical to Live */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-black/5 text-on-surface/40 hover:text-primary transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-4xl font-black text-on-surface tracking-tight leading-none">{policy.policyType}</h1>
          </div>
          <div className="flex items-center gap-4 text-on-surface/50 font-medium ml-14">
            <span className="text-sm">{client.name}</span>
            <span className="text-on-surface/10">•</span>
            <span className="text-sm">{policy.carrier}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSuccess('AI Explainer dispatch authorized.')}
            className="flex items-center gap-2 px-6 py-3 bg-secondary text-white rounded-2xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 group"
          >
            <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold uppercase tracking-widest">Dispatch Analysis</span>
          </button>
          <button 
            onClick={() => setSuccess('Update authorized. Syncing with carrier...')}
            className="px-6 py-3 bg-white border border-black/5 text-on-surface/60 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
          >
            Authorize Updates
          </button>
        </div>
      </div>

      {/* Metric Grid - Identical to Live */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col justify-between group hover:border-secondary/20 transition-all">
          <div className="mb-8">
            <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] block mb-2">Annual Premium</span>
            <h3 className="text-4xl font-bold tracking-tight text-on-surface">{formatCurrency(policy.premium)}</h3>
          </div>
          <MetricComparison 
            current={policy.premium} 
            previous={policy.premium * 0.88} 
            trend="up" 
            type="currency"
            label="Term Variance"
          />
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col justify-between group hover:border-secondary/20 transition-all">
          <div className="mb-8">
            <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] block mb-2">Renewal Window</span>
            <div className="flex items-end gap-3">
              <h3 className="text-4xl font-bold tracking-tight text-on-surface">{daysUntilRenewal}</h3>
              <span className="text-[10px] font-bold text-on-surface/30 mb-1 uppercase tracking-wider">Days Remaining</span>
            </div>
          </div>
          <MetricComparison 
            current={daysUntilRenewal} 
            previous={90} 
            trend={daysUntilRenewal < 30 ? "down" : "neutral"} 
            label="Renewal Progress"
          />
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col justify-between group hover:border-secondary/20 transition-all">
          <div className="mb-8">
            <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] block mb-2">Policy Health Score</span>
            <div className="flex items-end gap-3">
              <h3 className="text-4xl font-bold tracking-tight text-secondary">{(policy.healthScore || 75)}%</h3>
              <span className="text-[10px] font-black text-secondary mb-1 uppercase tracking-wider">Stable</span>
            </div>
          </div>
          <MetricComparison 
            current={policy.healthScore || 75} 
            previous={72} 
            trend="up" 
            type="percentage"
            label="Risk Mitigation"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Main Content Area - Identical to Live */}
          <div className="bg-white p-10 rounded-[32px] border border-black/5 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-bold text-on-surface">Policy Analysis</h3>
              <div className="flex items-center gap-4">
                <span className={`text-lg font-bold ${premiumChange > 0 ? 'text-red-500' : 'text-secondary'}`}>
                  {premiumChange > 0 ? '+' : ''}{premiumChange}% Variance
                </span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-black/5">
                  <span className="text-[9px] font-black text-on-surface/20 uppercase tracking-widest block mb-2">Carrier Details</span>
                  <p className="text-sm font-bold text-on-surface mb-1">{policy.carrier}</p>
                  <p className="text-[10px] text-on-surface/40 font-medium">Verified Carrier Policy</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-black/5">
                  <span className="text-[9px] font-black text-on-surface/20 uppercase tracking-widest block mb-2">Effective Date</span>
                  <p className="text-sm font-bold text-on-surface mb-1">{formatDate(policy.effectiveDate)}</p>
                  <p className="text-[10px] text-on-surface/40 font-medium">Last Policy Update</p>
                </div>
              </div>
              
              <div className="bg-secondary/5 p-8 rounded-3xl border border-secondary/10 relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Retention Strategy</span>
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed font-medium mb-6">
                    "The premium variance is within target ranges. Monitor renewal window for potential remarketing opportunities."
                  </p>
                  <div className="h-1 bg-secondary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-3/4 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[32px] border border-black/5 shadow-sm">
            <h3 className="text-xl font-bold text-on-surface mb-8">Premium History</h3>
            <div className="flex items-end gap-12 h-64 px-4">
              <div className="flex-1 flex flex-col items-center gap-6">
                <div className="w-full bg-slate-50 border border-black/5 rounded-[24px] relative group transition-all" style={{ height: '65%' }}>
                  <div className="absolute top-[-32px] left-1/2 -translate-x-1/2 font-bold text-on-surface/30 text-xs">
                    {formatCurrency(policy.premium * 0.88)}
                  </div>
                </div>
                <span className="text-[9px] font-bold text-on-surface/20 uppercase tracking-widest">Prior Period</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-6">
                <div className="w-full bg-secondary rounded-[24px] relative group transition-all shadow-lg" style={{ height: '100%' }}>
                  <div className="absolute top-[-32px] left-1/2 -translate-x-1/2 font-bold text-on-surface text-xs">
                    {formatCurrency(policy.premium)}
                  </div>
                </div>
                <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">Current Term</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
            <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-6">Policy Documents</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-black/5 hover:bg-white hover:shadow-md transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-black/5 text-lg shadow-sm">📄</div>
                  <div>
                    <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">Policy_Analysis.pdf</p>
                    <p className="text-[9px] font-bold text-on-surface/30 uppercase tracking-widest">1.2 MB</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-on-surface/20" />
              </div>
            </div>
          </div>
          
          <div className="bg-on-surface p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 block mb-4">Coverage Status</span>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-bold">Active Policy</h4>
              </div>
              <p className="text-sm text-white/60 leading-relaxed font-medium mb-0">
                This policy is currently in good standing and protected within the agency vault infrastructure.
              </p>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-10">
              <Shield className="w-32 h-32" />
            </div>
          </div>
        </div>
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
