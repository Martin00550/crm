"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricComparisonProps {
  current: number | string;
  previous?: number | string;
  trend?: 'up' | 'down' | 'neutral';
  label?: string;
  type?: 'currency' | 'number' | 'percentage';
  color?: string;
}

/**
 * A high-authority metric comparison component for agency owners.
 * Replaces generic sparklines with clear, actionable data deltas.
 */
export function MetricComparison({ 
  current, 
  previous, 
  trend = 'neutral', 
  label, 
  type = 'number',
  color
}: MetricComparisonProps) {
  const formatValue = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : val;
    if (isNaN(num)) return val;
    
    if (type === 'currency') return `$${num.toLocaleString()}`;
    if (type === 'percentage') return `${num}%`;
    return num.toLocaleString();
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-secondary bg-secondary/5 border-secondary/10';
    if (trend === 'down') return 'text-red-500 bg-red-50 border-red-100';
    return 'text-on-surface/40 bg-slate-50 border-black/5';
  };

  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="flex items-center justify-between w-full mt-4">
      <div className="flex flex-col">
        {label && (
          <span className="text-[9px] font-black text-on-surface/20 uppercase tracking-widest mb-1">{label}</span>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-on-surface/60">
            {previous ? formatValue(previous) : 'N/A'}
          </span>
          {previous && (
            <span className="text-[10px] text-on-surface/20 font-medium italic">prior period</span>
          )}
        </div>
      </div>

      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${getTrendColor()} transition-all`}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[11px] font-black uppercase tracking-widest">
          {trend === 'neutral' ? 'Stable' : trend === 'up' ? 'Growth' : 'Risk'}
        </span>
      </div>
    </div>
  );
}
