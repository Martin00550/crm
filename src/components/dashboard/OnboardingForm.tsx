'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createAgency } from '@/actions/data';

interface OnboardingFormProps {
  user: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function OnboardingForm({ user }: OnboardingFormProps) {
  const router = useRouter();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check if user already has an agency
      const res = await fetch('/api/agency/user-agency');
      
      if (!res.ok) {
        throw new Error(`Session check failed: ${res.statusText}`);
      }
      
      const existingAgency = await res.json();
      
      if (existingAgency.success && existingAgency.agencyId) {
        // Agency exists, update name via API
        const updateResult = await fetch('/api/agency/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name }),
        });
        
        if (updateResult.ok) {
          router.push('/dashboard');
          return;
        } else {
          setError('Failed to update agency name. Please refresh and try again.');
          setIsLoading(false);
          return;
        }
      }

      // If we got a session error from the API, we should probably stop here
      if (!existingAgency.success && existingAgency.error === 'API_SESSION_ERROR') {
        setError('Session verification failed. Please try refreshing or logging in again.');
        setIsLoading(false);
        return;
      }
      
      // No agency yet or session is valid but no agency found, create one
      const result = await createAgency({
        name: formData.name,
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tier: selectedTier,
      });

      if (result.success) {
        document.cookie = 'selected_tier=; path=/; max-age=0';
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to create agency. Please try again.');
      }
    } catch (err) {
      console.error('[OnboardingForm Submit Error]:', err);
      const message = err instanceof Error ? err.message : 'An error occurred';
      
      // Filter out generic Next.js server error messages
      if (message.includes('Server Components render') || message.includes('digest')) {
        setError('Session verification failed. Please try refreshing or logging in again.');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-3xl shadow-xl border border-black/5 p-10 relative overflow-hidden">
      <h2 className="text-lg font-black text-on-surface mb-8 tracking-tight font-headline italic">Agency Details</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-[10px] font-black uppercase tracking-widest flex items-start gap-3 text-left">
          <span className="material-symbols-outlined text-sm mt-0.5">error</span>
          <span className="flex-1">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div>
          <label htmlFor="name" className="block text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-3">
            Official Agency Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Sterling Insurance Group"
            required
            className="w-full px-5 py-3.5 bg-slate-50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-bold text-on-surface text-sm"
          />
        </div>

        <div className="p-5 bg-slate-50 rounded-xl border border-black/5">
          <p className="text-sm text-on-surface/70 leading-relaxed font-medium italic">
            <span className="font-bold text-on-surface">Configuration Note:</span> Your branded subdomain and portal protocols can be refined in the Command Center settings.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-primary text-white font-black rounded-xl hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Initializing Command Center...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Create Command Center
            </>
          )}
        </button>
      </form>
    </div>
  );
}
