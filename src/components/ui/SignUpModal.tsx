'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { CheckoutModal } from './CheckoutModal';
import { SignInModal } from './SignInModal';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tier?: string;
}

export function SignUpModal({ isOpen, onClose, onSuccess, tier = 'solo' }: SignUpModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: `/checkout?tier=${tier}`,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to create account');
      } else {
        // Close sign-up modal and open checkout modal
        onClose();
        setShowCheckout(true);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="font-headline italic text-2xl text-primary font-black mb-2">
            Create Account
          </h1>
          <p className="text-on-surface/40 font-bold uppercase tracking-widest text-[10px]">
            Start your 14-day free trial
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40 mb-2 block">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-black/10 focus:ring-secondary/20 focus:border-secondary transition-all px-4 py-3 text-sm"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40 mb-2 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-black/10 focus:ring-secondary/20 focus:border-secondary transition-all px-4 py-3 text-sm"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40 mb-2 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-black/10 focus:ring-secondary/20 focus:border-secondary transition-all px-4 py-3 text-sm"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white hover:bg-gray-900 rounded-full py-3 font-black text-sm uppercase tracking-widest transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <button
            onClick={() => {
              onClose();
              setShowSignIn(true);
            }}
            className="text-secondary font-black hover:text-secondary/80 transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        tier={tier}
        onSuccess={() => {
          setShowCheckout(false);
          router.push('/dashboard');
        }}
      />

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
      />
    </div>
  );
}
