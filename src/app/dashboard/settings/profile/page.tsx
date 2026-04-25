import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/better-auth';
import { getUserAgencyId, getAgency } from '@/actions/data';
import { checkAgencySubscription } from '@/lib/subscription-check';
import { isFeatureEnabled } from '@/lib/features';
import Link from 'next/link';
import { ArrowLeft, Building2, Globe, Phone, Mail, MapPin, Clock, ExternalLink, Lock } from 'lucide-react';
import { AgencyProfileForm } from '@/components/dashboard/AgencyProfileForm';
import { PasswordChangeForm } from '@/components/dashboard/PasswordChangeForm';

export const dynamic = 'force-dynamic';

export default async function AgencyProfilePage() {
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

  const agency = await getAgency(agencyId);

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
          <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight leading-none">Agency Identity Profile</h1>
          <p className="text-on-surface/60 mt-2 font-medium italic">Update your official agency name, contact protocols, and exclusive deployment subdomain</p>
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
          <div className="bg-surface rounded-[32px] p-8 border border-black/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-secondary/5 transition-colors"></div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Deployment Status</h3>
            </div>
            <div className="space-y-5 relative z-10">
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Official Entity</span>
                <span className="text-sm font-bold text-on-surface italic font-headline">{agency?.name || 'Protocol pending'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Exclusive Domain</span>
                <span className="text-sm font-bold text-on-surface italic font-headline">
                  {agency?.subscriptionTier === 'enterprise' && agency?.subdomain 
                    ? `${agency.subdomain}.bookguard.tech` 
                    : agency?.subscriptionTier === 'enterprise' 
                    ? 'ID pending' 
                    : 'Expansion required'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Command Tier</span>
                <span className="px-3 py-1 text-[10px] font-black bg-secondary/10 text-secondary border border-secondary/10 rounded-full uppercase tracking-widest">
                  {agency?.subscriptionTier || 'solo'} protocol
                </span>
              </div>
            </div>
          </div>

          {/* Portal Preview */}
          {agency?.subdomain && agency.subscriptionTier === 'enterprise' && (
            <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm p-8 group hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Live Gateway</h3>
              </div>
              <a
                href={`https://${agency.subdomain}.bookguard.tech`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5 bg-slate-50/50 border border-black/5 rounded-2xl hover:bg-white hover:shadow-inner transition-all group/link"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-on-surface italic font-headline text-lg tracking-tight group-hover/link:text-primary transition-colors">{agency.subdomain}.bookguard.tech</p>
                    <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">Authorized client portal</p>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/5 group-hover/link:rotate-12 transition-all">
                    <ExternalLink className="w-5 h-5 text-on-surface/20 group-hover/link:text-secondary" />
                  </div>
                </div>
              </a>
            </div>
          )}

          {/* Contact Info Tips */}
          <div className="bg-amber-50 border border-amber-100 rounded-[32px] p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center border border-amber-200 shadow-sm">
                <span className="material-symbols-outlined text-amber-700">lightbulb</span>
              </div>
              <div>
                <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-[0.2em] mb-4">Command Tips</h4>
                <ul className="text-xs text-amber-800/70 space-y-3 font-medium italic">
                  <li className="flex items-start gap-2"><span className="text-amber-400 font-bold">•</span> Project authority using your official legal entity identifier</li>
                  <li className="flex items-start gap-2"><span className="text-amber-400 font-bold">•</span> Choose an exclusive subdomain that clients recognize instantly</li>
                  <li className="flex items-start gap-2"><span className="text-amber-400 font-bold">•</span> Maintain accurate contact protocols for rapid response</li>
                  <li className="flex items-start gap-2"><span className="text-amber-400 font-bold">•</span> Consistent operational windows build insured trust</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
