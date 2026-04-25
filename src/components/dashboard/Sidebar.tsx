"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { useDarkMode } from "@/contexts/DarkModeContext";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3,
  FolderOpen,
  AlertTriangle,
  Globe,
  Settings,
  HelpCircle,
  LogOut,
  ArrowRight,
  Moon,
  Sun
} from "lucide-react";

interface SidebarProps {
  isDemo?: boolean;
}

const navItems = [
  { href: "/dashboard", demoHref: "/demo", label: "Command Center", icon: LayoutDashboard },
  { href: "/dashboard/clients", demoHref: "/demo/clients", label: "Book of Business", icon: Users },
  { href: "/dashboard/renewals", demoHref: "/demo/renewals", label: "Renewal Pipeline", icon: FileText },
  { href: "/dashboard/analytics", demoHref: "/demo/analytics", label: "Portfolio Analytics", icon: BarChart3 },
];

export function Sidebar({ isDemo = false }: SidebarProps) {
  const pathname = usePathname();
  const basePath = isDemo ? "/demo" : "/dashboard";
  const { darkMode, toggleDarkMode } = useDarkMode();

  const handleSupportClick = () => {
    // Dispatch custom event that ChatBubbleButton listens for
    window.dispatchEvent(new CustomEvent('open-chat', { 
      detail: { prompt: "I need technical support with my agency command center." } 
    }));
  };

  return (
    <aside className="w-64 bg-primary min-h-screen flex flex-col font-body fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link href={isDemo ? "/demo" : "/dashboard"} className="flex items-center gap-3">
          <span className="text-xl font-bold text-white tracking-tighter">BookGuard</span>
          {isDemo && (
            <span className="px-2 py-0.5 bg-secondary/20 text-secondary text-[8px] font-bold uppercase tracking-widest rounded-full border border-secondary/20">Demo</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 mt-4">
        <p className="px-4 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Command Terminal</p>
        {navItems.map((item) => {
          const href = isDemo ? item.demoHref : item.href;
          const isRootPath = href === "/dashboard" || href === "/demo";
          const isActive = isRootPath 
            ? pathname === href 
            : pathname === href || pathname.startsWith(href + "/");
          
          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-white/10 text-white font-semibold" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-secondary" : "text-white/20 group-hover:text-white/40")} />
              {item.label}
            </Link>
          );
        })}

        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group text-white/60 hover:text-white hover:bg-white/5 w-full"
        >
          {darkMode ? <Sun className="w-5 h-5 text-white/20 group-hover:text-white/40" /> : <Moon className="w-5 h-5 text-white/20 group-hover:text-white/40" />}
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <Link 
          href={isDemo ? "/demo/renewals" : "/dashboard/renewals"}
          className="px-4 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block hover:text-secondary transition-colors"
        >
          Protocols
        </Link>
        <Link 
          href={isDemo ? "/demo/settings" : "/dashboard/settings"}
          className="flex items-center gap-3 px-4 py-2 w-full text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all font-semibold text-xs text-left group"
        >
          <Settings className="w-4 h-4 text-white/20 group-hover:text-white/40" />
          Settings
        </Link>
        <button 
          onClick={handleSupportClick}
          className="flex items-center gap-3 px-4 py-2 w-full text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all font-semibold text-xs text-left group"
        >
          <HelpCircle className="w-4 h-4 text-white/20 group-hover:text-white/40" />
          Intelligence Support
        </button>
        {isDemo ? (
          <button 
            onClick={() => window.location.href = "/"}
            className="flex items-center gap-3 px-4 py-3 mt-4 w-full text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all font-bold text-xs uppercase tracking-widest justify-center"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        ) : (
          <button 
            onClick={async () => {
              await signOut();
              window.location.href = "/";
            }}
            className="flex items-center gap-3 px-4 py-3 mt-4 w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all font-bold text-xs uppercase tracking-widest justify-center"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        )}
      </div>
    </aside>
  );
}
