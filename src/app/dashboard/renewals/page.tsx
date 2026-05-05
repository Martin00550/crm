import Link from "next/link";
import { redirect } from "next/navigation";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getUserAgencyId, getRenewalsList } from "@/actions/data";
import { checkAgencySubscription } from "@/lib/subscription-check";
import { getRenewalPipeline, getRenewalStats, sendManualRenewalNotification, updateRenewalStatus, createMissingRenewalRecords } from "@/lib/renewals";
import { 
  ExportCSVButton, 
  AddRenewalButton, 
} from "@/components/dashboard/DashboardButtons";
import { RenewalPipelineDashboard } from "@/components/dashboard/RenewalPipelineDashboard";

export const dynamic = "force-dynamic";

export default async function RenewalsPage() {
  const session = await withAuth();
  
  if (!session?.user?.id) {
    redirect("/api/auth/login");
  }

  const agencyId = await getUserAgencyId(session.user.id);
  
  if (!agencyId) {
    redirect("/onboarding");
  }

  const subscriptionCheck = await checkAgencySubscription(agencyId);
  if (!subscriptionCheck.canAccessDashboard) {
    redirect("/checkout?reason=" + encodeURIComponent(subscriptionCheck.reason || 'subscription_required'));
  }

  // Ensure all policies are enrolled in the pipeline
  await createMissingRenewalRecords();

  const [pipeline, renewalStats] = await Promise.all([
    getRenewalPipeline(agencyId),
    getRenewalStats(agencyId),
  ]);

  // Group the pipeline for the traditional view at the bottom
  const days30 = pipeline.filter(p => p.daysUntilRenewal <= 30 && p.daysUntilRenewal >= 0);
  const days60 = pipeline.filter(p => p.daysUntilRenewal <= 60 && p.daysUntilRenewal > 30);
  const days90 = pipeline.filter(p => p.daysUntilRenewal <= 90 && p.daysUntilRenewal > 60);

  return (
    <div className="space-y-12 font-body pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Renewal Pipeline</h1>
          <p className="text-on-surface/50 font-medium mt-1">Monitor and manage your upcoming policy renewals.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportCSVButton data={pipeline} filename="renewals.csv" />
          <AddRenewalButton />
        </div>
      </div>

      {/* Stats Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Total Pipeline</span>
          <h3 className="text-4xl font-bold tracking-tight text-on-surface">{renewalStats.total}</h3>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Policies at Risk</span>
          <h3 className="text-4xl font-bold tracking-tight text-red-500">{renewalStats.days30 + renewalStats.overdue}</h3>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Pipeline Value</span>
          <h3 className="text-4xl font-bold tracking-tight text-on-surface">${pipeline.reduce((sum, p) => sum + parseFloat(p.premium.replace(/[^0-9.-]+/g, "") || "0"), 0).toLocaleString()}</h3>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="space-y-12">
        {/* Automated Notifications Pipeline */}
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-8">
          <h2 className="text-xl font-bold text-on-surface mb-8">Automated Notifications</h2>
          <RenewalPipelineDashboard
            initialPipeline={pipeline}
            initialStats={renewalStats}
            onSendNotification={sendManualRenewalNotification}
            onUpdateStatus={updateRenewalStatus}
          />
        </div>
      </section>
    </div>
  );
}
