'use client';

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

interface AIUsageCounterProps {
  agencyId: string;
  tier: string;
}

export function AIUsageCounter({ agencyId, tier }: AIUsageCounterProps) {
  const [usage, setUsage] = useState<{ current: number; limit: number | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, [agencyId]);

  async function loadUsage() {
    try {
      const res = await fetch(`/api/ai-usage?agencyId=${agencyId}`);
      const data = await res.json();
      setUsage(data);
    } catch (error) {
      console.error('Failed to load AI usage:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !usage) {
    return <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-xl border border-black/5" />;
  }

  // Don't show for unlimited tiers
  if (usage.limit === null || usage.limit === Infinity) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-secondary/5 border border-secondary/10 rounded-xl shadow-sm">
        <Sparkles className="w-4 h-4 text-secondary" style={{ fontVariationSettings: "'FILL' 1" }} />
        <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Unlimited AI Analysis</span>
      </div>
    );
  }

  const percentage = (usage.current / usage.limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = usage.current >= usage.limit;

  return (
    <div className="flex items-center gap-3 font-body">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
        isAtLimit 
          ? 'bg-red-50 border-red-200 shadow-[0_2px_10px_rgba(220,38,38,0.05)]' 
          : isNearLimit 
          ? 'bg-amber-50 border-amber-200 shadow-[0_2px_10px_rgba(245,158,11,0.05)]' 
          : 'bg-surface border-black/5 shadow-sm'
      }`}>
        <Sparkles className={`w-4 h-4 ${
          isAtLimit 
            ? 'text-red-600' 
            : isNearLimit 
            ? 'text-amber-600' 
            : 'text-secondary'
        }`} style={{ fontVariationSettings: "'FILL' 1" }} />
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase tracking-widest ${
            isAtLimit 
              ? 'text-red-700' 
              : isNearLimit 
              ? 'text-amber-700' 
              : 'text-on-surface/60'
          }`}>
            {usage.current}/{usage.limit}
          </span>
          <span className="text-[10px] font-black text-on-surface/20 uppercase tracking-widest">Analysis Credits</span>
        </div>
      </div>


      {/* Upgrade prompt */}
      {isAtLimit && tier === 'solo' && (
        <a 
          href="/pricing" 
          className="text-[10px] font-black text-secondary hover:text-secondary/80 transition-all flex items-center gap-1 uppercase tracking-widest border-b border-secondary/20 hover:border-secondary pb-0.5"
        >
          <TrendingUp className="w-3 h-3" />
          Authorize Expansion
        </a>
      )}
    </div>
  );
}
