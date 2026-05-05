import { getAgencyBySubdomain, getClientAndAgencyBySubdomain } from '@/lib/branding';
import { notFound } from 'next/navigation';
import { ContactForm } from './ContactForm';
import { db } from '@/lib/db';
import { policies, documents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { FileText, Shield, Download, ArrowRight, Building, Phone, Mail } from 'lucide-react';

interface PortalPageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { subdomain } = await params;

  if (!db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-body">
        <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-black/5 text-center max-w-lg">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-on-surface font-headline italic tracking-tight mb-2 italic">Infrastructure Sync Failure</h2>
          <p className="text-on-surface/50 font-medium italic mb-8">
            The RetainVault secure node is currently syncing data. Please wait a moment and refresh your browser.
          </p>
          <button onClick={() => window.location.reload()} className="px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-xl transition-all">
            Refresh Node
          </button>
        </div>
      </div>
    );
  }

  // 1. Try Client First
  const clientData = await getClientAndAgencyBySubdomain(subdomain);
  
  if (clientData) {
    const { client, agency } = clientData;
    const branding = agency.branding;
    const primaryColor = branding.primaryColor;
    const secondaryColor = branding.secondaryColor;

    // Fetch Policies
    const clientPolicies = await db
      .select()
      .from(policies)
      .where(eq(policies.clientId, client.id))
      .execute();

    // Fetch Documents
    const clientDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.clientId, client.id))
      .execute();

    const aiReports = clientDocuments.filter(doc => 
      (doc.category && doc.category.toLowerCase().includes('report')) || 
      (doc.type && doc.type.toLowerCase().includes('report')) ||
      (doc.fileName && doc.fileName.toLowerCase().includes('report')) ||
      (doc.originalName && doc.originalName.toLowerCase().includes('report'))
    );

    const generalDocs = clientDocuments.filter(doc => !aiReports.includes(doc));

    return (
      <div className="min-h-screen bg-slate-50 font-body pb-20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Navigation & Branding */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 bg-white p-6 rounded-3xl shadow-sm border border-black/5">
            <div className="flex items-center gap-4">
              {branding.logoUrl ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-black/5">
                  <img src={branding.logoUrl} alt={agency?.name || 'Agency Logo'} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {agency?.name?.charAt(0) || 'A'}
                </div>
              )}
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{agency?.name || 'Insurance Agency'}</h1>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">Client Intelligence Portal</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-right">
              {branding.phone && (
                <div className="flex items-center justify-end gap-2 text-slate-600">
                  <span className="text-sm font-bold">{branding.phone}</span>
                  <Phone className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
              )}
              {branding.email && (
                <div className="flex items-center justify-end gap-2 text-slate-600">
                  <span className="text-sm font-medium">{branding.email}</span>
                  <Mail className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
              )}
            </div>
          </div>

          {/* Client Welcome Section */}
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              Welcome, {client.name}
            </h2>
            <p className="text-slate-500 font-medium">Secure access to your active policies, intelligence reports, and documentation.</p>
          </div>

          <div className="space-y-8">
            {/* Active Policies */}
            <section className="bg-white rounded-[32px] overflow-hidden border border-black/5 shadow-sm">
              <div className="px-8 py-6 border-b border-black/5 flex items-center gap-3 bg-slate-50/50">
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Your Active Policies</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/5 bg-slate-50/20">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Policy Number</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Carrier</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Policy Type</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Annual Premium</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expiration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {clientPolicies.length > 0 ? (
                      clientPolicies.map((policy) => (
                        <tr key={policy.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-6">
                            <span className="font-bold text-slate-900">{policy.policyNumber}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm font-medium text-slate-600">{policy.carrier}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm font-medium text-slate-600">{policy.policyType}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-lg font-black text-slate-900 tracking-tighter">
                              {formatCurrency(policy.premium || '0')}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm font-medium text-slate-600">
                              {policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic font-medium">
                          No active policies found for this account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Grid for Reports and Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* AI Reports */}
              <section className="bg-white rounded-[32px] overflow-hidden border border-black/5 shadow-sm flex flex-col">
                <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${secondaryColor}15`, color: secondaryColor }}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Risk Analysis Reports</h3>
                  </div>
                </div>
                <div className="p-4 flex-1">
                  {aiReports.length > 0 ? (
                    <div className="space-y-3">
                      {aiReports.map((report) => (
                        <a 
                          key={report.id} 
                          href={report.fileUrl || report.filePath || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 rounded-2xl border border-black/5 hover:border-black/10 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{report.originalName || report.fileName}</p>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                                {new Date(report.createdAt!).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-center px-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                        <FileText className="w-8 h-8" />
                      </div>
                      <p className="font-bold text-slate-900 mb-1">No Reports Available</p>
                      <p className="text-sm text-slate-500 italic">AI Rate Explainer reports will appear here when generated by your agent.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* General Documents */}
              <section className="bg-white rounded-[32px] overflow-hidden border border-black/5 shadow-sm flex flex-col">
                <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Your Documents</h3>
                  </div>
                </div>
                <div className="p-4 flex-1">
                  {generalDocs.length > 0 ? (
                    <div className="space-y-3">
                      {generalDocs.map((doc) => (
                        <a 
                          key={doc.id} 
                          href={doc.fileUrl || doc.filePath || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 rounded-2xl border border-black/5 hover:border-black/10 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
                              <Download className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{doc.originalName || doc.fileName}</p>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                                {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'PDF Document'}
                              </p>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-center px-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                        <FileText className="w-8 h-8" />
                      </div>
                      <p className="font-bold text-slate-900 mb-1">No Documents Available</p>
                      <p className="text-sm text-slate-500 italic">Certificates of Insurance and other official documents will appear here.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Try Agency (Fallback to existing logic)
  const agency = await getAgencyBySubdomain(subdomain);
  
  if (!agency || !agency.whiteLabelEnabled || !['growth', 'enterprise'].includes(agency.subscriptionTier as string)) {
    notFound();
  }

  const { branding } = agency;

  return (
    <div className="space-y-16">
      {/* Navigation / Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {branding.logoUrl && (
              <img 
                src={branding.logoUrl} 
                alt={`${agency.name} logo`} 
                className="h-10 w-auto object-contain"
              />
            )}
            <span className="text-xl font-black tracking-tighter" style={{ color: branding.primaryColor }}>
              {agency.name}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Services</a>
            <a href="#about" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">About</a>
            <a href="#contact" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Contact</a>
            <a 
              href={`/portal/${subdomain}/login`}
              className="px-6 py-2 text-white text-sm font-black rounded-full hover:shadow-lg transition-all"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Insured Login
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${branding.primaryColor}10 0%, ${branding.secondaryColor}10 100%)` 
        }}
      >
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 
            className="text-5xl sm:text-6xl font-black tracking-tight mb-6"
            style={{ color: branding.primaryColor }}
          >
            Your Insurance Partner
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            {branding.description || `${agency.name} provides comprehensive insurance solutions tailored to your needs.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`/portal/${subdomain}/login`}
              className="px-8 py-4 text-white font-bold rounded-full transition-all hover:opacity-90"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Client Login
            </a>
            <a
              href="#services"
              className="px-8 py-4 border-2 font-bold rounded-full transition-all hover:bg-slate-50"
              style={{ borderColor: branding.primaryColor, color: branding.primaryColor }}
            >
              Our Services
            </a>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: branding.secondaryColor }}
        />
        <div 
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: branding.primaryColor }}
        />
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">
                About {agency.name}
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                {branding.description || `At ${agency.name}, we're committed to providing personalized insurance solutions that protect what matters most to you. Our experienced team works closely with each client to understand their unique needs and find the right coverage at competitive rates.`}
              </p>
              
              {(branding.phone || branding.email || branding.address) && (
                <div className="space-y-3">
                  {branding.phone && (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined" style={{ color: branding.primaryColor }}>phone</span>
                      <span className="text-slate-700">{branding.phone}</span>
                    </div>
                  )}
                  {branding.email && (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined" style={{ color: branding.primaryColor }}>mail</span>
                      <span className="text-slate-700">{branding.email}</span>
                    </div>
                  )}
                  {branding.address && (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined" style={{ color: branding.primaryColor }}>location_on</span>
                      <span className="text-slate-700">{branding.address}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="p-6 rounded-2xl text-center"
                style={{ backgroundColor: `${branding.primaryColor}10` }}
              >
                <div className="text-4xl font-black mb-2" style={{ color: branding.primaryColor }}>500+</div>
                <div className="text-sm font-bold text-slate-600">Happy Clients</div>
              </div>
              <div 
                className="p-6 rounded-2xl text-center"
                style={{ backgroundColor: `${branding.secondaryColor}10` }}
              >
                <div className="text-4xl font-black mb-2" style={{ color: branding.secondaryColor }}>15+</div>
                <div className="text-sm font-bold text-slate-600">Years Experience</div>
              </div>
              <div 
                className="p-6 rounded-2xl text-center"
                style={{ backgroundColor: `${branding.secondaryColor}10` }}
              >
                <div className="text-4xl font-black mb-2" style={{ color: branding.secondaryColor }}>24/7</div>
                <div className="text-sm font-bold text-slate-600">Support</div>
              </div>
              <div 
                className="p-6 rounded-2xl text-center"
                style={{ backgroundColor: `${branding.primaryColor}10` }}
              >
                <div className="text-4xl font-black mb-2" style={{ color: branding.primaryColor }}>50+</div>
                <div className="text-sm font-bold text-slate-600">Insurance Carriers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Our Services</h2>
            <p className="text-lg text-slate-600">Comprehensive coverage for all your insurance needs</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: 'business', title: 'Commercial Insurance', desc: 'Protect your business with comprehensive coverage tailored to your industry.' },
              { icon: 'home', title: 'Property Insurance', desc: 'Safeguard your property and assets against unexpected events.' },
              { icon: 'directions_car', title: 'Auto Insurance', desc: 'Get the right coverage for your vehicles at competitive rates.' },
              { icon: 'health_and_safety', title: 'Health Insurance', desc: 'Comprehensive health coverage for you and your family.' },
              { icon: 'gavel', title: 'Liability Insurance', desc: 'Protect yourself from legal liabilities and lawsuits.' },
              { icon: 'workspace_premium', title: 'Life Insurance', desc: 'Secure your family\'s future with our life insurance options.' },
            ].map((service, i) => (
              <div 
                key={i}
                className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-shadow"
              >
                <span 
                  className="material-symbols-outlined text-4xl mb-4"
                  style={{ color: branding.primaryColor }}
                >
                  {service.icon}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                <p className="text-slate-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">Get In Touch</h2>
              <p className="text-lg text-slate-600 mb-8">
                Ready to find the right insurance coverage? Contact us today for a free consultation.
              </p>
              
              {branding.businessHours && (
                <div className="mb-8">
                  <h3 className="font-bold text-slate-900 mb-2">Business Hours</h3>
                  <p className="text-slate-600">{branding.businessHours}</p>
                </div>
              )}
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm">
              <ContactForm primaryColor={branding.primaryColor} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
