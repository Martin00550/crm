import { redirect } from 'next/navigation';
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getUserAgencyId, getAgency } from '@/actions/data';
import { checkAgencySubscription } from '@/lib/subscription-check';
import { NotificationSettings } from '@/components/dashboard/NotificationSettings';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NotificationSettingsPage() {
  const session = await withAuth();
  
  if (!session?.user?.id) {
    redirect("/api/auth/login");
  }

  const agencyId = await getUserAgencyId(session?.user?.id);
  
  if (!agencyId) {
    redirect('/onboarding');
  }

  const subscriptionCheck = await checkAgencySubscription(agencyId);
  if (!subscriptionCheck.canAccessDashboard) {
    redirect('/checkout?reason=' + encodeURIComponent(subscriptionCheck.reason || 'subscription_required'));
  }

  const agency = await getAgency(agencyId);

  return (
    <div className="space-y-10 font-body text-on-surface">
      <div className="flex items-center gap-5">
        <Link 
          href="/dashboard/settings" 
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-black/5 text-on-surface/40 hover:text-secondary hover:shadow-md transition-all shadow-sm group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight leading-none">Notifications</h1>
          <p className="text-on-surface/60 mt-2 font-medium italic">Configure your automated renewal reminder protocols and intelligence delivery</p>
        </div>
      </div>

      <div className="max-w-4xl">
        <NotificationSettings
          agencyId={agencyId}
          initialSettings={{
            renewalNotifications: agency?.branding?.renewalNotifications ?? true,
            email90Day: agency?.branding?.email90Day ?? true,
            email60Day: agency?.branding?.email60Day ?? true,
            email30Day: agency?.branding?.email30Day ?? true,
            notifyOnExpiry: agency?.branding?.notifyOnExpiry ?? true,
            dailyDigest: agency?.branding?.dailyDigest ?? false,
            commissionAlerts: agency?.branding?.commissionAlerts ?? true,
          }}
        />
      </div>
    </div>
  );
}
