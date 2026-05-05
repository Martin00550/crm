"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "md" }: ModalProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          "p-0 gap-0 border-none bg-surface rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.3)] overflow-hidden",
          maxWidthClasses[maxWidth]
        )}
      >
        <DialogHeader className="px-8 py-6 border-b border-black/5 bg-slate-50/50">
          <DialogTitle className="text-xl font-black text-on-surface italic font-headline tracking-tight">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-8 py-6 max-h-[80vh]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
