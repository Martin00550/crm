'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandingConfig } from '@/lib/branding';

interface BrandingSettingsProps {
  agencyId: string;
  initialBranding: Partial<BrandingConfig>;
  subdomain: string;
  whiteLabelEnabled: boolean;
}

export function BrandingSettings({ 
  agencyId, 
  initialBranding, 
  subdomain,
  whiteLabelEnabled: initialEnabled 
}: BrandingSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [branding, setBranding] = useState<Partial<BrandingConfig>>({
    primaryColor: initialBranding.primaryColor || '#1e40af',
    secondaryColor: initialBranding.secondaryColor || '#7c3aed',
    logoUrl: initialBranding.logoUrl,
    description: initialBranding.description || '',
    phone: initialBranding.phone || '',
    email: initialBranding.email || '',
    address: initialBranding.address || '',
    businessHours: initialBranding.businessHours || '',
  });
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(initialEnabled);

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agencyId', agencyId);
      
      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.url) {
        setBranding({ ...branding, logoUrl: data.url });
      }
    } catch (error) {
      console.error('Logo upload failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          branding,
          whiteLabelEnabled,
        }),
      });
      
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to save branding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const portalUrl = subdomain 
    ? `https://${subdomain}.bookguard.tech`
    : 'Set up your subdomain first';

  return (
    <div className="space-y-8">
      {/* Portal Status */}
      <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Portal Deployment Status</h3>
            <p className="text-xs text-on-surface/40 font-medium italic mt-1">Authorize or decommissioning your white-label gateway</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={whiteLabelEnabled}
              onChange={(e) => setWhiteLabelEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
          </label>
        </div>
        
        {whiteLabelEnabled && subdomain && (
          <div className="flex items-center gap-4 p-5 bg-secondary/5 rounded-2xl border border-secondary/10 animate-in fade-in slide-in-from-top-2">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-secondary/10">
              <span className="material-symbols-outlined text-secondary">check_circle</span>
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black text-secondary uppercase tracking-widest">Deployment Active</div>
              <a 
                href={portalUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-bold text-on-surface hover:text-secondary transition-colors italic"
              >
                {portalUrl}
              </a>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(portalUrl)}
              className="px-4 py-2 text-[10px] font-black text-secondary bg-white border border-secondary/10 rounded-full hover:bg-secondary/5 transition-all uppercase tracking-widest shadow-sm"
            >
              Copy Protocol URL
            </button>
          </div>
        )}
      </div>

      {/* Logo Upload */}
      <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm p-8">
        <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-6">Agency Seal Branding</h3>
        
        <div className="flex items-start gap-8">
          <div 
            className="w-40 h-40 rounded-[24px] border-2 border-dashed border-black/10 flex items-center justify-center overflow-hidden bg-slate-50 shadow-inner group relative"
            style={{ borderColor: branding.primaryColor + '40' }}
          >
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Agency logo"
                loading="lazy"
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <span className="material-symbols-outlined text-5xl text-on-surface/10">add_photo_alternate</span>
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            <p className="text-sm text-on-surface/60 font-medium italic leading-relaxed max-w-md">
              Authorize your agency's official seal. Recommended: 200x200px (PNG, SVG, or high-res JPG). 
              This identifier will be projected across all insured-facing deployment protocols.
            </p>
            
            <div className="flex items-center gap-3">
              <label className="inline-block px-8 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-full cursor-pointer hover:shadow-lg transition-all">
                {branding.logoUrl ? 'Update Agency Seal' : 'Provision Logo Asset'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
              </label>
              
              {branding.logoUrl && (
                <button
                  onClick={() => setBranding({ ...branding, logoUrl: undefined })}
                  className="px-6 py-3 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-full border border-red-100 transition-all"
                >
                  Decommission
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Color Customization */}
      <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm p-8">
        <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-8">Agency Palette Protocols</h3>
        
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-on-surface/60 uppercase tracking-widest">
              Primary Authority Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="w-14 h-14 rounded-2xl cursor-pointer border border-black/10 bg-white p-1 shadow-sm"
              />
              <input
                type="text"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="flex-1 px-4 py-3 rounded-xl border border-black/10 bg-slate-50/50 font-mono text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                placeholder="#1e40af"
              />
            </div>
            <p className="text-[10px] font-medium text-on-surface/40 uppercase tracking-widest italic">Core identity color for commands and primary interface elements</p>
          </div>
          
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-on-surface/60 uppercase tracking-widest">
              Secondary Accent Protocol
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="w-14 h-14 rounded-2xl cursor-pointer border border-black/10 bg-white p-1 shadow-sm"
              />
              <input
                type="text"
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="flex-1 px-4 py-3 rounded-xl border border-black/10 bg-slate-50/50 font-mono text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                placeholder="#7c3aed"
              />
            </div>
            <p className="text-[10px] font-medium text-on-surface/40 uppercase tracking-widest italic">Highlights and secondary intelligence visualization</p>
          </div>
        </div>
        
        {/* Preview */}
        <div className="mt-10 p-8 rounded-3xl bg-slate-50/50 border border-black/5">
          <div className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-6">Interface Projection Preview</div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              className="px-8 py-3 text-white font-black text-[10px] uppercase tracking-widest rounded-full shadow-lg"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Commit Protocol
            </button>
            <button
              className="px-8 py-3 font-black text-[10px] uppercase tracking-widest rounded-full border-2 transition-all bg-white"
              style={{ borderColor: branding.primaryColor, color: branding.primaryColor }}
            >
              Analyze Data
            </button>
            <a href="#" className="text-sm font-bold underline underline-offset-4 decoration-2" style={{ color: branding.primaryColor }}>
              Download Forensic Report
            </a>
          </div>
        </div>
      </div>

      {/* Agency Information */}
      <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm p-8">
        <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-8">Command Center Registry</h3>
        
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-on-surface/60 uppercase tracking-widest block mb-2">
              Agency Value Proposition (Public)
            </label>
            <textarea
              value={branding.description}
              onChange={(e) => setBranding({ ...branding, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-black/10 bg-slate-50/50 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all resize-none italic"
              placeholder="Define your unique market authority and service level commitments..."
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] font-black text-on-surface/60 uppercase tracking-widest block mb-2">
                Command Direct Line
              </label>
              <input
                type="tel"
                value={branding.phone}
                onChange={(e) => setBranding({ ...branding, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-slate-50/50 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black text-on-surface/60 uppercase tracking-widest block mb-2">
                Official Intelligence Email
              </label>
              <input
                type="email"
                value={branding.email}
                onChange={(e) => setBranding({ ...branding, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-slate-50/50 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                placeholder="contact@agency.com"
              />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-black text-on-surface/60 uppercase tracking-widest block mb-2">
              Physical Headquarters
            </label>
            <input
              type="text"
              value={branding.address}
              onChange={(e) => setBranding({ ...branding, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-black/10 bg-slate-50/50 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
              placeholder="123 Main St, City, State 12345"
            />
          </div>
          
          <div>
            <label className="text-[10px] font-black text-on-surface/60 uppercase tracking-widest block mb-2">
              Operational Window (Business Hours)
            </label>
            <input
              type="text"
              value={branding.businessHours}
              onChange={(e) => setBranding({ ...branding, businessHours: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-black/10 bg-slate-50/50 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
              placeholder="Mon-Fri: 9am-5pm, Sat: 10am-2pm"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <button
          onClick={() => {
            setBranding({
              primaryColor: initialBranding.primaryColor || '#1e40af',
              secondaryColor: initialBranding.secondaryColor || '#7c3aed',
              logoUrl: initialBranding.logoUrl,
              description: initialBranding.description || '',
              phone: initialBranding.phone || '',
              email: initialBranding.email || '',
              address: initialBranding.address || '',
              businessHours: initialBranding.businessHours || '',
            });
            setWhiteLabelEnabled(initialEnabled);
          }}
          className="px-10 py-4 border border-black/10 text-on-surface/60 font-black text-xs uppercase tracking-widest rounded-full hover:bg-black/5 transition-all"
        >
          Abort Changes
        </button>
        
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-12 py-4 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-2xl transition-all disabled:opacity-50"
        >
          {isLoading ? 'Syncing...' : 'Commit Configuration'}
        </button>
      </div>
    </div>
  );
}
