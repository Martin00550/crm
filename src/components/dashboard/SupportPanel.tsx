'use client';

import { useState } from 'react';
import { 
  Bot, 
  Mail, 
  BookOpen, 
  MessageSquare,
  ArrowRight,
  Sparkles,
  LifeBuoy
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SupportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportPanel({ isOpen, onClose }: SupportPanelProps) {
  const handleAIClick = () => {
    window.dispatchEvent(new CustomEvent('open-chat', { 
      detail: { prompt: "I need help with the platform. What can you do?" } 
    }));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface rounded-[32px] shadow-2xl border border-black/5 overflow-hidden font-body">
        {/* Header */}
        <div className="p-8 border-b border-black/5 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
                <LifeBuoy className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface tracking-tight">Agency Support</h3>
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Active Resolution Center</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface/40 hover:text-on-surface hover:bg-black/5 transition-all"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-4">
          {/* AI Option */}
          <button 
            onClick={handleAIClick}
            className="w-full group p-5 bg-white border border-black/5 rounded-2xl hover:border-secondary/30 hover:shadow-lg transition-all text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles className="w-16 h-16 text-secondary" />
            </div>
            <div className="flex gap-4 relative z-10">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-black text-on-surface italic mb-1">Instant AI Assistant</h4>
                <p className="text-xs text-on-surface/50 font-medium leading-relaxed">
                  Best for "How-to" questions, data lookup, and usage guidance. Available 24/7.
                </p>
              </div>
            </div>
          </button>

          {/* Email Option */}
          <a 
            href="mailto:hello@retainvault.com"
            className="block w-full group p-5 bg-white border border-black/5 rounded-2xl hover:border-primary/30 hover:shadow-lg transition-all text-left"
          >
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                <Mail className="w-5 h-5 text-on-surface/40 group-hover:text-white" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-on-surface italic mb-1">Direct Human Support</h4>
                  <span className="text-[9px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    &lt; 24h Response
                  </span>
                </div>
                <p className="text-xs text-on-surface/50 font-medium leading-relaxed">
                  For technical bugs, billing issues, or high-priority agency needs.
                </p>
              </div>
            </div>
          </a>

          {/* Documentation Option */}
          <button 
            disabled
            className="w-full group p-5 bg-slate-50/50 border border-black/5 rounded-2xl opacity-60 cursor-not-allowed text-left"
          >
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-on-surface/40" />
              </div>
              <div>
                <h4 className="text-sm font-black text-on-surface italic mb-1">Knowledge Base</h4>
                <p className="text-xs text-on-surface/50 font-medium leading-relaxed">
                  Self-service documentation and video walkthroughs (Coming Soon).
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-black/5 bg-slate-50/50 flex justify-center">
          <p className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] italic">
            RetainVault Intelligence Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
