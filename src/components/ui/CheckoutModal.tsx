'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PaddleCheckout } from '@/components/ui/PaddleCheckout';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tier?: string;
}

export function CheckoutModal({ isOpen, onClose, onSuccess, tier = 'solo' }: CheckoutModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    
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
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-black/5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-on-surface/40 hover:text-on-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

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

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <PaddleCheckout
            tier={tier as 'solo' | 'growth' | 'enterprise'}
            agencyId=""
            customerId=""
            userId={userId}
            onSuccess={() => {
              onClose();
              if (onSuccess) onSuccess();
              window.location.href = '/onboarding';
            }}
            onError={(error) => {
              console.error('Checkout error:', error);
            }}
          />
        )}

        <p className="text-center text-xs text-on-surface/40 mt-6">
          Secure payment powered by Paddle
        </p>
      </div>
    </div>
  );
}
