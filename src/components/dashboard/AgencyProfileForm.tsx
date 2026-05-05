'use client';

import { useState } from 'react';
import { Building2, Globe, Phone, Mail, MapPin, Clock, Check, AlertCircle, Lock, Upload, Trash2, Image as ImageIcon } from 'lucide-react';

interface Agency {
  id: string;
  name: string;
  subdomain: string | null;
  subscriptionTier: string | null;
  branding: {
    logoUrl?: string;
    phone?: string;
    email?: string;
    address?: string;
    businessHours?: string;
    description?: string;
  } | null;
}

interface AgencyProfileFormProps {
  agency: Agency | null;
}

export function AgencyProfileForm({ agency }: AgencyProfileFormProps) {
  const isEnterprise = agency?.subscriptionTier === 'enterprise';
  
  const [formData, setFormData] = useState({
    name: agency?.name || '',
    subdomain: agency?.subdomain || '',
    logoUrl: agency?.branding?.logoUrl || '',
    phone: agency?.branding?.phone || '',
    email: agency?.branding?.email || '',
    address: agency?.branding?.address || '',
    businessHours: agency?.branding?.businessHours || '',
    description: agency?.branding?.description || '',
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(agency?.branding?.logoUrl || null);
  const [isDragging, setIsDragging] = useState(false);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    let file: File | null = null;
    
    if ('files' in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }

    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please upload an image file (PNG, JPG, etc.)' });
        return;
      }

      setIsUploadingLogo(true);
      setMessage(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('agencyId', agency?.id || '');

        const res = await fetch('/api/upload/logo', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to upload logo');
        }

        setLogoPreview(data.url); // Temporary signed URL for preview
        setFormData(prev => ({ ...prev, logoUrl: data.key })); // Permanent key for database storage
      } catch (error: any) {
        console.error('Logo upload error:', error);
        setMessage({ type: 'error', text: error.message || 'Failed to upload logo' });
      } finally {
        setIsUploadingLogo(false);
      }
    }
    setIsDragging(false);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

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
    if (isUploadingLogo) return;
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
    if (!formData.subdomain) return 'your-subdomain.retainvault.com';
    return `${formData.subdomain}.retainvault.com`;
  };

  return (
    <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm overflow-hidden font-body">
      <div className="px-6 py-5 border-b border-black/5 bg-background">
        <h2 className="text-lg font-black text-on-surface italic font-headline flex items-center gap-2 tracking-tight">
          <Building2 className="w-5 h-5 text-secondary" />
          Agency Profile
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

        {/* Agency Logo Upload */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block">
            Agency Logo
          </label>
          
          <div 
            className={`relative group transition-all duration-300 ${
              isDragging ? 'scale-[1.02]' : ''
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleLogoChange}
          >
            <div className={`flex flex-col md:flex-row items-center gap-8 p-8 rounded-[24px] border-2 border-dashed transition-all ${
              isDragging 
                ? 'border-secondary bg-secondary/5' 
                : logoPreview 
                  ? 'border-black/5 bg-background' 
                  : 'border-black/10 bg-background hover:border-secondary/30 hover:bg-white hover:shadow-inner'
            }`}>
              {/* Preview Circle */}
              <div className="relative shrink-0">
                <div className={`w-32 h-32 rounded-full bg-white border border-black/5 shadow-sm overflow-hidden flex items-center justify-center group-hover:shadow-md transition-all ${isUploadingLogo ? 'opacity-50' : ''}`}>
                  {isUploadingLogo ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : logoPreview ? (
                    <img src={logoPreview} alt="Agency Logo" className="w-full h-full object-contain p-4" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-on-surface/10" />
                  )}
                </div>
                {logoPreview && !isUploadingLogo && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-500 rounded-full shadow-lg border border-red-50/50 flex items-center justify-center hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 text-center md:text-left space-y-2">
                <p className="text-sm font-black text-on-surface uppercase tracking-tight italic">
                  {isUploadingLogo ? "Uploading..." : logoPreview ? "Update Agency Logo" : "Upload Agency Logo"}
                </p>
                <p className="text-xs text-on-surface/50 font-medium italic mb-4 max-w-sm">
                  Recommended: 400x400px. PNG or SVG with a transparent background for best results on the portal.
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <button
                    type="button"
                    disabled={isUploadingLogo}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    className="px-6 py-2.5 bg-white border border-black/10 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-black/5 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploadingLogo ? "Processing..." : "Select File"}
                  </button>
                  <input
                    id="logo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                    disabled={isUploadingLogo}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

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
              className="w-full px-4 py-3 bg-background border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
              placeholder="Your Agency Name"
              required
            />
          </div>

          <div className="relative">
            <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">
              Client Portal Subdomain *
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
                    : 'bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20'
                }`}
                placeholder="your-agency"
                required
                pattern="[a-z0-9-]+"
                title="Only lowercase letters, numbers, and hyphens allowed"
                disabled={!isEnterprise}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-on-surface/20 uppercase tracking-widest italic">
                .retainvault.com
              </div>
            </div>
            {formData.subdomain && (
              <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mt-2 italic">
                Your Portal: {getSubdomainPreview()}
              </p>
            )}

            {/* Enterprise Lock Overlay */}
            {!isEnterprise && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center border border-black/5">
                <div className="text-center p-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm border border-black/5">
                    <Lock className="w-5 h-5 text-on-surface/20" />
                  </div>
                  <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-3">Enterprise Feature</p>
                  <a 
                    href="/pricing" 
                    className="inline-flex items-center gap-2 px-6 py-2 bg-secondary text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:shadow-lg transition-all"
                  >
                    Upgrade to Enterprise
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
                <h3 className="text-sm font-black text-on-surface uppercase tracking-[0.1em] mb-2">Client Portal Branding</h3>
                <p className="text-sm text-on-surface/60 font-medium leading-relaxed mb-6 italic">
                  Set up a dedicated, branded gateway for your clients. Enhance your agency's professional image with a custom subdomain and personalized branding.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Exclusive Subdomain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Logo Branding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Secure Login</span>
                  </div>
                </div>
                <div className="pt-6 border-t border-black/5">
                  <a 
                    href="/pricing" 
                    className="inline-flex items-center gap-2 px-8 py-3 bg-secondary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:shadow-xl transition-all"
                  >
                    Upgrade to Enterprise — $499/mo
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">
            Agency Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 bg-background border border-black/10 rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all resize-none italic"
            placeholder="Describe your agency and the services you provide to your clients..."
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-6 pt-4 border-t border-black/5">
          <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] flex items-center gap-2">
            <Phone className="w-4 h-4 text-secondary" />
            Agency Contact Information
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
                className="w-full px-4 py-3 bg-background border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">
                Contact Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                placeholder="contact@agency.com"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">
              Office Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-background border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
              placeholder="123 Main St, Anytown, USA"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">
              Business Hours
            </label>
            <input
              type="text"
              name="businessHours"
              value={formData.businessHours}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-background border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
              placeholder="Mon-Fri 9am-5pm"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-8 border-t border-black/5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-10 py-4 bg-secondary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Profile'}
          </button>
          
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-10 py-4 border border-black/10 text-on-surface/60 font-black text-xs uppercase tracking-widest rounded-full hover:bg-black/5 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
