'use client';

import Link from 'next/link';
import { getTierDisplayName, getTierPrice } from '@/lib/features';

interface UpgradePromptProps {
  featureName: string;
  currentUsage?: number;
  limit?: number;
  message?: string;
  suggestedTier?: 'growth' | 'enterprise';
}

export function UpgradePrompt({ 
  featureName, 
  currentUsage, 
  limit, 
  message,
  suggestedTier = 'growth'
}: UpgradePromptProps) {
  const tierName = getTierDisplayName(suggestedTier);
  const tierPrice = getTierPrice(suggestedTier);

  return (
    <div className="bg-surface rounded-[32px] border border-black/5 shadow-2xl p-10 text-center relative overflow-hidden font-body animate-in zoom-in-95 duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
      
      <div className="w-20 h-20 bg-secondary/10 rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-inner border border-secondary/10">
        <span className="material-symbols-outlined text-5xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
      </div>
      
      <h3 className="text-2xl font-black text-on-surface italic font-headline mb-3 tracking-tight">
        {message || `Authorize ${featureName} Protocol`}
      </h3>
      
      {currentUsage !== undefined && limit !== undefined && (
        <p className="text-sm font-bold text-on-surface/40 uppercase tracking-widest mb-4">
          Payload Deployment: <span className="text-secondary">{currentUsage}/{limit}</span> {featureName}
        </p>
      )}
      
      <p className="text-sm text-on-surface/60 mb-8 max-w-md mx-auto font-medium leading-relaxed italic">
        Unlock unrestricted access to {featureName} and the full suite of Agency Command intelligence with {tierName}.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center px-10 py-4 bg-secondary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-2xl hover:shadow-secondary/20 transition-all active:scale-[0.98]"
        >
          Authorize {tierName} Deployment — ${tierPrice}/cycle
        </Link>
        
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center px-10 py-4 border border-black/10 text-on-surface/60 font-black text-xs uppercase tracking-widest rounded-full hover:bg-black/5 transition-all"
        >
          Review Expansion Plans
        </Link>
      </div>
    </div>
  );
}

// Smaller inline version for buttons
export function UpgradeBadge({ 
  featureName,
  suggestedTier = 'growth'
}: { 
  featureName: string;
  suggestedTier?: 'growth' | 'enterprise';
}) {
  const tierName = getTierDisplayName(suggestedTier);
  const tierPrice = getTierPrice(suggestedTier);

  return (
    <Link
      href="/pricing"
      className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/5 text-secondary font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-secondary/10 border border-secondary/10 transition-all shadow-sm"
    >
      <span className="material-symbols-outlined text-xs">lock</span>
      Authorize {tierName} Expansion (${tierPrice}/cycle)
    </Link>
  );
}

// Feature locked overlay
export function FeatureLockedOverlay({ 
  featureName,
  suggestedTier = 'growth',
  children 
}: { 
  featureName: string;
  suggestedTier?: 'growth' | 'enterprise';
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none blur-md grayscale transition-all duration-1000">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-[32px] p-8">
        <UpgradePrompt featureName={featureName} suggestedTier={suggestedTier} />
      </div>
    </div>
  );
}
