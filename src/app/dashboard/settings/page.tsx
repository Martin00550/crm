import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getUserAgencyId, getAgency } from '@/actions/data';
import { checkAgencySubscription } from '@/lib/subscription-check';
import { isFeatureEnabled } from '@/lib/features';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await withAuth();
  
  if (!session?.user?.id) {
    redirect("/api/auth/login");
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

  const agency = await getAgency(agencyId);
  const tier = agency?.subscriptionTier || 'solo';
  const hasWhiteLabel = isFeatureEnabled('whiteLabelPortal', tier as any);

  const settingsItems = [
    {
      name: 'Agency Profile',
      description: 'Update your agency name, contact info, and subdomain',
      href: '/dashboard/settings/profile',
      icon: 'business',
      available: true,
    },
    {
      name: 'White-Label Portal',
      description: 'Customize your branded client portal with logo and colors',
      href: '/dashboard/settings/branding',
      icon: 'palette',
      available: hasWhiteLabel,
      badge: hasWhiteLabel ? undefined : 'Enterprise',
    },
    {
      name: 'Team Members',
      description: 'Manage producer and CSR accounts',
      href: '/dashboard/settings/team',
      icon: 'group',
      available: tier !== 'solo',
      badge: tier === 'solo' ? 'Growth+' : undefined,
    },
    {
      name: 'Notifications',
      description: 'Configure renewal reminders and intelligence alerts',
      href: '/dashboard/settings/notifications',
      icon: 'notifications',
      available: true,
    },
    {
      name: 'Billing & Subscription',
      description: 'Manage your subscription and payment methods',
      href: '/dashboard/settings/billing',
      icon: 'credit_card',
      available: true,
    },
  ];

  return (
    <div className="space-y-10 font-body text-on-surface">
      <div>
        <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight">Agency Command Settings</h1>
        <p className="text-on-surface/60 mt-2 font-medium italic">Configure your agency deployment protocols and intelligence parameters</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        {settingsItems.map((item) => (
          <Link
            key={item.name}
            href={item.available ? item.href : '/pricing'}
            className={`group block p-8 bg-surface rounded-[32px] border border-black/5 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all relative overflow-hidden ${
              !item.available ? 'opacity-60' : ''
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-secondary/10 transition-colors"></div>
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-secondary transition-all group-hover:rotate-3">
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-black text-on-surface italic font-headline tracking-tight leading-none">{item.name}</h3>
                  {item.badge && (
                    <span className="px-3 py-1 text-[10px] font-black bg-secondary/10 text-secondary rounded-full border border-secondary/10 uppercase tracking-widest">
                      {item.badge} Protocol
                    </span>
                  )}
                </div>
                <p className="text-sm text-on-surface/50 font-medium italic leading-relaxed">{item.description}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface/10 group-hover:text-secondary transition-all group-hover:translate-x-1">
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
