import { BrandingConfig, sanitizeColor, isValidHexColor } from '@/lib/branding';

interface BrandedLayoutProps {
  agencyName: string;
  branding: BrandingConfig;
  children: React.ReactNode;
}

export function BrandedLayout({ agencyName, branding, children }: BrandedLayoutProps) {
  // Sanitize colors to prevent XSS
  const primaryColor = sanitizeColor(branding.primaryColor);
  const secondaryColor = sanitizeColor(branding.secondaryColor);

  // Validate colors are safe hex format
  if (!isValidHexColor(primaryColor) || !isValidHexColor(secondaryColor)) {
    throw new Error('Invalid color format in branding configuration');
  }

  const cssVariables = `
    :root {
      --brand-primary: ${primaryColor};
      --brand-secondary: ${secondaryColor};
      --brand-primary-10: ${primaryColor}1a;
      --brand-primary-20: ${primaryColor}33;
      --brand-primary-50: ${primaryColor}80;
      --brand-secondary-10: ${secondaryColor}1a;
      --brand-secondary-20: ${secondaryColor}33;
      --brand-secondary-50: ${secondaryColor}80;
    }
  `;

  return (
    <>
      <style>{cssVariables}</style>
      <div className="min-h-screen bg-slate-950 text-white selection:bg-primary/30">
        {/* Header */}
        <header className="bg-slate-900/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              {branding.logoUrl ? (
                <img 
                  src={branding.logoUrl} 
                  alt={`${agencyName} logo`}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {agencyName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="text-lg font-black tracking-tight block">{agencyName}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Secure Client Portal</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              {branding.phone && (
                <a href={`tel:${branding.phone}`} className="flex items-center gap-2 text-white/60 hover:text-white transition-all group">
                  <span className="material-symbols-outlined text-sm text-primary">phone</span>
                  <span className="text-xs font-black uppercase tracking-widest">{branding.phone}</span>
                </a>
              )}
              {branding.email && (
                <a href={`mailto:${branding.email}`} className="flex items-center gap-2 text-white/60 hover:text-white transition-all group">
                  <span className="material-symbols-outlined text-sm text-primary">mail</span>
                  <span className="text-xs font-black uppercase tracking-widest">{branding.email}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              {branding.logoUrl ? (
                <img 
                  src={branding.logoUrl} 
                  alt={`${agencyName} logo`}
                  className="h-6 w-auto object-contain opacity-40 grayscale"
                />
              ) : (
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center text-white font-black text-[10px] opacity-40 grayscale"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {agencyName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-bold text-white/40">{agencyName} &copy; {new Date().getFullYear()}</span>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                Secure Infrastructure Powered by <a href="https://retainvault.com" className="hover:text-primary transition-colors">RetainVault</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
