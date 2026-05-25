import type { DesignPromptRequest, TelemetryEvent } from '../shared/types';
import { getSettings, listVariants, saveSettings } from '../shared/storage';
import { observeOrientDecideAct, runDesignIteration } from './design-agent';

async function ensureOffscreenDocument(): Promise<void> {
  if (!chrome.offscreen?.createDocument) return;
  const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (existing.length > 0) return;

  await chrome.offscreen.createDocument({
    url: 'offscreen/index.html',
    reasons: ['DOM_SCRAPING'],
    justification: 'Render and sanitize generated DOM variants outside the service worker.'
  });
}

async function broadcastVariant(request: DesignPromptRequest): Promise<void> {
  const variants = await runDesignIteration(request);
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) return;

  await chrome.tabs.sendMessage(activeTab.id, {
    type: 'VF_APPLY_VARIANT',
    variant: variants[0],
    selector: request.selector
  });
}

async function exportTelemetry(event: TelemetryEvent): Promise<void> {
  const settings = await getSettings();
  if (!settings.telemetryEnabled || !settings.otlpEndpoint) return;

  await fetch(settings.otlpEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ resource: 'vitaforge-extension', event })
  }).catch(() => undefined);
}

chrome.runtime.onInstalled.addListener(() => {
  void saveSettings({ stagingEnabled: true, telemetryEnabled: true, designLoopEnabled: true });
  chrome.alarms.create('vf-ooda-loop', { periodInMinutes: 30 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'vf-ooda-loop') return;
  void observeOrientDecideAct().then(async (result) => {
    if (result.action !== 'generate_variant') return;
    const settings = await getSettings();
    if (!settings.designLoopEnabled) return;
    await runDesignIteration({
      componentId: 'vf-floating-scan',
      prompt: `Improve extension conversion using observation: ${result.observation}. Orientation: ${result.orientation}`
    });
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    switch (message?.type) {
      case 'VF_GENERATE_VARIANTS': {
        await ensureOffscreenDocument();
        const variants = await runDesignIteration(message.request as DesignPromptRequest);
        sendResponse({ ok: true, variants });
        break;
      }
      case 'VF_APPLY_DESIGN_PROMPT': {
        await ensureOffscreenDocument();
        await broadcastVariant(message.request as DesignPromptRequest);
        sendResponse({ ok: true });
        break;
      }
      case 'VF_LIST_VARIANTS': {
        sendResponse({ ok: true, variants: await listVariants() });
        break;
      }
      case 'VF_GET_SETTINGS': {
        sendResponse({ ok: true, settings: await getSettings() });
        break;
      }
      case 'VF_SAVE_SETTINGS': {
        sendResponse({ ok: true, settings: await saveSettings(message.settings ?? {}) });
        break;
      }
      case 'VF_TELEMETRY_EVENT': {
        await exportTelemetry(message.event as TelemetryEvent);
        sendResponse({ ok: true });
        break;
      }
      case 'VF_OODA_STATUS': {
        sendResponse({ ok: true, result: await observeOrientDecideAct() });
        break;
      }
      default:
        sendResponse({ ok: false, error: 'Unknown message type' });
    }
  })();
  return true;
});
