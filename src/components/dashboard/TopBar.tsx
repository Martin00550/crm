"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, User, Settings, LogOut } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { AIUsageCounter } from "./AIUsageCounter";
import { NotificationDropdown } from "./NotificationDropdown";
import { SearchBar } from "./SearchBar";

interface TopBarProps {
  isDemo?: boolean;
  userName?: string;
  userEmail?: string;
  agencyId?: string;
  tier?: string;
}

export function TopBar({ isDemo = false, userName, userEmail, agencyId, tier }: TopBarProps) {
  return (
    <header className="h-20 bg-white border-b border-black/5 flex items-center justify-between px-8 font-body sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <SearchBar agencyId={agencyId} />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* AI Usage Counter */}
        {agencyId && tier && (
          <div className="hidden lg:block">
            <AIUsageCounter agencyId={agencyId} tier={tier} />
          </div>
        )}

        <div className="flex items-center">
          {/* Notifications */}
          <NotificationDropdown agencyId={agencyId} />
        </div>

        {isDemo ? (
          /* Demo Mode - Sign Up CTA */
          <Link href="/pricing">
            <button className="px-6 py-2 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all active:scale-[0.98]">
              Try for free
            </button>
          </Link>
        ) : (
          /* Live Mode - User Profile */
          <div className="flex items-center gap-4 pl-4 border-l border-black/5">
            <Link href="/dashboard/settings/profile" className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-bold text-on-surface leading-none mb-1">{userName || "Principal Agent"}</p>
                <p className="text-[9px] font-semibold text-on-surface/40 uppercase tracking-widest">{userEmail || "Official Command Account"}</p>
              </div>
              <div className="relative w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center border border-black/5">
                <User className="w-4 h-4 text-slate-400" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-surface shadow-sm" />
              </div>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
