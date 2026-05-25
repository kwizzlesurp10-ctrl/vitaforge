import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/popup.css';
import type { DesignPromptRequest, OodaLoopResult } from '../shared/types';

function App() {
  const [prompt, setPrompt] = useState('Create a high-converting floating AI scan CTA for VitaForge visitors.');
  const [status, setStatus] = useState('Ready');
  const [ooda, setOoda] = useState<OodaLoopResult | null>(null);

  async function applyPrompt() {
    setStatus('Generating and injecting staging variant...');
    const request: DesignPromptRequest = { componentId: 'vf-floating-scan', prompt };
    const response = await chrome.runtime.sendMessage({ type: 'VF_APPLY_DESIGN_PROMPT', request });
    setStatus(response?.ok ? 'Variant injected. Outcomes are now being measured.' : response?.error ?? 'Failed');
  }

  async function loadOoda() {
    const response = await chrome.runtime.sendMessage({ type: 'VF_OODA_STATUS' });
    setOoda(response.result);
  }

  return (
    <main className="w-[380px] bg-zinc-950 text-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">VitaForge Agent</h1>
          <p className="text-xs text-zinc-400">Design → QA → Telemetry → Optimize</p>
        </div>
        <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-300">MV3</span>
      </div>

      <label className="mt-5 block text-xs font-medium text-zinc-300">Design prompt</label>
      <textarea className="mt-2 h-28 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm outline-none focus:border-cyan-400" value={prompt} onChange={(event) => setPrompt(event.target.value)} />

      <button className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-3 text-sm font-bold text-white" onClick={applyPrompt}>Generate + Inject Variant</button>
      <button className="mt-2 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm" onClick={loadOoda}>Read OODA Status</button>

      <p className="mt-4 rounded-2xl bg-white/5 p-3 text-xs text-zinc-300">{status}</p>
      {ooda && <pre className="mt-3 max-h-40 overflow-auto rounded-2xl bg-black/40 p-3 text-[10px] text-emerald-300">{JSON.stringify(ooda, null, 2)}</pre>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
