import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { TopBar } from "@/components/dashboard/TopBar";
import { ChatBubbleButton } from "@/components/dashboard/DashboardButtons";
import { getUserAgencyId, getAgency } from "@/actions/data";
import { TrialExpiredModal } from "@/components/dashboard/TrialExpiredModal";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

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

  return (
    <DashboardShell user={user} agency={agency} agencyId={agencyId} tier={tier} currency={agency?.currency}>
      {children}
    </DashboardShell>
  );
}
