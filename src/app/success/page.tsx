"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "active" | "pending">("loading");

  useEffect(() => {
    if (!sessionId) { setStatus("pending"); return; }
    // Poll Stripe session status (production-aware, no hardcoded secrets)
    fetch(`/api/checkout-status?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => setStatus(data.status === "complete" ? "active" : "pending"))
      .catch(() => setStatus("pending"));
  }, [sessionId]);

  if (status === "loading")
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-5 text-sm text-zinc-400">Confirming your activation…</p>
        </div>
      </main>
    );

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-zinc-950 px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
          <span className="text-4xl">⚡</span>
        </div>
        <h1 className="mt-7 text-4xl font-bold tracking-tight text-white">Welcome to the Forge.</h1>
        <p className="mt-3 text-zinc-400">
          Your protocol is confirmed and your first shipment is being prepared. Delivery in 2–3 business days.
        </p>
        <div className="mt-10 space-y-3">
          <a
            href="/"
            className="block w-full py-3.5 rounded-3xl bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-semibold hover:brightness-110 transition-all"
          >
            Back to Home
          </a>
          <a
            href="https://dashboard.stripe.com"
            className="block text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Manage billing on Stripe
          </a>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] flex items-center justify-center bg-zinc-950">
          <p className="text-sm text-zinc-400">Loading…</p>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
