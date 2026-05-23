"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessPageContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <main className="min-h-[100dvh] bg-zinc-950 text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center mb-8">
          <span className="text-4xl">✓</span>
        </div>

        <h1 className="text-4xl font-semibold tracking-tighter">Welcome to the Forge.</h1>
        <p className="mt-3 text-zinc-400">
          Your digital subscription is now active.
        </p>

        <div className="mt-8 space-y-3 text-left glass p-6 rounded-3xl border border-white/10">
          <div className="font-semibold">✅ Access Granted</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li>• Digital Dashboard (live protocol viewer)</li>
            <li>• Monthly downloadable PDF protocols</li>
            <li>• Real-time AI adjustment log</li>
            <li>• Biomarker tracking portal</li>
          </ul>
        </div>

        <a
          href="/dashboard"
          className="mt-8 block w-full py-4 rounded-3xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-semibold"
        >
          Open Digital Dashboard
        </a>

        <a
          href="/"
          className="mt-4 block text-xs text-white/40 hover:text-white/70"
        >
          Return to home
        </a>

        {sessionId && (
          <p className="mt-6 text-[10px] text-white/30 font-mono break-all">
            Stripe Session: {sessionId}
          </p>
        )}
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-zinc-950" />}>
      <SuccessPageContent />
    </Suspense>
  );
}
