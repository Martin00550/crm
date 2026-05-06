import { redirect } from 'next/navigation';
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getUserAgencyId, getAgency } from '@/actions/data';
import { CurrencySettingsForm } from '@/components/dashboard/CurrencySettingsForm';
import Link from 'next/link';
import { ArrowLeft, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CurrencySettingsPage() {
  const session = await withAuth();
  
  if (!session?.user?.id) {
    redirect("/api/auth/login");
  }

  const agencyId = await getUserAgencyId(session?.user?.id);
  
  if (!agencyId) {
    redirect('/onboarding');
  }

  const agency = await getAgency(agencyId);

  return (
    <div className="space-y-10 font-body text-on-surface">
      <div className="flex items-center gap-5">
        <Link 
          href="/dashboard/settings" 
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-black/5 text-on-surface/40 hover:text-secondary hover:shadow-md transition-all shadow-sm group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight leading-none">Currency & Region</h1>
          <p className="text-on-surface/60 mt-2 font-medium italic">Manage regional localization and financial display protocols</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CurrencySettingsForm agency={agency as any} />
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-secondary/10 transition-colors"></div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/10">
                <Globe className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Regional Status</h3>
            </div>
            <div className="space-y-5 relative z-10">
              <div className="flex flex-col gap-1 border-b border-black/5 pb-3">
                <span className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">Active Currency</span>
                <span className="text-sm font-bold text-on-surface italic font-headline">{agency?.currency || 'USD'}</span>
              </div>
              <p className="text-xs text-on-surface/40 font-medium italic">
                All premium values in the Policy Ledger and Command Center will reflect this currency choice instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
