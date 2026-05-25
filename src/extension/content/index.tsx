import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import '../styles/content.css';
import type { ComponentVariant, InjectionCommand, OutcomeEvent } from '../shared/types';
import { emitOutcome, emitTelemetry, measure } from '../shared/telemetry';
import { componentRegistry } from './registry';

let root: Root | null = null;
let container: HTMLElement | null = null;

function getContainer(selector?: string): HTMLElement {
  if (selector) {
    const target = document.querySelector(selector);
    if (target instanceof HTMLElement) return target;
  }

  if (!container) {
    container = document.createElement('div');
    container.id = 'vitaforge-agent-root';
    container.dataset.vfRoot = 'true';
    document.documentElement.appendChild(container);
  }

  return container;
}

function recordView(variant: ComponentVariant): void {
  const outcome: OutcomeEvent = {
    variantId: variant.id,
    componentId: variant.componentId,
    outcome: 'view',
    url: location.href
  };
  void emitOutcome(outcome);
}

function applyVariant(command: InjectionCommand): void {
  measure('vf.dom.inject', { componentId: command.variant.componentId, variantId: command.variant.id }, () => {
    const target = getContainer(command.selector);
    if (!root || target !== container) root = createRoot(target);
    const Component = componentRegistry[command.variant.componentId];
    root.render(
      <Component
        variant={command.variant}
        onOutcome={(outcome) => {
          void emitOutcome({
            variantId: command.variant.id,
            componentId: command.variant.componentId,
            outcome,
            url: location.href
          });
          if (outcome === 'dismiss') {
            root?.unmount();
            root = null;
          }
        }}
      />
    );
    recordView(command.variant);
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'VF_APPLY_VARIANT') return false;
  try {
    applyVariant(message as InjectionCommand);
    sendResponse({ ok: true });
  } catch (error) {
    void emitTelemetry({
      name: 'vf.dom.inject.error',
      timestamp: Date.now(),
      attributes: { error: error instanceof Error ? error.message : String(error), url: location.href }
    });
    sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
  return true;
});

void emitTelemetry({
  name: 'vf.content.ready',
  timestamp: Date.now(),
  attributes: { url: location.href, title: document.title }
});
