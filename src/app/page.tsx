"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useWorkOSClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Lock, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  const { isAuthenticated, isLoading, user } = useWorkOSClient();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="bg-background min-h-screen selection:bg-secondary/20 overflow-x-hidden">
      {/* Premium Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-black/5 py-2" : "bg-transparent py-4"
      )}>
        <div className="flex justify-between items-center px-6 sm:px-8 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-primary font-headline italic">RetainVault</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8 font-body">
            <Link href="/pricing" className="text-on-surface/70 hover:text-on-surface transition-colors text-sm font-medium">Pricing</Link>
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
              <Link href="/pricing" className="text-on-surface/70 hover:text-on-surface transition-colors text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
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

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-background">
        {/* Background Blob */}
        <div className="absolute left-[-10%] bottom-0 w-[40%] h-[60%] opacity-40 pointer-events-none">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path fill="#22C55E" d="M44.7,-76.4C58.3,-69.2,70.1,-57.4,77.6,-43.3C85.1,-29.2,88.3,-12.7,86.2,3.1C84.1,18.9,76.6,33.9,66.4,45.8C56.2,57.7,43.3,66.4,29.2,72.1C15.1,77.8,-0.2,80.5,-15.8,78.2C-31.4,75.9,-47.3,68.7,-59.6,57.1C-71.9,45.5,-80.6,29.5,-83.4,12.7C-86.2,-4.1,-83.1,-21.7,-74.4,-36.1C-65.7,-50.5,-51.4,-61.7,-36.5,-68.1C-21.6,-74.5,-6,-76.1,10.1,-78.6C26.2,-81.1,44.7,-76.4,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10 text-center">
          <div className="max-w-4xl mx-auto pt-16">
            <h1 className="text-[2.5rem] sm:text-6xl lg:text-7xl font-bold tracking-tight text-on-surface leading-[1.1] mb-8 font-headline text-balance">
              Stop <span className="text-secondary italic">Policy Leakage.</span> <br />
              Protect Your Book.
            </h1>
            <p className="text-xl text-on-surface/70 max-w-2xl mx-auto mb-10 leading-relaxed font-medium font-body">
              Legacy systems are built for accounting. RetainVault is built for <span className="text-secondary font-bold underline underline-offset-4">retention.</span> Identify the silent leakage with 90-day renewal alerts and AI-driven rate forensics.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12 sm:mb-20 font-body">
              <Button asChild variant="default" size="lg" className="group shadow-2xl w-full sm:w-auto">
                <Link href="/demo">
                  Try Demo Dashboard
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/pricing">
                  Start 14-Day Trial
                </Link>
              </Button>
            </div>

            {/* Dashboard Mockup */}
            <div className="relative mx-auto max-w-5xl group">
              {/* Green Glow/Border */}
              <div className="absolute -inset-4 bg-secondary rounded-[40px] opacity-100 blur-sm"></div>
              <div className="absolute -inset-1 bg-secondary rounded-[36px]"></div>
              
              <div className="relative bg-surface rounded-[32px] overflow-hidden shadow-2xl border border-border font-body">
                <div className="flex h-[500px]">
                  {/* Mockup Sidebar */}
                  <div className="w-16 bg-slate-50 border-r border-border flex flex-col items-center py-6 gap-6">
                    <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
                    <div className="w-8 h-8 rounded-lg bg-secondary"></div>
                    <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 mt-auto"></div>
                  </div>
                  
                  {/* Mockup Content */}
                  <div className="flex-1 p-8 text-left">
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-2 font-bold text-lg text-on-surface">
                        My Customers <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold">Subscribed</div>
                        <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">Personalize</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-8">
                      <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-100">
                        <div className="text-2xl font-bold mb-1 text-on-surface">84%</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Renewal Health</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                        <div className="text-2xl font-bold mb-1 text-on-surface">12</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">At-Risk Policies</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                        <div className="text-2xl font-bold mb-1 text-on-surface">$42k</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Leakage Risk</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20">
                        <div className="text-2xl font-bold mb-1 text-secondary">32</div>
                        <div className="text-[10px] text-secondary font-bold uppercase tracking-wider">Active Renewals</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="h-4 w-1/4 bg-slate-100 rounded-full mb-6"></div>
                      {[1,2,3,4].map(i => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-100"></div>
                            <div className="h-3 w-24 bg-slate-100 rounded-full"></div>
                          </div>
                          <div className="flex gap-12">
                            <div className="h-3 w-16 bg-slate-50 rounded-full"></div>
                            <div className="h-3 w-12 bg-slate-50 rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-12 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-20 md:space-y-32">
          {/* Section 1: AI Rate Forensics */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center bg-white/50 rounded-[32px] md:rounded-[40px] p-6 md:p-12 border border-black/5">
            <div>
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-secondary">auto_awesome</span>
              </div>
              <h2 className="text-5xl font-bold mb-6 font-headline leading-tight">
                Stop being the <br />
                <span className="text-secondary italic">"Bad Guy"</span>
              </h2>
              <p className="text-lg text-on-surface/70 mb-8 font-body leading-relaxed">
                When rates spike 20%, our AI Rate Analysis analyzes carrier shifts and generates professional 1-pagers to help you explain premium increases to your insureds. Focus on the relationship, let us handle the data.
              </p>
              <Link href="/demo" className="text-black font-bold border-b-2 border-black pb-1 hover:border-secondary transition-colors font-body">
                Generate your first Analysis Report
              </Link>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 relative overflow-hidden">
               {/* Integration Grid Mockup */}
               <div className="grid grid-cols-4 gap-6 opacity-80">
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                    <div key={i} className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Section 2: 90-Day Renewal Window */}
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 bg-white rounded-3xl p-8 shadow-xl border border-slate-100 relative">
               <div className="space-y-4">
                  <div className="h-8 w-1/3 bg-slate-100 rounded-lg"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-secondary/10 rounded-2xl border border-secondary/20"></div>
                    <div className="h-24 bg-slate-50 rounded-2xl"></div>
                  </div>
                  <div className="h-48 bg-slate-50 rounded-2xl"></div>
               </div>
            </div>
            <div className="order-1 lg:order-2 px-12">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-secondary">history_toggle_off</span>
              </div>
              <h2 className="text-5xl font-bold mb-6 font-headline leading-tight">
                No more <br />
                <span className="text-secondary italic">"Silent Leakage"</span>
              </h2>
              <p className="text-lg text-on-surface/70 mb-8 font-body leading-relaxed">
                Legacy systems alert you when a policy has already lapsed. RetainVault identifies renewals 90 days out, giving you the time you need to round out the account or re-shop the coverage.
              </p>
            </div>
          </div>

          {/* Section 3: Executive Command Center */}
          <div className="grid lg:grid-cols-2 gap-20 items-center bg-white/50 rounded-[40px] p-6 md:p-12 border border-black/5">
            <div>
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-secondary">dashboard_customize</span>
              </div>
              <h2 className="text-5xl font-bold mb-6 font-headline">
                Your Executive <br />
                <span className="text-secondary italic">Command Center</span>
              </h2>
              <p className="text-lg text-on-surface/70 mb-8 font-body leading-relaxed">
                Stop hunting through spreadsheets. View your entire Book of Business in a high-fidelity dashboard designed for retention and growth.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
               <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                   <span className="material-symbols-outlined text-white">insights</span>
                 </div>
                 <div>
                   <div className="h-4 w-32 bg-slate-200 rounded-full mb-2"></div>
                   <div className="h-3 w-24 bg-slate-100 rounded-full"></div>
                 </div>
               </div>
               <div className="text-4xl font-bold mb-4 font-headline text-secondary">$151,330.60</div>
               <div className="h-24 w-full bg-slate-50 rounded-2xl mb-4"></div>
            </div>
          </div>

          {/* Section 4: Carrier Portfolio Sync */}
          <div className="grid lg:grid-cols-2 gap-20 items-center">
             <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                <div className="h-32 bg-slate-50 rounded-2xl mb-6"></div>
                <div className="h-40 bg-secondary/5 rounded-2xl border border-secondary/10 flex items-center justify-center">
                   <div className="w-32 h-32 rounded-full border-8 border-secondary flex items-center justify-center font-bold text-2xl text-secondary">98%</div>
                </div>
             </div>
             <div className="px-12">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-secondary">sync</span>
              </div>
              <h2 className="text-5xl font-bold mb-6 font-headline">
                Intelligent <br />
                <span className="text-secondary italic">Portfolio Import</span>
              </h2>
              <p className="text-lg text-on-surface/70 mb-8 font-body leading-relaxed">
                Import your carrier data via CSV to see total premium volume and retention rates visualized in a high-fidelity command center.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder's Note / Transparency Section */}
      <section className="py-24 bg-surface relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-8 relative z-10">
          <div className="bg-white/50 backdrop-blur-sm p-8 md:p-16 rounded-[40px] border border-black/5 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-3xl">verified_user</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-headline">The RetainVault Commitment</h3>
                <p className="text-on-surface/50 font-body italic text-sm">A note to the Independent Agent</p>
              </div>
            </div>
            
            <div className="space-y-6 font-body text-lg leading-relaxed text-on-surface/80">
              <p>
                We'll be honest: We don't have 5,000 corporate logos to show you. We don't have venture capital funding pushing us to sell your data to carriers.
              </p>
              <p>
                We built RetainVault because we saw independent agency owners getting squeezed. You're running $5M+ books of business on messy Excel sheets because legacy AMS tools feel like they were built in 1995.
              </p>
              <p className="font-bold text-on-surface">
                Our promise is simple: We will never sell your data, we will never charge you for "seats," and if you ever want to leave, we'll export your data and hand it back to you within 24 hours. 
              </p>
              <p>
                We aren't trying to be the biggest software company. We're trying to be the most useful tool in your agency.
              </p>
              
              <div className="pt-8 border-t border-black/5 mt-8 flex items-center justify-between">
                <div>
                  <p className="font-bold text-on-surface">Built with Integrity</p>
                  <p className="text-sm text-on-surface/50">For the Independent Authority</p>
                </div>
                <div className="flex gap-2">
                   <div className="px-4 py-2 rounded-full bg-secondary/10 text-secondary text-xs font-black uppercase tracking-widest">100% Private</div>
                   <div className="px-4 py-2 rounded-full bg-secondary/10 text-secondary text-xs font-black uppercase tracking-widest">Owner Operated</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-24 bg-background border-t border-black/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 font-headline text-balance">How It Works</h2>
            <p className="text-lg text-on-surface/60 font-body">Get started in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Connect Your Data",
                description: "Import your existing policies and clients from your current AMS or spreadsheets. We handle the migration for you."
              },
              {
                step: "02",
                title: "Set Up Automation",
                description: "Configure your 90-day renewal alerts, AI rate analysis, and team permissions. Customize workflows to match your agency."
              },
              {
                step: "03",
                title: "Start Protecting Revenue",
                description: "Monitor your book of business, receive renewal alerts, and use AI insights to retain more policies."
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-8xl font-black text-secondary/10 font-headline absolute -top-4 -left-4">{item.step}</div>
                <div className="relative z-10 bg-white rounded-3xl p-8 border border-black/5 h-full">
                  <h3 className="text-2xl font-bold mb-4 font-headline">{item.title}</h3>
                  <p className="text-on-surface/70 font-body leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-background border-t border-black/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 font-headline text-balance">Investment Plans</h2>
            <p className="text-lg text-on-surface/60 font-body">Predictable growth for independent authorities.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12 items-stretch">
            {/* Solo Agent */}
            <div className="bg-white p-8 md:p-12 rounded-[40px] border border-black/5 shadow-sm hover:shadow-xl transition-all flex flex-col h-full">
              <div className="mb-10">
                <h3 className="text-on-surface font-bold text-2xl mb-3 font-headline italic">Solo Agent</h3>
                <p className="text-on-surface/50 text-sm font-medium mb-8">The independent producer who works alone and just wants to stop losing policies.</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-on-surface tracking-tighter">$99</span>
                  <span className="text-on-surface/40 font-bold text-sm uppercase tracking-widest">/month</span>
                </div>
                <p className="text-secondary font-bold text-sm mt-2">Stop policy leakage before it impacts your revenue</p>
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
                asChild
                variant="outline" 
                size="lg"
                className="w-full"
              >
                <Link href="/api/auth/signup?tier=solo">
                  Start 14-Day Free Trial
                </Link>
              </Button>
            </div>

            {/* Growth Agency */}
            <div className="relative bg-white p-8 md:p-12 rounded-[40px] border-2 border-secondary shadow-2xl flex flex-col h-full sm:transform sm:scale-105 z-10">
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
                <p className="text-secondary font-bold text-sm mt-2">Turn rate-hike questions into data-driven consultations.</p>
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
                asChild
                variant="default" 
                size="lg"
                className="w-full relative z-10"
              >
                <Link href="/api/auth/signup?tier=growth">
                  Start 14-Day Free Trial
                </Link>
              </Button>
            </div>

            {/* Authority Agency */}
            <div className="bg-white p-8 md:p-12 rounded-[40px] border border-black/5 shadow-sm hover:shadow-xl transition-all flex flex-col h-full">
              <div className="mb-10">
                <h3 className="text-on-surface font-bold text-2xl mb-3 font-headline italic">Enterprise</h3>
                <p className="text-on-surface/50 text-sm font-medium mb-8">Established agencies ready to fully modernize their renewal operations.</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-on-surface tracking-tighter">$499</span>
                  <span className="text-on-surface/40 font-bold text-sm uppercase tracking-widest">/month</span>
                </div>
                <p className="text-secondary font-bold text-sm mt-2">Professionalize your entire agency's Book of Business.</p>
              </div>
              <div className="space-y-5 mb-12 flex-grow font-body">
                {[
                  "Unlimited Policies in your Book",
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
                asChild
                variant="outline" 
                size="lg"
                className="w-full"
              >
                <Link href="/api/auth/signup?tier=enterprise">
                  Start 14-Day Free Trial
                </Link>
              </Button>
            </div>
          </div>

          <div className="text-center">
            <Link href="/pricing" className="text-on-surface/60 hover:text-black transition-colors text-sm font-medium">
              View detailed feature comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 font-headline text-balance">Frequently Asked Questions</h2>
            <p className="text-lg text-on-surface/60 font-body">Everything you need to know about RetainVault.</p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "How long does onboarding take?",
                a: "We handle data migration from your existing AMS or spreadsheets, so you don't lose any historical data. Onboarding time varies based on your data volume."
              },
              {
                q: "What carriers do you integrate with?",
                a: "We support CSV imports from any carrier and offer API integrations for many carriers. Contact us to discuss your specific needs."
              },
              {
                q: "Is my data secure?",
                a: "Yes. We use bank-level encryption (AES-256) and never sell your data. You maintain full ownership of all policy and client information."
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. No long-term contracts. Cancel anytime with no penalties. Your data is exported and returned to you within 30 days of cancellation."
              },
              {
                q: "Do I need to install anything?",
                a: "No. RetainVault is 100% cloud-based. Access from any device with a browser. No software downloads, no IT overhead."
              },
              {
                q: "What if I need help?",
                a: "Every plan includes email support. Independent Agency and Authority plans include priority support with dedicated account managers and onboarding assistance."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-black/5 p-6 md:p-8">
                <h3 className="text-xl font-bold mb-3 font-headline">{faq.q}</h3>
                <p className="text-on-surface/70 font-body leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison Section */}
      <section className="py-24 bg-background border-t border-black/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 font-headline text-balance">RetainVault vs Traditional AMS</h2>
            <p className="text-lg text-on-surface/60 font-body">Built for retention, not just accounting.</p>
          </div>

          <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-6 font-headline font-bold text-lg">Feature</th>
                  <th className="text-center p-6 font-headline font-bold text-lg">RetainVault</th>
                  <th className="text-center p-6 font-headline font-bold text-lg">Traditional AMS</th>
                  <th className="text-center p-6 font-headline font-bold text-lg">Spreadsheets</th>
                </tr>
              </thead>
              <tbody>
                {[
                   { feature: "90-day renewal automation", bookGuard: "✓", ams: "✗", spreadsheets: "✗" },
                   { feature: "AI rate analysis", bookGuard: "✓", ams: "✗", spreadsheets: "✗" },
                   { feature: "Intelligent CSV import", bookGuard: "✓", ams: "Manual", spreadsheets: "✓" },
                   { feature: "Health score tracking", bookGuard: "✓", ams: "✗", spreadsheets: "✗" },
                   { feature: "Mobile optimized", bookGuard: "✓", ams: "Limited", spreadsheets: "✗" },
                   { feature: "Client portal", bookGuard: "✓", ams: "Add-on", spreadsheets: "✗" },
                   { feature: "Setup time", bookGuard: "Fast", ams: "Weeks", spreadsheets: "N/A" },
                   { feature: "Monthly cost", bookGuard: "$99+", ams: "$500+", spreadsheets: "Free" }
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="p-6 font-medium font-body">{row.feature}</td>
                    <td className="p-6 text-center text-secondary font-bold text-xl">{row.bookGuard}</td>
                    <td className="p-6 text-center text-on-surface/40 font-body">{row.ams}</td>
                    <td className="p-6 text-center text-on-surface/40 font-body">{row.spreadsheets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 md:py-24 bg-black text-white m-4 sm:m-8 rounded-[32px] md:rounded-[40px] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">Enterprise Ready</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-bold mb-8 font-headline leading-[1.2] lg:leading-tight">
            Never open <br /> <span className="text-secondary italic">another tab</span>
          </h2>
          <p className="text-xl text-white/60 mb-12 font-body max-w-2xl mx-auto leading-relaxed">
            Stop switching between carrier portals and spreadsheets. RetainVault brings your entire Book of Business into one unified command center.
          </p>
          <div className="flex flex-col items-center gap-6 justify-center">
            <Button asChild variant="white" size="lg" className="shadow-xl shadow-white/5">
              <Link href="/demo">
                Try Demo Dashboard
                <BarChart3 className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-white/40 text-sm font-body">
              <Lock className="w-3.5 h-3.5" />
              100% Book Ownership Guarantee — Export Your Data Anytime
            </div>
          </div>
        </div>
        {/* Mockup Preview at the bottom */}
        <div className="mt-20 max-w-4xl mx-auto opacity-40 translate-y-20 scale-110">
           <div className="bg-white rounded-3xl h-96 w-full"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 border-t border-black/5 pt-12">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <span className="text-xl font-black tracking-tight text-primary font-headline italic">RetainVault</span>
              <p className="text-on-surface/50 text-sm mt-4 font-body">Built for the Independent Agent.</p>
              <p className="text-on-surface/40 text-sm mt-2 font-body">hello@retainvault.com</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 font-headline">Product</h4>
              <div className="space-y-3 font-body">
                <Link href="/pricing" className="block text-on-surface/50 hover:text-black text-sm transition-colors">Pricing</Link>
                <Link href="/demo" className="block text-on-surface/50 hover:text-black text-sm transition-colors">Demo</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 font-headline">Company</h4>
              <div className="space-y-3 font-body">
                <a href="mailto:hello@retainvault.com" className="block text-on-surface/50 hover:text-black text-sm transition-colors">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 font-headline">Legal</h4>
              <div className="space-y-3 font-body">
                <Link href="/privacy" className="block text-on-surface/50 hover:text-black text-sm transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="block text-on-surface/50 hover:text-black text-sm transition-colors">Terms of Service</Link>
                <Link href="/refund" className="block text-on-surface/50 hover:text-black text-sm transition-colors">Refund Policy</Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-black/5">
            <span className="text-on-surface/30 text-xs font-body">© {new Date().getFullYear()} RetainVault Insurance Technologies. All rights reserved.</span>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-on-surface/40 hover:text-black transition-colors text-sm font-medium">Twitter</Link>
              <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-on-surface/40 hover:text-black transition-colors text-sm font-medium">LinkedIn</Link>
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-on-surface/40 hover:text-black transition-colors text-sm font-medium">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
