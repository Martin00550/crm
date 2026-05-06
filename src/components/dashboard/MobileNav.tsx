"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function MobileNav({ isDemo, isOpen, setIsOpen, agencyLogo, agencyName }: { isDemo?: boolean; isOpen: boolean; setIsOpen: (open: boolean) => void; agencyLogo?: string; agencyName?: string }) {
  return (
    <div className="md:hidden">
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed inset-y-0 left-0 w-72 bg-slate-50 z-[101] transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between border-b border-black/5">
            <span className="text-xl font-black italic text-primary">RetainVault</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
            >
              <X className="w-5 h-5 text-on-surface/40" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto" onClick={() => setIsOpen(false)}>
            <Sidebar isDemo={isDemo} agencyLogo={agencyLogo} agencyName={agencyName} />
          </div>
        </div>
      </div>
    </div>
  );
}
