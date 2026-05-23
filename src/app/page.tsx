"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";

// ────────────────────────────────────────────────────────────
//  Client helper – calls Stripe Checkout via our API route
// ────────────────────────────────────────────────────────────
async function startCheckout(plan: string, billing: "monthly" | "annual") {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, billing }),
  });
  if (!res.ok) throw new Error("Checkout failed");
  const data = await res.json();
  if (!data.url) throw new Error("No checkout URL returned");
  window.location.href = data.url;   // hard redirect to Stripe Checkout
}

// ────────────────────────────────────────────────────────────
//  Main landing page — everything from the original file,
//  minus the stripe-inline functions (replaced above)
// ────────────────────────────────────────────────────────────
export default function LandingPage() {
  return <PageInner />;
}

function PageInner() {
  // ── refs ──────────────────────────────────────────────────────────
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const toastRef     = useRef<HTMLDivElement>(null);

  // ── state ─────────────────────────────────────────────────────────
  const [billing,    setBilling]    = useState<"monthly" | "annual">("monthly");
  const [isDark,     setIsDark]     = useState(true);
  const [modalOpen,   setModalOpen]  = useState(false);
  const [productIdx,  setProductIdx] = useState(0);
  const [toastMsg,    setToastMsg]   = useState("");
  const [checkoutState, setCheckoutState] = useState<
    "idle" | "loading-plan" | "loading-quiz" | "checking-out"
  >("idle");

  // ── Pricing data (3 tiers, matched to Stripe Price IDs in env) ──────
  const PRICING: Record<string, { monthly: number; annual: number }> = {
    nexus_prime:    { monthly: 89,  annual: 71  },
    apex_vital:     { monthly: 129, annual: 103 },
    circadian_forge:{ monthly: 109, annual: 87  },
  };

  const pricesByIdx = [
    PRICING.nexus_prime,
    PRICING.apex_vital,
    PRICING.circadian_forge,
  ];

  // ── Products (used by detail modal) ────────────────────────────────
  const products = [
    {
      name: "Nexus Prime", price: "$89", tag: "Focus & Clarity",
      desc: "The gold standard for executives who need sustained cognitive performance without jitters or crash.",
      ingredients: ["Lion's Mane 800mg","L-Theanine 400mg","NMN 500mg","Alpha-GPC 300mg","Rhodiola Rosea 200mg"],
      benefits: ["+34% sustained focus", "Eliminates afternoon fog", "Improved creative problem solving"],
    },
    {
      name: "Apex Vital",  price: "$129", tag: "Energy & Recovery",
      desc: "Engineered for athletes and founders who train hard and need rapid recovery between high-output days.",
      ingredients: ["NR 1000mg","Creatine Monohydrate 5g","Ashwagandha KSM-66 600mg","Taurine 2g","CoQ10 200mg"],
      benefits: ["+41% faster recovery","Increased VO2 max","Reduced inflammation markers"],
    },
    {
      name: "Circadian Forge", price: "$109", tag: "Sleep & Longevity",
      desc: "Resets your internal clock and optimizes melatonin, cortisol, and growth hormone naturally.",
      ingredients: ["Magnesium L-Threonate 400mg","Apigenin 50mg","Glycine 3g","L-Tryptophan 500mg","Saffron Extract"],
      benefits: ["+47% deep sleep","Normalized cortisol curve","Improved HRV within 10 days"],
    },
    {
      name: "Quantum Edge", price: "$219", tag: "Complete Optimization",
      desc: "The flagship full-spectrum protocol. Everything you need for cognitive dominance and physical excellence.",
      ingredients: ["All ingredients from Nexus + Apex + Circadian","Personalized micro-dosing","Weekly AI coaching"],
      benefits: ["+52% overall performance","Top 1% biometric scores","Priority access to new compounds"],
    },
  ];

  // ── Testimonials ──────────────────────────────────────────────────
  const testimonials = [
    { name: "David Kim", role: "Founder & CEO, Stride Health", quote: "I went from 4 hours of deep work to 7.5 hours. My team noticed the difference in week two.", avatar: "https://picsum.photos/id/64/48/48", metric: "+87% deep work hours" },
    { name: "Isabella Torres", role: "Professional Ultrarunner", quote: "My HRV went from 42 to 78 in three weeks. I recovered between back-to-back 100-mile weeks faster than ever.", avatar: "https://picsum.photos/id/1005/48/48", metric: "+86% HRV improvement" },
    { name: "Rajesh Patel", role: "Managing Partner, Horizon Ventures", quote: "The most important investment I've made in myself this decade. My decision quality after 5pm is now elite.", avatar: "https://picsum.photos/id/201/48/48", metric: "4.9× better evening decisions" },
  ];
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  // ── Toast ─────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, auto = true) => {
    setToastMsg(msg);
    if (auto)
      setTimeout(() => setToastMsg(""), 2600);
  }, []);

  // ────────────────────────────────────────────────────────────────
  //  Checkout entry points
  // ────────────────────────────────────────────────────────────────
  const selectPlan = useCallback(async (idx: number) => {
    try {
      setCheckoutState("loading-plan");
      const planKeys: (keyof typeof PRICING)[] = ["nexus_prime","apex_vital","circadian_forge"];
      const key = planKeys[idx] ?? "nexus_prime";
      await startCheckout(key, billing);
    } catch(e) {
      showToast((e as Error).message);
      setCheckoutState("idle");
    }
  }, [billing, showToast]);

  const openQuizModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const claimProtocol = useCallback(async () => {
    try {
      setCheckoutState("loading-quiz");
      await startCheckout("nexus_prime", billing); // quiz → top-matched plan
    } catch(e) {
      showToast((e as Error).message);
      setCheckoutState("idle");
    }
  }, [billing, showToast]);

  // ────────────────────────────────────────────────────────────────
  //  Neural canvas  +  scroll reveal  +  keyboard
  //  (same logic as original, adapted for React)
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: { x: number; y: number; vx: number; vy: number; size: number }[] = [];
    const mouse = { x: 0, y: 0 };

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = Array.from({ length: 85 }, () => ({
        x:   Math.random() * canvas.width,
        y:   Math.random() * canvas.height,
        vx:  (Math.random() - 0.5) * 0.6,
        vy:  (Math.random() - 0.5) * 0.6,
        size:Math.random() * 2.5 + 1.2,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", () => { mouse.x = canvas.width / 2; mouse.y = canvas.height / 2; });

    let animId = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(0,240,255,0.15)";
      ctx.lineWidth   = 0.9;
      ctx.shadowBlur  = 18;
      ctx.shadowColor = "#00f0ff";

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 180 && dist > 0) { p.vx += dx/dist*0.08; p.vy += dy/dist*0.08; }

        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        p.vx *= 0.982; p.vy *= 0.982;

        ctx.fillStyle = "rgba(0,240,255,0.65)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();

        for (let j = i+1; j < particles.length; j++) {
          const p2 = particles[j];
          const d   = Math.hypot(p.x-p2.x, p.y-p2.y);
          if (d < 135) {
            ctx.globalAlpha = (1 - d/135) * 0.45;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  useEffect(() => {   // reveal-on-scroll
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll(".scroll-reveal").forEach((el) => io.observe(el as Element));
    return () => io.disconnect();
  }, []);

  useEffect(() => {   // keyboard
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen) setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const toggleTheme = () => setIsDark((d) => !d);

  // ────────────────────────────────────────────────────────────────
  //  Render
  // ────────────────────────────────────────────────────────────────
  return (
    <>
      {toastMsg && (() => {
        const node = document.createElement("div");
        node.className = "fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-zinc-900 border border-emerald-400/30 text-sm rounded-3xl flex items-center gap-x-3 shadow-xl z-[300]";
        node.innerHTML = `<i className="fa-solid fa-check-circle text-emerald-400"></i><span>${toastMsg}</span>`;
        setTimeout(() => { node.style.cssText = "transition:opacity .3s;opacity:0"; setTimeout(() => node.remove(), 300); }, 2600);
        return null;
      })()}

      {/* ══════════════════════════════════════════
          NAV
          ══════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur-2xl">
        <div className="max-w-screen-2xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <div className="flex items-center gap-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-emerald-400 flex items-center justify-center">
                <i className="fa-solid fa-atom text-white text-2xl" />
              </div>
              <div>
                <span className="font-semibold text-3xl tracking-tighter">VitaForge</span>
                <span className="text-[10px] font-mono text-zinc-500 block -mt-1">2026</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-x-8 text-sm">
            <a href="#science"  className="hover:text-cyan-400 transition-colors">Science</a>
            <a href="#formulas" className="hover:text-cyan-400 transition-colors">Formulas</a>
            <a href="#results"  className="hover:text-cyan-400 transition-colors">Results</a>
            <a href="#pricing"  className="hover:text-cyan-400 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-x-3">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-white/5 transition-colors border border-white/10"
              aria-label="Toggle theme"
            >
              <i className={`fa-solid ${isDark ? "fa-moon" : "fa-sun"} text-lg`} />
            </button>

            <div className="hidden md:flex items-center gap-x-2 px-3 py-1.5 rounded-3xl border border-white/10 hover:bg-white/5 cursor-pointer transition-colors">
              <img src="https://picsum.photos/id/64/28/28" className="w-7 h-7 rounded-full ring-1 ring-white/20" alt="avatar" />
              <span className="text-xs font-medium">Alex Rivera</span>
            </div>

            <button
              onClick={openQuizModal}
              className="px-6 py-2.5 text-sm font-semibold rounded-3xl bg-white text-zinc-950 hover:bg-zinc-100 active:scale-[0.985] transition-all flex items-center gap-x-2 premium-btn"
            >
              <span>Get AI Scan</span>
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
          ══════════════════════════════════════════ */}
      <header className="relative min-h-[100dvh] flex items-center pt-16 overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full neural-canvas z-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/40 to-zinc-950 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[length:4px_4px] z-10" />

        <div className="max-w-screen-2xl mx-auto px-8 relative z-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-x-3 px-4 py-1 rounded-full border border-white/10 bg-white/5 mb-6">
              <div className="flex -space-x-1">
                <img src="https://picsum.photos/id/1011/22/22" className="w-5 h-5 rounded-full ring-1 ring-zinc-950" alt="" />
                <img src="https://picsum.photos/id/1005/22/22" className="w-5 h-5 rounded-full ring-1 ring-zinc-950" alt="" />
                <img src="https://picsum.photos/id/201/22/22"  className="w-5 h-5 rounded-full ring-1 ring-zinc-950" alt="" />
              </div>
              <span className="text-xs font-medium tracking-wide">Featured in <span className="text-cyan-400">Forbes • Wired • Biohacker Magazine</span></span>
            </div>

            <h1 className="text-7xl md:text-8xl font-semibold tracking-tighter leading-[0.92]">
              YOUR BRAIN.<br />
              <span className="kinetic-text">RE-ENGINEERED.</span>
            </h1>

            <p className="mt-6 max-w-lg text-2xl text-zinc-300 tracking-tight">
              AI-personalized neurotransmitter optimization, NAD+ precursors, and circadian-aligned nootropics for those who demand 2026 peak performance.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-10">
              <button
                onClick={openQuizModal}
                className="group px-9 py-4 rounded-3xl bg-gradient-to-r from-cyan-400 to-violet-500 text-white font-semibold text-lg flex items-center gap-x-3 hover:brightness-105 active:scale-[0.985] transition-all premium-btn shadow-xl shadow-cyan-500/30"
              >
                <span>Launch My AI Biohack Scan</span>
                <i className="fa-solid fa-magnifying-glass group-active:rotate-12 transition-transform" />
              </button>

              <button
                onClick={() =>
                  document.getElementById("formulas")?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-8 py-4 rounded-3xl border border-white/20 hover:bg-white/5 font-medium flex items-center gap-x-2 transition-all"
              >
                <span>Explore Formulas</span>
              </button>
            </div>

            <div className="mt-8 flex items-center gap-x-6 text-sm">
              <div className="flex items-center gap-x-1.5">
                <div className="flex text-emerald-400"><i className="fa-solid fa-check" /></div>
                <span className="text-xs">47,291 transformations</span>
              </div>
              <div className="h-2 w-px bg-white/20" />
              <span className="text-xs text-zinc-400">4.98/5 • 12,847 verified reviews</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
          <span className="text-[10px] tracking-[2px] text-zinc-500 mb-1.5">SCROLL TO BEGIN</span>
          <i className="fa-solid fa-chevron-down text-xs animate-bounce text-cyan-400" />
        </div>
      </header>

      {/* ══════════════════════════════════════════
          TRUST BAR
          ══════════════════════════════════════════ */}
      <div className="border-b border-white/10 bg-zinc-900/70">
        <div className="max-w-screen-2xl mx-auto px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 opacity-75">
            {["THIRD-PARTY LAB VERIFIED","NSF CERTIFIED FOR SPORT","47,291+ PEAK PERFORMERS"].map((t,i) => (
              <div key={i} className="flex items-center gap-x-2 text-xs">
                <i className="fa-solid fa-shield-halved text-emerald-400" />
                <span className="font-mono text-[10px]">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PROBLEM / AGITATION
          ══════════════════════════════════════════ */}
      <section className="max-w-screen-2xl mx-auto px-8 pt-20 pb-16">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5">
            <div className="sticky top-24">
              <div className="inline px-4 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold tracking-widest">
                THE SILENT PERFORMANCE TAX
              </div>
              <h2 className="mt-4 text-5xl font-semibold tracking-tighter">
                Your biology is leaking performance every single day.
              </h2>
              <p className="mt-5 text-xl text-zinc-400">
                Executive brain fog. 3pm crashes. Poor recovery. You're not broken — your protocols are generic.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Average executive loses 23% cognitive capacity by 4pm",
                  "87% of high-performers have suboptimal NAD+ levels",
                ].map((txt, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="text-red-400 mt-1"><i className="fa-solid fa-times text-xl" /></div>
                    <div>
                      <div className="font-medium">{txt}</div>
                      <div className="text-xs text-zinc-500">VitaForge internal analysis 2025</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="glass rounded-3xl p-8 md:p-10 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-xs uppercase tracking-widest text-zinc-500">YOUR CURRENT STATE</div>
                  <div className="mt-4 text-6xl font-semibold tabular-nums">62</div>
                  <div className="text-sm">Cognitive Performance Score</div>
                  <div className="h-px bg-white/10 my-4" />
                  <div className="text-xs text-zinc-400">Industry average: 71 • Top 1%: 94</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">
                    WHAT THE TOP 1% DO DIFFERENTLY
                  </div>
                  <div className="space-y-3 text-sm">
                    {[
                      ["Personalized neurotransmitter mapping", "+31% FOCUS"],
                      ["Circadian-aligned NAD+ stacking",  "+27% RECOVERY"],
                      ["Real-time AI protocol adaptation","+19% SLEEP QUALITY"],
                    ].map(([label, delta]) => (
                      <div key={label} className="flex justify-between items-center">
                        <span>{label}</span>
                        <span className="font-mono text-emerald-400 text-xs">{delta}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SCIENCE
          ══════════════════════════════════════════ */}
      <section id="science" className="max-w-screen-2xl mx-auto px-8 py-16 border-t border-white/10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-x-2 px-4 py-1 rounded-full border border-white/10 text-xs tracking-[1.5px]">
            THE 2026 AI ENGINE
          </div>
          <h2 className="mt-4 text-5xl font-semibold tracking-tighter">Science that adapts to you.</h2>
          <p className="mt-3 text-zinc-400 max-w-md mx-auto">
            Four proprietary pillars powered by real-time biomarker analysis and machine learning.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              icon: "fa-brain", color: "cyan-400", title: "Neurotransmitter Mapping",
              body: "AI analyzes your dopamine, serotonin, acetylcholine, and GABA levels from wearable + blood data.",
              badge: "87 biomarkers • Live updating",
            },
            {
              icon: "fa-bolt-lightning", color: "violet-400", title: "NAD+ Precursor Stack",
              body: "Clinically dosed NMN + NR + resveratrol delivered in circadian-aligned windows to restore cellular energy.",
              extra: <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-4">
                <div className="h-1.5 w-[94%] bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full" /></div>,
            },
            {
              icon: "fa-clock", color: "emerald-400", title: "Circadian Alignment Engine",
              body: "Your supplement timing is dynamically adjusted based on your chronotype, cortisol curve, and sleep data.",
              badge: "+41% deeper sleep",
            },
            {
              icon: "fa-robot", color: "amber-400", title: "Real-Time Protocol AI",
              body: "Every 7 days your formula is re-optimized using new wearable data. Your protocol evolves as you do.",
              badge: "v4.2.1 • 2026 model",
            },
          ].map((p, i) => (
            <div
              key={p.title}
              className="glass rounded-3xl p-7 scroll-reveal border border-white/10 group"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className={`w-12 h-12 rounded-2xl bg-${p.color}/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <i className={`fa-solid ${p.icon} text-3xl text-${p.color}`} />
              </div>
              <h3 className="font-semibold text-xl">{p.title}</h3>
              <p className="mt-3 text-sm text-zinc-400">{p.body}</p>
              {p.extra}
              {p.badge && (
                <div className="mt-6 flex items-center text-xs">
                  <div className="px-2.5 py-px bg-white/5 rounded">{p.badge}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FORMULAS
          ══════════════════════════════════════════ */}
      <section id="formulas" className="max-w-screen-2xl mx-auto px-8 py-16 border-t border-white/10 bg-zinc-900/60">
        <div className="flex items-end justify-between mb-9">
          <div>
            <div className="text-xs tracking-[2px] text-cyan-400">FLAGSHIP PROTOCOLS</div>
            <h2 className="text-5xl font-semibold tracking-tighter">Choose your edge.</h2>
          </div>
          <button onClick={openQuizModal} className="hidden md:flex items-center gap-x-2 text-sm hover:text-cyan-400 transition-colors">
            <span>Let AI choose for me</span> <i className="fa-solid fa-magic" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((idx) => {
            const p = products[idx];
            const pIdx = idx < 3 ? idx : undefined;
            const border = idx === 3 ? " absolute -top-2 -right-2 bg-gradient-to-r from-amber-300 to-yellow-400 text-black text-[9px] font-bold px-4 py-px rounded-bl-2xl rounded-tr-2xl ELITE RECOMMENDED" : "";
            return (
              <div
                key={p.name}
                onClick={() => pIdx !== undefined && selectPlan(pIdx)}
                className="product-card glass rounded-3xl p-6 border border-white/10 cursor-pointer group relative"
              >
                {border && <span className={border}>ELITE RECOMMENDED</span>}
                <div className={`h-48 rounded-2xl bg-gradient-to-br ${idx===0?"from-cyan-400/20":idx===1?"from-violet-400/20":idx===2?"from-emerald-400/20":"from-amber-400/20 via-violet-400/10"} to-transparent flex items-center justify-center mb-6 relative overflow-hidden`}>
                  <div className="text-center">
                    <div className="text-7xl opacity-80">
                      {idx===0?"🧠":idx===1?"⚡":idx===2?"🌙":"✧"}
                    </div>
                    <div className="mt-2 text-xs font-mono tracking-[1px] text-zinc-300">
                      {idx===0?"NEXUS PRIME":idx===1?"APEX VITAL":idx===2?"CIRCADIAN FORGE":"QUANTUM EDGE"}
                    </div>
                  </div>
                  {idx < 3 && <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/10 text-[10px]">
                    {idx===0?"BEST FOR FOCUS":idx===1?"BEST FOR RECOVERY":"BEST FOR SLEEP"}
                  </div>}
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-2xl">{p.name}</div>
                    <div className="text-sm text-zinc-400">{p.tag}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xl">{p.price}</div>
                    <div className="text-[10px] text-zinc-500">/month</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          RESULTS
          ══════════════════════════════════════════ */}
      <section id="results" className="max-w-screen-2xl mx-auto px-8 py-16 border-t border-white/10">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-semibold tracking-tighter">Real humans.<br />Real data. Real results.</h2>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-5 glass rounded-3xl p-9 flex flex-col">
            <div>
              <div className="text-xs tracking-widest">AVERAGE 30-DAY RESULTS</div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[[31,"Focus"],[27,"Recovery"],[19,"Sleep"]].map(([target,label]) => (
                  <div key={label}>
                    <CountUp target={target} />
                    <div className="text-xs mt-1">↑ {label} Score</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto pt-8 border-t border-white/10 text-xs text-zinc-400 flex items-center gap-2">
              <i className="fa-solid fa-globe" />
              <span>Based on 12,847 anonymized user datasets • Jan 2026</span>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="glass rounded-3xl p-8 h-full">
              <div className="flex items-center justify-between mb-5">
                <div className="text-xs tracking-widest">TRANSFORMATIONS</div>
                <div className="flex gap-1">
                  <button onClick={() => setTestimonialIdx((i) => i-1)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5">
                    <i className="fa-solid fa-chevron-left text-xs" />
                  </button>
                  <button onClick={() => setTestimonialIdx((i) => i+1)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5">
                    <i className="fa-solid fa-chevron-right text-xs" />
                  </button>
                </div>
              </div>
              {(() => {
                const t = testimonials[(testimonialIdx + testimonials.length) % testimonials.length];
                return (
                  <div className="flex gap-4 min-h-[160px]">
                    <img src={t.avatar} className="w-12 h-12 rounded-2xl ring-1 ring-white/20 flex-shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-xs text-zinc-400">{t.role}</div>
                      <div className="mt-4 text-sm leading-snug">"{t.quote}"</div>
                      <div className="mt-5 inline-flex items-center text-xs px-3 py-1 bg-emerald-400/10 text-emerald-400 rounded-2xl">
                        <i className="fa-solid fa-chart-line mr-2" /> {t.metric}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ENDORSEMENTS
          ══════════════════════════════════════════ */}
      <section className="max-w-screen-2xl mx-auto px-8 py-12 border-t border-white/10">
        <div className="text-center mb-8">
          <div className="text-xs tracking-[2px]">TRUSTED BY THE BEST IN THE WORLD</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            ["Dr. Lena Voss, MD", "Chief Neuroscientist, Stanford", '"The most sophisticated engine I\'ve seen."'],
            ["Marcus Chen",   "Founder & CEO, Apex Capital",   '"My 4pm crash is gone. I\\'m 41 at 28."'],
            ["Sofia Patel",   "Professional Triathlete",        '"Recovered 40% faster between blocks."'],
            ["Dr. Raj Patel", "Perf. Physician to 12 Fortune 100 CEOs", '"The future of precision medicine."'],
            ["+214 more",     "world-class athletes & founders", "Elite community"],
          ].map(([name, role, quote]) => (
            <div key={name} className="glass rounded-3xl p-6 flex flex-col items-center text-center">
              <div className="font-semibold text-sm">{name}</div>
              <div className="text-xs text-zinc-400">{role}</div>
              <div className="mt-3 text-[10px] italic text-zinc-300 max-w-[160px]">{quote}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING  — 3 TIERS
          ══════════════════════════════════════════ */}
      <section id="pricing" className="max-w-screen-2xl mx-auto px-8 py-16 border-t border-white-10">
        <div className="text-center mb-10">
          <div className="inline px-5 py-1 rounded-full bg-white/5 text-xs">MAY 2026 LIMITED BATCH</div>
          <h2 className="mt-4 text-5xl font-semibold tracking-tighter">Choose your protocol.</h2>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center rounded-3xl border border-white/10 p-1 text-xs">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-3xl font-medium transition-colors ${billing === "monthly" ? "bg-white text-zinc-900" : "hover:bg-white/5"}`}
            >Monthly</button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-5 py-2 rounded-3xl font-medium transition-colors ${billing === "annual" ? "bg-white text-zinc-900" : "hover:bg-white/5"}`}
            >Annual <span className="text-emerald-400">(Save 20%)</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { name: "Nexus Prime",    desc: "Focus & Mental Performance",    idx: 0, featured: false },
            { name: "Quantum Edge",   desc: "Complete Peak Performance",    idx: 1, featured: true  },
            { name: "Apex Vital",     desc: "Physical Performance + Recovery", idx: 2, featured: false },
          ].map((tier) => {
            const planKey = (tier.name === "Nexus Prime"   ? "nexus_prime"
                           : tier.name === "Apex Vital"    ? "apex_vital"
                           : "circadian_forge") as keyof typeof pricesByIdx;
            const price  = pricesByIdx[planKey]?.[billing] ?? 89;
            return (
              <div
                key={tier.name}
                className={`glass rounded-3xl p-8 flex flex-col ${tier.featured ? "border-2 border-cyan-400 relative premium-shadow" : "border border-white/10"}`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-6 py-px text-xs bg-cyan-400 text-black font-bold rounded-full">
                    AI RECOMMENDED FOR 78% OF USERS
                  </div>
                )}
                <div>
                  <div className="font-semibold text-2xl">{tier.name}</div>
                  <div className="text-sm text-zinc-400 mt-1">{tier.desc}</div>
                </div>
                <div className="my-8">
                  <span className="text-6xl font-semibold tabular-nums">{price}</span>
                  <span className="text-xl text-zinc-400">/mo</span>
                </div>
                <ul className="space-y-3 text-sm flex-1">
                  {[
                    "Neurotransmitter mapping",
                    "Monthly AI adjustment",
                    "Core nootropic stack",
                    "Priority biomarker testing",
                    "Private Slack w/ performance doctor",
                  ]
                    .slice(0, tier.featured ? 5 : tier.name === "Apex Vital" ? 3 : 3)
                    .map((item) => (
                      <li key={item} className="flex gap-x-3">
                        <i className="fa-solid fa-check text-emerald-400 mt-1" />
                        <span>{item}</span>
                      </li>
                    ))}
                </ul>
                <button
                  onClick={() => selectPlan(tier.idx)}
                  disabled={checkoutState !== "idle"}
                  className={`mt-8 w-full py-3.5 rounded-3xl font-medium transition-all ${
                    tier.featured
                      ? "bg-gradient-to-r from-cyan-400 to-violet-500 text-white font-semibold"
                      : "border border-white/20 hover:bg-white/5"
                  } ${checkoutState !== "idle" ? "opacity-50 cursor-wait" : ""}`}
                >
                  {checkoutState !== "idle" ? "Redirecting…" : "Start 30-day protocol"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8 text-xs text-zinc-400">
          30-day money-back guarantee • Cancel anytime • Ships same day
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
          ══════════════════════════════════════════ */}
      <div className="max-w-screen-2xl mx-auto px-8 pb-16">
        <div className="glass rounded-3xl p-9 md:p-12 border border-white/10 bg-gradient-to-br from-zinc-900 to-black flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="text-xs tracking-[1.5px] text-rose-400">MAY 2026 BATCH CLOSING SOON</div>
            <div className="text-4xl font-semibold tracking-tighter mt-3">
              Only <span id="batch-count">1,847</span> protocols remaining.
            </div>
            <div className="mt-2 text-sm text-zinc-400">Next production run begins July 2026.</div>
          </div>
          <div>
            <button
              onClick={openQuizModal}
              className="px-10 py-4 text-lg rounded-3xl bg-white text-zinc-950 font-semibold flex items-center gap-x-3 hover:bg-zinc-100 active:scale-[0.985] transition-all"
            >
              SECURE MY PROTOCOL NOW
              <i className="fa-solid fa-lock" />
            </button>
            <div className="text-center text-[10px] mt-2 text-zinc-500">Instant access • No credit card required for scan</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════ */}
      <footer className="border-t border-white/10 pt-12 pb-8 px-8 max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-y-8">
          <div>
            <div className="flex items-center gap-x-2">
              <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                <i className="fa-solid fa-atom text-xs text-white" />
              </div>
              <span className="font-semibold">VitaForge</span>
            </div>
            <div className="text-xs text-zinc-500 mt-3 max-w-[220px]">Forging the future of human performance since 2024.</div>
          </div>
          <div className="grid grid-cols-3 gap-x-12 text-sm">
            {[
              ["COMPANY",["Science","Lab Results","Careers"]],
              ["RESOURCES",["AI Protocol Guide","Performance Blog","Biomarker Glossary"]],
              ["LEGAL",["Privacy","Terms","Accessibility"]],
            ].map(([heading, links]) => (
              <div key={heading}>
                <div className="text-xs text-zinc-400 mb-2">{heading}</div>
                <div className="space-y-1 text-xs">
                  {links.map((l) => <div key={l}>{l}</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 text-center">
          <div className="text-[10px] text-zinc-500">
            © 2026 VitaForge Labs. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════
          AI QUIZ MODAL
          ══════════════════════════════════════════ */}
      {modalOpen && (
        <QuizModal
          billing={billing}
          onClose={() => setModalOpen(false)}
          onClaim={() => { setModalOpen(false); claimProtocol(); }}
        />
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────
//  Count-Up animation component
// ────────────────────────────────────────────────────────────
function CountUp({ target }: { target: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const p = Math.min(elapsed / 900, 1);
      setN(Math.round(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <div className="text-6xl font-semibold tabular-nums">{n}</div>;
}

// ────────────────────────────────────────────────────────────
//  Quiz Modal — client only
// ────────────────────────────────────────────────────────────
function QuizModal({
  billing,
  onClose,
  onClaim,
}: {
  billing: "monthly" | "annual";
  onClose: () => void;
  onClaim: () => void;
}) {
  const [step,     setStep]     = useState(1);
  const [answers,  setAnswers]  = useState<Record<number, number>>({});
  const [done,     setDone]     = useState(false);

  const totalSteps = 4;
  const progress = ((step - 1) / totalSteps) * 100;

  const selectAnswer = (q: number, opt: number) => {
    setAnswers((a) => ({ ...a, [q]: opt }));
  };

  const next = () => {
    if (step < totalSteps) setStep((s) => s + 1);
    else setDone(true);
  };

  const prev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* prevent bubble */}
      <div onClick={(e) => e.stopPropagation()} className="glass w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="font-semibold text-xl">AI Biohack Scan</div>
            <div className="text-xs text-zinc-400">4 questions • 60 seconds • Instant results</div>
          </div>
          <button onClick={onClose} className="text-xl text-zinc-400 hover:text-white" aria-label="Close">
            ×
          </button>
        </div>

        <div className="p-8">
          {!done ? (
            <>
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-xs mb-1.5">
                  <span>Step {step}/{totalSteps}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded">
                  <div
                    className="h-1 bg-gradient-to-r from-cyan-400 to-violet-500 rounded transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              {(() => {
                const questions = [
                  "What is your primary performance goal right now?",
                  "How would you describe your current energy pattern?",
                  "How many hours of quality sleep do you get on average?",
                  "What is your biggest performance bottleneck?",
                ];
                const options = [
                  ["Explosive mental focus & clarity", "Sustained physical energy & faster recovery", "Deep, restorative sleep & hormone balance", "Complete optimization across all areas"],
                  ["Strong mornings, sharp decline after 2pm", "Consistent energy all day but poor recovery", "Difficulty falling or staying asleep", "I feel great most of the time"],
                  ["Less than 6 hours", "6–7 hours", "7–8 hours, but not restorative", "8+ hours of deep sleep"],
                  ["Afternoon brain fog or decision fatigue", "Slow physical recovery after training", "Poor stress resilience or anxiety", "I want to push to the absolute next level"],
                ];
                return (
                  <>
                    <div className="font-medium mb-4">{questions[step - 1]}</div>
                    <div className="space-y-2">
                      {options[step - 1].map((opt, i) => (
                        <button
                          key={opt}
                          onClick={() => selectAnswer(step, i)}
                          className={`quiz-option w-full text-left px-5 py-4 rounded-2xl border transition-colors ${
                            answers[step] === i
                              ? "border-cyan-400 bg-white/5"
                              : "border-white/10 hover:bg-white/5"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mb-6">
                <i className="fa-solid fa-magic text-4xl text-white" />
              </div>
              <div className="font-semibold text-2xl">Analysis Complete</div>
              <div className="text-sm text-zinc-400 mt-1">Your personalized protocol is ready.</div>
              <div className="mt-8 glass rounded-2xl border border-white/10 p-5 text-left">
                <div className="flex items-center gap-x-4">
                  <div>
                    <div className="font-bold text-2xl">Quantum Edge</div>
                    <div className="text-xs text-amber-400">98% match — Elite Choice</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xs">Recommended</div>
                    <div className="font-mono text-xl">
                      ${billing === "annual" ? "175" : "219"}/mo
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs leading-snug text-zinc-300">
                  Full-spectrum protocol. You are an ideal candidate for complete optimization across cognitive, physical, and longevity pathways.
                </div>
              </div>
              <button
                onClick={onClaim}
                className="mt-6 w-full py-4 rounded-3xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-semibold hover:brightness-110 transition-all"
              >
                ACTIVATE MY PROTOCOL — 20% OFF FIRST MONTH
              </button>
            </div>
          )}
        </div>

        {!done && (
          <div className="px-8 pb-8 flex justify-between items-center border-t border-white/10 pt-4">
            <button onClick={prev} className={`px-5 py-2 text-sm ${step === 1 ? "invisible" : ""}`}>
              ← Back
            </button>
            <button
              onClick={next}
              className="px-8 py-2.5 text-sm rounded-3xl bg-white text-zinc-950 font-medium"
            >
              {step < totalSteps ? "Continue →" : "Analyze My Data →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
