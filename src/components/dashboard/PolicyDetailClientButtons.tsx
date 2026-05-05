'use client';

import { useState } from 'react';
import { Edit, FileText, CheckCircle2 } from 'lucide-react';

export function AuthorizeUpdatesButton() {
  const [status, setStatus] = useState<'idle' | 'authorizing' | 'done'>('idle');

  const handleClick = () => {
    setStatus('authorizing');
    setTimeout(() => setStatus('done'), 1500);
    setTimeout(() => setStatus('idle'), 4500);
  };

  return (
    <button 
      onClick={handleClick}
      disabled={status !== 'idle'}
      className="w-full mt-12 py-5 px-8 bg-primary text-white rounded-full font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-80"
    >
      {status === 'idle' && (
        <>
          <Edit className="w-4 h-4" />
          Authorize Placement Updates
        </>
      )}
      {status === 'authorizing' && (
        <>
          <span className="material-symbols-outlined text-sm animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>refresh</span>
          Processing Authorization...
        </>
      )}
      {status === 'done' && (
        <>
          <CheckCircle2 className="w-4 h-4 text-secondary" />
          Authorization Granted
        </>
      )}
    </button>
  );
}

export function DispatchExplainerButton({ policyId }: { policyId: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleClick = () => {
    setStatus('sending');
    setTimeout(() => setStatus('sent'), 1500);
    setTimeout(() => setStatus('idle'), 4500);
  };

  return (
    <button 
      onClick={handleClick}
      disabled={status !== 'idle'}
      className="w-full py-5 px-10 bg-secondary text-white rounded-full font-black flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-secondary/30 transition-all shadow-lg active:scale-[0.98] text-[10px] uppercase tracking-[0.2em] disabled:opacity-80"
    >
      {status === 'idle' && (
        <>
          <FileText className="w-4 h-4" />
          Dispatch Analysis Explainer
        </>
      )}
      {status === 'sending' && (
        <>
          <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
          Dispatching Document...
        </>
      )}
      {status === 'sent' && (
        <>
          <CheckCircle2 className="w-4 h-4" />
          Explainer Dispatched
        </>
      )}
    </button>
  );
}
