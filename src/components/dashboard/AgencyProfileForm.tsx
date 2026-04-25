'use client';

import { useState } from 'react';
import { Building2, Globe, Phone, Mail, MapPin, Clock, Check, AlertCircle, Lock } from 'lucide-react';

interface Agency {
  id: string;
  name: string;
  subdomain: string;
  subscriptionTier: string;
  branding: {
    phone?: string;
    email?: string;
    address?: string;
    businessHours?: string;
    description?: string;
  };
}

interface AgencyProfileFormProps {
  agency: Agency | null;
}

export function AgencyProfileForm({ agency }: AgencyProfileFormProps) {
  const isEnterprise = agency?.subscriptionTier === 'enterprise';
  
  const [formData, setFormData] = useState({
    name: agency?.name || '',
    subdomain: agency?.subdomain || '',
    phone: agency?.branding?.phone || '',
    email: agency?.branding?.email || '',
    address: agency?.branding?.address || '',
    businessHours: agency?.branding?.businessHours || '',
    description: agency?.branding?.description || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for subdomain
    if (name === 'subdomain') {
      const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, [name]: sanitized }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/agency/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setMessage({ type: 'success', text: 'Agency profile updated successfully!' });
      
      // Refresh page after successful update
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Something went wrong' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubdomainPreview = () => {
    if (!formData.subdomain) return 'your-subdomain.bookguard.tech';
    return `${formData.subdomain}.bookguard.tech`;
  };

  return (
    <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm overflow-hidden font-body">
      <div className="px-6 py-5 border-b border-black/5 bg-slate-50/50">
        <h2 className="text-lg font-black text-on-surface italic font-headline flex items-center gap-2 tracking-tight">
          <Building2 className="w-5 h-5 text-primary" />
          Agency Identity Protocol
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Success/Error Message */}
        {message && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            message.type === 'success' 
              ? 'bg-secondary/5 border border-secondary/10 text-secondary'
              : 'bg-red-50 border border-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
          </div>
        )}

        {/* Basic Info */}
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">
              Official Agency Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
              placeholder="Your Agency Name"
              required
            />
          </div>

          <div className="relative">
            <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">
              Exclusive Deployment Subdomain *
            </label>
            <div className="relative">
              <input
                type="text"
                name="subdomain"
                value={formData.subdomain}
                onChange={handleChange}
                className={`w-full px-4 py-3 border border-black/10 rounded-xl transition-all font-bold text-sm ${
                  !isEnterprise 
                    ? 'bg-slate-100 text-on-surface/20 cursor-not-allowed' 
                    : 'bg-slate-50/50 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20'
                }`}
                placeholder="your-agency"
                required
                pattern="[a-z0-9-]+"
                title="Only lowercase letters, numbers, and hyphens allowed"
                disabled={!isEnterprise}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-on-surface/20 uppercase tracking-widest italic">
                .bookguard.tech
              </div>
            </div>
            {formData.subdomain && (
              <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mt-2 italic">
                Deployment: {getSubdomainPreview()}
              </p>
            )}

            {/* Enterprise Lock Overlay */}
            {!isEnterprise && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center border border-black/5">
                <div className="text-center p-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm border border-black/5">
                    <Lock className="w-5 h-5 text-on-surface/20" />
                  </div>
                  <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-3">Enterprise Exclusive Protocol</p>
                  <a 
                    href="/pricing" 
                    className="inline-flex items-center gap-2 px-6 py-2 bg-secondary text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:shadow-lg transition-all"
                  >
                    Authorize Expansion
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* White-Labeled Portal Info Card */}
        {!isEnterprise && (
          <div className="bg-secondary/5 border border-secondary/10 rounded-[24px] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-12 h-12 bg-secondary text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Globe className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-on-surface uppercase tracking-[0.1em] mb-2">Agency Command Portal</h3>
                <p className="text-sm text-on-surface/60 font-medium leading-relaxed mb-6 italic">
                  Provision a dedicated, branded gateway for your premium insureds. Project authority with exclusive subdomains and carrier-grade identity protection.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Exclusive Subdomain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Seal Branding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Secure Auth</span>
                  </div>
                </div>
                <div className="pt-6 border-t border-black/5">
                  <a 
                    href="/pricing" 
                    className="inline-flex items-center gap-2 px-8 py-3 bg-secondary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:shadow-xl transition-all"
                  >
                    Authorize Enterprise Deployment — $499/cycle
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">
            Agency Value Proposition
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all resize-none italic"
            placeholder="Define your unique market authority and service level commitments..."
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-6 pt-4 border-t border-black/5">
          <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            Command Contact Protocols
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">
                Primary Direct Line
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">
                Official Intelligence Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                placeholder="contact@agency.com"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">
              Physical Headquarters
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
              placeholder="123 Command Way, Metropolitan District"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">
              Operational Window (Business Hours)
            </label>
            <input
              type="text"
              name="businessHours"
              value={formData.businessHours}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
              placeholder="Mon-Fri 0900-1700, Sat 1000-1400"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-8 border-t border-black/5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Syncing...' : 'Commit Profile Updates'}
          </button>
          
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-10 py-4 border border-black/10 text-on-surface/60 font-black text-xs uppercase tracking-widest rounded-full hover:bg-black/5 transition-all"
          >
            Abort Changes
          </button>
        </div>
      </form>
    </div>
  );
}
