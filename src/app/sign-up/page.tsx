"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("solo");

  // Get tier from URL params
  useEffect(() => {
    const tier = searchParams.get("tier");
    if (tier && ["solo", "growth", "enterprise"].includes(tier)) {
      setSelectedTier(tier);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: `/checkout?tier=${selectedTier}`,
      });

      if (result.error) {
        setError(result.error.message || "Failed to create account");
      } else {
        router.push(`/checkout?tier=${selectedTier}`);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.05),transparent)]"></div>
      
      <Link href="/" className="mb-12 relative z-10">
        <span className="text-3xl font-black tracking-tight text-primary font-headline italic">BookGuard</span>
      </Link>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-surface p-2 rounded-[40px] shadow-2xl border border-black/5">
          <div className="bg-slate-50 rounded-[32px] p-8">
            <h1 className="font-headline italic text-2xl text-primary font-black text-center mb-2">
              Create Account
            </h1>
            <p className="text-on-surface/40 font-bold uppercase tracking-widest text-[10px] text-center mb-8">
              Start your 14-day free trial
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40 mb-2 block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-black/10 focus:ring-secondary/20 focus:border-secondary transition-all px-4 py-3 text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40 mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-black/10 focus:ring-secondary/20 focus:border-secondary transition-all px-4 py-3 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40 mb-2 block">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-black/10 focus:ring-secondary/20 focus:border-secondary transition-all px-4 py-3 text-sm"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white hover:bg-gray-900 rounded-full py-3 font-black text-sm uppercase tracking-widest transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-secondary font-black hover:text-secondary/80 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-on-surface/20 relative z-10 font-body">
        Begin Your 14-Day Executive Trial
      </p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
