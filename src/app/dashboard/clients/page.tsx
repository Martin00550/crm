import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth";
import { getUserAgencyId, getClients } from "@/actions/data";
import { checkAgencySubscription } from "@/lib/subscription-check";
import { 
  ChatBubbleButton, 
  NotificationButton, 
  SettingsButton 
} from "@/components/dashboard/DashboardButtons";
import { ClientsTable } from "@/components/dashboard/ClientsTable";
import { ImportCSVButton } from "@/components/dashboard/ImportCSVButton";
import { ExportDataButton } from "@/components/dashboard/ExportCSVButton";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
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

  const clients = await getClients(agencyId);

  const totalClients = clients.length;
  const totalPremium = clients.reduce((sum, c) => sum + parseFloat(c.totalPremium?.replace(/[$,]/g, '') || '0'), 0);
  const totalPolicies = clients.reduce((sum, c) => sum + (c.totalPolicies || 0), 0);

  return (
    <div className="space-y-8 font-body">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight">Book of Business</h1>
            <div className="hidden sm:flex items-center gap-2 bg-secondary/5 px-3 py-1 rounded-full border border-secondary/10">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Live Status</span>
            </div>
          </div>
          <p className="text-on-surface/60 font-medium italic">Complete view of all current placements and health</p>
        </div>
        <div className="flex items-center gap-3">
          <ImportCSVButton agencyId={agencyId} />
          <ExportDataButton agencyId={agencyId} dataType="clients" />
        </div>
      </div>

      {/* Page Content */}
      <div className="space-y-8">
        {/* Metric Ribbon */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Total Insureds</span>
              <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg">people</span>
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">{totalClients}</h3>
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest mt-1">Active Accounts</p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Total Premium Volume</span>
              <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg">account_balance_wallet</span>
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">${totalPremium.toLocaleString()}</h3>
              <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">Book of Business Volume</p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Active Policies</span>
              <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg">description</span>
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter text-on-surface font-headline italic">{totalPolicies}</h3>
              <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">Policies in Force</p>
            </div>
          </div>
        </section>

        {/* Table Section */}
        <section className="lg:col-span-8 space-y-6">
          <ClientsTable clients={clients} agencyId={agencyId} />
        </section>
      </div>
      <div className="fixed bottom-6 right-6 z-50">
        <ChatBubbleButton />
      </div>
    </div>
  );
}
