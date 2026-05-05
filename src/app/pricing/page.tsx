"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Verified } from "lucide-react";
import { useWorkOSClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { name: "Policies in Book of Business", solo: "Up to 500", growth: "Up to 2,500", enterprise: "Unlimited" },
  { name: "Command Center & Priority Ledger", solo: true, growth: true, enterprise: true },
  { name: "90-60-30 Day Automated Renewal Engine", solo: true, growth: true, enterprise: true },
  { name: "CSV Import/Export", solo: true, growth: true, enterprise: true },
  { name: "AI Rate Analysis Reports", solo: "10 per month", growth: "Unlimited", enterprise: "Unlimited" },
  { name: "Basic File Uploads (PDFs)", solo: false, growth: true, enterprise: true },
  { name: "Producer/CSR Logins", solo: false, growth: "Up to 3 Users", enterprise: "Unlimited" },
  { name: "White-Labeled Client Portal", solo: false, growth: false, enterprise: true },
];

export default function PricingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, isLoading, user } = useWorkOSClient();

  const handleStartTrial = (tier: string) => {
    document.cookie = `selected_tier=${tier}; path=/; max-age=3600`;
    window.location.href = '/api/auth/signup';
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="bg-background min-h-screen selection:bg-secondary/20 font-body">
      {/* Premium Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-black/5 py-2" : "bg-transparent py-4"
      )}>
        <div className="flex justify-between items-center px-8 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-2xl font-black tracking-tight text-primary font-headline italic">RetainVault</Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8 font-body">
            <Link href="/pricing" className="text-on-surface hover:text-on-surface transition-colors text-sm font-bold border-b-2 border-secondary pb-1">Pricing</Link>
            {isAuthenticated ? (
              <Button asChild variant="secondary" size="sm">
                <Link href="/dashboard">
                  Access Command Center
                </Link>
              </Button>
            ) : (
              <>
                <Link 
                  href="/api/auth/login"
                  className="text-on-surface/70 hover:text-on-surface transition-colors text-sm font-medium"
                >
                  Login
                </Link>
                <Button asChild variant="default" size="sm">
                  <Link href="/demo">
                    Try Demo
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-on-surface transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
            <span className={`block w-6 h-0.5 bg-on-surface transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`}></span>
            <span className={`block w-6 h-0.5 bg-on-surface transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-md border-b border-black/5 shadow-lg">
            <div className="flex flex-col gap-4 p-6 font-body">
              <Link href="/pricing" className="text-on-surface hover:text-on-surface transition-colors text-sm font-bold py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              {isAuthenticated ? (
                <Link href="/dashboard" className="px-6 py-3 bg-secondary text-white font-bold rounded-full text-sm hover:opacity-90 transition-all text-center" onClick={() => setMobileMenuOpen(false)}>
                  Access Command Center
                </Link>
              ) : (
                <>
                  <Link 
                    href="/api/auth/login"
                    className="text-on-surface/70 hover:text-on-surface transition-colors text-sm font-medium py-2 text-left"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link href="/demo" className="px-6 py-3 bg-black text-white font-bold rounded-full text-sm hover:opacity-90 transition-all text-center" onClick={() => setMobileMenuOpen(false)}>
                    Try Demo
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="pt-44 pb-32">
        {/* Hero */}
        <header className="max-w-7xl mx-auto px-8 mb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface/70">
              14-Day Free Trial • No Credit Card Required
            </span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-on-surface mb-8 font-headline">
            Stop Losing Policies. <br/> <span className="text-secondary italic">Start Growing Your Book.</span>
          </h1>
          <p className="text-xl text-on-surface/60 max-w-2xl mx-auto leading-relaxed font-medium font-body">
            Built for independent agents who want to <span className="text-secondary font-bold">stop policy leakage</span> and look professional to their clients.
          </p>
        </header>

        {/* Pricing Grid */}
        <section className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-10 items-stretch">
          {/* Solo Agent */}
          <div className="bg-white p-12 rounded-[40px] border border-black/5 shadow-sm hover:shadow-xl transition-all flex flex-col h-full group">
            <div className="mb-10">
              <h3 className="text-on-surface font-bold text-2xl mb-3 font-headline italic">Solo Agent</h3>
              <p className="text-on-surface/50 text-sm font-medium mb-8">The independent producer who works alone and just wants to stop losing policies.</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-on-surface tracking-tighter">$99</span>
                <span className="text-on-surface/40 font-bold text-sm uppercase tracking-widest">/month</span>
              </div>
              <p className="text-secondary font-bold text-sm mt-2">Stop policy leakage before it costs you $20k+</p>
            </div>
            <div className="space-y-5 mb-12 flex-grow">
              {[
                "Up to 500 Policies in your Book of Business",
                "The Command Center & Priority Ledger",
                "90-60-30 Day Automated Renewal Engine",
                "CSV Import/Export",
                "10 AI Rate Analysis Reports / month"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-sm font-bold text-on-surface/70 font-body">
                  <span className="material-symbols-outlined text-secondary text-xl">check_circle</span>
                  {item}
                </div>
              ))}
            </div>
            <Button 
              onClick={() => handleStartTrial('solo')}
              variant="outline"
              size="lg"
              className="w-full border-primary text-on-surface hover:bg-primary hover:text-white"
            >
              Start 14-Day Free Trial
            </Button>
            <p className="text-center text-on-surface/40 text-xs font-medium mt-3">Cancel anytime</p>
          </div>

          {/* Independent Agency */}
          <div className="relative bg-white p-12 rounded-[40px] border-2 border-secondary shadow-2xl flex flex-col h-full transform scale-105 z-10 group">
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-secondary text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-lg z-20">
              Recommended
            </div>
            <div className="mb-10 pt-4">
              <h3 className="text-on-surface font-bold text-3xl mb-3 font-headline italic">Growth Agency</h3>
              <p className="text-on-surface/50 text-sm font-medium mb-8">Small agencies with 2-5 agents who want to look highly professional to their clients.</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-on-surface tracking-tighter">$249</span>
                <span className="text-on-surface/40 font-bold text-sm uppercase tracking-widest">/month</span>
              </div>
              <p className="text-secondary font-bold text-sm mt-2">Turn rate-hike panic calls into data-driven consultations.</p>
            </div>
            <div className="space-y-5 mb-12 flex-grow relative z-10 font-body">
              {[
                "Up to 2,500 Policies in your Book of Business",
                "Everything in Solo",
                "Policy Leakage Risk Dashboard",
                "Basic File Uploads (Attach PDFs to policies)",
                "Up to 3 Producer/CSR Logins"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-sm font-bold text-on-surface/70">
                  <span className="material-symbols-outlined text-secondary text-xl">verified</span>
                  {item}
                </div>
              ))}
            </div>
            <Button 
              onClick={() => handleStartTrial('growth')}
              variant="default"
              size="lg"
              className="w-full relative z-10"
            >
              Start 14-Day Free Trial
            </Button>
            <p className="text-center text-on-surface/40 text-xs font-medium mt-3 relative z-10">Cancel anytime</p>
          </div>

          {/* Enterprise */}
          <div className="bg-white p-12 rounded-[40px] border border-black/5 shadow-sm hover:shadow-xl transition-all flex flex-col h-full group">
            <div className="mb-10">
              <h3 className="text-on-surface font-bold text-2xl mb-3 font-headline italic">Enterprise</h3>
              <p className="text-on-surface/50 text-sm font-medium mb-8">Established agencies ready to fully replace their old AMS (Agency Management System).</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-on-surface tracking-tighter">$499</span>
                <span className="text-on-surface/40 font-bold text-sm uppercase tracking-widest">/month</span>
              </div>
              <p className="text-secondary font-bold text-sm mt-2">Look like a top-10 brokerage to your highest-value clients.</p>
            </div>
            <div className="space-y-5 mb-12 flex-grow font-body">
              {[
                "Unlimited Book of Business",
                "Everything in Growth",
                "White-Labeled Client Portal",
                "Unlimited team members (All roles free)",
                "Unlimited AI Rate Analysis Reports"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-sm font-bold text-on-surface/70">
                  <span className="material-symbols-outlined text-secondary text-xl">check_circle</span>
                  {item}
                </div>
              ))}
            </div>
            <Button 
              onClick={() => handleStartTrial('enterprise')}
              variant="outline"
              size="lg"
              className="w-full border-primary text-primary hover:bg-primary hover:text-white"
            >
              Start 14-Day Free Trial
            </Button>
            <p className="text-center text-on-surface/40 text-xs font-medium mt-3">Cancel anytime</p>
          </div>
        </section>

        {/* Detailed Comparison */}
        <section className="max-w-6xl mx-auto px-8 mt-44">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight text-on-surface font-headline italic mb-4">Compare All Features</h2>
            <p className="text-on-surface/50 font-medium font-body">See exactly what you get in each plan to stop losing policies and grow your book.</p>
          </div>
          <div className="overflow-hidden rounded-[40px] bg-white shadow-sm border border-black/5">
            <table className="w-full text-left border-collapse font-body">
              <thead>
                <tr className="bg-slate-50 border-b border-black/5">
                  <th className="p-8 text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Capability</th>
                  <th className="p-8 text-[11px] font-black text-on-surface text-center uppercase tracking-[0.2em]">Solo</th>
                  <th className="p-8 text-[11px] font-black text-secondary text-center uppercase tracking-[0.2em] bg-secondary/5">Growth</th>
                  <th className="p-8 text-[11px] font-black text-on-surface text-center uppercase tracking-[0.2em]">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {FEATURES.map((feature, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-8 text-sm font-bold text-on-surface">{feature.name}</td>
                    <td className="p-8 text-center text-on-surface/60 font-medium">
                      {feature.solo === true ? <span className="material-symbols-outlined text-secondary">check</span> : feature.solo === false ? '—' : feature.solo}
                    </td>
                    <td className="p-8 text-center text-on-surface/60 font-medium bg-secondary/5">
                      {feature.growth === true ? <span className="material-symbols-outlined text-secondary">check</span> : feature.growth}
                    </td>
                    <td className="p-8 text-center text-on-surface/60 font-medium">
                      {feature.enterprise === true ? <span className="material-symbols-outlined text-secondary">check</span> : feature.enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Security Trust */}
        <section className="max-w-7xl mx-auto px-8 mt-44">
          <div className="bg-black p-16 rounded-[60px] relative overflow-hidden flex flex-col md:flex-row items-center gap-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.15),transparent)]"></div>
            <div className="relative z-10 flex-1">
              <span className="material-symbols-outlined text-secondary text-5xl mb-8" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
              <h4 className="text-4xl font-bold text-white mb-6 font-headline italic">14-Day Free Trial. No Credit Card Required.</h4>
              <p className="text-white/60 text-lg leading-relaxed font-medium max-w-xl font-body">
                Upload your CSV immediately and see the Red/Yellow/Green health scores. On Day 13, we'll email you to enter your card to keep your data. Start stopping policy leakage today.
              </p>
            </div>
            <div className="relative z-10 bg-white/10 backdrop-blur-md p-10 rounded-[40px] border border-white/10 text-center">
              <div className="text-6xl font-black text-secondary mb-4">$99</div>
              <div className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] mb-8">Cost to save one $15K policy</div>
              <div className="flex -space-x-3 justify-center mb-4">
                {[1,2,3,4].map(i => <div key={i} className="w-12 h-12 rounded-full bg-slate-200 border-4 border-black"></div>)}
              </div>
              <p className="text-sm font-bold text-white/80 font-body">The cost of one lunch with a prospect</p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-background py-16">
        <div className="max-w-7xl mx-auto px-8 border-t border-black/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-primary font-headline italic">RetainVault</span>
            <span className="text-on-surface/30 text-xs ml-4 font-body italic"> 2026 RetainVault Insurance Technologies. Built for the Independent Agent.</span>
          </div>
          <div className="flex gap-12 font-body">
            <Link href="/privacy" className="text-on-surface/40 hover:text-black transition-colors text-sm font-medium">Privacy</Link>
            <Link href="/terms" className="text-on-surface/40 hover:text-black transition-colors text-sm font-medium">Terms</Link>
            <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-on-surface/40 hover:text-black transition-colors text-sm font-medium">Twitter</Link>
            <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-on-surface/40 hover:text-black transition-colors text-sm font-medium">LinkedIn</Link>
          </div>
          <Button asChild variant="default" size="sm">
            <Link href="/demo">
              Get demo
            </Link>
          </Button>
        </div>
      </footer>
    </main>
  );
}
