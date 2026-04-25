import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/better-auth';
import { getUserAgencyId, getAgency } from '@/actions/data';
import { PaddleCheckout } from '@/components/ui/PaddleCheckout';
import { SUBSCRIPTION_TIERS } from '@/lib/paddle';
import Link from 'next/link';
import { ArrowLeft, Check, CreditCard, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

const TIERS = Object.entries(SUBSCRIPTION_TIERS).map(([id, tier]) => ({
  id: id as 'solo' | 'growth' | 'enterprise',
  name: tier.name,
  price: tier.price,
  features: tier.features,
}));

export default async function BillingPage() {
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
  const currentTier = agency?.subscriptionTier || 'solo';
  const subscriptionStatus = agency?.subscriptionStatus || 'trialing';
  const trialEnd = agency?.trialEnd ? new Date(agency.trialEnd) : null;
  const isTrialActive = subscriptionStatus === 'trialing' && trialEnd && trialEnd > new Date();
  const daysRemaining = isTrialActive && trialEnd 
    ? Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) 
    : 0;

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
          <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight leading-none">Billing & Subscription</h1>
          <p className="text-on-surface/60 mt-2 font-medium italic">Manage your subscription and payment methods</p>
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-surface rounded-[32px] p-8 border border-black/5 shadow-sm">
        <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-6">Current Plan</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-on-surface font-headline italic capitalize">{currentTier} Plan</p>
            <p className="text-sm text-on-surface/60 mt-1">
              Status: <span className="font-bold capitalize">{subscriptionStatus}</span>
            </p>
            {isTrialActive && (
              <div className="flex items-center gap-2 mt-2 text-secondary">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-bold">{daysRemaining} days left in trial</span>
              </div>
            )}
          </div>
          <div className="px-6 py-3 bg-secondary/10 rounded-full">
            <p className="text-secondary font-black">${TIERS.find(t => t.id === currentTier)?.price}/month</p>
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      <div>
        <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-6">Upgrade Options</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier) => {
            const isCurrentTier = tier.id === currentTier;
            const isUpgrade = TIERS.indexOf(tier) > TIERS.findIndex(t => t.id === currentTier);

            return (
              <div
                key={tier.id}
                className={`rounded-[32px] p-8 border-2 transition-all ${
                  isCurrentTier
                    ? 'border-secondary bg-secondary/5'
                    : 'border-black/5 bg-white'
                }`}
              >
                <div className="mb-6">
                  <h4 className="text-xl font-black text-on-surface font-headline italic">{tier.name}</h4>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-4xl font-black text-on-surface">${tier.price}</span>
                    <span className="text-on-surface/40 text-sm">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-on-surface/70">
                      <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrentTier ? (
                  <button
                    disabled
                    className="w-full px-6 py-3 bg-secondary text-white font-bold rounded-full text-sm opacity-50 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : isUpgrade ? (
                  <PaddleCheckout
                    tier={tier.id as 'solo' | 'growth' | 'enterprise'}
                    agencyId={agencyId}
                    customerId={agency?.paddleCustomerId || undefined}
                  />
                ) : (
                  <button
                    disabled
                    className="w-full px-6 py-3 bg-slate-100 text-on-surface/40 font-bold rounded-full text-sm cursor-not-allowed"
                  >
                    Downgrade Not Available
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-slate-50/50 rounded-[32px] p-8 border border-black/5">
        <div className="flex items-start gap-4">
          <CreditCard className="w-6 h-6 text-on-surface/40 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-on-surface mb-2">Secure Payment Processing</h4>
            <p className="text-sm text-on-surface/60">
              All payments are processed securely through Paddle. You'll receive email receipts for all transactions.
              Your subscription will automatically renew each month until cancelled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
