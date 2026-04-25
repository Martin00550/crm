import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { getUserAgencyId, getAgency } from "@/actions/data";
import { TrialExpiredModal } from "@/components/dashboard/TrialExpiredModal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user;
  const agencyId = await getUserAgencyId(user.id);
  
  if (!agencyId) {
    redirect('/pricing'); // Redirect to pricing to select a plan and checkout
  }

  const agency = await getAgency(agencyId);
  const tier = agency?.subscriptionTier || 'solo';
  const subscriptionStatus = agency?.subscriptionStatus || 'trialing';
  const trialEnd = agency?.trialEnd ? new Date(agency.trialEnd) : null;

  // Check if trial has expired (use UTC for consistent comparison)
  const now = new Date();
  const isTrialExpired = subscriptionStatus === 'trialing' && trialEnd && trialEnd.getTime() < now.getTime();

  // If trial expired, show the expired modal overlay
  if (isTrialExpired) {
    return (
      <div className="flex min-h-screen bg-slate-50 font-body text-on-surface">
        <div className="w-64 flex-none hidden md:block">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <TopBar 
            userName={user.name || user.email?.split("@")[0]}
            userEmail={user.email}
            agencyId={agencyId || undefined}
            tier={tier}
          />
          <main className="flex-1 p-10 overflow-auto scrollbar-hide">
            <div className="max-w-[1600px] mx-auto">
              <TrialExpiredModal 
                tier={tier}
                trialEndDate={trialEnd}
              />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-body text-on-surface">
      <div className="w-64 flex-none hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar 
          userName={user.name || user.email?.split("@")[0]}
          userEmail={user.email}
          agencyId={agencyId || undefined}
          tier={tier}
        />
        <main className="flex-1 p-10 overflow-auto scrollbar-hide">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
