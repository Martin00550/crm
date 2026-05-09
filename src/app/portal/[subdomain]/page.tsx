import { getAgencyBySubdomain, getClientAndAgencyBySubdomain } from '@/lib/branding';
import { withAgencyContext } from '@/lib/db-rls';
import { logPortalAccess } from '@/lib/audit';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { policies, documents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { FileText, Shield, Download, ArrowRight, Phone, Mail, ExternalLink, Calendar, Lock } from 'lucide-react';
import { VirtualizedPolicyTable } from '@/components/portal/VirtualizedPolicyTable';

export const runtime = 'edge';

interface PortalPageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { subdomain } = await params;

  if (!db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 font-body p-6">
        <div className="bg-slate-900 p-12 rounded-[40px] shadow-2xl border border-white/5 text-center max-w-lg">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white font-headline italic tracking-tight mb-2 italic">Infrastructure Sync Failure</h2>
          <p className="text-white/40 font-medium italic mb-8">
            The RetainVault secure node is currently syncing data. Please refresh in a moment.
          </p>
        </div>
      </div>
    );
  }

  // 1. Fetch Client and Agency data
  const clientData = await getClientAndAgencyBySubdomain(subdomain);
  
  // If no client matches the subdomain, try agency
  if (!clientData) {
    const agency = await getAgencyBySubdomain(subdomain);
    
    // If not found or not enterprise, return 404
    if (!agency || !agency.whiteLabelEnabled || agency.subscriptionTier !== 'enterprise') {
      notFound();
    }

    // Agency-only view (Minimal Executive Landing)
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-950">
        <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic">
              {agency.name} <span className="text-primary">Executive Portal</span>
            </h1>
            <p className="text-lg text-white/40 font-medium italic">
              Secure infrastructure for institutional insurance management.
            </p>
          </div>
          
          <div className="p-8 rounded-[32px] bg-slate-900 border border-white/5 shadow-2xl relative overflow-hidden group transition-all hover:border-primary/20">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/10"></div>
             <Lock className="w-8 h-8 text-primary mx-auto mb-4" />
             <p className="text-sm text-white/60 font-medium leading-relaxed italic">
               This is a private, read-only gateway. Please use the unique secure link provided by your agent to access your specific portfolio and risk reports.
             </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-4">
             {agency.branding.phone && (
               <div className="flex items-center gap-2 text-white/40">
                 <Phone className="w-4 h-4 text-primary" />
                 <span className="text-xs font-black uppercase tracking-widest">{agency.branding.phone}</span>
               </div>
             )}
             {agency.branding.email && (
               <div className="flex items-center gap-2 text-white/40">
                 <Mail className="w-4 h-4 text-primary" />
                 <span className="text-xs font-black uppercase tracking-widest">{agency.branding.email}</span>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  const { client, agency } = clientData;
  const branding = agency.branding;

  // 1.5 Record Audit Log (Institutional Transparency)
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for') || '127.0.0.1';
  const ua = headerList.get('user-agent') || 'unknown';
  
  // We log asynchronously to not block the page render
  logPortalAccess(subdomain, client.id, agency.id, ip, ua).catch(console.error);

  // 2. Fetch Policies and Documents within RLS Context
  const { clientPolicies, clientDocuments } = await withAgencyContext(agency.id, async (tx) => {
    const policiesList = await tx
      .select()
      .from(policies)
      .where(eq(policies.clientId, client.id))
      .execute();

    const documentsList = await tx
      .select()
      .from(documents)
      .where(eq(documents.clientId, client.id))
      .execute();

    return { clientPolicies: policiesList, clientDocuments: documentsList };
  });

  const aiReports = clientDocuments.filter((doc: any) => 
    (doc.category?.toLowerCase().includes('report')) || 
    (doc.type?.toLowerCase().includes('report')) ||
    (doc.fileName?.toLowerCase().includes('report')) ||
    (doc.originalName?.toLowerCase().includes('report'))
  );

  const generalDocs = clientDocuments.filter((doc: any) => !aiReports.includes(doc));

  return (
    <div className="bg-slate-950 min-h-screen selection:bg-primary/30 pb-20">
      <div className="max-w-7xl mx-auto px-6 pt-12">
        {/* Executive Welcome */}
        <div className="mb-12 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-primary/40"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Portfolio Summary</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic mb-4">
            Welcome back, <span className="text-white/60">{client.name}</span>
          </h1>
          <p className="text-white/40 text-lg font-medium italic max-w-2xl">
            Access your secure policy ledger, risk analysis reports, and official documentation provided by {agency.name}.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">

            {/* Active Policies Table */}
            <section className="bg-slate-900 rounded-[32px] overflow-hidden border border-white/5 shadow-2xl flex flex-col">
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-black text-white tracking-tight italic">Active Policy Ledger</h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest italic">
                  Read Only
                </div>
              </div>
              
              {/* Fixed Header */}
              <div className="bg-white/[0.02] border-b border-white/5 shrink-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] w-[35%]">Policy / ID</th>
                      <th className="px-8 py-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] w-[25%]">Carrier</th>
                      <th className="px-8 py-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] w-[20%]">Annual Premium</th>
                      <th className="px-8 py-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] w-[20%]">Expiration</th>
                    </tr>
                  </thead>
                </table>
              </div>

              <VirtualizedPolicyTable policies={clientPolicies.map((p: any) => ({
                id: p.id,
                policyNumber: p.policyNumber,
                carrier: p.carrier,
                policyType: p.policyType,
                premium: p.premium.toString(),
                expirationDate: p.expirationDate
              }))} />
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Risk Reports */}
            <section className="bg-slate-900 rounded-[32px] overflow-hidden border border-white/5 shadow-2xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-black text-white tracking-tight italic">AI Risk Reports</h3>
              </div>
              
              {aiReports.length > 0 ? (
                <div className="space-y-4">
                  {aiReports.map((report: any) => (
                    <a 
                      key={report.id} 
                      href={report.fileUrl || report.filePath || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-white text-sm group-hover:text-primary transition-colors italic">
                          {report.originalName || report.fileName}
                        </p>
                        <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                        Generated {new Date(report.createdAt!).toLocaleDateString()}
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center px-4 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/10 mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-white/30 font-medium italic">No intelligence reports available at this time.</p>
                </div>
              )}
            </section>

            {/* General Documents */}
            <section className="bg-slate-900 rounded-[32px] overflow-hidden border border-white/5 shadow-2xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <Download className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-black text-white tracking-tight italic">Policy Documents</h3>
              </div>
              
              {generalDocs.length > 0 ? (
                <div className="space-y-4">
                  {generalDocs.map((doc: any) => (
                    <a 
                      key={doc.id} 
                      href={doc.fileUrl || doc.filePath || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/[0.02] flex items-center justify-center text-white/20 group-hover:text-primary transition-colors">
                        <Download className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-xs truncate group-hover:text-primary transition-colors">
                          {doc.originalName || doc.fileName}
                        </p>
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-0.5">
                          {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'PDF'} • Document
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center px-4 space-y-4">
                   <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/10 mx-auto">
                    <Download className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-white/30 font-medium italic">No official documents uploaded.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
