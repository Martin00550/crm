'use client';

import { useRouter } from 'next/navigation';
import { Clock, CreditCard, AlertTriangle } from 'lucide-react';

interface TrialExpiredModalProps {
  tier: string;
  trialEndDate: Date | null;
}

export function TrialExpiredModal({ tier, trialEndDate }: TrialExpiredModalProps) {
  const router = useRouter();

  const tierPrices = {
    solo: 99,
    growth: 249,
    enterprise: 499,
  };

  const tierNames = {
    solo: 'Solo Agent',
    growth: 'Growth Agency',
    enterprise: 'Enterprise',
  };

  const price = tierPrices[tier as keyof typeof tierPrices] || 99;
  const tierName = tierNames[tier as keyof typeof tierNames] || 'Solo Agent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] p-10 max-w-md w-full mx-4 shadow-2xl border border-black/5">
        {/* Icon */}
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-on-surface text-center mb-2 font-headline italic">
          Trial Period Expired
        </h2>
        
        <p className="text-on-surface/60 text-center mb-6 font-medium">
          Your 14-day free trial ended on{' '}
          {trialEndDate?.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}.
        </p>

        {/* Selected Plan */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-on-surface">{tierName}</p>
              <p className="text-xs text-on-surface/40">Selected plan</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-on-surface">${price}</p>
              <p className="text-xs text-on-surface/40">/month</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push('/dashboard/settings/billing')}
          className="w-full py-4 bg-primary text-white font-black rounded-full hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
        >
          <CreditCard className="w-4 h-4" />
          Subscribe Now
        </button>

        {/* Help Link */}
        <p className="text-center text-xs text-on-surface/40 mt-4">
          Need help?{' '}
          <a href="mailto:support@bookguard.tech" className="text-primary font-bold hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
