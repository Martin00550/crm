"use client";

import Link from "next/link";
import { MockDataProvider } from "@/context/MockDataContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Gift } from "lucide-react";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <MockDataProvider>
      <div className="flex min-h-screen bg-slate-50 font-body text-on-surface">
        <div className="w-64 flex-none hidden md:block">
          <Sidebar isDemo={true} />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <TopBar 
            isDemo={true} 
            userName="Demo Principal" 
            userEmail="demo@retainvault.tech" 
            agencyId="demo-agency" 
            tier="growth" 
          />
          
          <main className="flex-1 p-10 overflow-auto scrollbar-hide">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Floating Sign Up FAB */}
        <Link href="/pricing">
          <button className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full shadow-2xl hover:shadow-primary/40 hover:scale-105 hover:-translate-y-1 transition-all group">
            <Gift className="w-4 h-4 text-secondary group-hover:rotate-12 transition-transform" />
            Try for free
          </button>
        </Link>
      </div>
    </MockDataProvider>
  );
}
