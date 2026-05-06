"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";
import { ChatBubbleButton } from "./DashboardButtons";
import { SupportPanel } from "./SupportPanel";

interface DashboardShellProps {
  children: React.ReactNode;
  user: any;
  agency: any;
  agencyId?: string;
  tier: string;
  isDemo?: boolean;
  currency?: string;
}

export function DashboardShell({ children, user, agency, agencyId, tier, isDemo = false, currency = 'USD' }: DashboardShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  useEffect(() => {
    const handleOpenSupport = () => setIsSupportOpen(true);
    window.addEventListener('open-support', handleOpenSupport);
    return () => window.removeEventListener('open-support', handleOpenSupport);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 font-body text-on-surface">
      {/* Desktop Sidebar */}
      <div className="w-64 flex-none hidden md:block border-r border-black/5">
        <Sidebar 
          isDemo={isDemo}
          agencyLogo={agency?.branding?.logoUrl}
          agencyName={agency?.name}
        />
      </div>

      {/* Mobile Nav */}
      <MobileNav 
        isDemo={isDemo}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
        agencyLogo={agency?.branding?.logoUrl}
        agencyName={agency?.name}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar 
          isDemo={isDemo}
          userName={user.email?.split("@")[0]}
          userEmail={user.email}
          agencyId={agencyId}
          tier={tier}
          currency={currency}
          onMenuClick={() => setIsMobileNavOpen(true)}
        />
        
        <main className="flex-1 p-4 md:p-10 overflow-auto scrollbar-hide">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Global Intelligence Interface */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
        <ChatBubbleButton isDemo={isDemo} />
      </div>

      {/* Support Selection Modal */}
      <SupportPanel 
        isOpen={isSupportOpen} 
        onClose={() => setIsSupportOpen(false)} 
      />
    </div>
  );
}
