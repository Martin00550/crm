import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Shield, TrendingUp } from "lucide-react";
import { getPolicyDetails } from "@/actions/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DocumentsSection } from "@/components/dashboard/DocumentsSection";
import { AuthorizeUpdatesButton, DispatchExplainerButton } from "@/components/dashboard/PolicyDetailClientButtons";
import { MetricComparison } from "@/components/dashboard/MetricComparison";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PolicyDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getPolicyDetails(id);

  if (!data) {
    notFound();
  }

  const { policy, client, premiumChange } = data;
  const expirationDate = new Date(policy.expirationDate);
  const isValidDate = !isNaN(expirationDate.getTime());
  const daysUntilRenewal = isValidDate ? Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="space-y-12 font-body pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link 
              href={`/dashboard/clients/${client.id}`}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-black/5 text-on-surface/40 hover:text-primary transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-4xl font-black text-on-surface tracking-tight leading-none">{policy.policyType}</h1>
          </div>
          <div className="flex items-center gap-4 text-on-surface/50 font-medium ml-14">
            <span className="text-sm">{client.name}</span>
            <span className="text-on-surface/10">•</span>
            <span className="text-sm">{policy.carrier}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <DispatchExplainerButton policyId={id} />
          <AuthorizeUpdatesButton />
        </div>
      </div>

      {/* Metric Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col justify-between group hover:border-secondary/20 transition-all">
          <div className="mb-8">
            <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] block mb-2">Annual Premium</span>
            <h3 className="text-4xl font-bold tracking-tight text-on-surface">{formatCurrency(policy.premium)}</h3>
          </div>
          <MetricComparison 
            current={policy.premium} 
            previous={policy.previousTermPremium || undefined} 
            trend={premiumChange > 0 ? "down" : "up"} 
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
            <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] block mb-2">Policy Health Index</span>
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
          {/* Main Content Area */}
          <div className="bg-white p-10 rounded-[32px] border border-black/5 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-bold text-on-surface">Placement Analysis</h3>
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
                  <p className="text-[10px] text-on-surface/40 font-medium">Verified Carrier Placement</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-black/5">
                  <span className="text-[9px] font-black text-on-surface/20 uppercase tracking-widest block mb-2">Effective Date</span>
                  <p className="text-sm font-bold text-on-surface mb-1">{formatDate(policy.effectiveDate)}</p>
                  <p className="text-[10px] text-on-surface/40 font-medium">Last Placement Update</p>
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
                    {policy.previousTermPremium ? formatCurrency(policy.previousTermPremium) : 'N/A'}
                  </div>
                </div>
                <span className="text-[9px] font-bold text-on-surface/20 uppercase tracking-widest">Prior Period</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-6">
                <div className="w-full bg-secondary rounded-[24px] relative group transition-all shadow-lg" style={{ height: '100%' }}>
                  <div className="absolute top-[-32px] left-1/2 -translate-x-1/2 font-bold text-on-surface text-xs">
                    {formatCurrency(policy.currentTermPremium || policy.premium)}
                  </div>
                </div>
                <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">Current Term</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <DocumentsSection policyId={id} agencyId={policy.agencyId} />
          
          <div className="bg-on-surface p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 block mb-4">Coverage Status</span>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-bold">Active Placement</h4>
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
    </div>
  );
}
