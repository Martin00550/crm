import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/better-auth';
import { getUserAgencyId, getAgency } from '@/actions/data';
import { isFeatureEnabled } from '@/lib/features';

export const dynamic = 'force-dynamic';

export default async function BrandingSettingsPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  if (!session?.user?.id) {
    redirect('/sign-in');
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
