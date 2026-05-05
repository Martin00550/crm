'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const subdomain = params.subdomain as string;
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [client, setClient] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    try {
      const res = await fetch(`/api/portal/invite/${token}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'This invitation has expired or is invalid.');
      }

      setClient(data.client);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain,
          token,
          password,
          mode: 'setup'
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to set up account');
      }

      // Success - redirect to portal dashboard
      router.push(`/portal/${subdomain}/dashboard`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading || validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-[32px] p-10 border border-black/5 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-on-surface italic font-headline mb-4">Access Denied</h1>
          <p className="text-on-surface/60 font-medium italic mb-8">{error}</p>
          <a href={`https://retainvault.com`} className="block w-full py-4 bg-slate-100 text-on-surface/40 font-black text-xs uppercase tracking-widest rounded-full">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Branding header could go here if we fetch agency branding too */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-on-surface italic font-headline tracking-tight leading-none mb-3">Secure Portal Access</h1>
          <p className="text-on-surface/50 font-medium italic">Welcome, {client?.name}</p>
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl border border-black/5 p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
          
          <h2 className="text-xl font-black text-on-surface italic font-headline mb-8 relative z-10">Create Your Credentials</h2>
          
          <form onSubmit={handleSetup} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Access Email</label>
              <input
                type="email"
                value={client?.email}
                disabled
                className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-xl font-bold text-on-surface/40 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/20" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-bold"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Confirm Identity</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/20" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-bold"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-bold italic bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-secondary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Provisioning...
                </>
              ) : (
                <>
                  Activate Gateway Access
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
