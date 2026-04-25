import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth";
import { getUserAgencyId, getRenewalsList } from "@/actions/data";
import { checkAgencySubscription } from "@/lib/subscription-check";
import { getRenewalPipeline, getRenewalStats, sendManualRenewalNotification, updateRenewalStatus } from "@/lib/renewals";
import { 
  ExportCSVButton, 
  AddRenewalButton, 
} from "@/components/dashboard/DashboardButtons";
import { RenewalPipelineDashboard } from "@/components/dashboard/RenewalPipelineDashboard";

export const dynamic = "force-dynamic";

async function getData(agencyId: string) {
  const renewals = await getRenewalsList(agencyId);
  
  const days90 = renewals.filter((p: any) => p.daysOut > 60);
  const days60 = renewals.filter((p: any) => p.daysOut > 30 && p.daysOut <= 60);
  const days30 = renewals.filter((p: any) => p.daysOut <= 30);
  
  const atRisk = renewals.filter((p: any) => p.daysOut <= 30).length;
  const totalPremium = renewals.reduce((sum: number, p: any) => {
    const num = parseFloat(p.premium?.replace(/[^0-9.-]+/g, "") || "0");
    return sum + num;
  }, 0);
  
  return {
    days90,
    days60,
    days30,
    stats: {
      total: renewals.length,
      atRisk,
      premiumValue: totalPremium,
    }
  };
}

function getUrgencyColor(days: number) {
  if (days <= 30) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' };
  if (days <= 60) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' };
  return { bg: 'bg-secondary/5', border: 'border-secondary/10', text: 'text-secondary', badge: 'bg-secondary/10 text-secondary' };
}

export default async function RenewalsPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Get real agency ID from user profile
  const agencyId = await getUserAgencyId(session.user.id);
  
  if (!agencyId) {
    redirect("/onboarding");
  }

  // Check subscription status before allowing dashboard access
  const subscriptionCheck = await checkAgencySubscription(agencyId);
  if (!subscriptionCheck.canAccessDashboard) {
    redirect("/checkout?reason=" + encodeURIComponent(subscriptionCheck.reason || 'subscription_required'));
  }

  // Get renewal pipeline with automated notification tracking
  const [pipeline, renewalStats] = await Promise.all([
    getRenewalPipeline(agencyId),
    getRenewalStats(agencyId),
  ]);

  // Also get legacy data for backward compatibility
  const { days90, days60, days30, stats } = await getData(agencyId);

  return (
    <div className="space-y-8 font-body">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight">Renewal Pipeline</h1>
            <div className="hidden sm:flex items-center gap-2 bg-secondary/5 px-3 py-1 rounded-full border border-secondary/10">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Live Status</span>
            </div>
          </div>
          <p className="text-on-surface/60 font-medium italic">Manage your 90-day retention cycle.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportCSVButton data={[...days90, ...days60, ...days30]} filename="renewals-registry.csv" />
          <AddRenewalButton />
        </div>
      </div>

      {/* Renewal Pipeline Dashboard */}
      <RenewalPipelineDashboard
        initialPipeline={pipeline}
        initialStats={renewalStats}
        onSendNotification={sendManualRenewalNotification}
        onUpdateStatus={updateRenewalStatus}
      />

      {/* Page Content */}
      <div className="space-y-8">
        {/* Stats Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Total Renewal Pipeline</span>
              <span className="material-symbols-outlined text-secondary bg-blue-50 p-2 rounded-lg">autorenew</span>
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">{stats.total}</h3>
              <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">Placements in Cycle</p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Policy Leakage Risk (30d)</span>
              <span className="material-symbols-outlined text-red-500 bg-red-50 p-2 rounded-lg">warning</span>
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">{stats.atRisk}</h3>
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1 flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-xs">priority_high</span>
                Requires Attention
              </p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Premium at Risk</span>
              <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg">account_balance_wallet</span>
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">${stats.premiumValue.toLocaleString()}</h3>
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest mt-1 flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                Total Renewal Value
              </p>
            </div>
          </div>
        </section>

        {/* Pipeline Visualization */}
        <section className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Renewal Lifecycle</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 90 Days Column */}
            <div className="bg-slate-50/50 rounded-[32px] p-6 border border-black/5 shadow-inner">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-secondary rounded-full shadow-sm shadow-secondary/50"></div>
                  <h5 className="font-black text-on-surface italic font-headline tracking-tight text-lg">90 Day Pipeline</h5>
                </div>
                <span className="text-[10px] font-black bg-secondary/10 text-secondary border border-secondary/10 px-3 py-1 rounded-full uppercase tracking-widest">{days90.length} Assets</span>
              </div>
              <div className="space-y-4">
                {days90.map((policy: any) => {
                  const urgency = getUrgencyColor(policy.daysOut);
                  return (
                  <div key={policy.id} className="p-5 bg-white rounded-2xl border border-black/5 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-on-surface text-sm font-headline italic group-hover:text-secondary transition-colors">{policy.clientName}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${urgency.badge}`}>
                        {policy.daysOut}d
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">{policy.policyType}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-black/5">
                        <span className="text-[9px] font-black bg-slate-50 text-on-surface/40 px-2 py-0.5 rounded border border-black/5 uppercase tracking-widest">{policy.carrier}</span>
                        <span className="text-base font-black text-on-surface tracking-tighter font-headline italic">{policy.premium}</span>
                      </div>
                    </div>
                  </div>
                  );
                })}
                {days90.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-[10px] font-black text-on-surface/20 uppercase tracking-[0.2em] italic">No placements in current window</p>
                  </div>
                )}
              </div>
            </div>

            {/* 60 Days Column */}
            <div className="bg-slate-50/50 rounded-[32px] p-6 border border-black/5 shadow-inner">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-amber-500 rounded-full shadow-sm shadow-amber-500/50"></div>
                  <h5 className="font-black text-on-surface italic font-headline tracking-tight text-lg">60 Day Window</h5>
                </div>
                <span className="text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-full uppercase tracking-widest">{days60.length} Assets</span>
              </div>
              <div className="space-y-4">
                {days60.map((policy: any) => {
                  const urgency = getUrgencyColor(policy.daysOut);
                  return (
                  <div key={policy.id} className="p-5 bg-white rounded-2xl border border-black/5 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-on-surface text-sm font-headline italic group-hover:text-amber-600 transition-colors">{policy.clientName}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${urgency.badge}`}>
                        {policy.daysOut}d
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">{policy.policyType}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-black/5">
                        <span className="text-[9px] font-black bg-slate-50 text-on-surface/40 px-2 py-0.5 rounded border border-black/5 uppercase tracking-widest">{policy.carrier}</span>
                        <span className="text-base font-black text-on-surface tracking-tighter font-headline italic">{policy.premium}</span>
                      </div>
                    </div>
                  </div>
                  );
                })}
                {days60.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-[10px] font-black text-on-surface/20 uppercase tracking-[0.2em] italic">No placements in current window</p>
                  </div>
                )}
              </div>
            </div>

            {/* 30 Days Column */}
            <div className="bg-slate-50/50 rounded-[32px] p-6 border border-black/5 shadow-inner">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm shadow-red-500/50 animate-pulse"></div>
                  <h5 className="font-black text-on-surface italic font-headline tracking-tight text-lg">Leakage Risk</h5>
                </div>
                <span className="text-[10px] font-black bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full uppercase tracking-widest">{days30.length} Assets</span>
              </div>
              <div className="space-y-4">
                {days30.map((policy: any) => {
                  const urgency = getUrgencyColor(policy.daysOut);
                  return (
                  <div key={policy.id} className="p-5 bg-white rounded-2xl border border-black/5 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-on-surface text-sm font-headline italic group-hover:text-red-600 transition-colors">{policy.clientName}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${urgency.badge}`}>
                        {policy.daysOut}d
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">{policy.policyType}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-black/5">
                        <span className="text-[9px] font-black bg-slate-50 text-on-surface/40 px-2 py-0.5 rounded border border-black/5 uppercase tracking-widest">{policy.carrier}</span>
                        <span className="text-base font-black text-on-surface tracking-tighter font-headline italic">{policy.premium}</span>
                      </div>
                    </div>
                  </div>
                  );
                })}
                {days30.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-[10px] font-black text-on-surface/20 uppercase tracking-[0.2em] italic">Registry Secure. No leakage detected.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
