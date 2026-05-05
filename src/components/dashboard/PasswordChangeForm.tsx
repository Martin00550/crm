"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

export function PasswordChangeForm() {
  const [error] = useState("Password changes are managed through the authentication provider. Please visit your account settings to change your password.");

  return (
    <div className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-secondary/10 transition-colors"></div>
      
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/10">
          <Lock className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Account Security</h3>
          <p className="text-sm font-bold text-on-surface italic font-headline">Change Password</p>
        </div>
      </div>

      <div className="p-6 bg-background rounded-2xl border border-black/5 relative z-10">
        <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-2">Authentication Management</p>
        <p className="text-xs text-on-surface/60 mb-6 font-medium italic leading-relaxed">
          {error}
        </p>
        <a 
          href="https://dashboard.workos.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center px-8 py-3 bg-secondary text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:shadow-lg transition-all"
        >
          Access Auth Gateway
        </a>
      </div>
    </div>
  );
}
