'use client';

import { Sparkles } from 'lucide-react';

interface GenerateAIReportButtonProps {
  prompt: string;
  label?: string;
  variant?: 'primary' | 'secondary';
}

export function GenerateAIReportButton({ 
  prompt, 
  label = 'Generate AI Report',
  variant = 'primary'
}: GenerateAIReportButtonProps) {
  const handleClick = () => {
    const event = new CustomEvent('openChat', { detail: { prompt } });
    window.dispatchEvent(event);
  };

  if (variant === 'secondary') {
    return (
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-white text-primary font-black text-[10px] uppercase tracking-widest rounded-full hover:shadow-lg transition-all flex items-center gap-2 flex-shrink-0"
      >
        <Sparkles className="w-4 h-4" />
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="px-6 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-full hover:shadow-lg transition-all flex items-center gap-2"
    >
      <span className="material-symbols-outlined text-sm">auto_awesome</span>
      {label}
    </button>
  );
}
