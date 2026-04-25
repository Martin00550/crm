import { getAgencyBySubdomain } from '@/lib/branding';
import { notFound } from 'next/navigation';
import { ContactForm } from './ContactForm';

interface PortalPageProps {
  params: { subdomain: string };
}

export default async function PortalPage({ params }: PortalPageProps) {
  const agency = await getAgencyBySubdomain(params.subdomain);
  
  if (!agency || !agency.whiteLabelEnabled || agency.subscriptionTier !== 'enterprise') {
    notFound();
  }

  const { branding } = agency;

  return (
    <div className="space-y-16">
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
              href={`/portal/${params.subdomain}/login`}
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
