'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  return (
    <Button
      onClick={handleClick}
      variant={variant === 'secondary' ? 'white' : 'default'}
      size="sm"
      leftIcon={<Sparkles className="w-4 h-4" />}
      className={variant === 'secondary' ? "text-primary flex-shrink-0" : ""}
    >
      {label}
    </Button>
  );
}
