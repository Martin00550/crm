'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function InvitationAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      verifyInvitation();
    }
  }, [token]);

  async function verifyInvitation() {
    try {
      const res = await fetch(`/api/invite/${token}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'Invalid or expired invitation') {
          setStatus('expired');
        } else {
          setStatus('error');
          setError(data.error || 'Failed to verify invitation');
        }
        return;
      }

      setInvitation(data.invitation);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setError('Failed to verify invitation');
    }
  }

  async function handleAccept() {
    try {
      setStatus('loading');
      
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST',
      });
      
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setError(data.error || 'Failed to accept invitation');
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      setStatus('error');
      setError('Failed to accept invitation');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-8">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Verifying Invitation</h2>
            <p className="text-slate-600">Please wait while we verify your invitation...</p>
          </div>
        )}

        {status === 'success' && invitation && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">You're Invited!</h2>
            
            <p className="text-slate-600 mb-6">
              You've been invited to join <strong className="text-slate-900">{invitation.agencyName}</strong> as a <strong className="text-primary">{invitation.roleLabel}</strong>.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 text-sm">Agency:</span>
                  <span className="font-semibold text-slate-900 text-sm">{invitation.agencyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 text-sm">Role:</span>
                  <span className="font-semibold text-primary text-sm">{invitation.roleLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 text-sm">Email:</span>
                  <span className="font-semibold text-slate-900 text-sm">{invitation.email}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleAccept}
              className="w-full bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary/90 transition-colors"
            >
              Accept Invitation
            </button>

            <p className="text-xs text-slate-500 mt-4">
              By accepting, you'll be added to the team and can access the agency dashboard.
            </p>
          </div>
        )}

        {status === 'expired' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-amber-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Invitation Expired</h2>
            
            <p className="text-slate-600 mb-6">
              This invitation has expired or is no longer valid. Please contact your agency administrator for a new invitation.
            </p>

            <a
              href="/"
              className="inline-block bg-slate-100 text-slate-700 font-semibold py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Go to Home
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2>
            
            <p className="text-slate-600 mb-6">{error}</p>

            <a
              href="/"
              className="inline-block bg-slate-100 text-slate-700 font-semibold py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Go to Home
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
