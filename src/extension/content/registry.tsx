import React, { useEffect, useRef } from 'react';
import type { ComponentVariant, RegistryComponentId } from '../shared/types';
import { sanitizeVariantHtml } from './sanitize';

interface RegistryRenderProps {
  variant: ComponentVariant;
  onOutcome: (outcome: 'click' | 'dismiss' | 'conversion') => void;
}

function VariantShell({ variant, onOutcome }: RegistryRenderProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = mountRef.current;
    if (!node) return;
    node.replaceChildren(sanitizeVariantHtml(variant.html));
  }, [variant.html]);

  return (
    <div className="vf-shell pointer-events-auto">
      {variant.css && <style>{variant.css}</style>}
      <div
        ref={mountRef}
        className="vf-generated"
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('[data-vf-outcome="conversion"]')) onOutcome('conversion');
          else onOutcome('click');
        }}
      />
      <button className="vf-dismiss" aria-label="Dismiss VitaForge overlay" onClick={() => onOutcome('dismiss')}>
        ×
      </button>
    </div>
  );
}

function FloatingScan(props: RegistryRenderProps) {
  return <div className="fixed bottom-6 right-6 z-[2147483647]"><VariantShell {...props} /></div>;
}

function InlineBanner(props: RegistryRenderProps) {
  return <div className="vf-inline-banner my-4"><VariantShell {...props} /></div>;
}

function ProtocolCard(props: RegistryRenderProps) {
  return <div className="vf-protocol-card max-w-md"><VariantShell {...props} /></div>;
}

export const componentRegistry: Record<RegistryComponentId, React.FC<RegistryRenderProps>> = {
  'vf-floating-scan': FloatingScan,
  'vf-protocol-card': ProtocolCard,
  'vf-inline-banner': InlineBanner
};
