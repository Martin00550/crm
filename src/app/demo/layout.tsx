"use client";

import Link from "next/link";
import { MockDataProvider } from "@/context/MockDataContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Gift } from "lucide-react";
import { ChatBubbleButton } from "@/components/dashboard/DashboardButtons";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const demoUser = { email: "demo@retainvault.tech" };
  const demoAgency = { name: "Demo Agency", branding: { logoUrl: "" } };

  return (
    <MockDataProvider>
      <DashboardShell 
        user={demoUser} 
        agency={demoAgency} 
        agencyId="demo-agency" 
        tier="growth"
        isDemo={true}
        currency="USD"
      >
        {children}
        
        {/* Floating Sign Up FAB */}
        <Link href="/pricing">
          <button className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full shadow-2xl hover:shadow-primary/40 hover:scale-105 hover:-translate-y-1 transition-all group whitespace-nowrap">
            <Gift className="w-4 h-4 text-secondary group-hover:rotate-12 transition-transform" />
            Try for free
          </button>
        </Link>
      </DashboardShell>
    </MockDataProvider>
  );
}
