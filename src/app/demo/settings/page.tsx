"use client";

import { useState } from "react";
import Link from "next/link";

export default function DemoSettingsPage() {
  const [demoAgency] = useState({
    name: "Demo Agency Group",
    subdomain: "demo-agency",
    contactEmail: "demo@retainvault.tech",
    tier: "Growth",
  });

  const settingsItems = [
    {
      name: "Agency Profile",
      description: "Update your agency name, contact info, and subdomain",
      href: "/demo/settings/profile",
      icon: "business",
      available: true,
    },
    {
      name: "Currency & Region",
      description: "Set your primary currency for all premiums and totals",
      href: "/demo/settings/currency",
      icon: "payments",
      available: true,
    },
    {
      name: "White-Label Portal",
      description: "Customize your branded client portal with logo and colors",
      href: "/demo/settings/branding",
      icon: "palette",
      available: true,
    },
    {
      name: "Team Members",
      description: "Manage producer and CSR accounts",
      href: "/demo/settings/team",
      icon: "group",
      available: true,
      badge: "Growth Protocol",
    },
    {
      name: "Billing & Subscription",
      description: "Manage your subscription and payment methods",
      href: "/demo/settings/billing",
      icon: "credit_card",
      available: true,
    },
  ];

  return (
    <div className="space-y-10 font-body text-on-surface">
      <div>
        <h1 className="text-3xl font-black text-on-surface font-headline italic tracking-tight">Agency Command Settings</h1>
        <p className="text-on-surface/60 mt-2 font-medium italic">Configure your agency deployment protocols and intelligence parameters</p>
      </div>

      <div className="bg-surface p-8 rounded-[32px] border border-black/5 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary">info</span>
          </div>
          <div>
            <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Demo Environment</h3>
            <p className="text-sm font-bold text-on-surface italic">{demoAgency.name} — {demoAgency.tier} Tier</p>
          </div>
        </div>
        <p className="text-xs text-on-surface/50 font-medium italic">All settings modifications in demo mode are ephemeral and reset on session end.</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        {settingsItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="group block p-8 bg-surface rounded-[32px] border border-black/5 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-secondary/5 transition-colors"></div>
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-secondary transition-colors">
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-black text-on-surface italic font-headline tracking-tight">{item.name}</h3>
                  {item.badge && (
                    <span className="px-3 py-1 text-[10px] font-black bg-secondary/10 text-secondary rounded-full border border-secondary/10 uppercase tracking-widest">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-on-surface/60 font-medium italic leading-relaxed">{item.description}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface/20 group-hover:text-primary transition-all group-hover:translate-x-1">
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
