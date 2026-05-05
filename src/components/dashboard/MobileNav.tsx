"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function MobileNav({ agencyLogo, agencyName }: { agencyLogo?: string; agencyName?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Mobile Header Trigger */}
      <div className="fixed bottom-6 right-6 z-[60]">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-secondary text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed inset-y-0 left-0 w-64 bg-slate-50 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onClick={() => setIsOpen(false)} // Close when clicking a link inside
      >
        <Sidebar agencyLogo={agencyLogo} agencyName={agencyName} />
      </div>
    </div>
  );
}
