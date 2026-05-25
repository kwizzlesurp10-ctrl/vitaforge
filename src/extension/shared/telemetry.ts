import type { OutcomeEvent, TelemetryEvent } from './types';
import { getSettings, recordOutcome } from './storage';

export async function emitTelemetry(event: TelemetryEvent): Promise<void> {
  const settings = await getSettings();
  if (!settings.telemetryEnabled) return;

  await chrome.runtime.sendMessage({
    type: 'VF_TELEMETRY_EVENT',
    event
  });
}

export async function emitOutcome(outcome: OutcomeEvent): Promise<void> {
  await recordOutcome(outcome);
  await emitTelemetry({
    name: 'vf.variant.outcome',
    timestamp: Date.now(),
    attributes: {
      variantId: outcome.variantId,
      componentId: outcome.componentId,
      outcome: outcome.outcome,
      value: outcome.value,
      url: outcome.url
    }
  });
}

export function measure<T>(name: string, attributes: Record<string, string | number | boolean>, fn: () => T): T {
  const start = performance.now();
  try {
    const result = fn();
    void emitTelemetry({
      name,
      timestamp: Date.now(),
      attributes: { ...attributes, ok: true, latencyMs: Math.round(performance.now() - start) }
    });
    return result;
  } catch (error) {
    void emitTelemetry({
      name,
      timestamp: Date.now(),
      attributes: {
        ...attributes,
        ok: false,
        latencyMs: Math.round(performance.now() - start),
        error: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }
}
