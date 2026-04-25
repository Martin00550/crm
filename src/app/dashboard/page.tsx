import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth";
import { getDashboardStats, getPolicyLedger, getUserAgencyId } from "@/actions/data";
import { checkAgencySubscription } from "@/lib/subscription-check";
import { OnboardingPanel } from "@/components/dashboard/OnboardingPanel";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Get real agency ID from user profile
  const agencyId = await getUserAgencyId(session?.user?.id);
  
  if (!agencyId) {
    // User hasn't set up an agency yet - redirect to onboarding
    redirect("/onboarding");
  }

  // Check subscription status before allowing dashboard access
  const subscriptionCheck = await checkAgencySubscription(agencyId);
  if (!subscriptionCheck.canAccessDashboard) {
    // Redirect to checkout if no active subscription
    redirect("/checkout?reason=" + encodeURIComponent(subscriptionCheck.reason || 'subscription_required'));
  }
  
  const [stats, ledger] = await Promise.all([
    getDashboardStats(agencyId),
    getPolicyLedger(agencyId),
  ]);

  // Check if user has any policies - show onboarding if empty
  const hasPolicies = stats.totalPolicies > 0;

  // Show onboarding panel if no policies exist
  if (!hasPolicies) {
    return (
      <div className="space-y-8 font-body">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-on-surface mb-2 font-headline italic tracking-tight">Agency Command Center</h1>
            <p className="text-on-surface/60 font-medium italic">Initialize portfolio intelligence infrastructure</p>
          </div>
        </div>

        {/* Onboarding Panel */}
        <OnboardingPanel agencyId={agencyId} />
      </div>
    );
  }

  return (
    <DashboardClient stats={stats} ledger={ledger} agencyId={agencyId} />
  );
}
