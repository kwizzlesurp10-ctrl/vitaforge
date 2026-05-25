import type { ComponentVariant, ExtensionSettings, OutcomeEvent } from './types';

const DEFAULT_SETTINGS: ExtensionSettings = {
  stagingEnabled: true,
  telemetryEnabled: true,
  designLoopEnabled: true,
  maxVariantsPerPrompt: 3
};

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...(result.settings ?? {}) };
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const next = { ...(await getSettings()), ...settings };
  await chrome.storage.local.set({ settings: next });
  return next;
}

export async function listVariants(): Promise<ComponentVariant[]> {
  const result = await chrome.storage.local.get('variants');
  return result.variants ?? [];
}

export async function saveVariant(variant: ComponentVariant): Promise<void> {
  const variants = await listVariants();
  const next = [variant, ...variants.filter((item) => item.id !== variant.id)].slice(0, 250);
  await chrome.storage.local.set({ variants: next });
}

export async function recordOutcome(outcome: OutcomeEvent): Promise<void> {
  const result = await chrome.storage.local.get('outcomes');
  const outcomes: OutcomeEvent[] = result.outcomes ?? [];
  await chrome.storage.local.set({ outcomes: [outcome, ...outcomes].slice(0, 1000) });
}

export async function listOutcomes(): Promise<OutcomeEvent[]> {
  const result = await chrome.storage.local.get('outcomes');
  return result.outcomes ?? [];
}
