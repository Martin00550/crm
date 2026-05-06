import { redirect } from 'next/navigation';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { OnboardingForm } from '@/components/dashboard/OnboardingForm';

export default async function OnboardingPage() {
  const session = await withAuth();

  // If no session on the server, redirect to login immediately
  if (!session?.user) {
    redirect('/api/auth/login');
  }

  return (
    <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center p-6 font-body text-on-surface">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-on-surface mb-2 font-headline italic">
            RetainVault Command Center
          </h1>
          <p className="text-on-surface/40 font-black uppercase tracking-widest text-[10px]">Agency Profile Setup</p>
        </div>

        <OnboardingForm 
          user={{
            id: session.user.id,
            email: session.user.email ?? undefined,
            firstName: session.user.firstName ?? undefined,
            lastName: session.user.lastName ?? undefined,
          }} 
        />

        <div className="text-center mt-10">
          <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">
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
