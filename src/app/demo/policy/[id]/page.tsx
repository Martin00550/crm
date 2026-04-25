"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Shield as ShieldIcon, 
  Calendar as CalendarIcon, 
  Edit as EditIcon, 
  TrendingUp as TrendingUpIcon,
  Trash2,
  FileText,
  AlertTriangle,
  ArrowLeft as ArrowLeftIcon,
  CheckCircle2,
  Sparkles,
  Clock
} from "lucide-react";
import { useMockData } from "@/context/MockDataContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DemoDocumentsSection } from "@/components/demo/DemoDocumentsSection";

export default function DemoPolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { policies, clients } = useMockData();
  const policyId = params.id as string;

  const [policy, setPolicy] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const foundPolicy = policies.find(p => p.id === policyId);
    if (foundPolicy) {
      setPolicy(foundPolicy);
      const foundClient = clients.find(c => c.id === foundPolicy.clientId);
      setClient(foundClient);
    }
    setLoading(false);
  }, [policyId, policies, clients]);

  if (loading) return <div className="p-12 animate-pulse bg-slate-50 rounded-[32px] h-96"></div>;
  if (!policy) return <div className="p-12 text-center text-on-surface/40 italic">Placement Intelligence record not found.</div>;

  const premiumChange = 12.5; // Mock variance for demo
  const expirationDate = new Date(policy.expirationDate);
  const daysUntilRenewal = Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-8 font-body text-on-surface">
      {/* Breadcrumbs */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">
          <Link href="/demo/clients" className="hover:text-primary transition-colors">Book of Business</Link>
          <span className="text-[14px]">/</span>
          {client && (
            <>
              <Link href={`/demo/clients/${client.id}`} className="hover:text-primary transition-colors">{client.name}</Link>
              <span className="text-[14px]">/</span>
            </>
          )}
          <span className="text-primary italic">{policy.policyType} Intelligence</span>
        </nav>
        <div className="flex items-center gap-3 px-4 py-2 bg-secondary/5 rounded-full border border-secondary/10">
          <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Authorized Forensic View</span>
          <div className="w-8 h-4 bg-secondary rounded-full relative">
            <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"></div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Policy Info */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-surface p-10 rounded-[32px] border border-black/5 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <div className="flex items-start justify-between mb-10 relative z-10">
              <div>
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-2">Carrier Placement</p>
                <h3 className="text-3xl font-black text-on-surface italic font-headline tracking-tight">{policy.carrier}</h3>
              </div>
              <div className="h-14 w-14 bg-secondary text-white rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
            <div className="space-y-8 relative z-10">
              <div>
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-2">Insured Entity</p>
                <p className="text-2xl font-black text-on-surface italic font-headline tracking-tight">{client?.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-2">Total Premium</p>
                  <p className="text-3xl font-black text-on-surface tracking-tighter italic font-headline">{formatCurrency(policy.premium)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-2">Placement Status</p>
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-secondary/5 text-secondary border border-secondary/10">
                    Active Deployment
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-2">Maturity Date (Expiration)</p>
                <div className="flex items-center gap-3 text-on-surface font-black text-lg font-headline italic tracking-tight">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-black/5 shadow-sm text-on-surface/20">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  {formatDate(policy.expirationDate)}
                </div>
              </div>
            </div>
            <button className="w-full mt-12 py-5 px-8 bg-primary text-white rounded-full font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-[0.98]">
              <EditIcon className="w-4 h-4" />
              Authorize Placement Updates
            </button>
          </div>

          {/* Risk Exposure */}
          <div className="bg-primary p-8 rounded-[32px] overflow-hidden relative shadow-2xl group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.3),transparent)] group-hover:opacity-80 transition-opacity"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-white/40">Risk Exposure Index</p>
              <p className="text-6xl font-black text-white italic font-headline leading-none tracking-tighter">{(policy.healthScore || 75) / 20}<span className="text-lg opacity-20 ml-1">/5.0</span></p>
              <p className="text-[10px] mt-6 text-secondary font-black uppercase tracking-widest border-b border-secondary/20 inline-block pb-1">Above market volatility for {client?.industry || 'General Sector'}.</p>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform text-white">
              <ShieldIcon size={140} />
            </div>
          </div>

          {/* Documents Section */}
          <DemoDocumentsSection policyId={policyId} />
        </div>

        {/* Right Column - Main Insights */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Premium Evolution */}
          <div className="bg-surface p-10 rounded-[32px] border border-black/5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="flex justify-between items-end mb-12 relative z-10">
              <div>
                <h2 className="text-3xl font-black text-on-surface italic font-headline tracking-tight">Premium Evolution</h2>
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mt-2">YoY Growth comparison & market delta forensics</p>
              </div>
              <div className="text-right">
                <span className={`text-3xl font-black tracking-tighter italic font-headline ${premiumChange > 0 ? 'text-red-600' : 'text-secondary'}`}>
                  {premiumChange > 0 ? '+' : ''}{premiumChange}%
                </span>
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mt-1">Variance</p>
              </div>
            </div>
            <div className="flex items-end gap-12 h-64 px-8 relative z-10">
              <div className="flex-1 flex flex-col items-center gap-6">
                <div className="w-full bg-slate-50 border border-black/5 rounded-[24px] relative group transition-all shadow-inner" style={{ height: '65%' }}>
                  <div className="absolute top-[-32px] left-1/2 -translate-x-1/2 font-black text-on-surface/20 text-sm tracking-tighter italic font-headline whitespace-nowrap">
                    {policy.previousTermPremium ? formatCurrency(policy.previousTermPremium) : formatCurrency(policy.premium * 0.88)}
                  </div>
                </div>
                <span className="text-[10px] font-black text-on-surface/20 uppercase tracking-[0.2em]">Prior Period Cycle</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-6">
                <div className="w-full bg-primary rounded-[24px] relative group transition-all shadow-2xl" style={{ height: '100%' }}>
                  <div className="absolute top-[-32px] left-1/2 -translate-x-1/2 font-black text-on-surface text-sm tracking-tighter italic font-headline whitespace-nowrap">
                    {formatCurrency(policy.premium)}
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-2 bg-secondary text-white text-[10px] font-black rounded-full whitespace-nowrap tracking-[0.2em] shadow-lg border border-white/10">
                    ACTIVE DEPLOYMENT
                  </div>
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Current Term Authority</span>
              </div>
            </div>
          </div>

          {/* AI Analysis Card */}
          <div className="bg-surface p-12 rounded-[32px] shadow-xl border border-black/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <span className="px-5 py-2 bg-secondary/5 text-secondary text-[10px] font-black rounded-full flex items-center gap-2 border border-secondary/10 shadow-sm uppercase tracking-widest animate-pulse">
                <Sparkles className="w-4 h-4" />
                AI FORENSIC ENGINE
              </span>
            </div>
            <h3 className="text-3xl font-black text-on-surface mb-10 italic font-headline tracking-tight">Rate Adjustment Forensics</h3>
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="space-y-10">
                <div className="flex gap-6 group">
                  <div className="h-14 w-14 shrink-0 rounded-2xl bg-primary/5 flex items-center justify-center border border-black/5 shadow-sm group-hover:scale-110 transition-all text-primary">
                    <TrendingUpIcon />
                  </div>
                  <div>
                    <h4 className="font-black text-on-surface text-sm mb-2 italic uppercase tracking-widest">Market Volatility (+{Math.abs(premiumChange * 0.5).toFixed(1)}%)</h4>
                    <p className="text-sm text-on-surface/60 leading-relaxed font-medium italic">
                      System-wide rate adjustments for {policy.policyType} in the regional theatre due to rising carrier liability and reinsurance reserve shifts.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 group">
                  <div className="h-14 w-14 shrink-0 rounded-2xl bg-primary/5 flex items-center justify-center border border-black/5 shadow-sm group-hover:scale-110 transition-all text-primary">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-on-surface text-sm mb-2 italic uppercase tracking-widest">Loss Portfolio Impact (+{Math.abs(premiumChange * 0.25).toFixed(1)}%)</h4>
                    <p className="text-sm text-on-surface/60 leading-relaxed font-medium italic">
                      Isolated incident reports in Q3 adjusted the actuarial index. Intelligence suggests recovery trajectory within 18 months of clean placement.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50/80 p-8 rounded-[32px] border border-black/5 relative shadow-inner">
                <div className="absolute -top-3 left-8 px-5 py-1.5 bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                  Principal Strategy
                </div>
                <p className="text-lg italic text-on-surface leading-relaxed font-medium mb-10 pt-4">
                  "The {premiumChange}% variance is slightly above regional authority benchmarks. Recommend deploying the 'Preferred Insured' forensic brief to {client?.name} to justify placement costs."
                </p>
                <button className="w-full py-5 px-10 bg-secondary text-white rounded-full font-black flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-secondary/30 transition-all shadow-lg active:scale-[0.98] text-[10px] uppercase tracking-[0.2em]">
                  <FileText className="w-4 h-4" />
                  Dispatch Forensic Explainer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
