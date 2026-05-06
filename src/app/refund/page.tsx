"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw, Undo2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RefundPage() {
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
              <Undo2 className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface font-headline italic">Refund Policy</h1>
              <p className="text-on-surface/60 font-medium">Clear. Fair. Institutional Standards.</p>
            </div>
          </div>
          <p className="text-on-surface/60 font-medium">Last Updated: May 6, 2026</p>
        </header>

        <div className="prose prose-slate max-w-none space-y-12 text-on-surface/80 leading-relaxed font-medium">
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">1. 14-Day Satisfaction Guarantee</h2>
            <p>
              We want you to be absolutely confident in your Agency Command Center. RetainVault offers a **14-Day Free Trial** on all subscription plans. No charges are made during this period.
            </p>
            <p className="mt-4">
              If you decide to continue after the trial and are subsequently unsatisfied, we offer a **no-questions-asked refund** within the first 7 days of your first paid billing cycle.
            </p>
          </section>

          <section>
            <div className="p-8 bg-slate-50 border border-black/5 rounded-[32px] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <CreditCard className="w-24 h-24 text-on-surface" />
              </div>
              <h3 className="text-sm font-black text-on-surface italic mb-4 uppercase tracking-widest">Billing Logic</h3>
              <ul className="space-y-4 text-xs font-bold text-on-surface/60">
                <li className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-secondary" />
                  Monthly subscriptions are non-refundable after the first 7 days of the billing period.
                </li>
                <li className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-secondary" />
                  Annual subscriptions may be eligible for a partial refund if cancelled within 30 days of the renewal date.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">2. How to Request a Refund</h2>
            <p>
              To initiate a refund request, please email **hello@retainvault.com** from your registered account email. Please include:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4">
              <li>Your Agency Name</li>
              <li>Transaction ID (from your Paddle receipt)</li>
              <li>Reason for refund (optional, but helps us improve)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">3. Chargebacks</h2>
            <p>
              We encourage users to contact us directly to resolve any billing disputes. We are committed to fair resolution. Fraudulent chargebacks will result in immediate account termination and permanent decommissioning of all agency data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-4">4. Exceptions</h2>
            <p>
              Refunds are not available for accounts that have been terminated due to a violation of our Terms of Service (e.g., data scraping, unauthorized access, or illegal data processing).
            </p>
          </section>
        </div>

        <footer className="mt-24 pt-12 border-t border-black/5 flex justify-between items-center">
          <p className="text-xs text-on-surface/40 font-bold uppercase tracking-widest italic">RetainVault Refund Protocol</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Return Home</Link>
          </Button>
        </footer>
      </div>
    </main>
  );
}
