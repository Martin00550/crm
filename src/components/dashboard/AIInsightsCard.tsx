'use client';

import { ArrowRight, TrendingUp, AlertTriangle, CheckCircle, Target, Zap } from 'lucide-react';
import Link from 'next/link';

export function AIInsightsCard({ stats }: { stats: { renewalsAtRisk: { count: number; volume: string } } }) {
  const hasRisks = stats.renewalsAtRisk.count > 0;

  const quickActions = hasRisks ? [
    {
      icon: AlertTriangle,
      label: 'Review At-Risk',
      href: '/dashboard/renewals',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      icon: Target,
      label: 'Contact Top 5',
      action: () => {
        const prompt = `Show me the top 5 at-risk policies and draft personalized outreach emails for each client.`;
        window.dispatchEvent(new CustomEvent('open-chat', { detail: { prompt } }));
      },
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      icon: Zap,
      label: 'Rate Analysis',
      action: () => {
        const prompt = `Analyze rate increases for at-risk policies and explain why clients might be shopping around.`;
        window.dispatchEvent(new CustomEvent('open-chat', { detail: { prompt } }));
      },
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ] : [
    {
      icon: TrendingUp,
      label: 'Growth Analysis',
      action: () => {
        const prompt = 'Analyze my portfolio growth trends and identify expansion opportunities.';
        window.dispatchEvent(new CustomEvent('open-chat', { detail: { prompt } }));
      },
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      icon: CheckCircle,
      label: 'Health Check',
      action: () => {
        const prompt = 'Run a comprehensive portfolio health check and show me any optimization opportunities.';
        window.dispatchEvent(new CustomEvent('open-chat', { detail: { prompt } }));
      },
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
  ];

  return (
    <div className="relative overflow-hidden bg-primary text-primary-foreground rounded-[32px] p-8 shadow-2xl group">
      <div className="absolute inset-0 opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary rounded-full blur-3xl animate-pulse"></div>
      </div>
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-secondary">AI Intelligence</span>
          </div>
          <button 
            onClick={() => {
              const prompt = hasRisks
                ? `Analyze the ${stats.renewalsAtRisk.count} at-risk policies with $${parseFloat(stats.renewalsAtRisk.volume).toLocaleString()} in premium. Show me which policies need attention and draft outreach recommendations.`
                : 'Run a full portfolio health check and show me any issues or opportunities.';
              window.dispatchEvent(new CustomEvent('open-chat', { detail: { prompt } }));
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-black text-[10px] uppercase tracking-[0.15em] flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Analyze
          </button>
        </div>
        
        <h5 className="text-2xl font-black leading-tight font-headline italic tracking-tight text-white">
          {hasRisks 
            ? `${stats.renewalsAtRisk.count} active ${stats.renewalsAtRisk.count === 1 ? 'policy' : 'policies'} require attention.`
            : "Portfolio healthy. No urgent renewal risks detected."}
        </h5>
        
        <p className="text-sm text-white/60 leading-relaxed font-medium italic">
          {hasRisks 
            ? `Total Premium at Risk: $${parseFloat(stats.renewalsAtRisk.volume).toLocaleString()}. Take action now to protect your book.`
            : "Continue monitoring your 90-day renewal cycle for strategic expansion opportunities."}
        </p>

        {/* Quick Actions */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Quick Actions</p>
          <div className="grid grid-cols-1 gap-2">
            {quickActions.map((action, i) => (
              action.href ? (
                <Link
                  key={i}
                  href={action.href}
                  className={`flex items-center justify-between p-3 rounded-xl ${action.bg} hover:bg-white/10 transition-all group/item`}
                >
                  <div className="flex items-center gap-3">
                    <action.icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-xs font-medium text-white">{action.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/40 group-hover/item:text-white group-hover/item:translate-x-1 transition-all" />
                </Link>
              ) : (
                <button
                  key={i}
                  onClick={action.action}
                  className={`flex items-center justify-between p-3 rounded-xl ${action.bg} hover:bg-white/10 transition-all group/item w-full`}
                >
                  <div className="flex items-center gap-3">
                    <action.icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-xs font-medium text-white">{action.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/40 group-hover/item:text-white group-hover/item:translate-x-1 transition-all" />
                </button>
              )
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button 
            onClick={() => {
              const prompt = hasRisks
                ? `Analyze the ${stats.renewalsAtRisk.count} at-risk policies with $${parseFloat(stats.renewalsAtRisk.volume).toLocaleString()} in premium. Show me which policies need attention and draft outreach recommendations.`
                : 'Run a full portfolio health check and show me any issues or opportunities.';
              window.dispatchEvent(new CustomEvent('open-chat', { detail: { prompt } }));
            }}
            className="w-full bg-secondary text-white py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-secondary/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            Generate Full Report
            <span className="material-symbols-outlined text-sm">visibility</span>
          </button>
        </div>
      </div>
    </div>
  );
}
