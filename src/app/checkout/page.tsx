"use client";

import { redirect, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { PaddleCheckout } from '@/components/ui/PaddleCheckout';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const tier = searchParams.get('tier') || 'solo';
  const validTiers = ['solo', 'growth', 'enterprise'];
  
  if (!validTiers.includes(tier)) {
    redirect('/pricing');
  }

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.user?.id) {
          setUserId(data.user.id);
        }
      } catch (error) {
        console.error('Failed to get user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-black/5">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-primary font-headline italic mb-2">
              Complete Your Trial
            </h1>
            <p className="text-on-surface/60 font-medium">
              Enter your payment details to start your 14-day free trial
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-black/5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-on-surface capitalize">{tier} Plan</span>
              <span className="text-2xl font-black text-primary">
                ${tier === 'solo' ? '99' : tier === 'growth' ? '249' : '499'}
                <span className="text-sm font-normal text-on-surface/40">/mo</span>
              </span>
            </div>
            <div className="text-sm text-on-surface/60">
              <p className="font-bold text-secondary mb-1">14-day free trial</p>
              <p className="text-xs">No charge until trial ends. Cancel anytime.</p>
            </div>
          </div>

          <PaddleCheckout
            tier={tier as 'solo' | 'growth' | 'enterprise'}
            agencyId="" // Agency will be created by webhook after payment
            customerId="" // Will be created by Paddle
            userId={userId}
            onSuccess={() => {
              // Redirect to onboarding - webhook will create agency with valid trial
              window.location.href = '/onboarding';
            }}
            onError={(error) => {
              console.error('Checkout error:', error);
            }}
          />

          <p className="text-center text-xs text-on-surface/40 mt-6">
            Secure payment powered by Paddle
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
