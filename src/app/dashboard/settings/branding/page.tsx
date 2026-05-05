import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getUserAgencyId, getAgency } from '@/actions/data';
import { isFeatureEnabled } from '@/lib/features';

export const dynamic = 'force-dynamic';

export default async function BrandingSettingsPage() {
  const session = await withAuth();
  
  if (!session?.user?.id) {
    redirect("/api/auth/login");
  }

  const agencyId = await getUserAgencyId(session?.user?.id);
  
  if (!agencyId) {
    redirect('/onboarding');
  }

  const agency = await getAgency(agencyId);
  const tier = agency?.subscriptionTier || 'solo';
  const hasWhiteLabel = isFeatureEnabled('whiteLabelPortal', tier as any);

  if (!hasWhiteLabel) {
    redirect('/pricing');
  }

  // Redirect to the existing portal configuration page
  redirect('/dashboard/portal');
}
