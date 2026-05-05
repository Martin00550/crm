import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getUserAgencyId, getPolicyLeakageRisk, getAgency } from "@/actions/data";
import { checkAgencySubscription } from "@/lib/subscription-check";
import { isFeatureEnabled } from "@/lib/features";
import { AlertTriangle, Shield, TrendingUp, DollarSign, AlertCircle, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { GenerateAIReportButton } from "@/components/dashboard/GenerateAIReportButton";
import { lazy } from "react";
import nextDynamic from "next/dynamic";

// Lazy load heavy dashboard component
const PolicyLeakageDashboard = nextDynamic(() => import("@/components/dashboard/PolicyLeakageDashboard").then(m => ({ default: m.PolicyLeakageDashboard })), {
  loading: () => <div className="p-8 text-center text-on-surface/40">Loading risk dashboard...</div>,
  ssr: false
});

export const dynamic = "force-dynamic";

function getRiskLevelColor(level: string) {
  switch (level) {
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-green-100 text-green-700 border-green-200';
  }
}

function getRiskScoreColor(score: number) {
  if (score >= 70) return 'text-red-600';
  if (score >= 50) return 'text-orange-600';
  if (score >= 30) return 'text-amber-600';
  return 'text-green-600';
}

export default async function RiskPage() {
  const session = await withAuth();
  
  if (!session?.user?.id) {
    redirect("/api/auth/login");
  }

  const agencyId = await getUserAgencyId(session.user.id);
  
  if (!agencyId) {
    redirect("/onboarding");
  }

  // Check subscription status before allowing dashboard access
  const subscriptionCheck = await checkAgencySubscription(agencyId);
  if (!subscriptionCheck.canAccessDashboard) {
    redirect("/checkout?reason=" + encodeURIComponent(subscriptionCheck.reason || 'subscription_required'));
  }

  // Get agency and check feature access
  const agency = await getAgency(agencyId);
  const tier = agency?.subscriptionTier || 'solo';
  
  // Check if policy leakage dashboard is enabled for this tier
  const hasRiskDashboard = isFeatureEnabled('policyLeakageDashboard', tier);
  
  if (!hasRiskDashboard) {
    return (
      <div className="space-y-8 font-body text-on-surface">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 shadow-sm">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-on-surface italic font-headline tracking-tight">Policy Leakage Risk</h1>
            <p className="text-on-surface/60 font-medium italic">Identify at-risk policies before renewal to prevent revenue loss</p>
          </div>
        </div>

        {/* Upgrade Prompt */}
        <div className="bg-slate-50/50 border border-black/5 rounded-[32px] p-12 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-black/5">
            <Lock className="w-8 h-8 text-on-surface/20" />
          </div>
          <h3 className="text-xl font-black text-on-surface italic font-headline mb-2">Risk Analysis Locked</h3>
          <p className="text-sm text-on-surface/40 font-medium italic mb-8 max-w-md mx-auto">
            Upgrade to Growth tier to access the Policy Leakage Risk Dashboard and identify at-risk policies before renewal.
          </p>
          <Link 
            href="/pricing"
            className="px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-xl transition-all active:scale-[0.98] inline-block"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    );
  }

  const riskData = await getPolicyLeakageRisk(agencyId);
  const { policies, summary } = riskData;

  // Check if we should use the client-side dashboard component
  const useClientDashboard = policies.length > 50; // Use client component for large datasets

  // Get top 5 highest risk policies for AI report
  const topRiskPolicies = policies.slice(0, 5);
  const aiReportPrompt = topRiskPolicies.length > 0
    ? `Analyze these ${topRiskPolicies.length} highest-risk policies and provide retention strategies:\n${topRiskPolicies.map((p: any, i: number) => 
        `${i + 1}. ${p.policyNumber} - ${p.clientName} (${p.riskLevel} risk, score: ${p.riskScore}, ${p.daysUntilRenewal} days until renewal, $${p.potentialLoss.toLocaleString()} potential loss)`
      ).join('\n')}`
    : null;

  return (
    <div className="space-y-8 font-body text-on-surface">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 shadow-sm">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-on-surface italic font-headline tracking-tight">Policy Leakage Risk</h1>
            <p className="text-on-surface/60 font-medium italic">Identify at-risk policies before renewal to prevent revenue loss</p>
          </div>
        </div>
        {aiReportPrompt && (
          <GenerateAIReportButton prompt={aiReportPrompt} />
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Policies */}
        <div className="bg-surface p-6 rounded-[24px] border border-black/5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-slate-600" />
            </div>
            <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Total Active</span>
          </div>
          <p className="text-3xl font-black text-on-surface font-headline italic tracking-tight">{summary.totalPolicies}</p>
          <p className="text-xs text-on-surface/40 font-medium mt-1">policies analyzed</p>
        </div>

        {/* Critical Risk */}
        <div className="bg-red-50 p-6 rounded-[24px] border border-red-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Critical</span>
          </div>
          <p className="text-3xl font-black text-red-700 font-headline italic tracking-tight">{summary.criticalRisk}</p>
          <p className="text-xs text-red-600/60 font-medium mt-1">immediate action needed</p>
        </div>

        {/* High Risk */}
        <div className="bg-orange-50 p-6 rounded-[24px] border border-orange-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">High</span>
          </div>
          <p className="text-3xl font-black text-orange-700 font-headline italic tracking-tight">{summary.highRisk}</p>
          <p className="text-xs text-orange-600/60 font-medium mt-1">close monitoring</p>
        </div>

        {/* Medium Risk */}
        <div className="bg-amber-50 p-6 rounded-[24px] border border-amber-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Medium</span>
          </div>
          <p className="text-3xl font-black text-amber-700 font-headline italic tracking-tight">{summary.mediumRisk}</p>
          <p className="text-xs text-amber-600/60 font-medium mt-1">needs attention</p>
        </div>

        {/* Potential Loss */}
        <div className="bg-surface p-6 rounded-[24px] border border-black/5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">At Risk</span>
          </div>
          <p className="text-3xl font-black text-primary font-headline italic tracking-tight">
            ${summary.totalPotentialLoss.toLocaleString()}
          </p>
          <p className="text-xs text-on-surface/40 font-medium mt-1">potential revenue loss</p>
        </div>
      </div>

      {/* Risk Score Distribution */}
      <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-black/5 bg-slate-50/50">
          <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Risk Score Distribution</h3>
        </div>
        <div className="p-8">
          <div className="flex items-center gap-4">
            {/* Critical */}
            <div className="flex-1">
              <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${summary.totalPolicies > 0 ? (summary.criticalRisk / summary.totalPolicies) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-2">
                Critical ({summary.criticalRisk})
              </p>
            </div>
            {/* High */}
            <div className="flex-1">
              <div className="h-3 bg-orange-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${summary.totalPolicies > 0 ? (summary.highRisk / summary.totalPolicies) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-2">
                High ({summary.highRisk})
              </p>
            </div>
            {/* Medium */}
            <div className="flex-1">
              <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${summary.totalPolicies > 0 ? (summary.mediumRisk / summary.totalPolicies) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-2">
                Medium ({summary.mediumRisk})
              </p>
            </div>
            {/* Low */}
            <div className="flex-1">
              <div className="h-3 bg-green-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${summary.totalPolicies > 0 ? (summary.lowRisk / summary.totalPolicies) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-2">
                Low ({summary.lowRisk})
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-black/5 flex items-center justify-between">
            <span className="text-sm text-on-surface/60 font-medium">Average Risk Score</span>
            <span className={`text-2xl font-black font-headline italic ${getRiskScoreColor(summary.avgRiskScore)}`}>
              {summary.avgRiskScore}
            </span>
          </div>
        </div>
      </div>

      {/* Policies Table */}
      {useClientDashboard ? (
        <PolicyLeakageDashboard policies={policies} summary={summary} />
      ) : (
        <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-black/5 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">At-Risk Policy Registry</h3>
            <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">
              Showing top {policies.length} highest risk
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/5 bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Policy</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Carrier</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Premium</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Days to Renewal</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Risk Score</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Risk Level</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Risk Factors</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {policies.map((policy: any) => (
                  <tr key={policy.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <Link 
                        href={`/dashboard/policy/${policy.id}`}
                        className="font-headline italic font-bold text-on-surface hover:text-primary transition-colors text-base tracking-tight"
                      >
                        {policy.policyNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-bold text-on-surface text-sm">{policy.clientName}</p>
                        <p className="text-[10px] text-on-surface/40 font-medium">{policy.clientIndustry || 'General Industry'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-on-surface font-medium text-sm">
                        <span className="material-symbols-outlined text-xs text-on-surface/20">shield</span>
                        {policy.carrier}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-headline italic font-black text-lg text-on-surface tracking-tighter">
                        {policy.premium}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        policy.daysUntilRenewal <= 30 
                          ? 'bg-red-50 text-red-600 border-red-100' 
                          : policy.daysUntilRenewal <= 60 
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {policy.daysUntilRenewal} days
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              policy.riskScore >= 70 ? 'bg-red-500' :
                              policy.riskScore >= 50 ? 'bg-orange-500' :
                              policy.riskScore >= 30 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${policy.riskScore}%` }}
                          />
                        </div>
                        <span className={`text-sm font-black ${getRiskScoreColor(policy.riskScore)}`}>
                          {policy.riskScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRiskLevelColor(policy.riskLevel)}`}>
                        {policy.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {policy.riskFactors.slice(0, 2).map((factor: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-on-surface/60 text-[9px] font-bold rounded-full">
                            {factor}
                          </span>
                        ))}
                        {policy.riskFactors.length > 2 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-on-surface/40 text-[9px] font-bold rounded-full">
                            +{policy.riskFactors.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center">
                        <Link
                          href={`/dashboard/policy/${policy.id}`}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-black/5 text-on-surface/40 hover:text-primary hover:bg-white hover:shadow-sm transition-all"
                          title="View Policy Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {policies.length === 0 && (
              <div className="p-12 text-center bg-white">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-sm font-black text-on-surface/40 uppercase tracking-widest">No At-Risk Policies Detected</p>
                <p className="text-xs text-on-surface/30 font-medium mt-2">Your portfolio is in excellent condition</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Insights Card */}
      {summary.criticalRisk > 0 && aiReportPrompt && (
        <div className="bg-primary text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">auto_awesome</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">AI Risk Intelligence</span>
                </div>
                <h3 className="text-2xl font-black font-headline italic tracking-tight mb-2">
                  {summary.criticalRisk} Critical Policies Require Immediate Attention
                </h3>
                <p className="text-white/70 font-medium max-w-xl">
                  These policies have the highest leakage risk due to upcoming renewals, premium increases, or health score concerns. 
                  Proactive engagement can help retain ${summary.totalPotentialLoss.toLocaleString()} in potential revenue.
                </p>
              </div>
              <GenerateAIReportButton 
                prompt={aiReportPrompt} 
                label="Generate Retention Strategy" 
                variant="secondary" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
