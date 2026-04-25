import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/better-auth';
import { getUserAgencyId } from '@/actions/data';
import { checkAgencySubscription } from '@/lib/subscription-check';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EmailTemplateBuilder } from '@/components/dashboard/EmailTemplateBuilder';

export const dynamic = 'force-dynamic';

export default async function EmailCampaignsPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const agencyId = await getUserAgencyId(session?.user?.id);
  
  if (!agencyId) {
    redirect('/onboarding');
  }

  // Check subscription status before allowing dashboard access
  const subscriptionCheck = await checkAgencySubscription(agencyId);
  if (!subscriptionCheck.canAccessDashboard) {
    redirect('/checkout?reason=' + encodeURIComponent(subscriptionCheck.reason || 'subscription_required'));
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
          <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight">Email Campaign Templates</h1>
          <p className="text-on-surface/60 mt-2 font-medium italic">Create and manage email templates for renewals and client communications</p>
        </div>
      </div>

      <EmailTemplateBuilder />
    </div>
  );
}
