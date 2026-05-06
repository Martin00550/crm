"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <main className="bg-background min-h-screen selection:bg-secondary/20 font-body py-24">
      {/* Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <div className="max-w-3xl mx-auto px-6 sm:px-8 relative z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-on-surface/40 hover:text-secondary transition-colors text-sm font-bold mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to home
        </Link>

        <header className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface font-headline italic">Privacy Policy</h1>
              <p className="text-on-surface/60 font-medium">Commitment to Agency Data Sovereignty</p>
            </div>
          </div>
          <p className="text-on-surface/60 font-medium">Last Updated: May 6, 2026</p>
        </header>

        <div className="prose prose-slate max-w-none space-y-12 text-on-surface/80 leading-relaxed font-medium">
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">1. Data Controller</h2>
            <p>
              The data controller for RetainVault is:
            </p>
            <div className="mt-4 p-6 bg-slate-50 border border-black/5 rounded-2xl space-y-1 text-sm font-bold text-on-surface/60">
              <p className="text-on-surface text-base">Martin Vasko</p>
              <p>Address: Ulica Jozefa Adamca 9983/24, 917 01 Trnava, Slovakia</p>
              <p>IČO: 56440553</p>
              <p>Contact: hello@retainvault.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">2. Data We Process</h2>
            <p>
              As a provider of an insurance CRM, we process data in two capacities:
            </p>
            <ul className="list-disc pl-5 space-y-4 mt-4">
              <li>
                <span className="text-on-surface font-bold">Account Data:</span> Information you provide to create your account (name, email, agency branding).
              </li>
              <li>
                <span className="text-on-surface font-bold">Agency Data:</span> Information you upload about your clients and policies. We act as a **Data Processor** for this information, while you remain the **Data Controller**.
              </li>
            </ul>
          </section>

          <section>
            <div className="p-6 bg-secondary/5 border border-secondary/10 rounded-3xl">
              <div className="flex gap-4">
                <Lock className="w-5 h-5 text-secondary flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-black text-on-surface italic mb-1 uppercase tracking-wider">Zero-Access Intent</h3>
                  <p className="text-xs text-on-surface/60 leading-relaxed font-bold">
                    We do not sell, rent, or share your agency's "Book of Business" with third-party carriers, lead aggregators, or competitors. Your data is your property.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">3. AI and Data Processing</h2>
            <p>
              RetainVault uses Artificial Intelligence to analyze policy data and generate insights. We use industry-standard providers (Google Gemini, Alibaba DashScope). Your data is sent to these providers only for the duration of the request and is not used to train global models that could expose your business secrets.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">4. GDPR Rights</h2>
            <p>
              Under the General Data Protection Regulation (GDPR), you have the right to access, rectify, or erase your personal data. You also have the right to data portability. To exercise these rights, please contact us at hello@retainvault.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">5. Data Retention</h2>
            <p>
              We retain your Account Data for as long as your account is active. If you delete your account, all associated Agency Data (policies, client records) is permanently decommissioned from our primary databases within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">6. Security Measures</h2>
            <p>
              We implement enterprise-grade security including TLS encryption for data in transit and AES-256 encryption for data at rest. Our infrastructure is hosted on secure cloud providers in the EU/US regions.
            </p>
          </section>
        </div>

        <footer className="mt-24 pt-12 border-t border-black/5 flex justify-between items-center">
          <p className="text-xs text-on-surface/40 font-bold uppercase tracking-widest italic">RetainVault Privacy Infrastructure</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Return Home</Link>
          </Button>
        </footer>
      </div>
    </main>
  );
}
