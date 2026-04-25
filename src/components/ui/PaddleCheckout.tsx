'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { PADDLE_PRICE_IDS } from '@/lib/paddle';

interface PaddleCheckoutProps {
  tier: 'solo' | 'growth' | 'enterprise';
  agencyId: string;
  customerId?: string;
  userId?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PaddleCheckout({ tier, agencyId, customerId, userId, onSuccess, onError }: PaddleCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paddleLoaded, setPaddleLoaded] = useState(false);

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

  // Initialize Paddle.js
  useEffect(() => {
    if (window.Paddle) {
      const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
      if (!clientToken) {
        console.error('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not configured');
        setPaddleLoaded(false);
        return;
      }
      window.Paddle.Initialize({
        token: clientToken,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      });
      setPaddleLoaded(true);
    } else {
      console.error('Paddle.js is not loaded');
      setPaddleLoaded(false);
    }
  }, []);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, customerId, userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout');
      }

      const data = await response.json();

      // Open Paddle checkout in popup using Paddle.js
      if (window.Paddle && data.checkoutId) {
        // Use the checkout ID returned from the API to open the overlay
        window.Paddle.Checkout.open({
          checkoutId: data.checkoutId,
          settings: {
            displayMode: 'overlay',
            theme: 'light',
            locale: 'en',
          },
        });
        
        // Listen for checkout completion
        window.Paddle.Checkout.onCompleted((data: any) => {
          console.log('Checkout completed:', data);
          if (onSuccess) onSuccess();
        });
        
        window.Paddle.Checkout.onClosed((data: any) => {
          console.log('Checkout closed:', data);
          setIsLoading(false);
        });
      } else if (data.checkoutUrl) {
        // Fallback: open checkout URL in new window
        window.open(data.checkoutUrl, '_blank', 'width=600,height=800');
        
        if (onSuccess) onSuccess();
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      if (onError) onError(error.message || 'Failed to start checkout');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading || !paddleLoaded}
      className="w-full px-6 py-3 bg-secondary text-white font-bold rounded-full text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </>
      ) : !paddleLoaded ? (
        <>
          Payment system unavailable
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          Subscribe to {tierNames[tier]} - ${tierPrices[tier]}/mo
        </>
      )}
    </button>
  );
}

