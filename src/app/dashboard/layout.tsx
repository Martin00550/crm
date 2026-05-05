import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { TopBar } from "@/components/dashboard/TopBar";
import { ChatBubbleButton } from "@/components/dashboard/DashboardButtons";
import { getUserAgencyId, getAgency } from "@/actions/data";
import { TrialExpiredModal } from "@/components/dashboard/TrialExpiredModal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await withAuth();
  
  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const user = session.user;
  const agencyId = await getUserAgencyId(user.id);
  
  if (!agencyId) {
    redirect('/onboarding');
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
          <Sidebar 
            agencyLogo={agency?.branding?.logoUrl}
            agencyName={agency?.name}
          />
        </div>
        <MobileNav 
          agencyLogo={agency?.branding?.logoUrl}
          agencyName={agency?.name}
        />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <TopBar 
            userName={user.email?.split("@")[0]}
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
        <Sidebar 
          agencyLogo={agency?.branding?.logoUrl}
          agencyName={agency?.name}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar 
          userName={user.email?.split("@")[0]}
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
      
      {/* Global Intelligence Interface */}
      <div className="fixed bottom-8 right-8 z-50">
        <ChatBubbleButton />
      </div>
    </div>
  );
}
