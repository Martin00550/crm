'use client';

import { useState, useEffect } from 'react';
import { Globe, Palette, Mail, Phone, Settings, ExternalLink, CheckCircle, AlertCircle, Shield, Trash2, Upload } from 'lucide-react';

interface PortalConfig {
  agencyId: string;
  subdomain: string;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    companyName: string;
    supportEmail: string;
    supportPhone?: string;
  };
  settings: {
    allowDocumentDownloads: boolean;
    allowPolicyDetails: boolean;
    allowRenewalRequests: boolean;
    requireTwoFactor: boolean;
  };
}

interface WhiteLabelPortalProps {
  agencyId: string;
  isDemo?: boolean;
}

export function WhiteLabelPortal({ agencyId, isDemo = false }: WhiteLabelPortalProps) {
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [agencyId]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      if (isDemo) {
        // Mock portal config for demo
        const mockConfig: PortalConfig = {
          agencyId: 'demo-agency',
          subdomain: 'demo-agency',
          branding: {
            primaryColor: '#000000',
            secondaryColor: '#34d399',
            companyName: 'Demo Agency Group',
            supportEmail: 'support@demo-agency.com',
          },
          settings: {
            allowDocumentDownloads: true,
            allowPolicyDetails: true,
            allowRenewalRequests: true,
            requireTwoFactor: false,
          }
        };
        setConfig(mockConfig);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/portal/config');
      const result = await res.json();
      
      if (!res.ok) {
        if (res.status === 403) {
          setError(result.upgradeMessage || 'Feature not available');
        } else {
          throw new Error(result.error || 'Failed to load portal configuration');
        }
        return;
      }

      setConfig(result.config);
      if (result.config.branding.logo) {
        setLogoPreview(result.config.branding.logo);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    setIsUploadingLogo(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agencyId', agencyId);

      const res = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload logo');
      }

      setLogoPreview(data.url);
      setConfig({
        ...config,
        branding: { ...config.branding, logo: data.key }
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    if (!config) return;
    setLogoPreview(null);
    setConfig({
      ...config,
      branding: { ...config.branding, logo: '' }
    });
  };

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (isDemo) {
        setSuccess('Portal configuration saved successfully! (Demo Mode)');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/portal/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to save portal configuration');
      }

      setConfig(result.config);
      setSuccess('Portal configuration saved successfully!');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const generateClientInvite = async (clientId: string) => {
    try {
      const res = await fetch('/api/portal/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to generate client invitation');
      }

      // Copy invite URL to clipboard
      navigator.clipboard.writeText(result.invite.portalUrl);
      setSuccess('Client invitation link copied to clipboard!');
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-32 bg-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-yellow-800 font-medium">Feature Not Available</p>
            <p className="text-yellow-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {config && (
        <>
          {/* Configuration Form */}
          <div className="bg-white rounded-[32px] border border-black/5 p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Portal Protocol Configuration</h2>
              <div className="flex flex-wrap items-center gap-3">
                {config.subdomain && (
                  <a
                    href={`https://${config.subdomain}.retainvault.tech`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-secondary/10 text-secondary rounded-full hover:bg-secondary hover:text-white transition-all border border-secondary/10 group/link"
                  >
                    <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Preview Deployment</span>
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Configuration Inputs */}
              <div className="lg:col-span-7 space-y-8">
                {/* Subdomain */}
                <div>
                  <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Exclusive Subdomain</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/20" />
                      <input
                        type="text"
                        value={config.subdomain}
                        onChange={(e) => setConfig({ ...config, subdomain: e.target.value })}
                        placeholder="your-agency"
                        className="w-full pl-12 pr-4 py-3 bg-background border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                      />
                    </div>
                    <span className="text-sm font-bold text-on-surface/40 italic">.retainvault.com</span>
                  </div>
                </div>

                {/* Support Email */}
                <div>
                  <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Insured Support Protocol</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/20" />
                    <input
                      type="email"
                      value={config.branding.supportEmail}
                      onChange={(e) => setConfig({
                        ...config,
                        branding: { ...config.branding, supportEmail: e.target.value }
                      })}
                      placeholder="support@youragency.com"
                      className="w-full pl-12 pr-4 py-3 bg-background border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                    />
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Primary Agency Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={config.branding.primaryColor}
                        onChange={(e) => setConfig({
                          ...config,
                          branding: { ...config.branding, primaryColor: e.target.value }
                        })}
                        className="w-12 h-12 border border-black/10 rounded-xl cursor-pointer bg-white p-1 shadow-sm"
                      />
                      <input
                        type="text"
                        value={config.branding.primaryColor}
                        onChange={(e) => setConfig({
                          ...config,
                          branding: { ...config.branding, primaryColor: e.target.value }
                        })}
                        className="flex-1 px-4 py-3 bg-background border border-black/10 rounded-xl text-[10px] font-mono font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Accent Branding Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={config.branding.secondaryColor}
                        onChange={(e) => setConfig({
                          ...config,
                          branding: { ...config.branding, secondaryColor: e.target.value }
                        })}
                        className="w-12 h-12 border border-black/10 rounded-xl cursor-pointer bg-white p-1 shadow-sm"
                      />
                      <input
                        type="text"
                        value={config.branding.secondaryColor}
                        onChange={(e) => setConfig({
                          ...config,
                          branding: { ...config.branding, secondaryColor: e.target.value }
                        })}
                        className="flex-1 px-4 py-3 bg-background border border-black/10 rounded-xl text-[10px] font-mono font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Agency Seal (Logo)</label>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-20 h-20 bg-background border border-black/10 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner relative group/logo">
                      {isUploadingLogo ? (
                        <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                      ) : logoPreview ? (
                        <>
                          <img
                            src={logoPreview}
                            alt="Company Logo"
                            className="w-full h-full object-contain p-2"
                          />
                          <button
                            onClick={removeLogo}
                            className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <Palette className="w-8 h-8 text-on-surface/10" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => document.getElementById('portal-logo-upload')?.click()}
                        disabled={isUploadingLogo}
                        className="w-full sm:w-auto px-6 py-2.5 bg-white border border-black/10 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-black/5 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingLogo ? 'Processing...' : 'Upload Asset'}
                      </button>
                      <input
                        id="portal-logo-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                      <p className="text-[9px] text-on-surface/30 font-bold uppercase tracking-widest italic">PNG/SVG with transparency recommended</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview Mockup */}
              <div className="lg:col-span-5">
                <div className="sticky top-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest italic">Live Visual Preview</h3>
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-secondary uppercase animate-pulse">
                      <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                      Realtime Protocol
                    </span>
                  </div>

                  <div className="aspect-[4/5] bg-slate-100 rounded-[32px] border border-black/5 shadow-2xl overflow-hidden relative group/mockup">
                    {/* Mockup Header */}
                    <div 
                      className="h-16 flex items-center px-6 border-b border-black/5 transition-colors duration-500"
                      style={{ backgroundColor: 'white' }}
                    >
                      <div className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} className="w-full h-full object-contain" alt="preview" />
                        ) : (
                          <div className="w-full h-full bg-slate-200 rounded" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 w-20 bg-slate-200 rounded-full" />
                        <div className="h-1.5 w-12 bg-slate-100 rounded-full" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-slate-50" />
                    </div>

                    {/* Mockup Content */}
                    <div className="p-6 space-y-4 bg-white/50 h-full">
                      <div className="space-y-2 mb-8">
                        <div className="h-4 w-3/4 bg-slate-200 rounded-full" />
                        <div className="h-3 w-1/2 bg-slate-100 rounded-full" />
                      </div>

                      {/* Mockup Executive Summary */}
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl transition-colors duration-500 flex items-center justify-center text-white" style={{ backgroundColor: config.branding.primaryColor }}>
                            <Shield className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="h-2.5 w-24 bg-slate-200 rounded-full" />
                            <div className="h-2 w-16 bg-slate-100 rounded-full" />
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="h-px w-full bg-slate-100" />
                          <div className="flex justify-between">
                            <div className="h-2 w-20 bg-slate-50 rounded-full" />
                            <div className="h-2 w-12 bg-slate-100 rounded-full" />
                          </div>
                          <div className="h-px w-full bg-slate-100" />
                          <div className="flex justify-between">
                            <div className="h-2 w-20 bg-slate-50 rounded-full" />
                            <div className="h-2 w-12 bg-slate-100 rounded-full" />
                          </div>
                        </div>

                        {/* Read Only Badge */}
                        <div className="pt-2">
                           <div className="h-8 w-full bg-slate-50 rounded-full border border-black/5 flex items-center justify-center">
                             <div className="h-1.5 w-24 bg-slate-200 rounded-full" />
                           </div>
                        </div>
                      </div>
                      
                      <p className="text-[8px] text-center text-slate-300 font-bold uppercase tracking-widest mt-4 italic">
                        Secured Portfolio: {config.subdomain}.retainvault.com
                      </p>
                    </div>

                    {/* Glow effect */}
                    <div 
                      className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-[100px] opacity-20 transition-colors duration-700"
                      style={{ backgroundColor: config.branding.primaryColor }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="mt-10 pt-8 border-t border-black/5">
              <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-6">Portal Access Permissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <label className="flex items-center space-x-3 group cursor-pointer">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={config.settings.allowDocumentDownloads}
                      onChange={(e) => setConfig({
                        ...config,
                        settings: { ...config.settings, allowDocumentDownloads: e.target.checked }
                      })}
                      className="w-5 h-5 rounded-lg border-black/10 text-secondary focus:ring-secondary/20 transition-all cursor-pointer"
                    />
                  </div>
                  <span className="text-sm font-bold text-on-surface/70 group-hover:text-on-surface transition-colors italic">Download Policy Documents</span>
                </label>
                <label className="flex items-center space-x-3 group cursor-pointer">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={config.settings.allowPolicyDetails}
                      onChange={(e) => setConfig({
                        ...config,
                        settings: { ...config.settings, allowPolicyDetails: e.target.checked }
                      })}
                      className="w-5 h-5 rounded-lg border-black/10 text-secondary focus:ring-secondary/20 transition-all cursor-pointer"
                    />
                  </div>
                  <span className="text-sm font-bold text-on-surface/70 group-hover:text-on-surface transition-colors italic">View Policy Details</span>
                </label>
                <label className="flex items-center space-x-3 group cursor-pointer">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={config.settings.allowRenewalRequests}
                      onChange={(e) => setConfig({
                        ...config,
                        settings: { ...config.settings, allowRenewalRequests: e.target.checked }
                      })}
                      className="w-5 h-5 rounded-lg border-black/10 text-secondary focus:ring-secondary/20 transition-all cursor-pointer"
                    />
                  </div>
                  <span className="text-sm font-bold text-on-surface/70 group-hover:text-on-surface transition-colors italic">Allow Renewal Request</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-black/5">
              <div className="w-full sm:w-auto">
                {error && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-2 rounded-full border border-red-100">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                  </div>
                )}
                {success && (
                  <div className="flex items-center space-x-2 text-secondary bg-secondary/5 px-4 py-2 rounded-full border border-secondary/10">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{success}</span>
                  </div>
                )}
              </div>
              <button
                onClick={saveConfig}
                disabled={saving}
                className="w-full sm:w-auto px-12 py-4 bg-secondary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center"
              >
                {saving ? 'Syncing...' : 'Commit Configuration'}
              </button>
            </div>
          </div>

          {/* Client Invitations */}
          <div className="bg-white rounded-[32px] border border-black/5 p-6 md:p-8 shadow-sm">
            <h2 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-4">Insured Portfolio Access</h2>
            <p className="text-sm text-on-surface/50 font-medium italic mb-6">
              Generate secure, single-use authentication links for your insured portfolio.
            </p>
            
            <div className="bg-background rounded-2xl p-6 border border-black/5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/5 text-on-surface/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface font-headline italic">Standard Deployment Protocol</p>
                  <p className="text-xs text-on-surface/40 font-medium mt-1 leading-relaxed italic">
                    To authorize portal access, navigate to the specific Insured profile and select "Enable Portal Access". 
                    All credentials utilize 256-bit encryption and expire automatically after 7 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
