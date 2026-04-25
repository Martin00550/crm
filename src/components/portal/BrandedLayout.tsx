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
      <div>
        {/* Header */}
        <header className="bg-white border-b border-black/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {branding.logoUrl ? (
                <img 
                  src={branding.logoUrl} 
                  alt={`${agencyName} logo`}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-lg"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {agencyName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xl font-bold text-slate-900">{agencyName}</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <a href="#about" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                About
              </a>
              <a href="#services" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Services
              </a>
              <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Contact
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-black/5 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              {branding.logoUrl ? (
                <img 
                  src={branding.logoUrl} 
                  alt={`${agencyName} logo`}
                  className="h-8 w-auto object-contain opacity-60"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm opacity-60"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {agencyName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-slate-600">{agencyName}</span>
            </div>
            
            <div className="text-xs text-slate-500">
              Powered by <a href="https://bookguard.tech" className="font-bold hover:text-slate-700 transition-colors">BookGuard</a>
            </div>
          </div>
          
          {branding.phone || branding.email || branding.address ? (
            <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap gap-6 text-xs text-slate-500">
              {branding.phone && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">phone</span>
                  {branding.phone}
                </div>
              )}
              {branding.email && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">mail</span>
                  {branding.email}
                </div>
              )}
              {branding.address && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {branding.address}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </footer>
      </div>
    </>
  );
}
