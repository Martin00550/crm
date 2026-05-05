'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createAgency } from '@/actions/data';
import { useWorkOSClient } from '@/lib/auth-client';

// Helper to get cookie value
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading: isPending } = useWorkOSClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('solo');
  const [formData, setFormData] = useState({
    name: '',
  });

  // Get tier from cookie on mount
  useEffect(() => {
    const tier = getCookie('selected_tier');
    if (tier && ['solo', 'growth', 'enterprise'].includes(tier)) {
      setSelectedTier(tier);
    }
  }, []);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isPending && !user) {
      console.log('Onboarding: No user found, but not redirecting to prevent loop');
      // router.push('/api/auth/login');
    }
  }, [isPending, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!user) {
        throw new Error('You must be signed in to create an agency');
      }

      // Check if user already has an agency (created by webhook)
      const existingAgency = await fetch('/api/agency/user-agency').then(r => r.json());
      
      if (existingAgency.success && existingAgency.agencyId) {
        // Agency exists, just update the name
        const updateResult = await fetch('/api/agency/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name }),
        });
        
        if (updateResult.ok) {
          router.push('/dashboard');
        } else {
          setError('Failed to update agency name');
        }
      } else {
        // No agency yet, create one
        const result = await createAgency({
          name: formData.name,
          userId: user.id,
          email: user.email || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          tier: selectedTier,
        });

        if (result.success) {
          document.cookie = 'selected_tier=; path=/; max-age=0';
          router.push('/dashboard');
        } else {
          setError('Failed to create agency. Please try again.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render an actionable state if not authenticated, rather than just returning null
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center p-6 font-body text-on-surface">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface mb-4">
            Session Expired
          </h1>
          <p className="text-on-surface/70 mb-8">
            Please log in to continue setting up your Command Center.
          </p>
          <button
            onClick={() => router.push('/api/auth/login')}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center p-6 font-body text-on-surface">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface mb-2 font-headline">
            RetainVault Command Center
          </h1>
          <p className="text-on-surface/40 font-semibold uppercase tracking-widest text-[10px]">Agency Profile Setup</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-xl border border-black/5 p-10 relative overflow-hidden">
          <h2 className="text-lg font-bold text-on-surface mb-8 tracking-tight font-headline">Agency Details</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div>
              <label htmlFor="name" className="block text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-3">
                Agency Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sterling Insurance Group"
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-semibold text-on-surface text-sm"
              />
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-black/5">
              <p className="text-sm text-on-surface/70 leading-relaxed font-medium">
                <span className="font-bold text-on-surface">Note:</span> Your agency portal subdomain can be configured later in settings after upgrading to the Enterprise tier.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Setting up Command Center...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">business_center</span>
                  Create Command Center
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-10">
          <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">
            Already set up?{' '}
            <a href="/dashboard" className="text-secondary hover:underline transition-all">
              Access Command Center
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
