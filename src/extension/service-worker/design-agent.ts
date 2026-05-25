import type { ComponentVariant, DesignPromptRequest, OodaLoopResult } from '../shared/types';
import { getSettings, listOutcomes, saveVariant } from '../shared/storage';

function slug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 42);
}

function fallbackVariant(request: DesignPromptRequest, index: number): ComponentVariant {
  const palette = [
    ['from-cyan-400', 'to-violet-500', 'Launch AI Scan'],
    ['from-emerald-400', 'to-cyan-400', 'Optimize My Protocol'],
    ['from-fuchsia-400', 'to-amber-300', 'Forge Peak Mode']
  ][index % 3];

  return {
    id: `vf-${request.componentId}-${slug(request.prompt)}-${Date.now()}-${index}`,
    componentId: request.componentId,
    prompt: request.prompt,
    status: 'staging',
    weight: 1,
    createdAt: new Date().toISOString(),
    html: `<section class="vf-card" data-vf-generated="true"><div class="vf-eyebrow">VitaForge AI</div><h3>${palette[2]}</h3><p>${request.prompt}</p><button data-vf-outcome="conversion">Activate</button></section>`,
    css: `.vf-card{font-family:Inter,system-ui,sans-serif;max-width:360px;padding:18px;border-radius:24px;background:linear-gradient(135deg,rgba(8,10,18,.94),rgba(24,24,38,.92));color:white;border:1px solid rgba(255,255,255,.14);box-shadow:0 24px 80px rgba(0,240,255,.18);z-index:2147483647}.vf-card h3{margin:6px 0;font-size:22px}.vf-card p{font-size:13px;color:rgba(255,255,255,.74)}.vf-card button{margin-top:10px;border:0;border-radius:999px;padding:10px 14px;background:white;color:#09090b;font-weight:700}.vf-eyebrow{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#00f0ff}`,
    rationale: 'Local deterministic fallback generated because no LLM proxy is configured.',
    safetyNotes: ['No remote code execution.', 'HTML is constrained and rendered inside extension-owned root.']
  };
}

async function generateWithProxy(request: DesignPromptRequest): Promise<ComponentVariant[] | null> {
  const settings = await getSettings();
  if (!settings.llmProxyUrl) return null;

  const response = await fetch(settings.llmProxyUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ kind: 'vitaforge.design.generate', request })
  });

  if (!response.ok) throw new Error(`LLM proxy failed: ${response.status}`);
  const body = await response.json();
  return body.variants as ComponentVariant[];
}

export async function runDesignIteration(request: DesignPromptRequest): Promise<ComponentVariant[]> {
  const settings = await getSettings();
  const fromProxy = await generateWithProxy(request).catch(() => null);
  const variants = fromProxy?.length
    ? fromProxy
    : Array.from({ length: settings.maxVariantsPerPrompt }, (_, index) => fallbackVariant(request, index));

  for (const variant of variants) await saveVariant(variant);
  return variants;
}

export async function observeOrientDecideAct(): Promise<OodaLoopResult> {
  const outcomes = await listOutcomes();
  const conversions = outcomes.filter((item) => item.outcome === 'conversion').length;
  const views = outcomes.filter((item) => item.outcome === 'view').length || 1;
  const rate = conversions / views;

  if (views < 20) {
    return {
      observation: `Only ${views} views observed.`,
      orientation: 'Insufficient sample size for safe promotion.',
      decision: 'Continue collecting staging telemetry.',
      action: 'hold',
      confidence: 0.42
    };
  }

  return {
    observation: `Current conversion rate: ${(rate * 100).toFixed(2)}%.`,
    orientation: rate < 0.08 ? 'Performance below threshold.' : 'Performance acceptable.',
    decision: rate < 0.08 ? 'Generate a stronger variant.' : 'Hold or promote the best performer.',
    action: rate < 0.08 ? 'generate_variant' : 'promote_variant',
    confidence: Math.min(0.95, 0.5 + views / 500)
  };
}
