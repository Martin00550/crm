import { redirect } from 'next/navigation';
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getUserAgencyId, getAgency } from '@/actions/data';
import { checkAgencySubscription } from '@/lib/subscription-check';
import Link from 'next/link';
import { ArrowLeft, Building2, Globe, ExternalLink } from 'lucide-react';
import { AgencyProfileForm } from '@/components/dashboard/AgencyProfileForm';
import { PasswordChangeForm } from '@/components/dashboard/PasswordChangeForm';

export const dynamic = 'force-dynamic';

export default async function AgencyProfilePage() {
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <Link 
          href="/dashboard/settings" 
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-black/5 text-on-surface/40 hover:text-secondary hover:shadow-md transition-all shadow-sm group shrink-0"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-on-surface font-headline italic tracking-tight leading-none">Agency Profile</h1>
          <p className="text-on-surface/60 mt-2 font-medium italic text-sm md:text-base">Update your official agency name, contact information, and custom subdomain</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-8">
          <AgencyProfileForm agency={agency} />
          <PasswordChangeForm />
        </div>

        {/* Info Sidebar */}
        <div className="space-y-8">
          {/* Current Status Card */}
          <div className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-secondary/10 transition-colors"></div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/10">
                <Building2 className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Agency Status</h3>
            </div>
            <div className="space-y-5 relative z-10">
              <div className="flex flex-col gap-1 border-b border-black/5 pb-3">
                <span className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">Official Entity</span>
                <span className="text-sm font-bold text-on-surface italic font-headline">{agency?.name || 'Name not set'}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-black/5 pb-3">
                <span className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">Exclusive Domain</span>
                <span className="text-sm font-bold text-on-surface italic font-headline break-all">
                  {agency?.subscriptionTier === 'enterprise' && agency?.subdomain 
                    ? `${agency.subdomain}.retainvault.com` 
                    : agency?.subscriptionTier === 'enterprise' 
                    ? 'ID pending' 
                    : 'Not Configured'
                  }
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">Subscription Tier</span>
                <div>
                  <span className="inline-block px-3 py-1 text-[10px] font-black bg-secondary/10 text-secondary border border-secondary/10 rounded-full uppercase tracking-widest">
                    {agency?.subscriptionTier || 'solo'} plan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Portal Preview */}
          {agency?.subdomain && agency.subscriptionTier === 'enterprise' && (
            <div className="bg-white rounded-[32px] border border-black/5 shadow-sm p-8 group hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/10">
                  <Globe className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Live Gateway</h3>
              </div>
              <a
                href={`https://${agency.subdomain}.retainvault.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5 bg-background border border-black/5 rounded-2xl hover:bg-white hover:shadow-inner transition-all group/link"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-black text-on-surface italic font-headline text-lg tracking-tight group-hover/link:text-secondary transition-colors break-all leading-tight mb-2">
                      {agency.subdomain}.retainvault.com
                    </p>
                    <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Authorized client portal</p>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/5 group-hover/link:rotate-12 transition-all">
                    <ExternalLink className="w-5 h-5 text-on-surface/20 group-hover/link:text-secondary" />
                  </div>
                </div>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
