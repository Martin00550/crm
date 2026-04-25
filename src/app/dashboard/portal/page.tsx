import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/better-auth';
import { getUserAgencyId, getAgency } from '@/actions/data';
import { isFeatureEnabled } from '@/lib/features';
import { WhiteLabelPortal } from '@/components/dashboard/WhiteLabelPortal';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PortalPage() {
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
  const hasPortal = isFeatureEnabled('whiteLabelPortal', tier as any);

  if (!hasPortal) {
    redirect('/pricing');
  }

  return (
    <div className="space-y-10 font-body text-on-surface">
      <div className="flex items-center gap-5">
        <Link 
          href="/dashboard/settings" 
          className="w-12 h-12 flex items-center justify-center rounded-full bg-surface border border-black/5 text-on-surface/40 hover:text-primary hover:bg-slate-50 transition-all shadow-sm group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight leading-none">Branded Insured Gateway</h1>
          <p className="text-on-surface/60 mt-2 font-medium italic">Configure your exclusive white-label portal deployment for premium insured servicing</p>
        </div>
      </div>

      <WhiteLabelPortal agencyId={agencyId} />
    </div>
  );
}
