'use client';

import { useState, useEffect } from 'react';
import { Globe, Palette, Mail, Phone, Settings, ExternalLink, CheckCircle, AlertCircle, Shield } from 'lucide-react';

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
}

export function WhiteLabelPortal({ agencyId }: WhiteLabelPortalProps) {
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadConfig();
  }, [agencyId]);

  const loadConfig = async () => {
    setLoading(true);
    try {
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
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-secondary" />
          </div>
          <h1 className="text-2xl font-black text-on-surface italic font-headline tracking-tight">Branded Insured Portal</h1>
        </div>
        <p className="text-on-surface/60 font-medium italic">Configure your exclusive agency portal for high-premium insured servicing</p>
      </div>

      {/* Feature Info */}
      <div className="bg-surface border border-black/5 rounded-[32px] p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="flex items-start space-x-6 relative z-10">
          <div className="w-14 h-14 bg-secondary text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-on-surface italic font-headline mb-2">Agency Command Intelligence</h3>
            <p className="text-on-surface/70 mb-6 font-medium leading-relaxed max-w-2xl">
              Project authority to your wealthiest clients. Provide a professional, branded portal experience featuring your exclusive agency identity. 
              Secure your Book of Business with real-time transparency and carrier-grade security.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <Palette className="w-4 h-4 text-secondary" />
                <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Custom Branding</span>
              </div>
              <div className="flex items-center space-x-3">
                <Globe className="w-4 h-4 text-secondary" />
                <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Exclusive Subdomain</span>
              </div>
              <div className="flex items-center space-x-3">
                <ExternalLink className="w-4 h-4 text-secondary" />
                <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Insured Access</span>
              </div>
              <div className="flex items-center space-x-3">
                <Settings className="w-4 h-4 text-secondary" />
                <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Command Control</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {config && (
        <>
          {/* Configuration Form */}
          <div className="bg-surface rounded-[32px] border border-black/5 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Portal Protocol Configuration</h2>
              <div className="flex items-center space-x-2">
                {config.subdomain && (
                  <a
                    href={`https://${config.subdomain}.bookguard.tech`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-secondary/5 text-secondary rounded-full hover:bg-secondary/10 transition-all border border-secondary/10"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Preview Deployment</span>
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                    />
                  </div>
                  <span className="text-sm font-bold text-on-surface/40 italic">.bookguard.tech</span>
                </div>
                <p className="text-[10px] font-bold text-on-surface/20 mt-2 uppercase tracking-widest italic">
                  Lower-case alpha-numeric deployment IDs only
                </p>
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
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                  />
                </div>
              </div>

              {/* Primary Color */}
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
                    className="w-12 h-12 border border-black/10 rounded-xl cursor-pointer bg-white p-1"
                  />
                  <input
                    type="text"
                    value={config.branding.primaryColor}
                    onChange={(e) => setConfig({
                      ...config,
                      branding: { ...config.branding, primaryColor: e.target.value }
                    })}
                    className="flex-1 px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-mono font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                  />
                </div>
              </div>

              {/* Secondary Color */}
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
                    className="w-12 h-12 border border-black/10 rounded-xl cursor-pointer bg-white p-1"
                  />
                  <input
                    type="text"
                    value={config.branding.secondaryColor}
                    onChange={(e) => setConfig({
                      ...config,
                      branding: { ...config.branding, secondaryColor: e.target.value }
                    })}
                    className="flex-1 px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-mono font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                  />
                </div>
              </div>

              {/* Support Phone */}
              <div>
                <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Direct Command Line (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/20" />
                  <input
                    type="tel"
                    value={config.branding.supportPhone || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      branding: { ...config.branding, supportPhone: e.target.value }
                    })}
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">Agency Seal (Logo)</label>
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-slate-50 border border-black/10 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
                    {config.branding.logo ? (
                      <img
                        src={config.branding.logo}
                        alt="Company Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Palette className="w-8 h-8 text-on-surface/10" />
                    )}
                  </div>
                  <button
                    type="button"
                    className="px-6 py-2.5 bg-white border border-black/10 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-black/5 transition-all shadow-sm"
                  >
                    Upload Asset
                  </button>
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
                  <span className="text-sm font-bold text-on-surface/70 group-hover:text-on-surface transition-colors">Download Policy Documents</span>
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
                  <span className="text-sm font-bold text-on-surface/70 group-hover:text-on-surface transition-colors">View Forensic Details</span>
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
                  <span className="text-sm font-bold text-on-surface/70 group-hover:text-on-surface transition-colors">Initialize Renewal Request</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-10 flex items-center justify-between pt-8 border-t border-black/5">
              <div>
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
                className="px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Syncing...' : 'Commit Configuration'}
              </button>
            </div>
          </div>

          {/* Client Invitations */}
          <div className="bg-surface rounded-[32px] border border-black/5 p-8 shadow-sm">
            <h2 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-4">Insured Portfolio Access</h2>
            <p className="text-sm text-on-surface/60 font-medium italic mb-6">
              Generate secure, single-use authentication links for your insured portfolio.
            </p>
            
            <div className="bg-slate-50/50 rounded-2xl p-6 border border-black/5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/5 text-on-surface/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Standard Deployment Protocol</p>
                  <p className="text-xs text-on-surface/40 font-medium mt-1 leading-relaxed">
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
