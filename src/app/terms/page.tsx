"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-6 font-headline italic">Terms of Service</h1>
          <p className="text-on-surface/60 font-medium">Last Updated: May 6, 2026</p>
        </header>

        <div className="prose prose-slate max-w-none space-y-12 text-on-surface/80 leading-relaxed font-medium">
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">1. Legal Identity</h2>
            <p>
              RetainVault is a software service provided by:
            </p>
            <div className="mt-4 p-6 bg-slate-50 border border-black/5 rounded-2xl space-y-1 text-sm font-bold text-on-surface/60">
              <p className="text-on-surface text-base">Martin Vasko</p>
              <p>Address: Ulica Jozefa Adamca 9983/24, 917 01 Trnava, Slovakia</p>
              <p>IČO: 56440553</p>
              <p>DIČ: 1129970413</p>
              <p>Registered in: Okresný úrad Malacky, Reg. No: 120-29649</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">2. Acceptance of Terms</h2>
            <p>
              By accessing or using RetainVault, you agree to be bound by these Terms of Service. If you are using the service on behalf of an insurance agency or other legal entity, you represent that you have the authority to bind that entity to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">3. Description of Service</h2>
            <p>
              RetainVault provides an Agency Command Center for insurance professionals, including policy tracking, renewal management, AI-driven rate analysis, and client communication tools. We reserve the right to modify or discontinue features at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">4. Subscription and Payments</h2>
            <p>
              We offer several subscription tiers (Solo, Growth, Enterprise). Subscriptions are billed in advance on a monthly or annual basis. You may cancel your subscription at any time; however, no refunds will be provided for partial months of service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">5. User Data and Intellectual Property</h2>
            <p>
              You retain all rights to the data you upload to RetainVault (e.g., client lists, policy information). You grant us a limited license to process this data solely for the purpose of providing the service. We own the software, AI models, and interface design.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">6. Limitation of Liability</h2>
            <p>
              RetainVault is provided "as is." We do not guarantee that the service will be error-free or uninterrupted. In no event shall Martin Vasko be liable for any indirect, incidental, or consequential damages (including loss of business or revenue) arising from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">7. Governing Law</h2>
            <p>
              These terms are governed by the laws of the Slovak Republic. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Slovakia.
            </p>
          </section>
        </div>

        <footer className="mt-24 pt-12 border-t border-black/5 flex justify-between items-center">
          <p className="text-xs text-on-surface/40 font-bold uppercase tracking-widest italic">RetainVault Legal Protocol</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Return Home</Link>
          </Button>
        </footer>
      </div>
    </main>
  );
}
