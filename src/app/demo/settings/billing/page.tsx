"use client";

import Link from 'next/link';
import { ArrowLeft, Check, CreditCard, Clock } from 'lucide-react';
import { SUBSCRIPTION_TIERS } from '@/lib/paddle-shared';

const TIERS = Object.entries(SUBSCRIPTION_TIERS).map(([id, tier]) => ({
  id: id as 'solo' | 'growth' | 'enterprise',
  name: tier.name,
  price: tier.price,
  features: tier.features,
}));

export default function DemoBillingPage() {
  const currentTier = 'growth';
  const subscriptionStatus = 'active';
  const trialEnd = null;
  const isTrialActive = false;
  const daysRemaining = 0;

  return (
    <div className="space-y-10 font-body text-on-surface">
      <div className="flex items-center gap-5">
        <Link
          href="/demo/settings"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-black/5 text-on-surface/40 hover:text-secondary hover:shadow-md transition-all shadow-sm group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight leading-none">Billing</h1>
          <p className="text-on-surface/60 mt-2 font-medium italic">Manage your subscription and deployment authority (Demo)</p>
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-secondary/10 transition-colors"></div>
        <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-6 relative z-10">Current Plan</h3>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-2xl font-black text-on-surface font-headline italic capitalize">{currentTier} Plan</p>
            <p className="text-sm text-on-surface/60 mt-1">
              Status: <span className="font-bold capitalize">{subscriptionStatus}</span>
            </p>
          </div>
          <div className="px-6 py-3 bg-secondary/10 rounded-full border border-secondary/10">
            <p className="text-secondary font-black tracking-tight">${TIERS.find(t => t.id === currentTier)?.price}/month</p>
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
                className={`rounded-[32px] p-8 border-2 transition-all group ${
                  isCurrentTier
                    ? 'border-secondary bg-secondary/5'
                    : 'border-black/5 bg-white hover:border-black/10'
                }`}
              >
                <div className="mb-6">
                  <h4 className="text-xl font-black text-on-surface font-headline italic">{tier.name}</h4>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-4xl font-black text-on-surface tracking-tighter">${tier.price}</span>
                    <span className="text-on-surface/40 text-sm font-medium">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-on-surface/70 font-medium">
                      <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrentTier ? (
                  <button
                    disabled
                    className="w-full px-6 py-4 bg-secondary/20 text-secondary font-black rounded-2xl text-xs uppercase tracking-widest cursor-not-allowed"
                  >
                    Current Active Plan
                  </button>
                ) : isUpgrade ? (
                  <button
                    onClick={() => alert('Paddle Checkout is disabled in demo mode.')}
                    className="w-full px-6 py-4 bg-secondary text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:shadow-xl transition-all"
                  >
                    Upgrade Now
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-6 py-4 bg-background text-on-surface/20 font-black rounded-2xl text-xs uppercase tracking-widest cursor-not-allowed"
                  >
                    Downgrade Restricted
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-background rounded-[32px] p-8 border border-black/5 group">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-black/5 shadow-sm text-on-surface/20 group-hover:text-secondary transition-colors">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-on-surface mb-2 font-headline italic">Secure Payment Processing</h4>
            <p className="text-sm text-on-surface/50 font-medium leading-relaxed italic">
              All payments are processed securely through Paddle. You&apos;ll receive email receipts for all transactions.
              Your subscription will automatically renew each month until cancelled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
