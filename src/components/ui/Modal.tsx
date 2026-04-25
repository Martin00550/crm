"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "md" }: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        "relative z-10 w-full bg-surface rounded-[32px] shadow-2xl border border-black/5 font-body animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]",
        maxWidthClasses[maxWidth]
      )}>
        {/* Header - Fixed */}
        <div className="flex-none flex items-center justify-between px-8 py-6 border-b border-black/5 bg-slate-50/50">
          <h2 className="text-xl font-black text-on-surface italic font-headline tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface/40 hover:text-on-surface hover:bg-black/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
