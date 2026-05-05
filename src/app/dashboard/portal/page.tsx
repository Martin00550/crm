import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getUserAgencyId, getAgency } from '@/actions/data';
import { isFeatureEnabled } from '@/lib/features';
import { WhiteLabelPortal } from '@/components/dashboard/WhiteLabelPortal';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PortalPage() {
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
          <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight leading-none">White-Label Portal</h1>
          <p className="text-on-surface/60 mt-2 font-medium italic">Customize your branded client portal with logo and colors</p>
        </div>
      </div>

      <WhiteLabelPortal agencyId={agencyId} />
    </div>
  );
}
