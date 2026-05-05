import { redirect } from "next/navigation";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getUserAgencyId, getClients } from "@/actions/data";
import { checkAgencySubscription } from "@/lib/subscription-check";
import { ClientsTable } from "@/components/dashboard/ClientsTable";
import { ImportCSVButton } from "@/components/dashboard/ImportCSVButton";
import { ExportDataButton } from "@/components/dashboard/ExportCSVButton";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
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

  const clients = await getClients(agencyId);

  const totalClients = clients.length;
  const totalPremium = clients.reduce((sum, c) => sum + parseFloat(c.totalPremium?.replace(/[$,]/g, '') || '0'), 0);
  const totalPolicies = clients.reduce((sum, c) => sum + (c.totalPolicies || 0), 0);

  return (
    <div className="space-y-12 font-body pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Book of Business</h1>
          <p className="text-on-surface/50 font-medium mt-1">Complete view of all current placements and client health.</p>
        </div>
        <div className="flex items-center gap-3">
          <ImportCSVButton agencyId={agencyId} />
          <ExportDataButton agencyId={agencyId} dataType="clients" />
        </div>
      </div>

      {/* Metric Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Total Insureds</span>
          <h3 className="text-4xl font-bold tracking-tight text-on-surface">{totalClients}</h3>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Premium Volume</span>
          <h3 className="text-4xl font-bold tracking-tight text-on-surface">${totalPremium.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Policies Bound</span>
          <h3 className="text-4xl font-bold tracking-tight text-on-surface">{totalPolicies}</h3>
        </div>
      </section>

      {/* Table Section */}
      <section className="space-y-6">
        <ClientsTable clients={clients} agencyId={agencyId} />
      </section>

    </div>
  );
}
