import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { clients, policies, agencies, documents } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { verify } from 'jsonwebtoken';
import { FileText, Calendar, DollarSign, Shield, LogOut, Phone, Mail, Download, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');

interface PortalDashboardProps {
  params: { subdomain: string };
}

export default async function PortalDashboard({ params }: PortalDashboardProps) {
  const token = (await cookies()).get('portal_token')?.value;

  if (!token) {
    redirect(`/portal/${params.subdomain}/login`);
  }

  let decoded: { clientId: string; agencyId: string; email: string; subdomain: string };
  try {
    decoded = verify(token, JWT_SECRET || '') as unknown as typeof decoded;
  } catch {
    redirect(`/portal/${params.subdomain}/login`);
  }

  // Get agency branding
  const agency = await db
    .select()
    .from(agencies)
    .where(eq(agencies.id, decoded.agencyId))
    .limit(1)
    .then((r: any[]) => r[0]);

  // Get client info
  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.id, decoded.clientId))
    .limit(1)
    .then((r: any[]) => r[0]);

  // Get client's policies
  const clientPolicies = await db
    .select({
      id: policies.id,
      policyNumber: policies.policyNumber,
      carrier: policies.carrier,
      policyType: policies.policyType,
      premium: policies.premium,
      status: policies.status,
      effectiveDate: policies.effectiveDate,
      expirationDate: policies.expirationDate,
      healthScore: policies.healthScore,
    })
    .from(policies)
    .where(
      and(
        eq(policies.clientId, decoded.clientId),
        eq(policies.status, 'active')
      )
    )
    .orderBy(desc(policies.expirationDate))
    .execute();

  // Get client's documents
  const clientDocuments = await db
    .select({
      id: documents.id,
      fileName: documents.fileName,
      fileType: documents.fileType,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(eq(documents.clientId, decoded.clientId))
    .orderBy(desc(documents.createdAt))
    .limit(5)
    .execute();

  // Calculate renewal urgency
  const now = new Date();
  const upcomingRenewals = clientPolicies.filter((p: any) => {
    const daysUntilExpiry = Math.ceil((new Date(p.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const branding = agency?.branding || {
    primaryColor: '#1e40af',
    secondaryColor: '#7c3aed',
  };

  const totalPremium = clientPolicies.reduce((sum: number, p: any) => 
    sum + parseFloat(p.premium || '0'), 0
  );

  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      {/* Header */}
      <header 
        className="bg-surface border-b border-black/5 sticky top-0 z-50 h-20 flex items-center"
        style={{ borderTop: `4px solid ${branding.primaryColor}` }}
      >
        <div className="max-w-[1600px] mx-auto w-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: branding.primaryColor }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 
              className="text-2xl font-black italic font-headline tracking-tighter"
              style={{ color: branding.primaryColor }}
            >
              {agency?.name || 'Client Portal'}
            </h1>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Welcome</p>
              <p className="text-sm font-bold text-on-surface italic font-headline">{client?.name}</p>
            </div>
            <div className="h-10 w-px bg-black/5"></div>
            <form action="/api/portal/auth" method="DELETE">
              <button 
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 py-12 space-y-10">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface rounded-[32px] border border-black/5 p-6 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-16 -mt-16 opacity-10" style={{ backgroundColor: branding.primaryColor }}></div>
            <div className="flex items-center gap-4 relative z-10">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm"
                style={{ backgroundColor: `${branding.primaryColor}08`, borderColor: `${branding.primaryColor}20` }}
              >
                <Shield className="w-6 h-6" style={{ color: branding.primaryColor }} />
              </div>
              <div>
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Active Placements</p>
                <p className="text-3xl font-black text-on-surface tracking-tighter font-headline italic leading-none mt-1">{clientPolicies.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-[32px] border border-black/5 p-6 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-16 -mt-16 opacity-10" style={{ backgroundColor: branding.secondaryColor }}></div>
            <div className="flex items-center gap-4 relative z-10">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm"
                style={{ backgroundColor: `${branding.secondaryColor}08`, borderColor: `${branding.secondaryColor}20` }}
              >
                <DollarSign className="w-6 h-6" style={{ color: branding.secondaryColor }} />
              </div>
              <div>
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Total Premium</p>
                <p className="text-3xl font-black text-on-surface tracking-tighter font-headline italic leading-none mt-1">
                  ${totalPremium.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-[32px] border border-black/5 p-6 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-16 -mt-16 opacity-10" style={{ backgroundColor: '#ef4444' }}></div>
            <div className="flex items-center gap-4 relative z-10">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm bg-red-50 border-red-100"
              >
                <Clock className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Renewals Due</p>
                <p className="text-3xl font-black text-on-surface tracking-tighter font-headline italic leading-none mt-1">{upcomingRenewals.length}</p>
                <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Next 30 days</p>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-[32px] border border-black/5 p-6 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-16 -mt-16 opacity-10" style={{ backgroundColor: branding.primaryColor }}></div>
            <div className="flex items-center gap-4 relative z-10">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm"
                style={{ backgroundColor: `${branding.primaryColor}08`, borderColor: `${branding.primaryColor}20` }}
              >
                <Download className="w-6 h-6" style={{ color: branding.primaryColor }} />
              </div>
              <div>
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Documents</p>
                <p className="text-3xl font-black text-on-surface tracking-tighter font-headline italic leading-none mt-1">{clientDocuments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Renewal Alert */}
        {upcomingRenewals.length > 0 && (
          <div className="bg-red-50 rounded-[32px] border border-red-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-red-900 font-headline italic tracking-tight mb-2">Renewal Alert</h3>
                <p className="text-sm text-red-700 font-medium mb-4">
                  You have {upcomingRenewals.length} policy{upcomingRenewals.length > 1 ? 'ies' : ''} expiring in the next 30 days. Contact your agent to ensure continuous coverage.
                </p>
                <div className="flex flex-wrap gap-2">
                  {upcomingRenewals.slice(0, 3).map((policy: any) => {
                    const daysUntilExpiry = Math.ceil((new Date(policy.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={policy.id} className="px-4 py-2 bg-white rounded-lg border border-red-100">
                        <p className="text-xs font-bold text-red-900 uppercase tracking-widest">{policy.policyType}</p>
                        <p className="text-[10px] text-red-600">{daysUntilExpiry} days left</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Policies List */}
        <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-black/5 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Active Policies</h2>
            <div className="px-4 py-1 bg-secondary/5 text-secondary text-[10px] font-black uppercase tracking-widest rounded-full border border-secondary/10">Active Coverage</div>
          </div>
          
          <div className="divide-y divide-black/5">
            {clientPolicies.map((policy: any) => (
              <div key={policy.id} className="px-8 py-6 hover:bg-slate-50/50 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border group-hover:rotate-3 transition-transform"
                      style={{ backgroundColor: `${branding.primaryColor}08`, borderColor: `${branding.primaryColor}20` }}
                    >
                      <FileText className="w-6 h-6" style={{ color: branding.primaryColor }} />
                    </div>
                    <div>
                      <p className="font-black text-on-surface font-headline italic text-lg tracking-tight leading-none group-hover:text-primary transition-colors">{policy.policyType}</p>
                      <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-2">{policy.carrier} <span className="mx-1">•</span> ID: {policy.policyNumber}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-black text-on-surface font-headline italic text-xl tracking-tighter">
                      ${parseFloat(policy.premium).toLocaleString()}/cycle
                    </p>
                    <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Renews {new Date(policy.expirationDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            ))}

            {clientPolicies.length === 0 && (
              <div className="px-8 py-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Shield className="w-10 h-10 text-on-surface/10" />
                </div>
                <p className="text-sm font-black text-on-surface/40 uppercase tracking-widest">No Active Policies</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-black/5 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Recent Documents</h2>
            <Link href="#" className="text-[10px] font-black uppercase tracking-widest hover:underline" style={{ color: branding.primaryColor }}>View All</Link>
          </div>
          
          <div className="divide-y divide-black/5">
            {clientDocuments.map((doc: any) => (
              <div key={doc.id} className="px-8 py-4 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${branding.primaryColor}08`, borderColor: `${branding.primaryColor}20` }}
                  >
                    <FileText className="w-5 h-5" style={{ color: branding.primaryColor }} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm font-headline italic">{doc.fileName}</p>
                    <p className="text-[9px] font-black text-on-surface/40 uppercase tracking-widest">{doc.fileType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">
                    {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <button className="p-2 text-on-surface/40 hover:text-primary transition-colors" style={{ color: branding.primaryColor }}>
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {clientDocuments.length === 0 && (
              <div className="px-8 py-12 text-center">
                <p className="text-sm font-black text-on-surface/40 uppercase tracking-widest">No documents available</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div 
          className="rounded-[32px] p-10 relative overflow-hidden shadow-xl border border-black/5 group"
          style={{ backgroundColor: `${branding.primaryColor}05` }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32 opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: branding.primaryColor }}></div>
          <div className="relative z-10">
            <h3 className="text-xl font-black text-on-surface font-headline italic tracking-tight mb-2">Contact Your Agent</h3>
            <p className="text-sm text-on-surface/60 font-medium italic mb-8 max-w-xl leading-relaxed">
              Reach out to your dedicated agent for policy questions, coverage reviews, or any insurance needs.
            </p>
            <div className="flex flex-wrap gap-4">
              {agency?.branding?.phone && (
                <a 
                  href={`tel:${agency.branding.phone}`}
                  className="px-8 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-full hover:shadow-lg transition-all active:scale-[0.98] flex items-center gap-2"
                  style={{ 
                    backgroundColor: branding.primaryColor,
                  }}
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call Your Agent
                </a>
              )}
              {agency?.branding?.email && (
                <a 
                  href={`mailto:${agency.branding.email}`}
                  className="px-8 py-3 bg-white border border-black/10 text-on-surface/60 font-black text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-black/5 transition-all shadow-sm flex items-center gap-2"
                  style={{ 
                    borderColor: `${branding.primaryColor}40`,
                    color: branding.primaryColor
                  }}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email Your Agent
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
