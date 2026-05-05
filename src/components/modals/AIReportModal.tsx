"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Sparkles, Loader2, Send } from "lucide-react";

interface AIReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  policyType: string;
  carrier: string;
  premium: number;
  policyId?: string;
  isDemo?: boolean;
  onSend?: () => void;
}

// Hardcoded AI responses for demo mode (no Gemini API call)
const DEMO_RESPONSES = [
  (policyType: string, carrier: string) => `ANALYSIS COMPLETE: Our analysis of the current "Hard Market" indicates that ${carrier} is adjusting ${policyType} premiums upwards by 12%. This is driven by aggregate coastal liability shifts. However, your loss-run history remains superior. STRATEGY: Maintain current policy but prepare a "Strategy Summary" for the insured.`,
  (policyType: string, carrier: string) => `RATE ANALYSIS: The 15% spike in ${policyType} with ${carrier} is a result of carrier-wide re-insurance hikes. We have cross-referenced this against 8 competing carriers. PROPOSAL: Deployed a "Rate Analysis Explainer" to the insured to justify the adjustment based on re-insurance data.`,
  (policyType: string, carrier: string) => `PORTFOLIO ALERT: ${policyType} with ${carrier} is currently priced at a 14% discount to current market replacement cost. This is a "Preferred Policy" that must be secured. ACTION: Initiate 90-day automated outreach to confirm renewal before carrier re-rating occurs.`,
];

export function AIReportModal({ 
  isOpen, 
  onClose, 
  clientName, 
  policyType, 
  carrier, 
  policyId,
  premium,
  isDemo = true,
  onSend 
}: AIReportModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const generateReport = useCallback(async () => {
    setIsGenerating(true);
    
    if (policyId && !isDemo) {
      // LIVE MODE: Call the rate explainer API
      try {
        const response = await fetch('/api/rate-explainer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ policyId }),
        });
        
        const data = await response.json();
        
        if (data.success && data.report) {
          setReport(data.report);
        } else {
          // Fallback to demo response if API fails
          await new Promise(resolve => setTimeout(resolve, 1500));
          const randomResponse = DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
          setReport(randomResponse(policyType, carrier));
        }
      } catch (error) {
        console.error('Rate explainer API error:', error);
        // Fallback to demo response on error
        await new Promise(resolve => setTimeout(resolve, 1500));
        const randomResponse = DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
        setReport(randomResponse(policyType, carrier));
      }
    } else {
      // DEMO MODE: Use setTimeout with hardcoded response (NOT Gemini API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      const randomResponse = DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
      setReport(randomResponse(policyType, carrier));
    }
    
    setIsGenerating(false);
  }, [isDemo, policyId, policyType, carrier]);

  useEffect(() => {
    if (isOpen && !report && !isGenerating) {
      generateReport();
    }
  }, [isOpen, generateReport, report, isGenerating]);

  const handleSend = () => {
    setIsSent(true);
    onSend?.();
    setTimeout(() => {
      onClose();
      setIsSent(false);
      setReport(null);
    }, 1500);
  };

  const handleClose = () => {
    setReport(null);
    setIsSent(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI Rate Analysis" maxWidth="lg">
      <div className="space-y-8 font-body p-2">
        <div className="flex items-center gap-5 p-6 bg-slate-50/50 rounded-[24px] border border-black/5 shadow-inner">
          <div className="w-14 h-14 rounded-2xl bg-secondary text-white flex items-center justify-center shadow-lg transition-transform hover:rotate-3">
            <Sparkles className="w-7 h-7" style={{ fontVariationSettings: "'FILL' 1" }} />
          </div>
          <div>
            <p className="font-black text-on-surface font-headline italic text-xl tracking-tight leading-none">{clientName}</p>
            <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mt-2">
              {carrier} • {policyType} • Premium: ${premium.toLocaleString()}
            </p>
          </div>
        </div>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-50/30 rounded-[32px] border border-black/5">
            <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin shadow-sm mb-6" />
            <p className="text-sm font-black text-on-surface uppercase tracking-[0.2em] animate-pulse">Syncing carrier analysis...</p>
            <p className="text-[10px] font-bold text-on-surface/20 uppercase tracking-widest mt-2 italic">Scanning market trends & loss-run patterns</p>
          </div>
        ) : report ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 bg-surface rounded-[32px] border border-black/5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <span className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Policy Summary</span>
                <div className="h-px flex-1 bg-black/5"></div>
              </div>
              <p className="text-on-surface font-medium italic text-lg leading-relaxed relative z-10">
                "{report}"
              </p>
            </div>
            
            {isSent ? (
              <div className="flex items-center justify-center gap-4 p-6 bg-secondary/5 text-secondary rounded-[24px] border border-secondary/10 shadow-sm animate-in zoom-in-95">
                <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center shadow-md">
                  <Send className="w-5 h-5" />
                </div>
                <span className="font-black text-sm uppercase tracking-[0.2em]">Analysis Explainer Dispatched</span>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-6 pt-4">
                <button
                  onClick={handleClose}
                  className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest hover:text-on-surface transition-all pb-1 border-b border-transparent hover:border-on-surface/20"
                >
                  Discard Analysis
                </button>
                <button
                  onClick={handleSend}
                  className="flex items-center gap-3 px-10 py-4 bg-primary text-white font-black rounded-full hover:shadow-2xl hover:shadow-primary/30 transition-all text-xs uppercase tracking-[0.2em] active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" />
                  Dispatch to Insured
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
