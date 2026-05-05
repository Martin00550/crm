"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";

interface TopBarProps {
  isDemo?: boolean;
  userName?: string;
  userEmail?: string;
  agencyId?: string;
  tier?: string;
}

export function TopBar({ userName, agencyId }: TopBarProps) {
  return (
    <header className="h-16 bg-background/80 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-10 font-body sticky top-0 z-40">
      <div className="flex-1" />

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        <NotificationDropdown agencyId={agencyId} />

        <div className="flex items-center gap-4 pl-6 border-l border-black/5">
          <Link href="/dashboard/settings/profile" className="flex items-center gap-3 group">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-bold text-on-surface uppercase tracking-wider">{userName || "Agency Admin"}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-black/5 text-on-surface/20 group-hover:text-primary transition-colors shadow-sm">
              <User className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
