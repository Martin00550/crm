'use client';

import { TrendingUp, AlertTriangle, CheckCircle, Target, Zap } from 'lucide-react';
import Link from 'next/link';

export function AIInsightsCard({ stats, isDemo = false }: { stats: { renewalsAtRisk: { count: number; volume: string } }, isDemo?: boolean }) {
  const hasRisks = stats.renewalsAtRisk.count > 0;

  const quickActions = hasRisks ? [
    {
      icon: AlertTriangle,
      label: 'Review At-Risk',
      href: isDemo ? '/demo/renewals' : '/dashboard/renewals',
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      icon: Target,
      label: 'Outreach Plan',
      action: () => {
        const prompt = `Show me the top 5 at-risk policies and draft personalized outreach emails for each client.`;
        window.dispatchEvent(new CustomEvent('open-chat', { detail: { prompt } }));
      },
      color: 'text-secondary',
      bg: 'bg-secondary/5',
    },
  ] : [
    {
      icon: TrendingUp,
      label: 'Growth Trends',
      action: () => {
        const prompt = 'Analyze my portfolio growth trends and identify expansion opportunities.';
        window.dispatchEvent(new CustomEvent('open-chat', { detail: { prompt } }));
      },
      color: 'text-secondary',
      bg: 'bg-secondary/5',
    },
    {
      icon: CheckCircle,
      label: 'Health Check',
      action: () => {
        const prompt = 'Run a comprehensive portfolio health check and show me any optimization opportunities.';
        window.dispatchEvent(new CustomEvent('open-chat', { detail: { prompt } }));
      },
      color: 'text-on-surface/40',
      bg: 'bg-on-surface/5',
    },
  ];

  return (
    <div className="relative bg-white rounded-3xl p-8 border border-black/5 shadow-sm overflow-hidden group">
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
        {/* Main Briefing */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-secondary" />
            </div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-on-surface/30">Portfolio Intelligence</span>
          </div>
          
          <div>
            <h5 className="text-3xl font-bold tracking-tight text-on-surface mb-2">
              {hasRisks 
                ? `${stats.renewalsAtRisk.count} Priority Alerts`
                : "Your Book is Healthy"}
            </h5>
            <p className="text-sm text-on-surface/50 max-w-md leading-relaxed font-medium">
              {hasRisks 
                ? `We've identified $${parseFloat(stats.renewalsAtRisk.volume).toLocaleString()} in premium volume requiring immediate renewal strategy.`
                : "Your 90-day renewal cycle is stable. All indicators are within optimal safety parameters."}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-4">
          {quickActions.map((action, i) => (
            action.href ? (
              <Link
                key={i}
                href={action.href}
                className={`flex items-center gap-3 py-3 px-6 rounded-2xl border border-black/5 bg-white hover:bg-slate-50 transition-all shadow-sm`}
              >
                <action.icon className={`w-4 h-4 ${action.color}`} />
                <span className="text-[11px] font-bold text-on-surface/60 uppercase tracking-widest">{action.label}</span>
              </Link>
            ) : (
              <button
                key={i}
                onClick={action.action}
                className={`flex items-center gap-3 py-3 px-6 rounded-2xl border border-black/5 bg-white hover:bg-slate-50 transition-all shadow-sm`}
              >
                <action.icon className={`w-4 h-4 ${action.color}`} />
                <span className="text-[11px] font-bold text-on-surface/60 uppercase tracking-widest">{action.label}</span>
              </button>
            )
          ))}
          <button 
            onClick={() => {
              const prompt = hasRisks
                ? `Analyze the ${stats.renewalsAtRisk.count} at-risk policies with $${parseFloat(stats.renewalsAtRisk.volume).toLocaleString()} in premium. Show me which policies need attention and draft outreach recommendations.`
                : 'Run a full portfolio health check and show me any issues or opportunities.';
              window.dispatchEvent(new CustomEvent('open-chat', { detail: { prompt } }));
            }}
            className="flex items-center gap-3 py-3 px-8 rounded-2xl bg-primary text-white hover:opacity-90 transition-all shadow-md ml-2"
          >
            <Target className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-widest">Full Review</span>
          </button>
        </div>
      </div>
    </div>
  );
}
