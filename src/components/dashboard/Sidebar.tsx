"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutLink } from "@/components/auth/AuthCompatibility";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3,
  Settings,
  HelpCircle,
  LogOut
} from "lucide-react";

interface SidebarProps {
  isDemo?: boolean;
  agencyLogo?: string;
  agencyName?: string;
}

const navItems = [
  { href: "/dashboard", demoHref: "/demo", label: "Command Center", icon: LayoutDashboard },
  { href: "/dashboard/clients", demoHref: "/demo/clients", label: "Book of Business", icon: Users },
  { href: "/dashboard/renewals", demoHref: "/demo/renewals", label: "Renewal Pipeline", icon: FileText },
  { href: "/dashboard/analytics", demoHref: "/demo/analytics", label: "Portfolio Analytics", icon: BarChart3 },
];

export function Sidebar({ isDemo = false, agencyLogo, agencyName }: SidebarProps) {
  const pathname = usePathname();

  const handleSupportClick = () => {
    window.dispatchEvent(new CustomEvent('open-support'));
  };

  return (
    <aside className="w-64 bg-background min-h-screen flex flex-col font-body fixed left-0 top-0 z-50 border-r border-black/5">
      {/* Logo */}
      <div className="p-8">
        <Link href={isDemo ? "/demo" : "/dashboard"} className="flex items-center gap-2">
          {agencyLogo ? (
            <img src={agencyLogo} alt={agencyName || "Agency Logo"} className="h-10 w-auto object-contain" />
          ) : (
            <span className="text-2xl font-black text-primary tracking-tight font-headline italic">
              {agencyName || "RetainVault"}
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <p className="px-4 text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] mb-6">Navigation</p>
        {navItems.map((item) => {
          const href = isDemo ? item.demoHref : item.href;
          const isHome = isDemo ? item.demoHref === "/demo" : item.href === "/dashboard";
          const isActive = pathname === href || (!isHome && pathname.startsWith(href));
          
          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm group",
                isActive 
                  ? "bg-white text-secondary shadow-sm border border-black/5" 
                  : "text-on-surface hover:bg-white/50"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-secondary" : "text-on-surface/60 group-hover:text-on-surface")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-6 space-y-1">
        <Link 
          href={isDemo ? "/demo/settings" : "/dashboard/settings"}
          className="flex items-center gap-3 px-4 py-3 w-full text-on-surface hover:bg-white/50 rounded-2xl transition-all font-bold text-sm group"
        >
          <Settings className="w-4 h-4 text-on-surface/60 group-hover:text-on-surface" />
          Settings
        </Link>
        <button 
          onClick={handleSupportClick}
          className="flex items-center gap-3 px-4 py-3 w-full text-on-surface hover:bg-white/50 rounded-2xl transition-all font-bold text-sm group"
        >
          <HelpCircle className="w-4 h-4 text-on-surface/60 group-hover:text-on-surface" />
          Support
        </button>
        <div className="pt-4 mt-4 border-t border-black/5">
          {isDemo ? (
            <button 
              onClick={() => window.location.href = "/"}
              className="w-full flex items-center justify-center gap-2 py-4 bg-white text-on-surface/40 hover:text-red-500 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm border border-black/5"
            >
              <LogOut className="w-4 h-4" />
              Exit Demo
            </button>
          ) : (
            <LogoutLink>
              <button className="w-full flex items-center justify-center gap-2 py-4 text-on-surface/40 hover:text-red-500 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </LogoutLink>
          )}
        </div>
      </div>
    </aside>
  );
}
