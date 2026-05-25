import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/popup.css';
import type { ExtensionSettings } from '../shared/types';

function Options() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void chrome.runtime.sendMessage({ type: 'VF_GET_SETTINGS' }).then((response) => setSettings(response.settings));
  }, []);

  async function save() {
    const response = await chrome.runtime.sendMessage({ type: 'VF_SAVE_SETTINGS', settings });
    setSettings(response.settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  }

  if (!settings) return <main className="min-h-screen bg-zinc-950 p-8 text-white">Loading...</main>;

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white">
      <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-forge">
        <h1 className="text-3xl font-semibold tracking-tight">VitaForge Agentic Lifecycle Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">No API keys are stored in source. Use a local or backend proxy for LLM and OTLP export routing.</p>

        <div className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm">LLM proxy URL<input className="rounded-2xl border border-white/10 bg-black/30 p-3" value={settings.llmProxyUrl ?? ''} onChange={(event) => setSettings({ ...settings, llmProxyUrl: event.target.value })} placeholder="http://localhost:8787/design-generate" /></label>
          <label className="grid gap-2 text-sm">OTLP/event proxy endpoint<input className="rounded-2xl border border-white/10 bg-black/30 p-3" value={settings.otlpEndpoint ?? ''} onChange={(event) => setSettings({ ...settings, otlpEndpoint: event.target.value })} placeholder="http://localhost:4318/v1/events" /></label>
          <label className="grid gap-2 text-sm">Max variants per prompt<input type="number" min="1" max="8" className="rounded-2xl border border-white/10 bg-black/30 p-3" value={settings.maxVariantsPerPrompt} onChange={(event) => setSettings({ ...settings, maxVariantsPerPrompt: Number(event.target.value) })} /></label>

          {(['stagingEnabled', 'telemetryEnabled', 'designLoopEnabled'] as const).map((key) => (
            <label key={key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
              <input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => setSettings({ ...settings, [key]: event.target.checked })} />
              <span>{key}</span>
            </label>
          ))}
        </div>

        <button className="mt-8 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 font-bold" onClick={save}>Save settings</button>
        {saved && <span className="ml-4 text-sm text-emerald-300">Saved</span>}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Options />);
